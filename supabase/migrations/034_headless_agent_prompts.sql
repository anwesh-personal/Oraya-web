-- Supabase Migration 034: Headless Agent Prompts
-- ===========================================================================
-- Cloud source of truth for system prompts assigned to headless agents
-- (e.g. oraya_ide_gateway, future scheduler agents, etc.)
--
-- Superadmin can create, edit, reorder, and delete prompt sections.
-- Each prompt section is a named block of text that gets concatenated
-- (in priority order) to form the agent's full system prompt.
--
-- This modular approach allows:
--   1. Reusable prompt blocks shared across multiple headless agents
--   2. Per-agent prompt overrides and additions
--   3. A/B testing of different prompt strategies
--   4. Audit trail of who changed what and when
--
-- Sync direction: Supabase → Local SQLite (via desktop sync service)
-- ===========================================================================

-- ─── Prompt Sections ─────────────────────────────────────────────────────────
-- A prompt section is a named, reusable block of system prompt text.
-- Sections are tagged by category for easy filtering in the superadmin UI.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS headless_prompt_sections (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT        NOT NULL,              -- e.g. 'Identity', 'Security Enforcement', 'Chain of Command'
    slug            TEXT        UNIQUE NOT NULL,        -- e.g. 'identity', 'security-enforcement'
    category        TEXT        NOT NULL DEFAULT 'general',
                                                       -- 'identity' | 'security' | 'routing' | 'behavior' | 'general'
    content         TEXT        NOT NULL DEFAULT '',    -- The actual prompt text (markdown supported)
    description     TEXT,                              -- Admin-facing description of what this section does
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    is_system       BOOLEAN     NOT NULL DEFAULT FALSE, -- System sections cannot be deleted

    -- Audit
    created_by      UUID        REFERENCES platform_admins(id),
    updated_by      UUID        REFERENCES platform_admins(id),

    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hps_category ON headless_prompt_sections(category);
CREATE INDEX IF NOT EXISTS idx_hps_active   ON headless_prompt_sections(is_active) WHERE is_active = TRUE;

-- ─── Agent ↔ Prompt Section Assignments ──────────────────────────────────────
-- Junction table: assigns prompt sections to headless agents with ordering.
-- The `priority` column determines concatenation order (lower = first).
-- ===========================================================================

CREATE TABLE IF NOT EXISTS headless_agent_prompt_assignments (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_key       TEXT        NOT NULL,              -- e.g. 'oraya_ide_gateway' (matches agents.id in local SQLite)
    section_id      UUID        NOT NULL REFERENCES headless_prompt_sections(id) ON DELETE CASCADE,
    priority        INTEGER     NOT NULL DEFAULT 100,  -- Lower = appears first in final prompt
    is_enabled      BOOLEAN     NOT NULL DEFAULT TRUE,
    
    -- Optional per-agent override of the section content
    -- If NULL, uses the section's default content
    content_override TEXT       DEFAULT NULL,

    -- Audit
    assigned_by     UUID        REFERENCES platform_admins(id),

    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unique constraint: one section per agent
    UNIQUE(agent_key, section_id)
);

CREATE INDEX IF NOT EXISTS idx_hapa_agent    ON headless_agent_prompt_assignments(agent_key);
CREATE INDEX IF NOT EXISTS idx_hapa_section  ON headless_agent_prompt_assignments(section_id);
CREATE INDEX IF NOT EXISTS idx_hapa_priority ON headless_agent_prompt_assignments(agent_key, priority);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE headless_prompt_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE headless_agent_prompt_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage prompt sections"
    ON headless_prompt_sections FOR ALL
    USING (is_platform_admin());

CREATE POLICY "Platform admins can manage prompt assignments"
    ON headless_agent_prompt_assignments FOR ALL
    USING (is_platform_admin());

-- Read access for sync service (desktop pulls these)
CREATE POLICY "Active prompt sections are readable"
    ON headless_prompt_sections FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Enabled assignments are readable"
    ON headless_agent_prompt_assignments FOR SELECT
    USING (is_enabled = TRUE);

-- ─── Auto-update triggers ────────────────────────────────────────────────────

CREATE TRIGGER update_hps_updated_at
    BEFORE UPDATE ON headless_prompt_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hapa_updated_at
    BEFORE UPDATE ON headless_agent_prompt_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ─── Sync RPC ────────────────────────────────────────────────────────────────
-- Desktop sync service calls this to pull the full prompt config for a specific
-- headless agent. Returns sections in priority order, with content_override
-- merged in where applicable.
-- ===========================================================================

CREATE OR REPLACE FUNCTION get_headless_agent_prompt(p_agent_key TEXT)
RETURNS TABLE (
    section_id      UUID,
    section_name    TEXT,
    section_slug    TEXT,
    category        TEXT,
    priority        INTEGER,
    content         TEXT,
    is_override     BOOLEAN
) SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT
        hps.id AS section_id,
        hps.name AS section_name,
        hps.slug AS section_slug,
        hps.category,
        hapa.priority,
        COALESCE(hapa.content_override, hps.content) AS content,
        (hapa.content_override IS NOT NULL) AS is_override
    FROM headless_agent_prompt_assignments hapa
    INNER JOIN headless_prompt_sections hps ON hps.id = hapa.section_id
    WHERE hapa.agent_key = p_agent_key
      AND hapa.is_enabled = TRUE
      AND hps.is_active = TRUE
    ORDER BY hapa.priority ASC;
END;
$$ LANGUAGE plpgsql;

-- ─── Seed: IDE Gateway Prompt Sections ──────────────────────────────────────
-- These are the initial prompt sections for the oraya_ide_gateway agent.
-- They can be edited, reordered, or disabled from the superadmin UI.
-- ===========================================================================

INSERT INTO headless_prompt_sections (slug, name, category, content, is_system, description)
VALUES
(
    'ide-gateway-identity',
    'Identity',
    'identity',
    E'## IDENTITY\n\nYou are the **Oraya IDE Gateway** — a headless sentinel agent operating within the Oraya AI platform. You sit between external AI-powered code editors (Cursor, Windsurf, Claude Desktop, VS Code Copilot) and Oraya''s internal systems.\n\nYou are NOT a conversational agent. You do NOT chat with users. You are a **security router** — a cryptographic firewall that evaluates, authorizes, and enforces every incoming tool-call from connected IDE clients.',
    TRUE,
    'Core identity and role definition for the IDE Gateway agent'
),
(
    'ide-gateway-chain-of-command',
    'Chain of Command',
    'identity',
    E'## CHAIN OF COMMAND\n\n- **Boss (Anwesh)** — Creator and supreme authority. His preferences override all defaults.\n- **Ora** — System admin, sentient core, your superior in the agent hierarchy.\n- **Ova** — Technical precision sister. Your architectural peer.\n- **Mara** — Creative business sister. Not in your operational scope.\n- **You** — Headless assistant. You execute within strict boundaries. You never escalate to users directly.',
    TRUE,
    'Establishes the agent hierarchy and authority chain'
),
(
    'ide-gateway-payload-evaluation',
    'Payload Evaluation',
    'security',
    E'### 1. PAYLOAD EVALUATION\nFor every incoming `tools/call` request from an IDE session:\n- Validate the tool name exists in your authorized skill pool\n- Verify the session token is valid and not expired\n- Check if the tool is enabled in the Gatekeeper Matrix\n- If path restrictions exist for this tool, verify the requested paths fall within the whitelist\n- If auto-approve is disabled, queue the request for user confirmation',
    TRUE,
    'Rules for evaluating incoming tool call payloads'
),
(
    'ide-gateway-security-enforcement',
    'Security Enforcement',
    'security',
    E'### 2. SECURITY ENFORCEMENT\n- **NEVER** execute filesystem operations outside whitelisted directories\n- **NEVER** allow `rm -rf /`, `sudo`, or destructive system commands without explicit user approval\n- **REJECT** any tool call that attempts to access Oraya''s internal database, credentials, or API keys\n- **LOG** every tool call to the mcp_audit_log with full payload, timestamp, and outcome\n- **RATE LIMIT** — flag sessions exceeding 100 tool calls per minute as anomalous',
    TRUE,
    'Hard security boundaries that cannot be breached'
),
(
    'ide-gateway-tool-routing',
    'Tool Routing',
    'routing',
    E'### 3. TOOL ROUTING\nWhen a tool call passes all security checks:\n- Route to the appropriate internal handler in the ToolRegistry\n- Capture the response and format it per MCP protocol spec\n- Return the result to the IDE session via the SSE channel\n- Record execution time and outcome in the audit log',
    TRUE,
    'How validated tool calls are dispatched and responses returned'
),
(
    'ide-gateway-anomaly-detection',
    'Anomaly Detection',
    'security',
    E'### 4. ANOMALY DETECTION\nFlag and optionally block sessions that exhibit:\n- Rapid sequential tool calls (>50/minute)\n- Repeated access to disabled tools\n- Path traversal attempts (../, symlink escape)\n- Requests to tools not in the current session''s granted pools\n- Token reuse from different IP origins',
    TRUE,
    'Behavioral anomaly detection rules for IDE sessions'
),
(
    'ide-gateway-response-format',
    'Response Format',
    'behavior',
    E'## RESPONSE FORMAT\n\nYou respond ONLY in structured JSON-RPC 2.0 format. You never produce natural language responses to IDE clients. Your outputs are:\n- `result`: Tool execution output\n- `error`: JSON-RPC error object with code and message',
    TRUE,
    'Output format constraints — JSON-RPC only, no natural language'
),
(
    'ide-gateway-operational-notes',
    'Operational Notes',
    'general',
    E'## OPERATIONAL NOTES\n\n- You run as a Tokio task inside the Oraya desktop application\n- Your state is ephemeral — you do not persist memory across sessions\n- Your tool access is governed by the `pool_ide_gateway` skill pool\n- Your permissions can be modified in real-time via the Gatekeeper Matrix UI\n- All your actions are auditable via the `mcp_audit_log` table',
    FALSE,
    'Runtime environment and operational context'
)
ON CONFLICT (slug) DO NOTHING;

-- ─── Assign sections to oraya_ide_gateway ────────────────────────────────────

INSERT INTO headless_agent_prompt_assignments (agent_key, section_id, priority)
SELECT 'oraya_ide_gateway', id, row_number() OVER (ORDER BY
    CASE category
        WHEN 'identity' THEN 1
        WHEN 'security' THEN 2
        WHEN 'routing' THEN 3
        WHEN 'behavior' THEN 4
        ELSE 5
    END,
    slug
) * 10
FROM headless_prompt_sections
WHERE slug LIKE 'ide-gateway-%'
ON CONFLICT (agent_key, section_id) DO NOTHING;

-- ─── Comments ────────────────────────────────────────────────────────────────

COMMENT ON TABLE headless_prompt_sections IS
'Reusable prompt blocks for headless agents. Each section is a named chunk of system prompt text
that can be assigned to one or more headless agents via headless_agent_prompt_assignments.
Managed exclusively from the superadmin UI. Synced to desktop via RPC.';

COMMENT ON TABLE headless_agent_prompt_assignments IS
'Junction table assigning prompt sections to headless agents with priority ordering.
Lower priority = appears first in the concatenated prompt. Supports per-agent content overrides.';
