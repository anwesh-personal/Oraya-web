// ============================================================================
// agent-runtime / rag — Web RAG v2: ingestion + hybrid retrieval + citations.
// ============================================================================
// Ports the desktop RAG crown jewel onto pgvector (migration 053). Ingestion
// chunks a source, embeds each chunk via the sovereign gateway (1024d), and
// writes kb_sources + kb_chunks with denormalized citation metadata. Retrieval
// embeds the query and runs HYBRID retrieval (vector cosine + FTS, RRF-fused)
// via the `match_kb_chunks` RPC (migration 054), returning grounded chunks +
// deduped citations.
//
// FAIL-LOUD, NEVER-FAKE contract:
//   • No embedder configured        → RAG status 'off'   (behaves like no KB).
//   • KB exists but embedder/RPC fails at query time → 'degraded' (honest; the
//     answer proceeds WITHOUT grounding and the failure is surfaced/logged).
//   • KB exists, retrieval empty     → 'empty'.
//   • Retrieval returns rows          → 'grounded'.
//   • Ingestion NEVER writes a hash/fake vector; embedder failure marks the
//     source 'degraded' with the verbatim error.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { RagResult, RetrievedChunk, Citation } from "./types";
import { embedText, embedTexts, isEmbedderConfigured, toVectorLiteral, EMBEDDING_DIM } from "./embeddings";
import { getGatewayConfig } from "./gateway";
import { logger } from "../logger";

// ─── Chunking ────────────────────────────────────────────────────────────────

const CHUNK_TARGET_CHARS = 1000;
const CHUNK_OVERLAP_CHARS = 150;
const MAX_CHUNKS_PER_SOURCE = 500; // guardrail against runaway ingestion

/**
 * Paragraph-aware character chunker with overlap. Splits on blank lines first,
 * packs paragraphs up to the target size, and hard-splits any oversized
 * paragraph. Deterministic and dependency-free.
 */
export function chunkText(text: string): string[] {
    const clean = text.replace(/\r\n/g, "\n").trim();
    if (!clean) return [];

    const paragraphs = clean.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    const chunks: string[] = [];
    let buf = "";

    const flush = () => {
        const trimmed = buf.trim();
        if (trimmed) chunks.push(trimmed);
        buf = "";
    };

    for (const para of paragraphs) {
        if (para.length > CHUNK_TARGET_CHARS) {
            flush();
            // Hard-split the oversized paragraph with overlap.
            let start = 0;
            while (start < para.length) {
                const end = Math.min(start + CHUNK_TARGET_CHARS, para.length);
                chunks.push(para.slice(start, end).trim());
                if (end >= para.length) break;
                start = end - CHUNK_OVERLAP_CHARS;
                if (start < 0) start = 0;
            }
            continue;
        }
        if (buf.length + para.length + 2 > CHUNK_TARGET_CHARS) {
            flush();
        }
        buf += (buf ? "\n\n" : "") + para;
    }
    flush();

    return chunks.slice(0, MAX_CHUNKS_PER_SOURCE);
}

// ─── Ingestion ─────────────────────────────────────────────────────────────

export type KbSourceType = "document" | "url" | "sitemap" | "manual" | "structured";

export interface IngestInput {
    supabase: SupabaseClient;
    userId: string;
    deploymentId?: string | null;
    sourceType: KbSourceType;
    title: string;
    content: string;
    sourceUrl?: string | null;
    filePath?: string | null;
    mimeType?: string | null;
    metadata?: Record<string, any>;
}

export interface IngestResult {
    sourceId: string;
    chunkCount: number;
    status: "indexed" | "degraded";
    error?: string;
}

/**
 * Ingests a KB source: creates kb_sources, chunks + embeds the content, writes
 * kb_chunks, and finalizes the source lifecycle. Fail-loud on embedder failure
 * (marks the source 'degraded' with the verbatim error and rethrows).
 */
