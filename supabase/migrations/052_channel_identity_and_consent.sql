-- ============================================================================
-- 052: Channel Identity, Consent & Conversations (Chatbot Foundation F4)
-- ============================================================================
-- Phase-1a DB FOUNDATION for the "best chatbot ever" roadmap (plan 029).
--
-- Establishes a durable, tenant-scoped end-user identity + consent substrate
-- that every chatbot pillar depends on:
--   • Memory persistence (needs a stable person to attach memories to)
--   • Proactive engagement (needs consent + a reachable channel identity)
--   • Omnichannel delivery (needs a canonical person across web/WhatsApp/etc.)
--
-- Tenant scoping decision (GROUNDED, not assumed):
--   The chatbot is built on `widget_deployments`, which scopes by
--   `user_id UUID REFERENCES auth.users(id)`. Agent templates, user AI
--   providers, and agent assignments all scope the same way. Teams exist
--   (007_teams_collaboration) but are a collaboration OVERLAY on top of a
--   user, not the resource-ownership key for widgets. Therefore the tenant
--   boundary for the chatbot substrate is `user_id`. The task's
--   `tenant_id` == `user_id` here.
--
-- RLS mirrors the existing widget tables (049_embeddable_widgets):
--   • Owner: auth.uid() = user_id (read own; full manage on config-like rows)
--   • Service role: full access (public/runtime API routes use the service key)
--
-- NOTE: `widget_sessions` is NOT dropped or altered. `channel_conversations`
-- generalizes it additively; the migration path is documented below and left
-- optional (a `widget_session_id` bridge column enables later backfill).
-- ============================================================================

-- gen_random_uuid() is core in PG13+; pgcrypto kept for parity with 050.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Generic updated_at trigger fn (identical body to 023_agent_composition).
-- Redefined idempotently so this migration is self-contained.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── End Users (persistent, tenant-scoped person) ───────────────────────────
-- One row per person a tenant's bots have interacted with, independent of
-- channel. `merged_into` supports FUTURE cross-channel identity unification
-- (e.g. the same person on web + WhatsApp collapses into one canonical row);
-- it is NOT resolved now — only the column exists so the model can grow.

CREATE TABLE IF NOT EXISTS end_users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- tenant

    -- Best-known profile (populated opportunistically from channel identities)
    display_name    TEXT,
    primary_email   TEXT,
    primary_phone   TEXT,
    locale          TEXT,
    timezone        TEXT,

    -- Future cross-channel unification (self-referential; unresolved for now)
    merged_into     UUID REFERENCES end_users(id) ON DELETE SET NULL,

    attributes      JSONB NOT NULL DEFAULT '{}',

    first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Fail-loud: a merged row must point somewhere other than itself
    CONSTRAINT end_users_no_self_merge CHECK (merged_into IS NULL OR merged_into <> id)
);

CREATE INDEX IF NOT EXISTS idx_end_users_tenant
    ON end_users (user_id, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_end_users_merged
    ON end_users (merged_into)
    WHERE merged_into IS NOT NULL;
-- Case-insensitive tenant-scoped email/phone lookup for identity resolution
CREATE INDEX IF NOT EXISTS idx_end_users_email
    ON end_users (user_id, lower(primary_email))
    WHERE primary_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_end_users_phone
    ON end_users (user_id, primary_phone)
    WHERE primary_phone IS NOT NULL;

-- ─── Channel Identities (per-channel handle for a person) ────────────────────
-- The hard tenant-isolation guarantee: UNIQUE(user_id, channel, channel_user_id).
-- `channel_user_id` is the channel-native id — web visitor_id, WhatsApp phone
-- (E.164), Telegram user id, etc. This is the primary upsert key at ingress.

CREATE TABLE IF NOT EXISTS channel_identities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- tenant
    end_user_id     UUID NOT NULL REFERENCES end_users(id) ON DELETE CASCADE,

    channel         TEXT NOT NULL CHECK (channel IN (
        'web', 'whatsapp', 'telegram', 'sms', 'slack',
        'instagram', 'messenger', 'email', 'voice'
    )),
    channel_user_id TEXT NOT NULL,

    -- Which deployment first observed this identity (agent scope; nullable)
    deployment_id   UUID REFERENCES widget_deployments(id) ON DELETE SET NULL,

    display_name    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}',
    verified_at     TIMESTAMPTZ,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Tenant isolation guarantee: the same channel handle cannot collide
    -- within a tenant, and is free to exist independently across tenants.
    CONSTRAINT channel_identities_tenant_unique
        UNIQUE (user_id, channel, channel_user_id)
);

