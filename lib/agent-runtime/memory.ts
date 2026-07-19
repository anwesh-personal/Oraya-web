// ============================================================================
// agent-runtime / memory — end-user identity + memory (read/write).
// ============================================================================
// Ports the desktop memory layer onto Supabase (migrations 052 + 053).
//
// Identity (per the 1a integration note): widget api_key already resolved →
// user_id (tenant) + deployment_id. We upsert a `channel_identities` row
// (channel='web', channel_user_id = widget visitor_id), get/create the durable
// `end_users` person, and get/create a `channel_conversations` thread bridged to
// the legacy widget_sessions row via `widget_session_id`.
//
// Memory read: semantic recall (embedded memories, cosine order via RPC) + top
// long-term (importance/recency), injected as a prompt block; recalled rows are
// touched (access_count/last_accessed_at bumped).
// Memory write: conservative — a short-TTL 'working' note of the turn always,
// and an embedded 'episodic' memory only when the utterance carries a salient
// first-person fact. NEVER a fake embedding (CHECK enforces embedding on episodic).
//
// EVERYTHING here is BEST-EFFORT: any failure (including the 052/053 tables not
// being migrated on the live DB yet) is swallowed so the chat turn is never
// broken. Existing widgets therefore behave exactly as before.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResolvedIdentity, MemoryResult } from "./types";
import { embedText, isEmbedderConfigured, toVectorLiteral } from "./embeddings";
import { logger } from "../logger";

// ─── Identity resolution ─────────────────────────────────────────────────────

export interface ResolveIdentityInput {
    supabase: SupabaseClient;
    widget: any;             // needs id (deployment), user_id (tenant)
    visitorId: string;
    session: { id: string } | null; // legacy widget_sessions row (bridge)
    gateData?: { name?: string; email?: string; phone?: string } | null;
}

/**
 * Resolves (or creates) the durable web identity + conversation thread.
 * Returns null when identity can't be resolved (ephemeral / no session / tables
 * absent / any error) — the caller then simply runs without memory.
 */
export async function resolveIdentity(input: ResolveIdentityInput): Promise<ResolvedIdentity | null> {
    const { supabase, widget, visitorId, session, gateData } = input;
    if (!session?.id || !visitorId) return null;

    try {
        const userId = widget.user_id;
        const deploymentId = widget.id;

        // 1) Existing web identity for this visitor within the tenant?
        const { data: existingIdent } = await supabase
            .from("channel_identities")
            .select("id, end_user_id")
            .eq("user_id", userId)
            .eq("channel", "web")
            .eq("channel_user_id", visitorId)
            .maybeSingle();

        let endUserId: string;
        let channelIdentityId: string;

        if (existingIdent?.end_user_id) {
            endUserId = existingIdent.end_user_id;
            channelIdentityId = existingIdent.id;
            // Opportunistically enrich the person from gate data.
            if (gateData?.email || gateData?.name) {
                await supabase
                    .from("end_users")
                    .update({
                        ...(gateData.name ? { display_name: gateData.name } : {}),
                        ...(gateData.email ? { primary_email: gateData.email } : {}),
                        last_seen_at: new Date().toISOString(),
                    })
                    .eq("id", endUserId);
            } else {
                await supabase.from("end_users").update({ last_seen_at: new Date().toISOString() }).eq("id", endUserId);
            }
        } else {
            // 2) Create the person, then the identity.
            const { data: newUser, error: euErr } = await supabase
                .from("end_users")
                .insert({
                    user_id: userId,
                    display_name: gateData?.name ?? null,
                    primary_email: gateData?.email ?? null,
                    primary_phone: gateData?.phone ?? null,
                })
                .select("id")
                .single();
            if (euErr || !newUser) throw new Error(`end_users insert failed: ${euErr?.message}`);
            endUserId = newUser.id;

            // Upsert guards against a concurrent create for the same visitor.
            const { data: ident, error: ciErr } = await supabase
                .from("channel_identities")
                .upsert(
                    {
                        user_id: userId,
                        end_user_id: endUserId,
                        channel: "web",
                        channel_user_id: visitorId,
                        deployment_id: deploymentId,
                        display_name: gateData?.name ?? null,
                    },
                    { onConflict: "user_id,channel,channel_user_id" },
                )
                .select("id, end_user_id")
                .single();
            if (ciErr || !ident) throw new Error(`channel_identities upsert failed: ${ciErr?.message}`);
            channelIdentityId = ident.id;
            // If the upsert resolved to a pre-existing row, trust its end_user.
            if (ident.end_user_id && ident.end_user_id !== endUserId) endUserId = ident.end_user_id;
        }

        // 3) Get/create the conversation thread bridged to the legacy session.
        const { data: existingConv } = await supabase
            .from("channel_conversations")
            .select("id, memory_thread_id")
            .eq("user_id", userId)
            .eq("channel", "web")
            .eq("widget_session_id", session.id)
            .maybeSingle();

        if (existingConv?.id) {
            return {
                endUserId,
                channelIdentityId,
                conversationId: existingConv.id,
                memoryThreadId: existingConv.memory_thread_id,
            };
        }

        const { data: newConv, error: convErr } = await supabase
            .from("channel_conversations")
            .insert({
                user_id: userId,
                deployment_id: deploymentId,
                end_user_id: endUserId,
                channel_identity_id: channelIdentityId,
                channel: "web",
                widget_session_id: session.id,
            })
            .select("id, memory_thread_id")
            .single();
        if (convErr || !newConv) throw new Error(`channel_conversations insert failed: ${convErr?.message}`);

        return {
            endUserId,
            channelIdentityId,
            conversationId: newConv.id,
            memoryThreadId: newConv.memory_thread_id,
        };
    } catch (err: any) {
        logger.debug("[memory] identity resolution skipped", { error: err?.message });
        return null;
    }
}

