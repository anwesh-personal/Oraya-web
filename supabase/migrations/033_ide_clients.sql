-- Supabase Migration 033: IDE Clients Registry
-- ===========================================================================
-- Cloud source of truth for IDE client definitions.
-- Superadmin can add, update, and disable IDE clients here.
-- Changes are pushed to all desktop instances on the next sync cycle.
--
-- Sync direction: Supabase → Local SQLite (unidirectional for this table)
-- Local instances MAY add their own 'local' rows, but cloud rows
-- authored here are authoritative and MUST NOT be overwritten locally.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS ide_clients (
    -- Identity
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Human-readable key (used to match against clientInfo.name from MCP handshake)
    name            TEXT        UNIQUE NOT NULL,           -- 'cursor', 'windsurf', 'cline', 'antigravity'
    display_name    TEXT        NOT NULL,                  -- 'Cursor', 'Windsurf IDE'
    logo_url        TEXT,                                  -- CDN URL for IDE logo
    docs_url        TEXT,                                  -- Link to IDE MCP docs
    description     TEXT,

    -- Default MCP config snippet (shown to user for copy-paste into IDE)
    mcp_config_hint JSONB       DEFAULT '{}',

    -- Default protocols granted to this IDE (array of protocol ID strings)
    default_protocols TEXT[]    NOT NULL DEFAULT '{}',

    -- Lifecycle
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,

    -- Sync tracking (populated by sync service, not admin manually)
    sync_checksum   TEXT,                                  -- SHA256 of the row for change detection

    -- Audit
    created_by      UUID        REFERENCES platform_admins(id),
    updated_by      UUID        REFERENCES platform_admins(id),

    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ide_clients_name      ON ide_clients(name);
CREATE INDEX IF NOT EXISTS idx_ide_clients_active    ON ide_clients(is_active) WHERE is_active = TRUE;

-- RLS: only platform admins can write; desktop sync service can read
ALTER TABLE ide_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins can manage IDE clients" ON ide_clients;
CREATE POLICY "Platform admins can manage IDE clients"
    ON ide_clients FOR ALL
    USING (is_platform_admin());

DROP POLICY IF EXISTS "Sync service can read active IDE clients" ON ide_clients;
CREATE POLICY "Sync service can read active IDE clients"
    ON ide_clients FOR SELECT
    USING (is_active = TRUE);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS update_ide_clients_updated_at ON ide_clients;
CREATE TRIGGER update_ide_clients_updated_at
    BEFORE UPDATE ON ide_clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- Seed: canonical well-known IDE clients
-- ===========================================================================

INSERT INTO ide_clients (name, display_name, logo_url, docs_url, description, mcp_config_hint, default_protocols, is_active)
VALUES
(
    'cursor', 'Cursor',
    'https://cursor.sh/favicon.ico',
    'https://docs.cursor.com/advanced/model-context-protocol',
    'The AI-first code editor. Connects to Oraya for memory, ethos, and task delegation.',
    '{"mcpServers":{"oraya":{"url":"http://localhost:11025/sse"}}}',
    ARRAY['mcp_integration'],
    TRUE
),
(
    'windsurf', 'Windsurf IDE',
    'https://codeium.com/favicon.ico',
    'https://docs.codeium.com/windsurf/mcp',
    'Codeium''s agentic IDE. Integrates with Oraya for cross-session memory and task handoff.',
    '{"mcpServers":{"oraya":{"url":"http://localhost:11025/sse"}}}',
    ARRAY['mcp_integration'],
    TRUE
),
(
    'cline', 'Cline (VS Code)',
    'https://github.com/cline/cline/raw/main/assets/icons/cline.png',
    'https://github.com/cline/cline#model-context-protocol-mcp',
    'Open-source VS Code AI agent. Uses Oraya as its knowledge and task backbone.',
    '{"mcpServers":{"oraya":{"type":"sse","url":"http://localhost:11025/sse"}}}',
    ARRAY['mcp_integration'],
    TRUE
),
(
    'antigravity', 'Antigravity',
    'https://antigravity.dev/favicon.ico',
    'https://antigravity.dev/docs/mcp',
    'Google DeepMind''s agentic coding assistant. Oraya provides memory and ethos alignment.',
    '{"mcpServers":{"oraya":{"url":"http://localhost:11025/sse"}}}',
    ARRAY['mcp_integration'],
    TRUE
),
(
    'roocode', 'RooCode (VS Code)',
    'https://roocode.com/favicon.ico',
    'https://docs.roocode.com/mcp',
    'VS Code AI agent with enhanced multi-agent support. Connects to Oraya via SSE.',
    '{"mcpServers":{"oraya":{"type":"sse","url":"http://localhost:11025/sse"}}}',
    ARRAY['mcp_integration'],
    TRUE
)
ON CONFLICT (name) DO NOTHING;

-- ===========================================================================
-- Sync helper: returns all active IDE clients with checksum for change detection
-- Desktop sync service calls this RPC to pull updates
-- ===========================================================================

CREATE OR REPLACE FUNCTION get_ide_clients_for_sync()
RETURNS TABLE (
    id              UUID,
    name            TEXT,
    display_name    TEXT,
    logo_url        TEXT,
    docs_url        TEXT,
    description     TEXT,
    mcp_config_hint JSONB,
    default_protocols TEXT[],
    is_active       BOOLEAN,
    updated_at      TIMESTAMPTZ
) SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT
        ic.id, ic.name, ic.display_name, ic.logo_url, ic.docs_url,
        ic.description, ic.mcp_config_hint, ic.default_protocols,
        ic.is_active, ic.updated_at
    FROM ide_clients ic
    ORDER BY ic.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE ide_clients IS
'Superadmin-managed registry of IDE clients supported by Oraya MCP.
Changes here sync to all desktop instances on the next sync cycle.
Use sync source: Supabase → Local SQLite only.';
