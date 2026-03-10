-- ============================================================================
-- SQL Schema for Master Engines System
-- ============================================================================

-- 1. master_engines table
-- Represents a bundle of provider configurations created by the Superadmin
CREATE TABLE IF NOT EXISTS public.master_engines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. engine_provider_slots table
-- Links a master engine to a specific managed key and defines its role/priority
CREATE TABLE IF NOT EXISTS public.engine_provider_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engine_id UUID NOT NULL REFERENCES public.master_engines(id) ON DELETE CASCADE,
    managed_key_id UUID NOT NULL REFERENCES public.managed_ai_keys(id) ON DELETE RESTRICT,
    category TEXT NOT NULL CHECK (category IN ('llm', 'image', 'audio', 'video', 'research')),
    selected_model TEXT, -- The default model if applicable (e.g., 'gpt-4o')
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    priority INTEGER NOT NULL DEFAULT 0, -- Lower number = higher priority (0 is primary)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure priority is unique per category per engine to avoid ambiguity
    UNIQUE(engine_id, category, priority)
);

-- Index for fast lookup when deploying engines
CREATE INDEX IF NOT EXISTS idx_engine_slots_engine_id ON public.engine_provider_slots(engine_id);

-- 3. engine_deployments table
-- Tracks which engine is assigned to which plan or user
CREATE TABLE IF NOT EXISTS public.engine_deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_engine_id UUID NOT NULL REFERENCES public.master_engines(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('plan', 'user')),
    target_id TEXT NOT NULL, -- Either a Stripe plan ID or a User ID
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- A user/plan can only have one active deployment of a specific target
    UNIQUE(target_type, target_id)
);

-- Index for checking active deployments quickly
CREATE INDEX IF NOT EXISTS idx_engine_deployments_target ON public.engine_deployments(target_type, target_id) WHERE status = 'active';

-- Add RLS Policies (Ensure only service role / superadmin can access these tables)
ALTER TABLE public.master_engines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engine_provider_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engine_deployments ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS by default, but we can explicitly add a policy if needed or just leave it for service_role only.
CREATE POLICY "Allow service role access to master_engines" ON public.master_engines FOR ALL USING (true);
CREATE POLICY "Allow service role access to engine_provider_slots" ON public.engine_provider_slots FOR ALL USING (true);
CREATE POLICY "Allow service role access to engine_deployments" ON public.engine_deployments FOR ALL USING (true);
