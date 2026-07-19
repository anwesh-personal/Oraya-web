// ============================================================================
// agent-runtime / embeddings — per-widget gateway embedding client.
// ============================================================================
// Embeds text via the widget's OWN configured gateway (OpenAI-compatible
// /v1/embeddings). The embedder base URL + key + model are resolved PER WIDGET
// (see resolveWidgetGateway) — never from a global env var and never hardcoded.
//
// The dimension is FIXED by the `vector(1024)` DB columns (migration 053), so a
// mismatch FAILS LOUD here — we NEVER fabricate, hash, or truncate an embedding.
// ============================================================================

import type { GatewayConfig } from "./gateway";
import { buildEmbeddingsUrl } from "./gateway";

export const EMBEDDING_DIM = 1024;

export class EmbeddingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "EmbeddingError";
    }
}

/**
 * Embeds a batch of texts against the supplied per-widget gateway, returning one
 * 1024-dim vector per input in order. Throws EmbeddingError if the embedder is
 * unreachable, returns a non-OK status, or returns a vector of the wrong
 * dimension. NO silent fallback — the caller passes the widget's resolved
 * gateway or handles the OFF case explicitly.
 */
export async function embedTexts(texts: string[], gateway: GatewayConfig): Promise<number[][]> {
    if (texts.length === 0) return [];

    if (!gateway) {
        throw new EmbeddingError(
            "Embedder not configured for this widget. Configure the widget's provider " +
            "(base URL + key) and an explicit embedding model to enable embeddings/RAG.",
        );
    }

    let res: Response;
    try {
        res = await fetch(buildEmbeddingsUrl(gateway.baseUrl), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${gateway.orakKey}`,
            },
            body: JSON.stringify({ model: gateway.embeddingModel, input: texts }),
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

/** Convenience single-text embed against the widget's resolved gateway. */
export async function embedText(text: string, gateway: GatewayConfig): Promise<number[]> {
    const [vec] = await embedTexts([text], gateway);
    return vec;
}

/** Formats a numeric vector as a pgvector literal string, e.g. "[0.1,0.2,...]". */
export function toVectorLiteral(vec: number[]): string {
    return "[" + vec.join(",") + "]";
}
