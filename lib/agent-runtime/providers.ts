// ============================================================================
// agent-runtime / providers — provider-agnostic upstream request + parsing.
// ============================================================================
// The single place that knows each provider's wire format. Extracted VERBATIM
// from the two embed chat routes (callProvider + the inline streaming builder)
// so the blocking and streaming paths share ONE implementation and behave
// identically. Supports blocking (stream:false) and streaming (stream:true).
//
// The sovereign orchestrated gateway is OpenAI-compatible, so it dispatches
// through the same "openai-compatible" branch with an explicit base URL.
// ============================================================================

import type { ChatMessage } from "./types";

export interface UpstreamRequest {
    url: string;
    headers: Record<string, string>;
    body: any;
}

export interface BuildUpstreamOpts {
    provider: string;
    apiKey: string;
    model: string;
    messages: ChatMessage[];
    temperature: number;
    maxTokens: number;
    stream: boolean;
    /** Explicit base URL for `custom` providers. */
    baseUrl?: string;
    /**
     * Fully-qualified chat-completions endpoint for OpenAI-compatible providers.
     * Used by the sovereign gateway whose path is `/api/v1/chat/completions`
     * (not the `/v1/...` the base-URL branch would synthesize). Ignored for
     * anthropic/google.
     */
    endpointUrl?: string;
}

/**
 * Builds the upstream HTTP request for a given provider. Mirrors the exact
 * per-provider shaping the routes used prior to extraction.
 */
export function buildUpstreamRequest(opts: BuildUpstreamOpts): UpstreamRequest {
    const { provider, apiKey, model, messages, temperature, maxTokens, stream, baseUrl, endpointUrl } = opts;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    let url: string;
    let body: any;

    switch (provider) {
        case "anthropic":
            url = "https://api.anthropic.com/v1/messages";
            headers["x-api-key"] = apiKey;
            headers["anthropic-version"] = "2024-10-22";
            body = {
                model,
                messages: messages.filter((m) => m.role !== "system"),
                system: messages.find((m) => m.role === "system")?.content || "",
                temperature,
                max_tokens: maxTokens,
                ...(stream ? { stream: true } : {}),
            };
            break;
        case "google": {
            // Use the RESOLVED model verbatim. Previously this silently swapped
            // any non-"gemini" model for a hardcoded "gemini-2.0-flash" — a
            // deceptive downgrade. If the resolved model isn't a Gemini model,
            // fail loud rather than substitute one.
            if (!model.startsWith("gemini")) {
                throw new Error(
                    `google provider cannot serve model '${model}': not a Gemini model. ` +
                    `Refusing to silently substitute a different model.`,
                );
            }
            const geminiModel = model;
            const method = stream ? "streamGenerateContent" : "generateContent";
            const suffix = stream ? `?key=${apiKey}&alt=sse` : `?key=${apiKey}`;
            url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:${method}${suffix}`;
            const systemInstruction = messages.find((m) => m.role === "system")?.content || "";
            body = {
                contents: messages
                    .filter((m) => m.role !== "system")
                    .map((m) => ({
                        role: m.role === "assistant" ? "model" : "user",
                        parts: [{ text: m.content }],
                    })),
                systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
                generationConfig: { temperature, maxOutputTokens: maxTokens },
            };
            break;
        }
        case "oraya":
            // Legacy BYOK/managed "oraya" provider: OpenAI-compatible at myoraya.space
            // using the caller-supplied key. (The ENV-configured orchestrated
            // gateway supplies an explicit `endpointUrl` instead.)
            url = endpointUrl
                || (baseUrl ? baseUrl.replace(/\/+$/, "") + "/v1/chat/completions" : "https://myoraya.space/api/v1/chat/completions");
            headers["Authorization"] = `Bearer ${apiKey}`;
            body = { model, messages, temperature, max_tokens: maxTokens, ...(stream ? { stream: true } : {}) };
            break;
        case "custom":
            if (!endpointUrl && !baseUrl) throw new Error("Custom provider requires a base_url");
            url = endpointUrl || baseUrl!.replace(/\/+$/, "") + "/v1/chat/completions";
            headers["Authorization"] = `Bearer ${apiKey}`;
            body = { model, messages, temperature, max_tokens: maxTokens, ...(stream ? { stream: true } : {}) };
            break;
        case "openai":
            url = endpointUrl || "https://api.openai.com/v1/chat/completions";
            headers["Authorization"] = `Bearer ${apiKey}`;
            body = { model, messages, temperature, max_tokens: maxTokens, ...(stream ? { stream: true } : {}) };
            break;
        default:
            // Unknown providers are treated as OpenAI-compatible. An explicit
            // endpointUrl/baseUrl (e.g. the sovereign gateway) is honoured.
            url = endpointUrl
                || (baseUrl ? baseUrl.replace(/\/+$/, "") + "/v1/chat/completions" : "https://api.openai.com/v1/chat/completions");
            headers["Authorization"] = `Bearer ${apiKey}`;
            body = { model, messages, temperature, max_tokens: maxTokens, ...(stream ? { stream: true } : {}) };
    }

    return { url, headers, body };
}

/** Parses a full (non-streaming) provider response into content + token count. */
export function parseBlockingResponse(
    provider: string,
    data: any,
): { content: string; totalTokens: number } {
    switch (provider) {
        case "anthropic":
            return {
                content: data.content?.[0]?.text || "",
                totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
            };
        case "google":
            return {
                content: data.candidates?.[0]?.content?.parts?.[0]?.text || "",
                totalTokens:
                    (data.usageMetadata?.promptTokenCount || 0) +
                    (data.usageMetadata?.candidatesTokenCount || 0),
            };
        case "openai":
        case "oraya":
        case "custom":
            return {
                content: data.choices?.[0]?.message?.content || "",
                totalTokens: data.usage?.total_tokens || 0,
            };
        default:
            return {
                content: data.choices?.[0]?.message?.content || data.content?.[0]?.text || "",
                totalTokens: data.usage?.total_tokens || 0,
            };
    }
}

/**
 * Extracts a streamed text delta from one parsed SSE `data:` JSON object.
 * Returns "" when the event carries no text (mirrors the route's inline logic).
 */
export function parseStreamChunk(provider: string, json: any): string {
    if (provider === "anthropic") {
        if (json.type === "content_block_delta") return json.delta?.text || "";
        return "";
    }
    if (provider === "google") {
        return json.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }
    return json.choices?.[0]?.delta?.content || "";
}
