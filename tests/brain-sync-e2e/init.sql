-- Disposable, local-only prerequisite shim.  It models only the Supabase
-- objects referenced by migration 055; it is never used by production.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA auth;
CREATE TABLE auth.users (id UUID PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$ SELECT NULL::UUID $$;
CREATE FUNCTION auth.role() RETURNS TEXT LANGUAGE sql STABLE AS $$ SELECT 'service_role'::TEXT $$;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Real-enough kb_sources / kb_chunks mirroring migration 053 (the columns the
-- synced-KB apply + match_kb_chunks retrieval touch). deployment_id is a plain
-- UUID here (no widget_deployments in this hermetic shim). RLS is not enabled;
-- the shimmed auth.role() returns 'service_role'.
CREATE TABLE kb_sources (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    deployment_id   UUID,
    source_type     TEXT NOT NULL CHECK (source_type IN ('document','url','sitemap','manual','structured')),
    title           TEXT NOT NULL,
    source_url      TEXT,
    file_path       TEXT,
    mime_type       TEXT,
    checksum        TEXT,
    embedding_model TEXT NOT NULL DEFAULT 'Qwen3-Embedding-0.6B',
    embedding_dim   INT NOT NULL DEFAULT 1024 CHECK (embedding_dim = 1024),
    indexing_status TEXT NOT NULL DEFAULT 'pending' CHECK (indexing_status IN ('pending','indexing','indexed','failed','degraded')),
    indexing_error  TEXT,
    total_chunks    INT NOT NULL DEFAULT 0,
    last_indexed_at TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE kb_chunks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id       UUID NOT NULL REFERENCES kb_sources(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL,
    deployment_id   UUID,
    chunk_index     INT NOT NULL,
    content         TEXT NOT NULL,
    token_count     INT,
    embedding       vector(1024) NOT NULL,
    source_title    TEXT NOT NULL,
    source_url      TEXT,
    content_tsv     tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT kb_chunks_source_chunk_unique UNIQUE (source_id, chunk_index)
);
CREATE INDEX idx_kb_chunks_tsv ON kb_chunks USING gin (content_tsv);
CREATE TABLE brain_sync_e2e_anchor_audit (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mutation_id TEXT NOT NULL,
    mode TEXT NOT NULL,
    network_invoked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
