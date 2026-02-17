-- Migration: 020_plan_org_enforcement.sql
-- Purpose: Add requires_organization flag to plans, enforcing that certain
--          plans (Team, Enterprise) can only be assigned to users who belong
--          to an organization (team). Also adds a DB-level check on
--          team_members to enforce max_members limits.
-- Date: 2026-02-18

-- =============================================================================
-- 1. ADD requires_organization TO plans
-- =============================================================================

ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS requires_organization BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN plans.requires_organization
  IS 'If true, users on this plan MUST be a member of at least one team (organization).';

-- Update existing plans: team and enterprise require organization membership
UPDATE plans SET requires_organization = TRUE WHERE id IN ('team', 'enterprise');
UPDATE plans SET requires_organization = FALSE WHERE id IN ('free', 'pro');

-- =============================================================================
-- 2. ENFORCE max_members ON team_members INSERT
-- =============================================================================
-- Prevents adding members beyond the team's max_members limit.
-- This fires BEFORE INSERT so the row is rejected if the team is full.

CREATE OR REPLACE FUNCTION enforce_team_max_members()
RETURNS TRIGGER AS $$
DECLARE
  v_max_members INTEGER;
  v_current_count INTEGER;
BEGIN
  -- Get the team's max_members limit
  SELECT max_members INTO v_max_members
    FROM teams
    WHERE id = NEW.team_id;

  -- -1 or NULL means unlimited
  IF v_max_members IS NULL OR v_max_members < 0 THEN
    RETURN NEW;
  END IF;

  -- Count current active members (excluding the one being inserted)
  SELECT COUNT(*) INTO v_current_count
    FROM team_members
    WHERE team_id = NEW.team_id
      AND status IN ('active', 'invited');

  IF v_current_count >= v_max_members THEN
    RAISE EXCEPTION 'Team has reached its maximum member limit of %', v_max_members
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate to avoid "already exists" on re-run
DROP TRIGGER IF EXISTS enforce_max_members_on_insert ON team_members;
CREATE TRIGGER enforce_max_members_on_insert
  BEFORE INSERT ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION enforce_team_max_members();

COMMENT ON FUNCTION enforce_team_max_members()
  IS 'Prevents adding members beyond the team max_members limit. -1 or NULL = unlimited.';

-- =============================================================================
-- 3. ENFORCE max_devices ON device_activations INSERT
-- =============================================================================
-- Prevents activating more devices than the user's plan allows.

CREATE OR REPLACE FUNCTION enforce_max_devices()
RETURNS TRIGGER AS $$
DECLARE
  v_max_devices INTEGER;
  v_current_count INTEGER;
  v_plan_id TEXT;
BEGIN
  -- Find the user's active plan
  SELECT ul.plan_id INTO v_plan_id
    FROM user_licenses ul
    WHERE ul.user_id = NEW.user_id
      AND ul.status = 'active'
    ORDER BY ul.created_at DESC
    LIMIT 1;

  -- No active license → allow (or you could block; allowing is safer for free users)
  IF v_plan_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get the plan's max_devices limit
  SELECT p.max_devices INTO v_max_devices
    FROM plans p
    WHERE p.id = v_plan_id;

  -- -1 or NULL means unlimited
  IF v_max_devices IS NULL OR v_max_devices < 0 THEN
    RETURN NEW;
  END IF;

  -- Count currently active devices for this user
  SELECT COUNT(*) INTO v_current_count
    FROM device_activations
    WHERE user_id = NEW.user_id
      AND is_active = TRUE;

  IF v_current_count >= v_max_devices THEN
    RAISE EXCEPTION 'Device limit reached: your plan allows % device(s)', v_max_devices
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_max_devices_on_activation ON device_activations;
CREATE TRIGGER enforce_max_devices_on_activation
  BEFORE INSERT ON device_activations
  FOR EACH ROW
  WHEN (NEW.is_active = TRUE)
  EXECUTE FUNCTION enforce_max_devices();

COMMENT ON FUNCTION enforce_max_devices()
  IS 'Prevents activating more devices than the user plan max_devices limit. -1 or NULL = unlimited.';

-- =============================================================================
-- 4. HELPER: Check if a user belongs to any active team
-- =============================================================================

CREATE OR REPLACE FUNCTION user_has_organization(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
      FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      WHERE tm.user_id = user_uuid
        AND tm.status = 'active'
        AND t.is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION user_has_organization(UUID)
  IS 'Returns TRUE if the user is an active member of at least one active team.';

-- =============================================================================
-- 5. HELPER: Get user's current active plan ID
-- =============================================================================

CREATE OR REPLACE FUNCTION get_user_plan_id(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  v_plan_id TEXT;
BEGIN
  SELECT plan_id INTO v_plan_id
    FROM user_licenses
    WHERE user_id = user_uuid
      AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;

  RETURN v_plan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_plan_id(UUID)
  IS 'Returns the plan_id of the user''s most recent active license, or NULL.';
