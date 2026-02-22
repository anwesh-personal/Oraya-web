-- ============================================================================
-- 023: Agent Composition, Factory Memories & User Assignments
-- ============================================================================
-- Phase 7a — Adds compositional layers to agent templates:
--   • Prompt stack (ordered prompt layers)
--   • Few-shot training examples
--   • Knowledge bases (RAG sources)
--   • Behavioral rules
--   • Factory memories (versioned, OTA-patchable)
--   • User agent assignments (superadmin push)
--   • Installation event tracking
--
-- All tables are idempotent (CREATE IF NOT EXISTS).
-- Safe for both fresh installs and existing databases.
-- ============================================================================


-- ============================================================================
-- 1. ALTER agent_templates — add factory versioning
-- ============================================================================

ALTER TABLE agent_templates ADD COLUMN IF NOT EXISTS factory_version INTEGER DEFAULT 0;
ALTER TABLE agent_templates ADD COLUMN IF NOT EXISTS factory_published_at TIMESTAMPTZ;


-- ============================================================================
-- 2. Prompt Stack
-- ============================================================================
-- Ordered prompt layers that compose into the final system prompt at inference.
-- The existing core_prompt remains the PRIMARY system prompt (backward compat).
-- These layers are ADDITIONAL — stacked on top at inference time.
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_template_prompts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id     UUID NOT NULL REFERENCES agent_templates(id) ON DELETE CASCADE,
    
    prompt_type     TEXT NOT NULL CHECK (prompt_type IN (
        'system',            -- additional system-level instructions
        'guardrail',         -- behavioral boundaries and safety rules
        'output_format',     -- response formatting directives
        'context_injection'  -- dynamic per-conversation context rules
    )),
    
    label           TEXT NOT NULL,              -- human-readable name: "Code Review Guardrails"
    content         TEXT NOT NULL,              -- the actual prompt text
    priority        INT NOT NULL DEFAULT 0,     -- ordering within prompt stack (lower = earlier)
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_atp_template 
    ON agent_template_prompts(template_id);
CREATE INDEX IF NOT EXISTS idx_atp_type 
    ON agent_template_prompts(template_id, prompt_type);
CREATE INDEX IF NOT EXISTS idx_atp_ordering 
    ON agent_template_prompts(template_id, priority) 
    WHERE is_active = TRUE;


