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
-- Migration: 007_teams_collaboration.sql
-- Purpose: Team accounts, members, permissions, shared resources
-- Date: 2026-01-21

-- =============================================================================
-- TEAMS
-- =============================================================================

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  avatar_url TEXT,
  
  -- Ownership
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT REFERENCES plans(id),
  
  -- Limits
  max_members INTEGER DEFAULT 5,
  max_agents INTEGER DEFAULT 10,
  max_shared_conversations INTEGER DEFAULT 100,
  
  -- Billing
  billing_email TEXT,
  billing_user_id UUID REFERENCES auth.users(id),
  
  -- Settings
  settings JSONB DEFAULT '{}',
  
  -- Features
  shared_token_pool BOOLEAN DEFAULT FALSE,
  shared_ai_keys BOOLEAN DEFAULT FALSE,
  member_can_invite BOOLEAN DEFAULT FALSE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  suspended_at TIMESTAMP,
  suspension_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_teams_owner ON teams(owner_id);
CREATE INDEX idx_teams_slug ON teams(slug);
CREATE INDEX idx_teams_active ON teams(is_active);

COMMENT ON TABLE teams IS 'Team accounts for collaboration';

-- =============================================================================
-- TEAM MEMBERS
-- =============================================================================

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Role
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'guest')),
  
  -- Permissions
  can_manage_members BOOLEAN DEFAULT FALSE,
  can_manage_billing BOOLEAN DEFAULT FALSE,
  can_create_agents BOOLEAN DEFAULT TRUE,
  can_share_conversations BOOLEAN DEFAULT TRUE,
  can_use_team_tokens BOOLEAN DEFAULT TRUE,
  custom_permissions JSONB DEFAULT '{}',
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('invited', 'active', 'suspended', 'left')),
  
  -- Invitation
  invited_by UUID REFERENCES auth.users(id),
  invitation_token TEXT UNIQUE,
  invitation_sent_at TIMESTAMP,
  invitation_accepted_at TIMESTAMP,
  invitation_expires_at TIMESTAMP,
  
  -- Activity
  last_active_at TIMESTAMP,
  
  -- Timestamps
  joined_at TIMESTAMP,
  left_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_role ON team_members(team_id, role);
CREATE INDEX idx_team_members_status ON team_members(status);
CREATE INDEX idx_team_members_invitation ON team_members(invitation_token) WHERE status = 'invited';

COMMENT ON TABLE team_members IS 'Team membership and permissions';

-- =============================================================================
-- TEAM INVITATIONS LOG
-- =============================================================================

CREATE TABLE team_invitation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Status
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'accepted', 'declined', 'expired', 'revoked')),
  
  -- Details
  role TEXT NOT NULL,
  message TEXT,
  
  -- Timestamps
  sent_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX idx_team_invitation_log_team ON team_invitation_log(team_id);
CREATE INDEX idx_team_invitation_log_email ON team_invitation_log(invited_email);

COMMENT ON TABLE team_invitation_log IS 'Team invitation audit trail';

-- =============================================================================
-- TEAM SHARED RESOURCES
-- =============================================================================

CREATE TABLE team_shared_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Agent info (stored locally, this is just metadata)
  agent_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  shared_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Access control
  access_level TEXT DEFAULT 'view' CHECK (access_level IN ('view', 'use', 'edit')),
  allowed_members UUID[] DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  shared_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  
  UNIQUE(team_id, agent_id)
);

CREATE INDEX idx_team_shared_agents_team ON team_shared_agents(team_id);

COMMENT ON TABLE team_shared_agents IS 'Agents shared within team';

-- =============================================================================
-- TEAM TOKEN POOL
-- =============================================================================

CREATE TABLE team_token_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Balance
  token_balance BIGINT DEFAULT 0 CHECK (token_balance >= 0),
  total_purchased BIGINT DEFAULT 0,
  total_used BIGINT DEFAULT 0,
  
  -- Per-member limits
  per_member_daily_limit BIGINT,
  per_member_monthly_limit BIGINT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_purchase_at TIMESTAMP,
  last_usage_at TIMESTAMP
);

CREATE INDEX idx_team_token_pools_team ON team_token_pools(team_id);

COMMENT ON TABLE team_token_pools IS 'Shared token pool for teams';

-- =============================================================================
-- TEAM MEMBER TOKEN USAGE
-- =============================================================================

CREATE TABLE team_member_token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Usage
  tokens_used BIGINT NOT NULL,
  service TEXT NOT NULL,
  
  -- Period tracking
  usage_date DATE DEFAULT CURRENT_DATE,
  
  -- Timestamps
  used_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_team_member_usage_team_user ON team_member_token_usage(team_id, user_id, usage_date);

COMMENT ON TABLE team_member_token_usage IS 'Per-member token usage tracking';

-- =============================================================================
-- TEAM ACTIVITY LOG
-- =============================================================================

CREATE TABLE team_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Activity
  activity_type TEXT NOT NULL,
  activity_description TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_team_activity_team_date ON team_activity_log(team_id, created_at DESC);
CREATE INDEX idx_team_activity_type ON team_activity_log(activity_type);

COMMENT ON TABLE team_activity_log IS 'Team activity audit trail';

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_shared_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_token_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_member_token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_activity_log ENABLE ROW LEVEL SECURITY;

