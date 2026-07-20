-- 057: portable synced-agent-brain Knowledge Graph faculty (Plan 041)
-- Adds cross-surface reconciliation for KG entities + edges to the proven
-- brain-sync rail (Contract-C / AGL-001, DARK anchor, authenticated receiver,
-- durable outbox/inbox/cursor, tombstones).
--
-- KG lives in the MAIN desktop DB (oraya.db: context_entities, entity_relationships),
-- NOT the per-agent memory DB. On PostgreSQL the agent-scoped mirror tables
-- agent_context_entities / agent_entity_relationships already exist (migration 055);
-- this migration makes them reconcilable across surfaces.
--
-- MERGE MODEL (documented, locked):
--   * Entities: upsert-by-canonical-identity (agent_id, canonical_name, entity_type)
--     with attribute LWW on (revision, mutation_timestamp, origin). content_hash is
--     the canonical identity, so the same entity extracted on any surface converges.
--   * Edges: append + dedup by (agent_id, src_canonical, src_type, rel_type,
--     dst_canonical, dst_type) with tombstones. Edges reference their endpoints by
--     CANONICAL IDENTITY, never by a surface-local id, and carry a `resolved` flag +
--     nullable entity FKs so an edge can be persisted before its endpoints exist
--     WITHOUT ever pointing at a missing/dangling entity. When an entity arrives, a
--     resolver fills the FKs. This is the no-dangling-edge guarantee (order-independent).

-- ── Entity provenance / attribute columns (agent_context_entities from 055) ────
ALTER TABLE agent_context_entities ADD COLUMN IF NOT EXISTS sync_entity_id TEXT;
ALTER TABLE agent_context_entities ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE agent_context_entities ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE agent_context_entities ADD COLUMN IF NOT EXISTS aliases JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE agent_context_entities ADD COLUMN IF NOT EXISTS confidence_score REAL NOT NULL DEFAULT 0.5;
ALTER TABLE agent_context_entities ADD COLUMN IF NOT EXISTS mention_count INT NOT NULL DEFAULT 1;

-- One LIVE row per canonical identity: the upsert dedup key + reconciliation key.
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_context_entities_identity
    ON agent_context_entities(agent_id, canonical_name, entity_type)
    WHERE NOT tombstone;
CREATE INDEX IF NOT EXISTS idx_agent_context_entities_agent
    ON agent_context_entities(user_id, agent_id) WHERE NOT tombstone;

-- ── Edge canonical-endpoint columns + relaxed FKs (agent_entity_relationships) ─
-- An unresolved edge holds only the endpoint identities; the UUID FKs are filled
-- once both endpoints exist. Relax NOT NULL so a pre-endpoint edge can be stored.
ALTER TABLE agent_entity_relationships ALTER COLUMN source_entity_id DROP NOT NULL;
ALTER TABLE agent_entity_relationships ALTER COLUMN target_entity_id DROP NOT NULL;
ALTER TABLE agent_entity_relationships ADD COLUMN IF NOT EXISTS sync_edge_id TEXT;
ALTER TABLE agent_entity_relationships ADD COLUMN IF NOT EXISTS source_canonical TEXT;
ALTER TABLE agent_entity_relationships ADD COLUMN IF NOT EXISTS source_entity_type TEXT;
ALTER TABLE agent_entity_relationships ADD COLUMN IF NOT EXISTS target_canonical TEXT;
ALTER TABLE agent_entity_relationships ADD COLUMN IF NOT EXISTS target_entity_type TEXT;
ALTER TABLE agent_entity_relationships ADD COLUMN IF NOT EXISTS resolved BOOLEAN NOT NULL DEFAULT false;

-- One LIVE edge per (endpoints + type): dedup key.
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_entity_relationships_identity
    ON agent_entity_relationships(agent_id, source_canonical, source_entity_type,
                                  relationship_type, target_canonical, target_entity_type)
    WHERE NOT tombstone;
-- Fast lookup of edges still waiting on an endpoint (drained by the resolver).
CREATE INDEX IF NOT EXISTS idx_agent_entity_relationships_unresolved
    ON agent_entity_relationships(agent_id) WHERE NOT resolved AND NOT tombstone;

