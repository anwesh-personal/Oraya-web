-- ============================================================================
-- 051: Add config JSONB column to widget_deployments
-- Stores extended widget configuration not covered by dedicated columns:
--   tone, personality_override, window_style, company_logo_url,
--   training_qa, raw_context, agent_display_name, agent_bio, model, etc.
-- ============================================================================

ALTER TABLE widget_deployments
    ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}';

COMMENT ON COLUMN widget_deployments.config IS 'Extended widget configuration JSONB: tone, personality, window_style, company_logo, training_qa, raw_context, etc.';
