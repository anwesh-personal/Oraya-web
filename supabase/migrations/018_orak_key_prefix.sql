-- Migration: Update API key prefix from ora_ to ORAK-
-- Run in Supabase SQL Editor (Dashboard > SQL > New Query)

CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.api_key IS NULL THEN
    NEW.api_key := 'ORAK-' || encode(gen_random_bytes(32), 'hex');
    NEW.api_key_prefix := LEFT(NEW.api_key, 12);
    NEW.key_hash := encode(digest(NEW.api_key, 'sha256'), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
