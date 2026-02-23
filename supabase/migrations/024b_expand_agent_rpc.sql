-- ============================================================================
-- 024b: Expand get_user_accessible_agents — add tagline, tags, personality_config
-- ============================================================================
-- Replaces the function from 024 with an expanded return set.
-- CREATE OR REPLACE — safe to run on an already-migrated database.
-- ============================================================================

DROP FUNCTION IF EXISTS get_user_accessible_agents(UUID);

CREATE OR REPLACE FUNCTION get_user_accessible_agents(p_user_id UUID)
RETURNS TABLE (
    assignment_id           UUID,
    assignment_type         TEXT,
    assigned_at             TIMESTAMPTZ,
    config_overrides        JSONB,
    template_id             UUID,
    template_name           TEXT,
    template_emoji          TEXT,
    template_tagline        TEXT,
    template_description    TEXT,
    template_category       TEXT,
    template_plan_tier      TEXT,
    template_version        TEXT,
    template_tags           TEXT[],
    template_personality    JSONB,
    factory_version         INTEGER,
    factory_published_at    TIMESTAMPTZ,
    is_active               BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    WITH user_plan AS (
        SELECT COALESCE(ul.plan_id, 'free') AS plan_id
        FROM auth.users u
        LEFT JOIN user_licenses ul
            ON ul.user_id = u.id AND ul.status = 'active'
        WHERE u.id = p_user_id
        ORDER BY plan_tier_rank(ul.plan_id) DESC NULLS LAST
        LIMIT 1
    ),

    plan_entitled AS (
        SELECT
            NULL::UUID       AS assignment_id,
            'entitled'::TEXT AS assignment_type,
            NOW()            AS assigned_at,
            '{}'::JSONB      AS config_overrides,
            t.id, t.name, t.emoji, t.tagline, t.description,
            t.category, t.plan_tier, t.version, t.tags,
            t.personality_config,
            t.factory_version, t.factory_published_at, t.is_active
        FROM agent_templates t, user_plan up
        WHERE t.is_active = TRUE
          AND plan_tier_rank(t.plan_tier) <= plan_tier_rank(up.plan_id)
    ),

    explicit_assigned AS (
        SELECT
            a.id             AS assignment_id,
            a.assignment_type,
            a.assigned_at,
            a.config_overrides,
            t.id, t.name, t.emoji, t.tagline, t.description,
            t.category, t.plan_tier, t.version, t.tags,
            t.personality_config,
            t.factory_version, t.factory_published_at, t.is_active
        FROM user_agent_assignments a
        JOIN agent_templates t ON t.id = a.template_id
        WHERE a.user_id = p_user_id AND a.is_active = TRUE AND t.is_active = TRUE
    ),

    merged AS (
        SELECT * FROM explicit_assigned
        UNION ALL
        SELECT pe.* FROM plan_entitled pe
        WHERE NOT EXISTS (
            SELECT 1 FROM explicit_assigned ea WHERE ea.id = pe.id
        )
    )

    SELECT
        assignment_id,
        assignment_type,
        assigned_at,
        config_overrides,
        id              AS template_id,
        name            AS template_name,
        emoji           AS template_emoji,
        tagline         AS template_tagline,
        description     AS template_description,
        category        AS template_category,
        plan_tier       AS template_plan_tier,
        version         AS template_version,
        tags            AS template_tags,
        personality_config AS template_personality,
        factory_version,
        factory_published_at,
        is_active
    FROM merged
    ORDER BY
        CASE assignment_type WHEN 'push' THEN 0 ELSE 1 END,
        name;
$$;

GRANT EXECUTE ON FUNCTION get_user_accessible_agents(UUID) TO authenticated;
