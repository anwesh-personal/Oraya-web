-- ============================================================================
-- Migration 059: ASIS Engine Configuration — Dynamic Admin-Controlled Registry
-- ============================================================================
-- Single source of truth for all ASIS sovereign engine parameters displayed
-- in the CISO Audit Dashboard. Nothing is hardcoded in the frontend — every
-- label, threshold, algorithm name, and circuit list is read from this table.
--
-- Superadmins can update any config_value via the admin panel; changes
-- propagate to all connected dashboard clients on next fetch.
-- ============================================================================

CREATE TABLE IF NOT EXISTS asis_engine_config (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Lookup key: lowercase, dot-separated namespace
    config_key      TEXT NOT NULL UNIQUE,

    -- Structured value (JSONB for flexibility)
    config_value    JSONB NOT NULL,

    -- Organisational category for grouping in admin UI
    category        TEXT NOT NULL CHECK (category IN (
        'engine',      -- ZKP prover engine metadata
        'circuit',     -- Circuit definitions and thresholds
        'crypto',      -- PQC algorithm parameters
        'hardware',    -- Hardware sovereignty metadata
        'policy',      -- Attestation policies and compliance
        'display'      -- UI display preferences
    )),

    -- Human-readable label shown in admin config editor
    label           TEXT NOT NULL,

    -- Optional long-form description / help text
    description     TEXT,

    -- Whether this config can be edited from the UI (false = system-managed)
    is_editable     BOOLEAN NOT NULL DEFAULT true,

    -- Audit trail
    updated_by      UUID REFERENCES auth.users(id),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for category-based grouping in admin UI
CREATE INDEX IF NOT EXISTS idx_asis_engine_config_category
    ON asis_engine_config (category);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE asis_engine_config ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all config (powers the dashboard)
DROP POLICY IF EXISTS "asis_config_authenticated_read" ON asis_engine_config;
CREATE POLICY "asis_config_authenticated_read" ON asis_engine_config
    FOR SELECT USING (true);

-- Only service_role can insert/update/delete (superadmin API routes use service_role)
DROP POLICY IF EXISTS "asis_config_service_write" ON asis_engine_config;
CREATE POLICY "asis_config_service_write" ON asis_engine_config
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- Seed: Engine Metadata
-- ============================================================================

INSERT INTO asis_engine_config (config_key, config_value, category, label, description) VALUES
(
    'engine.zkp_prover',
    '{"name": "SP1 zkVM", "version": "6.4", "backend": "RISC-V", "target": "riscv64im-succinct-zkvm-elf"}'::jsonb,
    'engine',
    'ZKP Prover Engine',
    'The zero-knowledge proof engine used for STARK proof generation. SP1 compiles circuits to RISC-V and generates succinct proofs.'
),
(
    'engine.prover_mode',
    '{"current": "mock", "available": ["mock", "cpu", "cuda"], "target_hardware": "GB10 Blackwell"}'::jsonb,
    'engine',
    'Prover Mode',
    'Current proving backend. Mock for development, CPU for software proving, CUDA for GPU-accelerated sub-second proving on GB10.'
)
ON CONFLICT (config_key) DO NOTHING;

-- ============================================================================
-- Seed: Circuit Definitions
-- ============================================================================

INSERT INTO asis_engine_config (config_key, config_value, category, label, description) VALUES
(
    'circuit.active_circuits',
    '{"circuits": ["governance-hash", "conservation", "fiedler", "betti", "stcs"], "count": 5}'::jsonb,
    'circuit',
    'Active Circuits',
    'The set of compiled SP1 RISC-V guest programs currently loaded into the attestation engine.'
),
(
    'circuit.noetherian_gates',
    '[
        {
            "gate_number": 1,
            "circuit_id": "conservation",
            "label": "Conservation",
            "formula": "|ΔI(G)| ≤ ε",
            "threshold": "10⁻⁴",
            "description": "Verifies that the information-theoretic invariant of the governance graph is conserved within tolerance."
        },
        {
            "gate_number": 2,
            "circuit_id": "betti",
            "label": "Betti Topology",
            "formula": "β₁ ≤ k",
            "threshold": "5 Cycles",
            "description": "Checks that the first Betti number (number of independent cycles) in the governance topology stays below the structural ceiling."
        },
        {
            "gate_number": 3,
            "circuit_id": "fiedler",
            "label": "Fiedler λ₂",
            "formula": "λ₂ > τ_conn",
            "threshold": "τ_conn",
            "description": "Ensures algebraic connectivity of the governance graph exceeds the minimum connectivity threshold."
        },
        {
            "gate_number": 4,
            "circuit_id": "stcs",
            "label": "STCS Consistency",
            "formula": "STCS > 0.5",
            "threshold": "0.5",
            "description": "Validates the Spatio-Temporal Consistency Score remains above the structural coherence floor."
        }
    ]'::jsonb,
    'circuit',
    'Noetherian Invariant Gates',
    'The four mathematical invariant gates that every inference must pass. Each gate corresponds to a compiled SP1 circuit.'
)
ON CONFLICT (config_key) DO NOTHING;

