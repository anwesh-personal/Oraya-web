// ============================================================================
// components/members/audit/types.ts — SaaS-side audit types
// ============================================================================
// These are the SaaS-local types that map to Supabase rows.
// For the shared contract types, see @orakhos/asis-ui types.ts (§C.1–C.4).
//
// Honesty invariant (061 §B.2): zkp_valid is boolean | null (null = not proven).
// verification_status includes 'unattested'. verified_at is string | null.
// ============================================================================

/** Row shape from asis_attestations table (Supabase snake_case) */
export interface AttestationRecord {
    id: string;
    user_id: string;
    lineage_id: string | null;
    deployment_id: string | null;
    model_id: string;
    governance_hash: string;
    input_hash: string;
    response_hash: string;
    leaf_timestamp: string;
    circuit_id: string;
    stark_proof_bytes: string | null;
    pqc_algorithm: string;
    pqc_signature: string;
    pqc_public_key: string;
    jurisdiction: string;
    pqc_valid: boolean;
    /** null = not proven / mock / offline — NEVER coerce true */
    zkp_valid: boolean | null;
    verification_status: "pending" | "verified_valid" | "verified_invalid" | "unattested";
    created_at: string;
    /** null = not yet verified */
    verified_at: string | null;
}

/** Pagination metadata */
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
}

/** Aggregate stats */
export interface AttestationStats {
    total: number;
    verified_valid: number;
    verified_invalid: number;
    pending: number;
    unattested: number;
    pass_rate: number;
    last_attestation_at: string | null;
    models: Record<string, number>;
}

/** ASIS engine health response */
export interface EngineHealth {
    status: string;
    uptime_seconds: number;
    public_key_hex: string;
    algorithm: string;
    prover_mode: "mock" | "cpu" | "cuda" | "unknown" | "offline";
}

/** Single config entry from asis_engine_config */
export interface EngineConfigEntry {
    value: any;
    label: string;
    description: string | null;
    category: string;
    is_editable: boolean;
    updated_at: string;
}

/** Full config map keyed by config_key */
export type EngineConfigMap = Record<string, EngineConfigEntry>;

/** Noetherian gate definition from config */
export interface NoetherianGateDefinition {
    gate_number: number;
    circuit_id: string;
    label: string;
    formula: string;
    threshold: string;
    description: string;
}
