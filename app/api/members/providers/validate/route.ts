// ============================================================================
// AI Provider Validation — Real-time key verification + model fetching
// Proxies to provider's /models endpoint to verify key and get model list.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ─── Provider Model Fetchers ────────────────────────────────────────────────

interface ModelInfo {
    id: string;
    name: string;
    context_window?: number;
}

interface ValidationResult {
    valid: boolean;
    models: ModelInfo[];
    error?: string;
}

async function validateOpenAI(apiKey: string): Promise<ValidationResult> {
    try {
        const res = await fetch("https://api.openai.com/v1/models", {
            headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok) return { valid: false, models: [], error: `HTTP ${res.status}: ${await res.text()}` };
        const data = await res.json();
        const models = (data.data || [])
            .filter((m: any) => m.id.includes("gpt") || m.id.includes("o1") || m.id.includes("o3") || m.id.includes("o4"))
            .map((m: any): ModelInfo => ({ id: m.id, name: m.id }))
            .sort((a: ModelInfo, b: ModelInfo) => a.id.localeCompare(b.id));
        return { valid: true, models };
    } catch (err: any) {
        return { valid: false, models: [], error: err.message };
    }
}

async function validateAnthropic(apiKey: string): Promise<ValidationResult> {
    const knownModels: ModelInfo[] = [
        { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4" },
        { id: "claude-opus-4-20250514", name: "Claude Opus 4" },
        { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku" },
        { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
        { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku" },
    ];

    try {
        // Try /v1/models first (newer API versions support it)
        const res = await fetch("https://api.anthropic.com/v1/models", {
            headers: {
                "x-api-key": apiKey,
                "anthropic-version": "2024-10-22",
            },
        });

        if (res.ok) {
            const data = await res.json();
            const models = (data.data || [])
                .map((m: any): ModelInfo => ({ id: m.id, name: m.display_name || m.id }));
            return { valid: true, models: models.length > 0 ? models : knownModels };
        }

        // /v1/models returned non-200 (400, 404, etc) — verify key with a
        // lightweight messages request that costs nothing (empty body triggers
        // a validation error, but a 401 = bad key, anything else = key is valid)
        if (res.status === 401) {
            return { valid: false, models: [], error: "Invalid API key" };
        }

        // Any other status (400, 404, 403) means the endpoint isn't available
        // but the key authenticated. Verify with a ping request.
        const pingRes = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "x-api-key": apiKey,
                "anthropic-version": "2024-10-22",
                "content-type": "application/json",
            },
            body: JSON.stringify({
                model: "claude-3-haiku-20240307",
                max_tokens: 1,
                messages: [{ role: "user", content: "hi" }],
            }),
        });

        // 401 = bad key. Anything else (200, 400, 429) = key is valid
        if (pingRes.status === 401) {
            return { valid: false, models: [], error: "Invalid API key" };
        }

        return { valid: true, models: knownModels };
    } catch (err: any) {
        return { valid: false, models: [], error: err.message };
    }
}

async function validateGoogle(apiKey: string): Promise<ValidationResult> {
    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        if (!res.ok) return { valid: false, models: [], error: `HTTP ${res.status}` };
        const data = await res.json();
        const models = (data.models || [])
            .filter((m: any) => m.name?.includes("gemini"))
            .map((m: any): ModelInfo => ({
                id: m.name.replace("models/", ""),
                name: m.displayName || m.name.replace("models/", ""),
                context_window: m.inputTokenLimit,
            }));
        return { valid: true, models };
    } catch (err: any) {
        return { valid: false, models: [], error: err.message };
    }
}

async function validateMistral(apiKey: string): Promise<ValidationResult> {
    try {
        const res = await fetch("https://api.mistral.ai/v1/models", {
            headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok) return { valid: false, models: [], error: `HTTP ${res.status}` };
        const data = await res.json();
        const models = (data.data || [])
            .map((m: any): ModelInfo => ({ id: m.id, name: m.id }));
        return { valid: true, models };
    } catch (err: any) {
        return { valid: false, models: [], error: err.message };
    }
}

async function validateXAI(apiKey: string): Promise<ValidationResult> {
    try {
        const res = await fetch("https://api.x.ai/v1/models", {
            headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok) return { valid: false, models: [], error: `HTTP ${res.status}` };
        const data = await res.json();
        const models = (data.data || [])
            .map((m: any): ModelInfo => ({ id: m.id, name: m.id }));
        return { valid: true, models };
    } catch (err: any) {
        return { valid: false, models: [], error: err.message };
    }
}

async function validateCustom(apiKey: string, baseUrl: string): Promise<ValidationResult> {
    try {
        const url = baseUrl.replace(/\/+$/, "") + "/v1/models";
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok) return { valid: false, models: [], error: `HTTP ${res.status}` };
        const data = await res.json();
        const models = (data.data || data.models || [])
            .map((m: any): ModelInfo => ({ id: m.id || m.name, name: m.id || m.name }));
        return { valid: true, models };
    } catch (err: any) {
        return { valid: false, models: [], error: err.message };
    }
}

// ─── POST: Validate a key ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { provider, api_key, base_url } = body;

        if (!provider || !api_key) {
            return NextResponse.json(
                { error: "provider and api_key are required" },
                { status: 400 }
            );
        }

        let result: ValidationResult;

        switch (provider) {
            case "openai":
                result = await validateOpenAI(api_key);
                break;
            case "anthropic":
                result = await validateAnthropic(api_key);
                break;
            case "google":
                result = await validateGoogle(api_key);
                break;
            case "mistral":
                result = await validateMistral(api_key);
                break;
            case "xai":
                result = await validateXAI(api_key);
                break;
            case "custom":
                if (!base_url) {
                    return NextResponse.json(
                        { error: "base_url is required for custom providers" },
                        { status: 400 }
                    );
                }
                result = await validateCustom(api_key, base_url);
                break;
            default:
                return NextResponse.json(
                    { error: `Unsupported provider: ${provider}` },
                    { status: 400 }
                );
        }

        return NextResponse.json(result);
    } catch (err: any) {
        console.error("[providers/validate] Error:", err);
        return NextResponse.json(
            { valid: false, models: [], error: "Validation failed" },
            { status: 500 }
        );
    }
}
