import { NextRequest, NextResponse } from "next/server";
import { authenticateDesktopRequest, isAuthError } from "@/lib/desktop-auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
    type BrainMutationEnvelope,
    validateBrainMutation,
} from "@/lib/brain-sync/contract";
import {
    e2eApplyMutation,
    e2eDarkAnchor,
    e2eLookupBrain,
    isBrainSyncE2e,
} from "@/lib/brain-sync/e2e-runtime";

export const runtime = "nodejs";

type AnchorReceipt = { accepted?: boolean; request_id?: string; governance_hash?: string };

async function anchorMutation(envelope: BrainMutationEnvelope): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
    if (isBrainSyncE2e()) {
        return e2eDarkAnchor(envelope)
            ? { ok: true }
            : { ok: false, status: 503, error: "DARK anchor did not accept mutation" };
    }
    const serviceUrl = process.env.AGL_ANCHOR_SERVICE_URL;
    const token = process.env.AGL_ANCHOR_SERVICE_TOKEN;
    if (!serviceUrl || !token) {
        return { ok: false, status: 503, error: "Synced brain unavailable: anchor service is not configured" };
    }
    const response = await fetch(`${serviceUrl.replace(/\/$/, "")}/anchor`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
            request_id: envelope.content_hash,
            governance_hash: envelope.governance_hash,
            model_id: `brain.${envelope.faculty}:${envelope.embedding_model}`,
            event_kind: `brain.${envelope.faculty}.${envelope.operation}`,
            ts: envelope.timestamp,
        }),
    });
    const body = await response.json().catch(() => null) as AnchorReceipt | null;
    if (response.status !== 202 || body?.accepted !== true) {
        return { ok: false, status: 502, error: "Anchor service did not accept mutation" };
    }
    return { ok: true };
}

export async function POST(request: NextRequest) {
    const auth = await authenticateDesktopRequest(request);
    if (isAuthError(auth)) return auth;

    const parsed = validateBrainMutation(await request.json().catch(() => null));
    if (!parsed.ok) return NextResponse.json({ ok: false, code: "INVALID_MUTATION", error: parsed.error }, { status: 422 });
    const envelope = parsed.envelope;
    if (!["core_prompt", "memory", "prompt_stack", "behavioral_rule", "training", "kb_doc", "kb_chunk", "kg_entity", "kg_edge"].includes(envelope.faculty)) {
        return NextResponse.json({ ok: false, code: "FACULTY_NOT_WIRED", error: `${envelope.faculty} is not writable in this vertical slice` }, { status: 409 });
    }

    const supabase = isBrainSyncE2e() ? null : createServiceRoleClient();
    let brain: any;
    try {
        brain = isBrainSyncE2e()
            ? e2eLookupBrain(envelope.agent_id, auth.userId)
            : (await (supabase as any).from("agent_brains")
                .select("agent_id,user_id,synced_brain,sync_embedding_model")
                .eq("agent_id", envelope.agent_id).eq("user_id", auth.userId).maybeSingle()).data;
    } catch {
        return NextResponse.json({ ok: false, code: "BRAIN_LOOKUP_FAILED" }, { status: 500 });
    }
    if (!brain || !brain.synced_brain) return NextResponse.json({ ok: false, code: "SYNC_NOT_OPTED_IN", error: "Agent is local-only" }, { status: 403 });
    if (brain.sync_embedding_model !== envelope.embedding_model) {
        return NextResponse.json({ ok: false, code: "EMBEDDING_MODEL_MISMATCH", error: "Pinned embedding model does not match mutation" }, { status: 409 });
    }

    // The server is the anchor producer for cloud persistence. This exact
    // request shape matches the existing anchor-service contract.
    const anchor = await anchorMutation(envelope);
    if (!anchor.ok) return NextResponse.json({ ok: false, code: "ANCHOR_REJECTED", error: anchor.error }, { status: anchor.status });

    // A single database function serializes receiver persistence, replay
    // detection, the LWW decision, and the append-only pull ledger.
    let result: any;
    let persistenceError: any;
    try {
        result = isBrainSyncE2e()
            ? e2eApplyMutation(auth.userId, envelope)
            : (await (supabase as any).rpc("apply_agent_brain_mutation", {
                p_user_id: auth.userId, p_mutation_id: envelope.mutation_id, p_agent_id: envelope.agent_id,
                p_faculty: envelope.faculty, p_operation: envelope.operation, p_content_hash: envelope.content_hash,
                p_governance_hash: envelope.governance_hash, p_payload: envelope.content, p_revision: envelope.revision,
                p_mutation_timestamp: envelope.timestamp, p_origin: envelope.origin,
            })).data?.[0];
    } catch (error) {
        persistenceError = error;
    }
    if (persistenceError || !result) {
        const message = String(persistenceError || "Synced brain persistence failed");
        const code = message.includes("SYNC_NOT_OPTED_IN") ? "SYNC_NOT_OPTED_IN" : "PERSIST_FAILED";
        return NextResponse.json({ ok: false, code, error: message }, { status: code === "SYNC_NOT_OPTED_IN" ? 403 : 500 });
    }

    return NextResponse.json({
        ok: true, persisted: true, idempotent: result.idempotent === true,
        applied: result.applied === true, cursor: String(result.event_id),
        governance_hash: envelope.governance_hash, anchor_accepted: true,
    });
}
