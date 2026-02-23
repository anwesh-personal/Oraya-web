-- ============================================================================
-- 024: Plan-Based Agent Entitlement
-- ============================================================================
-- Adds a database function that returns all agent templates accessible to a
-- given user via EITHER:
--   1. Their plan tier (hierarchical — enterprise sees free+pro+team+enterprise)
--   2. An explicit superadmin assignment (push or entitled)
--
-- This replaces the previous assignment-only lookup, which required an
-- explicit row in user_agent_assignments for every user/template pair.
--
-- Tier hierarchy (inclusive, cumulative):
--   free       → free
--   pro        → free, pro
--   team       → free, pro, team
--   enterprise → free, pro, team, enterprise
-- ============================================================================

-- ─── Helper: resolve tier rank ────────────────────────────────────────────────
-- Maps a plan_tier string to an integer rank so we can do >= comparisons.

CREATE OR REPLACE FUNCTION plan_tier_rank(tier TEXT)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
    SELECT CASE tier
        WHEN 'free'       THEN 1
        WHEN 'pro'        THEN 2
        WHEN 'team'       THEN 3
        WHEN 'enterprise' THEN 4
        ELSE 0
    END;
$$;

-- ─── Main function: get all agents accessible to a user ───────────────────────
-- Returns agent templates the given user may access, along with how access
-- was granted (assignment_type: 'push' | 'entitled').
--
-- When a template is BOTH plan-entitled AND explicitly assigned, the explicit
-- assignment row wins (it may carry config_overrides / custom_core_prompt).

CREATE OR REPLACE FUNCTION get_user_accessible_agents(p_user_id UUID)
RETURNS TABLE (
    -- From user_agent_assignments (when explicitly assigned)
    assignment_id       UUID,
    assignment_type     TEXT,
    assigned_at         TIMESTAMPTZ,
    config_overrides    JSONB,
    -- From agent_templates
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
            COALESCE(ul.plan_id, 'free') AS plan_id
        FROM auth.users u
        LEFT JOIN user_licenses ul
            ON ul.user_id = u.id
            AND ul.status = 'active'
        WHERE u.id = p_user_id
        -- Prefer the highest-ranked plan if somehow multiple active licenses exist
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

    -- All templates explicitly assigned to this user by a superadmin
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

    -- Union: explicit assignment takes priority over plan entitlement
    -- when both exist for the same template (DISTINCT ON template_id, prefer explicit)
    merged AS (
        SELECT * FROM explicit_assigned

        UNION ALL

        -- Plan-entitled rows that have no explicit assignment
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
        -- Push assignments first, then entitled, then by name
        CASE assignment_type WHEN 'push' THEN 0 ELSE 1 END,
        name;
$$;

-- Grant execute to authenticated users (RLS on underlying tables still applies
-- to the RLS-unaware context, but this function uses SECURITY DEFINER so it
-- runs as the function owner with full access — safe because we always filter
-- by p_user_id and is_active)
GRANT EXECUTE ON FUNCTION get_user_accessible_agents(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION plan_tier_rank(TEXT) TO authenticated;
