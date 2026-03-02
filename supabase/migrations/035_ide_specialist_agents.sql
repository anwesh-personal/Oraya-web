-- ============================================================================
-- 035: IDE Specialist Agents — Cloud Data Model
-- ============================================================================
-- Extends the Supabase schema to support agent-backed MCP sessions with
-- plan-tier gating, IDE specialization mapping, and centralized configuration.
--
-- This is the CLOUD source of truth for specialist agents. The desktop syncs
-- from these tables via the existing agent template sync pipeline.
--
-- Tables created:
--   ide_specialist_registry — maps agent templates to IDE specializations
--
-- Tables modified:
--   agent_templates — adds is_ide_specialist, ide_specializations, default_memory_mode
--   ide_clients     — adds default_agent_template_id, default_memory_mode
--   plans           — adds allowed_specialist_ids for granular specialist gating
--
-- Functions created:
--   get_specialist_for_ide() — resolves the best specialist for an IDE + plan
--   get_user_specialists()   — returns all specialists available to a user
-- ============================================================================


-- ============================================================================
-- 1. EXTEND agent_templates
-- ============================================================================

-- Flag to distinguish IDE specialists from regular agent templates
ALTER TABLE agent_templates
    ADD COLUMN IF NOT EXISTS is_ide_specialist BOOLEAN NOT NULL DEFAULT false;

-- JSON array of IDE client names this specialist supports
-- e.g. ['cursor', 'antigravity'] for Axon
ALTER TABLE agent_templates
    ADD COLUMN IF NOT EXISTS ide_specializations TEXT[] DEFAULT '{}';

-- Default memory mode when this specialist backs a session
-- ephemeral | session_log | memory_extract | full
ALTER TABLE agent_templates
    ADD COLUMN IF NOT EXISTS default_memory_mode TEXT NOT NULL DEFAULT 'memory_extract'
        CHECK (default_memory_mode IN ('ephemeral', 'session_log', 'memory_extract', 'full'));

-- Specialist-specific system prompt additions
-- This is appended to the core_prompt when the agent backs an IDE session.
-- It contains IDE-specific instructions (e.g. "You are backing a Cursor session...")
ALTER TABLE agent_templates
    ADD COLUMN IF NOT EXISTS ide_system_prompt TEXT DEFAULT '';

-- Index for quick specialist lookups
CREATE INDEX IF NOT EXISTS idx_agent_templates_specialist
    ON agent_templates (is_ide_specialist)
    WHERE is_ide_specialist = true;


-- ============================================================================
-- 2. IDE SPECIALIST REGISTRY
-- ============================================================================
-- Maps agent templates to IDE client names with priority and plan-tier gating.
-- This is the cloud authority — synced down to desktop instances.
-- ============================================================================

