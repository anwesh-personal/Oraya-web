-- Migration: 019_ora_key.sql
-- Purpose: Add ORA Key to user_profiles + Device Activations table
-- Date: 2026-02-18
-- Plan: .agent/plans/Active/ora-key-unified-auth.md — Phase 1
--
-- The ORA Key (ORA-XXXX-XXXX-XXXX-XXXX) is a user's unified credential:
--   1. One-time device activation for the desktop app
--   2. API key for third-party integrations
--   3. Branded user identity
--
-- Format: ORA-XXXX-XXXX-XXXX-XXXX
-- Alphabet: ABCDEFGHJKMNPQRSTUVWXYZ23456789 (32 chars, no ambiguous 0/O/I/L/1)
-- Entropy: 16 chars × 5 bits = 80 bits

-- =============================================================================
-- 1. ORA KEY GENERATION FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_ora_key()
RETURNS TRIGGER AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    key TEXT := 'ORA-';
    i INT;
    group_count INT := 0;
BEGIN
    IF NEW.ora_key IS NULL THEN
        -- Generate 16 random characters in groups of 4, separated by dashes
        FOR i IN 1..16 LOOP
            key := key || substr(chars, floor(random() * length(chars) + 1)::int, 1);
            group_count := group_count + 1;
            IF group_count = 4 AND i < 16 THEN
                key := key || '-';
                group_count := 0;
            END IF;
        END LOOP;
        NEW.ora_key := key;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_ora_key() IS 'Auto-generates an ORA Key (ORA-XXXX-XXXX-XXXX-XXXX) for new user profiles';

-- =============================================================================
-- 2. ADD ORA KEY COLUMN TO USER_PROFILES
-- =============================================================================

ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS ora_key TEXT UNIQUE;

COMMENT ON COLUMN user_profiles.ora_key IS 'Unique ORA Key — device activation credential, API key, and user identity';

-- =============================================================================
-- 3. CREATE TRIGGER (fires before INSERT, auto-generates key)
-- =============================================================================

-- Drop if exists to make migration idempotent
DROP TRIGGER IF EXISTS auto_generate_ora_key ON user_profiles;

CREATE TRIGGER auto_generate_ora_key
    BEFORE INSERT ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION generate_ora_key();

-- =============================================================================
-- 4. BACKFILL EXISTING USERS
-- =============================================================================

DO $$
DECLARE
    chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    r RECORD;
    key TEXT;
    i INT;
    gc INT;
    max_retries INT := 5;
    retry INT;
    done BOOLEAN;
BEGIN
    FOR r IN SELECT id FROM user_profiles WHERE ora_key IS NULL LOOP
        done := FALSE;
        retry := 0;

        WHILE NOT done AND retry < max_retries LOOP
            -- Generate a key
            key := 'ORA-';
            gc := 0;
            FOR i IN 1..16 LOOP
                key := key || substr(chars, floor(random() * length(chars) + 1)::int, 1);
                gc := gc + 1;
                IF gc = 4 AND i < 16 THEN
                    key := key || '-';
                    gc := 0;
                END IF;
            END LOOP;

            -- Attempt update; if unique violation, retry with a new key
            BEGIN
                UPDATE user_profiles SET ora_key = key WHERE id = r.id;
                done := TRUE;
            EXCEPTION WHEN unique_violation THEN
                retry := retry + 1;
            END;
        END LOOP;

        IF NOT done THEN
            RAISE EXCEPTION 'Failed to generate unique ORA key for user % after % retries', r.id, max_retries;
        END IF;
    END LOOP;
END $$;

-- =============================================================================
-- 5. MAKE ORA KEY NOT NULL (after backfill ensures all rows have a value)
-- =============================================================================

ALTER TABLE user_profiles
    ALTER COLUMN ora_key SET NOT NULL;

-- =============================================================================
-- 6. INDEX FOR FAST API KEY LOOKUPS
-- =============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_ora_key
    ON user_profiles(ora_key);

-- =============================================================================
-- 7. DEVICE ACTIVATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS device_activations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Owner
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- The ORA key used at activation time (snapshot, not FK — old keys are
    -- deactivated explicitly via the regenerate-key API, not via cascade)
    ora_key TEXT NOT NULL,

    -- Device identification
    device_id TEXT NOT NULL,
    device_name TEXT,
    device_platform TEXT CHECK (device_platform IN ('macos', 'windows', 'linux')),
    device_platform_version TEXT,
    app_version TEXT,

    -- Network context (captured at activation time)
    ip_address INET,
    user_agent TEXT,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),

    -- Timestamps
    activated_at TIMESTAMPTZ DEFAULT NOW(),
    deactivated_at TIMESTAMPTZ,
    deactivated_reason TEXT CHECK (
        deactivated_reason IS NULL OR
        deactivated_reason IN ('user_logout', 'user_revoked', 'admin_revoked', 'key_regenerated', 'device_limit', 'plan_expired')
    ),

    -- One activation per device per user
    UNIQUE(user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_device_activations_user
    ON device_activations(user_id);

CREATE INDEX IF NOT EXISTS idx_device_activations_ora_key
    ON device_activations(ora_key);

CREATE INDEX IF NOT EXISTS idx_device_activations_active
    ON device_activations(is_active)
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_device_activations_device
    ON device_activations(device_id);

COMMENT ON TABLE device_activations IS 'Tracks which devices have been activated with an ORA Key. Each activation links a physical device to a user account.';

-- =============================================================================
-- 8. ROW LEVEL SECURITY FOR DEVICE ACTIVATIONS
-- =============================================================================

ALTER TABLE device_activations ENABLE ROW LEVEL SECURITY;

-- Users can view their own activations
DROP POLICY IF EXISTS "Users can view own device activations" ON device_activations;
CREATE POLICY "Users can view own device activations"
    ON device_activations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can deactivate their own devices
DROP POLICY IF EXISTS "Users can deactivate own devices" ON device_activations;
CREATE POLICY "Users can deactivate own devices"
    ON device_activations
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Platform admins can view and manage all activations
DROP POLICY IF EXISTS "Admins can manage all device activations" ON device_activations;
CREATE POLICY "Admins can manage all device activations"
    ON device_activations
    FOR ALL
    USING (is_platform_admin());

-- =============================================================================
-- 9. UPDATE create_user_profile() TO INCLUDE ORA KEY GENERATION
-- =============================================================================
-- The trigger on user_profiles BEFORE INSERT already handles ora_key generation
-- via auto_generate_ora_key. The existing create_user_profile() function
-- (003_user_profiles.sql) inserts into user_profiles and the trigger fires.
-- No changes needed — the architecture composes correctly.

-- =============================================================================
-- 10. HELPER: Look up user by ORA key
-- =============================================================================

CREATE OR REPLACE FUNCTION get_user_by_ora_key(p_ora_key TEXT)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    full_name TEXT,
    account_status TEXT,
    plan_id TEXT,
    license_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        up.id AS user_id,
        au.email,
        up.full_name,
        up.account_status,
        ul.plan_id,
        ul.status AS license_status
    FROM user_profiles up
    JOIN auth.users au ON au.id = up.id
    LEFT JOIN user_licenses ul ON ul.user_id = up.id
    WHERE up.ora_key = p_ora_key
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_by_ora_key(TEXT) IS 'Resolves an ORA Key to user details + license info. Used by API middleware and device activation.';
