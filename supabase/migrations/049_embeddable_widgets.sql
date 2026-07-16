-- ============================================================================
-- 049: Embeddable Widget Deployments
-- ============================================================================
-- Enables users to deploy any agent as an embeddable chat widget on external
-- websites. Extends the agent_templates + token_wallet systems.
--
-- Persistence modes:
--   • ephemeral     — no history, lost on page close
--   • ip_persistent — tied to visitor IP, survives refresh
--   • user_persistent — tied to browser fingerprint/cookie
--   • gated         — requires visitor signup before chatting
-- ============================================================================

-- ─── Widget Deployments ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS widget_deployments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id     UUID NOT NULL REFERENCES agent_templates(id) ON DELETE RESTRICT,

    -- Identity & Branding
    name            TEXT NOT NULL,
    welcome_message TEXT NOT NULL DEFAULT 'Hi! How can I help you today?',
    placeholder     TEXT NOT NULL DEFAULT 'Type a message...',
    avatar_url      TEXT,

    -- Visual Configuration
    widget_type     TEXT NOT NULL DEFAULT 'bubble'
                    CHECK (widget_type IN ('bubble', 'inline', 'fullpage')),
    position        TEXT NOT NULL DEFAULT 'bottom-right'
                    CHECK (position IN ('bottom-right', 'bottom-left', 'top-right', 'top-left')),
    primary_color   TEXT NOT NULL DEFAULT '#7c3aed',
    accent_color    TEXT NOT NULL DEFAULT '#6d28d9',
    bg_color        TEXT NOT NULL DEFAULT '#ffffff',
    text_color      TEXT NOT NULL DEFAULT '#1a1a2e',
    font_family     TEXT NOT NULL DEFAULT 'Inter, system-ui, sans-serif',
    border_radius   INT NOT NULL DEFAULT 16,
    bubble_size     INT NOT NULL DEFAULT 60,
    chat_width      INT NOT NULL DEFAULT 400,
    chat_height     INT NOT NULL DEFAULT 620,
    dark_mode       BOOLEAN NOT NULL DEFAULT false,
    show_branding   BOOLEAN NOT NULL DEFAULT true,
    custom_css      TEXT,

    -- Behavior
    persistence_mode TEXT NOT NULL DEFAULT 'user_persistent'
                    CHECK (persistence_mode IN (
                        'ephemeral',
                        'ip_persistent',
                        'user_persistent',
                        'gated'
                    )),
    allowed_domains TEXT[] DEFAULT '{}',
    rate_limit_rpm  INT NOT NULL DEFAULT 20,
    max_tokens      INT NOT NULL DEFAULT 1024,
    max_history     INT NOT NULL DEFAULT 50,
    auto_open       BOOLEAN NOT NULL DEFAULT false,
    auto_open_delay INT NOT NULL DEFAULT 3000,
    sound_enabled   BOOLEAN NOT NULL DEFAULT false,

    -- Gated Mode Configuration
    gate_config     JSONB DEFAULT '{
        "require_name": true,
        "require_email": true,
        "require_phone": false,
        "custom_fields": [],
        "consent_text": "I agree to the terms of service",
        "require_consent": true
    }',

    -- AI Config Overrides (layered on top of agent template)
    system_prompt_override TEXT,
    temperature     FLOAT NOT NULL DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
    model_override  TEXT,
    context_window  INT NOT NULL DEFAULT 8192,

    -- Prompt Stack Overrides (same structure as agent_template_prompts)
    prompt_stack    JSONB DEFAULT '[]',
    training_data   JSONB DEFAULT '[]',
    rules           JSONB DEFAULT '[]',
    knowledge_base  JSONB DEFAULT '[]',

    -- Access Control
    api_key         TEXT NOT NULL UNIQUE,
    secret_key      TEXT NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,

    -- Analytics Counters (updated via trigger)
    total_conversations BIGINT NOT NULL DEFAULT 0,
    total_messages      BIGINT NOT NULL DEFAULT 0,
    total_tokens_used   BIGINT NOT NULL DEFAULT 0,

    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Primary lookup: user's widgets
CREATE INDEX IF NOT EXISTS idx_widget_deployments_user
    ON widget_deployments (user_id, is_active)
    WHERE is_active = true;

-- API key lookup (public endpoint auth)
CREATE UNIQUE INDEX IF NOT EXISTS idx_widget_deployments_api_key
    ON widget_deployments (api_key);

