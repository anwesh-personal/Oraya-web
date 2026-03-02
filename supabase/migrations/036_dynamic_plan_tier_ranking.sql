-- ============================================================================
-- 036: Dynamic Plan Tier Ranking
-- ============================================================================
-- Makes the plan tier system fully dynamic by:
--   1. Dropping hardcoded CHECK constraints on plan_tier columns
--   2. Rewriting plan_tier_rank() to query plans.display_order — making it
--      work for any plan ID, not just the 4 hardcoded ones.
--   3. Rebuilding all downstream RPCs that depend on plan_tier_rank() so they
--      automatically honour any plans created/modified via the Superadmin UI.
--
-- BEFORE:  plan_tier_rank('custom-plan') → 0  (unknown → broken gating)
-- AFTER:   plan_tier_rank('custom-plan') → plans.display_order for that id
--          (or 0 if plan doesn't exist — safe fallback)
--
-- The plans.display_order column is the canonical tier ordering. It is set
-- and maintained by the Superadmin Plans UI. Any admin-created plan with a
-- display_order will be correctly ranked in all downstream RPCs.
-- ============================================================================


-- ============================================================================
-- 1. DROP HARDCODED CHECK CONSTRAINTS ON plan_tier COLUMNS
-- ============================================================================
-- We use dynamic SQL because the constraint names were generated and may vary.
-- This is safe: data validity is enforced at the application layer (API routes)
-- and by the presence of a valid plans.id, not by CHECK constraints.
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- agent_templates.plan_tier constraints
    FOR r IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'agent_templates'::regclass
          AND contype = 'c'
          AND conkey @> (
              SELECT ARRAY[attnum]
              FROM pg_attribute
              WHERE attrelid = 'agent_templates'::regclass
                AND attname = 'plan_tier'
          )
    LOOP
        EXECUTE format('ALTER TABLE agent_templates DROP CONSTRAINT IF EXISTS %I', r.conname);
        RAISE NOTICE 'Dropped constraint % from agent_templates', r.conname;
    END LOOP;

    -- ide_specialist_registry.min_plan_tier constraints
    FOR r IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'ide_specialist_registry'::regclass
          AND contype = 'c'
          AND conkey @> (
              SELECT ARRAY[attnum]
              FROM pg_attribute
              WHERE attrelid = 'ide_specialist_registry'::regclass
                AND attname = 'min_plan_tier'
          )
    LOOP
        EXECUTE format('ALTER TABLE ide_specialist_registry DROP CONSTRAINT IF EXISTS %I', r.conname);
        RAISE NOTICE 'Dropped constraint % from ide_specialist_registry', r.conname;
    END LOOP;
END;
$$;


-- ============================================================================
-- 2. REWRITE plan_tier_rank() TO BE FULLY DYNAMIC
-- ============================================================================
-- Queries plans.display_order for any given plan ID.
-- Returns 0 for unknown plans (safe fallback — treated as lowest tier).
--
-- IMPORTANT: We drop IMMUTABLE because the function now reads from a table.
-- It is STABLE — deterministic within a single statement, safe for query planning.
-- SECURITY DEFINER so it can read the plans table regardless of RLS context.
-- ============================================================================

DROP FUNCTION IF EXISTS plan_tier_rank(TEXT);

CREATE OR REPLACE FUNCTION plan_tier_rank(p_tier TEXT)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT display_order FROM plans WHERE id = p_tier AND is_active = TRUE LIMIT 1),
        0
    );
$$;

COMMENT ON FUNCTION plan_tier_rank(TEXT) IS
'Returns the rank of a subscription plan tier based on plans.display_order.
Dynamic — works for any plan ID including custom admin-created plans.
Returns 0 for unknown or inactive plans (safe lowest-tier fallback).
Use plans.display_order in the Superadmin UI to control tier hierarchy.';


-- ============================================================================
-- 3. REBUILD get_user_accessible_agents() WITH THE NEW DYNAMIC RANK
-- ============================================================================
-- The logic is unchanged — we just inherit the fix automatically because
-- plan_tier_rank() is now dynamic. We recreate it to reset the function
-- signature and ensure it picks up the new STABLE function correctly.
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
    template_description TEXT,
    template_category    TEXT,
    template_plan_tier   TEXT,
    template_version     TEXT,
    template_tags        TEXT[],
    factory_version      INTEGER,
    factory_published_at TIMESTAMPTZ,
    is_active            BOOLEAN
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

COMMENT ON FUNCTION get_user_accessible_agents(UUID) IS
'Returns all agent templates accessible to a user via their plan tier and
explicit assignments. Uses dynamic plan_tier_rank() — works for any plan ID.';


-- ============================================================================
-- 4. REBUILD get_specialist_for_ide() WITH THE NEW DYNAMIC RANK
-- ============================================================================

DROP FUNCTION IF EXISTS get_specialist_for_ide(UUID, TEXT);

