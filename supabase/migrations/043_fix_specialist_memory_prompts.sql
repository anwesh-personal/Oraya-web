-- ============================================================================
-- 043: Fix Specialist Agent Memory Tool References
-- ============================================================================
-- Corrects the "Oraya Network Protocol" prompt in all 4 specialist agents.
--
-- Problems fixed:
--   1. Prompts reference `store_memory` — tool does not exist.
--      Correct name is `remember_this` (matches Rust executor).
--   2. Prompts use invalid memory categories `architecture` and `bugfix`.
--      Rust MemoryType enum expects: fact, procedural, episodic, preference,
--      context, insight, emotional.
--
-- Before:
--   "Treat the `store_memory` tool as your long-term hippocampus.
--    Automatically store architectural decisions (`category: architecture`),
--    user preferences (`category: preference`), and hard-won debugging
--    truths (`category: bugfix`)."
--
-- After:
--   "Treat the `remember_this` tool as your long-term hippocampus.
--    Automatically store architectural decisions (`category: context`),
--    user preferences (`category: preference`), and hard-won debugging
--    truths (`category: fact`)."
-- ============================================================================

UPDATE agent_template_prompts
SET content = REPLACE(
      REPLACE(
        REPLACE(content,
          '`store_memory`',
          '`remember_this`'
        ),
        '`category: architecture`',
        '`category: context`'
      ),
      '`category: bugfix`',
      '`category: fact`'
    ),
    updated_at = NOW()
WHERE label = 'Oraya Network Protocol'
  AND content LIKE '%store_memory%';
