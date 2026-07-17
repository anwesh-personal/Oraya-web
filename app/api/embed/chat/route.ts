// ============================================================================
// Embed Chat API — Public-facing endpoint for widget conversations
// NO user auth required. Authenticates via widget API key (wgt_xxxx).
// Validates origin domain, enforces rate limits, deducts tokens from deployer.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Encryption (mirrors providers/route.ts) ────────────────────────────────

const ENCRYPTION_KEY = process.env.AI_PROVIDER_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || "oraya-default-key-change-in-production-32c";

function getEncKey(): Buffer {
    return crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
}

function decryptKey(encrypted: string): string {
    try {
        const [ivHex, data] = encrypted.split(":");
        const iv = Buffer.from(ivHex, "hex");
        const decipher = crypto.createDecipheriv("aes-256-cbc", getEncKey(), iv);
        let decrypted = decipher.update(data, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    } catch {
        return "";
    }
}

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
            // Try to find existing session for this visitor
            let lookupField = "visitor_id";
            let lookupValue = visitor_id;

            if (widget.persistence_mode === "ip_persistent") {
                lookupField = "visitor_ip";
                lookupValue = ip;
            }

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

        // ─── Build conversation context ─────────────────────────────────
        const agent = widget.agent_templates;
        const history: any[] = session.messages || [];
        const widgetConfig: any = widget.config || {};

        // Construct system prompt — layer: base → config override → prompt stack
        let systemPrompt = widgetConfig.core_prompt_override
            || widget.system_prompt_override
            || agent.core_prompt
            || "";

        // Inject personality override from config JSONB
        if (widgetConfig.personality_override) {
            const po = widgetConfig.personality_override;
            const personalityParts: string[] = [];
            if (po.personality) personalityParts.push(`Personality: ${po.personality}`);
            if (po.style) personalityParts.push(`Communication style: ${po.style}`);
            if (po.tone) personalityParts.push(`Tone: ${po.tone}`);
            if (personalityParts.length > 0) {
                systemPrompt += "\n\n--- Personality ---\n" + personalityParts.join("\n");
            }
        }

        // Inject tone settings from config JSONB
        if (widgetConfig.tone) {
            const t = widgetConfig.tone;
            const toneParts: string[] = [];
            if (t.formality !== undefined) toneParts.push(`Formality level: ${t.formality}/100`);
            if (t.verbosity !== undefined) toneParts.push(`Verbosity level: ${t.verbosity}/100`);
            if (t.emoji_usage) toneParts.push(`Emoji usage: ${t.emoji_usage}`);
            if (t.response_style) toneParts.push(`Response style: ${t.response_style}`);
            if (toneParts.length > 0) {
                systemPrompt += "\n\n--- Tone Settings ---\n" + toneParts.join("\n");
            }
        }

        // Append prompt stack — prefer config JSONB, fallback to dedicated column
        const promptStack = widgetConfig.prompt_stack?.length > 0
            ? widgetConfig.prompt_stack
            : widget.prompt_stack;
        if (promptStack?.length > 0) {
            const stackText = promptStack
                .filter((p: any) => p.is_active !== false)
                .sort((a: any, b: any) => (a.priority || 0) - (b.priority || 0))
                .map((p: any) => p.content)
                .join("\n\n");
            if (stackText) systemPrompt += "\n\n" + stackText;
        }

        // Append knowledge base
        if (widget.knowledge_base?.length > 0) {
            const kbText = widget.knowledge_base
                .filter((k: any) => k.is_active !== false)
                .map((k: any) => `## ${k.name}\n${k.content}`)
                .join("\n\n");
            if (kbText) systemPrompt += "\n\n--- Knowledge Base ---\n" + kbText;
        }

        // Append raw context from config JSONB
        if (widgetConfig.raw_context) {
            systemPrompt += "\n\n--- Additional Context ---\n" + widgetConfig.raw_context;
        }

        // Append rules — prefer config JSONB, fallback to dedicated column
        const rulesList = widgetConfig.rules?.length > 0
            ? widgetConfig.rules
            : widget.rules;
        if (rulesList?.length > 0) {
            const rulesText = rulesList
                .filter((r: any) => r.is_active !== false)
                .map((r: any) => {
                    const content = r.content || r.rule || "";
                    const severity = r.severity || "standard";
                    return `- [${severity}] ${content}`;
                })
                .join("\n");
            if (rulesText) systemPrompt += "\n\n--- Behavioral Rules ---\n" + rulesText;
        }

        // Build messages array
        const messages: any[] = [
            { role: "system", content: systemPrompt },
        ];

        // Add training examples as few-shot — prefer config JSONB training_qa, fallback to dedicated column
        const trainingItems = widgetConfig.training_qa?.length > 0
            ? widgetConfig.training_qa.map((qa: any) => ({
                user_input: qa.question,
                expected_output: qa.answer,
                is_active: true,
            }))
            : widget.training_data;
        if (trainingItems?.length > 0) {
            for (const ex of trainingItems.filter((e: any) => e.is_active !== false)) {
                messages.push({ role: "user", content: ex.user_input });
                messages.push({ role: "assistant", content: ex.expected_output });
            }
        }

        // Add conversation history (capped to max_history)
        const recentHistory = history.slice(-(widget.max_history * 2));
        messages.push(...recentHistory);

        // Add current message
        messages.push({ role: "user", content: message.trim() });

        // ─── Call AI provider ───────────────────────────────────────────
        // Priority: 1) User's own provider (BYOK) → 2) Managed admin keys
        const model = widgetConfig.model
            || widget.model_override
            || "gpt-4o-mini";

        let aiResponse: string | null = null;
        let tokensUsed = 0;

        // ── 1) Try user's own provider ──
        if (widget.user_provider_id) {
            try {
                const { data: userProvider } = await supabase
                    .from("user_ai_providers")
                    .select("provider, api_key_encrypted, base_url, is_active, is_valid")
                    .eq("id", widget.user_provider_id)
                    .single();

                if (userProvider?.is_active && userProvider?.is_valid && userProvider?.api_key_encrypted) {
                    const decryptedKey = decryptKey(userProvider.api_key_encrypted);
                    if (decryptedKey) {
                        // For custom providers, use their base_url
                        const providerName = userProvider.provider === "custom" && userProvider.base_url
                            ? "custom"
                            : userProvider.provider;

                        const result = await callProvider(
                            providerName,
                            decryptedKey,
                            model,
                            messages,
                            widget.temperature,
                            widget.max_tokens,
                            userProvider.base_url || undefined
                        );
                        aiResponse = result.content;
                        tokensUsed = result.totalTokens;
                    }
                }
            } catch (err: any) {
                console.warn(`[embed/chat] User provider ${widget.user_provider_id} failed:`, err.message);
                // Fall through to managed keys
            }
        }

        // ── 2) Fallback to managed admin keys ──
        if (!aiResponse) {
            const { data: slots, error: slotErr } = await supabase
                .from("managed_ai_keys")
                .select("provider, api_key, key_name, priority")
                .eq("is_active", true)
                .order("priority", { ascending: true });

            if (slotErr || !slots || slots.length === 0) {
                return NextResponse.json(
                    { error: "No AI providers configured" },
                    { status: 503, headers: cors }
                );
            }

            for (const slot of slots) {
                try {
                    const result = await callProvider(
                        slot.provider,
                        slot.api_key,
                        model,
                        messages,
                        widget.temperature,
                        widget.max_tokens
                    );
                    aiResponse = result.content;
                    tokensUsed = result.totalTokens;
                    break;
                } catch (err: any) {
                    console.warn(`[embed/chat] Provider ${slot.provider} failed:`, err.message);
                    continue;
                }
            }
        }

        if (!aiResponse) {
            return NextResponse.json(
                { error: "All AI providers failed" },
                { status: 502, headers: cors }
            );
        }

        // ─── Update session ─────────────────────────────────────────────
        const updatedMessages = [
            ...history,
            { role: "user", content: message.trim(), ts: Date.now() },
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

        return NextResponse.json(
            {
                response: aiResponse,
                session_id: session.id,
                tokens_used: tokensUsed,
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

// ─── Provider Dispatcher ────────────────────────────────────────────────────

async function callProvider(
    provider: string,
    apiKey: string,
    model: string,
    messages: any[],
    temperature: number,
    maxTokens: number,
    baseUrl?: string
): Promise<{ content: string; totalTokens: number }> {
    let url: string;
    let headers: Record<string, string> = { "Content-Type": "application/json" };
    let body: any;

    switch (provider) {
        case "openai":
            url = "https://api.openai.com/v1/chat/completions";
            headers["Authorization"] = `Bearer ${apiKey}`;
            body = { model, messages, temperature, max_tokens: maxTokens };
            break;
        case "anthropic":
            url = "https://api.anthropic.com/v1/messages";
            headers["x-api-key"] = apiKey;
            headers["anthropic-version"] = "2024-10-22";
            body = {
                model,
                messages: messages.filter(m => m.role !== "system"),
                system: messages.find(m => m.role === "system")?.content || "",
                temperature,
                max_tokens: maxTokens,
            };
            break;
        case "google": {
            const geminiModel = model.startsWith("gemini") ? model : "gemini-2.0-flash";
            url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;
            const systemInstruction = messages.find(m => m.role === "system")?.content || "";
            body = {
                contents: messages
                    .filter(m => m.role !== "system")
                    .map(m => ({
                        role: m.role === "assistant" ? "model" : "user",
                        parts: [{ text: m.content }],
                    })),
                systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
                generationConfig: { temperature, maxOutputTokens: maxTokens },
            };
            break;
        }
        case "oraya":
            url = "https://myoraya.space/api/v1/chat/completions";
            headers["Authorization"] = `Bearer ${apiKey}`;
            body = { model, messages, temperature, max_tokens: maxTokens };
            break;
        case "custom":
            if (!baseUrl) throw new Error("Custom provider requires a base_url");
            url = baseUrl.replace(/\/+$/, "") + "/v1/chat/completions";
            headers["Authorization"] = `Bearer ${apiKey}`;
            body = { model, messages, temperature, max_tokens: maxTokens };
            break;
        default:
            // Treat unknown providers as OpenAI-compatible
            url = "https://api.openai.com/v1/chat/completions";
            headers["Authorization"] = `Bearer ${apiKey}`;
            body = { model, messages, temperature, max_tokens: maxTokens };
    }

    const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => "Unknown error");
        throw new Error(`${provider} returned ${res.status}: ${errText}`);
    }

    const data = await res.json();

    // Extract content based on provider
    let content: string;
    let totalTokens: number;

    switch (provider) {
        case "openai":
            content = data.choices?.[0]?.message?.content || "";
            totalTokens = data.usage?.total_tokens || 0;
            break;
        case "anthropic":
            content = data.content?.[0]?.text || "";
            totalTokens = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
            break;
        case "google":
            content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            totalTokens = (data.usageMetadata?.promptTokenCount || 0) +
                          (data.usageMetadata?.candidatesTokenCount || 0);
            break;
        case "oraya":
        case "custom":
            content = data.choices?.[0]?.message?.content || "";
            totalTokens = data.usage?.total_tokens || 0;
            break;
        default:
            // Assume OpenAI-compatible format
            content = data.choices?.[0]?.message?.content || data.content?.[0]?.text || "";
            totalTokens = data.usage?.total_tokens || 0;
    }

    return { content, totalTokens };
}
