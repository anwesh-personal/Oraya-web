-- ============================================================================
-- 045: Compile Specialist Prompts and Examples
-- ============================================================================
-- The Desktop Sync pipeline relies entirely on the `get_user_accessible_agents`
-- RPC to pull down new/updated cloud agents. Previously, this RPC only 
-- returned the raw `core_prompt` column from `agent_templates`. The rich
-- instructions in `agent_template_prompts` and few-shot examples in
-- `agent_template_examples` were stranded on the Supabase instance.
--
-- This migration updates the RPC to dynamically compile these tables
-- into a single, massive, rich `core_prompt` payload. 
-- When Desktop syncs, it now receives the fully assembled prompt stack,
-- granting the IDE agents their personality, training, and memory tools natively.
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

    -- All templates entitled by the user's plan (tier rank <= user plan rank)
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
            (
                COALESCE(t.core_prompt, '') || 
                COALESCE((
                    SELECT E'\n\n' || string_agg(
                        E'=== ' || upper(prompt_type) || E' ===\n' || content,
                        E'\n\n' ORDER BY priority ASC
                    )
                    FROM agent_template_prompts
                    WHERE template_id = t.id AND is_active = true
                ), '') ||
                COALESCE((
                    SELECT E'\n\n=== EXAMPLES ===\n' || string_agg(
                        E'Example: ' || COALESCE(explanation, 'Interaction') || E'\nUser: ' || user_input || E'\nAgent: ' || expected_output,
                        E'\n\n' ORDER BY sort_order ASC
                    )
                    FROM agent_template_examples
                    WHERE template_id = t.id AND is_active = true
                ), '')
            ) AS core_prompt,
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
            (
                COALESCE(t.core_prompt, '') || 
                COALESCE((
                    SELECT E'\n\n' || string_agg(
                        E'=== ' || upper(prompt_type) || E' ===\n' || content,
                        E'\n\n' ORDER BY priority ASC
                    )
                    FROM agent_template_prompts
                    WHERE template_id = t.id AND is_active = true
                ), '') ||
                COALESCE((
                    SELECT E'\n\n=== EXAMPLES ===\n' || string_agg(
                        E'Example: ' || COALESCE(explanation, 'Interaction') || E'\nUser: ' || user_input || E'\nAgent: ' || expected_output,
                        E'\n\n' ORDER BY sort_order ASC
                    )
                    FROM agent_template_examples
                    WHERE template_id = t.id AND is_active = true
                ), '')
            ) AS core_prompt,
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
'Returns all agent templates accessible to a user. Now dynamically aggregates agent_template_prompts and agent_template_examples directly into template_core_prompt so desktop clients receive the full instruction stack without needing dedicated endpoints.';
