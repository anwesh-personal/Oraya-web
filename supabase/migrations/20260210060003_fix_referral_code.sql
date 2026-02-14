-- FIX: generate_referral_code needs access to pgcrypto's gen_random_bytes
-- The function runs in the context of whoever triggers it. When GoTrue's 
-- supabase_auth_admin role fires the user creation triggers, the extensions
-- schema (where pgcrypto lives) is NOT in the search_path, causing 
-- "function gen_random_bytes(integer) does not exist" error.
-- This cascading failure is what causes "Database error saving new user".

CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := encode(extensions.gen_random_bytes(6), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;
