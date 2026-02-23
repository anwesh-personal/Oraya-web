-- ============================================================================
-- 030: Infrastructure & Orchestration Limits
-- ============================================================================
-- Adds support for local LLMs, custom VPS endpoints, and autonomous 
-- agent orchestration (Trinity Spawning) to the plan system.
-- ============================================================================

-- ─── 1. Add Columns to Plans ────────────────────────────────────────────────

ALTER TABLE plans
    ADD COLUMN IF NOT EXISTS allow_local_inference    BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS allow_ollama             BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS allow_vps_endpoints      BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS max_vps_endpoints        INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS allow_remote_agents      BOOLEAN DEFAULT FALSE,  -- For VPS-deployed agents
    ADD COLUMN IF NOT EXISTS autonomous_orchestration BOOLEAN DEFAULT FALSE,  -- Trinity Spawning
    ADD COLUMN IF NOT EXISTS max_concurrent_spawns    INTEGER DEFAULT 0;

-- ─── 2. Update Plan Tier Limits ─────────────────────────────────────────────

-- Standard ($20): High-status start, basic local OS feel.
UPDATE plans SET
    allow_local_inference = TRUE,
    allow_ollama = FALSE,
    allow_vps_endpoints = FALSE,
    max_vps_endpoints = 0,
    allow_remote_agents = FALSE,
    autonomous_orchestration = FALSE,
    max_concurrent_spawns = 0
WHERE id = 'standard';

-- Pro ($67): The "Sovereign" tier.
UPDATE plans SET
    allow_local_inference = TRUE,
    allow_ollama = TRUE,
    allow_vps_endpoints = TRUE,
    max_vps_endpoints = 3,
    allow_remote_agents = FALSE,
    autonomous_orchestration = FALSE,
    max_concurrent_spawns = 0
WHERE id = 'pro';

-- Team ($200): The "Orchestration" tier.
UPDATE plans SET
    allow_local_inference = TRUE,
    allow_ollama = TRUE,
    allow_vps_endpoints = TRUE,
    max_vps_endpoints = 10,
    allow_remote_agents = TRUE,
    autonomous_orchestration = TRUE,
    max_concurrent_spawns = 5
WHERE id = 'team';

-- Enterprise ($997): Total Dominion.
UPDATE plans SET
    allow_local_inference = TRUE,
    allow_ollama = TRUE,
    allow_vps_endpoints = TRUE,
    max_vps_endpoints = -1, -- Unlimited
    allow_remote_agents = TRUE,
    autonomous_orchestration = TRUE,
    max_concurrent_spawns = 25
WHERE id = 'enterprise';

-- ─── 3. Add to Audit Log Types ──────────────────────────────────────────────
-- Ensure these actions are recognized in the future

COMMENT ON COLUMN plans.autonomous_orchestration IS 'Allows Trinity agents to spawn ephemeral sub-agents for task delegation';
COMMENT ON COLUMN plans.allow_remote_agents IS 'Allows connecting agents deployed on external VPS or dedicated servers';