CREATE OR REPLACE FUNCTION get_specialist_for_ide(
    p_user_id         UUID,
    p_ide_client_name TEXT
)
RETURNS TABLE (
    registry_id          UUID,
    agent_template_id    UUID,
    template_name        TEXT,
    template_emoji       TEXT,
    priority             INTEGER,
    default_memory_mode  TEXT,
    min_plan_tier        TEXT,
    specialization_notes TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    WITH user_plan AS (
        SELECT
            COALESCE(ul.plan_id, 'standard')                  AS plan_id,
            COALESCE(p.allowed_specialist_ids, '{}'::UUID[])  AS allowed_specialist_ids
        FROM auth.users u
        LEFT JOIN user_licenses ul
            ON ul.user_id = u.id AND ul.status = 'active'
        LEFT JOIN plans p ON p.id = ul.plan_id
        WHERE u.id = p_user_id
        ORDER BY plan_tier_rank(COALESCE(ul.plan_id, 'standard')) DESC NULLS LAST
        LIMIT 1
    )
    SELECT
        r.id                   AS registry_id,
        r.agent_template_id,
        t.name                 AS template_name,
        t.emoji                AS template_emoji,
        r.priority,
        t.default_memory_mode,
        r.min_plan_tier,
        r.specialization_notes
    FROM ide_specialist_registry r
    JOIN agent_templates t ON t.id = r.agent_template_id
    CROSS JOIN user_plan up
    WHERE r.ide_client_name = p_ide_client_name
      AND r.is_recommended   = TRUE
      AND t.is_active        = TRUE
      AND (
          -- Dynamic tier hierarchy check
          plan_tier_rank(r.min_plan_tier) <= plan_tier_rank(up.plan_id)
          -- OR explicitly allowed by plan's allowlist
          OR r.id = ANY(up.allowed_specialist_ids)
      )
    ORDER BY r.priority ASC
    LIMIT 1;
$$;

COMMENT ON FUNCTION get_specialist_for_ide(UUID, TEXT) IS
'Resolves the best-match IDE specialist for a user+IDE combo.
Respects dynamic plan_tier_rank() and the plan allowlist (allowed_specialist_ids).';


-- ============================================================================
-- 5. REBUILD get_user_specialists() WITH THE NEW DYNAMIC RANK
-- ============================================================================

DROP FUNCTION IF EXISTS get_user_specialists(UUID);

CREATE OR REPLACE FUNCTION get_user_specialists(p_user_id UUID)
RETURNS TABLE (
    registry_id          UUID,
    agent_template_id    UUID,
    template_name        TEXT,
    template_emoji       TEXT,
    ide_client_name      TEXT,
    priority             INTEGER,
    is_recommended       BOOLEAN,
    default_memory_mode  TEXT,
    min_plan_tier        TEXT,
    specialization_notes TEXT,
    ide_system_prompt    TEXT,
    core_prompt          TEXT,
    personality_config   JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    WITH user_plan AS (
        SELECT
            COALESCE(ul.plan_id, 'standard')                  AS plan_id,
            COALESCE(p.allowed_specialist_ids, '{}'::UUID[])  AS allowed_specialist_ids
        FROM auth.users u
        LEFT JOIN user_licenses ul
            ON ul.user_id = u.id AND ul.status = 'active'
        LEFT JOIN plans p ON p.id = ul.plan_id
        WHERE u.id = p_user_id
        ORDER BY plan_tier_rank(COALESCE(ul.plan_id, 'standard')) DESC NULLS LAST
        LIMIT 1
    )
    SELECT
        r.id                   AS registry_id,
        r.agent_template_id,
        t.name                 AS template_name,
        t.emoji                AS template_emoji,
        r.ide_client_name,
        r.priority,
        r.is_recommended,
        t.default_memory_mode,
        r.min_plan_tier,
        r.specialization_notes,
        t.ide_system_prompt,
        t.core_prompt,
        t.personality_config
    FROM ide_specialist_registry r
    JOIN agent_templates t ON t.id = r.agent_template_id
    CROSS JOIN user_plan up
    WHERE t.is_active         = TRUE
      AND t.is_ide_specialist  = TRUE
      AND (
          plan_tier_rank(r.min_plan_tier) <= plan_tier_rank(up.plan_id)
          OR r.id = ANY(up.allowed_specialist_ids)
      )
    ORDER BY r.ide_client_name, r.priority ASC;
$$;

COMMENT ON FUNCTION get_user_specialists(UUID) IS
'Returns all IDE specialists available to a user across all IDE clients.
Uses dynamic plan_tier_rank() — works for any plan ID.';


-- ============================================================================
-- 6. ADD DATABASE-LEVEL NOTE ON plans.display_order
-- ============================================================================
-- Ensure display_order has a NOT NULL default so new plans are always rankable.
-- ============================================================================

ALTER TABLE plans ALTER COLUMN display_order SET DEFAULT 0;

COMMENT ON COLUMN plans.display_order IS
'Controls tier hierarchy used by plan_tier_rank(). Lower numbers = lower tier.
Set this in the Superadmin Plans UI. Standard=1, Pro=2, Team=3, Enterprise=4.
Custom plans can use any integer. Gaps are fine (e.g. 5, 10, 15).';


-- ============================================================================
-- 7. SAFE GUARD: Ensure all existing plan data rows have a display_order
-- ============================================================================

UPDATE plans SET display_order = 0
WHERE display_order IS NULL;