-- Helper: Check if user is team member
CREATE OR REPLACE FUNCTION is_team_member(team_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = team_uuid
    AND user_id = auth.uid()
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Check if user is team admin
CREATE OR REPLACE FUNCTION is_team_admin(team_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = team_uuid
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Teams: Members can view
CREATE POLICY "Team members can view team" ON teams
  FOR SELECT USING (is_team_member(id));

-- Team admins can update
CREATE POLICY "Team admins can update team" ON teams
  FOR UPDATE USING (is_team_admin(id));

-- Members: View team members
CREATE POLICY "Team members can view members" ON team_members
  FOR SELECT USING (is_team_member(team_id));

-- Admins can manage members
CREATE POLICY "Team admins can manage members" ON team_members
  FOR ALL USING (is_team_admin(team_id));

-- Shared agents: Members can view
CREATE POLICY "Team members can view shared agents" ON team_shared_agents
  FOR SELECT USING (is_team_member(team_id));

-- Token pool: Members can view
CREATE POLICY "Team members can view token pool" ON team_token_pools
  FOR SELECT USING (is_team_member(team_id));

-- Activity log: Members can view
CREATE POLICY "Team members can view activity" ON team_activity_log
  FOR SELECT USING (is_team_member(team_id));

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create token pool for team
CREATE OR REPLACE FUNCTION create_team_token_pool()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.shared_token_pool = TRUE THEN
    INSERT INTO team_token_pools (team_id)
    VALUES (NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_team_created_token_pool
  AFTER INSERT ON teams
  FOR EACH ROW
  EXECUTE FUNCTION create_team_token_pool();

-- Generate invitation token
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'invited' AND NEW.invitation_token IS NULL THEN
    NEW.invitation_token := encode(gen_random_bytes(32), 'base64');
    NEW.invitation_expires_at := NOW() + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_team_invitation_token
  BEFORE INSERT ON team_members
  FOR EACH ROW
  WHEN (NEW.status = 'invited')
  EXECUTE FUNCTION generate_invitation_token();

-- Log team activity
CREATE OR REPLACE FUNCTION log_team_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO team_activity_log (team_id, user_id, activity_type, activity_description)
    VALUES (
      NEW.team_id,
      NEW.user_id,
      'member_joined',
      'Member joined the team'
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'left' THEN
    INSERT INTO team_activity_log (team_id, user_id, activity_type, activity_description)
    VALUES (
      NEW.team_id,
      NEW.user_id,
      'member_left',
      'Member left the team'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_member_changes
  AFTER INSERT OR UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION log_team_activity();
-- Migration: 008_analytics_telemetry.sql
-- Purpose: Usage analytics, telemetry, metrics tracking
-- Date: 2026-01-21

-- =============================================================================
-- APP TELEMETRY
-- =============================================================================

CREATE TABLE app_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Event details
  event_type TEXT NOT NULL,
  event_category TEXT,
  event_action TEXT,
  event_label TEXT,
  event_value NUMERIC,
  
  -- Event data
  event_data JSONB DEFAULT '{}',
  
  -- Context
  app_version TEXT,
  platform TEXT,
  platform_version TEXT,
  device_id TEXT,
  session_id TEXT,
  
  -- Location (anonymized)
  country_code TEXT,
  region_code TEXT,
  
  -- Performance
  page_load_time_ms INTEGER,
  memory_usage_mb INTEGER,
  
  -- Privacy
  is_anonymous BOOLEAN DEFAULT FALSE,
  consent_given BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Partition by month for performance
CREATE INDEX idx_app_telemetry_type_date ON app_telemetry(event_type, created_at DESC);
CREATE INDEX idx_app_telemetry_user_date ON app_telemetry(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_app_telemetry_category ON app_telemetry(event_category, created_at DESC);
CREATE INDEX idx_app_telemetry_platform ON app_telemetry(platform, app_version);
CREATE INDEX idx_app_telemetry_session ON app_telemetry(session_id);

COMMENT ON TABLE app_telemetry IS 'Application usage telemetry and analytics';

-- =============================================================================
-- FEATURE USAGE TRACKING
-- =============================================================================

CREATE TABLE feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Feature
  feature_key TEXT NOT NULL,
  feature_category TEXT,
  
  -- Usage
  usage_count INTEGER DEFAULT 1,
  first_used_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP DEFAULT NOW(),
  
  -- Context
  device_id TEXT,
  app_version TEXT,
  
  -- Aggregation period
  period_start DATE DEFAULT CURRENT_DATE,
  period_end DATE DEFAULT CURRENT_DATE,
  
  UNIQUE(user_id, feature_key, period_start)
);

CREATE INDEX idx_feature_usage_user_feature ON feature_usage(user_id, feature_key);
CREATE INDEX idx_feature_usage_feature_date ON feature_usage(feature_key, period_start DESC);

COMMENT ON TABLE feature_usage IS 'Feature usage aggregation per user per day';

-- =============================================================================
-- USER SESSIONS
-- =============================================================================

CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Session details
  session_id TEXT UNIQUE NOT NULL,
  device_id TEXT,
  
  -- Platform
  platform TEXT,
  app_version TEXT,
  
  -- Timing
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  duration_seconds INTEGER,
  
  -- Activity
  events_count INTEGER DEFAULT 0,
  features_used TEXT[] DEFAULT '{}',
  
  -- Network
  ip_address INET,
  user_agent TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_user_sessions_user_date ON user_sessions(user_id, started_at DESC);
CREATE INDEX idx_user_sessions_session ON user_sessions(session_id);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE user_sessions IS 'User session tracking for analytics';

-- =============================================================================
-- ERROR TRACKING
-- =============================================================================

CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Error details
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_code TEXT,
  
  -- Context
  component TEXT,
  function_name TEXT,
  file_path TEXT,
  line_number INTEGER,
  
  -- Environment
  app_version TEXT,
  platform TEXT,
  device_id TEXT,
  session_id TEXT,
  
  -- State
  app_state JSONB,
  user_action TEXT,
  
  -- Occurrence
  count INTEGER DEFAULT 1,
  first_seen_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP DEFAULT NOW(),
  
  -- Resolution
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES platform_admins(id),
  resolution_notes TEXT
);

CREATE INDEX idx_error_logs_type ON error_logs(error_type, last_seen_at DESC);
CREATE INDEX idx_error_logs_user ON error_logs(user_id, last_seen_at DESC);
CREATE INDEX idx_error_logs_unresolved ON error_logs(is_resolved, last_seen_at DESC) WHERE is_resolved = FALSE;
CREATE INDEX idx_error_logs_app_version ON error_logs(app_version, error_type);

COMMENT ON TABLE error_logs IS 'Application error tracking and debugging';

-- =============================================================================
-- PERFORMANCE METRICS
-- =============================================================================

CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Metric
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  
  -- Context
  operation TEXT,
  component TEXT,
  
  -- Environment
  app_version TEXT,
  platform TEXT,
  device_id TEXT,
  
  -- Percentiles (for aggregation)
  p50 NUMERIC,
  p90 NUMERIC,
  p95 NUMERIC,
  p99 NUMERIC,
  
  -- Period
  measured_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_performance_metrics_name_date ON performance_metrics(metric_name, measured_at DESC);
CREATE INDEX idx_performance_metrics_operation ON performance_metrics(operation, measured_at DESC);

COMMENT ON TABLE performance_metrics IS 'Application performance monitoring';

-- =============================================================================
-- USER ENGAGEMENT METRICS
-- =============================================================================

CREATE TABLE user_engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT DEFAULT 'daily' CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  
  -- Engagement
  sessions_count INTEGER DEFAULT 0,
  total_session_duration_seconds INTEGER DEFAULT 0,
  avg_session_duration_seconds INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  ai_calls_made INTEGER DEFAULT 0,
  features_used TEXT[] DEFAULT '{}',
  
  -- Activity
  days_active INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT FALSE,
  
  -- Retention
  days_since_signup INTEGER,
  is_retained BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  calculated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, period_start, period_type)
);

CREATE INDEX idx_user_engagement_user_period ON user_engagement_metrics(user_id, period_start DESC);
CREATE INDEX idx_user_engagement_period ON user_engagement_metrics(period_start DESC, period_type);
CREATE INDEX idx_user_engagement_active ON user_engagement_metrics(period_start, is_active) WHERE is_active = TRUE;

COMMENT ON TABLE user_engagement_metrics IS 'User engagement analytics per period';

-- =============================================================================
-- CONVERSION FUNNELS
-- =============================================================================

CREATE TABLE conversion_funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Funnel
  funnel_name TEXT NOT NULL,
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  
  -- User tracking
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'started' CHECK (status IN ('started', 'completed', 'abandoned')),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timing
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  abandoned_at TIMESTAMP,
  
  UNIQUE(funnel_name, step_order, user_id, session_id)
);

CREATE INDEX idx_conversion_funnels_funnel ON conversion_funnels(funnel_name, step_order);
CREATE INDEX idx_conversion_funnels_user ON conversion_funnels(user_id, funnel_name);
CREATE INDEX idx_conversion_funnels_status ON conversion_funnels(funnel_name, status);

COMMENT ON TABLE conversion_funnels IS 'Conversion funnel tracking (signup, onboarding, etc.)';

-- =============================================================================
-- AB TESTS
-- =============================================================================

CREATE TABLE ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Test
  test_name TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Variants
  control_variant TEXT DEFAULT 'A',
  test_variant TEXT DEFAULT 'B',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Allocation
  traffic_allocation DECIMAL(3,2) DEFAULT 0.50 CHECK (traffic_allocation BETWEEN 0 AND 1),
  
  -- Timing
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  
  -- Results
  winner_variant TEXT,
  confidence_level DECIMAL(3,2),
  
  -- Metadata
  hypothesis TEXT,
  success_metric TEXT,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ab_tests_active ON ab_tests(is_active);

COMMENT ON TABLE ab_tests IS 'A/B test definitions';

-- =============================================================================
-- AB TEST ASSIGNMENTS
-- =============================================================================

CREATE TABLE ab_test_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Assignment
  variant TEXT NOT NULL,
  
  -- Tracking
  conversion_event TEXT,
  converted BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMP,
  
  -- Timestamps
  assigned_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(test_id, user_id)
);

CREATE INDEX idx_ab_test_assignments_test ON ab_test_assignments(test_id, variant);
CREATE INDEX idx_ab_test_assignments_user ON ab_test_assignments(user_id);

COMMENT ON TABLE ab_test_assignments IS 'User assignments to A/B test variants';

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE app_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_assignments ENABLE ROW LEVEL SECURITY;

-- Telemetry: Users can view own, system can insert
CREATE POLICY "Users can view own telemetry" ON app_telemetry
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert telemetry" ON app_telemetry
  FOR INSERT WITH CHECK (TRUE);

-- Feature usage: Self read
CREATE POLICY "Users can view own feature usage" ON feature_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Sessions: Self read
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Error logs: System insert, admins read
CREATE POLICY "System can insert errors" ON error_logs
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admins can view errors" ON error_logs
  FOR SELECT USING (is_platform_admin());

-- Engagement metrics: Self read
CREATE POLICY "Users can view own engagement" ON user_engagement_metrics
  FOR SELECT USING (auth.uid() = user_id);

-- AB tests: Public read active tests
CREATE POLICY "Users can view active AB tests" ON ab_tests
  FOR SELECT USING (is_active = TRUE);

-- AB assignments: Self read
CREATE POLICY "Users can view own AB assignments" ON ab_test_assignments
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage everything
CREATE POLICY "Admins can manage analytics" ON app_telemetry
  FOR ALL USING (is_platform_admin());

CREATE POLICY "Admins can manage AB tests" ON ab_tests
  FOR ALL USING (is_platform_admin());

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_ab_tests_updated_at
  BEFORE UPDATE ON ab_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update session duration on end
CREATE OR REPLACE FUNCTION update_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
    NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INTEGER;
    NEW.is_active := FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_session_duration
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_duration();

-- Increment feature usage count
CREATE OR REPLACE FUNCTION increment_feature_usage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO feature_usage (user_id, feature_key, feature_category, device_id, app_version, period_start)
  VALUES (NEW.user_id, NEW.event_type, NEW.event_category, NEW.device_id, NEW.app_version, CURRENT_DATE)
  ON CONFLICT (user_id, feature_key, period_start)
  DO UPDATE SET
    usage_count = feature_usage.usage_count + 1,
    last_used_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_feature_usage
  AFTER INSERT ON app_telemetry
  FOR EACH ROW
  WHEN (NEW.event_category = 'feature')
  EXECUTE FUNCTION increment_feature_usage();
-- Migration: 009_billing_stripe.sql
-- Purpose: Billing, payments, Stripe integration, invoices, refunds
-- Date: 2026-01-21

-- =============================================================================
-- STRIPE CUSTOMERS
-- =============================================================================

CREATE TABLE stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Stripe IDs
  stripe_customer_id TEXT UNIQUE NOT NULL,
  
  -- Customer details
  email TEXT,
  name TEXT,
  
  -- Payment methods
  default_payment_method_id TEXT,
  payment_methods JSONB DEFAULT '[]',
  
  -- Billing
  currency TEXT DEFAULT 'USD',
  tax_id TEXT,
  
  -- Status
  is_delinquent BOOLEAN DEFAULT FALSE,
  delinquent_since TIMESTAMP,
  
  -- Metadata
  stripe_metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_stripe_customers_user ON stripe_customers(user_id);
CREATE INDEX idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);
CREATE INDEX idx_stripe_customers_delinquent ON stripe_customers(is_delinquent) WHERE is_delinquent = TRUE;

COMMENT ON TABLE stripe_customers IS 'Stripe customer records linked to users';

-- =============================================================================
-- PAYMENT METHODS
-- =============================================================================

CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT REFERENCES stripe_customers(stripe_customer_id),
  
  -- Payment method details
  stripe_payment_method_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('card', 'bank_account', 'paypal', 'other')),
  
  -- Card details (if type = card)
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  
  -- Bank account details (if type = bank_account)
  bank_name TEXT,
  bank_last4 TEXT,
  
  -- Status
  is_default BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  billing_name TEXT,
  billing_email TEXT,
  billing_address JSONB,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_stripe_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = TRUE;

COMMENT ON TABLE payment_methods IS 'User payment methods';

-- =============================================================================
-- PAYMENT TRANSACTIONS
-- =============================================================================

CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Transaction details
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('subscription', 'token_purchase', 'one_time', 'refund', 'chargeback')),
  description TEXT,
  
  -- Amount
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Payment
  payment_method_id UUID REFERENCES payment_methods(id),
  payment_provider TEXT DEFAULT 'stripe',
  
  -- Stripe
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  stripe_invoice_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')),
  failure_code TEXT,
  failure_message TEXT,
  
  -- Related resources
  license_id UUID REFERENCES user_licenses(id),
  token_purchase_id UUID REFERENCES token_purchases(id),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  succeeded_at TIMESTAMP,
  failed_at TIMESTAMP
);

