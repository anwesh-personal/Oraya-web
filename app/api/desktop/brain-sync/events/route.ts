import { NextRequest, NextResponse } from "next/server";
import { authenticateDesktopRequest, isAuthError } from "@/lib/desktop-auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { e2eEvents, e2eLookupBrain, isBrainSyncE2e } from "@/lib/brain-sync/e2e-runtime";

export const runtime = "nodejs";

const MAX_PAGE_SIZE = 100;

/** Ordered, authenticated pull stream for every implemented brain faculty. */
export async function GET(request: NextRequest) {
    const auth = await authenticateDesktopRequest(request);
    if (isAuthError(auth)) return auth;

    const agentId = request.nextUrl.searchParams.get("agent_id");
    const rawCursor = request.nextUrl.searchParams.get("cursor") || "0";
    const cursor = Number(rawCursor);
    if (!agentId || !Number.isSafeInteger(cursor) || cursor < 0) {
        return NextResponse.json({ ok: false, code: "INVALID_CURSOR" }, { status: 422 });
    }

    const supabase = isBrainSyncE2e() ? null : createServiceRoleClient();
    let brain: any;
    try {
        brain = isBrainSyncE2e()
            ? e2eLookupBrain(agentId, auth.userId)
            : (await (supabase as any).from("agent_brains")
                .select("agent_id,synced_brain,sync_embedding_model")
                .eq("agent_id", agentId).eq("user_id", auth.userId).maybeSingle()).data;
    } catch {
        return NextResponse.json({ ok: false, code: "BRAIN_LOOKUP_FAILED" }, { status: 500 });
    }
    if (!brain?.synced_brain) return NextResponse.json({ ok: false, code: "SYNC_NOT_OPTED_IN" }, { status: 403 });

    let data: any[];
    try {
        data = isBrainSyncE2e()
            ? e2eEvents(agentId, auth.userId, cursor)
            : (await (supabase as any).from("agent_brain_events")
                .select("event_id,mutation_id,faculty,operation,content_hash,governance_hash,payload,revision,mutation_timestamp,origin")
                .eq("agent_id", agentId).eq("user_id", auth.userId).eq("anchor_accepted", true)
                .gt("event_id", cursor).order("event_id", { ascending: true }).limit(MAX_PAGE_SIZE)).data || [];
    } catch {
        return NextResponse.json({ ok: false, code: "PULL_FAILED" }, { status: 500 });
    }

    // For kb_chunk upserts, project the canonical pgvector-stored embedding (float4)
    // into the pulled payload so the desktop applies true DB state, not a re-echo.
    if (!isBrainSyncE2e()) {
        const kbHashes = data
            .filter((e: any) => e.faculty === "kb_chunk" && e.operation === "upsert")
            .map((e: any) => e.content_hash);
        if (kbHashes.length > 0) {
            try {
                const { data: chunkRows } = await (supabase as any).from("kb_chunks")
                    .select("content_hash,embedding").eq("agent_id", agentId).in("content_hash", kbHashes);
                const vectorByHash = new Map<string, string>((chunkRows || []).map((r: any) => [r.content_hash, r.embedding]));
                for (const e of data as any[]) {
                    const v = vectorByHash.get(e.content_hash);
                    if (e.faculty === "kb_chunk" && e.operation === "upsert" && typeof v === "string" && e.payload) {
                        e.payload.embedding = JSON.parse(v);
                    }
                }
            } catch { /* fall back to the ledger payload embedding — honest degrade */ }
        }
    }

    const events = data.map((event: any) => ({
        protocol_version: 1, mutation_id: event.mutation_id, agent_id: agentId,
        faculty: event.faculty, operation: event.operation, content: event.payload,
        content_hash: event.content_hash, governance_hash: event.governance_hash,
        timestamp: new Date(event.mutation_timestamp).toISOString(), origin: event.origin,
        revision: Number(event.revision), tombstone: event.operation === "tombstone",
        embedding_model: brain.sync_embedding_model, cursor: String(event.event_id),
    }));
    return NextResponse.json({
        ok: true, events, next_cursor: events.length ? events[events.length - 1].cursor : String(cursor),
        has_more: events.length === MAX_PAGE_SIZE,
    });
}