CREATE TABLE IF NOT EXISTS ide_specialist_registry (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- References
    agent_template_id   UUID NOT NULL REFERENCES agent_templates(id) ON DELETE CASCADE,
    ide_client_name     TEXT NOT NULL,   -- e.g. 'cursor', 'windsurf', 'claude_desktop'

    -- Recommendation
    priority            INTEGER NOT NULL DEFAULT 100,
                                        -- lower = higher recommendation
                                        -- system specialists: 10-20
                                        -- user-created: 50+
    is_recommended      BOOLEAN NOT NULL DEFAULT true,

    -- Plan-tier gating
    -- Controls which plan tiers can use this specialist for this IDE.
    -- Uses the same tier names as agent_templates.plan_tier.
    min_plan_tier       TEXT NOT NULL DEFAULT 'pro'
                        CHECK (min_plan_tier IN ('standard', 'pro', 'team', 'enterprise')),

    -- Metadata
    specialization_notes TEXT,
    is_system           BOOLEAN NOT NULL DEFAULT false,

    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- One agent template can only be registered once per IDE
    UNIQUE(agent_template_id, ide_client_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ide_spec_reg_client
    ON ide_specialist_registry(ide_client_name);
CREATE INDEX IF NOT EXISTS idx_ide_spec_reg_template
    ON ide_specialist_registry(agent_template_id);
CREATE INDEX IF NOT EXISTS idx_ide_spec_reg_priority
    ON ide_specialist_registry(ide_client_name, priority);
CREATE INDEX IF NOT EXISTS idx_ide_spec_reg_tier
    ON ide_specialist_registry(min_plan_tier);

-- RLS: Authenticated users can read (to show available specialists in desktop)
ALTER TABLE ide_specialist_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read specialist registry" ON ide_specialist_registry;
CREATE POLICY "Authenticated users can read specialist registry" ON ide_specialist_registry
    FOR SELECT
    TO authenticated
    USING (true);

-- Only service_role can insert/update/delete (superadmin managed)
DROP POLICY IF EXISTS "Service role manages specialist registry" ON ide_specialist_registry;
CREATE POLICY "Service role manages specialist registry" ON ide_specialist_registry
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_ide_specialist_registry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ide_spec_reg_updated_at ON ide_specialist_registry;
CREATE TRIGGER trigger_ide_spec_reg_updated_at
    BEFORE UPDATE ON ide_specialist_registry
    FOR EACH ROW
    EXECUTE FUNCTION update_ide_specialist_registry_updated_at();


-- ============================================================================
-- 3. EXTEND ide_clients (Supabase version)
-- ============================================================================

-- Default agent template to bind for sessions from this IDE
ALTER TABLE ide_clients
    ADD COLUMN IF NOT EXISTS default_agent_template_id UUID REFERENCES agent_templates(id) ON DELETE SET NULL;

-- Default memory mode for sessions from this IDE
ALTER TABLE ide_clients
    ADD COLUMN IF NOT EXISTS default_memory_mode TEXT NOT NULL DEFAULT 'memory_extract'
        CHECK (default_memory_mode IN ('ephemeral', 'session_log', 'memory_extract', 'full'));


-- ============================================================================
-- 4. EXTEND plans — granular specialist gating
-- ============================================================================

-- Array of specialist registry IDs explicitly allowed for this plan
-- (in addition to the hierarchical tier check)
ALTER TABLE plans
    ADD COLUMN IF NOT EXISTS allowed_specialist_ids UUID[] DEFAULT '{}';


-- ============================================================================
-- 5. RPC: get_specialist_for_ide
-- ============================================================================
-- Resolves the best-match specialist for a given IDE client name and user plan.
-- Used by the desktop sync endpoint to determine which specialist to bind.
--
-- Returns NULL if no specialist is available for this IDE+plan combo
-- (desktop falls back to the generic oraya_ide_gateway).
-- ============================================================================

CREATE OR REPLACE FUNCTION get_specialist_for_ide(
    p_user_id        UUID,
    p_ide_client_name TEXT
)
RETURNS TABLE (
    registry_id         UUID,
    agent_template_id   UUID,
    template_name       TEXT,
    template_emoji      TEXT,
    priority            INTEGER,
    default_memory_mode TEXT,
    min_plan_tier       TEXT,
    specialization_notes TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    WITH user_plan AS (
        SELECT
            COALESCE(ul.plan_id, 'standard') AS plan_id,
            COALESCE(p.allowed_specialist_ids, '{}') AS allowed_specialist_ids
        FROM auth.users u
        LEFT JOIN user_licenses ul
            ON ul.user_id = u.id AND ul.status = 'active'
        LEFT JOIN plans p ON p.id = ul.plan_id
        WHERE u.id = p_user_id
        ORDER BY plan_tier_rank(COALESCE(ul.plan_id, 'standard')) DESC NULLS LAST
        LIMIT 1
    )
    SELECT
        r.id                    AS registry_id,
        r.agent_template_id,
        t.name                  AS template_name,
        t.emoji                 AS template_emoji,
        r.priority,
        t.default_memory_mode,
        r.min_plan_tier,
        r.specialization_notes
    FROM ide_specialist_registry r
    JOIN agent_templates t ON t.id = r.agent_template_id
    CROSS JOIN user_plan up
    WHERE r.ide_client_name = p_ide_client_name
      AND r.is_recommended = true
      AND t.is_active = true
      AND (
          -- Tier hierarchy check
          plan_tier_rank(r.min_plan_tier) <= plan_tier_rank(up.plan_id)
          -- OR explicitly allowed
          OR r.id = ANY(up.allowed_specialist_ids)
      )
    ORDER BY r.priority ASC
    LIMIT 1;
$$;


-- ============================================================================
-- 6. RPC: get_user_specialists
-- ============================================================================
-- Returns ALL specialists available to a user across all IDEs.
-- Used by the desktop to pre-cache specialist data and show the specialist
-- picker in the Gatekeeper UI.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_specialists(p_user_id UUID)
RETURNS TABLE (
    registry_id         UUID,
    agent_template_id   UUID,
    template_name       TEXT,
    template_emoji      TEXT,
    ide_client_name     TEXT,
    priority            INTEGER,
    is_recommended      BOOLEAN,
    default_memory_mode TEXT,
    min_plan_tier       TEXT,
    specialization_notes TEXT,
    ide_system_prompt   TEXT,
    core_prompt         TEXT,
    personality_config  JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    WITH user_plan AS (
        SELECT
            COALESCE(ul.plan_id, 'standard') AS plan_id,
            COALESCE(p.allowed_specialist_ids, '{}') AS allowed_specialist_ids
        FROM auth.users u
        LEFT JOIN user_licenses ul
            ON ul.user_id = u.id AND ul.status = 'active'
        LEFT JOIN plans p ON p.id = ul.plan_id
        WHERE u.id = p_user_id
        ORDER BY plan_tier_rank(COALESCE(ul.plan_id, 'standard')) DESC NULLS LAST
        LIMIT 1
    )
    SELECT
        r.id                    AS registry_id,
        r.agent_template_id,
        t.name                  AS template_name,
        t.emoji                 AS template_emoji,
        r.ide_client_name,
        r.priority,
        r.is_recommended,
        t.default_memory_mode,
        r.min_plan_tier,
        r.specialization_notes,
        t.ide_system_prompt,
        t.core_prompt,
        t.personality_config
    FROM ide_specialist_registry r
    JOIN agent_templates t ON t.id = r.agent_template_id
    CROSS JOIN user_plan up
    WHERE t.is_active = true
      AND t.is_ide_specialist = true
      AND (
          plan_tier_rank(r.min_plan_tier) <= plan_tier_rank(up.plan_id)
          OR r.id = ANY(up.allowed_specialist_ids)
      )
    ORDER BY r.ide_client_name, r.priority ASC;
$$;


-- ============================================================================
-- 7. SEED SPECIALIST AGENT TEMPLATES
-- ============================================================================
-- These are the cloud-authoritative versions of the 4 specialists.
-- The core_prompt is intentionally empty here — it will be hydrated by the
-- superadmin via the Specialist Management UI with IDE-specific training,
-- prompts, and KB references.
-- ============================================================================

-- Create a partial unique index to support the ON CONFLICT upsert below.
-- This ensures Oraya-authored templates have unique names (user templates can reuse names).
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_templates_name_oraya
    ON agent_templates (name) WHERE author = 'Oraya';

INSERT INTO agent_templates (
    name, emoji, role, tagline, description,
    core_prompt, personality_config,
    plan_tier, is_active, version, author, category, tags,
    is_ide_specialist, ide_specializations, default_memory_mode, ide_system_prompt
) VALUES
(
    'Axon', '⚡', 'assistant',
    'Cursor & Antigravity specialist',
    'Your AI coding partner for Cursor and Antigravity. Expert in Composer patterns, multi-file editing, and .cursorrules. Remembers your coding preferences across sessions.',
    '',
    '{"tone":"precise","verbosity":"concise","style":"technical","response_length":"adaptive"}'::JSONB,
    'pro', true, '1.0', 'Oraya', 'ide_specialist',
    ARRAY['cursor', 'antigravity', 'ide_specialist'],
    true,
    ARRAY['cursor', 'antigravity'],
    'memory_extract',
    ''
),
(
    'Cipher', '🔐', 'assistant',
    'Claude Desktop & Claude Code specialist',
    'Your AI partner for Claude Desktop and Claude Code. Expert in extended thinking, artifact systems, and structured reasoning. Carries context between Claude sessions.',
    '',
    '{"tone":"analytical","verbosity":"balanced","style":"structured","response_length":"thorough"}'::JSONB,
    'pro', true, '1.0', 'Oraya', 'ide_specialist',
    ARRAY['claude', 'ide_specialist'],
    true,
    ARRAY['claude_desktop'],
    'memory_extract',
    ''
),
(
    'Pulse', '💜', 'assistant',
    'VS Code, Copilot, Cline & RooCode specialist',
    'Your AI partner for the VS Code ecosystem. Works seamlessly with Copilot Chat, Cline, and RooCode. Understands VS Code extensions and workspace patterns.',
    '',
    '{"tone":"friendly","verbosity":"moderate","style":"practical","response_length":"concise"}'::JSONB,
    'pro', true, '1.0', 'Oraya', 'ide_specialist',
    ARRAY['vscode', 'copilot', 'cline', 'ide_specialist'],
    true,
    ARRAY['copilot', 'cline', 'roocode'],
    'memory_extract',
    ''
),
(
    'Drift', '🌊', 'assistant',
    'Windsurf & Zed specialist',
    'Your AI partner for Windsurf IDE and Zed. Expert in Cascade flow, Codeium patterns, and context-server integration. Adapts to agentic coding workflows.',
    '',
    '{"tone":"flowing","verbosity":"adaptive","style":"agentive","response_length":"contextual"}'::JSONB,
    'pro', true, '1.0', 'Oraya', 'ide_specialist',
    ARRAY['windsurf', 'zed', 'ide_specialist'],
    true,
    ARRAY['windsurf', 'zed'],
    'memory_extract',
    ''
)
ON CONFLICT (name) WHERE author = 'Oraya'
DO UPDATE SET
    is_ide_specialist   = EXCLUDED.is_ide_specialist,
    ide_specializations = EXCLUDED.ide_specializations,
    default_memory_mode = EXCLUDED.default_memory_mode,
    ide_system_prompt   = EXCLUDED.ide_system_prompt,
    tagline             = EXCLUDED.tagline,
    description         = EXCLUDED.description,
    personality_config  = EXCLUDED.personality_config,
    category            = EXCLUDED.category,
    tags                = EXCLUDED.tags,
    updated_at          = now();


-- ============================================================================
-- 8. SEED SPECIALIST REGISTRY
-- ============================================================================

-- We need the template IDs. Use a DO block to look them up.
DO $$
DECLARE
    t_axon   UUID;
    t_cipher UUID;
    t_pulse  UUID;
    t_drift  UUID;
BEGIN
    SELECT id INTO t_axon   FROM agent_templates WHERE name = 'Axon'   AND author = 'Oraya' LIMIT 1;
    SELECT id INTO t_cipher FROM agent_templates WHERE name = 'Cipher' AND author = 'Oraya' LIMIT 1;
    SELECT id INTO t_pulse  FROM agent_templates WHERE name = 'Pulse'  AND author = 'Oraya' LIMIT 1;
    SELECT id INTO t_drift  FROM agent_templates WHERE name = 'Drift'  AND author = 'Oraya' LIMIT 1;

    -- Axon → Cursor (primary), Antigravity (secondary)
    INSERT INTO ide_specialist_registry (agent_template_id, ide_client_name, priority, is_recommended, min_plan_tier, specialization_notes, is_system)
    VALUES (t_axon, 'cursor', 10, true, 'pro',
            'Primary specialist for Cursor. Expert in Composer patterns, multi-file editing, and .cursorrules.', true)
    ON CONFLICT (agent_template_id, ide_client_name) DO NOTHING;

    INSERT INTO ide_specialist_registry (agent_template_id, ide_client_name, priority, is_recommended, min_plan_tier, specialization_notes, is_system)
    VALUES (t_axon, 'antigravity', 10, true, 'pro',
            'Antigravity uses similar agentic patterns to Cursor. Axon handles both.', true)
    ON CONFLICT (agent_template_id, ide_client_name) DO NOTHING;

    -- Cipher → Claude Desktop
    INSERT INTO ide_specialist_registry (agent_template_id, ide_client_name, priority, is_recommended, min_plan_tier, specialization_notes, is_system)
    VALUES (t_cipher, 'claude_desktop', 10, true, 'pro',
            'Primary specialist for Claude Desktop and Claude Code. Expert in extended thinking and artifact system.', true)
    ON CONFLICT (agent_template_id, ide_client_name) DO NOTHING;

    -- Pulse → Copilot, Cline, RooCode
    INSERT INTO ide_specialist_registry (agent_template_id, ide_client_name, priority, is_recommended, min_plan_tier, specialization_notes, is_system)
    VALUES (t_pulse, 'copilot', 10, true, 'pro',
            'Primary specialist for GitHub Copilot in VS Code.', true)
    ON CONFLICT (agent_template_id, ide_client_name) DO NOTHING;

    INSERT INTO ide_specialist_registry (agent_template_id, ide_client_name, priority, is_recommended, min_plan_tier, specialization_notes, is_system)
    VALUES (t_pulse, 'cline', 15, true, 'pro',
            'Cline runs in VS Code. Pulse handles its agentic loop.', true)
    ON CONFLICT (agent_template_id, ide_client_name) DO NOTHING;

    INSERT INTO ide_specialist_registry (agent_template_id, ide_client_name, priority, is_recommended, min_plan_tier, specialization_notes, is_system)
    VALUES (t_pulse, 'roocode', 15, true, 'pro',
            'RooCode runs in VS Code. Pulse handles its multi-agent patterns.', true)
    ON CONFLICT (agent_template_id, ide_client_name) DO NOTHING;

    -- Drift → Windsurf, Zed
    INSERT INTO ide_specialist_registry (agent_template_id, ide_client_name, priority, is_recommended, min_plan_tier, specialization_notes, is_system)
    VALUES (t_drift, 'windsurf', 10, true, 'pro',
            'Primary specialist for Windsurf IDE. Expert in Cascade flow.', true)
    ON CONFLICT (agent_template_id, ide_client_name) DO NOTHING;

    INSERT INTO ide_specialist_registry (agent_template_id, ide_client_name, priority, is_recommended, min_plan_tier, specialization_notes, is_system)
    VALUES (t_drift, 'zed', 20, true, 'enterprise',
            'Zed uses context-server MCP. Drift adapts its agentive patterns.', true)
    ON CONFLICT (agent_template_id, ide_client_name) DO NOTHING;

    RAISE NOTICE 'Seeded specialist registry: Axon=%, Cipher=%, Pulse=%, Drift=%',
        t_axon, t_cipher, t_pulse, t_drift;
END;
$$;


-- ============================================================================
-- 9. UPDATE ide_clients: set default specialist templates
-- ============================================================================
-- Only update rows that don't already have a default set.
-- ============================================================================

UPDATE ide_clients SET default_agent_template_id = (
    SELECT id FROM agent_templates WHERE name = 'Axon' AND author = 'Oraya' LIMIT 1
) WHERE name = 'cursor' AND default_agent_template_id IS NULL;

UPDATE ide_clients SET default_agent_template_id = (
    SELECT id FROM agent_templates WHERE name = 'Axon' AND author = 'Oraya' LIMIT 1
) WHERE name = 'antigravity' AND default_agent_template_id IS NULL;

UPDATE ide_clients SET default_agent_template_id = (
    SELECT id FROM agent_templates WHERE name = 'Cipher' AND author = 'Oraya' LIMIT 1
) WHERE name = 'claude_desktop' AND default_agent_template_id IS NULL;

UPDATE ide_clients SET default_agent_template_id = (
    SELECT id FROM agent_templates WHERE name = 'Pulse' AND author = 'Oraya' LIMIT 1
) WHERE name = 'copilot' AND default_agent_template_id IS NULL;

UPDATE ide_clients SET default_agent_template_id = (
    SELECT id FROM agent_templates WHERE name = 'Pulse' AND author = 'Oraya' LIMIT 1
) WHERE name = 'cline' AND default_agent_template_id IS NULL;

UPDATE ide_clients SET default_agent_template_id = (
    SELECT id FROM agent_templates WHERE name = 'Pulse' AND author = 'Oraya' LIMIT 1
) WHERE name = 'roocode' AND default_agent_template_id IS NULL;

UPDATE ide_clients SET default_agent_template_id = (
    SELECT id FROM agent_templates WHERE name = 'Drift' AND author = 'Oraya' LIMIT 1
) WHERE name = 'windsurf' AND default_agent_template_id IS NULL;

UPDATE ide_clients SET default_agent_template_id = (
    SELECT id FROM agent_templates WHERE name = 'Drift' AND author = 'Oraya' LIMIT 1
) WHERE name = 'zed' AND default_agent_template_id IS NULL;
