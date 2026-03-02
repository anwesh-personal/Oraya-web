-- ===================================================================================
-- Migration: 032_cloud_local_models.sql
-- Description: Creates the cloud_local_models table for dynamic local model fetching
--              in the Oraya Desktop client, and seeds it with top models.
-- ===================================================================================

CREATE TABLE IF NOT EXISTS public.cloud_local_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    family TEXT NOT NULL,
    hf_repo_id TEXT NOT NULL,
    hf_filename TEXT NOT NULL,
    file_size_gb NUMERIC NOT NULL,
    quantization TEXT NOT NULL,
    ram_required_gb NUMERIC NOT NULL,
    context_length INTEGER NOT NULL DEFAULT 8192,
    parameters_billions NUMERIC NOT NULL,
    category TEXT DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE public.cloud_local_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active cloud local models"
    ON public.cloud_local_models
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "Only superadmins can manage cloud local models"
    ON public.cloud_local_models
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.platform_admins s
            WHERE s.email = auth.jwt() ->> 'email' 
            AND s.role = 'superadmin'
            AND s.is_active = true
        )
    );

-- Seed Data (Production-ready local models)
INSERT INTO public.cloud_local_models (
    name, description, family, hf_repo_id, hf_filename, file_size_gb, quantization, ram_required_gb, context_length, parameters_billions, category, tags, sort_order
) VALUES
(
    'Meta Llama 3 (8B)',
    'The absolute gold standard for local operation. Exceptional reasoning, conversational coherence, and general task execution. Best for daily autonomous flows.',
    'llama3',
    'bartowski/Meta-Llama-3-8B-Instruct-GGUF',
    'Meta-Llama-3-8B-Instruct-Q4_K_M.gguf',
    4.9,
    'Q4_K_M',
    8,
    8192,
    8.0,
    'general',
    ARRAY['reasoning', 'chat', 'versatile'],
    10
),
(
    'Microsoft Phi-3 Mini',
    'Lightning fast and incredibly small (3.8B). Trained on ultra-high-quality data by Microsoft. Perfect for background tasks, summarization, or older Macs with less RAM.',
    'phi3',
    'bartowski/Phi-3-mini-4k-instruct-GGUF',
    'Phi-3-mini-4k-instruct-Q4_K_M.gguf',
    2.4,
    'Q4_K_M',
    4,
    4096,
    3.8,
    'general',
    ARRAY['fast', 'lightweight', 'edge'],
    20
),
(
    'Mistral NeMo (12B)',
    'A powerhouse joint venture between Mistral and Nvidia. Boasts an incredible 128k context window, allowing you to feed it massive documents or entire codebases offline.',
    'mistral',
    'bartowski/Mistral-Nemo-Instruct-2407-GGUF',
    'Mistral-Nemo-Instruct-2407-Q4_K_M.gguf',
    7.1,
    'Q4_K_M',
    12,
    128000,
    12.0,
    'reasoning',
    ARRAY['long-context', 'nvidia', 'advanced'],
    30
),
(
    'Qwen 2.5 Coder (7B)',
    'The reigning champion of small code models. Achieves GPT-4 level coding performance on many benchmarks while running entirely offline. Essential for software engineering agents.',
    'qwen',
    'Qwen/Qwen2.5-Coder-7B-Instruct-GGUF',
    'qwen2.5-coder-7b-instruct-q4_k_m.gguf',
    4.5,
    'Q4_K_M',
    8,
    32768,
    7.0,
    'coding',
    ARRAY['coding', 'development', 'specialist'],
    40
),
(
    'DeepSeek R1 Distill (8B)',
    'A distilled model of the famous DeepSeek R1 reinforcement learning model. Employs advanced internal reasoning chains before answering. Great for complex logic puzzles.',
    'deepseek',
    'bartowski/DeepSeek-R1-Distill-Llama-8B-GGUF',
    'DeepSeek-R1-Distill-Llama-8B-Q4_K_M.gguf',
    4.9,
    'Q4_K_M',
    8,
    8192,
    8.0,
    'reasoning',
    ARRAY['reasoning', 'math', 'distilled'],
    50
),
(
    'Gemma 2 (9B)',
    'Built by Google DeepMind. Punches far above its weight class (comparable to 27B models). Distinct architectural design making it surprisingly creative and accurate.',
    'gemma',
    'bartowski/gemma-2-9b-it-GGUF',
    'gemma-2-9b-it-Q4_K_M.gguf',
    5.4,
    'Q4_K_M',
    10,
    8192,
    9.0,
    'general',
    ARRAY['google', 'creative', 'heavy-hitter'],
    60
);
