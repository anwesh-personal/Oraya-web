/**
 * Local-only adapters for the composed portable-brain harness.
 *
 * They are deliberately reachable only when the test PostgreSQL URL and test
 * JWT secret are both supplied. Production routes retain their Supabase and
 * anchor transports.
 */
import { execFileSync } from "child_process";
import type { BrainMutationEnvelope } from "./contract";

export const isBrainSyncE2e = () =>
    process.env.BRAIN_SYNC_E2E_DATABASE_URL !== undefined &&
    process.env.BRAIN_SYNC_E2E_JWT_SECRET !== undefined;

function sql(value: string): string {
    return `'${value.replace(/'/g, "''")}'`;
}

function run(query: string): string {
    return execFileSync("psql", [
        process.env.BRAIN_SYNC_E2E_DATABASE_URL!,
        "-X", "-v", "ON_ERROR_STOP=1", "-At", "-c", query,
    ], { encoding: "utf8" }).trim();
}

export type E2eBrain = {
    agent_id: string;
    user_id: string;
    synced_brain: boolean;
    sync_embedding_model: string | null;
};

export function e2eLookupBrain(agentId: string, userId: string): E2eBrain | null {
    const output = run(`SELECT row_to_json(b)::text FROM (
        SELECT agent_id,user_id,synced_brain,sync_embedding_model
        FROM agent_brains WHERE agent_id=${sql(agentId)} AND user_id=${sql(userId)}::uuid
    ) b`);
    return output ? JSON.parse(output) : null;
}

export function e2eApplyMutation(userId: string, envelope: BrainMutationEnvelope) {
    const output = run(`SELECT row_to_json(r)::text FROM apply_agent_brain_mutation(
        ${sql(userId)}::uuid, ${sql(envelope.mutation_id)}, ${sql(envelope.agent_id)},
        ${sql(envelope.faculty)}, ${sql(envelope.operation)}, ${sql(envelope.content_hash)},
        ${sql(envelope.governance_hash)}, ${sql(JSON.stringify(envelope.content))}::jsonb,
        ${envelope.revision}, ${sql(envelope.timestamp)}::timestamptz, ${sql(envelope.origin)}
    ) r`);
    if (!output) throw new Error("Synced brain persistence returned no result");
    return JSON.parse(output) as { event_id: number; idempotent: boolean; applied: boolean };
}

export function e2eEvents(agentId: string, userId: string, cursor: number) {
    // For kb_chunk events, project the CANONICAL pgvector-stored embedding (float4)
    // rather than echoing the ledger array. This makes the pull reflect true DB
    // state and proves the bit-meaningful vector round-trip end to end.
    const output = run(`SELECT COALESCE(json_agg(row_to_json(e)), '[]'::json)::text FROM (
        SELECT e.event_id,e.mutation_id,e.faculty,e.operation,e.content_hash,e.governance_hash,e.payload,
               e.revision,e.mutation_timestamp,e.origin,
               (SELECT c.embedding::text FROM kb_chunks c
                  WHERE c.agent_id=e.agent_id AND c.content_hash=e.content_hash AND NOT c.tombstone
                  LIMIT 1) AS kb_vector
        FROM agent_brain_events e
        WHERE e.agent_id=${sql(agentId)} AND e.user_id=${sql(userId)}::uuid
          AND e.anchor_accepted=true AND e.event_id > ${cursor}
        ORDER BY e.event_id ASC LIMIT 100
    ) e`);
    const rows = JSON.parse(output || "[]") as Array<Record<string, any>>;
    for (const row of rows) {
        if (row.faculty === "kb_chunk" && typeof row.kb_vector === "string" && row.payload) {
            row.payload.embedding = JSON.parse(row.kb_vector);
        }
        delete row.kb_vector;
    }
    return rows;
}

/** DARK adapter: records local proof only; it contains no network transport. */
export function e2eDarkAnchor(envelope: BrainMutationEnvelope) {
    const requested = envelope.content.__e2e_dark_anchor_mode;
    const mode = (requested === "reject" || requested === "pending")
        ? requested
        : process.env.BRAIN_SYNC_E2E_DARK_ANCHOR_MODE ?? "accept";
    run(`INSERT INTO brain_sync_e2e_anchor_audit (mutation_id, mode, network_invoked)
         VALUES (${sql(envelope.mutation_id)}, ${sql(mode)}, false)`);
    return mode === "accept";
}