CREATE INDEX IF NOT EXISTS idx_channel_identities_end_user
    ON channel_identities (end_user_id);
CREATE INDEX IF NOT EXISTS idx_channel_identities_deployment
    ON channel_identities (deployment_id)
    WHERE deployment_id IS NOT NULL;

-- ─── Channel Consents (per person / channel / consent type) ──────────────────
-- Current-state row per (tenant, end_user, channel, consent_type). Upsert on
-- grant/revoke by toggling granted_at / revoked_at. Proactive/omnichannel
-- sends MUST read this and fail loud when consent is absent or revoked.

CREATE TABLE IF NOT EXISTS channel_consents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- tenant
    end_user_id     UUID NOT NULL REFERENCES end_users(id) ON DELETE CASCADE,

    channel         TEXT NOT NULL CHECK (channel IN (
        'web', 'whatsapp', 'telegram', 'sms', 'slack',
        'instagram', 'messenger', 'email', 'voice'
    )),
    consent_type    TEXT NOT NULL CHECK (consent_type IN (
        'data_processing',   -- store/process this person's data & memory
        'transactional',     -- service/operational messages
        'marketing',         -- promotional messages
        'proactive',         -- agent-initiated / scheduled outreach
        'whatsapp_optin'     -- WA-specific opt-in for HSM templates
    )),

    source          TEXT NOT NULL,   -- 'widget_gate','double_optin','import','api',...
    granted_at      TIMESTAMPTZ,
    revoked_at      TIMESTAMPTZ,
    metadata        JSONB NOT NULL DEFAULT '{}',

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT channel_consents_current_unique
        UNIQUE (user_id, end_user_id, channel, consent_type)
);

CREATE INDEX IF NOT EXISTS idx_channel_consents_end_user
    ON channel_consents (end_user_id, channel);
-- Fast "is this person currently consented?" filter
CREATE INDEX IF NOT EXISTS idx_channel_consents_granted
    ON channel_consents (user_id, end_user_id, channel, consent_type)
    WHERE granted_at IS NOT NULL AND revoked_at IS NULL;

-- ─── Channel Conversations (generalizes widget_sessions) ─────────────────────
-- One canonical conversation thread across any channel. Additive superset of
-- widget_sessions: `widget_session_id` bridges to the legacy row so the
-- existing web widget can be migrated later WITHOUT a breaking rewrite.
-- `last_inbound_at` powers the WhatsApp 24h customer-service window.
-- `memory_thread_id` groups working-memory entries for this thread.

CREATE TABLE IF NOT EXISTS channel_conversations (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- tenant
    deployment_id     UUID REFERENCES widget_deployments(id) ON DELETE CASCADE,   -- agent
    end_user_id       UUID REFERENCES end_users(id) ON DELETE SET NULL,           -- null until resolved
    channel_identity_id UUID REFERENCES channel_identities(id) ON DELETE SET NULL,

    channel           TEXT NOT NULL DEFAULT 'web' CHECK (channel IN (
        'web', 'whatsapp', 'telegram', 'sms', 'slack',
        'instagram', 'messenger', 'email', 'voice'
    )),

    -- Channel-native conversation id (WA chat id, Telegram chat id, etc.).
    -- NULL for web (a web session is keyed by widget_session bridge instead).
    conversation_ref  TEXT,

    -- Stable id grouping this thread's working-memory entries.
    memory_thread_id  UUID NOT NULL DEFAULT gen_random_uuid(),

    -- Additive bridge to the legacy widget session (no FK cascade break).
    widget_session_id UUID REFERENCES widget_sessions(id) ON DELETE SET NULL,

    status            TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'closed', 'archived')),

    last_inbound_at   TIMESTAMPTZ,   -- last message FROM the end-user (WA 24h window)
    last_message_at   TIMESTAMPTZ DEFAULT now(),
    message_count     INT NOT NULL DEFAULT 0,

    metadata          JSONB NOT NULL DEFAULT '{}',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotent inbound routing for real channels (conversation_ref present)
