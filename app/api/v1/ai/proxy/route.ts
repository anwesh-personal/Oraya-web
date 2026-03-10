// ============================================================================
// Oraya Master Engine Key Proxy
// Vercel Edge Function that securely proxies AI requests using server-side keys.
// Keys NEVER leave the server. Desktop app sends standard OpenAI-format requests.
//
// Flow:
//   Desktop App → (OLT Bearer token) → This Proxy → (real API key) → Provider
//
// Fallback Chain:
//   Slots are ordered by priority (0 = highest). If the primary slot's provider
//   returns an error, we cascade to the next priority slot automatically.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { jwtVerify } from "jose";

export const runtime = "edge";

// ─── Types ───────────────────────────────────────────────────────────────────

type ProxyCategory = "llm" | "image" | "audio" | "video";

interface ProxyRequestBody {
    model: string;
    messages: any[];
    category?: ProxyCategory;
    stream?: boolean;
    temperature?: number;
    max_tokens?: number;
    [key: string]: any;
}

interface ResolvedSlot {
    priority: number;
    selected_model: string | null;
    provider: string;
    api_key: string;
}

// ─── Provider URL + Header Builder ───────────────────────────────────────────

function buildProviderRequest(
    provider: string,
    apiKey: string,
    model: string,
    body: ProxyRequestBody
): { url: string; headers: Record<string, string>; body: string } | null {

    const baseHeaders: Record<string, string> = { "Content-Type": "application/json" };

    // Strip out proxy-only fields before forwarding
    const { category: _cat, ...forwardBody } = body;
    const requestBody = { ...forwardBody, model };

    switch (provider) {
        case "openai":
            return {
                url: "https://api.openai.com/v1/chat/completions",
                headers: { ...baseHeaders, Authorization: `Bearer ${apiKey}` },
                body: JSON.stringify(requestBody),
            };

        case "anthropic":
            return {
                url: "https://api.anthropic.com/v1/messages",
                headers: {
                    ...baseHeaders,
                    "x-api-key": apiKey,
                    "anthropic-version": "2024-10-22",
                },
                body: JSON.stringify(requestBody),
            };

        case "google": {
            // Google Gemini uses a different request format
            // Filter out system messages (Gemini doesn't support them as a role)
            // and transform to Gemini's contents format
            const systemMessages = body.messages.filter((m: any) => m.role === "system");
            const chatMessages = body.messages.filter((m: any) => m.role !== "system");

            const geminiBody: any = {
                contents: chatMessages.map((m: any) => ({
                    role: m.role === "assistant" ? "model" : "user",
                    parts: [{ text: m.content }],
                })),
                generationConfig: {
                    temperature: body.temperature,
                    maxOutputTokens: body.max_tokens,
                },
            };

            // Inject system instruction if present
            if (systemMessages.length > 0) {
                geminiBody.systemInstruction = {
                    parts: [{ text: systemMessages.map((m: any) => m.content).join("\n") }],
                };
            }

            return {
                url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                headers: baseHeaders,
                body: JSON.stringify(geminiBody),
            };
        }

        case "mistral":
            return {
                url: "https://api.mistral.ai/v1/chat/completions",
                headers: { ...baseHeaders, Authorization: `Bearer ${apiKey}` },
                body: JSON.stringify(requestBody),
            };

        case "deepseek":
            return {
                url: "https://api.deepseek.com/v1/chat/completions",
                headers: { ...baseHeaders, Authorization: `Bearer ${apiKey}` },
                body: JSON.stringify(requestBody),
            };

        case "groq":
            return {
                url: "https://api.groq.com/openai/v1/chat/completions",
                headers: { ...baseHeaders, Authorization: `Bearer ${apiKey}` },
                body: JSON.stringify(requestBody),
            };

        case "perplexity":
            return {
                url: "https://api.perplexity.ai/chat/completions",
                headers: { ...baseHeaders, Authorization: `Bearer ${apiKey}` },
                body: JSON.stringify(requestBody),
            };

        case "cohere":
            return {
                url: "https://api.cohere.ai/v1/chat",
                headers: { ...baseHeaders, Authorization: `Bearer ${apiKey}` },
                body: JSON.stringify(requestBody),
            };

        default:
            return null;
    }
}

