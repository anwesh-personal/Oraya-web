-- ============================================================================
-- Migration: 048_oraya_sovereign_provider.sql
-- Purpose: Register Oraya as a first-class AI provider and seed the 5
--          sovereign on-premise inference models for GB10 deployment.
-- Date: 2026-04-29
-- Author: Antigravity AI + Anwesh Rath
-- ============================================================================

-- 1. Expand the managed_ai_keys provider constraint to include 'oraya'
ALTER TABLE managed_ai_keys
  DROP CONSTRAINT IF EXISTS managed_ai_keys_provider_check;

ALTER TABLE managed_ai_keys
  ADD CONSTRAINT managed_ai_keys_provider_check
  CHECK (provider IN ('openai', 'anthropic', 'google', 'mistral', 'perplexity', 'oraya'));

-- 2. Seed the 5 Oraya sovereign inference models
--    These are on-premise llama-server / ComfyUI / Whisper instances
--    running on EdgeXpert GB10 hardware.

-- Spark — Fast LLM (Qwen 2.5 7B, llama-server :8000)
INSERT INTO managed_ai_keys (
  provider, key_name, api_key, is_active,
  max_requests_per_minute, max_concurrent_requests,
  weight, priority, notes, tags
) VALUES (
  'oraya', 'Oraya Spark', 'sovereign-local', TRUE,
  60, 10, 1, 0,
  'Qwen 2.5 7B Instruct — fast inference for routine tasks, chat, and agent orchestration. Runs on GB10 via llama-server at port 8000.',
  ARRAY['sovereign', 'llm', 'fast', 'gb10']
) ON CONFLICT (provider, key_name) DO NOTHING;

-- Core — Deep Reasoning LLM (Qwen 2.5 14B, llama-server :8001)
INSERT INTO managed_ai_keys (
  provider, key_name, api_key, is_active,
  max_requests_per_minute, max_concurrent_requests,
  weight, priority, notes, tags
) VALUES (
  'oraya', 'Oraya Core', 'sovereign-local', TRUE,
  30, 5, 1, 1,
  'Qwen 2.5 14B Instruct — deep reasoning, complex analysis, and high-fidelity generation. Runs on GB10 via llama-server at port 8001.',
  ARRAY['sovereign', 'llm', 'deep', 'gb10']
) ON CONFLICT (provider, key_name) DO NOTHING;

-- Iris — Vision & Research (LLaVA / Qwen-VL, llama-server :8002)
INSERT INTO managed_ai_keys (
  provider, key_name, api_key, is_active,
  max_requests_per_minute, max_concurrent_requests,
  weight, priority, notes, tags
) VALUES (
  'oraya', 'Oraya Iris', 'sovereign-local', TRUE,
  20, 3, 1, 0,
  'Vision-language model for image understanding, document analysis, and visual research. Runs on GB10 via llama-server at port 8002.',
  ARRAY['sovereign', 'vision', 'research', 'gb10']
) ON CONFLICT (provider, key_name) DO NOTHING;

-- Canvas — Image Generation (SDXL / RealVisXL, ComfyUI :8003)
INSERT INTO managed_ai_keys (
  provider, key_name, api_key, is_active,
  max_requests_per_minute, max_concurrent_requests,
  weight, priority, notes, tags
) VALUES (
  'oraya', 'Oraya Canvas', 'sovereign-local', TRUE,
  10, 2, 1, 0,
  'Stable Diffusion XL / RealVisXL for high-fidelity image generation. Runs on GB10 via ComfyUI at port 8003.',
  ARRAY['sovereign', 'image', 'generation', 'gb10']
) ON CONFLICT (provider, key_name) DO NOTHING;

-- Ears — Speech-to-Text (Whisper Large v3, :8004)
INSERT INTO managed_ai_keys (
  provider, key_name, api_key, is_active,
  max_requests_per_minute, max_concurrent_requests,
  weight, priority, notes, tags
) VALUES (
  'oraya', 'Oraya Ears', 'sovereign-local', TRUE,
  15, 3, 1, 0,
  'OpenAI Whisper Large v3 Turbo for real-time speech transcription and voice command processing. Runs on GB10 at port 8004.',
  ARRAY['sovereign', 'audio', 'stt', 'gb10']
) ON CONFLICT (provider, key_name) DO NOTHING;

-- 3. Also add 'oraya' to the ai_provider_pricing table for token cost calculation
INSERT INTO ai_provider_pricing (
  provider, model, input_price_per_1m, output_price_per_1m, max_context_tokens
) VALUES
  ('oraya', 'oraya-spark', 0.50, 1.50, 32768),
  ('oraya', 'oraya-core', 1.00, 3.00, 32768),
  ('oraya', 'oraya-iris', 1.50, 4.00, 8192),
  ('oraya', 'oraya-canvas', 0.00, 0.00, NULL),
  ('oraya', 'oraya-ears', 0.00, 0.00, NULL)
ON CONFLICT (provider, model, effective_from) DO NOTHING;
