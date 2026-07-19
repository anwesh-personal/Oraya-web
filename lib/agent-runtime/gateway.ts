// ============================================================================
// agent-runtime / gateway — sovereign orchestrated gateway configuration.
// ============================================================================
// The sovereign gateway (myoraya.space) exposes an OpenAI-compatible
// orchestrated `/api/v1/chat/completions` (Sentra routing) and an OpenAI-
// compatible `/api/v1/embeddings` (Qwen3-Embedding-0.6B, 1024d). Both require
// an ORAK key.
//
// Config is ENV-driven. NO keys are ever hardcoded. When the sovereign path is
// SELECTED but not configured we throw loud — a misconfig must never silently
// fall through to a different provider (that would hide the fault).
// ============================================================================

export interface GatewayConfig {
    /** Base URL, e.g. https://myoraya.space (no trailing slash). */
    baseUrl: string;
    /** ORAK key used as the Bearer credential for the gateway. */
    orakKey: string;
    /** Embedding model id (fixed by the gateway; overridable via ENV). */
    embeddingModel: string;
}

const DEFAULT_EMBEDDING_MODEL = "Qwen3-Embedding-0.6B";

function normalizeBaseUrl(raw: string): string {
    return raw.trim().replace(/\/+$/, "");
}

/**
 * Returns the gateway config if BOTH the URL and ORAK key are present in ENV,
 * otherwise null. Callers that merely want to know "is the gateway available?"
 * (RAG/embeddings enablement) use this; it never throws.
 */
export function getGatewayConfig(): GatewayConfig | null {
    const baseUrl = process.env.ORAYA_GATEWAY_URL;
    const orakKey = process.env.ORAYA_GATEWAY_ORAK_KEY;
    if (!baseUrl || !orakKey) return null;
    return {
        baseUrl: normalizeBaseUrl(baseUrl),
        orakKey,
        embeddingModel: process.env.ORAYA_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL,
    };
}

/**
 * Returns the gateway config or throws a loud, explicit error naming the exact
 * missing ENV var. Use this ONLY when the sovereign path has been SELECTED, so a
 * misconfiguration fails visibly instead of silently degrading.
 */
export function requireGatewayConfig(): GatewayConfig {
    const baseUrl = process.env.ORAYA_GATEWAY_URL;
    const orakKey = process.env.ORAYA_GATEWAY_ORAK_KEY;
    const missing: string[] = [];
    if (!baseUrl) missing.push("ORAYA_GATEWAY_URL");
    if (!orakKey) missing.push("ORAYA_GATEWAY_ORAK_KEY");
    if (missing.length > 0) {
        throw new Error(
            `Sovereign gateway selected but not configured. Missing ENV: ${missing.join(", ")}. ` +
            `Set them or disable the sovereign inference path for this widget.`,
        );
    }
    return {
        baseUrl: normalizeBaseUrl(baseUrl!),
        orakKey: orakKey!,
        embeddingModel: process.env.ORAYA_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL,
    };
}

export const GATEWAY_CHAT_PATH = "/api/v1/chat/completions";
export const GATEWAY_EMBEDDINGS_PATH = "/api/v1/embeddings";