// ─── Main Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        // 1. ── Authenticate via OLT ──────────────────────────────────────
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Missing or invalid Authorization header" },
                { status: 401 }
            );
        }

        const token = authHeader.split(" ")[1];
        const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

        let jwtPayload: Record<string, any>;
        try {
            const { payload } = await jwtVerify(token, secret);
            jwtPayload = payload as Record<string, any>;
        } catch {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
        }

        const engineId = jwtPayload?.managed_ai?.engine_id;
        if (!engineId) {
            return NextResponse.json(
                { error: "No Master Engine assigned to this license" },
                { status: 403 }
            );
        }

        // 2. ── Parse Request Body ────────────────────────────────────────
        const body = (await request.json()) as ProxyRequestBody;
        if (!body.model || !body.messages?.length) {
            return NextResponse.json(
                { error: "Request must contain 'model' and 'messages'" },
                { status: 400 }
            );
        }

        // Resolve category from request body (default: llm)
        const validCategories: ProxyCategory[] = ["llm", "image", "audio", "video"];
        const category: ProxyCategory = validCategories.includes(body.category as ProxyCategory)
            ? (body.category as ProxyCategory)
            : "llm";

        // 3. ── Resolve Engine Slots ──────────────────────────────────────
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        );

        const { data: rawSlots, error: slotError } = await supabase
            .from("engine_provider_slots" as any)
            .select(`
                priority,
                selected_model,
                managed_ai_keys(provider, api_key, is_active)
            `)
            .eq("engine_id", engineId)
            .eq("category", category)
            .eq("is_enabled", true)
            .order("priority", { ascending: true });

        if (slotError || !rawSlots?.length) {
            return NextResponse.json(
                { error: `No ${category.toUpperCase()} providers configured for this engine` },
                { status: 502 }
            );
        }

        // Flatten into usable slots, filtering out inactive keys
        const slots: ResolvedSlot[] = (rawSlots as any[])
            .filter((s) => {
                const k = s.managed_ai_keys;
                return k && (Array.isArray(k) ? k[0]?.is_active : k.is_active);
            })
            .map((s) => {
                const k = Array.isArray(s.managed_ai_keys)
                    ? s.managed_ai_keys[0]
                    : s.managed_ai_keys;
                return {
                    priority: s.priority,
                    selected_model: s.selected_model,
                    provider: k.provider,
                    api_key: k.api_key,
                };
            });

        if (slots.length === 0) {
            return NextResponse.json(
                { error: `All configured ${category.toUpperCase()} provider keys are inactive` },
                { status: 502 }
            );
        }

        // 4. ── Cascading Fallback Loop ───────────────────────────────────
        //    Try each slot in priority order. If one fails, move to next.
        const errors: string[] = [];

        for (const slot of slots) {
            const model = slot.selected_model || body.model;
            const providerReq = buildProviderRequest(slot.provider, slot.api_key, model, body);

            if (!providerReq) {
                errors.push(`Unsupported provider: ${slot.provider}`);
                continue;
            }

            try {
                const providerResponse = await fetch(providerReq.url, {
                    method: "POST",
                    headers: providerReq.headers,
                    body: providerReq.body,
                });

                if (providerResponse.ok) {
                    // ── Success: stream or return JSON ────────────────────
                    if (body.stream && providerResponse.body) {
                        return new NextResponse(providerResponse.body as ReadableStream, {
                            headers: {
                                "Content-Type": "text/event-stream",
                                "Cache-Control": "no-cache",
                                Connection: "keep-alive",
                            },
                        });
                    }

                    const data = await providerResponse.json();
                    return NextResponse.json(data);
                }

                // ── Provider returned an error; log and try next slot ────
                const errText = await providerResponse.text();
                const errMsg = `[${slot.provider}] ${providerResponse.status}: ${errText.slice(0, 200)}`;
                console.warn(`Key Proxy fallback — ${errMsg}`);
                errors.push(errMsg);

            } catch (fetchErr: any) {
                const errMsg = `[${slot.provider}] Network error: ${fetchErr.message}`;
                console.warn(`Key Proxy fallback — ${errMsg}`);
                errors.push(errMsg);
            }
        }

        // 5. ── All slots exhausted ───────────────────────────────────────
        console.error("Key Proxy: all provider slots exhausted", errors);
        return NextResponse.json(
            {
                error: "All configured AI providers failed",
                details: errors,
            },
            { status: 502 }
        );

    } catch (e: any) {
        console.error("Master Engine Proxy fatal error:", e);
        return NextResponse.json(
            { error: e.message || "Internal proxy error" },
            { status: 500 }
        );
    }
}
