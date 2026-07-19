// ============================================================================
// Embed Chat SSE Stream — Server-Sent Events streaming for widget chat
// Mirrors embed/chat/route.ts but returns a ReadableStream instead of JSON.
// Shares ALL prompt-composition + inference logic via lib/agent-runtime (F1):
// compiled prompt, BYOK→managed→sovereign-gateway dispatch, web RAG v2 grounded
// citations, memory, and AGL-001 lineage. This route owns only the SSE plumbing.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
    getCompiledCorePrompt,
    composeAgentPrompt,
    resolveInferencePlan,
    openInferenceStream,
    InferenceError,
    parseStreamChunk,
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
export const maxDuration = 60;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── CORS ───────────────────────────────────────────────────────────────────

function corsHeaders(origin: string | null, domains: string[]): Record<string, string> {
    const h: Record<string, string> = {
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Widget-Key",
        "Access-Control-Max-Age": "86400",
    };
    if (!domains || domains.length === 0) {
        h["Access-Control-Allow-Origin"] = origin || "*";
    } else if (origin) {
        try {
            const host = new URL(origin).hostname;
            const ok = domains.some(d => {
                const c = d.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
                return host === c || host.endsWith("." + c);
            });
            if (ok) h["Access-Control-Allow-Origin"] = origin;
        } catch { /* invalid origin */ }
    }
    return h;
}

// ─── Rate Limiter ───────────────────────────────────────────────────────────

const rlMap = new Map<string, { count: number; resetAt: number }>();

function checkRL(key: string, rpm: number): boolean {
    const now = Date.now();
    const e = rlMap.get(key);
    if (!e || now > e.resetAt) { rlMap.set(key, { count: 1, resetAt: now + 60_000 }); return true; }
    if (e.count >= rpm) return false;
    e.count++;
    return true;
}

export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get("origin"), []) });
}

