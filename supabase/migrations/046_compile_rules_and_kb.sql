-- ============================================================================
-- 046: Compile Rules & Knowledge Base into Agent Prompt Stack
-- ============================================================================
-- Extends the `get_user_accessible_agents` RPC (originally rewritten in 045)
-- to also aggregate:
--   • agent_template_rules      → behavioral guardrails (must_do, must_not, etc.)
--   • agent_template_knowledge_bases (manual type) → inline knowledge articles
--
-- These are stitched into `template_core_prompt` alongside the existing
-- prompt stack and training examples, following the exact same pattern.
--
-- This ensures Desktop clients receive the COMPLETE agent configuration
-- in a single RPC call without any additional endpoints or sync logic.
--
-- NOTE: Document/URL-type KB entries are NOT stitched (they're too large
-- for prompt injection and require proper RAG indexing). Only 'manual'
-- type KB entries are included since they are authored knowledge facts.
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
                -- 1. Base core prompt
                COALESCE(t.core_prompt, '') || 
                -- 2. Prompt Stack (identity, expertise, constraints, etc.)
                COALESCE((
                    SELECT E'\n\n' || string_agg(
                        E'=== ' || upper(prompt_type) || E' ===\n' || content,
                        E'\n\n' ORDER BY priority ASC
                    )
                    FROM agent_template_prompts
                    WHERE template_id = t.id AND is_active = true
                ), '') ||
                -- 3. Training Examples (few-shot)
                COALESCE((
                    SELECT E'\n\n=== EXAMPLES ===\n' || string_agg(
                        E'Example: ' || COALESCE(explanation, 'Interaction') || E'\nUser: ' || user_input || E'\nAgent: ' || expected_output,
                        E'\n\n' ORDER BY sort_order ASC
                    )
                    FROM agent_template_examples
                    WHERE template_id = t.id AND is_active = true
                ), '') ||
                -- 4. Behavioral Rules (guardrails)
                COALESCE((
                    SELECT E'\n\n=== RULES ===\n' || string_agg(
                        E'[' || upper(rule_type) || CASE WHEN severity = 'critical' THEN ' — CRITICAL' ELSE '' END || E'] ' || content,
                        E'\n' ORDER BY 
                            CASE severity WHEN 'critical' THEN 0 WHEN 'important' THEN 1 ELSE 2 END ASC,
                            sort_order ASC
                    )
                    FROM agent_template_rules
                    WHERE template_id = t.id AND is_active = true
                ), '') ||
                -- 5. Knowledge Base (manual entries only — documents/URLs need RAG)
                COALESCE((
                    SELECT E'\n\n=== KNOWLEDGE BASE ===\n' || string_agg(
                        E'--- ' || name || E' ---\n' || content,
                        E'\n\n' ORDER BY created_at ASC
                    )
                    FROM agent_template_knowledge_bases
                    WHERE template_id = t.id 
                      AND is_active = true 
                      AND kb_type = 'manual'
                      AND content IS NOT NULL
                      AND content != ''
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
                -- 1. Base core prompt
                COALESCE(t.core_prompt, '') || 
                -- 2. Prompt Stack
                COALESCE((
                    SELECT E'\n\n' || string_agg(
                        E'=== ' || upper(prompt_type) || E' ===\n' || content,
                        E'\n\n' ORDER BY priority ASC
                    )
                    FROM agent_template_prompts
                    WHERE template_id = t.id AND is_active = true
                ), '') ||
                -- 3. Training Examples
                COALESCE((
                    SELECT E'\n\n=== EXAMPLES ===\n' || string_agg(
                        E'Example: ' || COALESCE(explanation, 'Interaction') || E'\nUser: ' || user_input || E'\nAgent: ' || expected_output,
                        E'\n\n' ORDER BY sort_order ASC
                    )
                    FROM agent_template_examples
                    WHERE template_id = t.id AND is_active = true
                ), '') ||
                -- 4. Behavioral Rules
                COALESCE((
                    SELECT E'\n\n=== RULES ===\n' || string_agg(
                        E'[' || upper(rule_type) || CASE WHEN severity = 'critical' THEN ' — CRITICAL' ELSE '' END || E'] ' || content,
                        E'\n' ORDER BY 
                            CASE severity WHEN 'critical' THEN 0 WHEN 'important' THEN 1 ELSE 2 END ASC,
                            sort_order ASC
                    )
                    FROM agent_template_rules
                    WHERE template_id = t.id AND is_active = true
                ), '') ||
                -- 5. Knowledge Base (manual entries only)
                COALESCE((
                    SELECT E'\n\n=== KNOWLEDGE BASE ===\n' || string_agg(
                        E'--- ' || name || E' ---\n' || content,
                        E'\n\n' ORDER BY created_at ASC
                    )
                    FROM agent_template_knowledge_bases
                    WHERE template_id = t.id 
                      AND is_active = true 
                      AND kb_type = 'manual'
                      AND content IS NOT NULL
                      AND content != ''
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
'Returns all agent templates accessible to a user. Dynamically compiles agent_template_prompts, agent_template_examples, agent_template_rules, and agent_template_knowledge_bases (manual type) into template_core_prompt so desktop clients receive the complete agent configuration in a single transfer.';
