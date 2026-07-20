-- 056: portable synced-agent-brain KB faculty (Plan 040)
-- Adds documents + chunks + vector embeddings to the proven brain-sync rail.
-- Design choice: EXTEND the existing 053 kb_sources / kb_chunks (already carrying
-- HNSW + FTS + the match_kb_chunks hybrid retrieval) rather than creating parallel
-- agent_kb_* tables. This guarantees a synced agent's web RAG retrieves synced KB
-- through the SAME retrieval function — no duplicated, divergent behaviour.
--
-- Embedding integrity is the central invariant: every agent-scoped chunk MUST be
-- stamped with the pinned model and carry a float[1024] vector. Mismatch is
-- rejected fail-loud at the app (contract), the route, and the database (CHECK).

-- ── Desktop-origin identity + provenance columns ───────────────────────────────
-- kb_sources.id / kb_chunks.id are UUID PKs; desktop uses TEXT ids, so we key the
-- sync upsert on (agent_id, sync_doc_id) and (agent_id, content_hash).
ALTER TABLE kb_sources ADD COLUMN IF NOT EXISTS sync_doc_id TEXT;
ALTER TABLE kb_sources ADD COLUMN IF NOT EXISTS origin TEXT;
ALTER TABLE kb_sources ADD COLUMN IF NOT EXISTS mutation_timestamp TEXT;
ALTER TABLE kb_chunks  ADD COLUMN IF NOT EXISTS sync_chunk_id TEXT;
ALTER TABLE kb_chunks  ADD COLUMN IF NOT EXISTS origin TEXT;
ALTER TABLE kb_chunks  ADD COLUMN IF NOT EXISTS mutation_timestamp TEXT;

-- Idempotent upsert / dedup keys for the sync path (partial: never touch legacy
-- deployment-scoped rows that have no agent_id).
CREATE UNIQUE INDEX IF NOT EXISTS idx_kb_sources_agent_doc
    ON kb_sources(agent_id, sync_doc_id)
    WHERE agent_id IS NOT NULL AND sync_doc_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_kb_chunks_agent_content
    ON kb_chunks(agent_id, content_hash)
    WHERE agent_id IS NOT NULL AND content_hash IS NOT NULL AND NOT tombstone;

-- Model pin enforced at the database, not just the app. A synced chunk whose
-- embedding model is not the pin can never be inserted.
ALTER TABLE kb_chunks DROP CONSTRAINT IF EXISTS kb_chunks_synced_model_pin;
ALTER TABLE kb_chunks ADD CONSTRAINT kb_chunks_synced_model_pin
    CHECK (agent_id IS NULL OR embedding_model = 'Qwen3-Embedding-0.6B');

-- Allow the KB faculties in the append-only pull ledger.
ALTER TABLE agent_brain_events DROP CONSTRAINT IF EXISTS agent_brain_events_faculty_check;
ALTER TABLE agent_brain_events ADD CONSTRAINT agent_brain_events_faculty_check
    CHECK (faculty IN ('core_prompt','memory','prompt_stack','behavioral_rule','training','kb_doc','kb_chunk'));

-- ── Receiver transaction (re-emitted with kb_doc + kb_chunk branches) ──────────
-- No acknowledgement can be issued for a half-applied mutation. event_id is the
-- opaque, monotonic desktop pull cursor.
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
        -- A KB source (document). Edit-in-place by (agent_id, sync_doc_id) with
        -- deterministic LWW; the losing revision stays in the event audit.
        v_wins := true;
        IF p_operation = 'tombstone' THEN
            UPDATE kb_sources SET tombstone=true, is_active=false, updated_at=now()
              WHERE agent_id=p_agent_id AND sync_doc_id=p_payload->>'id';
            -- Cascade the tombstone to the source's chunks so retrieval can never
            -- surface an orphaned chunk of a removed document.
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
        -- A KB chunk carries its vector. Content-addressed append by
        -- (agent_id, content_hash); a chunk cannot land before its parent doc.
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
            -- Fail-loud model pin (defence in depth beyond the app + route + CHECK).
            IF v_embedding_model IS DISTINCT FROM 'Qwen3-Embedding-0.6B' THEN
                RAISE EXCEPTION 'EMBEDDING_MODEL_MISMATCH' USING ERRCODE = 'P0001';
            END IF;
            IF NOT EXISTS (
                SELECT 1 FROM kb_chunks WHERE agent_id=p_agent_id AND content_hash=p_content_hash AND NOT tombstone
            ) THEN
                -- Content-addressed insert. A previously tombstoned chunk still owns its
                -- (source_id, chunk_index) slot, so re-adding a removed chunk revives that
                -- exact row rather than colliding on the base UNIQUE constraint. This keeps
                -- both replay and real re-add-after-delete idempotent.
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

