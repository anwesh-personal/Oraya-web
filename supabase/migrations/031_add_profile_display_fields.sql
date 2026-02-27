-- Migration: 031_add_profile_display_fields.sql
-- Purpose: Add display_name and organization text fields to user_profiles.
--
-- display_name: How the user wants to be addressed (distinct from full_name).
-- organization: Free-text company / team name the user self-describes.
--               This is NOT the same as platform org membership
--               (which comes from organization_members). It is a simple
--               user-editable string shown in the profile form.
-- Date: 2026-02-27

-- =============================================================================
-- ADD COLUMNS
-- =============================================================================

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT;

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS organization TEXT;

COMMENT ON COLUMN user_profiles.display_name
  IS 'How the user prefers to be addressed (e.g. nickname, first name). Falls back to full_name.';

COMMENT ON COLUMN user_profiles.organization
  IS 'Self-described company or team name. Not tied to platform org membership.';
