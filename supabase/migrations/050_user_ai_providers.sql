-- ============================================================================
-- 050: User AI Providers — Bring-Your-Own-Key Infrastructure
-- ============================================================================
-- Users configure their own AI provider API keys (OpenAI, Anthropic, Google,
-- Mistral, xAI/Grok, or any custom OpenAI-compatible endpoint).
-- Keys are encrypted at rest via pgcrypto + server-side secret.
-- Each key stores its dynamically-fetched available models.
-- ============================================================================

-- Ensure pgcrypto is available for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── User AI Providers ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_ai_providers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Provider identity
    provider            TEXT NOT NULL CHECK (provider IN (
                            'openai', 'anthropic', 'google', 'mistral', 'xai', 'custom'
                        )),
    label               TEXT NOT NULL,
    
    -- Credentials (encrypted)
    api_key_encrypted   TEXT NOT NULL,
    api_key_hint        TEXT NOT NULL,           -- Last 4 chars for display: "...xK9m"
    base_url            TEXT,                    -- Custom providers only

    -- Validation state
    is_valid            BOOLEAN NOT NULL DEFAULT false,
    validated_at        TIMESTAMPTZ,
    validation_error    TEXT,

    -- Dynamic model catalog (fetched from provider)
    available_models    JSONB NOT NULL DEFAULT '[]',
    models_fetched_at   TIMESTAMPTZ,

    -- Status
    is_active           BOOLEAN NOT NULL DEFAULT true,

    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User's providers list
CREATE INDEX IF NOT EXISTS idx_user_ai_providers_user
    ON user_ai_providers (user_id, is_active)
    WHERE is_active = true;

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE user_ai_providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_ai_providers_user_crud" ON user_ai_providers;
CREATE POLICY "user_ai_providers_user_crud" ON user_ai_providers
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_ai_providers_service" ON user_ai_providers;
CREATE POLICY "user_ai_providers_service" ON user_ai_providers
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ─── Auto-update trigger ────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trigger_user_ai_providers_updated_at ON user_ai_providers;
CREATE TRIGGER trigger_user_ai_providers_updated_at
    BEFORE UPDATE ON user_ai_providers
    FOR EACH ROW EXECUTE FUNCTION update_widget_updated_at();

-- ─── Extend widget_deployments with user provider reference ─────────────────

ALTER TABLE widget_deployments
    ADD COLUMN IF NOT EXISTS user_provider_id UUID REFERENCES user_ai_providers(id) ON DELETE SET NULL;

COMMENT ON TABLE user_ai_providers IS 'User-supplied AI provider API keys with encrypted storage and dynamic model catalogs.';
COMMENT ON COLUMN user_ai_providers.api_key_encrypted IS 'AES-256-CBC encrypted API key. Decrypted server-side only.';
COMMENT ON COLUMN user_ai_providers.api_key_hint IS 'Last 4 characters of the key for display purposes (e.g., "...xK9m").';
COMMENT ON COLUMN user_ai_providers.available_models IS 'JSONB array of model objects fetched from the provider API.';
