// ============================================================================
// Embed Chat SSE Stream — Server-Sent Events streaming for widget chat
// Mirrors embed/chat/route.ts but returns a ReadableStream instead of JSON
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Encryption ─────────────────────────────────────────────────────────────

const ENC_KEY = process.env.AI_PROVIDER_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || "oraya-default-key-change-in-production-32c";

function getEncKey(): Buffer {
    return crypto.createHash("sha256").update(ENC_KEY).digest();
}

function decryptKey(encrypted: string): string {
    try {
        const [ivHex, data] = encrypted.split(":");
        const iv = Buffer.from(ivHex, "hex");
        const d = crypto.createDecipheriv("aes-256-cbc", getEncKey(), iv);
        let out = d.update(data, "hex", "utf8");
        out += d.final("utf8");
        return out;
    } catch {
        return "";
    }
}

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

        // Build system prompt (same logic as non-streaming route)
        const agent = widget.agent_templates;
        const history: any[] = session.messages || [];
        const cfg: any = widget.config || {};

        let sysPrompt = cfg.core_prompt_override || widget.system_prompt_override || agent.core_prompt || "";

        if (cfg.personality_override) {
            const po = cfg.personality_override;
            const parts: string[] = [];
            if (po.personality) parts.push(`Personality: ${po.personality}`);
            if (po.style) parts.push(`Communication style: ${po.style}`);
            if (po.tone) parts.push(`Tone: ${po.tone}`);
            if (parts.length) sysPrompt += "\n\n--- Personality ---\n" + parts.join("\n");
        }

        if (cfg.tone) {
            const t = cfg.tone;
            const parts: string[] = [];
            if (t.formality !== undefined) parts.push(`Formality: ${t.formality}/100`);
            if (t.verbosity !== undefined) parts.push(`Verbosity: ${t.verbosity}/100`);
            if (t.emoji_usage) parts.push(`Emoji usage: ${t.emoji_usage}`);
            if (t.response_style) parts.push(`Response style: ${t.response_style}`);
            if (parts.length) sysPrompt += "\n\n--- Tone ---\n" + parts.join("\n");
        }

        const pStack = cfg.prompt_stack?.length > 0 ? cfg.prompt_stack : widget.prompt_stack;
        if (pStack?.length > 0) {
            const text = pStack.filter((p: any) => p.is_active !== false)
                .sort((a: any, b: any) => (a.priority || 0) - (b.priority || 0))
                .map((p: any) => p.content).join("\n\n");
            if (text) sysPrompt += "\n\n" + text;
        }

        if (widget.knowledge_base?.length > 0) {
            const text = widget.knowledge_base.filter((k: any) => k.is_active !== false)
                .map((k: any) => `## ${k.name}\n${k.content}`).join("\n\n");
            if (text) sysPrompt += "\n\n--- Knowledge Base ---\n" + text;
        }

        if (cfg.raw_context) sysPrompt += "\n\n--- Additional Context ---\n" + cfg.raw_context;

        const rList = cfg.rules?.length > 0 ? cfg.rules : widget.rules;
        if (rList?.length > 0) {
            const text = rList.filter((r: any) => r.is_active !== false)
                .map((r: any) => `- [${r.severity || "standard"}] ${r.content || r.rule || ""}`).join("\n");
            if (text) sysPrompt += "\n\n--- Rules ---\n" + text;
        }

        const msgs: any[] = [{ role: "system", content: sysPrompt }];

        const training = cfg.training_qa?.length > 0
            ? cfg.training_qa.map((q: any) => ({ user_input: q.question, expected_output: q.answer, is_active: true }))
            : widget.training_data;
        if (training?.length > 0) {
            for (const ex of training.filter((e: any) => e.is_active !== false)) {
                msgs.push({ role: "user", content: ex.user_input });
                msgs.push({ role: "assistant", content: ex.expected_output });
            }
        }

        msgs.push(...history.slice(-(widget.max_history * 2)));
        msgs.push({ role: "user", content: message.trim() });

        // Resolve model + provider
        const model = cfg.model || widget.model_override || "gpt-4o-mini";

        // Resolve provider credentials (user BYOK first, then managed)
        let providerName = "openai";
        let providerKey = "";
        let providerBaseUrl: string | undefined;

        if (widget.user_provider_id) {
            const { data: up } = await supabase
                .from("user_ai_providers")
                .select("provider, api_key_encrypted, base_url, is_active, is_valid")
                .eq("id", widget.user_provider_id).single();
            if (up?.is_active && up?.is_valid && up?.api_key_encrypted) {
                const dk = decryptKey(up.api_key_encrypted);
                if (dk) { providerName = up.provider; providerKey = dk; providerBaseUrl = up.base_url || undefined; }
            }
        }

        if (!providerKey) {
            const { data: slots } = await supabase
                .from("managed_ai_keys").select("provider, api_key")
                .eq("is_active", true).order("priority", { ascending: true }).limit(1);
            if (slots?.[0]) { providerName = slots[0].provider; providerKey = slots[0].api_key; }
        }

        if (!providerKey) {
            return NextResponse.json({ error: "No AI provider available" }, { status: 503, headers: cors });
        }

        // Build upstream streaming request
        let upstreamUrl: string;
        const upHeaders: Record<string, string> = { "Content-Type": "application/json" };
        let upBody: any;

        if (providerName === "anthropic") {
            upstreamUrl = "https://api.anthropic.com/v1/messages";
            upHeaders["x-api-key"] = providerKey;
            upHeaders["anthropic-version"] = "2024-10-22";
            upBody = {
                model, stream: true,
                messages: msgs.filter((m: any) => m.role !== "system"),
                system: msgs.find((m: any) => m.role === "system")?.content || "",
                temperature: widget.temperature, max_tokens: widget.max_tokens,
            };
        } else if (providerName === "google") {
            const gm = model.startsWith("gemini") ? model : "gemini-2.0-flash";
            upstreamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${gm}:streamGenerateContent?key=${providerKey}&alt=sse`;
            const sysInst = msgs.find((m: any) => m.role === "system")?.content || "";
            upBody = {
                contents: msgs.filter((m: any) => m.role !== "system")
                    .map((m: any) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
                systemInstruction: sysInst ? { parts: [{ text: sysInst }] } : undefined,
                generationConfig: { temperature: widget.temperature, maxOutputTokens: widget.max_tokens },
            };
        } else {
            // OpenAI-compatible (openai, oraya, custom, xai, mistral, etc.)
            if (providerName === "oraya") upstreamUrl = "https://myoraya.space/api/v1/chat/completions";
            else if (providerName === "custom" && providerBaseUrl) upstreamUrl = providerBaseUrl.replace(/\/+$/, "") + "/v1/chat/completions";
            else upstreamUrl = "https://api.openai.com/v1/chat/completions";
            upHeaders["Authorization"] = `Bearer ${providerKey}`;
            upBody = { model, messages: msgs, temperature: widget.temperature, max_tokens: widget.max_tokens, stream: true };
        }

        // Fetch upstream with streaming
        const upRes = await fetch(upstreamUrl, { method: "POST", headers: upHeaders, body: JSON.stringify(upBody) });

        if (!upRes.ok || !upRes.body) {
            const errText = await upRes.text().catch(() => "Unknown");
            return NextResponse.json({ error: `Provider error: ${errText}` }, { status: 502, headers: cors });
        }

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
                                let chunk = "";

                                if (providerName === "anthropic") {
                                    if (json.type === "content_block_delta") chunk = json.delta?.text || "";
                                } else if (providerName === "google") {
                                    chunk = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
                                } else {
                                    chunk = json.choices?.[0]?.delta?.content || "";
                                }

                                if (chunk) {
                                    fullContent += chunk;
                                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
                                }
                            } catch { /* skip unparseable lines */ }
                        }
                    }

                    // Send done event
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, full: fullContent })}\n\n`));
                    controller.close();

                    // Post-stream: update session + counters (fire-and-forget)
                    const tokensUsed = Math.ceil((fullContent.length + message.length) / 4); // rough estimate
                    const updatedMsgs = [
                        ...history,
                        { role: "user", content: message.trim(), ts: Date.now() },
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