CREATE INDEX idx_payment_transactions_user ON payment_transactions(user_id, created_at DESC);
CREATE INDEX idx_payment_transactions_stripe_intent ON payment_transactions(stripe_payment_intent_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_type ON payment_transactions(transaction_type);

COMMENT ON TABLE payment_transactions IS 'All payment transactions';

-- =============================================================================
-- INVOICES
-- =============================================================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Invoice details
  invoice_number TEXT UNIQUE NOT NULL,
  
  -- Stripe
  stripe_invoice_id TEXT UNIQUE,
  
  -- Billing period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Amount
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  
  -- Payment
  payment_method_id UUID REFERENCES payment_methods(id),
  paid_at TIMESTAMP,
  
  -- Line items
  line_items JSONB DEFAULT '[]',
  
  -- Files
  pdf_url TEXT,
  hosted_invoice_url TEXT,
  
  -- Timestamps
  issued_at TIMESTAMP DEFAULT NOW(),
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoices_user ON invoices(user_id, issued_at DESC);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_stripe_id ON invoices(stripe_invoice_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due ON invoices(due_date) WHERE status IN ('open', 'uncollectible');

COMMENT ON TABLE invoices IS 'Generated invoices for billing';

-- =============================================================================
-- INVOICE LINE ITEMS
-- =============================================================================

CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Item details
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  
  -- Type
  item_type TEXT CHECK (item_type IN ('subscription', 'usage', 'one_time', 'discount')),
  
  -- Related
  license_id UUID REFERENCES user_licenses(id),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);

COMMENT ON TABLE invoice_line_items IS 'Individual line items on invoices';

-- =============================================================================
-- REFUNDS
-- =============================================================================

CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES payment_transactions(id),
  
  -- Refund details
  refund_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  reason TEXT NOT NULL CHECK (reason IN ('duplicate', 'fraudulent', 'requested_by_customer', 'other')),
  reason_details TEXT,
  
  -- Stripe
  stripe_refund_id TEXT UNIQUE,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled')),
  failure_reason TEXT,
  
  -- Related resources
  license_id UUID REFERENCES user_licenses(id),
  token_purchase_id UUID REFERENCES token_purchases(id),
  
  -- Processed by
  processed_by UUID REFERENCES platform_admins(id),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

CREATE INDEX idx_refunds_user ON refunds(user_id);
CREATE INDEX idx_refunds_transaction ON refunds(transaction_id);
CREATE INDEX idx_refunds_stripe_id ON refunds(stripe_refund_id);
CREATE INDEX idx_refunds_status ON refunds(status);

COMMENT ON TABLE refunds IS 'Refund transactions';

-- =============================================================================
-- BILLING EVENTS
-- =============================================================================

CREATE TABLE billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Event details
  event_type TEXT NOT NULL,
  event_source TEXT DEFAULT 'stripe',
  
  -- Stripe event
  stripe_event_id TEXT UNIQUE,
  stripe_event_type TEXT,
  
  -- Payload
  event_data JSONB NOT NULL,
  
  -- Processing
  is_processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  processing_error TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_billing_events_user ON billing_events(user_id);
CREATE INDEX idx_billing_events_stripe_id ON billing_events(stripe_event_id);
CREATE INDEX idx_billing_events_type ON billing_events(event_type);
CREATE INDEX idx_billing_events_unprocessed ON billing_events(is_processed, created_at) WHERE is_processed = FALSE;

COMMENT ON TABLE billing_events IS 'Webhook events from payment providers';

-- =============================================================================
-- PAYMENT DISPUTES
-- =============================================================================

CREATE TABLE payment_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES payment_transactions(id),
  
  -- Dispute details
  stripe_dispute_id TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  reason TEXT NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'warning_needs_response' CHECK (status IN ('warning_needs_response', 'warning_under_review', 'warning_closed', 'needs_response', 'under_review', 'charge_refunded', 'won', 'lost')),
  
  -- Evidence
  evidence_details TEXT,
  evidence_submitted_at TIMESTAMP,
  
  -- Response
  response_by_date TIMESTAMP,
  responded_by UUID REFERENCES platform_admins(id),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_disputes_user ON payment_disputes(user_id);
CREATE INDEX idx_payment_disputes_transaction ON payment_disputes(transaction_id);
CREATE INDEX idx_payment_disputes_status ON payment_disputes(status);

COMMENT ON TABLE payment_disputes IS 'Payment disputes and chargebacks';

-- =============================================================================
-- TAX RATES
-- =============================================================================

CREATE TABLE tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tax details
  country_code TEXT NOT NULL,
  state_code TEXT,
  tax_type TEXT NOT NULL CHECK (tax_type IN ('vat', 'gst', 'sales_tax', 'other')),
  
  -- Rate
  percentage DECIMAL(5,2) NOT NULL,
  
  -- Stripe
  stripe_tax_rate_id TEXT UNIQUE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Effective dates
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_until DATE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tax_rates_location ON tax_rates(country_code, state_code);
CREATE INDEX idx_tax_rates_active ON tax_rates(is_active, effective_from, effective_until);

COMMENT ON TABLE tax_rates IS 'Tax rates by jurisdiction';

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;

-- Stripe customers: Self read
CREATE POLICY "Users can view own stripe customer" ON stripe_customers
  FOR SELECT USING (auth.uid() = user_id);

-- Payment methods: Self manage
CREATE POLICY "Users can manage own payment methods" ON payment_methods
  FOR ALL USING (auth.uid() = user_id);

-- Transactions: Self read
CREATE POLICY "Users can view own transactions" ON payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Invoices: Self read
CREATE POLICY "Users can view own invoices" ON invoices
  FOR SELECT USING (auth.uid() = user_id);

-- Line items: Via invoice
CREATE POLICY "Users can view invoice line items" ON invoice_line_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_line_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

-- Refunds: Self read
CREATE POLICY "Users can view own refunds" ON refunds
  FOR SELECT USING (auth.uid() = user_id);

-- Tax rates: Public read
CREATE POLICY "Anyone can view active tax rates" ON tax_rates
  FOR SELECT USING (is_active = TRUE);

-- Admins bypass all
CREATE POLICY "Admins can manage billing" ON payment_transactions
  FOR ALL USING (is_platform_admin());

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_stripe_customers_updated_at
  BEFORE UPDATE ON stripe_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(NEXTVAL('invoice_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE invoice_number_seq;

CREATE TRIGGER generate_invoice_num
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION generate_invoice_number();

-- Auto-create Stripe customer
CREATE OR REPLACE FUNCTION create_stripe_customer()
RETURNS TRIGGER AS $$
BEGIN
  -- Note: Actual Stripe customer creation happens in application code
  -- This is just a placeholder for the record
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update transaction status
CREATE OR REPLACE FUNCTION update_transaction_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'succeeded' AND OLD.status != 'succeeded' THEN
    NEW.succeeded_at := NOW();
  ELSIF NEW.status = 'failed' AND OLD.status != 'failed' THEN
    NEW.failed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_transaction_timestamps
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_transaction_timestamp();
-- Migration: 010_notifications_emails.sql
-- Purpose: Notifications, email queue, templates, user preferences
-- Date: 2026-01-21

-- =============================================================================
-- NOTIFICATION TEMPLATES (moved to top - must exist before email_queue)
-- =============================================================================

CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template details
  template_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Type
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'in_app', 'push', 'sms')),
  category TEXT DEFAULT 'transactional',
  
  -- Email template
  subject_template TEXT,
  html_template TEXT,
  text_template TEXT,
  
  -- In-app template
  title_template TEXT,
  message_template TEXT,
  action_url_template TEXT,
  icon TEXT,
  
  -- Variables
  required_variables TEXT[] DEFAULT '{}',
  default_variables JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Versioning
  version INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notification_templates_key ON notification_templates(template_key);
CREATE INDEX idx_notification_templates_type ON notification_templates(notification_type);

COMMENT ON TABLE notification_templates IS 'Notification and email templates';

-- Seed templates
INSERT INTO notification_templates (template_key, name, notification_type, category, subject_template, html_template, required_variables) VALUES
('welcome_email', 'Welcome Email', 'email', 'transactional', 'Welcome to Oraya, {{name}}!', '<h1>Welcome!</h1><p>Hi {{name}}, thanks for signing up.</p>', ARRAY['name']),
('password_reset', 'Password Reset', 'email', 'transactional', 'Reset your password', '<p>Click here to reset: {{reset_url}}</p>', ARRAY['reset_url']),
('license_activated', 'License Activated', 'email', 'transactional', 'Your Oraya license is active', '<p>Your {{plan_name}} license has been activated.</p>', ARRAY['plan_name']),
('payment_succeeded', 'Payment Successful', 'email', 'transactional', 'Payment received - Thank you!', '<p>We received your payment of {{amount}}.</p>', ARRAY['amount']),
('low_token_balance', 'Low Token Balance', 'email', 'alert', 'Your token balance is low', '<p>You have {{balance}} tokens remaining.</p>', ARRAY['balance']),
('trial_ending', 'Trial Ending Soon', 'email', 'marketing', 'Your trial ends in {{days}} days', '<p>Upgrade now to keep using Oraya.</p>', ARRAY['days']);

-- =============================================================================
-- EMAIL QUEUE
-- =============================================================================

CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient
  to_email TEXT NOT NULL,
  to_name TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Email details
  from_email TEXT DEFAULT 'noreply@oraya.ai',
  from_name TEXT DEFAULT 'Oraya',
  subject TEXT NOT NULL,
  
  -- Content
  html_body TEXT NOT NULL,
  text_body TEXT,
  
  -- Template
  template_id UUID REFERENCES notification_templates(id),
  template_data JSONB DEFAULT '{}',
  
  -- Priority
  priority INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'bounced')),
  
  -- Delivery
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  
  -- Errors
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Provider
  email_provider TEXT DEFAULT 'resend',
  provider_message_id TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  scheduled_for TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX idx_email_queue_status ON email_queue(status, scheduled_for);
