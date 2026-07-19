// ============================================================================
// Embed Chat API — Public-facing endpoint for widget conversations
// NO user auth required. Authenticates via widget API key (wgt_xxxx).
// Validates origin domain, enforces rate limits, deducts tokens from deployer.
//
// Prompt composition + provider dispatch now live in lib/agent-runtime (F1):
// the compiled agent prompt, BYOK→managed→sovereign-gateway inference, web RAG
// v2 (grounded citations), memory, and AGL-001 lineage are all shared with the
// streaming route. This route owns only the HTTP concerns (CORS, rate limit,
// session persistence, billing).
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
    getCompiledCorePrompt,
    composeAgentPrompt,
    resolveInferencePlan,
    callInferenceBlocking,
    InferenceError,
    resolveWidgetGateway,
    retrieveContext,
    resolveIdentity,
    recallMemory,
    writeMemory,
    emitLineage,
    type RagResult,
    type ResolvedIdentity,
} from "@/lib/agent-runtime";

export const dynamic = "force-dynamic";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── CORS Headers ───────────────────────────────────────────────────────────

function corsHeaders(origin: string | null, allowedDomains: string[]): Record<string, string> {
    const headers: Record<string, string> = {
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Widget-Key",
        "Access-Control-Max-Age": "86400",
    };

    // If no domains restricted, allow all
    if (!allowedDomains || allowedDomains.length === 0) {
        headers["Access-Control-Allow-Origin"] = origin || "*";
    } else if (origin) {
        try {
            const originHost = new URL(origin).hostname;
            const isAllowed = allowedDomains.some(d => {
                const clean = d.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
                return originHost === clean || originHost.endsWith("." + clean);
            });
            if (isAllowed) {
                headers["Access-Control-Allow-Origin"] = origin;
            }
        } catch {
            // Invalid origin — don't set CORS
        }
    }

    return headers;
}

// ─── Rate Limiter (in-memory, per-process) ──────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, rpm: number): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(key, { count: 1, resetAt: now + 60_000 });
        return true;
    }

    if (entry.count >= rpm) return false;
    entry.count++;
    return true;
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap) {
        if (now > entry.resetAt) rateLimitMap.delete(key);
    }
}, 300_000);

// ─── OPTIONS (CORS preflight) ───────────────────────────────────────────────

export async function OPTIONS(request: NextRequest) {
    const origin = request.headers.get("origin");
    return new NextResponse(null, {
        status: 204,
        headers: corsHeaders(origin, []),
    });
}

