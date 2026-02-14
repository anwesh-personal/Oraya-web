-- Migration: 006_managed_ai_service.sql
-- Purpose: Managed AI keys, user preferences, AI usage tracking
-- Date: 2026-01-21

-- =============================================================================
-- MANAGED AI KEYS (Internal - Oraya's API keys)
-- =============================================================================

CREATE TABLE managed_ai_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Provider
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'mistral', 'perplexity')),
  key_name TEXT NOT NULL,
  api_key TEXT NOT NULL,
  encrypted_key TEXT,
  
  -- Limits & Status
  is_active BOOLEAN DEFAULT TRUE,
  daily_budget_usd DECIMAL(10,2),
  monthly_budget_usd DECIMAL(10,2),
  current_daily_spend_usd DECIMAL(10,2) DEFAULT 0,
  current_monthly_spend_usd DECIMAL(10,2) DEFAULT 0,
  spend_reset_at TIMESTAMP,
  
  -- Rate limiting
  max_requests_per_minute INTEGER DEFAULT 60,
  max_concurrent_requests INTEGER DEFAULT 10,
  
  -- Load balancing
  weight INTEGER DEFAULT 1,
  priority INTEGER DEFAULT 0,
  
  -- Health monitoring
  is_healthy BOOLEAN DEFAULT TRUE,
  last_error TEXT,
  error_count INTEGER DEFAULT 0,
  last_error_at TIMESTAMP,
  
  -- Metadata
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  
  UNIQUE(provider, key_name)
);

CREATE INDEX idx_managed_ai_keys_provider ON managed_ai_keys(provider);
CREATE INDEX idx_managed_ai_keys_active ON managed_ai_keys(is_active, is_healthy);
CREATE INDEX idx_managed_ai_keys_priority ON managed_ai_keys(provider, priority DESC, weight DESC);

COMMENT ON TABLE managed_ai_keys IS 'Oraya platform AI keys for managed service';

-- =============================================================================
-- AI USAGE LOGS
-- =============================================================================

CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  license_id UUID REFERENCES user_licenses(id) ON DELETE SET NULL,
  managed_key_id UUID REFERENCES managed_ai_keys(id) ON DELETE SET NULL,
  
  -- Request details
  model TEXT NOT NULL,
  provider TEXT NOT NULL,
  request_type TEXT DEFAULT 'chat' CHECK (request_type IN ('chat', 'completion', 'embedding', 'image', 'audio')),
  
  -- Token usage
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  
  -- Cost
  cost_usd DECIMAL(10,6),
  tokens_deducted BIGINT DEFAULT 0,
  
  -- Performance
  latency_ms INTEGER,
  response_time_ms INTEGER,
  
  -- Status
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'error', 'timeout', 'rate_limited')),
  error_message TEXT,
  error_code TEXT,
  
  -- Context
  device_id TEXT,
  agent_id TEXT,
  conversation_id UUID,
  message_id UUID,
  
  -- Metadata
  request_id TEXT,
  ip_address INET,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Partition by month for performance
CREATE INDEX idx_ai_usage_user_date ON ai_usage_logs(user_id, created_at DESC);
CREATE INDEX idx_ai_usage_license_date ON ai_usage_logs(license_id, created_at DESC);
CREATE INDEX idx_ai_usage_key_date ON ai_usage_logs(managed_key_id, created_at DESC);
CREATE INDEX idx_ai_usage_status ON ai_usage_logs(status);
CREATE INDEX idx_ai_usage_provider_model ON ai_usage_logs(provider, model);

COMMENT ON TABLE ai_usage_logs IS 'Detailed AI API usage tracking';

-- =============================================================================
-- USER AI PREFERENCES
-- =============================================================================

CREATE TABLE user_ai_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Model preferences
  default_model TEXT DEFAULT 'gpt-4o',
  default_provider TEXT DEFAULT 'openai',
  fallback_model TEXT,
  fallback_provider TEXT,
  
  -- Budget controls
  daily_spending_limit_usd DECIMAL(10,2),
  monthly_spending_limit_usd DECIMAL(10,2),
  per_request_limit_usd DECIMAL(10,2),
  
  -- Alerts
  usage_alerts_enabled BOOLEAN DEFAULT TRUE,
  low_balance_alerts_enabled BOOLEAN DEFAULT TRUE,
  high_spend_alerts_enabled BOOLEAN DEFAULT TRUE,
  alert_email TEXT,
  alert_threshold_percentage INTEGER DEFAULT 80,
  
  -- Rate limiting
  max_requests_per_hour INTEGER,
  max_requests_per_day INTEGER,
  
  -- Advanced settings
  temperature DECIMAL(3,2),
  max_tokens INTEGER,
  streaming_enabled BOOLEAN DEFAULT TRUE,
  image_generation_enabled BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_ai_preferences_user ON user_ai_preferences(user_id);

