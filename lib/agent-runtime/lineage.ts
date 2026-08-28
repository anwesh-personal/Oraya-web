// ============================================================================
// agent-runtime / lineage — AGL-001 local governance lineage (F7).
// ============================================================================
// Emits the canonical AGL-001 leaf at the point of inference and persists it
// LOCALLY (migration 054 `chatbot_lineage`). anchor_status starts as 'pending'
// — it is NEVER set to 'anchored' until a real verification confirms it.
// This record is what later powers "Verifiable Answer Mode."
//
// Best-effort: a failure to persist lineage (e.g. table not migrated live yet)
// NEVER breaks the chat turn. The computed leaf is always returned to the caller.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { InferenceSource } from "./types";
import { governanceLeafForInference, type GovernanceLeaf } from "./agl-hash";
import { asisClient } from "../asis-client";
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
 * Computes the AGL-001 leaf, persists a local lineage record, and asynchronously
 * dispatches the turn to the ASIS Sovereign ZKP & ML-DSA-65 Attestation Engine.
 */
export async function emitLineage(input: EmitLineageInput): Promise<GovernanceLeaf> {
    const { supabase, userId, deploymentId, conversationId, endUserId, input: userInput, output, model, source } = input;

    const ts = new Date().toISOString();
    const leaf = governanceLeafForInference({ input: userInput, output, modelId: model, timestamp: ts });

    try {
        const { data: lineageRow } = await supabase.from("chatbot_lineage").insert({
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
            anchor_status: "pending", // Honest: not yet verified — envelope presence is not a proof
        }).select("id").single();

        // Asynchronously dispatch to ASIS ZKP engine without blocking inference return
        const lineageId = lineageRow?.id;
        void (async () => {
            try {
                const attestation = await asisClient.attestGovernance({
                    model_id: leaf.modelId,
                    timestamp: ts,
                    input_hash: leaf.inputHash,
                    output_hash: leaf.outputHash,
                    governance_hash: leaf.governanceHash,
                });

                if (attestation && lineageId) {
                    // Honesty invariant (061 §B.2): insert with honest defaults.
                    // pqc_valid/zkp_valid are NOT set here — they must be determined
                    // by a real verification call, not by envelope presence.
                    // verification_status starts as 'pending' until a verifier confirms.
                    await supabase.from("asis_attestations").insert({
                        user_id: userId,
                        lineage_id: lineageId,
                        deployment_id: deploymentId,
                        model_id: leaf.modelId,
                        governance_hash: leaf.governanceHash,
                        input_hash: leaf.inputHash,
                        response_hash: leaf.outputHash,
                        leaf_timestamp: ts,
                        circuit_id: "governance-hash",
                        stark_proof_bytes: attestation.stark_proof ? Buffer.from(attestation.stark_proof, "hex") : null,
                        pqc_algorithm: attestation.metadata.algorithm,
                        pqc_signature: Buffer.from(attestation.signature).toString("hex"),
                        pqc_public_key: attestation.metadata.signer_public_key,
                        jurisdiction: attestation.metadata.jurisdiction || "US",
                        // Defaults from 060 migration: pqc_valid=false, zkp_valid=null,
                        // verification_status='pending', verified_at=null.
                        // A real /api/v1/verify call updates these after actual verification.
                    });
                }
            } catch (zkpErr: any) {
                logger.debug("[lineage] ASIS ZKP attestation dispatch failed", { error: zkpErr?.message });
            }
        })();
    } catch (err: any) {
        logger.debug("[lineage] persist skipped", { error: err?.message, deploymentId });
    }

    return leaf;
}