// ─── POST: Send a message ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const apiKey = request.headers.get("x-widget-key");
        if (!apiKey || !apiKey.startsWith("wgt_")) {
            return NextResponse.json(
                { error: "Missing or invalid widget key" },
                { status: 401, headers: corsHeaders(origin, []) }
            );
        }

        // ─── Resolve widget ─────────────────────────────────────────────
        const { data: widget, error: wErr } = await supabase
            .from("widget_deployments")
            .select(`
                *,
                agent_templates:template_id (
                    id, name, emoji, core_prompt, personality_config
                )
            `)
            .eq("api_key", apiKey)
            .eq("is_active", true)
            .single();

        if (wErr || !widget) {
            return NextResponse.json(
                { error: "Widget not found or inactive" },
                { status: 404, headers: corsHeaders(origin, []) }
            );
        }

        // ─── Domain validation ──────────────────────────────────────────
        const cors = corsHeaders(origin, widget.allowed_domains ?? []);
        if (
            widget.allowed_domains?.length > 0 &&
            !cors["Access-Control-Allow-Origin"]
        ) {
            return NextResponse.json(
                { error: "Domain not authorized" },
                { status: 403, headers: cors }
            );
        }

        // ─── Parse body ─────────────────────────────────────────────────
        const body = await request.json();
        const {
            message,
            session_id,
            visitor_id,
            visitor_meta,
            gate_data,
        } = body;

        if (!message || typeof message !== "string" || message.trim().length === 0) {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400, headers: cors }
            );
        }

        if (!visitor_id) {
            return NextResponse.json(
                { error: "visitor_id is required" },
                { status: 400, headers: cors }
            );
        }

        // ─── Rate limit ─────────────────────────────────────────────────
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
            || request.headers.get("x-real-ip")
            || "unknown";

        const rlKey = `${widget.id}:${ip}`;
        if (!checkRateLimit(rlKey, widget.rate_limit_rpm)) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Please wait." },
                { status: 429, headers: cors }
            );
        }

        // ─── Gated mode check ───────────────────────────────────────────
        if (widget.persistence_mode === "gated" && !session_id) {
            const gateConfig = widget.gate_config || {};
            if (gateConfig.require_email && !gate_data?.email) {
                return NextResponse.json(
                    { error: "gate_required", gate_config: gateConfig },
                    { status: 403, headers: cors }
                );
            }
        }

        // ─── Session management ─────────────────────────────────────────
        let session: any = null;

        if (widget.persistence_mode !== "ephemeral" && session_id) {
            const { data } = await supabase
                .from("widget_sessions")
                .select("*")
                .eq("id", session_id)
                .eq("widget_id", widget.id)
                .eq("status", "active")
                .single();
            session = data;
        }

        if (!session && widget.persistence_mode !== "ephemeral") {
            const query = supabase
                .from("widget_sessions")
                .select("*")
                .eq("widget_id", widget.id)
                .eq("status", "active")
                .order("updated_at", { ascending: false })
                .limit(1);

            if (widget.persistence_mode === "ip_persistent") {
                query.eq("visitor_ip", ip);
            } else {
                query.eq("visitor_id", visitor_id);
            }

            const { data } = await query.single();
            session = data;
        }

        // Create new session if needed
        if (!session) {
            const sessionInsert: Record<string, any> = {
                widget_id: widget.id,
                visitor_id,
                visitor_ip: ip,
                visitor_meta: visitor_meta || {},
                messages: [],
            };

            if (gate_data) {
                sessionInsert.visitor_name = gate_data.name || null;
                sessionInsert.visitor_email = gate_data.email || null;
                sessionInsert.visitor_phone = gate_data.phone || null;
                sessionInsert.visitor_custom = gate_data.custom || {};
            }

            const { data: newSession, error: sErr } = await supabase
                .from("widget_sessions")
                .insert(sessionInsert)
                .select()
                .single();

            if (sErr) {
                console.error("[embed/chat] Session create error:", sErr.message);
                return NextResponse.json(
                    { error: "Failed to create session" },
                    { status: 500, headers: cors }
                );
            }
            session = newSession;
        }

        // ─── Conversation context ───────────────────────────────────────
        const agent = widget.agent_templates;
        const history: any[] = session.messages || [];
        const userMessage = message.trim();

        // ── Identity resolution (best-effort; skipped on ephemeral/absent tables) ──
        let identity: ResolvedIdentity | null = null;
        if (widget.persistence_mode !== "ephemeral") {
            identity = await resolveIdentity({
                supabase,
                widget,
                visitorId: visitor_id,
                session: { id: session.id },
                gateData: gate_data || null,
            });
        }

        // ── Per-widget embedder gateway (resolved from THIS widget's provider ──
        // ── config; NO global env, NO hardcoded host/key/model). Null → OFF.   ──
        const gateway = await resolveWidgetGateway({ supabase, widget });

        // ── Web RAG v2 retrieval (honest degrade; never fake) ──
        const rag: RagResult = await retrieveContext({
            supabase,
            gateway,
            userId: widget.user_id,
            deploymentId: widget.id,
            query: userMessage,
        });

        // ── Memory recall ──
        let memoryContext: string | null = null;
        if (identity) {
            const recalled = await recallMemory({
                supabase,
                gateway,
                userId: widget.user_id,
                endUserId: identity.endUserId,
                deploymentId: widget.id,
                query: userMessage,
            });
            memoryContext = recalled.context;
        }

        // ── Compiled prompt (fixes the bare-core_prompt bug) + composition ──
        const compiledCorePrompt = await getCompiledCorePrompt({
            supabase,
            userId: widget.user_id,
            templateId: widget.template_id,
            fallbackCorePrompt: agent?.core_prompt || "",
        });

        const { messages } = composeAgentPrompt({
            widget,
            compiledCorePrompt,
            history,
            userMessage,
            rag,
            memoryContext,
        });

        // ─── Inference (BYOK → managed → sovereign gateway) ─────────────
        let plan;
        try {
            plan = await resolveInferencePlan({ supabase, widget });
        } catch (err: any) {
            // Fail loud + honest: no model configured (422) or sovereign path
            // selected but unconfigured (503). Never a silent default model.
            const status = err instanceof InferenceError ? err.status : 503;
            const code = err instanceof InferenceError ? err.code : "inference_misconfigured";
            console.warn("[embed/chat] inference not resolvable:", err?.message);
            return NextResponse.json(
                { error: code, message: err?.message || "Inference misconfigured" },
                { status, headers: cors }
            );
        }

        let result;
        try {
            result = await callInferenceBlocking(plan, messages);
        } catch (err: any) {
            const status = err instanceof InferenceError ? err.status : 502;
            const msg = err instanceof InferenceError && err.status === 503
                ? "No AI providers configured"
                : "All AI providers failed";
            console.warn("[embed/chat] inference failed:", err?.message);
            return NextResponse.json({ error: msg }, { status, headers: cors });
        }

        const aiResponse = result.content;
        const tokensUsed = result.totalTokens;

        // ─── Update session ─────────────────────────────────────────────
        const updatedMessages = [
            ...history,
            { role: "user", content: userMessage, ts: Date.now() },
            { role: "assistant", content: aiResponse, ts: Date.now() },
        ];

        // Cap stored messages
        const cappedMessages = updatedMessages.slice(-(widget.max_history * 2));

        if (widget.persistence_mode !== "ephemeral") {
            await supabase
                .from("widget_sessions")
                .update({
                    messages: cappedMessages,
                    message_count: session.message_count + 2,
                    token_count: session.token_count + tokensUsed,
                    last_message_at: new Date().toISOString(),
                })
                .eq("id", session.id);
        }

        // ─── Update widget counters ─────────────────────────────────────
        try {
            await supabase
                .from("widget_deployments")
                .update({
                    total_messages: widget.total_messages + 2,
                    total_tokens_used: widget.total_tokens_used + tokensUsed,
                    total_conversations: widget.total_conversations + (session.message_count === 0 ? 1 : 0),
                })
                .eq("id", widget.id);
        } catch {
            console.warn("[embed/chat] Counter update failed for widget:", widget.id);
        }

        // ─── Deduct tokens from deployer ────────────────────────────────
        try {
            await supabase.rpc("deduct_tokens" as any, {
                p_user_id: widget.user_id,
                p_amount: tokensUsed,
                p_reason: "widget_chat",
            });
        } catch {
            console.warn("[embed/chat] Token deduction failed for user:", widget.user_id);
        }

        // ─── AGL-001 local lineage (best-effort; no anchoring) ──────────
        await emitLineage({
            supabase,
            userId: widget.user_id,
            deploymentId: widget.id,
            conversationId: identity?.conversationId ?? null,
            endUserId: identity?.endUserId ?? null,
            input: userMessage,
            output: aiResponse,
            model: result.model,
            source: result.source,
        });

        // ─── Memory write (best-effort, after response is computed) ─────
        if (identity) {
            await writeMemory({
                supabase,
                gateway,
                userId: widget.user_id,
                endUserId: identity.endUserId,
                deploymentId: widget.id,
                conversationId: identity.conversationId,
                userMessage,
            });
        }

        return NextResponse.json(
            {
                response: aiResponse,
                session_id: session.id,
                tokens_used: tokensUsed,
                citations: rag.citations,
                rag_status: rag.status,
            },
            { headers: cors }
        );
    } catch (err: any) {
        console.error("[embed/chat] Unexpected:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500, headers: corsHeaders(origin, []) }
        );
    }
}
