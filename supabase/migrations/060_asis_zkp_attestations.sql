-- ============================================================================
-- Migration 060: ASIS Sovereign ZKP & ML-DSA-65 Attestations Ledger
-- ============================================================================
-- Renamed from 055_asis_zkp_attestations.sql — 055 was already taken by
-- 055_synced_agent_brain_foundation.sql (apply-order collision).
-- Files only this pass; do not apply against live Supabase without Boss.
-- ============================================================================
-- Extends the local lineage architecture with mathematical zero-knowledge
-- proofs (SP1 STARK) and quantum-resistant signatures (ML-DSA-65 / FIPS 204).
-- ============================================================================

CREATE TABLE IF NOT EXISTS asis_attestations (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lineage_id            UUID REFERENCES chatbot_lineage(id) ON DELETE CASCADE,
    deployment_id         UUID REFERENCES widget_deployments(id) ON DELETE CASCADE,
    
    -- Cryptographic Bindings
    model_id              TEXT NOT NULL,
    governance_hash       TEXT NOT NULL,           -- SHA-256(input_hash_hex||output_hash_hex||model_id||leaf_timestamp) per AGL-001
    input_hash            TEXT NOT NULL,
    response_hash         TEXT NOT NULL,
    leaf_timestamp        TEXT NOT NULL,
    
    -- ZKP STARK Data
    circuit_id            TEXT NOT NULL DEFAULT 'governance-hash',
    stark_proof_bytes     BYTEA,                   -- Compressed STARK proof receipt
    
    -- Post-Quantum Cryptography (PQC)
    pqc_algorithm         TEXT NOT NULL DEFAULT 'ML-DSA-65',
    pqc_signature         TEXT NOT NULL,           -- Hex encoded ML-DSA-65 signature (3309 bytes)
    pqc_public_key        TEXT NOT NULL,           -- Hex encoded ML-DSA-65 verifying key (1952 bytes)
    jurisdiction          TEXT NOT NULL DEFAULT 'US',
    
    -- Verification Lifecycle
    -- Honesty invariant (061 §B.2): never default to "verified" — envelope
    -- presence is NOT a proof. zkp_valid is nullable: null = not proven / mock.
    pqc_valid             BOOLEAN NOT NULL DEFAULT false,
    zkp_valid             BOOLEAN DEFAULT NULL,
    verification_status   TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified_valid', 'verified_invalid', 'unattested')),
    
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    verified_at           TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_asis_attestations_tenant
    ON asis_attestations (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_asis_attestations_gov_hash
    ON asis_attestations (governance_hash);
CREATE INDEX IF NOT EXISTS idx_asis_attestations_lineage
    ON asis_attestations (lineage_id);

ALTER TABLE asis_attestations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "asis_attestations_owner_read" ON asis_attestations;
CREATE POLICY "asis_attestations_owner_read" ON asis_attestations
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "asis_attestations_service" ON asis_attestations;
CREATE POLICY "asis_attestations_service" ON asis_attestations
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Public read policy for external CISO verification portal
DROP POLICY IF EXISTS "asis_attestations_public_verify" ON asis_attestations;
CREATE POLICY "asis_attestations_public_verify" ON asis_attestations
    FOR SELECT USING (true);

COMMENT ON TABLE asis_attestations IS
'Enterprise Sovereign ZKP & ML-DSA-65 Attestation Ledger. Stores cryptographic STARK proofs and post-quantum signatures for every validated intelligence turn.';
