-- ============================================================================
-- 053: pgvector Enablement + Knowledge Base & Memory Substrate (F3)
-- ============================================================================
-- Phase-1a DB FOUNDATION for the "best chatbot ever" roadmap (plan 029).
-- Depends on 052 (end_users, channel_conversations) and 049 (widget_deployments).
--
-- Ports the desktop crown jewels (RAG v2 + memory layer) onto Supabase:
--   sqlite-vec is desktop-only and does NOT port → pgvector is the web substrate.
--
-- Embedding dimension = 1024 to match the sovereign gateway embedder
-- (Qwen3-Embedding-0.6B via myoraya.space /v1/embeddings). This is FIXED by
-- the model; a mismatch must fail loud at write time, so the column is typed
-- vector(1024) rather than an untyped/variable vector.
--
-- Vector index choice: HNSW (not IVFFlat). Justification:
--   • Incremental writes: tenants add KB chunks and memories continuously.
--     IVFFlat clusters into lists at build time and degrades / needs periodic
--     REINDEX as data grows; HNSW builds incrementally and stays healthy.
--   • Read-heavy, latency-sensitive retrieval (every chat turn does ANN) —
--     HNSW gives higher recall at lower query latency.
--   • No representative training set required (IVFFlat wants data present to
--     pick good lists; a fresh tenant has none).
--   Trade-off accepted: higher build cost + memory than IVFFlat.
--   Operator: vector_cosine_ops — Qwen3 embeddings are normalized and ranked
--   by cosine similarity.
--
-- Tenant scoping == user_id (auth.users), same grounding as 052. RLS mirrors
-- 049_embeddable_widgets (owner reads own; service role manages).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ─── KB Sources (ingestion unit; one doc/url/manual entry) ───────────────────
-- The indexing lifecycle lives here (mirrors agent_template_knowledge_bases,
-- which tracks indexing_status at the KB level, not per chunk). Citation
-- metadata (title/url) is authoritative here and denormalized onto chunks for
-- zero-join citation at retrieval time.