CREATE UNIQUE INDEX IF NOT EXISTS idx_channel_conversations_ref
    ON channel_conversations (user_id, channel, conversation_ref)
    WHERE conversation_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_channel_conversations_deployment
    ON channel_conversations (deployment_id, status)
    WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_channel_conversations_end_user
    ON channel_conversations (end_user_id, last_message_at DESC)
    WHERE end_user_id IS NOT NULL;
-- WhatsApp 24h-window sweeps
CREATE INDEX IF NOT EXISTS idx_channel_conversations_inbound
    ON channel_conversations (last_inbound_at)
    WHERE status = 'active';

-- ─── updated_at triggers ─────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trigger_end_users_updated_at ON end_users;
CREATE TRIGGER trigger_end_users_updated_at
    BEFORE UPDATE ON end_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_channel_identities_updated_at ON channel_identities;
CREATE TRIGGER trigger_channel_identities_updated_at
    BEFORE UPDATE ON channel_identities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_channel_consents_updated_at ON channel_consents;
CREATE TRIGGER trigger_channel_consents_updated_at
    BEFORE UPDATE ON channel_consents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_channel_conversations_updated_at ON channel_conversations;
CREATE TRIGGER trigger_channel_conversations_updated_at
    BEFORE UPDATE ON channel_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Row Level Security (mirrors 049_embeddable_widgets) ─────────────────────

ALTER TABLE end_users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_identities   ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_consents     ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_conversations ENABLE ROW LEVEL SECURITY;

-- end_users: owner reads own; service role manages (runtime writes via API)
DROP POLICY IF EXISTS "end_users_owner_read" ON end_users;
CREATE POLICY "end_users_owner_read" ON end_users
    FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "end_users_service" ON end_users;
CREATE POLICY "end_users_service" ON end_users
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- channel_identities
DROP POLICY IF EXISTS "channel_identities_owner_read" ON channel_identities;
CREATE POLICY "channel_identities_owner_read" ON channel_identities
    FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "channel_identities_service" ON channel_identities;
CREATE POLICY "channel_identities_service" ON channel_identities
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- channel_consents
DROP POLICY IF EXISTS "channel_consents_owner_read" ON channel_consents;
CREATE POLICY "channel_consents_owner_read" ON channel_consents
    FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "channel_consents_service" ON channel_consents;
CREATE POLICY "channel_consents_service" ON channel_consents
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- channel_conversations
DROP POLICY IF EXISTS "channel_conversations_owner_read" ON channel_conversations;
CREATE POLICY "channel_conversations_owner_read" ON channel_conversations
    FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "channel_conversations_service" ON channel_conversations;
CREATE POLICY "channel_conversations_service" ON channel_conversations
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ─── Comments ────────────────────────────────────────────────────────────────

COMMENT ON TABLE end_users IS 'Persistent, tenant-scoped (user_id) person a tenant''s bots interact with, independent of channel. merged_into reserved for future cross-channel unification.';
COMMENT ON TABLE channel_identities IS 'Per-channel handle for an end_user. UNIQUE(user_id, channel, channel_user_id) is the tenant-isolation guarantee and the ingress upsert key.';
COMMENT ON TABLE channel_consents IS 'Current-state consent per (tenant, end_user, channel, consent_type). Proactive/omnichannel sends MUST verify granted_at IS NOT NULL AND revoked_at IS NULL.';
COMMENT ON TABLE channel_conversations IS 'Canonical cross-channel conversation thread; additive superset of widget_sessions (bridged via widget_session_id). last_inbound_at powers the WhatsApp 24h window.';
COMMENT ON COLUMN channel_conversations.widget_session_id IS 'Bridge to legacy widget_sessions for later, non-breaking migration of the web widget onto channel_conversations.';
