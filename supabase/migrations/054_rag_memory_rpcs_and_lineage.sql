-- ============================================================================
-- 054: RAG/Memory retrieval RPCs + AGL-001 local lineage (Chatbot Phase 1b)
-- ============================================================================
-- Depends on 052 (end_users/channel_conversations) and 053 (kb_chunks,
-- end_user_memories, pgvector). Adds:
--   • match_kb_chunks         — hybrid (vector cosine + FTS) RRF retrieval
--   • match_end_user_memories — semantic memory recall (cosine)
--   • touch_end_user_memories — reinforcement (bump access_count/last_accessed)
--   • chatbot_lineage         — local AGL-001 governance lineage (NO anchoring)
--
-- The three functions take the query embedding as TEXT and cast to vector(1024)
-- so the service-role client (PostgREST) can pass it without a bespoke vector
-- serializer. They are SECURITY DEFINER + explicitly tenant-filtered (user_id),
-- mirroring get_user_accessible_agents.
--
-- RRF (Reciprocal Rank Fusion) constant k = 60 (standard). Vector + FTS each
-- contribute 1/(k + rank); ties fall back to the fused score. Cosine distance
-- (<=>) matches the HNSW vector_cosine_ops index built in 053.
-- ============================================================================

-- ─── Hybrid KB retrieval (vector + FTS, RRF-fused) ───────────────────────────
DROP FUNCTION IF EXISTS match_kb_chunks(UUID, UUID, TEXT, TEXT, INT);