-- ============================================================================
-- 3. Few-Shot Training Examples
-- ============================================================================
-- Calibration pairs: (user input → ideal agent response).
-- Injected into prompt at inference time to demonstrate desired behavior.
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_template_examples (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id     UUID NOT NULL REFERENCES agent_templates(id) ON DELETE CASCADE,
    
    user_input      TEXT NOT NULL,              -- example user message
    expected_output TEXT NOT NULL,              -- ideal agent response
    explanation     TEXT,                       -- internal doc: WHY this is the right response
    tags            TEXT[] DEFAULT '{}',        -- categorization: ["code-review", "typescript"]
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      INT NOT NULL DEFAULT 0,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_ate_template 
    ON agent_template_examples(template_id);
CREATE INDEX IF NOT EXISTS idx_ate_active 
    ON agent_template_examples(template_id, sort_order) 
    WHERE is_active = TRUE;


-- ============================================================================
-- 4. Knowledge Bases (RAG Sources)
-- ============================================================================
-- Each KB is a source of retrievable knowledge for the agent.
-- At inference time, relevant chunks are pulled and injected into context.
-- The actual chunking/embedding happens on the desktop (local RAG).
-- This table tracks WHAT knowledge the agent has; the desktop handles HOW.
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_template_knowledge_bases (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id     UUID NOT NULL REFERENCES agent_templates(id) ON DELETE CASCADE,
    
    name            TEXT NOT NULL,              -- "Oraya Codebase Conventions"
    description     TEXT,
    kb_type         TEXT NOT NULL CHECK (kb_type IN (
        'document',       -- uploaded file (PDF, MD, TXT)
        'url',            -- web page to crawl and index
        'structured',     -- JSON/CSV tabular data
        'manual'          -- hand-written knowledge entries
    )),
    
    -- Source (populated based on kb_type)
    source_url      TEXT,                       -- for 'url' type
    content         TEXT,                       -- for 'manual' type or extracted document text
    file_path       TEXT,                       -- Supabase Storage path for uploaded files
    file_size_bytes BIGINT,                     -- file size tracking
    mime_type       TEXT,                       -- file MIME type
    
    -- RAG Configuration
    retrieval_strategy TEXT NOT NULL DEFAULT 'semantic' CHECK (retrieval_strategy IN (
        'semantic',       -- embedding-based vector search
        'keyword',        -- BM25 / full-text search
        'hybrid'          -- semantic + keyword fusion
    )),
    chunk_size      INT NOT NULL DEFAULT 512,
    chunk_overlap   INT NOT NULL DEFAULT 64,
    max_chunks_per_query INT NOT NULL DEFAULT 5,
    embedding_model TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    
    -- Indexing Status
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    indexing_status TEXT NOT NULL DEFAULT 'pending' CHECK (indexing_status IN (
        'pending',        -- not yet indexed
        'indexing',       -- currently being indexed
        'indexed',        -- successfully indexed
        'failed'          -- indexing failed
    )),
    indexing_error  TEXT,                       -- error message if indexing failed
    total_chunks    INT NOT NULL DEFAULT 0,     -- number of chunks after indexing
    last_indexed_at TIMESTAMPTZ,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_atkb_template 
    ON agent_template_knowledge_bases(template_id);
CREATE INDEX IF NOT EXISTS idx_atkb_status 
    ON agent_template_knowledge_bases(indexing_status);
CREATE INDEX IF NOT EXISTS idx_atkb_active 
    ON agent_template_knowledge_bases(template_id) 
    WHERE is_active = TRUE;


-- ============================================================================
-- 5. Behavioral Rules
-- ============================================================================
-- Structured guardrails, separate from prompt prose.
-- At inference time, these compile into a rules block appended to the prompt.
-- Separation from prompt text means they can be managed independently.
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_template_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id     UUID NOT NULL REFERENCES agent_templates(id) ON DELETE CASCADE,
    
    rule_type       TEXT NOT NULL CHECK (rule_type IN (
        'must_do',        -- absolute requirement: "Always cite sources"
        'must_not',       -- absolute prohibition: "Never generate DROP TABLE"
        'prefer',         -- soft preference: "Use TypeScript over JavaScript"
        'avoid'           -- soft discouragement: "Avoid passive voice"
    )),
    
    content         TEXT NOT NULL,              -- the rule text
    category        TEXT,                       -- "safety", "formatting", "accuracy", "style", "tone"
    severity        TEXT NOT NULL DEFAULT 'important' CHECK (severity IN (
        'critical',       -- violation = agent failure (highest priority)
        'important',      -- strongly enforced
        'suggestion'      -- nice to have, lower priority
    )),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      INT NOT NULL DEFAULT 0,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_atr_template 
    ON agent_template_rules(template_id);
CREATE INDEX IF NOT EXISTS idx_atr_type 
    ON agent_template_rules(template_id, rule_type);
CREATE INDEX IF NOT EXISTS idx_atr_severity 
    ON agent_template_rules(template_id, severity) 
    WHERE is_active = TRUE;


-- ============================================================================
-- 6. Factory Memories
-- ============================================================================
-- Pre-built memories that ship with the agent template.
-- Seeded into the user's local memory DB on install.
-- OTA-patchable via the factory_id + factory_version system.
--
-- Key design:
--   factory_id is STABLE across all installations.
--   This enables merge/sync: add new, update changed, remove obsolete.
--   User memories (source='user' in local DB) are NEVER affected by patches.
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_template_memories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id     UUID NOT NULL REFERENCES agent_templates(id) ON DELETE CASCADE,
    
    -- Stable sync key — same across all user installations
    factory_id      UUID NOT NULL DEFAULT gen_random_uuid(),
    
    category        TEXT NOT NULL CHECK (category IN (
        'personality',    -- "I approach problems methodically, starting from first principles"
        'skill',          -- "I'm proficient in Rust, TypeScript, Python, and SQL"
        'knowledge',      -- "Oraya uses a Mode → Protocol → Tool permission hierarchy"
        'rule',           -- "I never provide medical, legal, or financial advice"
        'context',        -- "My creator is Anwesh Rath, CEO of Neeva"
        'preference',     -- "I prefer concise responses over verbose ones"
        'example'         -- "When asked about X, I respond like Y"
    )),
    
    content         TEXT NOT NULL,              -- the actual memory content
    importance      REAL NOT NULL DEFAULT 0.7 
                    CHECK (importance >= 0.0 AND importance <= 1.0),
    tags            JSONB NOT NULL DEFAULT '[]', -- searchable: ["coding", "architecture"]
    
    -- Versioning for OTA patches
    version_added   INT NOT NULL DEFAULT 1,     -- factory_version that introduced this memory
    version_removed INT,                        -- set when memory is removed (soft delete)
    
    sort_order      INT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      UUID REFERENCES auth.users(id),
    
    UNIQUE(template_id, factory_id)
);

CREATE INDEX IF NOT EXISTS idx_atm_template 
    ON agent_template_memories(template_id);
CREATE INDEX IF NOT EXISTS idx_atm_category 
    ON agent_template_memories(template_id, category);
CREATE INDEX IF NOT EXISTS idx_atm_version 
    ON agent_template_memories(template_id, version_added);
CREATE INDEX IF NOT EXISTS idx_atm_active 
    ON agent_template_memories(template_id) 
    WHERE is_active = TRUE AND version_removed IS NULL;


-- ============================================================================
-- 7. User Agent Assignments
-- ============================================================================
-- Superadmin pushes specific agent templates to specific users.
-- The desktop checks for assignments on launch and auto-installs.
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_agent_assignments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id     UUID NOT NULL REFERENCES agent_templates(id) ON DELETE CASCADE,
    
    assigned_by     UUID REFERENCES auth.users(id),  -- admin who assigned
    assignment_type TEXT NOT NULL DEFAULT 'push' CHECK (assignment_type IN (
        'push',           -- superadmin explicitly pushed to user
        'entitled'        -- user's plan auto-entitles them
    )),
    
    -- Per-user overrides (future extensibility — not used initially)
    config_overrides JSONB NOT NULL DEFAULT '{}',
    custom_core_prompt TEXT,                    -- user-specific prompt additions
    
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    revoked_at      TIMESTAMPTZ,
    revoked_by      UUID REFERENCES auth.users(id),
    
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_uaa_user 
    ON user_agent_assignments(user_id) 
    WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_uaa_template 
    ON user_agent_assignments(template_id);
CREATE INDEX IF NOT EXISTS idx_uaa_assigned_by 
    ON user_agent_assignments(assigned_by);


-- ============================================================================
-- 8. Installation Event Tracking
-- ============================================================================
-- Desktop reports install/uninstall/patch events back to SaaS.
-- Gives superadmin visibility into:
--   - Which users have which agents installed
--   - Which devices are running which versions
--   - Patch adoption rates
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_agent_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id     UUID REFERENCES agent_templates(id) ON DELETE SET NULL,
    
    agent_name      TEXT NOT NULL,
    event_type      TEXT NOT NULL CHECK (event_type IN (
        'install',        -- agent created / downloaded from gallery
        'uninstall',      -- agent deleted
        'update',         -- agent config updated
        'patch_check',    -- client checked for factory updates
        'patch_applied'   -- factory memories updated via OTA
    )),
    
    -- Device info
    device_id       TEXT,
    device_name     TEXT,
    os_type         TEXT,                       -- 'macos', 'windows', 'linux'
    app_version     TEXT,                       -- Oraya desktop version
    
    -- Source of the event
    source          TEXT NOT NULL DEFAULT 'gallery' CHECK (source IN (
        'gallery',        -- installed from agent gallery
        'assignment',     -- auto-installed via superadmin push
        'scratch',        -- created from scratch
        'clone',          -- cloned from existing agent
        'import'          -- imported from .oraya file
    )),
    
    -- Patch metadata (populated for patch_applied events)
    from_factory_version INT,
    to_factory_version   INT,
    memories_added       INT,
    memories_updated     INT,
    memories_removed     INT,
    
    metadata        JSONB NOT NULL DEFAULT '{}',
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uae_user 
    ON user_agent_events(user_id);
CREATE INDEX IF NOT EXISTS idx_uae_template 
    ON user_agent_events(template_id);
CREATE INDEX IF NOT EXISTS idx_uae_event 
    ON user_agent_events(event_type);
CREATE INDEX IF NOT EXISTS idx_uae_device 
    ON user_agent_events(device_id);
CREATE INDEX IF NOT EXISTS idx_uae_created 
    ON user_agent_events(created_at DESC);


-- ============================================================================
-- 9. View: Current Installed State Per User Per Device
-- ============================================================================
-- Shows the latest install/uninstall event per user+agent+device.
-- If last event is 'install' → agent is currently installed.
-- If last event is 'uninstall' → agent was removed.
-- ============================================================================

CREATE OR REPLACE VIEW user_installed_agents AS
SELECT DISTINCT ON (user_id, agent_name, device_id)
    user_id,
    agent_name,
    template_id,
    event_type,
    device_id,
    device_name,
    os_type,
    app_version,
    source,
    created_at AS last_event_at
FROM user_agent_events
WHERE event_type IN ('install', 'uninstall')
ORDER BY user_id, agent_name, device_id, created_at DESC;


-- ============================================================================
-- 10. Auto-update triggers for updated_at columns
-- ============================================================================

-- Generic trigger function (reusable)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- agent_template_prompts
DROP TRIGGER IF EXISTS trigger_atp_updated_at ON agent_template_prompts;
CREATE TRIGGER trigger_atp_updated_at
    BEFORE UPDATE ON agent_template_prompts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- agent_template_examples
DROP TRIGGER IF EXISTS trigger_ate_updated_at ON agent_template_examples;
CREATE TRIGGER trigger_ate_updated_at
    BEFORE UPDATE ON agent_template_examples
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- agent_template_knowledge_bases
DROP TRIGGER IF EXISTS trigger_atkb_updated_at ON agent_template_knowledge_bases;
CREATE TRIGGER trigger_atkb_updated_at
    BEFORE UPDATE ON agent_template_knowledge_bases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- agent_template_rules
DROP TRIGGER IF EXISTS trigger_atr_updated_at ON agent_template_rules;
CREATE TRIGGER trigger_atr_updated_at
    BEFORE UPDATE ON agent_template_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- agent_template_memories
DROP TRIGGER IF EXISTS trigger_atm_updated_at ON agent_template_memories;
CREATE TRIGGER trigger_atm_updated_at
    BEFORE UPDATE ON agent_template_memories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- 11. Row Level Security
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE agent_template_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_template_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_template_knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_template_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_template_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_agent_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_agent_events ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------
-- Template composition tables: public read for active templates,
-- service_role write (superadmin manages via API with service key)
-- -----------------------------------------------------------------------

-- Prompts
DROP POLICY IF EXISTS "atp_public_read" ON agent_template_prompts;
CREATE POLICY "atp_public_read" ON agent_template_prompts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM agent_templates t
            WHERE t.id = template_id AND t.is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "atp_service_write" ON agent_template_prompts;
CREATE POLICY "atp_service_write" ON agent_template_prompts
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Examples
DROP POLICY IF EXISTS "ate_public_read" ON agent_template_examples;
CREATE POLICY "ate_public_read" ON agent_template_examples
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM agent_templates t
            WHERE t.id = template_id AND t.is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "ate_service_write" ON agent_template_examples;
CREATE POLICY "ate_service_write" ON agent_template_examples
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Knowledge Bases
DROP POLICY IF EXISTS "atkb_public_read" ON agent_template_knowledge_bases;
CREATE POLICY "atkb_public_read" ON agent_template_knowledge_bases
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM agent_templates t
            WHERE t.id = template_id AND t.is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "atkb_service_write" ON agent_template_knowledge_bases;
CREATE POLICY "atkb_service_write" ON agent_template_knowledge_bases
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Rules
DROP POLICY IF EXISTS "atr_public_read" ON agent_template_rules;
CREATE POLICY "atr_public_read" ON agent_template_rules
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM agent_templates t
            WHERE t.id = template_id AND t.is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "atr_service_write" ON agent_template_rules;
CREATE POLICY "atr_service_write" ON agent_template_rules
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Factory Memories
DROP POLICY IF EXISTS "atm_public_read" ON agent_template_memories;
CREATE POLICY "atm_public_read" ON agent_template_memories
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM agent_templates t
            WHERE t.id = template_id AND t.is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "atm_service_write" ON agent_template_memories;
CREATE POLICY "atm_service_write" ON agent_template_memories
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- -----------------------------------------------------------------------
-- User assignments: users read own, service_role manages
-- -----------------------------------------------------------------------

DROP POLICY IF EXISTS "uaa_user_read_own" ON user_agent_assignments;
CREATE POLICY "uaa_user_read_own" ON user_agent_assignments
    FOR SELECT
    USING (auth.uid() = user_id AND is_active = TRUE);

DROP POLICY IF EXISTS "uaa_service_manage" ON user_agent_assignments;
CREATE POLICY "uaa_service_manage" ON user_agent_assignments
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- -----------------------------------------------------------------------
-- User events: users write own, read own. Service_role reads all.
-- -----------------------------------------------------------------------

DROP POLICY IF EXISTS "uae_user_insert_own" ON user_agent_events;
CREATE POLICY "uae_user_insert_own" ON user_agent_events
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "uae_user_read_own" ON user_agent_events;
CREATE POLICY "uae_user_read_own" ON user_agent_events
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "uae_service_all" ON user_agent_events;
CREATE POLICY "uae_service_all" ON user_agent_events
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');


-- ============================================================================
-- Done. Phase 7a complete.
-- ============================================================================
