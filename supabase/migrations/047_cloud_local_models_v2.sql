-- Migration: 047_cloud_local_models_v2.sql
-- Description: Updates the cloud_local_models table with new user requested models
--              and witty TL;DR descriptions.

TRUNCATE TABLE public.cloud_local_models;

INSERT INTO public.cloud_local_models (
    name, description, family, hf_repo_id, hf_filename, file_size_gb, quantization, ram_required_gb, context_length, parameters_billions, category, tags, sort_order
) VALUES
(
    'Meta Llama 3.1 (8B)',
    'The absolute gold standard for local operation. Exceptional reasoning, conversational coherence, and general task execution.

TL;DR: The reliable workhorse. If you aren''t sure what to use, pick this. It won''t disappoint.',
    'llama3',
    'bartowski/Meta-Llama-3.1-8B-Instruct-GGUF',
    'Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf',
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
    'Lightning fast and incredibly small (3.8B). Trained on ultra-high-quality data by Microsoft. Perfect for background tasks, summarization, or older Macs with less RAM.

TL;DR: The tiny speedster. Doesn''t need a supercomputer to run blazing fast.',
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
    'A powerhouse joint venture between Mistral and Nvidia. Boasts an incredible 128k context window, allowing you to feed it massive documents or entire codebases offline.

TL;DR: The heavy reader. Give it a whole book or codebase to read at once.',
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
    'The reigning champion of small code models. Achieves GPT-4 level coding performance on many benchmarks while running entirely offline.

TL;DR: The coding prodigy. GPT-4 level code skills squeezed into a tiny package that lives in your laptop.',
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
    'Gemma 2 (9B)',
    'Built by Google DeepMind. Punches far above its weight class (comparable to 27B models). Distinct architectural design making it surprisingly creative and accurate.

TL;DR: The Google heavyweight. Highly creative and punches way above its weight.',
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
    50
),
(
    'DeepSeek R1 Distill (8B)',
    'A distilled model of the famous DeepSeek R1 reinforcement learning model. Employs advanced internal reasoning chains before answering.

TL;DR: The math nerd. Likes to "think" for 10 seconds before talking. Great for logic puzzles.',
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
    60
),
(
    'Kimi K2.5 (8B Vision)',
    'An extremely advanced multimodal model powering the Chinese Kimi platform. Features natively embedded vision understanding alongside text.

TL;DR: The guy that reads pictures. Perfect if you need your agent to literally look at your screen.',
    'kimi',
    'unsloth/Kimi-K2.5-GGUF',
    'Kimi-K2.5-8B-Q4_K_M.gguf',
    5.1,
    'Q4_K_M',
    8,
    8192,
    8.0,
    'multimodal',
    ARRAY['vision', 'chinese', 'versatile'],
    70
),
(
    'MiniMax M2.5 (14B MoE)',
    'A highly capable Mixture of Experts (MoE) architectured model excelling at complex coding, tool use, and office work flows.

TL;DR: The quiet overachiever. Fast on its feet, great with tools, and uses surprisingly little memory for its brain size.',
    'minimax',
    'unsloth/MiniMax-M2.5-GGUF',
    'MiniMax-M2.5-14B-Q4_K_M.gguf',
    8.6,
    'Q4_K_M',
    12,
    16384,
    14.0,
    'general',
    ARRAY['moe', 'tools', 'efficient'],
    80
),
(
    'KAT-Coder-Pro-V1 (32B)',
    'A hardcore agentic software engineering model tailored for serious multi-step operations and high-end enterprise workflows.

TL;DR: The heavyweight IDE master. Only download this if your Mac is jacked (24GB+ RAM).',
    'kat',
    'Kwaipilot/KAT-Dev-32B-GGUF',
    'KAT-Dev-32B-Q4_K_M.gguf',
    19.5,
    'Q4_K_M',
    24,
    16384,
    32.0,
    'coding',
    ARRAY['coding', 'heavy-hitter', 'enterprise'],
    90
);
