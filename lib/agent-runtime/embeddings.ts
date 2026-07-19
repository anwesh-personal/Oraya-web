// ============================================================================
// agent-runtime / embeddings — sovereign gateway embedding client.
// ============================================================================
// Embeds text via the sovereign gateway's OpenAI-compatible
// `/api/v1/embeddings` (Qwen3-Embedding-0.6B, 1024d). The dimension is FIXED by
// the model and by the `vector(1024)` DB columns (migration 053), so a mismatch
// FAILS LOUD here — we NEVER fabricate, hash, or truncate an embedding.
// ============================================================================

import { getGatewayConfig, GATEWAY_EMBEDDINGS_PATH } from "./gateway";

export const EMBEDDING_DIM = 1024;

export class EmbeddingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "EmbeddingError";
    }
}

/** True when the gateway (embedder) is configured via ENV. */
export function isEmbedderConfigured(): boolean {
    return getGatewayConfig() !== null;
}

/**
 * Embeds a batch of texts, returning one 1024-dim vector per input in order.
 * Throws EmbeddingError if the embedder is unconfigured, unreachable, returns a
 * non-OK status, or returns a vector of the wrong dimension. NO silent fallback.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const gw = getGatewayConfig();
    if (!gw) {
        throw new EmbeddingError(
            "Embedder not configured. Set ORAYA_GATEWAY_URL + ORAYA_GATEWAY_ORAK_KEY to enable embeddings/RAG.",
        );
    }

    let res: Response;
    try {
        res = await fetch(gw.baseUrl + GATEWAY_EMBEDDINGS_PATH, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${gw.orakKey}`,
            },
            body: JSON.stringify({ model: gw.embeddingModel, input: texts }),
        });
    } catch (err: any) {
        throw new EmbeddingError(`Embedder unreachable: ${err?.message || "network error"}`);
    }

    if (!res.ok) {
        const errText = await res.text().catch(() => "unknown");
        throw new EmbeddingError(`Embedder returned ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json().catch(() => null);
    const items = data?.data;
    if (!Array.isArray(items) || items.length !== texts.length) {
        throw new EmbeddingError(
            `Embedder returned ${Array.isArray(items) ? items.length : "no"} vectors for ${texts.length} inputs`,
        );
    }

    // Preserve request order (OpenAI spec returns an `index` field).
    const ordered = [...items].sort((a: any, b: any) => (a.index ?? 0) - (b.index ?? 0));
    return ordered.map((item: any, i: number) => {
        const vec = item?.embedding;
        if (!Array.isArray(vec) || vec.length !== EMBEDDING_DIM) {
            throw new EmbeddingError(
                `Embedding ${i} has dimension ${Array.isArray(vec) ? vec.length : "n/a"}, expected ${EMBEDDING_DIM}`,
            );
        }
        return vec as number[];
    });
}

/** Convenience single-text embed. */
export async function embedText(text: string): Promise<number[]> {
    const [vec] = await embedTexts([text]);
    return vec;
}

/** Formats a numeric vector as a pgvector literal string, e.g. "[0.1,0.2,...]". */
export function toVectorLiteral(vec: number[]): string {
    return "[" + vec.join(",") + "]";
}