-- Allow the KG faculties in the append-only pull ledger.
ALTER TABLE agent_brain_events DROP CONSTRAINT IF EXISTS agent_brain_events_faculty_check;
ALTER TABLE agent_brain_events ADD CONSTRAINT agent_brain_events_faculty_check
    CHECK (faculty IN ('core_prompt','memory','prompt_stack','behavioral_rule','training',
                       'kb_doc','kb_chunk','kg_entity','kg_edge'));

-- ── Receiver transaction (re-emitted with kg_entity + kg_edge branches) ────────
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
    v_src UUID;
    v_tgt UUID;
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
        -- Entity: upsert-by-canonical-identity with attribute LWW. content_hash is
        -- the canonical identity, so the same entity from any surface converges.
        v_wins := true;
        IF p_operation = 'tombstone' THEN
            UPDATE agent_context_entities SET tombstone=true, updated_at=now()
              WHERE agent_id=p_agent_id AND canonical_name=p_payload->>'canonical_name'
                AND entity_type=p_payload->>'entity_type' AND NOT tombstone;
        ELSE
            INSERT INTO agent_context_entities (
              id,agent_id,user_id,canonical_name,entity_type,name,description,aliases,confidence_score,mention_count,
              metadata,embedding,embedding_model,content_hash,governance_hash,origin,mutation_timestamp,revision,
              tombstone,sync_entity_id,immutable_metadata
            ) VALUES (
              gen_random_uuid(),p_agent_id,p_user_id,p_payload->>'canonical_name',p_payload->>'entity_type',
              p_payload->>'name',p_payload->>'description',COALESCE(p_payload->'aliases','[]'::jsonb),
              COALESCE((p_payload->>'confidence_score')::REAL,0.5),COALESCE((p_payload->>'mention_count')::INT,1),
              '{}'::jsonb,NULL,'Qwen3-Embedding-0.6B',p_content_hash,p_governance_hash,p_origin,
              p_mutation_timestamp::TEXT,p_revision,false,p_payload->>'sync_entity_id','{}'::jsonb
            ) ON CONFLICT (agent_id,canonical_name,entity_type) WHERE NOT tombstone DO UPDATE SET
              name=EXCLUDED.name,description=EXCLUDED.description,aliases=EXCLUDED.aliases,
              confidence_score=GREATEST(agent_context_entities.confidence_score, EXCLUDED.confidence_score),
              mention_count=GREATEST(agent_context_entities.mention_count, EXCLUDED.mention_count),
              content_hash=EXCLUDED.content_hash,governance_hash=EXCLUDED.governance_hash,origin=EXCLUDED.origin,
              mutation_timestamp=EXCLUDED.mutation_timestamp,revision=EXCLUDED.revision,
              sync_entity_id=COALESCE(EXCLUDED.sync_entity_id, agent_context_entities.sync_entity_id),updated_at=now()
              WHERE (EXCLUDED.revision, EXCLUDED.mutation_timestamp, EXCLUDED.origin)
                    > (agent_context_entities.revision, agent_context_entities.mutation_timestamp, agent_context_entities.origin);
        END IF;
        -- Resolver: any buffered edge whose BOTH endpoints now exist becomes resolved
        -- and gets its FK ids filled. This is what makes edge-before-entity safe.
        UPDATE agent_entity_relationships r SET
              resolved=true, source_entity_id=se.id, target_entity_id=te.id, updated_at=now()
          FROM agent_context_entities se, agent_context_entities te
          WHERE r.agent_id=p_agent_id AND NOT r.resolved AND NOT r.tombstone
            AND se.agent_id=p_agent_id AND NOT se.tombstone
              AND se.canonical_name=r.source_canonical AND se.entity_type=r.source_entity_type
            AND te.agent_id=p_agent_id AND NOT te.tombstone
              AND te.canonical_name=r.target_canonical AND te.entity_type=r.target_entity_type;
    ELSIF p_faculty = 'kg_edge' THEN
        -- Edge: append + dedup by (endpoints + type). NEVER points at a missing
        -- entity: the FK ids are filled only when both endpoints resolve, else NULL
        -- with resolved=false and the resolver fills them when the entities arrive.
        v_wins := true;
        SELECT id INTO v_src FROM agent_context_entities
          WHERE agent_id=p_agent_id AND NOT tombstone
            AND canonical_name=p_payload->>'source_canonical' AND entity_type=p_payload->>'source_entity_type';
        SELECT id INTO v_tgt FROM agent_context_entities
          WHERE agent_id=p_agent_id AND NOT tombstone
            AND canonical_name=p_payload->>'target_canonical' AND entity_type=p_payload->>'target_entity_type';
        IF p_operation = 'tombstone' THEN
            UPDATE agent_entity_relationships SET tombstone=true, updated_at=now()
              WHERE agent_id=p_agent_id AND NOT tombstone
                AND source_canonical=p_payload->>'source_canonical' AND source_entity_type=p_payload->>'source_entity_type'
                AND relationship_type=p_payload->>'relationship_type'
                AND target_canonical=p_payload->>'target_canonical' AND target_entity_type=p_payload->>'target_entity_type';
        ELSE
            INSERT INTO agent_entity_relationships (
              id,agent_id,user_id,source_entity_id,target_entity_id,source_canonical,source_entity_type,
              target_canonical,target_entity_type,relationship_type,confidence_score,confirmation_count,resolved,
              sync_edge_id,content_hash,governance_hash,origin,mutation_timestamp,revision,tombstone,immutable_metadata
            ) VALUES (
              gen_random_uuid(),p_agent_id,p_user_id,v_src,v_tgt,p_payload->>'source_canonical',p_payload->>'source_entity_type',
              p_payload->>'target_canonical',p_payload->>'target_entity_type',p_payload->>'relationship_type',
              COALESCE((p_payload->>'confidence_score')::REAL,0.5),COALESCE((p_payload->>'confirmation_count')::INT,1),
              (v_src IS NOT NULL AND v_tgt IS NOT NULL),p_payload->>'sync_edge_id',p_content_hash,p_governance_hash,
              p_origin,p_mutation_timestamp::TEXT,p_revision,false,'{}'::jsonb
            ) ON CONFLICT (agent_id,source_canonical,source_entity_type,relationship_type,target_canonical,target_entity_type)
              WHERE NOT tombstone DO UPDATE SET
              source_entity_id=COALESCE(EXCLUDED.source_entity_id, agent_entity_relationships.source_entity_id),
              target_entity_id=COALESCE(EXCLUDED.target_entity_id, agent_entity_relationships.target_entity_id),
              resolved=(COALESCE(EXCLUDED.source_entity_id, agent_entity_relationships.source_entity_id) IS NOT NULL
                    AND COALESCE(EXCLUDED.target_entity_id, agent_entity_relationships.target_entity_id) IS NOT NULL),
              confidence_score=GREATEST(agent_entity_relationships.confidence_score, EXCLUDED.confidence_score),
              confirmation_count=agent_entity_relationships.confirmation_count + 1,
              content_hash=EXCLUDED.content_hash,governance_hash=EXCLUDED.governance_hash,origin=EXCLUDED.origin,
              mutation_timestamp=EXCLUDED.mutation_timestamp,revision=EXCLUDED.revision,updated_at=now()
              WHERE (EXCLUDED.revision, EXCLUDED.mutation_timestamp, EXCLUDED.origin)
                    > (agent_entity_relationships.revision, agent_entity_relationships.mutation_timestamp, agent_entity_relationships.origin);
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

COMMENT ON INDEX idx_agent_context_entities_identity IS 'One LIVE entity per canonical identity (agent, canonical_name, entity_type) — the cross-surface reconciliation key.';
COMMENT ON INDEX idx_agent_entity_relationships_identity IS 'One LIVE edge per (endpoints + relationship_type); edges reference endpoints by canonical identity, never by surface-local id.';
COMMENT ON COLUMN agent_entity_relationships.resolved IS 'true only when both endpoint entities exist and the UUID FKs are filled; a false/unresolved edge NEVER dangles because its FKs are NULL until the resolver runs.';
