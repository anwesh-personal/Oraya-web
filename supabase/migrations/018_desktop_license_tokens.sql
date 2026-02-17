-- Migration: 018_desktop_license_tokens.sql
-- Purpose: Audit trail for signed desktop license tokens (OLTs)
-- Supports token revocation and issuance tracking
-- Date: 2026-02-17

-- =============================================================================
-- DESKTOP LICENSE TOKENS (AUDIT TRAIL)
-- =============================================================================

CREATE TABLE IF NOT EXISTS desktop_license_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  license_id UUID NOT NULL REFERENCES user_licenses(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  activation_id UUID REFERENCES license_activations(id) ON DELETE SET NULL,

  -- Token identity
  token_jti TEXT UNIQUE NOT NULL,

  -- Lifecycle
  issued_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP,
  revoked_reason TEXT,

  -- Context (for audit)
  ip_address TEXT,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast JTI lookups (used during token verification)
CREATE INDEX IF NOT EXISTS idx_desktop_tokens_jti
  ON desktop_license_tokens(token_jti);

-- Index for finding all tokens for a device (used during deactivation/revocation)
CREATE INDEX IF NOT EXISTS idx_desktop_tokens_device
  ON desktop_license_tokens(license_id, device_id);

-- Index for finding active (non-revoked) tokens
CREATE INDEX IF NOT EXISTS idx_desktop_tokens_active
  ON desktop_license_tokens(license_id, is_revoked)
  WHERE is_revoked = FALSE;

-- Index for cleanup of expired tokens
CREATE INDEX IF NOT EXISTS idx_desktop_tokens_expiry
  ON desktop_license_tokens(expires_at)
  WHERE is_revoked = FALSE;

COMMENT ON TABLE desktop_license_tokens IS 'Audit trail for all desktop license tokens (OLTs) ever issued. Supports revocation checking.';
COMMENT ON COLUMN desktop_license_tokens.token_jti IS 'JWT ID (jti claim) — unique identifier for each token';
COMMENT ON COLUMN desktop_license_tokens.is_revoked IS 'When true, the desktop app should reject this token on next server check';

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE desktop_license_tokens ENABLE ROW LEVEL SECURITY;

-- Users can view their own tokens (via license ownership)
DROP POLICY IF EXISTS "Users can view own tokens" ON desktop_license_tokens;
CREATE POLICY "Users can view own tokens" ON desktop_license_tokens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_licenses
      WHERE user_licenses.id = desktop_license_tokens.license_id
        AND user_licenses.user_id = auth.uid()
    )
  );

-- Admins can view and manage all tokens
DROP POLICY IF EXISTS "Admins can manage all tokens" ON desktop_license_tokens;
CREATE POLICY "Admins can manage all tokens" ON desktop_license_tokens
  FOR ALL USING (is_platform_admin());

-- Service role can insert/update (for the API endpoints)
-- Note: Service role bypasses RLS, so no explicit policy needed.

-- =============================================================================
-- CLEANUP FUNCTION
-- =============================================================================

-- Automatically clean up tokens that expired more than 90 days ago.
-- This includes BOTH revoked tokens AND tokens that expired naturally
-- (normal lifecycle — never explicitly revoked).
-- Should be called periodically (e.g., via a cron job or pg_cron).
CREATE OR REPLACE FUNCTION cleanup_expired_desktop_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM desktop_license_tokens
  WHERE expires_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_desktop_tokens IS 'Removes all tokens (revoked or expired) older than 90 days';
