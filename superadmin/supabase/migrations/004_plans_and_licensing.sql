-- Migration: 004_plans_and_licensing.sql
-- Purpose: Subscription plans, user licenses, device activations
-- Date: 2026-01-21

-- =============================================================================
-- SUBSCRIPTION PLANS
-- =============================================================================

CREATE TABLE plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Pricing
  price_monthly DECIMAL(10,2) DEFAULT 0,
  price_yearly DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  
  -- Limits
  max_agents INTEGER DEFAULT 1,
  max_conversations_per_month INTEGER DEFAULT 50,
  max_ai_calls_per_month INTEGER DEFAULT 1000,
  max_token_usage_per_month BIGINT DEFAULT 100000,
  max_devices INTEGER DEFAULT 1,
  
  -- Features
  features JSONB DEFAULT '[]',
  
  -- Availability
  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT TRUE,
  
  -- Display
  display_order INTEGER DEFAULT 0,
  badge TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_plans_active ON plans(is_active);
CREATE INDEX idx_plans_public ON plans(is_public);

COMMENT ON TABLE plans IS 'Subscription plan tiers';

-- Seed plans
INSERT INTO plans (id, name, description, price_monthly, price_yearly, max_agents, max_devices, features) VALUES
('free', 'Free', 'Perfect for trying Oraya', 0, 0, 1, 1, '["local_ai_only", "single_device"]'),
('pro', 'Pro', 'For power users', 19.99, 199.99, 3, 3, '["managed_ai", "priority_support", "advanced_analytics", "multi_device"]'),
('team', 'Team', 'For small teams', 49.99, 499.99, 10, 5, '["managed_ai", "team_sync", "shared_agents", "priority_support", "unlimited_devices"]'),
('enterprise', 'Enterprise', 'Custom solutions', NULL, NULL, -1, -1, '["everything", "custom_deployment", "dedicated_support", "sla", "premium_security"]');

-- =============================================================================
-- USER LICENSES
-- =============================================================================

CREATE TABLE user_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  
  -- License details
  license_key TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'suspended', 'payment_failed')),
  
  -- Billing
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime', 'trial')),
  next_billing_date DATE,
  amount_paid DECIMAL(10,2),
  payment_method TEXT,
  stripe_subscription_id TEXT,
  
  -- Trial
  is_trial BOOLEAN DEFAULT FALSE,
  trial_ends_at TIMESTAMP,
  trial_converted BOOLEAN DEFAULT FALSE,
  
  -- Usage tracking
  current_period_start DATE DEFAULT CURRENT_DATE,
  current_period_end DATE,
  ai_calls_used INTEGER DEFAULT 0,
  tokens_used BIGINT DEFAULT 0,
  conversations_created INTEGER DEFAULT 0,
  
  -- Limits
  usage_limit_reached BOOLEAN DEFAULT FALSE,
  limit_reset_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  activated_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  expires_at TIMESTAMP,
  
  UNIQUE(user_id, plan_id)
);

CREATE INDEX idx_user_licenses_user ON user_licenses(user_id);
CREATE INDEX idx_user_licenses_key ON user_licenses(license_key);
CREATE INDEX idx_user_licenses_status ON user_licenses(status);
CREATE INDEX idx_user_licenses_next_billing ON user_licenses(next_billing_date) WHERE status = 'active';
CREATE INDEX idx_user_licenses_trial_end ON user_licenses(trial_ends_at) WHERE is_trial = TRUE;

COMMENT ON TABLE user_licenses IS 'Active user subscriptions and licenses';

-- =============================================================================
-- LICENSE ACTIVATIONS
-- =============================================================================

CREATE TABLE license_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES user_licenses(id) ON DELETE CASCADE,
  
  -- Device info
  device_id TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT,
  platform TEXT,
  platform_version TEXT,
  app_version TEXT,
  
  -- Network
  ip_address INET,
  user_agent TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_seen_at TIMESTAMP DEFAULT NOW(),
  heartbeat_interval INTEGER DEFAULT 3600,
  
  -- Timestamps
  activated_at TIMESTAMP DEFAULT NOW(),
  deactivated_at TIMESTAMP,
  deactivated_reason TEXT,
  
  UNIQUE(license_id, device_id)
);

CREATE INDEX idx_license_activations_license ON license_activations(license_id);
CREATE INDEX idx_license_activations_device ON license_activations(device_id);
CREATE INDEX idx_license_activations_active ON license_activations(is_active, last_seen_at);

COMMENT ON TABLE license_activations IS 'Device activations for licenses';

-- =============================================================================
-- LICENSE USAGE EVENTS
-- =============================================================================

CREATE TABLE license_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES user_licenses(id) ON DELETE CASCADE,
  device_id TEXT,
  
  -- Event details
  event_type TEXT NOT NULL,
  usage_count INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_license_usage_license_date ON license_usage_events(license_id, created_at DESC);
CREATE INDEX idx_license_usage_type ON license_usage_events(event_type);

COMMENT ON TABLE license_usage_events IS 'Usage tracking events for billing';

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_usage_events ENABLE ROW LEVEL SECURITY;

-- Plans: public read, admin write
CREATE POLICY "Anyone can view public plans" ON plans
  FOR SELECT USING (is_public = TRUE OR is_platform_admin());

CREATE POLICY "Admins can manage plans" ON plans
  FOR ALL USING (is_platform_admin());

-- Licenses: self read, admin all
CREATE POLICY "Users can view own licenses" ON user_licenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all licenses" ON user_licenses
  FOR SELECT USING (is_platform_admin());

-- Activations: self read, admin all
CREATE POLICY "Users can view own activations" ON license_activations
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM user_licenses WHERE id = license_id)
  );

CREATE POLICY "Users can deactivate own devices" ON license_activations
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM user_licenses WHERE id = license_id)
  );

-- Usage events: self read
CREATE POLICY "Users can view own usage" ON license_usage_events
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM user_licenses WHERE id = license_id)
  );

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_licenses_updated_at
  BEFORE UPDATE ON user_licenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Generate license key
CREATE OR REPLACE FUNCTION generate_license_key()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.license_key IS NULL THEN
    NEW.license_key := 'ORA-' || upper(encode(gen_random_bytes(12), 'hex'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_user_license_key
  BEFORE INSERT ON user_licenses
  FOR EACH ROW
  EXECUTE FUNCTION generate_license_key();

-- Auto-set period dates
CREATE OR REPLACE FUNCTION set_license_period()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.billing_cycle = 'monthly' THEN
    NEW.current_period_end := NEW.current_period_start + INTERVAL '1 month';
    NEW.next_billing_date := NEW.current_period_start + INTERVAL '1 month';
  ELSIF NEW.billing_cycle = 'yearly' THEN
    NEW.current_period_end := NEW.current_period_start + INTERVAL '1 year';
    NEW.next_billing_date := NEW.current_period_start + INTERVAL '1 year';
  ELSIF NEW.billing_cycle = 'trial' THEN
    NEW.trial_ends_at := NOW() + INTERVAL '14 days';
    NEW.current_period_end := NOW() + INTERVAL '14 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_license_period
  BEFORE INSERT ON user_licenses
  FOR EACH ROW
  EXECUTE FUNCTION set_license_period();
