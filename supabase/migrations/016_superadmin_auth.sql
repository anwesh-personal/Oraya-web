-- Migration: 016_superadmin_auth.sql
-- Purpose: Independent auth for superadmins (separate from Supabase Auth)
-- Date: 2026-02-10

-- Add password_hash column to platform_admins
ALTER TABLE platform_admins 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Remove the user_id constraint - superadmins don't use auth.users
ALTER TABLE platform_admins 
ALTER COLUMN user_id DROP NOT NULL;

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_platform_admins_email_active 
ON platform_admins(email) WHERE is_active = TRUE;

-- Update the existing superadmin with a hashed password
-- Password: 3edcCDE#
-- bcrypt hash (12 rounds)
UPDATE platform_admins 
SET password_hash = '$2a$12$eIslKL0/DiGjcdsCAZAGLO51Izn7nzESDn4HOOQYU1mSUQVFgbKWK',
    user_id = NULL
WHERE email = 'anweshrath@gmail.com';

-- Add comment explaining the auth model
COMMENT ON COLUMN platform_admins.password_hash IS 'bcrypt hashed password for superadmin-only auth (independent of Supabase Auth)';
COMMENT ON COLUMN platform_admins.user_id IS 'Optional link to auth.users - NULL for superadmins, can be set for admins who are also members';