-- ── Hybrid KB retrieval (extended, NOT duplicated) ─────────────────────────────
-- Same RRF (k=60) vector + FTS fusion as 054, now also matching agent-scoped
-- synced chunks and excluding tombstones. Adding p_agent_id (DEFAULT NULL) keeps
-- every existing caller working unchanged.
DROP FUNCTION IF EXISTS match_kb_chunks(UUID, UUID, TEXT, TEXT, INT);
CREATE OR REPLACE FUNCTION match_kb_chunks(
    p_user_id        UUID,
    p_deployment_id  UUID,
    p_query_embedding TEXT,
    p_query_text     TEXT,
    p_match_count    INT DEFAULT 5,
    p_agent_id       TEXT DEFAULT NULL
)
RETURNS TABLE (
    chunk_id     UUID,
    source_id    UUID,
    content      TEXT,
    source_title TEXT,
    source_url   TEXT,
    score        REAL
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    WITH q AS (
        SELECT p_query_embedding::vector(1024) AS embedding
    ),
    scoped AS (
        SELECT c.*
        FROM kb_chunks c
        WHERE c.user_id = p_user_id
          AND NOT COALESCE(c.tombstone, false)
          AND (
                c.deployment_id = p_deployment_id
                OR (p_agent_id IS NOT NULL AND c.agent_id = p_agent_id)
          )
    ),
    vector_hits AS (
        SELECT c.id,
            ROW_NUMBER() OVER (ORDER BY c.embedding <=> (SELECT embedding FROM q)) AS rank
        FROM scoped c
        ORDER BY c.embedding <=> (SELECT embedding FROM q)
        LIMIT GREATEST(p_match_count * 4, 20)
    ),
    fts_hits AS (
        SELECT c.id,
            ROW_NUMBER() OVER (
                ORDER BY ts_rank_cd(c.content_tsv, plainto_tsquery('english', p_query_text)) DESC
            ) AS rank
        FROM scoped c
        WHERE p_query_text IS NOT NULL AND p_query_text <> ''
          AND c.content_tsv @@ plainto_tsquery('english', p_query_text)
        LIMIT GREATEST(p_match_count * 4, 20)
    ),
    fused AS (
        SELECT COALESCE(v.id, f.id) AS id,
            COALESCE(1.0 / (60 + v.rank), 0.0) + COALESCE(1.0 / (60 + f.rank), 0.0) AS rrf
        FROM vector_hits v
        FULL OUTER JOIN fts_hits f ON f.id = v.id
    )
    SELECT c.id AS chunk_id, c.source_id, c.content, c.source_title, c.source_url,
           fused.rrf::REAL AS score
    FROM fused JOIN kb_chunks c ON c.id = fused.id
    ORDER BY fused.rrf DESC
    LIMIT p_match_count;
$$;

COMMENT ON FUNCTION match_kb_chunks IS 'Hybrid (vector<=> + FTS, RRF k=60) KB retrieval. Sees both deployment-scoped and synced agent-scoped (agent_id) chunks; excludes tombstones.';
COMMENT ON CONSTRAINT kb_chunks_synced_model_pin ON kb_chunks IS 'Synced agent KB chunks must be embedded with the pinned Qwen3-Embedding-0.6B model.';
