-- ============================================================================
-- 041: Fix Sync Agents RPC — Return Full Template Data
-- ============================================================================
-- The `get_user_accessible_agents()` RPC was missing critical columns:
--   core_prompt, personality_config, tagline, icon_url
--
-- Without these, the Desktop sync-agents pipeline installs agents as empty
-- shells — no system prompt, no personality, no avatar. This migration
-- rebuilds the RPC to return the complete template payload so the Desktop
-- can hydrate agents fully on installation.
--
-- Also adds `is_ide_specialist` so the Desktop can classify specialists
-- without a separate RPC call.
-- ============================================================================

DROP FUNCTION IF EXISTS get_user_accessible_agents(UUID);

CREATE OR REPLACE FUNCTION get_user_accessible_agents(p_user_id UUID)
RETURNS TABLE (
    assignment_id        UUID,
    assignment_type      TEXT,
    assigned_at          TIMESTAMPTZ,
    config_overrides     JSONB,
    template_id          UUID,
    template_name        TEXT,
    template_emoji       TEXT,
    template_tagline     TEXT,
    template_description TEXT,
    template_category    TEXT,
    template_plan_tier   TEXT,
    template_version     TEXT,
    template_tags        TEXT[],
    template_core_prompt TEXT,
    template_personality JSONB,
    template_icon_url    TEXT,
    factory_version      INTEGER,
    factory_published_at TIMESTAMPTZ,
    is_active            BOOLEAN,
    is_ide_specialist    BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    -- Resolve the user's current best plan (highest display_order wins)
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

    -- All templates entitled by the user's plan (tier rank ≤ user plan rank)
    plan_entitled AS (
        SELECT
            NULL::UUID       AS assignment_id,
            'entitled'::TEXT AS assignment_type,
            NOW()            AS assigned_at,
            '{}'::JSONB      AS config_overrides,
            t.id             AS template_id,
            t.name,
            t.emoji,
            t.tagline,
            t.description,
            t.category,
            t.plan_tier,
            t.version,
            t.tags,
            t.core_prompt,
            t.personality_config,
            t.icon_url,
            t.factory_version,
            t.factory_published_at,
            t.is_active,
            t.is_ide_specialist
        FROM agent_templates t, user_plan up
        WHERE t.is_active = TRUE
          AND plan_tier_rank(t.plan_tier) <= plan_tier_rank(up.plan_id)
    ),

    -- Templates explicitly assigned (push / individual override)
    explicit_assigned AS (
        SELECT
            a.id             AS assignment_id,
            a.assignment_type,
            a.assigned_at,
            a.config_overrides,
            t.id             AS template_id,
            t.name,
            t.emoji,
            t.tagline,
            t.description,
            t.category,
            t.plan_tier,
            t.version,
            t.tags,
            t.core_prompt,
            t.personality_config,
            t.icon_url,
            t.factory_version,
            t.factory_published_at,
            t.is_active,
            t.is_ide_specialist
        FROM user_agent_assignments a
        JOIN agent_templates t ON t.id = a.template_id
        WHERE a.user_id  = p_user_id
          AND a.is_active = TRUE
          AND t.is_active = TRUE
    ),

    -- Merge: explicit assignments take precedence; plan-entitled fills the rest
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
        tagline           AS template_tagline,
        description       AS template_description,
        category          AS template_category,
        plan_tier         AS template_plan_tier,
        version           AS template_version,
        tags              AS template_tags,
        core_prompt       AS template_core_prompt,
        personality_config AS template_personality,
        icon_url          AS template_icon_url,
        factory_version,
        factory_published_at,
        is_active,
        is_ide_specialist
    FROM merged
    ORDER BY
        CASE assignment_type WHEN 'push' THEN 0 ELSE 1 END,
        name;
$$;

COMMENT ON FUNCTION get_user_accessible_agents(UUID) IS
'Returns all agent templates accessible to a user via their plan tier and
explicit assignments. Now includes core_prompt, personality_config, tagline,
icon_url, and is_ide_specialist for full Desktop hydration on sync.';
