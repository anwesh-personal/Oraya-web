-- Add superadmin user
-- Email: anweshrath@gmail.com
-- 
-- IMPORTANT: This table links to auth.users via user_id
-- The password is managed by Supabase Auth, not stored here.
-- 
-- STEPS TO ADD SUPERADMIN:
-- 1. Create user in Supabase Auth (Dashboard > Authentication > Users > Add User)
--    Email: anweshrath@gmail.com
--    Password: 3edcCDE#
-- 2. Copy the user's UUID from the Auth dashboard
-- 3. Replace 'YOUR_SUPABASE_AUTH_USER_UUID' below with that UUID
-- 4. Run this migration

-- Insert the platform admin record
INSERT INTO platform_admins (
  id,
  user_id,           -- Links to auth.users UUID
  email,
  full_name,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  NULL,              -- Replace with auth.users UUID after creating user in Auth
  'anweshrath@gmail.com',
  'Anwesh Rath',
  'superadmin',      -- Valid roles: superadmin, admin, support, readonly
  TRUE,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Verify insertion
SELECT id, email, full_name, role, is_active, created_at 
FROM platform_admins 
WHERE email = 'anweshrath@gmail.com';