CREATE INDEX idx_email_queue_user ON email_queue(user_id, created_at DESC);
CREATE INDEX idx_email_queue_pending ON email_queue(status, priority DESC, scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_email_queue_failed ON email_queue(status, retry_count) WHERE status = 'failed' AND retry_count < max_retries;

COMMENT ON TABLE email_queue IS 'Outbound email queue';

-- =============================================================================
-- USER NOTIFICATIONS
-- =============================================================================

CREATE TABLE user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification details
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Action
  action_url TEXT,
  action_label TEXT,
  
  -- Visual
  icon TEXT,
  color TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  -- Dismissal
  is_dismissible BOOLEAN DEFAULT TRUE,
  dismissed_at TIMESTAMP,
  
  -- Priority
  priority INTEGER DEFAULT 0,
  
  -- Expiration
  expires_at TIMESTAMP,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_notifications_user_unread ON user_notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_user_notifications_user_active ON user_notifications(user_id, created_at DESC) WHERE is_read = FALSE;

COMMENT ON TABLE user_notifications IS 'In-app notifications for users';

-- =============================================================================
-- NOTIFICATION PREFERENCES
-- =============================================================================

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Email preferences
  email_notifications_enabled BOOLEAN DEFAULT TRUE,
  marketing_emails_enabled BOOLEAN DEFAULT FALSE,
  product_updates_enabled BOOLEAN DEFAULT TRUE,
  
  -- Email frequency
  digest_frequency TEXT DEFAULT 'daily' CHECK (digest_frequency IN ('realtime', 'daily', 'weekly', 'never')),
  
  -- Notification types (email)
  notify_license_changes BOOLEAN DEFAULT TRUE,
  notify_payment_updates BOOLEAN DEFAULT TRUE,
  notify_low_balance BOOLEAN DEFAULT TRUE,
  notify_usage_alerts BOOLEAN DEFAULT TRUE,
  notify_team_invites BOOLEAN DEFAULT TRUE,
  notify_support_replies BOOLEAN DEFAULT TRUE,
  
  -- In-app preferences
  in_app_notifications_enabled BOOLEAN DEFAULT TRUE,
  show_notification_badge BOOLEAN DEFAULT TRUE,
  
  -- Push notifications (future)
  push_notifications_enabled BOOLEAN DEFAULT FALSE,
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone TEXT DEFAULT 'UTC',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);

COMMENT ON TABLE notification_preferences IS 'User notification preferences';

-- =============================================================================
-- EMAIL BOUNCES
-- =============================================================================

CREATE TABLE email_bounces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_address TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Bounce details
  bounce_type TEXT NOT NULL CHECK (bounce_type IN ('hard', 'soft', 'complaint')),
  bounce_subtype TEXT,
  diagnostic_code TEXT,
  
  -- Related email
  email_queue_id UUID REFERENCES email_queue(id),
  
  -- Status
  is_permanent BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  bounced_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_bounces_email ON email_bounces(email_address);
CREATE INDEX idx_email_bounces_user ON email_bounces(user_id);

COMMENT ON TABLE email_bounces IS 'Email bounce tracking';

-- =============================================================================
-- EMAIL SUPPRESSIONS
-- =============================================================================

CREATE TABLE email_suppressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_address TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Suppression reason
  reason TEXT NOT NULL CHECK (reason IN ('bounce', 'complaint', 'unsubscribe', 'manual')),
  reason_details TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  suppressed_at TIMESTAMP DEFAULT NOW(),
  removed_at TIMESTAMP
);

CREATE INDEX idx_email_suppressions_email ON email_suppressions(email_address);
CREATE INDEX idx_email_suppressions_active ON email_suppressions(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE email_suppressions IS 'Suppressed email addresses (unsubscribed, bounced)';

-- =============================================================================
-- NOTIFICATION DELIVERY LOG
-- =============================================================================

CREATE TABLE notification_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Notification details
  notification_type TEXT NOT NULL,
  template_key TEXT,
  
  -- Delivery
  channel TEXT NOT NULL CHECK (channel IN ('email', 'in_app', 'push', 'sms')),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked')),
  
  -- Related
  email_queue_id UUID REFERENCES email_queue(id),
  user_notification_id UUID REFERENCES user_notifications(id),
  
  -- Timestamps
  sent_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP,
  interacted_at TIMESTAMP
);

CREATE INDEX idx_notification_delivery_log_user ON notification_delivery_log(user_id, sent_at DESC);
CREATE INDEX idx_notification_delivery_log_template ON notification_delivery_log(template_key, sent_at DESC);

COMMENT ON TABLE notification_delivery_log IS 'Notification delivery audit trail';

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_bounces ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_suppressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_delivery_log ENABLE ROW LEVEL SECURITY;

-- Email queue: System insert, admins read
CREATE POLICY "System can insert emails" ON email_queue
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admins can view email queue" ON email_queue
  FOR SELECT USING (is_platform_admin());

-- Templates: Public read active, admins manage
CREATE POLICY "Anyone can view active templates" ON notification_templates
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage templates" ON notification_templates
  FOR ALL USING (is_platform_admin());

-- User notifications: Self manage
CREATE POLICY "Users can view own notifications" ON user_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON user_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Notification preferences: Self manage
CREATE POLICY "Users can manage own preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Delivery log: Self read
CREATE POLICY "Users can view own delivery log" ON notification_delivery_log
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create notification preferences
CREATE OR REPLACE FUNCTION create_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_notif_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_preferences();

-- Mark notification as read on update
CREATE OR REPLACE FUNCTION set_notification_read_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
    NEW.read_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_read_timestamp
  BEFORE UPDATE ON user_notifications
  FOR EACH ROW
  EXECUTE FUNCTION set_notification_read_timestamp();

-- Check email suppression before queuing
CREATE OR REPLACE FUNCTION check_email_suppression()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM email_suppressions
    WHERE email_address = NEW.to_email
    AND is_active = TRUE
  ) THEN
    NEW.status := 'failed';
    NEW.error_message := 'Email address is suppressed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_email_suppression
  BEFORE INSERT ON email_queue
  FOR EACH ROW
  EXECUTE FUNCTION check_email_suppression();
-- Migration: 011_support_system.sql
-- Purpose: Support tickets, messages, knowledge base, FAQ
-- Date: 2026-01-21

-- =============================================================================
-- SUPPORT TICKETS
-- =============================================================================

CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Ticket details
  ticket_number TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Classification
  category TEXT CHECK (category IN ('technical', 'billing', 'account', 'feature_request', 'bug', 'other')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'pending', 'in_progress', 'waiting_customer', 'resolved', 'closed')),
  
  -- Assignment
  assigned_to UUID REFERENCES platform_admins(id),
  assigned_at TIMESTAMP,
  
  -- Resolution
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES platform_admins(id),
  resolution_notes TEXT,
  
  -- Satisfaction
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  satisfaction_feedback TEXT,
  
  -- Related
  license_id UUID REFERENCES user_licenses(id),
  transaction_id UUID REFERENCES payment_transactions(id),
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_customer_reply_at TIMESTAMP,
  last_agent_reply_at TIMESTAMP,
  closed_at TIMESTAMP
);

CREATE INDEX idx_support_tickets_user ON support_tickets(user_id, created_at DESC);
CREATE INDEX idx_support_tickets_number ON support_tickets(ticket_number);
CREATE INDEX idx_support_tickets_status ON support_tickets(status, priority DESC, created_at);
CREATE INDEX idx_support_tickets_assigned ON support_tickets(assigned_to, status);
CREATE INDEX idx_support_tickets_category ON support_tickets(category, status);

COMMENT ON TABLE support_tickets IS 'Customer support tickets';

-- =============================================================================
-- TICKET MESSAGES
-- =============================================================================

CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  
  -- Author
  author_id UUID REFERENCES auth.users(id),
  author_type TEXT NOT NULL CHECK (author_type IN ('customer', 'agent', 'system')),
  author_name TEXT,
  
  -- Message
  message TEXT NOT NULL,
  
  -- Attachments
  attachments JSONB DEFAULT '[]',
  
  -- Visibility
  is_internal BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ticket_messages_ticket ON ticket_messages(ticket_id, created_at);

COMMENT ON TABLE ticket_messages IS 'Messages/replies on support tickets';

-- =============================================================================
-- KNOWLEDGE BASE CATEGORIES
-- =============================================================================

CREATE TABLE knowledge_base_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Category details
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  
  -- Hierarchy
  parent_id UUID REFERENCES knowledge_base_categories(id),
  
  -- Display
  display_order INTEGER DEFAULT 0,
  
  -- Status
  is_published BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_kb_categories_parent ON knowledge_base_categories(parent_id);
CREATE INDEX idx_kb_categories_published ON knowledge_base_categories(is_published, display_order);

COMMENT ON TABLE knowledge_base_categories IS 'Knowledge base article categories';

-- =============================================================================
-- KNOWLEDGE BASE ARTICLES
-- =============================================================================

CREATE TABLE knowledge_base_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES knowledge_base_categories(id) ON DELETE SET NULL,
  
  -- Article details
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  
  -- Featured
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Views
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  
  -- Author
  author_id UUID REFERENCES platform_admins(id),
  
  -- Versions
  version INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
);

CREATE INDEX idx_kb_articles_category ON knowledge_base_articles(category_id);
CREATE INDEX idx_kb_articles_slug ON knowledge_base_articles(slug);
CREATE INDEX idx_kb_articles_status ON knowledge_base_articles(status, published_at DESC);
CREATE INDEX idx_kb_articles_featured ON knowledge_base_articles(is_featured) WHERE is_featured = TRUE;

-- Full-text search
CREATE INDEX idx_kb_articles_search ON knowledge_base_articles USING gin(to_tsvector('english', title || ' ' || content));

COMMENT ON TABLE knowledge_base_articles IS 'Help documentation articles';

-- =============================================================================
-- ARTICLE FEEDBACK
-- =============================================================================

CREATE TABLE article_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES knowledge_base_articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Feedback
  is_helpful BOOLEAN NOT NULL,
  feedback_text TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_article_feedback_article ON article_feedback(article_id);

COMMENT ON TABLE article_feedback IS 'User feedback on help articles';

-- =============================================================================
-- CANNED RESPONSES
-- =============================================================================

CREATE TABLE canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Response details
  title TEXT NOT NULL,
  shortcut TEXT UNIQUE,
  content TEXT NOT NULL,
  
  -- Category
  category TEXT,
  
  -- Usage
  use_count INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Created by
  created_by UUID REFERENCES platform_admins(id),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_canned_responses_shortcut ON canned_responses(shortcut);
CREATE INDEX idx_canned_responses_active ON canned_responses(is_active);

COMMENT ON TABLE canned_responses IS 'Pre-written support responses';

-- =============================================================================
-- TICKET TAGS
-- =============================================================================

