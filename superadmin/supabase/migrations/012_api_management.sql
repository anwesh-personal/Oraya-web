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
