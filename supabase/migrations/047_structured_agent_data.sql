-- ============================================================================
-- 047: Return Structured Agent Data (Un-blob the Compilation)
-- ============================================================================
-- Reverts the blob compilation from 045/046. Instead of stitching prompt stack,
-- training examples, rules, and KB into a single core_prompt string, returns
-- each category as a separate JSONB array.
--
-- The desktop client receives:
--   • template_core_prompt   → ONLY the base core_prompt (identity text)
--   • prompt_stack_items     → JSONB array of prompt stack entries
--   • training_examples      → JSONB array of few-shot examples
--   • behavioral_rules       → JSONB array of guardrail rules
--   • knowledge_entries      → JSONB array of KB articles (manual type only)
--
-- This allows the desktop to store, display, and manage each category
-- independently — they have different purposes and access patterns.
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
    is_ide_specialist    BOOLEAN,
    -- NEW: Structured data fields (separate from core_prompt)
    prompt_stack_items   JSONB,
    training_examples    JSONB,
    behavioral_rules     JSONB,
    knowledge_entries    JSONB
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
            -- ONLY the base core prompt (no compilation)
            COALESCE(t.core_prompt, '') AS core_prompt,
            t.personality_config,
            t.icon_url,
            t.factory_version,
            t.factory_published_at,
            t.is_active,
            t.is_ide_specialist,
            -- Prompt Stack as structured JSONB array
            COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                    'prompt_type', prompt_type,
                    'content', content,
                    'priority', priority,
                    'is_active', is_active
                ) ORDER BY priority ASC)
                FROM agent_template_prompts
                WHERE template_id = t.id AND is_active = true
            ), '[]'::JSONB) AS prompt_stack_items,
            -- Training Examples as structured JSONB array
            COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                    'user_input', user_input,
                    'expected_output', expected_output,
                    'explanation', explanation,
                    'sort_order', sort_order,
                    'is_active', is_active
                ) ORDER BY sort_order ASC)
                FROM agent_template_examples
                WHERE template_id = t.id AND is_active = true
            ), '[]'::JSONB) AS training_examples,
            -- Behavioral Rules as structured JSONB array
            COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                    'rule_type', rule_type,
                    'content', content,
                    'severity', severity,
                    'sort_order', sort_order,
                    'is_active', is_active
                ) ORDER BY 
                    CASE severity WHEN 'critical' THEN 0 WHEN 'important' THEN 1 ELSE 2 END ASC,
                    sort_order ASC)
                FROM agent_template_rules
                WHERE template_id = t.id AND is_active = true
            ), '[]'::JSONB) AS behavioral_rules,
            -- Knowledge Base entries (manual only) as structured JSONB array
            COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                    'name', name,
                    'content', content,
                    'kb_type', kb_type,
                    'is_active', is_active
                ) ORDER BY created_at ASC)
                FROM agent_template_knowledge_bases
                WHERE template_id = t.id 
                  AND is_active = true 
                  AND kb_type = 'manual'
                  AND content IS NOT NULL
                  AND content != ''
            ), '[]'::JSONB) AS knowledge_entries
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
            -- ONLY the base core prompt (no compilation)
            COALESCE(t.core_prompt, '') AS core_prompt,
            t.personality_config,
            t.icon_url,
            t.factory_version,
            t.factory_published_at,
            t.is_active,
            t.is_ide_specialist,
            -- Prompt Stack
            COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                    'prompt_type', prompt_type,
                    'content', content,
                    'priority', priority,
                    'is_active', is_active
                ) ORDER BY priority ASC)
                FROM agent_template_prompts
                WHERE template_id = t.id AND is_active = true
            ), '[]'::JSONB) AS prompt_stack_items,
            -- Training Examples
            COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                    'user_input', user_input,
                    'expected_output', expected_output,
                    'explanation', explanation,
                    'sort_order', sort_order,
                    'is_active', is_active
                ) ORDER BY sort_order ASC)
                FROM agent_template_examples
                WHERE template_id = t.id AND is_active = true
            ), '[]'::JSONB) AS training_examples,
            -- Behavioral Rules
            COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                    'rule_type', rule_type,
                    'content', content,
                    'severity', severity,
                    'sort_order', sort_order,
                    'is_active', is_active
                ) ORDER BY 
                    CASE severity WHEN 'critical' THEN 0 WHEN 'important' THEN 1 ELSE 2 END ASC,
                    sort_order ASC)
                FROM agent_template_rules
                WHERE template_id = t.id AND is_active = true
            ), '[]'::JSONB) AS behavioral_rules,
            -- Knowledge Base
            COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                    'name', name,
                    'content', content,
                    'kb_type', kb_type,
                    'is_active', is_active
                ) ORDER BY created_at ASC)
                FROM agent_template_knowledge_bases
                WHERE template_id = t.id 
                  AND is_active = true 
                  AND kb_type = 'manual'
                  AND content IS NOT NULL
                  AND content != ''
            ), '[]'::JSONB) AS knowledge_entries
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
        is_ide_specialist,
        prompt_stack_items,
        training_examples,
        behavioral_rules,
        knowledge_entries
    FROM merged
    ORDER BY
        CASE assignment_type WHEN 'push' THEN 0 ELSE 1 END,
        name;
$$;

COMMENT ON FUNCTION get_user_accessible_agents(UUID) IS
'Returns all agent templates accessible to a user. Returns structured data as separate JSONB arrays (prompt_stack_items, training_examples, behavioral_rules, knowledge_entries) instead of compiling them into core_prompt. Desktop clients store and manage each category independently.';