// ─── POST: Streaming chat ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const apiKey = request.headers.get("x-widget-key");
        if (!apiKey?.startsWith("wgt_")) {
            return NextResponse.json({ error: "Invalid widget key" }, { status: 401, headers: corsHeaders(origin, []) });
        }

        // Resolve widget
        const { data: widget, error: wErr } = await supabase
            .from("widget_deployments")
            .select(`*, agent_templates:template_id (id, name, emoji, core_prompt, personality_config)`)
            .eq("api_key", apiKey)
            .eq("is_active", true)
            .single();

        if (wErr || !widget) {
            return NextResponse.json({ error: "Widget not found" }, { status: 404, headers: corsHeaders(origin, []) });
        }

        const cors = corsHeaders(origin, widget.allowed_domains ?? []);
        if (widget.allowed_domains?.length > 0 && !cors["Access-Control-Allow-Origin"]) {
            return NextResponse.json({ error: "Domain not authorized" }, { status: 403, headers: cors });
        }

        // Parse body
        const body = await request.json();
        const { message, session_id, visitor_id } = body;
        if (!message?.trim() || !visitor_id) {
            return NextResponse.json({ error: "message and visitor_id required" }, { status: 400, headers: cors });
        }

        // Rate limit
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        if (!checkRL(`${widget.id}:${ip}`, widget.rate_limit_rpm)) {
            return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: cors });
        }

        // Session lookup
        let session: any = null;
        if (widget.persistence_mode !== "ephemeral" && session_id) {
            const { data } = await supabase
                .from("widget_sessions").select("*")
                .eq("id", session_id).eq("widget_id", widget.id).eq("status", "active").single();
            session = data;
        }
        if (!session && widget.persistence_mode !== "ephemeral") {
            const lf = widget.persistence_mode === "ip_persistent" ? "visitor_ip" : "visitor_id";
            const lv = widget.persistence_mode === "ip_persistent" ? ip : visitor_id;
            const { data } = await supabase
                .from("widget_sessions").select("*")
                .eq("widget_id", widget.id).eq(lf, lv).eq("status", "active")
                .order("created_at", { ascending: false }).limit(1).single();
            session = data;
        }
        if (!session) {
            const { data } = await supabase
                .from("widget_sessions")
                .insert({ widget_id: widget.id, visitor_id, visitor_ip: ip, visitor_meta: body.visitor_meta || {}, messages: [], status: "active", message_count: 0, token_count: 0 })
                .select("*").single();
            session = data;
        }
        if (!session) {
            return NextResponse.json({ error: "Session error" }, { status: 500, headers: cors });
        }

        const agent = widget.agent_templates;
        const history: any[] = session.messages || [];
        const userMessage = message.trim();

        // ── Identity resolution (best-effort) ──
        let identity: ResolvedIdentity | null = null;
        if (widget.persistence_mode !== "ephemeral") {
            identity = await resolveIdentity({
                supabase,
                widget,
                visitorId: visitor_id,
                session: { id: session.id },
                gateData: body.gate_data || null,
            });
        }

        // ── Per-widget embedder gateway (resolved from THIS widget's provider ──
        // ── config; NO global env, NO hardcoded host/key/model). Null → OFF.   ──
        const gateway = await resolveWidgetGateway({ supabase, widget });

        // ── Web RAG v2 retrieval + memory recall ──
        const rag: RagResult = await retrieveContext({
            supabase,
            gateway,
            userId: widget.user_id,
            deploymentId: widget.id,
            query: userMessage,
        });

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

        // ── Compiled prompt + composition ──
        const compiledCorePrompt = await getCompiledCorePrompt({
            supabase,
            userId: widget.user_id,
            templateId: widget.template_id,
            fallbackCorePrompt: agent?.core_prompt || "",
        });

        const { messages: msgs } = composeAgentPrompt({
            widget,
            compiledCorePrompt,
            history,
            userMessage,
            rag,
            memoryContext,
        });

        // ── Resolve + open the streaming upstream ──
        let plan;
        try {
            plan = await resolveInferencePlan({ supabase, widget });
        } catch (err: any) {
            // Fail loud + honest: no model configured (422) or sovereign path
            // selected but unconfigured (503). Never a silent default model.
            const status = err instanceof InferenceError ? err.status : 503;
            const code = err instanceof InferenceError ? err.code : "inference_misconfigured";
            return NextResponse.json({ error: code, message: err?.message || "Inference misconfigured" }, { status, headers: cors });
        }

        let opened;
        try {
            opened = await openInferenceStream(plan, msgs);
        } catch (err: any) {
            const status = err instanceof InferenceError ? err.status : 502;
            return NextResponse.json({ error: err?.message || "Provider error" }, { status, headers: cors });
        }

        const { response: upRes, candidate } = opened;
        const providerName = candidate.provider;

        // Create SSE response stream
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        let fullContent = "";

        const stream = new ReadableStream({
            async start(controller) {
                const reader = upRes.body!.getReader();
                let buffer = "";

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split("\n");
                        buffer = lines.pop() || "";

                        for (const line of lines) {
                            const trimmed = line.trim();
                            if (!trimmed || trimmed === "data: [DONE]") continue;
                            if (!trimmed.startsWith("data: ")) continue;

                            try {
                                const json = JSON.parse(trimmed.slice(6));
                                const chunk = parseStreamChunk(providerName, json);
                                if (chunk) {
                                    fullContent += chunk;
                                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
                                }
                            } catch { /* skip unparseable lines */ }
                        }
                    }

                    // Done event — includes session_id (client persistence) + citations + rag_status.
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        done: true,
                        full: fullContent,
                        session_id: session.id,
                        citations: rag.citations,
                        rag_status: rag.status,
                    })}\n\n`));
                    controller.close();

                    // Post-stream: persist session + counters + billing (fire-and-forget).
                    const tokensUsed = Math.ceil((fullContent.length + userMessage.length) / 4);
                    const updatedMsgs = [
                        ...history,
                        { role: "user", content: userMessage, ts: Date.now() },
                        { role: "assistant", content: fullContent, ts: Date.now() },
                    ].slice(-(widget.max_history * 2));

                    if (widget.persistence_mode !== "ephemeral") {
                        supabase.from("widget_sessions").update({
                            messages: updatedMsgs,
                            message_count: session.message_count + 2,
                            token_count: session.token_count + tokensUsed,
                            last_message_at: new Date().toISOString(),
                        }).eq("id", session.id).then(() => {});
                    }

                    supabase.from("widget_deployments").update({
                        total_messages: widget.total_messages + 2,
                        total_tokens_used: widget.total_tokens_used + tokensUsed,
                        total_conversations: widget.total_conversations + (session.message_count === 0 ? 1 : 0),
                    }).eq("id", widget.id).then(() => {});

                    supabase.rpc("deduct_tokens" as any, {
                        p_user_id: widget.user_id, p_amount: tokensUsed, p_reason: "widget_chat",
                    }).then(() => {});

                    // AGL-001 local lineage + conservative memory write (best-effort).
                    void emitLineage({
                        supabase,
                        userId: widget.user_id,
                        deploymentId: widget.id,
                        conversationId: identity?.conversationId ?? null,
                        endUserId: identity?.endUserId ?? null,
                        input: userMessage,
                        output: fullContent,
                        model: plan.model,
                        source: candidate.source,
                    });

                    if (identity) {
                        void writeMemory({
                            supabase,
                            gateway,
                            userId: widget.user_id,
                            endUserId: identity.endUserId,
                            deploymentId: widget.id,
                            conversationId: identity.conversationId,
                            userMessage,
                        });
                    }

                } catch (err) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`));
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            status: 200,
            headers: {
                ...cors,
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });

    } catch (err: any) {
        console.error("[stream] Error:", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500, headers: corsHeaders(origin, []) });
    }
}
