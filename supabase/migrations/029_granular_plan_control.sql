-- ============================================================================
-- 029: Granular Plan Control & Agent Permissions
-- ============================================================================
-- Adds support for explicit agent template permissions and organization 
-- default limits to the plans table.
-- ============================================================================

-- ─── 1. Add new columns to plans ──────────────────────────────────────────
ALTER TABLE plans ADD COLUMN IF NOT EXISTS allowed_template_ids UUID[] DEFAULT '{}';
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_members_default INTEGER DEFAULT 5;

-- ─── 2. Update existing plans with sensible defaults ──────────────────────
-- Metadata for organization-specific defaults
UPDATE plans SET max_members_default = 1 WHERE id = 'standard';
UPDATE plans SET max_members_default = 3 WHERE id = 'pro';
UPDATE plans SET max_members_default = 10 WHERE id = 'team';
UPDATE plans SET max_members_default = -1 WHERE id = 'enterprise';

-- ─── 3. Modify get_user_accessible_agents() ───────────────────────────────
-- Modernized RPC that checks both hierarchical tier rank AND explicit 
-- template IDs allowed for the plan.
-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS get_user_accessible_agents(UUID);
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
    -- Resolve the user's current plan and its allowed_template_ids
    WITH user_plan AS (
        SELECT
            COALESCE(ul.plan_id, 'standard') AS plan_id,
            p.allowed_template_ids
        FROM auth.users u
        LEFT JOIN user_licenses ul
            ON ul.user_id = u.id
            AND ul.status = 'active'
        LEFT JOIN plans p ON p.id = ul.plan_id
        WHERE u.id = p_user_id
        ORDER BY plan_tier_rank(ul.plan_id) DESC NULLS LAST
        LIMIT 1
    ),

    -- All templates that meet EITHER:
    -- 1. Tier hierarchy (rank <= user_plan.rank)
    -- 2. Explicitly allowed in the plan.allowed_template_ids array
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
          AND (
              plan_tier_rank(t.plan_tier) <= plan_tier_rank(up.plan_id)
              OR (t.id = ANY(up.allowed_template_ids))
          )
    ),

    -- Explicitly assigned templates (Push)
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