CREATE TABLE ticket_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tag details
  name TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#6366f1',
  
  -- Usage
  use_count INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ticket_tags_name ON ticket_tags(name);

COMMENT ON TABLE ticket_tags IS 'Tags for categorizing tickets';

-- =============================================================================
-- SLA POLICIES
-- =============================================================================

CREATE TABLE sla_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Policy details
  name TEXT NOT NULL,
  description TEXT,
  
  -- Conditions
  applies_to_priority TEXT[] DEFAULT ARRAY['urgent', 'high'],
  applies_to_category TEXT[],
  applies_to_plan TEXT[],
  
  -- Targets (in minutes)
  first_response_time INTEGER NOT NULL,
  resolution_time INTEGER NOT NULL,
  
  -- Business hours
  business_hours_only BOOLEAN DEFAULT TRUE,
  business_hours_start TIME DEFAULT '09:00',
  business_hours_end TIME DEFAULT '17:00',
  business_days TEXT[] DEFAULT ARRAY['monday','tuesday','wednesday','thursday','friday'],
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sla_policies_active ON sla_policies(is_active);

COMMENT ON TABLE sla_policies IS 'Service level agreement policies';

-- =============================================================================
-- TICKET SLA TRACKING
-- =============================================================================

CREATE TABLE ticket_sla_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL UNIQUE REFERENCES support_tickets(id) ON DELETE CASCADE,
  sla_policy_id UUID NOT NULL REFERENCES sla_policies(id),
  
  -- Targets
  first_response_due_at TIMESTAMP,
  resolution_due_at TIMESTAMP,
  
  -- Actual
  first_response_at TIMESTAMP,
  resolved_at TIMESTAMP,
  
  -- Status
  first_response_breached BOOLEAN DEFAULT FALSE,
  resolution_breached BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  started_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ticket_sla_ticket ON ticket_sla_tracking(ticket_id);
CREATE INDEX idx_ticket_sla_breached ON ticket_sla_tracking(first_response_breached, resolution_breached);

COMMENT ON TABLE ticket_sla_tracking IS 'SLA compliance tracking per ticket';

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE canned_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_sla_tracking ENABLE ROW LEVEL SECURITY;

-- Tickets: Self read/create, admins all
CREATE POLICY "Users can view own tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all tickets" ON support_tickets
  FOR ALL USING (is_platform_admin());

-- Messages: Via ticket ownership
CREATE POLICY "Users can view messages on own tickets" ON ticket_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_messages.ticket_id
      AND support_tickets.user_id = auth.uid()
    )
    AND is_internal = FALSE
  );

CREATE POLICY "Users can reply to own tickets" ON ticket_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_messages.ticket_id
      AND support_tickets.user_id = auth.uid()
    )
  );

-- Knowledge base: Public read
CREATE POLICY "Anyone can view published KB categories" ON knowledge_base_categories
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Anyone can view published articles" ON knowledge_base_articles
  FOR SELECT USING (status = 'published');

-- Article feedback: Users can submit
CREATE POLICY "Users can submit article feedback" ON article_feedback
  FOR INSERT WITH CHECK (TRUE);

-- Admins manage KB
CREATE POLICY "Admins can manage KB" ON knowledge_base_articles
  FOR ALL USING (is_platform_admin());

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kb_categories_updated_at
  BEFORE UPDATE ON knowledge_base_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kb_articles_updated_at
  BEFORE UPDATE ON knowledge_base_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := 'TICKET-' || LPAD(NEXTVAL('ticket_number_seq')::TEXT, 8, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE ticket_number_seq;

CREATE TRIGGER generate_ticket_num
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION generate_ticket_number();

-- Update last reply timestamps
CREATE OR REPLACE FUNCTION update_ticket_reply_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.author_type = 'customer' THEN
    UPDATE support_tickets
    SET last_customer_reply_at = NEW.created_at,
        updated_at = NEW.created_at
    WHERE id = NEW.ticket_id;
  ELSIF NEW.author_type = 'agent' THEN
    UPDATE support_tickets
    SET last_agent_reply_at = NEW.created_at,
        updated_at = NEW.created_at
    WHERE id = NEW.ticket_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_last_reply_timestamp
  AFTER INSERT ON ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_reply_timestamp();

-- Update article helpful/not helpful counts
CREATE OR REPLACE FUNCTION update_article_feedback_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_helpful THEN
    UPDATE knowledge_base_articles
    SET helpful_count = helpful_count + 1
    WHERE id = NEW.article_id;
  ELSE
    UPDATE knowledge_base_articles
    SET not_helpful_count = not_helpful_count + 1
    WHERE id = NEW.article_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_helpful_count
  AFTER INSERT ON article_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_article_feedback_count();

-- Increment article view count
CREATE OR REPLACE FUNCTION increment_article_views()
RETURNS TRIGGER AS $$
BEGIN
  NEW.view_count := OLD.view_count + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-create SLA tracking on ticket creation
CREATE OR REPLACE FUNCTION create_sla_tracking()
RETURNS TRIGGER AS $$
DECLARE
  applicable_sla sla_policies%ROWTYPE;
BEGIN
  -- Find applicable SLA policy
  SELECT * INTO applicable_sla
  FROM sla_policies
  WHERE is_active = TRUE
  AND (applies_to_priority IS NULL OR NEW.priority = ANY(applies_to_priority))
  AND (applies_to_category IS NULL OR NEW.category = ANY(applies_to_category))
  LIMIT 1;
  
  IF FOUND THEN
    INSERT INTO ticket_sla_tracking (ticket_id, sla_policy_id, first_response_due_at, resolution_due_at)
    VALUES (
      NEW.id,
      applicable_sla.id,
      NEW.created_at + (applicable_sla.first_response_time || ' minutes')::INTERVAL,
      NEW.created_at + (applicable_sla.resolution_time || ' minutes')::INTERVAL
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER setup_sla_tracking
  AFTER INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION create_sla_tracking();
-- Migration: 012_api_management.sql
-- Purpose: API authentication, rate limiting, usage tracking
-- Date: 2026-01-21

-- =============================================================================
-- API KEYS
-- =============================================================================

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Key details
  key_name TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  api_key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  
  -- Permissions
  scopes TEXT[] DEFAULT ARRAY['read'],
  allowed_origins TEXT[] DEFAULT '{}',
  allowed_ips INET[] DEFAULT '{}',
  
  -- Rate limiting
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_hour INTEGER DEFAULT 1000,
  rate_limit_per_day INTEGER DEFAULT 10000,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Usage
  last_used_at TIMESTAMP,
  last_used_ip INET,
  total_requests INTEGER DEFAULT 0,
  
  -- Expiration
  expires_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, key_name)
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_key ON api_keys(api_key);
CREATE INDEX idx_api_keys_prefix ON api_keys(api_key_prefix);
CREATE INDEX idx_api_keys_active ON api_keys(is_active, expires_at);

COMMENT ON TABLE api_keys IS 'API keys for desktop app and integrations';

-- =============================================================================
-- API RATE LIMITS
-- =============================================================================

CREATE TABLE api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  
  -- Time window
  window_start TIMESTAMP NOT NULL,
  window_end TIMESTAMP NOT NULL,
  window_type TEXT NOT NULL CHECK (window_type IN ('minute', 'hour', 'day')),
  
  -- Limits
  request_count INTEGER DEFAULT 0,
  limit_exceeded BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(api_key_id, window_start, window_type)
);

CREATE INDEX idx_api_rate_limits_key_window ON api_rate_limits(api_key_id, window_type, window_start DESC);
CREATE INDEX idx_api_rate_limits_exceeded ON api_rate_limits(limit_exceeded, window_start) WHERE limit_exceeded = TRUE;

COMMENT ON TABLE api_rate_limits IS 'API rate limiting tracking';

-- =============================================================================
-- API USAGE LOGS
-- =============================================================================

CREATE TABLE api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Request details
  method TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  path TEXT NOT NULL,
  query_params JSONB DEFAULT '{}',
  
  -- Response
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  
  -- Error
  error_message TEXT,
  error_code TEXT,
  
  -- Network
  ip_address INET,
  user_agent TEXT,
  origin TEXT,
  
  -- Metadata
  request_id TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Partitioned by month
CREATE INDEX idx_api_usage_logs_key_date ON api_usage_logs(api_key_id, created_at DESC);
CREATE INDEX idx_api_usage_logs_user_date ON api_usage_logs(user_id, created_at DESC);
CREATE INDEX idx_api_usage_logs_endpoint ON api_usage_logs(endpoint, created_at DESC);
CREATE INDEX idx_api_usage_logs_status ON api_usage_logs(status_code, created_at DESC);
CREATE INDEX idx_api_usage_logs_request_id ON api_usage_logs(request_id);

COMMENT ON TABLE api_usage_logs IS 'API request logs for debugging and analytics';

-- =============================================================================
-- API WEBHOOKS
-- =============================================================================

CREATE TABLE api_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Webhook details
  url TEXT NOT NULL,
  description TEXT,
  
  -- Events
  subscribed_events TEXT[] NOT NULL,
  
  -- Security
  secret TEXT NOT NULL,
  
  -- Headers
  custom_headers JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Delivery
  last_triggered_at TIMESTAMP,
  last_success_at TIMESTAMP,
  last_failure_at TIMESTAMP,
  consecutive_failures INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_webhooks_user ON api_webhooks(user_id);
CREATE INDEX idx_api_webhooks_active ON api_webhooks(is_active);

COMMENT ON TABLE api_webhooks IS 'User-configured webhooks';

-- =============================================================================
-- WEBHOOK DELIVERIES
-- =============================================================================

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES api_webhooks(id) ON DELETE CASCADE,
  
  -- Event
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  
  -- Delivery
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
  http_status_code INTEGER,
  response_body TEXT,
  
  -- Timing
  sent_at TIMESTAMP,
  responded_at TIMESTAMP,
  response_time_ms INTEGER,
  
  -- Retries
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMP,
  
  -- Error
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id, created_at DESC);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_pending_retry ON webhook_deliveries(status, next_retry_at) WHERE status = 'retrying';

COMMENT ON TABLE webhook_deliveries IS 'Webhook delivery attempts and responses';

-- =============================================================================
-- API ENDPOINTS
-- =============================================================================