-- ============================================================================
-- Seed: Cryptographic Parameters
-- ============================================================================

INSERT INTO asis_engine_config (config_key, config_value, category, label, description) VALUES
(
    'crypto.pqc_algorithm',
    '{
        "name": "ML-DSA-65",
        "standard": "FIPS 204",
        "security_level": "NIST Level 3",
        "signature_bytes": 3309,
        "public_key_bytes": 1952,
        "family": "Module-Lattice Digital Signature",
        "quantum_resistance": "Shor-immune (lattice-based)"
    }'::jsonb,
    'crypto',
    'Post-Quantum Signature Scheme',
    'The post-quantum digital signature algorithm used for Layer 2 attestation signing. ML-DSA-65 is the NIST-standardized successor to Dilithium.'
),
(
    'crypto.hash_algorithm',
    '{"name": "SHA-256", "output_bytes": 32, "standard": "FIPS 180-4"}'::jsonb,
    'crypto',
    'Hash Algorithm',
    'Cryptographic hash function used for governance hash computation and content binding.'
)
ON CONFLICT (config_key) DO NOTHING;

-- ============================================================================
-- Seed: Hardware Sovereignty
-- ============================================================================

INSERT INTO asis_engine_config (config_key, config_value, category, label, description) VALUES
(
    'hardware.sovereignty',
    '{
        "node_name": "GB10 Blackwell",
        "isolation_mode": "Self-Hosted",
        "cloud_provers": 0,
        "gpu": "NVIDIA Blackwell",
        "memory_gb": 128,
        "location": "US Sovereign Node #1"
    }'::jsonb,
    'hardware',
    'Hardware Sovereignty',
    'Physical hardware parameters for the sovereign proving enclave. Zero third-party cloud provers — all cryptographic operations execute on-premise.'
)
ON CONFLICT (config_key) DO NOTHING;

-- ============================================================================
-- Seed: Policy & Compliance
-- ============================================================================

INSERT INTO asis_engine_config (config_key, config_value, category, label, description) VALUES
(
    'policy.attestation_protocol',
    '{
        "protocol_id": "P-ASIS-002",
        "version": "1.0",
        "governance_standard": "AGL-001",
        "compliance_frameworks": ["SOC2 Type II", "ISO 27001", "NIST 800-53"],
        "compliance_certified": false,
        "claim_kind": "target",
        "jurisdiction": "US"
    }'::jsonb,
    'policy',
    'Attestation Protocol',
    'The sovereign attestation protocol identifier and TARGET compliance framework mappings. compliance_frameworks are declared targets — not achieved SOC2 / ISO 27001 / NIST certification.'
),
(
    'policy.export_formats',
    '{"formats": ["json", "pdf", "csv"], "default": "json"}'::jsonb,
    'policy',
    'Export Formats',
    'Available export formats for CISO attestation packs.'
)
ON CONFLICT (config_key) DO NOTHING;

-- ============================================================================
-- Seed: Display Preferences
-- ============================================================================

INSERT INTO asis_engine_config (config_key, config_value, category, label, description) VALUES
(
    'display.page_size',
    '{"default": 25, "options": [10, 25, 50, 100]}'::jsonb,
    'display',
    'Default Page Size',
    'Number of attestation records shown per page in the audit ledger.'
),
(
    'display.dashboard_title',
    '{"title": "Sovereign Cryptographic Audit Hub", "subtitle": "ASIS Zero-Knowledge Proof & Post-Quantum Attestation Engine"}'::jsonb,
    'display',
    'Dashboard Title',
    'Configurable title and subtitle for the CISO audit dashboard header.'
)
ON CONFLICT (config_key) DO NOTHING;

COMMENT ON TABLE asis_engine_config IS
'Admin-controlled configuration registry for the ASIS sovereign engine. Powers all dynamic UI elements in the CISO Audit Dashboard. No engine metadata is hardcoded in frontend code.';