CREATE OR REPLACE FUNCTION match_kb_chunks(
    p_user_id        UUID,
    p_deployment_id  UUID,
    p_query_embedding TEXT,          -- pgvector literal '[...]' (1024-dim)
    p_query_text     TEXT,
    p_match_count    INT DEFAULT 5
)
RETURNS TABLE (
    chunk_id     UUID,
    source_id    UUID,
    content      TEXT,
    source_title TEXT,
    source_url   TEXT,
    score        REAL
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    WITH q AS (
        SELECT p_query_embedding::vector(1024) AS embedding
    ),
    -- Vector half: nearest neighbours by cosine distance.
    vector_hits AS (
        SELECT
            c.id,
            ROW_NUMBER() OVER (ORDER BY c.embedding <=> (SELECT embedding FROM q)) AS rank
        FROM kb_chunks c
        WHERE c.user_id = p_user_id
          AND c.deployment_id = p_deployment_id
        ORDER BY c.embedding <=> (SELECT embedding FROM q)
        LIMIT GREATEST(p_match_count * 4, 20)
    ),
    -- Keyword half: full-text ranking (skipped cleanly when query is empty).
    fts_hits AS (
        SELECT
            c.id,
            ROW_NUMBER() OVER (
                ORDER BY ts_rank_cd(c.content_tsv, plainto_tsquery('english', p_query_text)) DESC
            ) AS rank
        FROM kb_chunks c
        WHERE c.user_id = p_user_id
          AND c.deployment_id = p_deployment_id
          AND p_query_text IS NOT NULL
          AND p_query_text <> ''
          AND c.content_tsv @@ plainto_tsquery('english', p_query_text)
        LIMIT GREATEST(p_match_count * 4, 20)
    ),
    fused AS (
        SELECT
            COALESCE(v.id, f.id) AS id,
            COALESCE(1.0 / (60 + v.rank), 0.0) + COALESCE(1.0 / (60 + f.rank), 0.0) AS rrf
        FROM vector_hits v
        FULL OUTER JOIN fts_hits f ON f.id = v.id
    )
    SELECT
        c.id            AS chunk_id,
        c.source_id     AS source_id,
        c.content       AS content,
        c.source_title  AS source_title,
        c.source_url    AS source_url,
        fused.rrf::REAL AS score
    FROM fused
    JOIN kb_chunks c ON c.id = fused.id
    ORDER BY fused.rrf DESC
    LIMIT p_match_count;
$$;

COMMENT ON FUNCTION match_kb_chunks(UUID, UUID, TEXT, TEXT, INT) IS
'Hybrid web-RAG retrieval: cosine ANN + FTS fused via RRF (k=60), tenant/deployment scoped. Query embedding passed as a pgvector text literal.';

-- ─── Semantic memory recall (cosine) ─────────────────────────────────────────
DROP FUNCTION IF EXISTS match_end_user_memories(UUID, UUID, TEXT, INT);

CREATE OR REPLACE FUNCTION match_end_user_memories(
    p_user_id         UUID,
    p_end_user_id     UUID,
    p_query_embedding TEXT,          -- pgvector literal '[...]' (1024-dim)
    p_match_count     INT DEFAULT 4
)
RETURNS TABLE (
    id         UUID,
    content    TEXT,
    kind       TEXT,
    importance REAL,
    score      REAL
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        m.id,
        m.content,
        m.kind,
        m.importance,
        (1.0 - (m.embedding <=> p_query_embedding::vector(1024)))::REAL AS score
    FROM end_user_memories m
    WHERE m.user_id = p_user_id
      AND m.end_user_id = p_end_user_id
      AND m.embedding IS NOT NULL
      AND (m.expires_at IS NULL OR m.expires_at > now())
    ORDER BY m.embedding <=> p_query_embedding::vector(1024)
    LIMIT p_match_count;
$$;

COMMENT ON FUNCTION match_end_user_memories(UUID, UUID, TEXT, INT) IS
'Semantic recall of a person''s embedded memories (cosine), tenant + end_user scoped, excluding expired rows.';

-- ─── Memory reinforcement (touch on recall) ──────────────────────────────────
DROP FUNCTION IF EXISTS touch_end_user_memories(UUID[]);

CREATE OR REPLACE FUNCTION touch_end_user_memories(p_ids UUID[])
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    UPDATE end_user_memories
    SET access_count = access_count + 1,
        last_accessed_at = now()
    WHERE id = ANY(p_ids);
$$;

COMMENT ON FUNCTION touch_end_user_memories(UUID[]) IS
'Reinforcement: bumps access_count + last_accessed_at for recalled memories (desktop decay/reinforcement model).';

-- ─── AGL-001 local lineage (F7; local-only, NO on-chain anchoring) ───────────
-- One row per web inference. Stores the canonical AGL-001 leaf components so the
-- answer is independently re-verifiable. anchor_status stays 'off' in this phase
-- (anchoring is unproven); the columns exist so lineage can grow honestly later.

CREATE TABLE IF NOT EXISTS chatbot_lineage (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,          -- tenant
    deployment_id    UUID REFERENCES widget_deployments(id) ON DELETE CASCADE,           -- agent
    conversation_id  UUID REFERENCES channel_conversations(id) ON DELETE SET NULL,
    end_user_id      UUID REFERENCES end_users(id) ON DELETE SET NULL,

    channel          TEXT NOT NULL DEFAULT 'web',
    model_id         TEXT NOT NULL,
    inference_source TEXT NOT NULL CHECK (inference_source IN ('sovereign-gateway', 'byok', 'managed')),

    -- Canonical AGL-001 leaf components (SHA-256 hex).
    input_hash       TEXT NOT NULL,
    response_hash    TEXT NOT NULL,           -- SHA-256(output)
    governance_hash  TEXT NOT NULL,           -- SHA-256(input_hash||output_hash||model_id||leaf_timestamp)
    -- The EXACT timestamp string bound into governance_hash (persist verbatim).
    leaf_timestamp   TEXT NOT NULL,

    -- Honest anchor lifecycle. Default 'off' — nothing implies fake success.
    anchor_status    TEXT NOT NULL DEFAULT 'off' CHECK (anchor_status IN ('off', 'pending', 'anchored', 'failed')),

    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_lineage_tenant
    ON chatbot_lineage (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chatbot_lineage_deployment
    ON chatbot_lineage (deployment_id, created_at DESC)
    WHERE deployment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chatbot_lineage_conversation
    ON chatbot_lineage (conversation_id)
    WHERE conversation_id IS NOT NULL;

ALTER TABLE chatbot_lineage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chatbot_lineage_owner_read" ON chatbot_lineage;
CREATE POLICY "chatbot_lineage_owner_read" ON chatbot_lineage
    FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "chatbot_lineage_service" ON chatbot_lineage;
CREATE POLICY "chatbot_lineage_service" ON chatbot_lineage
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE chatbot_lineage IS
'Local AGL-001 governance lineage for web chatbot inferences. Local-only (anchor_status stays off); powers Verifiable Answer Mode. Leaf = SHA-256(input_hash||output_hash||model_id||leaf_timestamp).';
