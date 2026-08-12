-- 058: entity_type leaves the knowledge-graph identity (Plan 045, Option A)
--
-- THE DEFECT. 057 made an entity's reconciliation key `(agent_id, canonical_name,
-- entity_type)`. The type is not a property of the thing; it is a label a language model
-- picks once per turn, without being shown what it picked last time. So the same real
-- entity arrives as `project` on Monday and `tool` on Tuesday, misses the upsert, and
-- becomes a SECOND row. Every edge naming it then attaches to whichever of the two rows
-- the endpoint lookup happened to match, so the graph silently splits in half.
--
-- On the desktop's live graph of 2026-08-12 that had already happened to three entities
-- out of forty-seven, and the same key is what this receiver reconciles on.
--
-- AFTER THIS MIGRATION
--   * entity identity  = (agent_id, canonical_name)                       [live rows]
--   * edge identity    = (agent_id, source_canonical, relationship_type,
--                         target_canonical)                               [live rows]
--   * `entity_type` and both endpoint types remain as DESCRIPTIVE attributes, carried on
--     the wire exactly as before and settled by the same last-write-wins rule as every
--     other attribute.
--
-- THE WIRE FORMAT DOES NOT CHANGE — BUT THE DEPLOYMENT IS STILL COUPLED. `canonical_name`
-- and `entity_type` have always travelled as separate JSON fields and this receiver has
-- always read them separately, so no payload changes shape and no column is dropped.
-- The identity is nevertheless a coupled deployment, for a reason outside this file:
-- `validateBrainMutation` (lib/brain-sync/contract.ts) RE-DERIVES `content_hash` from the
-- identity and rejects a mismatch before the mutation ever reaches this RPC. A desktop
-- still hashing `canonical_name || entity_type` therefore gets a 400 from a receiver that
-- hashes `canonical_name` alone, and the reverse likewise.
--
-- The failure mode is safe rather than lossy: a rejected mutation is never acknowledged,
-- so it stays in the desktop outbox and replays once the lagging surface is upgraded.
-- Nothing is lost, nothing double-writes, and KG sync simply makes no progress in
-- between. DEPLOY THE TWO TOGETHER. Pinned by `__tests__/kg-identity.test.ts`
-- ("what happens if only one surface is upgraded") so this cannot decay into an
-- assumption. This corrects Plan 045 §3.2, which read the RPC's storing of the
-- transmitted hash (057:325) as independence and did not account for the HTTP route
-- validating the envelope first.
--
-- NORMALISATION IS NOT PERFORMED HERE, DELIBERATELY. `canonical_name` arrives already
-- normalised by the sender (`cognition::identity::canonicalize` on the desktop: trim,
-- then Unicode lowercase). Postgres `lower()` is locale-dependent and agrees with that
-- rule on ASCII while diverging on the rest, so re-deriving the identity here would
-- introduce a SECOND normalisation scheme — and the row this receiver stored would stop
-- being findable by the surface that sent it. One scheme, owned by the sender.
--
-- ORDER MATTERS AND IS NOT NEGOTIABLE: the duplicates are merged FIRST, then the unique
-- indexes are swapped. Creating the narrower index against rows that still contain a
-- duplicate identity fails, and it fails in the middle of a deployment.
--
-- The whole file is one transaction (Supabase runs each migration in one), so a failure
-- anywhere leaves the schema and the data exactly as they were.

-- ── 1. Provenance, matching the desktop's 067 ─────────────────────────────────────
-- Whether a row rests on observations made as they happened ('live'), reconstructed from
-- stored history by a replay ('backfill'), or both ('mixed'). Nothing writes 'backfill'
-- yet; the column exists now because the wire field that fills it exists now, and because
-- a reconstructed fact is legitimate evidence of a DIFFERENT KIND from one recorded when
-- it happened. Introducing the distinction after the first backfill would leave a corpus
-- in which the two are permanently indistinguishable.
ALTER TABLE agent_context_entities
    ADD COLUMN IF NOT EXISTS observation_provenance TEXT NOT NULL DEFAULT 'live'
    CHECK (observation_provenance IN ('live','backfill','mixed'));
ALTER TABLE agent_entity_relationships
    ADD COLUMN IF NOT EXISTS observation_provenance TEXT NOT NULL DEFAULT 'live'
    CHECK (observation_provenance IN ('live','backfill','mixed'));

-- ── 1b. WHEN a row was observed, so the never-move-backwards rule can exist here ──
-- These columns did not exist, and their absence was not a gap in bookkeeping — it meant
-- the rule the desktop enforces had NO COUNTERPART on this surface at all. The desktop
-- keys retrieval decay off `last_mentioned` / `last_confirmed` and merges them by
-- `MAX`/`MIN`, so a replay of February history cannot make an old fact look fresh. This
-- receiver had nowhere to put those numbers, so a mutation carrying them was simply
-- dropped, and any surface reading back from here would see a graph with no notion of
-- when anything was observed. One surface enforcing an invariant is not an invariant.
--
-- BIGINT UNIX SECONDS, matching the desktop's storage exactly rather than converting to
-- TIMESTAMPTZ. The wire carries integers; a second representation here would mean the two
-- surfaces compare different things, and `GREATEST`/`LEAST` over integers is trivially the
-- same rule as SQLite's `MAX`/`MIN` over the same integers. The audit columns
-- (`created_at`, `updated_at`) stay TIMESTAMPTZ — they record when THIS DATABASE acted,
-- which is a different question from when the fact was observed.
--
-- NULLABLE, because a row that arrived before these columns existed genuinely has no
-- observed time and inventing one would be a fabrication. Postgres `GREATEST`/`LEAST`
-- ignore NULL operands (unlike almost every other function), so an unknown bound is
-- absorbed by the first known one with no `COALESCE` and no special case.
ALTER TABLE agent_context_entities
    ADD COLUMN IF NOT EXISTS first_observed_at BIGINT;
ALTER TABLE agent_context_entities
    ADD COLUMN IF NOT EXISTS last_observed_at BIGINT;
ALTER TABLE agent_entity_relationships
    ADD COLUMN IF NOT EXISTS first_observed_at BIGINT;
ALTER TABLE agent_entity_relationships
    ADD COLUMN IF NOT EXISTS last_observed_at BIGINT;

-- ── 2. Preflight, and the gate on merging customer rows ───────────────────────────
-- The desktop expects this receiver to hold nothing yet, because both sync commits are
-- labelled "test-proven, not live". That expectation is CHECKED rather than assumed, and
-- the check is enforced rather than merely logged.
--
-- The distinction that matters is not how many rows exist — it is whether this migration
-- would only swap an index or would also REWRITE ROWS. Against a graph with no duplicate
-- identities, everything below is a no-op and the migration is a pure index swap, which is
-- safe to deploy unattended. Against a graph that does contain duplicates, section 3 makes
-- an irreversible merge decision — electing one row's `entity_type`, unioning aliases,
-- re-pointing another row's edges — on live multi-tenant data. That is a data-quality
-- judgement about somebody's graph, and it is not one a deployment should make silently.
--
-- So: duplicates present and no acknowledgement ⇒ ABORT, with the counts in the message.
-- Whoever holds production reviews what would be merged, then re-runs with
--     SET LOCAL kg058.merge_customer_rows = 'acknowledged';
-- This is a refusal, not a fallback: nothing is skipped, degraded or partially applied.
-- The whole migration is one transaction, so an abort here leaves the database untouched.
DO $$
DECLARE
    v_entities BIGINT;
    v_edges BIGINT;
    v_entity_dupes BIGINT;
    v_edge_dupes BIGINT;
BEGIN
    SELECT count(*) INTO v_entities FROM agent_context_entities WHERE NOT tombstone;
    SELECT count(*) INTO v_edges FROM agent_entity_relationships WHERE NOT tombstone;
    SELECT COALESCE(sum(n - 1), 0) INTO v_entity_dupes FROM (
        SELECT count(*) AS n FROM agent_context_entities WHERE NOT tombstone
         GROUP BY agent_id, canonical_name HAVING count(*) > 1) d;
    SELECT COALESCE(sum(n - 1), 0) INTO v_edge_dupes FROM (
        SELECT count(*) AS n FROM agent_entity_relationships WHERE NOT tombstone
         GROUP BY agent_id, source_canonical, relationship_type, target_canonical
        HAVING count(*) > 1) d;
    RAISE NOTICE '058 preflight: % live entities (% to merge away), % live edges (% to merge away)',
        v_entities, v_entity_dupes, v_edges, v_edge_dupes;

    IF (v_entity_dupes > 0 OR v_edge_dupes > 0)
       AND COALESCE(current_setting('kg058.merge_customer_rows', true), '') <> 'acknowledged'
    THEN
        RAISE EXCEPTION 'KG058_MERGE_NOT_ACKNOWLEDGED'
            USING DETAIL = format(
                '%s entity rows and %s edge rows would be merged away across %s live entities. '
                || 'Review them, then re-run with '
                || 'SET LOCAL kg058.merge_customer_rows = ''acknowledged'';',
                v_entity_dupes, v_edge_dupes, v_entities),
              HINT = 'Plan 045 §5: do not merge multi-tenant production rows unreviewed.';
    END IF;
END $$;

-- ── 3. Merge duplicate entities, BEFORE the index swap ────────────────────────────
-- Survivor election, in the same total order the desktop's runner uses so both surfaces
-- reach the same answer from the same rows: most mentions, then highest confidence, then
-- the most recently reconciled row, then `id` — which makes the order total, so the result
-- cannot depend on the order Postgres happened to return the rows in.
--
-- The merge is attribute-preserving: counts and confidence take the maximum, aliases and
-- every observed surface form union, and provenance degrades to 'mixed' only when the
-- rows genuinely disagree. Nothing is invented and nothing is silently dropped.
-- Dropped explicitly at the end rather than ON COMMIT: this file must produce the same
-- result whether the runner wraps it in a transaction (Supabase does) or a person applies
-- it through psql, where each statement commits on its own and an ON COMMIT table would
-- vanish before the next statement could read it.
CREATE TEMP TABLE _kg058_entity_merge AS
WITH ranked AS (
    SELECT e.*,
           row_number() OVER (
               PARTITION BY e.agent_id, e.canonical_name
               ORDER BY e.mention_count DESC, e.confidence_score DESC,
                        e.revision DESC, e.mutation_timestamp DESC, e.id
           ) AS rank
      FROM agent_context_entities e
     WHERE NOT e.tombstone
)
SELECT r.id AS loser_id,
       s.id AS survivor_id
  FROM ranked r
  JOIN ranked s
    ON s.agent_id = r.agent_id AND s.canonical_name = r.canonical_name AND s.rank = 1
 WHERE r.rank > 1;

-- Attributes first, while the losers still exist to be read.
UPDATE agent_context_entities s SET
    confidence_score = GREATEST(s.confidence_score, m.confidence_score),
    mention_count    = GREATEST(s.mention_count, m.mention_count),
    -- The observation window widens to cover every merged row, by the same MIN/MAX the
    -- write path uses. `LEAST`/`GREATEST` ignore NULLs, so a merged row that predates
    -- these columns contributes nothing rather than erasing what the survivor knew.
    first_observed_at = LEAST(s.first_observed_at, m.first_observed_at),
    last_observed_at  = GREATEST(s.last_observed_at, m.last_observed_at),
    description      = COALESCE(s.description, m.description),
    aliases          = m.aliases,
    observation_provenance = CASE
        WHEN m.provenances = ARRAY[s.observation_provenance] THEN s.observation_provenance
        ELSE 'mixed' END,
    updated_at = now()
  FROM (
    SELECT k.survivor_id,
           max(l.confidence_score) AS confidence_score,
           max(l.mention_count) AS mention_count,
           min(l.first_observed_at) AS first_observed_at,
           max(l.last_observed_at) AS last_observed_at,
           (array_remove(array_agg(l.description ORDER BY l.revision DESC), NULL))[1] AS description,
           -- Every distinct surface form any merged row was written under, unioned onto
           -- the survivor's own aliases. This is what makes the merge reversible from
           -- stored data, and it is the raw material the later alias-equivalence work
           -- needs to have been accumulating rather than discarding.
           (SELECT COALESCE(jsonb_agg(DISTINCT a.value), '[]'::jsonb)
              FROM (
                SELECT jsonb_array_elements(sv.aliases) AS value
                UNION
                SELECT jsonb_array_elements(l2.aliases)
                  FROM _kg058_entity_merge k2
                  JOIN agent_context_entities l2 ON l2.id = k2.loser_id
                 WHERE k2.survivor_id = k.survivor_id
                UNION
                SELECT to_jsonb(l3.name)
                  FROM _kg058_entity_merge k3
                  JOIN agent_context_entities l3 ON l3.id = k3.loser_id
                 WHERE k3.survivor_id = k.survivor_id
                   AND l3.name IS NOT NULL
                   AND btrim(l3.name) <> ''
                   AND btrim(l3.name) <> btrim(COALESCE(sv.name, ''))
              ) a
           ) AS aliases,
           array_agg(DISTINCT l.observation_provenance) AS provenances
      FROM _kg058_entity_merge k
      JOIN agent_context_entities l ON l.id = k.loser_id
      JOIN agent_context_entities sv ON sv.id = k.survivor_id
     GROUP BY k.survivor_id, sv.aliases, sv.name
  ) m
 WHERE s.id = m.survivor_id;

-- Then re-point every edge, live or tombstoned, BEFORE any loser is deleted. The endpoint
-- FKs have no ON DELETE action, so an edge missed here would not dangle — the DELETE
-- below would abort the whole deployment instead.
UPDATE agent_entity_relationships r SET source_entity_id = m.survivor_id, updated_at = now()
  FROM _kg058_entity_merge m WHERE r.source_entity_id = m.loser_id;
UPDATE agent_entity_relationships r SET target_entity_id = m.survivor_id, updated_at = now()
  FROM _kg058_entity_merge m WHERE r.target_entity_id = m.loser_id;

DELETE FROM agent_context_entities e USING _kg058_entity_merge m WHERE e.id = m.loser_id;

DROP TABLE _kg058_entity_merge;

-- ── 4. Edges the merge made identical, and the self-loops it created ──────────────
-- A self-loop here is an artifact of merging two rows that were always one entity, not a
-- fact anyone asserted, and the desktop's writer refuses to create one. Removing it keeps
-- the two graphs able to converge.
DELETE FROM agent_entity_relationships
 WHERE source_entity_id IS NOT NULL
   AND source_entity_id = target_entity_id;

-- Duplicates collapse onto the strongest row, and the confirmations they carried are
-- SUMMED rather than discarded: each one was a separate assertion of the same fact, and
-- `confirmation_count` is read as evidence weight at retrieval time.
-- The winner/loser set is computed ONCE and stored, then used by both the roll-up and the
-- delete. Re-running the window function after the roll-up has already changed the
-- columns it ranks on would be asking the same question of different data.
CREATE TEMP TABLE _kg058_edge_merge AS
WITH ranked AS (
    SELECT r.id, r.agent_id, r.source_canonical, r.relationship_type, r.target_canonical,
           r.confidence_score, r.confirmation_count, r.observation_provenance,
           r.first_observed_at, r.last_observed_at,
           row_number() OVER (
               PARTITION BY r.agent_id, r.source_canonical, r.relationship_type, r.target_canonical
               ORDER BY r.confidence_score DESC, r.confirmation_count DESC,
                        r.revision DESC, r.mutation_timestamp DESC, r.id
           ) AS rank
      FROM agent_entity_relationships r
     WHERE NOT r.tombstone
)
SELECT l.id AS loser_id, s.id AS survivor_id, l.confirmation_count, l.confidence_score,
       l.observation_provenance, l.first_observed_at, l.last_observed_at
  FROM ranked l
  JOIN ranked s
    ON s.agent_id = l.agent_id AND s.source_canonical = l.source_canonical
   AND s.relationship_type = l.relationship_type AND s.target_canonical = l.target_canonical
   AND s.rank = 1
 WHERE l.rank > 1;

UPDATE agent_entity_relationships s SET
    confirmation_count = s.confirmation_count + rolled.extra_confirmations,
    confidence_score = GREATEST(s.confidence_score, rolled.confidence_score),
    first_observed_at = LEAST(s.first_observed_at, rolled.first_observed_at),
    last_observed_at  = GREATEST(s.last_observed_at, rolled.last_observed_at),
    observation_provenance = CASE
        WHEN rolled.provenances = ARRAY[s.observation_provenance] THEN s.observation_provenance
        ELSE 'mixed' END,
    updated_at = now()
  FROM (
    SELECT survivor_id,
           sum(confirmation_count) AS extra_confirmations,
           max(confidence_score) AS confidence_score,
           min(first_observed_at) AS first_observed_at,
           max(last_observed_at) AS last_observed_at,
           array_agg(DISTINCT observation_provenance) AS provenances
      FROM _kg058_edge_merge GROUP BY survivor_id
  ) rolled
 WHERE s.id = rolled.survivor_id;

DELETE FROM agent_entity_relationships l
 USING _kg058_edge_merge m WHERE l.id = m.loser_id;

DROP TABLE _kg058_edge_merge;

-- ── 4b. Drain the edges the OLD identity had stranded ─────────────────────────────
-- An edge waits with NULL FKs until both endpoints exist. Under the old rule the
-- resolver also required the endpoint TYPES to match, and the type an edge recorded for
-- its endpoint is whatever the extractor said on the EDGE's turn — not necessarily what
-- the entity was finally stored under. Any edge caught by that disagreement could never
-- resolve, no matter how many times its endpoints arrived: it sat in the table, invisible
-- to every read, forever.
--
-- Those edges are resolvable now, and this is the pass that actually resolves them.
-- Without it they would stay stranded until some unrelated future mutation for the same
-- agent happened to run the resolver — which, for an agent that has stopped syncing, is
-- never.
UPDATE agent_entity_relationships r SET
      resolved = true, source_entity_id = se.id, target_entity_id = te.id, updated_at = now()
  FROM agent_context_entities se, agent_context_entities te
 WHERE NOT r.resolved AND NOT r.tombstone
   AND se.agent_id = r.agent_id AND NOT se.tombstone AND se.canonical_name = r.source_canonical
   AND te.agent_id = r.agent_id AND NOT te.tombstone AND te.canonical_name = r.target_canonical;

-- Resolving can itself produce a self-loop, when both endpoint names turn out to be the
-- same entity. Same reasoning as above: nobody asserted it.
DELETE FROM agent_entity_relationships
 WHERE source_entity_id IS NOT NULL
   AND source_entity_id = target_entity_id;

-- ── 5. Swap the identities. Only now, with nothing left that would violate them. ──
DROP INDEX IF EXISTS idx_agent_context_entities_identity;
CREATE UNIQUE INDEX idx_agent_context_entities_identity
    ON agent_context_entities(agent_id, canonical_name)
    WHERE NOT tombstone;

DROP INDEX IF EXISTS idx_agent_entity_relationships_identity;
CREATE UNIQUE INDEX idx_agent_entity_relationships_identity
    ON agent_entity_relationships(agent_id, source_canonical, relationship_type, target_canonical)
    WHERE NOT tombstone;

COMMENT ON INDEX idx_agent_context_entities_identity IS
    'One LIVE entity per (agent, canonical_name). The entity TYPE is deliberately not part of this: it is re-chosen every turn by a model with no memory of its last answer, so including it fragmented the graph (Plan 045).';
COMMENT ON INDEX idx_agent_entity_relationships_identity IS
    'One LIVE edge per (agent, source_canonical, relationship_type, target_canonical). Endpoint types are descriptive, not identifying.';
COMMENT ON COLUMN agent_context_entities.observation_provenance IS
    'live | backfill | mixed — whether this row rests on observations made as they happened, reconstructed from stored history by a replay, or both.';
COMMENT ON COLUMN agent_entity_relationships.observation_provenance IS
    'live | backfill | mixed — see agent_context_entities.observation_provenance.';
COMMENT ON COLUMN agent_context_entities.first_observed_at IS
    'Unix seconds of the earliest sighting behind this row. Merges by LEAST, unconditionally — a mutation that lost the last-writer-wins comparison is still evidence. NULL means the row predates the column, not that it was never observed.';
COMMENT ON COLUMN agent_context_entities.last_observed_at IS
    'Unix seconds of the latest sighting behind this row. Merges by GREATEST, unconditionally: this is the never-move-backwards rule, so a replay of old history cannot make an older fact look newer. Matches the desktop''s context_entities.last_mentioned.';
COMMENT ON COLUMN agent_entity_relationships.first_observed_at IS
    'Unix seconds of the earliest sighting behind this edge. Merges by LEAST. Matches the desktop''s entity_relationships.first_identified.';
COMMENT ON COLUMN agent_entity_relationships.last_observed_at IS
    'Unix seconds of the latest sighting behind this edge — the value a retrieval decay term reads. Merges by GREATEST. Matches the desktop''s entity_relationships.last_confirmed.';

-- ── 6. The receiver, re-emitted against the new identity ──────────────────────────
-- Three places in the KG half of this function computed identity from the type and are
-- rewritten here: the ENTITY branch (tombstone match + upsert conflict target), the
-- ENDPOINT RESOLVER that fills a buffered edge's FKs, and the EDGE branch (endpoint
-- lookup + tombstone match + upsert conflict target). Every other branch is reproduced
-- byte-for-byte from 057; `CREATE OR REPLACE FUNCTION` replaces the whole body, so the
-- untouched faculties have to be carried through verbatim.
CREATE OR REPLACE FUNCTION apply_agent_brain_mutation(
    p_user_id UUID,
    p_mutation_id TEXT,
    p_agent_id TEXT,
    p_faculty TEXT,
    p_operation TEXT,
    p_content_hash TEXT,
    p_governance_hash TEXT,
    p_payload JSONB,
    p_revision BIGINT,
    p_mutation_timestamp TIMESTAMPTZ,
    p_origin TEXT
) RETURNS TABLE(event_id BIGINT, idempotent BOOLEAN, applied BOOLEAN) LANGUAGE plpgsql AS $$
DECLARE
    v_existing BIGINT;
    v_brain agent_brains%ROWTYPE;
    v_wins BOOLEAN := false;
    v_source_id UUID;
    v_source_title TEXT;
    v_embedding_model TEXT;
    v_src UUID;
    v_tgt UUID;
    -- Absent on the wire means the sender predates the field, and everything written
    -- before the field existed was observed live. That is what its absence records.
    v_provenance TEXT;
    v_observed_first BIGINT;
    v_observed_last BIGINT;
BEGIN
    SELECT e.event_id INTO v_existing FROM agent_brain_events e
      WHERE e.mutation_id = p_mutation_id;
    IF v_existing IS NOT NULL THEN
        RETURN QUERY SELECT v_existing, true, true;
        RETURN;
    END IF;

    SELECT * INTO v_brain FROM agent_brains
      WHERE agent_id = p_agent_id AND user_id = p_user_id AND synced_brain
      FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'SYNC_NOT_OPTED_IN' USING ERRCODE = 'P0001';
    END IF;

    v_provenance := COALESCE(p_payload->>'observation_provenance', 'live');
    IF v_provenance NOT IN ('live','backfill','mixed') THEN
        RAISE EXCEPTION 'INVALID_OBSERVATION_PROVENANCE' USING ERRCODE = 'P0001';
    END IF;

    -- WHEN the sender observed this, resolved ONCE for both KG faculties.
    --
    -- The fallback is the MUTATION's timestamp, not `now()`, and that choice is the whole
    -- point: `now()` would make the stored window depend on when this RPC happened to run,
    -- so replaying the same event — a cursor reset, a restore, a second region — would
    -- store a different number and the two surfaces would diverge on a value neither could
    -- reconcile. The mutation timestamp is carried by the envelope, is nearer the
    -- observation, and is identical on every replay. The desktop applies exactly this
    -- fallback (`sync/brain.rs :: observation_window`), so a payload missing the field
    -- reaches the same value on both surfaces.
    v_observed_last := COALESCE((p_payload->>'last_observed_at')::BIGINT,
                                extract(epoch FROM p_mutation_timestamp)::BIGINT);
    -- A sender that gave only the latest sighting described one moment, so that moment is
    -- both ends of its window.
    v_observed_first := COALESCE((p_payload->>'first_observed_at')::BIGINT, v_observed_last);
    IF v_observed_first > v_observed_last THEN
        RAISE EXCEPTION 'INVERTED_OBSERVATION_WINDOW' USING ERRCODE = 'P0001',
            DETAIL = format('first_observed_at %s is after last_observed_at %s',
                            v_observed_first, v_observed_last);
    END IF;

    IF p_faculty = 'core_prompt' THEN
        v_wins := v_brain.core_prompt_updated_at IS NULL
          OR (p_revision, p_mutation_timestamp, p_origin)
             > (v_brain.core_prompt_version, v_brain.core_prompt_updated_at, v_brain.core_prompt_origin);
        IF v_wins THEN
            UPDATE agent_brains SET
              core_prompt = CASE WHEN p_operation = 'tombstone' THEN NULL ELSE p_payload->>'core_prompt' END,
              core_prompt_hash = p_content_hash,
              core_prompt_version = p_revision,
              core_prompt_updated_at = p_mutation_timestamp,
              core_prompt_origin = p_origin,
              current_revision = GREATEST(current_revision, p_revision),
              sync_state = 'synced',
              last_synced_at = now()
            WHERE agent_id = p_agent_id;
        END IF;
    ELSIF p_faculty = 'memory' THEN
        v_wins := true;
        IF p_operation = 'tombstone' THEN
            UPDATE agent_memories SET tombstone = true, tombstoned_at = now(), updated_at = now()
              WHERE agent_id = p_agent_id AND content_hash = p_content_hash AND NOT tombstone;
        ELSIF NOT EXISTS (
            SELECT 1 FROM agent_memories WHERE agent_id = p_agent_id AND content_hash = p_content_hash
        ) THEN
            INSERT INTO agent_memories (
              agent_id,user_id,scope,memory_type,content,summary,keywords,importance,decay_rate,
              source_conversation_id,content_hash,governance_hash,embedding,embedding_model,origin,
              mutation_timestamp,revision,tombstone,immutable_metadata
            ) VALUES (
              p_agent_id,p_user_id,COALESCE(p_payload->>'scope','private'),
              COALESCE(p_payload->>'memory_type','fact'),p_payload->>'content',p_payload->>'summary',
              COALESCE(p_payload->'keywords','[]'::jsonb),COALESCE((p_payload->>'importance')::REAL,0.5),
              COALESCE((p_payload->>'decay_rate')::REAL,0),p_payload->>'source_conversation_id',
              p_content_hash,p_governance_hash,NULL,'Qwen3-Embedding-0.6B',p_origin,
              p_mutation_timestamp::TEXT,p_revision,false,COALESCE(p_payload->'metadata','{}'::jsonb)
            );
        END IF;
    ELSIF p_faculty = 'prompt_stack' THEN
        v_wins := true;
        IF p_operation = 'tombstone' THEN
            UPDATE agent_prompt_stack SET tombstone=true, updated_at=now()
              WHERE agent_id=p_agent_id AND id=p_payload->>'id';
        ELSE
            INSERT INTO agent_prompt_stack (
              id,agent_id,user_id,prompt_type,label,description,keywords,tags,position,content,is_active,source,
              content_hash,governance_hash,origin,mutation_timestamp,revision,tombstone,immutable_metadata
            ) VALUES (
              p_payload->>'id',p_agent_id,p_user_id,p_payload->>'prompt_type',p_payload->>'label',
              p_payload->>'description',p_payload->>'keywords',p_payload->>'tags',
              COALESCE((p_payload->>'priority')::INT,0),p_payload->>'content',
              COALESCE((p_payload->>'is_active')::BOOLEAN,true),COALESCE(p_payload->>'source','desktop'),
              p_content_hash,p_governance_hash,p_origin,p_mutation_timestamp::TEXT,p_revision,false,
              COALESCE(p_payload->'audit','{}'::jsonb)
            ) ON CONFLICT (id) DO UPDATE SET
              prompt_type=EXCLUDED.prompt_type,label=EXCLUDED.label,description=EXCLUDED.description,
              keywords=EXCLUDED.keywords,tags=EXCLUDED.tags,position=EXCLUDED.position,content=EXCLUDED.content,
              is_active=EXCLUDED.is_active,source=EXCLUDED.source,content_hash=EXCLUDED.content_hash,
              governance_hash=EXCLUDED.governance_hash,origin=EXCLUDED.origin,
              mutation_timestamp=EXCLUDED.mutation_timestamp,revision=EXCLUDED.revision,tombstone=false,
              immutable_metadata=EXCLUDED.immutable_metadata,updated_at=now()
              WHERE (EXCLUDED.revision, EXCLUDED.mutation_timestamp, EXCLUDED.origin)
                    > (agent_prompt_stack.revision, agent_prompt_stack.mutation_timestamp, agent_prompt_stack.origin);
        END IF;
    ELSIF p_faculty = 'behavioral_rule' THEN
        v_wins := true;
        IF p_operation = 'tombstone' THEN
            UPDATE agent_behavioral_rules SET tombstone=true, updated_at=now()
              WHERE agent_id=p_agent_id AND id=p_payload->>'id';
        ELSE
            INSERT INTO agent_behavioral_rules (
              id,agent_id,user_id,rule_type,content,category,severity,sort_order,is_active,source,
              content_hash,governance_hash,origin,mutation_timestamp,revision,tombstone,immutable_metadata
            ) VALUES (
              p_payload->>'id',p_agent_id,p_user_id,p_payload->>'rule_type',p_payload->>'content',
              p_payload->>'category',COALESCE(p_payload->>'severity','important'),
              COALESCE((p_payload->>'sort_order')::INT,0),COALESCE((p_payload->>'is_active')::BOOLEAN,true),
              COALESCE(p_payload->>'source','desktop'),p_content_hash,p_governance_hash,p_origin,
              p_mutation_timestamp::TEXT,p_revision,false,COALESCE(p_payload->'audit','{}'::jsonb)
            ) ON CONFLICT (id) DO UPDATE SET
              rule_type=EXCLUDED.rule_type,content=EXCLUDED.content,category=EXCLUDED.category,severity=EXCLUDED.severity,
              sort_order=EXCLUDED.sort_order,is_active=EXCLUDED.is_active,source=EXCLUDED.source,
              content_hash=EXCLUDED.content_hash,governance_hash=EXCLUDED.governance_hash,origin=EXCLUDED.origin,
              mutation_timestamp=EXCLUDED.mutation_timestamp,revision=EXCLUDED.revision,tombstone=false,
              immutable_metadata=EXCLUDED.immutable_metadata,updated_at=now()
              WHERE (EXCLUDED.revision, EXCLUDED.mutation_timestamp, EXCLUDED.origin)
                    > (agent_behavioral_rules.revision, agent_behavioral_rules.mutation_timestamp, agent_behavioral_rules.origin);
        END IF;
    ELSIF p_faculty = 'training' THEN
        v_wins := true;
        IF p_payload->>'record_kind' = 'conversation' THEN
            IF p_operation = 'tombstone' THEN
                UPDATE agent_training_conversations SET tombstone=true, updated_at=now()
                  WHERE agent_id=p_agent_id AND id=p_payload->>'id';
            ELSE
                INSERT INTO agent_training_conversations (
                  id,agent_id,user_id,title,quality_score,successful_resolution,context_tags,source,
                  content_hash,governance_hash,origin,mutation_timestamp,revision,tombstone,immutable_metadata
                ) VALUES (
                  p_payload->>'id',p_agent_id,p_user_id,p_payload->>'title',
                  COALESCE((p_payload->>'quality_score')::REAL,0),COALESCE((p_payload->>'successful_resolution')::BOOLEAN,false),
                  p_payload->>'context_tags',COALESCE(p_payload->>'source','desktop'),p_content_hash,p_governance_hash,
                  p_origin,p_mutation_timestamp::TEXT,p_revision,false,COALESCE(p_payload->'audit','{}'::jsonb)
                ) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,quality_score=EXCLUDED.quality_score,
                  successful_resolution=EXCLUDED.successful_resolution,context_tags=EXCLUDED.context_tags,source=EXCLUDED.source,
                  content_hash=EXCLUDED.content_hash,governance_hash=EXCLUDED.governance_hash,origin=EXCLUDED.origin,
                  mutation_timestamp=EXCLUDED.mutation_timestamp,revision=EXCLUDED.revision,tombstone=false,updated_at=now()
                  WHERE (EXCLUDED.revision, EXCLUDED.mutation_timestamp, EXCLUDED.origin)
                        > (agent_training_conversations.revision, agent_training_conversations.mutation_timestamp, agent_training_conversations.origin);
            END IF;
        ELSIF p_payload->>'record_kind' = 'exchange' THEN
            IF p_operation = 'tombstone' THEN
                UPDATE agent_training_exchanges SET tombstone=true, updated_at=now()
                  WHERE agent_id=p_agent_id AND id=p_payload->>'id';
            ELSE
                INSERT INTO agent_training_exchanges (
                  id,conversation_id,agent_id,user_id,turn_index,role,content,tokens,quality_rating,notes,
                  content_hash,governance_hash,origin,mutation_timestamp,revision,tombstone,immutable_metadata
                ) VALUES (
                  p_payload->>'id',p_payload->>'conversation_id',p_agent_id,p_user_id,
                  COALESCE((p_payload->>'sequence')::INT,0),p_payload->>'role',p_payload->>'content',
                  COALESCE((p_payload->>'tokens')::INT,0),(p_payload->>'quality_rating')::INT,p_payload->>'notes',
                  p_content_hash,p_governance_hash,p_origin,p_mutation_timestamp::TEXT,p_revision,false,
                  COALESCE(p_payload->'audit','{}'::jsonb)
                ) ON CONFLICT (id) DO UPDATE SET content=EXCLUDED.content,tokens=EXCLUDED.tokens,
                  quality_rating=EXCLUDED.quality_rating,notes=EXCLUDED.notes,content_hash=EXCLUDED.content_hash,
                  governance_hash=EXCLUDED.governance_hash,origin=EXCLUDED.origin,mutation_timestamp=EXCLUDED.mutation_timestamp,
                  revision=EXCLUDED.revision,tombstone=false,updated_at=now()
                  WHERE (EXCLUDED.revision, EXCLUDED.mutation_timestamp, EXCLUDED.origin)
                        > (agent_training_exchanges.revision, agent_training_exchanges.mutation_timestamp, agent_training_exchanges.origin);
            END IF;
        ELSE
            RAISE EXCEPTION 'INVALID_TRAINING_RECORD' USING ERRCODE = 'P0001';
        END IF;
    ELSIF p_faculty = 'kb_doc' THEN
        v_wins := true;
        IF p_operation = 'tombstone' THEN
            UPDATE kb_sources SET tombstone=true, is_active=false, updated_at=now()
              WHERE agent_id=p_agent_id AND sync_doc_id=p_payload->>'id';
            UPDATE kb_chunks c SET tombstone=true
              FROM kb_sources s
              WHERE s.agent_id=p_agent_id AND s.sync_doc_id=p_payload->>'id' AND c.source_id=s.id;
        ELSIF EXISTS (SELECT 1 FROM kb_sources WHERE agent_id=p_agent_id AND sync_doc_id=p_payload->>'id') THEN
            UPDATE kb_sources SET
              title=COALESCE(p_payload->>'title', title),
              source_type=CASE WHEN p_payload->>'file_type' IN ('document','url','sitemap','manual','structured')
                               THEN p_payload->>'file_type' ELSE 'document' END,
              content_hash=p_content_hash, governance_hash=p_governance_hash,
              revision=p_revision, tombstone=false, is_active=true,
              origin=p_origin, mutation_timestamp=p_mutation_timestamp::TEXT, updated_at=now()
              WHERE agent_id=p_agent_id AND sync_doc_id=p_payload->>'id'
                AND (p_revision, p_mutation_timestamp::TEXT, p_origin)
                    > (COALESCE(revision,0), COALESCE(mutation_timestamp,''), COALESCE(origin,''));
        ELSE
            INSERT INTO kb_sources (
              id,user_id,agent_id,sync_doc_id,source_type,title,embedding_model,embedding_dim,
              indexing_status,is_active,content_hash,governance_hash,revision,tombstone,origin,mutation_timestamp,metadata
            ) VALUES (
              gen_random_uuid(),p_user_id,p_agent_id,p_payload->>'id',
              CASE WHEN p_payload->>'file_type' IN ('document','url','sitemap','manual','structured')
                   THEN p_payload->>'file_type' ELSE 'document' END,
              COALESCE(p_payload->>'title','Synced document'),'Qwen3-Embedding-0.6B',1024,
              'indexed',true,p_content_hash,p_governance_hash,p_revision,false,p_origin,p_mutation_timestamp::TEXT,
              COALESCE(p_payload->'metadata','{}'::jsonb)
            );
        END IF;
    ELSIF p_faculty = 'kb_chunk' THEN
        v_wins := true;
        SELECT id, title INTO v_source_id, v_source_title FROM kb_sources
          WHERE agent_id=p_agent_id AND sync_doc_id=p_payload->>'document_id';
        IF v_source_id IS NULL THEN
            RAISE EXCEPTION 'KB_CHUNK_MISSING_PARENT_DOC' USING ERRCODE = 'P0001';
        END IF;
        v_embedding_model := p_payload->>'embedding_model';
        IF p_operation = 'tombstone' THEN
            UPDATE kb_chunks SET tombstone=true
              WHERE agent_id=p_agent_id AND content_hash=p_content_hash;
        ELSE
            IF v_embedding_model IS DISTINCT FROM 'Qwen3-Embedding-0.6B' THEN
                RAISE EXCEPTION 'EMBEDDING_MODEL_MISMATCH' USING ERRCODE = 'P0001';
            END IF;
            IF NOT EXISTS (
                SELECT 1 FROM kb_chunks WHERE agent_id=p_agent_id AND content_hash=p_content_hash AND NOT tombstone
            ) THEN
                INSERT INTO kb_chunks (
                  id,source_id,user_id,deployment_id,agent_id,sync_chunk_id,chunk_index,content,token_count,
                  embedding,embedding_model,source_title,source_url,content_hash,governance_hash,
                  revision,tombstone,origin,mutation_timestamp,metadata
                ) VALUES (
                  gen_random_uuid(),v_source_id,p_user_id,NULL,p_agent_id,p_payload->>'id',
                  COALESCE((p_payload->>'chunk_index')::INT,0),p_payload->>'content',
                  COALESCE((p_payload->>'tokens')::INT,NULL),
                  (p_payload->'embedding')::text::vector(1024),v_embedding_model,
                  v_source_title,NULL,p_content_hash,p_governance_hash,
                  p_revision,false,p_origin,p_mutation_timestamp::TEXT,'{}'::jsonb
                )
                ON CONFLICT (source_id, chunk_index) DO UPDATE SET
                  agent_id=EXCLUDED.agent_id, sync_chunk_id=EXCLUDED.sync_chunk_id,
                  content=EXCLUDED.content, token_count=EXCLUDED.token_count,
                  embedding=EXCLUDED.embedding, embedding_model=EXCLUDED.embedding_model,
                  content_hash=EXCLUDED.content_hash, governance_hash=EXCLUDED.governance_hash,
                  revision=EXCLUDED.revision, tombstone=false, origin=EXCLUDED.origin,
                  mutation_timestamp=EXCLUDED.mutation_timestamp;
            END IF;
        END IF;
    ELSIF p_faculty = 'kg_entity' THEN
        -- REWRITE 1 OF 3. Identity is (agent_id, canonical_name). `entity_type` is still
        -- read from the payload and still stored — it is simply no longer part of what
        -- decides WHICH ROW this mutation is about.
        v_wins := true;
        IF p_operation = 'tombstone' THEN
            UPDATE agent_context_entities SET tombstone=true, updated_at=now()
              WHERE agent_id=p_agent_id AND canonical_name=p_payload->>'canonical_name'
                AND NOT tombstone;
        ELSE
            -- TWO STATEMENTS, AND THE SPLIT BETWEEN THEM IS THE INVARIANT.
            --
            -- Every field of this row is one of two kinds. A MUTABLE ATTRIBUTE (`name`,
            -- `entity_type`, the content hashes, the LWW watermark itself) has exactly one
            -- right value, and last-writer-wins decides it — so a mutation that lost the
            -- comparison must not touch it. An ACCUMULATOR (both temporal bounds,
            -- confidence, mention count, provenance) has no single right value to decide;
            -- it has evidence to absorb, and a mutation that arrived late is still
            -- evidence. `LEAST`/`GREATEST`/the provenance join are commutative, associative
            -- and idempotent, so absorbing a loser's contribution is always safe.
            --
            -- Previously ONE guarded statement did both, so a losing mutation contributed
            -- NOTHING: a backfill that lost the race left the row reading 'live' while it
            -- rested on a reconstructed observation. Splitting them is what makes the
            -- provenance column true rather than usually-true.

            -- 1. Insert, or absorb into the accumulators. UNCONDITIONAL.
            INSERT INTO agent_context_entities (
              id,agent_id,user_id,canonical_name,entity_type,name,description,aliases,confidence_score,mention_count,
              metadata,embedding,embedding_model,content_hash,governance_hash,origin,mutation_timestamp,revision,
              tombstone,sync_entity_id,immutable_metadata,observation_provenance,first_observed_at,last_observed_at
            ) VALUES (
              gen_random_uuid(),p_agent_id,p_user_id,p_payload->>'canonical_name',p_payload->>'entity_type',
              p_payload->>'name',p_payload->>'description',COALESCE(p_payload->'aliases','[]'::jsonb),
              COALESCE((p_payload->>'confidence_score')::REAL,0.5),COALESCE((p_payload->>'mention_count')::INT,1),
              '{}'::jsonb,NULL,'Qwen3-Embedding-0.6B',p_content_hash,p_governance_hash,p_origin,
              p_mutation_timestamp::TEXT,p_revision,false,p_payload->>'sync_entity_id','{}'::jsonb,v_provenance,
              v_observed_first,v_observed_last
            ) ON CONFLICT (agent_id,canonical_name) WHERE NOT tombstone DO UPDATE SET
              confidence_score=GREATEST(agent_context_entities.confidence_score, EXCLUDED.confidence_score),
              mention_count=GREATEST(agent_context_entities.mention_count, EXCLUDED.mention_count),
              -- `last_observed_at` takes the MAXIMUM, which is the never-move-backwards
              -- rule itself: a replay of February history cannot make an August fact look
              -- fresh, whichever of the two arrived later. `first_observed_at` takes the
              -- MINIMUM by the same argument read the other way — a replay reaching further
              -- back is evidence the entity is older than this surface believed.
              first_observed_at=LEAST(agent_context_entities.first_observed_at, EXCLUDED.first_observed_at),
              last_observed_at=GREATEST(agent_context_entities.last_observed_at, EXCLUDED.last_observed_at),
              observation_provenance=CASE
                WHEN agent_context_entities.observation_provenance = EXCLUDED.observation_provenance
                  THEN agent_context_entities.observation_provenance ELSE 'mixed' END,
              updated_at=now();

            -- 2. The mutable attributes and the watermark, only for a WINNER. On the plain
            -- insert path the row's watermark is already this mutation's, so the predicate
            -- is false and this is a no-op rather than a second write.
            UPDATE agent_context_entities SET
              entity_type=p_payload->>'entity_type',
              name=p_payload->>'name',
              description=p_payload->>'description',
              aliases=COALESCE(p_payload->'aliases','[]'::jsonb),
              content_hash=p_content_hash,governance_hash=p_governance_hash,origin=p_origin,
              mutation_timestamp=p_mutation_timestamp::TEXT,revision=p_revision,
              sync_entity_id=COALESCE(p_payload->>'sync_entity_id', sync_entity_id),
              updated_at=now()
              WHERE agent_id=p_agent_id AND canonical_name=p_payload->>'canonical_name' AND NOT tombstone
                AND (p_revision, p_mutation_timestamp::TEXT, p_origin)
                    > (revision, mutation_timestamp, origin);
        END IF;
        -- REWRITE 2 OF 3, the endpoint resolver. It matched buffered edges to entities on
        -- canonical name AND type. Since the type an edge recorded for its endpoint is
        -- whatever the extractor said on the edge's own turn, and the type the entity was
        -- finally stored under is whatever ITS turn said, that join could fail for two
        -- rows that are the same thing — leaving the edge permanently unresolved, holding
        -- NULL FKs, invisible to every read. Matching on the identity alone is what makes
        -- edge-before-entity delivery actually terminate.
        UPDATE agent_entity_relationships r SET
              resolved=true, source_entity_id=se.id, target_entity_id=te.id, updated_at=now()
          FROM agent_context_entities se, agent_context_entities te
          WHERE r.agent_id=p_agent_id AND NOT r.resolved AND NOT r.tombstone
            AND se.agent_id=p_agent_id AND NOT se.tombstone
              AND se.canonical_name=r.source_canonical
            AND te.agent_id=p_agent_id AND NOT te.tombstone
              AND te.canonical_name=r.target_canonical;
    ELSIF p_faculty = 'kg_edge' THEN
        -- REWRITE 3 OF 3. Endpoint lookup, tombstone match and upsert conflict target all
        -- key on the endpoints' canonical identity. The tombstone match is the one that
        -- matters most: if it still required the types to agree, a retraction would MISS
        -- the row it was retracting whenever the two turns disagreed about a type, and a
        -- fact the user disowned would stay live and keep being served.
        v_wins := true;
        SELECT id INTO v_src FROM agent_context_entities
          WHERE agent_id=p_agent_id AND NOT tombstone
            AND canonical_name=p_payload->>'source_canonical';
        SELECT id INTO v_tgt FROM agent_context_entities
          WHERE agent_id=p_agent_id AND NOT tombstone
            AND canonical_name=p_payload->>'target_canonical';
        IF p_operation = 'tombstone' THEN
            UPDATE agent_entity_relationships SET tombstone=true, updated_at=now()
              WHERE agent_id=p_agent_id AND NOT tombstone
                AND source_canonical=p_payload->>'source_canonical'
                AND relationship_type=p_payload->>'relationship_type'
                AND target_canonical=p_payload->>'target_canonical';
        ELSE
            -- Split exactly as the entity branch is split, and for the same reason.
            --
            -- `confirmation_count` stays in the conflict clause rather than moving to the
            -- winner statement: it is an accumulator, so it must not wait for a win, but it
            -- is the one accumulator that is not idempotent in itself, so it must fire
            -- exactly once per delivery — which is what `ON CONFLICT` gives it, since the
            -- event-id ledger above already refuses a mutation that has been applied
            -- before. Endpoint resolution is an accumulator too, in a quieter way: a
            -- resolved edge never becomes unresolved, so `COALESCE` keeps whichever
            -- delivery managed to find the endpoints first.
            INSERT INTO agent_entity_relationships (
              id,agent_id,user_id,source_entity_id,target_entity_id,source_canonical,source_entity_type,
              target_canonical,target_entity_type,relationship_type,confidence_score,confirmation_count,resolved,
              sync_edge_id,content_hash,governance_hash,origin,mutation_timestamp,revision,tombstone,immutable_metadata,
              observation_provenance,first_observed_at,last_observed_at
            ) VALUES (
              gen_random_uuid(),p_agent_id,p_user_id,v_src,v_tgt,p_payload->>'source_canonical',p_payload->>'source_entity_type',
              p_payload->>'target_canonical',p_payload->>'target_entity_type',p_payload->>'relationship_type',
              COALESCE((p_payload->>'confidence_score')::REAL,0.5),COALESCE((p_payload->>'confirmation_count')::INT,1),
              (v_src IS NOT NULL AND v_tgt IS NOT NULL),p_payload->>'sync_edge_id',p_content_hash,p_governance_hash,
              p_origin,p_mutation_timestamp::TEXT,p_revision,false,'{}'::jsonb,v_provenance,
              v_observed_first,v_observed_last
            ) ON CONFLICT (agent_id,source_canonical,relationship_type,target_canonical)
              WHERE NOT tombstone DO UPDATE SET
              source_entity_id=COALESCE(EXCLUDED.source_entity_id, agent_entity_relationships.source_entity_id),
              target_entity_id=COALESCE(EXCLUDED.target_entity_id, agent_entity_relationships.target_entity_id),
              resolved=(COALESCE(EXCLUDED.source_entity_id, agent_entity_relationships.source_entity_id) IS NOT NULL
                    AND COALESCE(EXCLUDED.target_entity_id, agent_entity_relationships.target_entity_id) IS NOT NULL),
              confidence_score=GREATEST(agent_entity_relationships.confidence_score, EXCLUDED.confidence_score),
              confirmation_count=agent_entity_relationships.confirmation_count + 1,
              -- `last_observed_at` is what the retrieval decay term reads. Taking the
              -- MAXIMUM is what stops a February re-confirmation presenting an edge as
              -- confirmed today.
              first_observed_at=LEAST(agent_entity_relationships.first_observed_at, EXCLUDED.first_observed_at),
              last_observed_at=GREATEST(agent_entity_relationships.last_observed_at, EXCLUDED.last_observed_at),
              observation_provenance=CASE
                WHEN agent_entity_relationships.observation_provenance = EXCLUDED.observation_provenance
                  THEN agent_entity_relationships.observation_provenance ELSE 'mixed' END,
              updated_at=now();

            UPDATE agent_entity_relationships SET
              source_entity_type=p_payload->>'source_entity_type',
              target_entity_type=p_payload->>'target_entity_type',
              sync_edge_id=COALESCE(p_payload->>'sync_edge_id', sync_edge_id),
              content_hash=p_content_hash,governance_hash=p_governance_hash,origin=p_origin,
              mutation_timestamp=p_mutation_timestamp::TEXT,revision=p_revision,updated_at=now()
              WHERE agent_id=p_agent_id AND NOT tombstone
                AND source_canonical=p_payload->>'source_canonical'
                AND relationship_type=p_payload->>'relationship_type'
                AND target_canonical=p_payload->>'target_canonical'
                AND (p_revision, p_mutation_timestamp::TEXT, p_origin)
                    > (revision, mutation_timestamp, origin);
        END IF;
    ELSE
        RAISE EXCEPTION 'FACULTY_NOT_WIRED' USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO agent_brain_events (
      mutation_id,agent_id,user_id,faculty,operation,content_hash,governance_hash,payload,
      revision,mutation_timestamp,origin,anchor_accepted
    ) VALUES (
      p_mutation_id,p_agent_id,p_user_id,p_faculty,p_operation,p_content_hash,p_governance_hash,p_payload,
      p_revision,p_mutation_timestamp,p_origin,true
    ) RETURNING agent_brain_events.event_id INTO v_existing;
    RETURN QUERY SELECT v_existing, false, v_wins;
END $$;
