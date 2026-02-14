-- ─────────────────────────────────────────────────────────────
-- Bridge Helper Functions
-- ─────────────────────────────────────────────────────────────
-- Functions used by the Bridge API for atomic operations.
-- These avoid race conditions in concurrent API calls.
-- ─────────────────────────────────────────────────────────────

-- 1. Atomic API key request counter increment
-- Used by bridge/auth.ts to safely increment total_requests
CREATE OR REPLACE FUNCTION increment_api_key_requests(key_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE api_keys
    SET
        total_requests = COALESCE(total_requests, 0) + 1,
        last_used_at = NOW()
    WHERE id = key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_api_key_requests IS
    'Atomically increments the request counter and updates last_used_at for an API key';


-- 2. Atomic license AI call counter increment
-- Used by tokens/deduct to safely increment ai_calls_used
CREATE OR REPLACE FUNCTION increment_license_ai_calls(license_id_param UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE user_licenses
    SET ai_calls_used = COALESCE(ai_calls_used, 0) + 1
    WHERE id = license_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_license_ai_calls IS
    'Atomically increments the AI call counter on a user license';


-- 3. Atomic token balance deduction
-- Can be used as an alternative to the trigger-based approach
-- for more explicit control. Returns the new balance.
CREATE OR REPLACE FUNCTION deduct_tokens(
    p_user_id UUID,
    p_amount INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    v_new_balance INTEGER;
BEGIN
    UPDATE token_wallets
    SET
        token_balance = token_balance - p_amount,
        total_used = COALESCE(total_used, 0) + p_amount,
        last_usage_at = NOW()
    WHERE user_id = p_user_id
      AND token_balance >= p_amount
      AND NOT is_frozen
    RETURNING token_balance INTO v_new_balance;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient balance, wallet frozen, or wallet not found';
    END IF;

    RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION deduct_tokens IS
    'Atomically deducts tokens from a user wallet. Fails if insufficient balance or wallet is frozen.';
