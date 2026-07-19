// ============================================================================
// agent-runtime / lineage — AGL-001 local governance lineage (F7).
// ============================================================================
// Emits the canonical AGL-001 leaf at the point of inference and persists it
// LOCALLY (migration 054 `chatbot_lineage`). This is local-lineage ONLY — there
// is NO on-chain anchoring here (anchoring is unproven; anchor_status stays
// 'off'). This record is what later powers "Verifiable Answer Mode."
//
// Best-effort: a failure to persist lineage (e.g. table not migrated live yet)
// NEVER breaks the chat turn. The computed leaf is always returned to the caller.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { InferenceSource } from "./types";
import { governanceLeafForInference, type GovernanceLeaf } from "./agl-hash";
import { logger } from "../logger";

export interface EmitLineageInput {
    supabase: SupabaseClient;
    userId: string;                 // tenant
    deploymentId: string;
    conversationId?: string | null;
    endUserId?: string | null;
    input: string;                  // the user turn (hashed, never stored raw here)
    output: string;                 // the assistant answer
    model: string;                  // bound model id
    source: InferenceSource;        // sovereign-gateway | byok | managed
}

/**
 * Computes the AGL-001 leaf and persists a local lineage record. Returns the
 * leaf (with the exact bound timestamp) regardless of persistence success.
 */
export async function emitLineage(input: EmitLineageInput): Promise<GovernanceLeaf> {
    const { supabase, userId, deploymentId, conversationId, endUserId, input: userInput, output, model, source } = input;

    const ts = new Date().toISOString();
    const leaf = governanceLeafForInference({ input: userInput, output, modelId: model, timestamp: ts });

    try {
        await supabase.from("chatbot_lineage").insert({
            user_id: userId,
            deployment_id: deploymentId,
            conversation_id: conversationId ?? null,
            end_user_id: endUserId ?? null,
            channel: "web",
            model_id: leaf.modelId,
            inference_source: source,
            input_hash: leaf.inputHash,
            response_hash: leaf.outputHash,
            governance_hash: leaf.governanceHash,
            leaf_timestamp: ts,
            anchor_status: "off", // local-lineage only; no anchoring in this phase
        });
    } catch (err: any) {
        logger.debug("[lineage] persist skipped", { error: err?.message, deploymentId });
    }

    return leaf;
}