-- ─── Widget Sessions ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS widget_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_id       UUID NOT NULL REFERENCES widget_deployments(id) ON DELETE CASCADE,

    -- Visitor Identity
    visitor_id      TEXT NOT NULL,
    visitor_ip      INET,
    visitor_meta    JSONB NOT NULL DEFAULT '{}',

    -- Gated visitor data (filled when persistence_mode = 'gated')
    visitor_name    TEXT,
    visitor_email   TEXT,
    visitor_phone   TEXT,
    visitor_custom  JSONB DEFAULT '{}',

    -- Conversation
    messages        JSONB NOT NULL DEFAULT '[]',
    message_count   INT NOT NULL DEFAULT 0,
    token_count     INT NOT NULL DEFAULT 0,

    -- State
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'closed', 'archived')),
    last_message_at TIMESTAMPTZ DEFAULT now(),

    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Session lookup by widget + visitor
CREATE INDEX IF NOT EXISTS idx_widget_sessions_lookup
    ON widget_sessions (widget_id, visitor_id, status)
    WHERE status = 'active';

-- Session cleanup: find stale sessions
CREATE INDEX IF NOT EXISTS idx_widget_sessions_stale
    ON widget_sessions (last_message_at)
    WHERE status = 'active';

-- ─── Widget Analytics (Daily Rollups) ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS widget_analytics (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_id       UUID NOT NULL REFERENCES widget_deployments(id) ON DELETE CASCADE,
    date            DATE NOT NULL DEFAULT CURRENT_DATE,
    conversations   INT NOT NULL DEFAULT 0,
    messages        INT NOT NULL DEFAULT 0,
    unique_visitors INT NOT NULL DEFAULT 0,
    tokens_used     BIGINT NOT NULL DEFAULT 0,
    avg_messages_per_session FLOAT DEFAULT 0,
    page_urls       JSONB DEFAULT '[]',
    
    UNIQUE (widget_id, date)
);

CREATE INDEX IF NOT EXISTS idx_widget_analytics_range
    ON widget_analytics (widget_id, date DESC);

-- ─── RLS Policies ───────────────────────────────────────────────────────────

ALTER TABLE widget_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_analytics ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own widgets
DROP POLICY IF EXISTS "widget_deployments_user_crud" ON widget_deployments;
CREATE POLICY "widget_deployments_user_crud" ON widget_deployments
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for API routes)
DROP POLICY IF EXISTS "widget_deployments_service" ON widget_deployments;
CREATE POLICY "widget_deployments_service" ON widget_deployments
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Sessions: service role only (public API uses service key)
DROP POLICY IF EXISTS "widget_sessions_service" ON widget_sessions;
CREATE POLICY "widget_sessions_service" ON widget_sessions
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Analytics: owner read + service write
DROP POLICY IF EXISTS "widget_analytics_user_read" ON widget_analytics;
CREATE POLICY "widget_analytics_user_read" ON widget_analytics
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM widget_deployments wd
        WHERE wd.id = widget_analytics.widget_id
          AND wd.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "widget_analytics_service" ON widget_analytics;
CREATE POLICY "widget_analytics_service" ON widget_analytics
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ─── Auto-update Triggers ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_widget_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_widget_deployments_updated_at ON widget_deployments;
CREATE TRIGGER trigger_widget_deployments_updated_at
    BEFORE UPDATE ON widget_deployments
    FOR EACH ROW EXECUTE FUNCTION update_widget_updated_at();

DROP TRIGGER IF EXISTS trigger_widget_sessions_updated_at ON widget_sessions;
CREATE TRIGGER trigger_widget_sessions_updated_at
    BEFORE UPDATE ON widget_sessions
    FOR EACH ROW EXECUTE FUNCTION update_widget_updated_at();

-- ─── Helper: Generate Widget API Key ────────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_widget_api_key()
RETURNS TEXT AS $$
DECLARE
    key TEXT;
BEGIN
    key := 'wgt_' || encode(gen_random_bytes(24), 'hex');
    RETURN key;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_widget_secret_key()
RETURNS TEXT AS $$
DECLARE
    key TEXT;
BEGIN
    key := 'wsk_' || encode(gen_random_bytes(32), 'hex');
    RETURN key;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE widget_deployments IS 'Embeddable chat widget configurations. Each row = one embed code deployment.';
COMMENT ON TABLE widget_sessions IS 'Visitor conversation sessions for embedded widgets.';
COMMENT ON TABLE widget_analytics IS 'Daily aggregated analytics per widget deployment.';