CREATE TABLE api_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Endpoint details
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  description TEXT,
  
  -- Rate limits
  default_rate_limit_per_minute INTEGER DEFAULT 60,
  
  -- Permissions
  required_scopes TEXT[] DEFAULT ARRAY['read'],
  requires_auth BOOLEAN DEFAULT TRUE,
  
  -- Deprecation
  is_deprecated BOOLEAN DEFAULT FALSE,
  deprecated_at TIMESTAMP,
  sunset_at TIMESTAMP,
  
  -- Documentation
  docs_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(method, path)
);

CREATE INDEX idx_api_endpoints_path ON api_endpoints(path);
CREATE INDEX idx_api_endpoints_active ON api_endpoints(is_active);

COMMENT ON TABLE api_endpoints IS 'API endpoint registry';

-- =============================================================================
-- API VERSIONS
-- =============================================================================

CREATE TABLE api_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Version details
  version TEXT UNIQUE NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'sunset')),
  
  -- Dates
  released_at TIMESTAMP DEFAULT NOW(),
  deprecated_at TIMESTAMP,
  sunset_at TIMESTAMP,
  
  -- Documentation
  changelog_url TEXT,
  docs_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_versions_version ON api_versions(version);
CREATE INDEX idx_api_versions_default ON api_versions(is_default) WHERE is_default = TRUE;

COMMENT ON TABLE api_versions IS 'API version tracking';

-- =============================================================================
-- OAUTH CLIENTS
-- =============================================================================

CREATE TABLE oauth_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Client details
  client_id TEXT UNIQUE NOT NULL,
  client_secret TEXT NOT NULL,
  client_name TEXT NOT NULL,
  
  -- Application details
  description TEXT,
  logo_url TEXT,
  homepage_url TEXT,
  
  -- Redirect URIs
  redirect_uris TEXT[] NOT NULL,
  
  -- Scopes
  allowed_scopes TEXT[] DEFAULT ARRAY['read'],
  
  -- Type
  client_type TEXT DEFAULT 'confidential' CHECK (client_type IN ('confidential', 'public')),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_oauth_clients_user ON oauth_clients(user_id);
CREATE INDEX idx_oauth_clients_client_id ON oauth_clients(client_id);

COMMENT ON TABLE oauth_clients IS 'OAuth 2.0 client applications';

-- =============================================================================
-- OAUTH TOKENS
-- =============================================================================

CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tokens
  access_token TEXT UNIQUE NOT NULL,
  refresh_token TEXT UNIQUE,
  
  -- Scopes
  scopes TEXT[] NOT NULL,
  
  -- Expiration
  expires_at TIMESTAMP NOT NULL,
  
  -- Status
  is_revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_oauth_tokens_access ON oauth_tokens(access_token);
CREATE INDEX idx_oauth_tokens_refresh ON oauth_tokens(refresh_token);
CREATE INDEX idx_oauth_tokens_user ON oauth_tokens(user_id);
CREATE INDEX idx_oauth_tokens_expires ON oauth_tokens(expires_at);

COMMENT ON TABLE oauth_tokens IS 'OAuth access and refresh tokens';

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

-- API keys: Self manage
CREATE POLICY "Users can manage own API keys" ON api_keys
  FOR ALL USING (auth.uid() = user_id);

-- Rate limits: Self read
CREATE POLICY "Users can view own rate limits" ON api_rate_limits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM api_keys
      WHERE api_keys.id = api_rate_limits.api_key_id
      AND api_keys.user_id = auth.uid()
    )
  );

-- Usage logs: Self read
CREATE POLICY "Users can view own API usage" ON api_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Webhooks: Self manage
CREATE POLICY "Users can manage own webhooks" ON api_webhooks
  FOR ALL USING (auth.uid() = user_id);

-- Webhook deliveries: Via webhook ownership
CREATE POLICY "Users can view own webhook deliveries" ON webhook_deliveries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM api_webhooks
      WHERE api_webhooks.id = webhook_deliveries.webhook_id
      AND api_webhooks.user_id = auth.uid()
    )
  );

-- API endpoints: Public read
CREATE POLICY "Anyone can view active endpoints" ON api_endpoints
  FOR SELECT USING (is_active = TRUE);

-- API versions: Public read
CREATE POLICY "Anyone can view API versions" ON api_versions
  FOR SELECT USING (TRUE);

-- OAuth clients: Self manage
CREATE POLICY "Users can manage own OAuth clients" ON oauth_clients
  FOR ALL USING (auth.uid() = user_id);

-- OAuth tokens: Self read
CREATE POLICY "Users can view own tokens" ON oauth_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_webhooks_updated_at
  BEFORE UPDATE ON api_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Generate API key
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.api_key IS NULL THEN
    NEW.api_key := 'ora_' || encode(gen_random_bytes(32), 'base64');
    NEW.api_key_prefix := LEFT(NEW.api_key, 12);
    NEW.key_hash := encode(digest(NEW.api_key, 'sha256'), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_api_key_trigger
  BEFORE INSERT ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION generate_api_key();

-- Update API key last used
CREATE OR REPLACE FUNCTION update_api_key_last_used()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.api_key_id IS NOT NULL THEN
    UPDATE api_keys
    SET 
      last_used_at = NEW.created_at,
      last_used_ip = NEW.ip_address,
      total_requests = total_requests + 1
    WHERE id = NEW.api_key_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_key_last_used
  AFTER INSERT ON api_usage_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_api_key_last_used();

-- Track webhook consecutive failures
CREATE OR REPLACE FUNCTION track_webhook_failures()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'success' THEN
    UPDATE api_webhooks
    SET 
      last_success_at = NEW.sent_at,
      consecutive_failures = 0
    WHERE id = NEW.webhook_id;
  ELSIF NEW.status = 'failed' THEN
    UPDATE api_webhooks
    SET 
      last_failure_at = NEW.sent_at,
      consecutive_failures = consecutive_failures + 1,
      is_active = CASE 
        WHEN consecutive_failures + 1 >= 10 THEN FALSE
        ELSE is_active
      END
    WHERE id = NEW.webhook_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_webhook_delivery_status
  AFTER UPDATE ON webhook_deliveries
  FOR EACH ROW
  WHEN (NEW.status IN ('success', 'failed'))
  EXECUTE FUNCTION track_webhook_failures();
-- Migration: 013_gdpr_compliance.sql
-- Purpose: GDPR compliance - data exports, deletions, consent tracking
-- Date: 2026-01-21

-- =============================================================================
-- DATA EXPORT REQUESTS
-- =============================================================================

CREATE TABLE data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Request details
  request_type TEXT DEFAULT 'full' CHECK (request_type IN ('full', 'partial', 'specific')),
  requested_data_types TEXT[] DEFAULT ARRAY['all'],
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
  
  -- Processing
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  processed_by UUID REFERENCES platform_admins(id),
  
  -- Export file
  export_file_url TEXT,
  export_file_size_bytes BIGINT,
  export_format TEXT DEFAULT 'json',
  download_expires_at TIMESTAMP,
  downloaded_at TIMESTAMP,
  download_count INTEGER DEFAULT 0,
  
  -- Errors
  error_message TEXT,
  
  -- Security
  verification_code TEXT,
  ip_address INET,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_data_export_requests_user ON data_export_requests(user_id, created_at DESC);
CREATE INDEX idx_data_export_requests_status ON data_export_requests(status, created_at);
CREATE INDEX idx_data_export_requests_expires ON data_export_requests(download_expires_at) WHERE status = 'completed';

COMMENT ON TABLE data_export_requests IS 'GDPR data export requests (Art. 15, 20)';

-- =============================================================================
-- DATA DELETION REQUESTS
-- =============================================================================

CREATE TABLE data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Request details
  deletion_type TEXT DEFAULT 'full' CHECK (deletion_type IN ('full', 'partial', 'anonymize')),
  data_to_delete TEXT[] DEFAULT ARRAY['all'],
  reason TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Verification
  verification_code TEXT,
  verification_sent_at TIMESTAMP,
  verified_at TIMESTAMP,
  verification_ip INET,
  
  -- Processing
  scheduled_for TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  processed_by UUID REFERENCES platform_admins(id),
  
  -- Retention
  retention_period_days INTEGER DEFAULT 30,
  soft_deleted BOOLEAN DEFAULT TRUE,
  permanent_deletion_at TIMESTAMP,
  
  -- Errors
  error_message TEXT,
  
  -- Audit
  deletion_log JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_data_deletion_requests_user ON data_deletion_requests(user_id, created_at DESC);
CREATE INDEX idx_data_deletion_requests_status ON data_deletion_requests(status);
CREATE INDEX idx_data_deletion_requests_scheduled ON data_deletion_requests(scheduled_for) WHERE status = 'verified';

COMMENT ON TABLE data_deletion_requests IS 'GDPR deletion/erasure requests (Art. 17)';

-- =============================================================================
-- CONSENT RECORDS
-- =============================================================================

CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Consent details
  consent_type TEXT NOT NULL CHECK (consent_type IN (
    'terms_of_service',
    'privacy_policy',
    'marketing_emails',
    'analytics',
    'cookies',
    'data_processing',
    'third_party_sharing',
    'ai_training'
  )),
  consent_version TEXT NOT NULL,
  
  -- Status
  is_granted BOOLEAN NOT NULL,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  source TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  revoked_at TIMESTAMP
);

CREATE INDEX idx_consent_records_user_type ON consent_records(user_id, consent_type, granted_at DESC);
CREATE INDEX idx_consent_records_active ON consent_records(user_id, consent_type, is_granted) WHERE is_granted = TRUE;

COMMENT ON TABLE consent_records IS 'User consent tracking (GDPR Art. 7)';

-- =============================================================================
-- DATA PROCESSING ACTIVITIES
-- =============================================================================

CREATE TABLE data_processing_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Activity details
  activity_name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  legal_basis TEXT NOT NULL CHECK (legal_basis IN (
    'consent',
    'contract',
    'legal_obligation',
    'vital_interest',
    'public_task',
    'legitimate_interest'
  )),
  
  -- Data categories
  data_categories TEXT[] NOT NULL,
  data_subjects TEXT[] NOT NULL,
  
  -- Processing
  processing_operations TEXT[] NOT NULL,
  retention_period TEXT,
  
  -- Third parties
  data_recipients TEXT[] DEFAULT '{}',
  international_transfers BOOLEAN DEFAULT FALSE,
  transfer_safeguards TEXT,
  
  -- Security
  security_measures TEXT[] DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Review
  last_reviewed_at TIMESTAMP,
  next_review_date DATE,
  
  -- Responsible
  data_controller TEXT,
  data_processor TEXT,
  dpo_contact TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_data_processing_activities_legal_basis ON data_processing_activities(legal_basis);