COMMENT ON TABLE user_ai_preferences IS 'User AI service preferences and limits';

-- =============================================================================
-- AI PROVIDER PRICING
-- =============================================================================

CREATE TABLE ai_provider_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Provider/Model
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  
  -- Pricing (per 1M tokens)
  input_price_per_1m DECIMAL(10,4) NOT NULL,
  output_price_per_1m DECIMAL(10,4) NOT NULL,
  image_price_per_1k DECIMAL(10,4),
  
  -- Context limits
  max_context_tokens INTEGER,
  max_output_tokens INTEGER,
  
  -- Features
  supports_streaming BOOLEAN DEFAULT TRUE,
  supports_function_calling BOOLEAN DEFAULT FALSE,
  supports_vision BOOLEAN DEFAULT FALSE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Validity
  effective_from TIMESTAMP DEFAULT NOW(),
  effective_until TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(provider, model, effective_from)
);

CREATE INDEX idx_ai_provider_pricing_active ON ai_provider_pricing(provider, model, is_active);

COMMENT ON TABLE ai_provider_pricing IS 'AI provider pricing for cost calculation';

-- Seed pricing
INSERT INTO ai_provider_pricing (provider, model, input_price_per_1m, output_price_per_1m, max_context_tokens) VALUES
('openai', 'gpt-4o', 2.50, 10.00, 128000),
('openai', 'gpt-4o-mini', 0.15, 0.60, 128000),
('openai', 'gpt-4-turbo', 10.00, 30.00, 128000),
('anthropic', 'claude-3-opus', 15.00, 75.00, 200000),
('anthropic', 'claude-3-sonnet', 3.00, 15.00, 200000),
('anthropic', 'claude-3-haiku', 0.25, 1.25, 200000),
('google', 'gemini-1.5-pro', 1.25, 5.00, 1000000),
('google', 'gemini-1.5-flash', 0.075, 0.30, 1000000);

-- =============================================================================
-- AI USAGE ALERTS
-- =============================================================================

CREATE TABLE ai_usage_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Alert details
  alert_type TEXT NOT NULL CHECK (alert_type IN ('spending_limit', 'low_balance', 'high_usage', 'rate_limit', 'error_rate')),
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  
  -- Threshold
  threshold_value DECIMAL(10,2),
  current_value DECIMAL(10,2),
  
  -- Status
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  
  -- Notifications
  email_sent BOOLEAN DEFAULT FALSE,
  notification_sent BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_alerts_user ON ai_usage_alerts(user_id, created_at DESC);
CREATE INDEX idx_ai_usage_alerts_unresolved ON ai_usage_alerts(user_id, is_resolved) WHERE is_resolved = FALSE;

COMMENT ON TABLE ai_usage_alerts IS 'AI usage alerts and notifications';

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE managed_ai_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_provider_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_alerts ENABLE ROW LEVEL SECURITY;

-- Managed keys: admin only
CREATE POLICY "Admins can manage AI keys" ON managed_ai_keys
  FOR ALL USING (is_platform_admin());

-- Usage logs: self read, system write
CREATE POLICY "Users can view own usage" ON ai_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage logs" ON ai_usage_logs
  FOR INSERT WITH CHECK (TRUE);

-- Preferences: self manage
CREATE POLICY "Users can manage own AI preferences" ON user_ai_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Pricing: public read, admin write
CREATE POLICY "Anyone can view pricing" ON ai_provider_pricing
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage pricing" ON ai_provider_pricing
  FOR ALL USING (is_platform_admin());

-- Alerts: self read
CREATE POLICY "Users can view own alerts" ON ai_usage_alerts
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_managed_ai_keys_updated_at
  BEFORE UPDATE ON managed_ai_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_ai_preferences_updated_at
  BEFORE UPDATE ON user_ai_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create AI preferences on user signup
CREATE OR REPLACE FUNCTION create_ai_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_ai_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_ai_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_ai_preferences();

-- Update key stats on usage
CREATE OR REPLACE FUNCTION update_key_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.managed_key_id IS NOT NULL THEN
    UPDATE managed_ai_keys
    SET 
      last_used_at = NEW.created_at,
      current_daily_spend_usd = current_daily_spend_usd + COALESCE(NEW.cost_usd, 0),
      current_monthly_spend_usd = current_monthly_spend_usd + COALESCE(NEW.cost_usd, 0),
      error_count = CASE WHEN NEW.status = 'error' THEN error_count + 1 ELSE error_count END,
      last_error = CASE WHEN NEW.status = 'error' THEN NEW.error_message ELSE last_error END,
      last_error_at = CASE WHEN NEW.status = 'error' THEN NEW.created_at ELSE last_error_at END,
      is_healthy = CASE WHEN error_count > 10 THEN FALSE ELSE is_healthy END
    WHERE id = NEW.managed_key_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_key_stats
  AFTER INSERT ON ai_usage_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_key_stats();