// ─── Memory read ─────────────────────────────────────────────────────────────

export interface RecallInput {
    supabase: SupabaseClient;
    userId: string;
    endUserId: string;
    deploymentId: string;
    query: string;
    /** Optional precomputed query embedding (avoids a second embed call). */
    queryEmbedding?: number[];
    semanticK?: number;
    longTermK?: number;
}

/**
 * Recalls memory for the prompt: semantic (embedded, cosine via RPC) + top
 * long-term (importance/recency). Best-effort; returns { context, status }.
 */
export async function recallMemory(input: RecallInput): Promise<Pick<MemoryResult, "context" | "status" | "error">> {
    const { supabase, userId, endUserId, query, semanticK = 4, longTermK = 4 } = input;

    try {
        const lines: string[] = [];
        const recalledIds = new Set<string>();

        // Semantic recall (only when an embedder is available).
        if (isEmbedderConfigured()) {
            let emb = input.queryEmbedding;
            try {
                if (!emb) emb = await embedText(query);
            } catch (err: any) {
                logger.warn("[memory] semantic recall embed failed", { error: err?.message });
                emb = undefined;
            }
            if (emb) {
                const { data, error } = await supabase.rpc("match_end_user_memories" as any, {
                    p_user_id: userId,
                    p_end_user_id: endUserId,
                    p_query_embedding: toVectorLiteral(emb),
                    p_match_count: semanticK,
                });
                if (!error && Array.isArray(data)) {
                    for (const m of data as any[]) {
                        if (recalledIds.has(m.id)) continue;
                        recalledIds.add(m.id);
                        lines.push(`- ${m.content}`);
                    }
                }
            }
        }

        // Top long-term by importance/recency (index idx_eu_memories_ranked).
        const { data: longTerm } = await supabase
            .from("end_user_memories")
            .select("id, content")
            .eq("user_id", userId)
            .eq("end_user_id", endUserId)
            .in("kind", ["semantic", "episodic"])
            .order("importance", { ascending: false })
            .order("last_accessed_at", { ascending: false, nullsFirst: false })
            .limit(longTermK);
        if (Array.isArray(longTerm)) {
            for (const m of longTerm) {
                if (recalledIds.has(m.id)) continue;
                recalledIds.add(m.id);
                lines.push(`- ${m.content}`);
            }
        }

        if (recalledIds.size === 0) return { context: null, status: "active" };

        // Touch recalled rows (bump access_count/last_accessed_at) — best-effort.
        supabase
            .rpc("touch_end_user_memories" as any, { p_ids: Array.from(recalledIds) })
            .then(() => {}, () => {});

        return { context: lines.join("\n"), status: "active" };
    } catch (err: any) {
        logger.debug("[memory] recall skipped", { error: err?.message });
        return { context: null, status: "degraded", error: err?.message };
    }
}

// ─── Memory write ──────────────────────────────────────────────────────────

const SALIENCE_RE = /\b(i|i'm|im|my|mine|me|we|our|remember|prefer|always|never|call me|name is)\b/i;
const WORKING_TTL_DAYS = 14;

export interface WriteInput {
    supabase: SupabaseClient;
    userId: string;
    endUserId: string;
    deploymentId: string;
    conversationId: string;
    userMessage: string;
}

/**
 * Conservatively persists memory for a turn:
 *   • a short-TTL 'working' note (no embedding) for thread continuity, and
 *   • an embedded 'episodic' memory ONLY when the utterance carries a salient
 *     first-person fact (and an embedder is available — never a fake vector).
 * Best-effort; intended to be called AFTER the response is sent (fire-and-forget).
 */
export async function writeMemory(input: WriteInput): Promise<void> {
    const { supabase, userId, endUserId, deploymentId, conversationId, userMessage } = input;
    const msg = userMessage.trim();
    if (!msg) return;

    try {
        // Working memory: cheap, unembedded, TTL'd short-term note.
        const expiresAt = new Date(Date.now() + WORKING_TTL_DAYS * 86_400_000).toISOString();
        await supabase.from("end_user_memories").insert({
            user_id: userId,
            end_user_id: endUserId,
            deployment_id: deploymentId,
            conversation_id: conversationId,
            kind: "working",
            content: `User said: ${msg.slice(0, 500)}`,
            importance: 0.3,
            expires_at: expiresAt,
        });

        // Episodic memory: only for salient, substantial first-person utterances.
        if (msg.length >= 24 && SALIENCE_RE.test(msg) && isEmbedderConfigured()) {
            let emb: number[] | null = null;
            try {
                emb = await embedText(msg);
            } catch (err: any) {
                logger.warn("[memory] episodic embed failed — skipping episodic write", { error: err?.message });
            }
            if (emb) {
                await supabase.from("end_user_memories").insert({
                    user_id: userId,
                    end_user_id: endUserId,
                    deployment_id: deploymentId,
                    conversation_id: conversationId,
                    kind: "episodic",
                    content: msg.slice(0, 1000),
                    embedding: toVectorLiteral(emb),
                    importance: 0.55,
                    decay_rate: 0.01,
                });
            }
        }
    } catch (err: any) {
        logger.debug("[memory] write skipped", { error: err?.message });
    }
}