CREATE INDEX idx_data_processing_activities_active ON data_processing_activities(is_active);

COMMENT ON TABLE data_processing_activities IS 'Record of processing activities (GDPR Art. 30)';

-- =============================================================================
-- DATA BREACH INCIDENTS
-- =============================================================================

CREATE TABLE data_breach_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Incident details
  incident_title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Affected data
  data_types_affected TEXT[] NOT NULL,
  affected_user_count INTEGER,
  affected_user_ids UUID[],
  
  -- Discovery
  discovered_at TIMESTAMP NOT NULL,
  discovered_by UUID REFERENCES platform_admins(id),
  
  -- Breach details
  breach_type TEXT,
  breach_source TEXT,
  attack_vector TEXT,
  
  -- Response
  containment_measures TEXT,
  remediation_steps TEXT,
  
  -- Notification
  users_notified BOOLEAN DEFAULT FALSE,
  users_notified_at TIMESTAMP,
  authority_notified BOOLEAN DEFAULT FALSE,
  authority_notified_at TIMESTAMP,
  notification_deadline TIMESTAMP,
  
  -- Status
  status TEXT DEFAULT 'investigating' CHECK (status IN ('investigating', 'contained', 'resolved', 'closed')),
  
  -- Resolution
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  
  -- Lessons learned
  post_incident_report TEXT,
  preventive_measures TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_data_breach_incidents_severity ON data_breach_incidents(severity, discovered_at DESC);
CREATE INDEX idx_data_breach_incidents_status ON data_breach_incidents(status);

COMMENT ON TABLE data_breach_incidents IS 'Data breach incident tracking (GDPR Art. 33, 34)';

-- =============================================================================
-- DATA RETENTION POLICIES
-- =============================================================================

CREATE TABLE data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Policy details
  data_type TEXT NOT NULL,
  description TEXT,
  
  -- Retention
  retention_period_days INTEGER NOT NULL,
  retention_reason TEXT NOT NULL,
  
  -- Deletion
  auto_delete BOOLEAN DEFAULT TRUE,
  deletion_method TEXT DEFAULT 'soft_delete' CHECK (deletion_method IN ('soft_delete', 'hard_delete', 'anonymize')),
  
  -- Legal basis
  legal_basis TEXT,
  applicable_regulation TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_data_retention_policies_type ON data_retention_policies(data_type);
CREATE INDEX idx_data_retention_policies_active ON data_retention_policies(is_active);

COMMENT ON TABLE data_retention_policies IS 'Data retention policy definitions';

-- =============================================================================
-- ANONYMIZATION LOG
-- =============================================================================

CREATE TABLE anonymization_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Original user
  original_user_id UUID,
  original_email TEXT,
  
  -- Anonymization details
  anonymization_type TEXT NOT NULL CHECK (anonymization_type IN ('full', 'partial', 'pseudonymization')),
  tables_affected TEXT[] NOT NULL,
  records_affected INTEGER,
  
  -- Method
  anonymization_method TEXT,
  
  -- Trigger
  triggered_by TEXT NOT NULL CHECK (triggered_by IN ('user_request', 'retention_policy', 'manual', 'legal_requirement')),
  triggered_by_admin UUID REFERENCES platform_admins(id),
  
  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'failed')),
  
  -- Reversibility
  is_reversible BOOLEAN DEFAULT FALSE,
  reversal_key TEXT,
  
  -- Timestamps
  anonymized_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_anonymization_log_user ON anonymization_log(original_user_id);
CREATE INDEX idx_anonymization_log_date ON anonymization_log(anonymized_at DESC);

COMMENT ON TABLE anonymization_log IS 'Audit trail of data anonymization';

-- =============================================================================
-- GDPR COMPLIANCE CHECKLIST
-- =============================================================================

CREATE TABLE gdpr_compliance_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Requirement
  article TEXT NOT NULL,
  requirement TEXT NOT NULL,
  description TEXT,
  
  -- Status
  is_compliant BOOLEAN DEFAULT FALSE,
  compliance_notes TEXT,
  
  -- Evidence
  evidence_location TEXT,
  
  -- Review
  last_reviewed_at TIMESTAMP,
  next_review_date DATE,
  reviewed_by UUID REFERENCES platform_admins(id),
  
  -- Priority
  priority INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_gdpr_compliance_article ON gdpr_compliance_checklist(article);
CREATE INDEX idx_gdpr_compliance_status ON gdpr_compliance_checklist(is_compliant);

COMMENT ON TABLE gdpr_compliance_checklist IS 'GDPR compliance tracking';

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_processing_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_breach_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymization_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_compliance_checklist ENABLE ROW LEVEL SECURITY;

-- Export requests: Self manage
CREATE POLICY "Users can manage own export requests" ON data_export_requests
  FOR ALL USING (auth.uid() = user_id);

-- Deletion requests: Self create/read
CREATE POLICY "Users can manage own deletion requests" ON data_deletion_requests
  FOR ALL USING (auth.uid() = user_id);

-- Consent: Self manage
CREATE POLICY "Users can view own consent records" ON consent_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can grant consent" ON consent_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Processing activities: Admins only
CREATE POLICY "Admins can manage processing activities" ON data_processing_activities
  FOR ALL USING (is_platform_admin());

-- Breaches: Admins only
CREATE POLICY "Admins can manage breach incidents" ON data_breach_incidents
  FOR ALL USING (is_platform_admin());

-- Retention policies: Admins only
CREATE POLICY "Admins can manage retention policies" ON data_retention_policies
  FOR ALL USING (is_platform_admin());

-- Anonymization log: Admins only
CREATE POLICY "Admins can view anonymization log" ON anonymization_log
  FOR SELECT USING (is_platform_admin());

-- Compliance checklist: Admins only
CREATE POLICY "Admins can manage compliance checklist" ON gdpr_compliance_checklist
  FOR ALL USING (is_platform_admin());

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_data_export_requests_updated_at
  BEFORE UPDATE ON data_export_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_deletion_requests_updated_at
  BEFORE UPDATE ON data_deletion_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_processing_activities_updated_at
  BEFORE UPDATE ON data_processing_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Generate verification code for export
