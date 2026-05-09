-- ============================================================================
-- SQL Snippet: Create Sovereign Master Engine & Assign to User
-- Run this in your Supabase SQL Editor.
-- IMPORTANT: Replace 'YOUR_USER_ID_HERE' with your actual auth.users ID.
-- ============================================================================

DO $$
DECLARE
    v_engine_id UUID;
    v_target_user_id TEXT := 'YOUR_USER_ID_HERE'; -- <== CHANGE THIS
BEGIN
    -- 1. Create the Master Engine (upsert so re-runs don't fail)
    INSERT INTO master_engines (name, description, status)
    VALUES (
        'Oraya Dedicated Engine',
        'Sovereign multi-modal inference bundle running on EdgeXpert GB10 hardware. Gateway: http://192.168.1.127:3000',
        'active'
    )
    ON CONFLICT (name) DO UPDATE SET status = 'active'
    RETURNING id INTO v_engine_id;

    -- 2. Bind the 5 Oraya models to this engine
    -- LLM (Spark)
    INSERT INTO engine_provider_slots (engine_id, managed_key_id, category, selected_model, priority)
    SELECT v_engine_id, id, 'llm', 'oraya-spark', 0
    FROM managed_ai_keys WHERE provider = 'oraya' AND key_name = 'Oraya Spark' LIMIT 1
    ON CONFLICT (engine_id, category, priority) DO NOTHING;

    -- LLM (Core - Deep Reasoning)
    INSERT INTO engine_provider_slots (engine_id, managed_key_id, category, selected_model, priority)
    SELECT v_engine_id, id, 'llm', 'oraya-core', 1
    FROM managed_ai_keys WHERE provider = 'oraya' AND key_name = 'Oraya Core' LIMIT 1
    ON CONFLICT (engine_id, category, priority) DO NOTHING;

    -- Research / Vision (Iris)
    INSERT INTO engine_provider_slots (engine_id, managed_key_id, category, selected_model, priority)
    SELECT v_engine_id, id, 'research', 'oraya-iris', 0
    FROM managed_ai_keys WHERE provider = 'oraya' AND key_name = 'Oraya Iris' LIMIT 1
    ON CONFLICT (engine_id, category, priority) DO NOTHING;

    -- Image (Canvas)
    INSERT INTO engine_provider_slots (engine_id, managed_key_id, category, selected_model, priority)
    SELECT v_engine_id, id, 'image', 'oraya-canvas', 0
    FROM managed_ai_keys WHERE provider = 'oraya' AND key_name = 'Oraya Canvas' LIMIT 1
    ON CONFLICT (engine_id, category, priority) DO NOTHING;

    -- Audio (Ears)
    INSERT INTO engine_provider_slots (engine_id, managed_key_id, category, selected_model, priority)
    SELECT v_engine_id, id, 'audio', 'oraya-ears', 0
    FROM managed_ai_keys WHERE provider = 'oraya' AND key_name = 'Oraya Ears' LIMIT 1
    ON CONFLICT (engine_id, category, priority) DO NOTHING;

    -- 3. Deploy the engine to your user account
    -- (This triggers the desktop sync to auto-provision it)
    IF v_target_user_id != 'YOUR_USER_ID_HERE' THEN
        INSERT INTO engine_deployments (master_engine_id, target_type, target_id, status)
        VALUES (v_engine_id, 'user', v_target_user_id, 'active')
        ON CONFLICT (target_type, target_id) 
        DO UPDATE SET master_engine_id = EXCLUDED.master_engine_id, status = 'active';
    END IF;

END $$;
