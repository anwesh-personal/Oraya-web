-- ============================================================================
-- 025: Add icon_url column to agent_templates
-- ============================================================================
-- Allows superadmin to upload a custom image for each agent template.
-- The image is stored in Supabase Storage (agent-icons bucket) and the
-- public URL is saved here.
-- ============================================================================

ALTER TABLE agent_templates
    ADD COLUMN IF NOT EXISTS icon_url TEXT;