export async function ingestKbSource(input: IngestInput): Promise<IngestResult> {
    const { supabase, userId, deploymentId, sourceType, title, content, sourceUrl, filePath, mimeType, metadata } = input;

    if (!isEmbedderConfigured()) {
        throw new Error(
            "Cannot ingest: embedder not configured (ORAYA_GATEWAY_URL + ORAYA_GATEWAY_ORAK_KEY).",
        );
    }

    const gw = getGatewayConfig()!;
    const chunks = chunkText(content);
    if (chunks.length === 0) {
        throw new Error("Cannot ingest: content produced zero chunks.");
    }

    // Create the source row in 'indexing' state.
    const { data: source, error: srcErr } = await supabase
        .from("kb_sources")
        .insert({
            user_id: userId,
            deployment_id: deploymentId ?? null,
            source_type: sourceType,
            title,
            source_url: sourceUrl ?? null,
            file_path: filePath ?? null,
            mime_type: mimeType ?? null,
            embedding_model: gw.embeddingModel,
            embedding_dim: EMBEDDING_DIM,
            indexing_status: "indexing",
            metadata: metadata ?? {},
        })
        .select("id")
        .single();

    if (srcErr || !source) {
        throw new Error(`Failed to create kb_source: ${srcErr?.message || "unknown"}`);
    }

    const sourceId = source.id as string;

    try {
        // Embed in sub-batches to bound request size.
        const BATCH = 32;
        const embeddings: number[][] = [];
        for (let i = 0; i < chunks.length; i += BATCH) {
            const batch = chunks.slice(i, i + BATCH);
            const vecs = await embedTexts(batch);
            embeddings.push(...vecs);
        }

        const rows = chunks.map((content, i) => ({
            source_id: sourceId,
            user_id: userId,
            deployment_id: deploymentId ?? null,
            chunk_index: i,
            content,
            token_count: Math.ceil(content.length / 4),
            embedding: toVectorLiteral(embeddings[i]),
            source_title: title,
            source_url: sourceUrl ?? null,
        }));

        const { error: chunkErr } = await supabase.from("kb_chunks").insert(rows);
        if (chunkErr) throw new Error(`Failed to insert kb_chunks: ${chunkErr.message}`);

        await supabase
            .from("kb_sources")
            .update({
                indexing_status: "indexed",
                total_chunks: chunks.length,
                last_indexed_at: new Date().toISOString(),
                indexing_error: null,
            })
            .eq("id", sourceId);

        return { sourceId, chunkCount: chunks.length, status: "indexed" };
    } catch (err: any) {
        const message = err?.message || "ingestion failed";
        // Honest degraded state — never leave a half-indexed source looking healthy.
        await supabase
            .from("kb_sources")
            .update({ indexing_status: "degraded", indexing_error: message })
            .eq("id", sourceId);
        logger.error("[rag] ingestion degraded", err, { sourceId, deploymentId });
        throw err;
    }
}

// ─── Retrieval ───────────────────────────────────────────────────────────────

export interface RetrieveInput {
    supabase: SupabaseClient;
    userId: string;
    deploymentId: string;
    query: string;
    topK?: number;
}

const OFF: RagResult = { status: "off", chunks: [], citations: [] };

/**
 * Retrieves grounded context for a query via hybrid (vector + FTS, RRF) search.
 * Returns an honest RagResult; never throws to the caller (RAG must degrade, not
 * break the chat turn).
 */
export async function retrieveContext(input: RetrieveInput): Promise<RagResult> {
    const { supabase, userId, deploymentId, query, topK = 5 } = input;

    if (!isEmbedderConfigured()) return OFF;

    // Existence pre-check: is there any indexed KB for this deployment? Also
    // gracefully treats a missing table (RAG not migrated live) as 'off'.
    try {
        const { count, error } = await supabase
            .from("kb_sources")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("deployment_id", deploymentId)
            .eq("is_active", true)
            .eq("indexing_status", "indexed");
        if (error || !count || count === 0) return OFF;
    } catch {
        return OFF;
    }

    // KB exists → from here, any failure is an HONEST 'degraded' (not silent).
    let queryEmbedding: number[];
    try {
        queryEmbedding = await embedText(query);
    } catch (err: any) {
        logger.warn("[rag] query embed failed — degrading", { deploymentId, error: err?.message });
        return { status: "degraded", chunks: [], citations: [], error: err?.message || "embed failed" };
    }

    try {
        const { data, error } = await supabase.rpc("match_kb_chunks" as any, {
            p_user_id: userId,
            p_deployment_id: deploymentId,
            p_query_embedding: toVectorLiteral(queryEmbedding),
            p_query_text: query,
            p_match_count: topK,
        });
        if (error) {
            logger.warn("[rag] match_kb_chunks failed — degrading", { deploymentId, error: error.message });
            return { status: "degraded", chunks: [], citations: [], error: error.message };
        }

        const rows = (data as any[]) || [];
        if (rows.length === 0) return { status: "empty", chunks: [], citations: [] };

        const chunks: RetrievedChunk[] = rows.map((r) => ({
            chunk_id: r.chunk_id,
            source_id: r.source_id,
            content: r.content,
            source_title: r.source_title,
            source_url: r.source_url ?? null,
            score: typeof r.score === "number" ? r.score : 0,
        }));

        // Dedupe citations by source, preserving first-seen (best-ranked) order.
        const seen = new Set<string>();
        const citations: Citation[] = [];
        for (const c of chunks) {
            if (seen.has(c.source_id)) continue;
            seen.add(c.source_id);
            citations.push({ source_id: c.source_id, title: c.source_title, url: c.source_url });
        }

        return { status: "grounded", chunks, citations };
    } catch (err: any) {
        logger.warn("[rag] retrieval exception — degrading", { deploymentId, error: err?.message });
        return { status: "degraded", chunks: [], citations: [], error: err?.message || "retrieval failed" };
    }
}