CREATE TABLE IF NOT EXISTS kb_sources (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,     -- tenant
    deployment_id   UUID REFERENCES widget_deployments(id) ON DELETE CASCADE,      -- agent scope (nullable = tenant-shared KB)

    source_type     TEXT NOT NULL CHECK (source_type IN (
        'document', 'url', 'sitemap', 'manual', 'structured'
    )),
    title           TEXT NOT NULL,          -- citation display title
    source_url      TEXT,                   -- citation link (for 'url'/'sitemap')
    file_path       TEXT,                   -- Supabase Storage path (for 'document')
    mime_type       TEXT,
    checksum        TEXT,                   -- content hash for freshness / dedupe

    embedding_model TEXT NOT NULL DEFAULT 'Qwen3-Embedding-0.6B',
    embedding_dim   INT NOT NULL DEFAULT 1024 CHECK (embedding_dim = 1024),

    indexing_status TEXT NOT NULL DEFAULT 'pending' CHECK (indexing_status IN (
        'pending', 'indexing', 'indexed', 'failed', 'degraded'
    )),
    indexing_error  TEXT,                   -- set when status = 'failed'/'degraded'
    total_chunks    INT NOT NULL DEFAULT 0,
    last_indexed_at TIMESTAMPTZ,

    is_active       BOOLEAN NOT NULL DEFAULT true,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kb_sources_tenant
    ON kb_sources (user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_kb_sources_deployment
    ON kb_sources (deployment_id)
    WHERE deployment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kb_sources_status
    ON kb_sources (indexing_status);

-- ─── KB Chunks (retrievable units w/ 1024-dim embedding) ─────────────────────
-- The web-RAG search surface. user_id + deployment_id denormalized from the
-- parent source so retrieval pre-filters by tenant/agent WITHOUT a join, and
-- so RLS is enforceable directly on this table.

CREATE TABLE IF NOT EXISTS kb_chunks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id       UUID NOT NULL REFERENCES kb_sources(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,     -- tenant (denormalized)
    deployment_id   UUID REFERENCES widget_deployments(id) ON DELETE CASCADE,      -- agent (denormalized)

    chunk_index     INT NOT NULL,           -- position within source
    content         TEXT NOT NULL,
    token_count     INT,
    embedding       vector(1024) NOT NULL,  -- Qwen3 1024-dim; NOT NULL = fail loud on unembedded insert

    -- Denormalized citation metadata (source of truth is kb_sources)
    source_title    TEXT NOT NULL,
    source_url      TEXT,

    -- Full-text vector for hybrid FTS + vector RRF (plan Pillar A)
    content_tsv     tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,

    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT kb_chunks_source_chunk_unique UNIQUE (source_id, chunk_index)
);

-- Pre-filter scoping (tenant/agent) — lets the planner narrow before/around ANN
CREATE INDEX IF NOT EXISTS idx_kb_chunks_scope
    ON kb_chunks (deployment_id, source_id);
CREATE INDEX IF NOT EXISTS idx_kb_chunks_tenant
    ON kb_chunks (user_id);
-- Approximate nearest-neighbour (cosine) over the embedding
CREATE INDEX IF NOT EXISTS idx_kb_chunks_embedding_hnsw
    ON kb_chunks USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
-- Keyword half of hybrid retrieval
CREATE INDEX IF NOT EXISTS idx_kb_chunks_tsv
    ON kb_chunks USING gin (content_tsv);

-- ─── End-User Memories (long-term + semantic, ported from desktop) ───────────
-- Per end-user, tenant-scoped memory. `embedding` is nullable because working
-- memory need not be embedded; semantic/episodic memory is embedded for recall.
-- importance + last_accessed_at + access_count + decay_rate drive the desktop
-- decay/reinforcement model. expires_at gives working memory a hard TTL.

CREATE TABLE IF NOT EXISTS end_user_memories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,     -- tenant
    end_user_id     UUID NOT NULL REFERENCES end_users(id) ON DELETE CASCADE,
    deployment_id   UUID REFERENCES widget_deployments(id) ON DELETE CASCADE,      -- agent scope (nullable = cross-agent tenant memory)
    conversation_id UUID REFERENCES channel_conversations(id) ON DELETE SET NULL,  -- origin thread

    kind            TEXT NOT NULL CHECK (kind IN ('working', 'episodic', 'semantic')),
    content         TEXT NOT NULL,
    embedding       vector(1024),           -- nullable: working memory may be unembedded

    importance      REAL NOT NULL DEFAULT 0.5 CHECK (importance >= 0.0 AND importance <= 1.0),
    decay_rate      REAL NOT NULL DEFAULT 0.0 CHECK (decay_rate >= 0.0),
    access_count    INT NOT NULL DEFAULT 0 CHECK (access_count >= 0),
    last_accessed_at TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,            -- hard TTL for working memory

    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Fail loud: semantic/episodic memory must carry an embedding to be recallable
    CONSTRAINT end_user_memories_embedding_required
        CHECK (kind = 'working' OR embedding IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_eu_memories_lookup
    ON end_user_memories (user_id, end_user_id, kind);
CREATE INDEX IF NOT EXISTS idx_eu_memories_ranked
    ON end_user_memories (end_user_id, importance DESC, last_accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_eu_memories_expiry
    ON end_user_memories (expires_at)
    WHERE expires_at IS NOT NULL;
-- Semantic recall ANN (only embedded rows)
CREATE INDEX IF NOT EXISTS idx_eu_memories_embedding_hnsw
    ON end_user_memories USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- ─── updated_at triggers (update_updated_at_column defined in 052) ────────────

DROP TRIGGER IF EXISTS trigger_kb_sources_updated_at ON kb_sources;
CREATE TRIGGER trigger_kb_sources_updated_at
    BEFORE UPDATE ON kb_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_eu_memories_updated_at ON end_user_memories;
CREATE TRIGGER trigger_eu_memories_updated_at
    BEFORE UPDATE ON end_user_memories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Row Level Security (mirrors 049_embeddable_widgets) ─────────────────────

ALTER TABLE kb_sources         ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_chunks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE end_user_memories  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kb_sources_owner_read" ON kb_sources;
CREATE POLICY "kb_sources_owner_read" ON kb_sources
    FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "kb_sources_service" ON kb_sources;
CREATE POLICY "kb_sources_service" ON kb_sources
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "kb_chunks_owner_read" ON kb_chunks;
CREATE POLICY "kb_chunks_owner_read" ON kb_chunks
    FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "kb_chunks_service" ON kb_chunks;
CREATE POLICY "kb_chunks_service" ON kb_chunks
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "eu_memories_owner_read" ON end_user_memories;
CREATE POLICY "eu_memories_owner_read" ON end_user_memories
    FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "eu_memories_service" ON end_user_memories;
CREATE POLICY "eu_memories_service" ON end_user_memories
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ─── Comments ────────────────────────────────────────────────────────────────

COMMENT ON TABLE kb_sources IS 'Web-RAG ingestion unit (doc/url/sitemap/manual). Holds indexing lifecycle + authoritative citation metadata. Tenant = user_id; agent scope = deployment_id.';
COMMENT ON TABLE kb_chunks IS 'Retrievable RAG chunks with 1024-dim Qwen3 embeddings + HNSW cosine index + FTS tsvector for hybrid retrieval. user_id/deployment_id denormalized for pre-filter + RLS.';
COMMENT ON TABLE end_user_memories IS 'Per end-user, tenant-scoped memory (working/episodic/semantic) ported from desktop. importance/decay/last_accessed drive reinforcement; expires_at TTLs working memory.';
COMMENT ON COLUMN kb_chunks.embedding IS 'vector(1024) — Qwen3-Embedding-0.6B. NOT NULL: an unembedded chunk is a misconfig and must fail loud.';
COMMENT ON COLUMN end_user_memories.embedding IS 'vector(1024) — nullable only for working memory; enforced non-null for semantic/episodic via CHECK.';