CREATE OR REPLACE FUNCTION generate_export_verification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_code IS NULL THEN
    NEW.verification_code := encode(gen_random_bytes(4), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_export_code
  BEFORE INSERT ON data_export_requests
  FOR EACH ROW
  EXECUTE FUNCTION generate_export_verification();

-- Set export expiration
CREATE OR REPLACE FUNCTION set_export_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.download_expires_at := NOW() + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_download_expiration
  BEFORE UPDATE ON data_export_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_export_expiration();

-- Log consent changes
CREATE OR REPLACE FUNCTION log_consent_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log to audit trail (admin_audit_logs)
  INSERT INTO admin_audit_logs (
    admin_id,
    action,
    resource_type,
    resource_id,
    changes
  ) VALUES (
    NULL,
    CASE WHEN NEW.is_granted THEN 'consent.granted' ELSE 'consent.revoked' END,
    'consent',
    NEW.id::TEXT,
    jsonb_build_object(
      'user_id', NEW.user_id,
      'consent_type', NEW.consent_type,
      'is_granted', NEW.is_granted
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_consent_changes
  AFTER INSERT OR UPDATE ON consent_records
  FOR EACH ROW
  EXECUTE FUNCTION log_consent_change();
-- Migration: 014_performance_optimizations.sql
-- Purpose: Database optimizations, indexes, partitioning, materialized views
-- Date: 2026-01-21

-- =============================================================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- =============================================================================

-- Daily user engagement summary
CREATE MATERIALIZED VIEW mv_daily_user_engagement AS
SELECT
  user_id,
  DATE(created_at) as date,
  COUNT(DISTINCT session_id) as sessions_count,
  COUNT(*) as events_count,
  COUNT(DISTINCT event_type) as unique_events,
  MIN(created_at) as first_event_at,
  MAX(created_at) as last_event_at
FROM app_telemetry
WHERE user_id IS NOT NULL
GROUP BY user_id, DATE(created_at);

CREATE UNIQUE INDEX idx_mv_daily_user_engagement ON mv_daily_user_engagement(user_id, date);

COMMENT ON MATERIALIZED VIEW mv_daily_user_engagement IS 'Daily user engagement metrics (refresh hourly)';

-- Monthly revenue summary
CREATE MATERIALIZED VIEW mv_monthly_revenue AS
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as transaction_count,
  COUNT(DISTINCT user_id) as unique_customers,
  SUM(amount) as total_revenue,
  AVG(amount) as avg_transaction_value,
  SUM(CASE WHEN transaction_type = 'subscription' THEN amount ELSE 0 END) as subscription_revenue,
  SUM(CASE WHEN transaction_type = 'token_purchase' THEN amount ELSE 0 END) as token_revenue
FROM payment_transactions
WHERE status = 'succeeded'
GROUP BY DATE_TRUNC('month', created_at);

CREATE UNIQUE INDEX idx_mv_monthly_revenue ON mv_monthly_revenue(month);

COMMENT ON MATERIALIZED VIEW mv_monthly_revenue IS 'Monthly revenue breakdown (refresh daily)';

-- Active subscriptions count
CREATE MATERIALIZED VIEW mv_active_subscriptions AS
SELECT
  plan_id,
  COUNT(*) as active_count,
  COUNT(CASE WHEN is_trial THEN 1 END) as trial_count,
  COUNT(CASE WHEN NOT is_trial THEN 1 END) as paid_count,
  SUM(amount_paid) as mrr
FROM user_licenses
WHERE status = 'active'
GROUP BY plan_id;

CREATE UNIQUE INDEX idx_mv_active_subscriptions ON mv_active_subscriptions(plan_id);

COMMENT ON MATERIALIZED VIEW mv_active_subscriptions IS 'Active subscription counts by plan (refresh every 15 min)';

-- Popular knowledge base articles
CREATE MATERIALIZED VIEW mv_popular_kb_articles AS
SELECT
  id,
  title,
  slug,
  category_id,
  view_count,
  helpful_count,
  not_helpful_count,
  CASE 
    WHEN (helpful_count + not_helpful_count) > 0 
    THEN ROUND((helpful_count::NUMERIC / (helpful_count + not_helpful_count)) * 100, 2)
    ELSE NULL
  END as helpfulness_percentage
FROM knowledge_base_articles
WHERE status = 'published'
ORDER BY view_count DESC
LIMIT 100;

CREATE UNIQUE INDEX idx_mv_popular_kb_articles ON mv_popular_kb_articles(id);

COMMENT ON MATERIALIZED VIEW mv_popular_kb_articles IS 'Top 100 KB articles (refresh hourly)';

-- =============================================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- =============================================================================

-- User activity queries
CREATE INDEX idx_app_telemetry_user_event_date ON app_telemetry(user_id, event_type, created_at DESC);
CREATE INDEX idx_user_sessions_active_users ON user_sessions(user_id, started_at DESC) WHERE is_active = TRUE;

-- Billing queries
CREATE INDEX idx_payment_transactions_user_status_date ON payment_transactions(user_id, status, created_at DESC);
CREATE INDEX idx_invoices_user_status_due ON invoices(user_id, status, due_date);

-- License queries
CREATE INDEX idx_user_licenses_user_status_plan ON user_licenses(user_id, status, plan_id);
CREATE INDEX idx_license_activations_active_devices ON license_activations(license_id, is_active) WHERE is_active = TRUE;

-- AI usage queries
CREATE INDEX idx_ai_usage_logs_user_model_date ON ai_usage_logs(user_id, model, created_at DESC);
CREATE INDEX idx_ai_usage_logs_cost_tracking ON ai_usage_logs(user_id, cost_usd, created_at) WHERE cost_usd > 0;

-- Token wallet queries
CREATE INDEX idx_token_usage_logs_wallet_service_date ON token_usage_logs(wallet_id, service, used_at DESC);
CREATE INDEX idx_token_purchases_user_status_date ON token_purchases(user_id, payment_status, purchased_at DESC);

-- Support queries
CREATE INDEX idx_support_tickets_status_priority_date ON support_tickets(status, priority, created_at DESC);
CREATE INDEX idx_support_tickets_user_status ON support_tickets(user_id, status);

-- Notification queries
CREATE INDEX idx_user_notifications_unread ON user_notifications(user_id, is_read, created_at DESC) WHERE is_read = FALSE;
CREATE INDEX idx_email_queue_priority_scheduled ON email_queue(status, priority DESC, scheduled_for) WHERE status = 'pending';

-- =============================================================================
-- PARTITIONING FOR LARGE TABLES
-- =============================================================================

-- Note: If tables grow very large, consider partitioning by month
-- Example for app_telemetry (implement when > 10M rows):

-- CREATE TABLE app_telemetry_2026_01 PARTITION OF app_telemetry
--   FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Create monthly partitions via cron job

-- =============================================================================
-- FUNCTIONS FOR COMMON CALCULATIONS
-- =============================================================================

-- Calculate user MRR
CREATE OR REPLACE FUNCTION calculate_user_mrr(p_user_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_mrr DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(
    CASE 
      WHEN billing_cycle = 'monthly' THEN amount_paid
      WHEN billing_cycle = 'yearly' THEN amount_paid / 12
      ELSE 0
    END
  ), 0)
  INTO v_mrr
  FROM user_licenses
  WHERE user_id = p_user_id
  AND status = 'active';
  
  RETURN v_mrr;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_user_mrr IS 'Calculate monthly recurring revenue for a user';

-- Get user token balance with lock
CREATE OR REPLACE FUNCTION get_token_balance_for_update(p_user_id UUID)
RETURNS BIGINT AS $$
DECLARE
  v_balance BIGINT;
BEGIN
  SELECT token_balance INTO v_balance
  FROM token_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_token_balance_for_update IS 'Get token balance with row lock (prevent race conditions)';

-- Check license validity
CREATE OR REPLACE FUNCTION is_license_valid(p_license_key TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_licenses
    WHERE license_key = p_license_key
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_license_valid IS 'Check if license key is valid and active';

-- Count active devices for license
CREATE OR REPLACE FUNCTION count_active_devices(p_license_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM license_activations
  WHERE license_id = p_license_id
  AND is_active = TRUE;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION count_active_devices IS 'Count active device activations for a license';

-- Calculate user's current period usage
CREATE OR REPLACE FUNCTION get_current_period_usage(p_user_id UUID)
RETURNS TABLE (
  ai_calls INTEGER,
  tokens_used BIGINT,
  conversations INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(ul.ai_calls_used), 0)::INTEGER as ai_calls,
    COALESCE(SUM(ul.tokens_used), 0)::BIGINT as tokens_used,
    COALESCE(SUM(ul.conversations_created), 0)::INTEGER as conversations
  FROM user_licenses ul
  WHERE ul.user_id = p_user_id
  AND ul.status = 'active'
  AND ul.current_period_start <= CURRENT_DATE
  AND ul.current_period_end >= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_current_period_usage IS 'Get user usage for current billing period';

-- =============================================================================
-- AUTOMATED CLEANUP JOBS
-- =============================================================================

-- Clean old telemetry data (> 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_telemetry()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM app_telemetry
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND is_anonymous = TRUE;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_telemetry IS 'Delete anonymous telemetry older than 90 days';

-- Expire old data export files
CREATE OR REPLACE FUNCTION expire_old_export_files()
RETURNS INTEGER AS $$
DECLARE
  v_expired INTEGER;
BEGIN
  UPDATE data_export_requests
  SET status = 'expired',
      export_file_url = NULL
  WHERE status = 'completed'
  AND download_expires_at < NOW();
  
  GET DIAGNOSTICS v_expired = ROW_COUNT;
  RETURN v_expired;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION expire_old_export_files IS 'Expire data export files past download window';

-- Deactivate webhook endpoints with too many failures
CREATE OR REPLACE FUNCTION deactivate_failing_webhooks()
RETURNS INTEGER AS $$
DECLARE
  v_deactivated INTEGER;
BEGIN
  UPDATE api_webhooks
  SET is_active = FALSE
  WHERE consecutive_failures >= 10
  AND is_active = TRUE;
  
  GET DIAGNOSTICS v_deactivated = ROW_COUNT;
  RETURN v_deactivated;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION deactivate_failing_webhooks IS 'Deactivate webhooks with 10+ consecutive failures';

-- Reset daily AI key spend
CREATE OR REPLACE FUNCTION reset_daily_ai_spend()
RETURNS INTEGER AS $$
DECLARE
  v_reset INTEGER;
BEGIN
  UPDATE managed_ai_keys
  SET current_daily_spend_usd = 0
  WHERE current_daily_spend_usd > 0;
  
  GET DIAGNOSTICS v_reset = ROW_COUNT;
  RETURN v_reset;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reset_daily_ai_spend IS 'Reset daily AI spend counters (run at midnight)';

-- =============================================================================
-- REFRESH MATERIALIZED VIEWS FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_user_engagement;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_revenue;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_active_subscriptions;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_popular_kb_articles;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_analytics_views IS 'Refresh all analytics materialized views';

-- =============================================================================
-- DATABASE STATISTICS
-- =============================================================================

CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS TABLE (
  total_users BIGINT,
  active_subscriptions BIGINT,
  total_revenue NUMERIC,
  total_tokens_sold BIGINT,
  total_ai_calls BIGINT,
  open_support_tickets BIGINT,
  pending_exports BIGINT,
  pending_deletions BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM user_profiles)::BIGINT,
    (SELECT COUNT(*) FROM user_licenses WHERE status = 'active')::BIGINT,
    (SELECT COALESCE(SUM(amount), 0) FROM payment_transactions WHERE status = 'succeeded'),
    (SELECT COALESCE(SUM(total_purchased), 0) FROM token_wallets)::BIGINT,
    (SELECT COUNT(*) FROM ai_usage_logs)::BIGINT,
    (SELECT COUNT(*) FROM support_tickets WHERE status IN ('open', 'in_progress'))::BIGINT,
    (SELECT COUNT(*) FROM data_export_requests WHERE status = 'pending')::BIGINT,
    (SELECT COUNT(*) FROM data_deletion_requests WHERE status = 'pending')::BIGINT;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_database_stats IS 'Get key database statistics for dashboard';

-- =============================================================================
-- VACUUM AND ANALYZE SCHEDULE
-- =============================================================================

-- Note: Set up pg_cron extension for automatic maintenance
-- Example cron jobs to add:

-- Daily vacuum analyze on large tables
-- SELECT cron.schedule('daily-vacuum', '0 2 * * *', 'VACUUM ANALYZE app_telemetry, ai_usage_logs, api_usage_logs');

-- Hourly refresh of materialized views
-- SELECT cron.schedule('refresh-views', '0 * * * *', 'SELECT refresh_analytics_views()');

-- Daily cleanup jobs
-- SELECT cron.schedule('cleanup-telemetry', '0 3 * * *', 'SELECT cleanup_old_telemetry()');
-- SELECT cron.schedule('expire-exports', '0 4 * * *', 'SELECT expire_old_export_files()');

-- Midnight resets
-- SELECT cron.schedule('reset-ai-spend', '0 0 * * *', 'SELECT reset_daily_ai_spend()');

-- =============================================================================
-- PERFORMANCE MONITORING
-- =============================================================================

-- Note: pg_stat_statements requires the extension to be enabled
-- Uncomment if pg_stat_statements is available:
-- CREATE OR REPLACE VIEW v_slow_queries AS
-- SELECT query, calls, total_exec_time, mean_exec_time, max_exec_time
-- FROM pg_stat_statements
-- WHERE mean_exec_time > 100
-- ORDER BY mean_exec_time DESC
-- LIMIT 50;

CREATE OR REPLACE VIEW v_table_sizes AS
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

COMMENT ON VIEW v_table_sizes IS 'Table sizes sorted by total size';

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 014 complete - performance optimizations applied';
  RAISE NOTICE 'Materialized views created: 4';
  RAISE NOTICE 'Composite indexes created: 12';
  RAISE NOTICE 'Utility functions created: 10';
  RAISE NOTICE 'Next: Set up pg_cron for automated maintenance';
END $$;
