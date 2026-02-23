-- ============================================================================
-- 027: Standardize Plans — No Free Tier
-- ============================================================================
-- Renames "free" plan to "standard" and updates all pricing.
-- Tier hierarchy: standard < pro < team < enterprise
--
-- Pricing:
--   Standard: $20/mo  | $197/yr
--   Pro:      $67/mo  | $497/yr
--   Team:     $200/mo | $1,497/yr
--   Enterprise: $997/mo | $8,997/yr
-- ============================================================================

-- ─── 1. Update agent_templates that reference "free" tier ──────────────────
UPDATE agent_templates
SET plan_tier = 'standard'
WHERE plan_tier = 'free';

-- ─── 2. Update user_licenses that reference "free" plan ────────────────────
UPDATE user_licenses
SET plan_id = 'standard'
WHERE plan_id = 'free';

-- ─── 3. Rename the plan row (PK change) ───────────────────────────────────
-- Since plan_id is referenced as FK, we update the row in-place
UPDATE plans SET
    id = 'standard',
    name = 'Standard',
    description = 'Everything you need to get started with Oraya',
    price_monthly = 20.00,
    price_yearly = 197.00,
    max_agents = 3,
    max_devices = 2,
    features = '["local_ai_only", "multi_device", "basic_support"]'
WHERE id = 'free';

-- ─── 4. Update Pro plan pricing ───────────────────────────────────────────
UPDATE plans SET
    price_monthly = 67.00,
    price_yearly = 497.00,
    description = 'For power users and professionals',
    max_agents = 5,
    max_devices = 3,
    features = '["managed_ai", "priority_support", "advanced_analytics", "multi_device", "voice_ai"]'
WHERE id = 'pro';

-- ─── 5. Update Team plan pricing ──────────────────────────────────────────
UPDATE plans SET
    price_monthly = 200.00,
    price_yearly = 1497.00,
    description = 'For teams that move fast',
    max_agents = 15,
    max_devices = 10,
    features = '["managed_ai", "team_sync", "shared_agents", "priority_support", "unlimited_devices", "voice_ai", "research"]'
WHERE id = 'team';

-- ─── 6. Update Enterprise plan pricing ────────────────────────────────────
UPDATE plans SET
    price_monthly = 997.00,
    price_yearly = 8997.00,
    description = 'Custom solutions for organizations at scale',
    max_agents = -1,
    max_devices = -1,
    features = '["everything", "custom_deployment", "dedicated_support", "sla", "premium_security", "white_label"]'
WHERE id = 'enterprise';

-- ─── 7. Update plan display order ─────────────────────────────────────────
UPDATE plans SET display_order = 1 WHERE id = 'standard';
UPDATE plans SET display_order = 2 WHERE id = 'pro';
UPDATE plans SET display_order = 3 WHERE id = 'team';
UPDATE plans SET display_order = 4 WHERE id = 'enterprise';

-- ─── 8. Update plan_tier_rank() function ──────────────────────────────────
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

-- ─── 9. Update get_user_accessible_agents to default to NULL not 'free' ───
CREATE OR REPLACE FUNCTION get_user_accessible_agents(p_user_id UUID)
RETURNS TABLE (
    assignment_id       UUID,
    assignment_type     TEXT,
    assigned_at         TIMESTAMPTZ,
    config_overrides    JSONB,
    template_id         UUID,
    template_name       TEXT,
    template_emoji      TEXT,
    template_description TEXT,
    template_category   TEXT,
    template_plan_tier  TEXT,
    template_version    TEXT,
    template_tags       TEXT[],
    factory_version     INTEGER,
    factory_published_at TIMESTAMPTZ,
    is_active           BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    -- Resolve the user's current plan tier
    WITH user_plan AS (
        SELECT
            COALESCE(ul.plan_id, 'standard') AS plan_id
        FROM auth.users u
        LEFT JOIN user_licenses ul
            ON ul.user_id = u.id
            AND ul.status = 'active'
        WHERE u.id = p_user_id
        ORDER BY plan_tier_rank(ul.plan_id) DESC NULLS LAST
        LIMIT 1
    ),

    -- All templates the user's plan entitles them to
    plan_entitled AS (
        SELECT
            NULL::UUID          AS assignment_id,
            'entitled'::TEXT    AS assignment_type,
            NOW()               AS assigned_at,
            '{}'::JSONB         AS config_overrides,
            t.id                AS template_id,
            t.name,
            t.emoji,
            t.description,
            t.category,
            t.plan_tier,
            t.version,
            t.tags,
            t.factory_version,
            t.factory_published_at,
            t.is_active
        FROM agent_templates t, user_plan up
        WHERE t.is_active = TRUE
          AND plan_tier_rank(t.plan_tier) <= plan_tier_rank(up.plan_id)
    ),

    -- Explicitly assigned templates
    explicit_assigned AS (
        SELECT
            a.id                AS assignment_id,
            a.assignment_type,
            a.assigned_at,
            a.config_overrides,
            t.id                AS template_id,
            t.name,
            t.emoji,
            t.description,
            t.category,
            t.plan_tier,
            t.version,
            t.tags,
            t.factory_version,
            t.factory_published_at,
            t.is_active
        FROM user_agent_assignments a
        JOIN agent_templates t ON t.id = a.template_id
        WHERE a.user_id   = p_user_id
          AND a.is_active  = TRUE
          AND t.is_active  = TRUE
    ),

    merged AS (
        SELECT * FROM explicit_assigned
        UNION ALL
        SELECT pe.* FROM plan_entitled pe
        WHERE NOT EXISTS (
            SELECT 1 FROM explicit_assigned ea
            WHERE ea.template_id = pe.template_id
        )
    )

    SELECT
        assignment_id,
        assignment_type,
        assigned_at,
        config_overrides,
        template_id,
        name              AS template_name,
        emoji             AS template_emoji,
        description       AS template_description,
        category          AS template_category,
        plan_tier         AS template_plan_tier,
        version           AS template_version,
        tags              AS template_tags,
        factory_version,
        factory_published_at,
        is_active
    FROM merged
    ORDER BY
        CASE assignment_type WHEN 'push' THEN 0 ELSE 1 END,
        name;
$$;
