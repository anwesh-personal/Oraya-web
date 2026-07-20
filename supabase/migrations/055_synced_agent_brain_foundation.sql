-- 055: portable synced-agent-brain foundation (Plan 036, M1)
-- Canonical PostgreSQL schema for both on-prem Postgres and Supabase. Supabase
-- applies the RLS section; an on-prem deployment uses the same tables with its
-- deployment authentication layer. No channel-specific state is stored here.

CREATE TABLE IF NOT EXISTS agent_brains (
    agent_id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    synced_brain BOOLEAN NOT NULL DEFAULT false,
    sync_target TEXT CHECK (sync_target IN ('onprem', 'cloud')),
    sync_embedding_model TEXT,
    core_prompt TEXT,
    core_prompt_hash TEXT,
    core_prompt_version BIGINT NOT NULL DEFAULT 0,
    core_prompt_updated_at TIMESTAMPTZ,
    core_prompt_origin TEXT CHECK (core_prompt_origin IN ('desktop', 'web', 'whatsapp', 'telegram', 'onprem', 'cloud')),
    current_revision BIGINT NOT NULL DEFAULT 0,
    sync_cursor TEXT,
    sync_state TEXT NOT NULL DEFAULT 'local_only'
        CHECK (sync_state IN ('local_only', 'configured', 'pending_anchor', 'synced', 'failed')),
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT agent_brains_opt_in_configuration CHECK (
        NOT synced_brain OR (sync_target IS NOT NULL AND sync_embedding_model IS NOT NULL)
    ),
    CONSTRAINT agent_brains_model_pin CHECK (
        sync_embedding_model IS NULL OR sync_embedding_model = 'Qwen3-Embedding-0.6B'
    )
);
CREATE INDEX IF NOT EXISTS idx_agent_brains_user ON agent_brains(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_brains_sync_enabled ON agent_brains(user_id, synced_brain) WHERE synced_brain;

-- The append-only ledger is the sole pull source.  It deliberately records
-- acknowledged retransmissions once and orders every peer-visible change by a
-- stable server cursor, not client arrival time.
CREATE TABLE IF NOT EXISTS agent_brain_events (
    event_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mutation_id TEXT NOT NULL UNIQUE,
    agent_id TEXT NOT NULL REFERENCES agent_brains(agent_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    faculty TEXT NOT NULL CHECK (faculty IN ('core_prompt', 'memory', 'prompt_stack', 'behavioral_rule', 'training')),
    operation TEXT NOT NULL CHECK (operation IN ('upsert', 'tombstone')),
    content_hash TEXT NOT NULL,
    governance_hash TEXT NOT NULL CHECK (governance_hash ~ '^[0-9a-f]{64}$'),
    payload JSONB NOT NULL,
    revision BIGINT NOT NULL,
    mutation_timestamp TIMESTAMPTZ NOT NULL,
    origin TEXT NOT NULL CHECK (origin IN ('desktop', 'web', 'whatsapp', 'telegram', 'onprem', 'cloud')),
    anchor_accepted BOOLEAN NOT NULL DEFAULT false,
    persisted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agent_brain_events_pull
    ON agent_brain_events(user_id, agent_id, event_id);

-- Immutable/append-friendly memory. `content_hash` is the idempotency key;
-- tombstones retain audit evidence and must never physically erase synced history.
CREATE TABLE IF NOT EXISTS agent_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL REFERENCES agent_brains(agent_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scope TEXT NOT NULL CHECK (scope IN ('private', 'shared', 'hybrid')),
    memory_type TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
    importance REAL NOT NULL DEFAULT 0.5 CHECK (importance >= 0 AND importance <= 1),
    decay_rate REAL NOT NULL DEFAULT 0 CHECK (decay_rate >= 0),
    source_conversation_id TEXT,
    content_hash TEXT NOT NULL,
    governance_hash TEXT NOT NULL CHECK (governance_hash ~ '^[0-9a-f]{64}$'),
    embedding vector(1024),
    embedding_model TEXT NOT NULL,
    origin TEXT NOT NULL CHECK (origin IN ('desktop', 'web', 'whatsapp', 'telegram', 'onprem', 'cloud')),
    mutation_timestamp TEXT NOT NULL,
    revision BIGINT NOT NULL,
    tombstone BOOLEAN NOT NULL DEFAULT false,
    tombstoned_at TIMESTAMPTZ,
    immutable_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT agent_memories_model_pin CHECK (embedding_model = 'Qwen3-Embedding-0.6B'),
    CONSTRAINT agent_memories_hash_revision_unique UNIQUE (agent_id, content_hash, revision)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_memories_live_content
    ON agent_memories(agent_id, content_hash) WHERE NOT tombstone;
CREATE INDEX IF NOT EXISTS idx_agent_memories_scope ON agent_memories(user_id, agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_memories_embedding_hnsw
    ON agent_memories USING hnsw (embedding vector_cosine_ops) WHERE embedding IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agent_memories_tsv
    ON agent_memories USING gin (to_tsvector('english', content));

CREATE TABLE IF NOT EXISTS agent_prompt_stack (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agent_brains(agent_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt_type TEXT NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    keywords TEXT,
    tags TEXT,
    position INT NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    source TEXT NOT NULL DEFAULT 'desktop',
    content_hash TEXT NOT NULL,
    governance_hash TEXT NOT NULL CHECK (governance_hash ~ '^[0-9a-f]{64}$'),
    origin TEXT NOT NULL, mutation_timestamp TEXT NOT NULL, revision BIGINT NOT NULL,
    tombstone BOOLEAN NOT NULL DEFAULT false, immutable_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(agent_id, id, revision)
);
CREATE TABLE IF NOT EXISTS agent_behavioral_rules (
    id TEXT PRIMARY KEY, agent_id TEXT NOT NULL REFERENCES agent_brains(agent_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, rule_type TEXT NOT NULL, content TEXT NOT NULL,
    category TEXT, severity TEXT NOT NULL DEFAULT 'important', sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true, source TEXT NOT NULL DEFAULT 'desktop',
    content_hash TEXT NOT NULL, governance_hash TEXT NOT NULL CHECK (governance_hash ~ '^[0-9a-f]{64}$'),
    origin TEXT NOT NULL, mutation_timestamp TEXT NOT NULL, revision BIGINT NOT NULL, tombstone BOOLEAN NOT NULL DEFAULT false,
    immutable_metadata JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS agent_training_conversations (
    id TEXT PRIMARY KEY, agent_id TEXT NOT NULL REFERENCES agent_brains(agent_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, title TEXT NOT NULL, quality_score REAL NOT NULL DEFAULT 0,
    successful_resolution BOOLEAN NOT NULL DEFAULT false, context_tags TEXT, source TEXT NOT NULL DEFAULT 'desktop', content_hash TEXT NOT NULL,
    governance_hash TEXT NOT NULL CHECK (governance_hash ~ '^[0-9a-f]{64}$'), origin TEXT NOT NULL, mutation_timestamp TEXT NOT NULL,
    revision BIGINT NOT NULL, tombstone BOOLEAN NOT NULL DEFAULT false, immutable_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS agent_training_exchanges (
    id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES agent_training_conversations(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL REFERENCES agent_brains(agent_id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    turn_index INT NOT NULL, role TEXT NOT NULL, content TEXT NOT NULL, tokens INT NOT NULL DEFAULT 0,
    quality_rating INT, notes TEXT, content_hash TEXT NOT NULL,
    governance_hash TEXT NOT NULL CHECK (governance_hash ~ '^[0-9a-f]{64}$'), origin TEXT NOT NULL, mutation_timestamp TEXT NOT NULL,
    revision BIGINT NOT NULL, tombstone BOOLEAN NOT NULL DEFAULT false, immutable_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(conversation_id, turn_index, revision)
);
CREATE TABLE IF NOT EXISTS agent_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), agent_id TEXT NOT NULL REFERENCES agent_brains(agent_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, title TEXT NOT NULL, description TEXT, status TEXT NOT NULL,
    progress_percentage REAL NOT NULL DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100), content_hash TEXT NOT NULL,
    governance_hash TEXT NOT NULL CHECK (governance_hash ~ '^[0-9a-f]{64}$'), origin TEXT NOT NULL, mutation_timestamp TEXT NOT NULL,
    revision BIGINT NOT NULL, tombstone BOOLEAN NOT NULL DEFAULT false, immutable_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS agent_reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), agent_id TEXT NOT NULL REFERENCES agent_brains(agent_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, content TEXT NOT NULL, source_conversation_id TEXT,
    content_hash TEXT NOT NULL, governance_hash TEXT NOT NULL CHECK (governance_hash ~ '^[0-9a-f]{64}$'), origin TEXT NOT NULL,
    mutation_timestamp TEXT NOT NULL, revision BIGINT NOT NULL, tombstone BOOLEAN NOT NULL DEFAULT false,
    immutable_metadata JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS agent_context_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), agent_id TEXT NOT NULL REFERENCES agent_brains(agent_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, canonical_name TEXT NOT NULL, entity_type TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb, embedding vector(1024), embedding_model TEXT NOT NULL DEFAULT 'Qwen3-Embedding-0.6B',
    content_hash TEXT NOT NULL, governance_hash TEXT NOT NULL CHECK (governance_hash ~ '^[0-9a-f]{64}$'), origin TEXT NOT NULL,
    mutation_timestamp TEXT NOT NULL, revision BIGINT NOT NULL, tombstone BOOLEAN NOT NULL DEFAULT false,
    immutable_metadata JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS agent_entity_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), agent_id TEXT NOT NULL REFERENCES agent_brains(agent_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, source_entity_id UUID NOT NULL REFERENCES agent_context_entities(id),
    target_entity_id UUID NOT NULL REFERENCES agent_context_entities(id), relationship_type TEXT NOT NULL, confidence_score REAL NOT NULL DEFAULT 0,
    confirmation_count INT NOT NULL DEFAULT 1, content_hash TEXT NOT NULL, governance_hash TEXT NOT NULL CHECK (governance_hash ~ '^[0-9a-f]{64}$'),
    origin TEXT NOT NULL, mutation_timestamp TEXT NOT NULL, revision BIGINT NOT NULL, tombstone BOOLEAN NOT NULL DEFAULT false,
    immutable_metadata JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Extend, never duplicate, existing RAG records for an agent-scoped synced path.
ALTER TABLE kb_sources ADD COLUMN IF NOT EXISTS agent_id TEXT REFERENCES agent_brains(agent_id) ON DELETE CASCADE;
ALTER TABLE kb_sources ADD COLUMN IF NOT EXISTS content_hash TEXT;
ALTER TABLE kb_sources ADD COLUMN IF NOT EXISTS governance_hash TEXT;
ALTER TABLE kb_sources ADD COLUMN IF NOT EXISTS revision BIGINT;
ALTER TABLE kb_sources ADD COLUMN IF NOT EXISTS tombstone BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE kb_chunks ADD COLUMN IF NOT EXISTS agent_id TEXT REFERENCES agent_brains(agent_id) ON DELETE CASCADE;
ALTER TABLE kb_chunks ADD COLUMN IF NOT EXISTS content_hash TEXT;
ALTER TABLE kb_chunks ADD COLUMN IF NOT EXISTS governance_hash TEXT;
ALTER TABLE kb_chunks ADD COLUMN IF NOT EXISTS embedding_model TEXT;
ALTER TABLE kb_chunks ADD COLUMN IF NOT EXISTS revision BIGINT;
ALTER TABLE kb_chunks ADD COLUMN IF NOT EXISTS tombstone BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_kb_sources_agent ON kb_sources(agent_id) WHERE agent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kb_chunks_agent ON kb_chunks(agent_id) WHERE agent_id IS NOT NULL;

-- RLS mirrors the established owner-read/service-write model.
ALTER TABLE agent_brains ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_brain_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_prompt_stack ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_behavioral_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_training_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_training_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_context_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_entity_relationships ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['agent_brains','agent_memories','agent_prompt_stack','agent_behavioral_rules','agent_training_conversations','agent_training_exchanges','agent_goals','agent_reflections','agent_context_entities','agent_entity_relationships']
  LOOP
    EXECUTE format('CREATE POLICY %I ON %I FOR SELECT USING (auth.uid() = user_id)', tbl || '_owner_read', tbl);
    EXECUTE format('CREATE POLICY %I ON %I FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')', tbl || '_service', tbl);
  END LOOP;
END $$;
CREATE POLICY agent_brain_events_owner_read ON agent_brain_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY agent_brain_events_service ON agent_brain_events FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Receiver transaction: no acknowledgement can be issued for a half-applied
-- mutation.  `event_id` is the opaque, monotonic desktop pull cursor.
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
        -- Explicit total order: revision, timestamp, origin.  Arrival order is
        -- never considered, and the losing revision remains in the event audit.
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

DROP TRIGGER IF EXISTS trigger_agent_brains_updated_at ON agent_brains;
CREATE TRIGGER trigger_agent_brains_updated_at BEFORE UPDATE ON agent_brains FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE agent_brains IS 'Portable agent identity and synchronized-brain opt-in registry. Channels are adapters, not brain owners.';
COMMENT ON TABLE agent_memories IS 'Agent-scoped append-friendly memory. content_hash/revision are idempotency keys; governance_hash is a mandatory Contract-C AGL-001 leaf.';
