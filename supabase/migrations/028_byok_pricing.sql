-- ============================================================================
-- 028: BYOK Pricing and Plan Standardization Refinement
-- ============================================================================
-- Adds BYOK (Bring Your Own Key) pricing columns to the plans table.
-- Adds is_byok flag to user_licenses for plan modifiers.
-- Updates existing plans with suggested BYOK pricing.
-- ============================================================================

-- ─── 1. Add BYOK columns to plans ───────────────────────────────────────────
ALTER TABLE plans ADD COLUMN IF NOT EXISTS price_monthly_byok DECIMAL(10,2);
ALTER TABLE plans ADD COLUMN IF NOT EXISTS price_yearly_byok DECIMAL(10,2);

-- ─── 2. Add is_byok flag to user_licenses ────────────────────────────────────
ALTER TABLE user_licenses ADD COLUMN IF NOT EXISTS is_byok BOOLEAN DEFAULT FALSE;

-- ─── 3. Update plans with BYOK pricing ──────────────────────────────────────
-- Standard: $20/mo ($10 BYOK) | $197/yr ($97 BYOK)
UPDATE plans SET
    price_monthly_byok = 10.00,
    price_yearly_byok = 97.00
WHERE id = 'standard';

-- Pro: $67/mo ($35 BYOK) | $497/yr ($247 BYOK)
UPDATE plans SET
    price_monthly_byok = 35.00,
    price_yearly_byok = 247.00
WHERE id = 'pro';

-- Team: $200/mo ($100 BYOK) | $1497/yr ($747 BYOK)
UPDATE plans SET
    price_monthly_byok = 100.00,
    price_yearly_byok = 747.00
WHERE id = 'team';

-- Enterprise: $997/mo ($497 BYOK) | $8997/yr ($4497 BYOK)
UPDATE plans SET
    price_monthly_byok = 497.00,
    price_yearly_byok = 4497.00
WHERE id = 'enterprise';

-- ─── 4. Re-calculate plan_tier_rank for safety ──────────────────────────────
-- (Already handled in 027 but good to ensure standard/pro/team/enterprise order)
CREATE OR REPLACE FUNCTION plan_tier_rank(tier TEXT)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
    SELECT CASE tier
        WHEN 'standard'   THEN 1
        WHEN 'pro'        THEN 2
        WHEN 'team'       THEN 3
        WHEN 'enterprise' THEN 4
        ELSE 0
    END;
$$;
