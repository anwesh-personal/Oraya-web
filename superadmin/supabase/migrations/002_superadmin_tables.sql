-- Migration: 002_superadmin_tables.sql
-- Purpose: Superadmin platform management tables
-- Date: 2026-01-21
-- CRITICAL: These tables are ONLY accessible to superadmins

-- =============================================================================
-- SUPERADMIN USERS
-- =============================================================================

CREATE TABLE platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Links to Supabase auth.users
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identity
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  
  -- Access Level
  role TEXT DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'support', 'readonly')),
  permissions JSONB DEFAULT '{}',  -- Granular permissions
  
  -- Security
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  
  -- Audit
  created_by UUID REFERENCES platform_admins(id),
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_platform_admins_user ON platform_admins(user_id);
CREATE INDEX idx_platform_admins_role ON platform_admins(role);
CREATE INDEX idx_platform_admins_active ON platform_admins(is_active);

COMMENT ON TABLE platform_admins IS 'Superadmin users who manage the platform';
COMMENT ON COLUMN platform_admins.role IS 'superadmin: full access, admin: most access, support: limited, readonly: view only';

-- =============================================================================
-- PLATFORM SETTINGS
-- =============================================================================

CREATE TABLE platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  category TEXT DEFAULT 'general',
  description TEXT,
  is_sensitive BOOLEAN DEFAULT FALSE,  -- Hide from logs
  
  -- Audit
  updated_by UUID REFERENCES platform_admins(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_platform_settings_category ON platform_settings(category);

COMMENT ON TABLE platform_settings IS 'Global platform configuration (feature flags, limits, etc.)';

-- Seed default settings
INSERT INTO platform_settings (key, value, category, description) VALUES
('platform.name', '"Oraya"', 'branding', 'Platform name'),
('platform.maintenance_mode', 'false', 'system', 'Enable maintenance mode'),
('platform.new_signups_enabled', 'true', 'system', 'Allow new user registrations'),
('platform.max_free_users', '10000', 'limits', 'Maximum free tier users'),
('platform.default_trial_days', '14', 'licensing', 'Trial period in days'),
('ai.default_provider', '"openai"', 'ai', 'Default AI provider'),
('ai.rate_limit_per_minute', '60', 'ai', 'Max AI calls per minute per user'),
('billing.stripe_enabled', 'true', 'billing', 'Enable Stripe payments'),
('support.email', '"support@oraya.ai"', 'support', 'Support email address');

-- =============================================================================
-- AUDIT LOGS
-- =============================================================================

CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who
  admin_id UUID REFERENCES platform_admins(id) ON DELETE SET NULL,
  admin_email TEXT,  -- Denormalized for deleted admins
  
  -- What
  action TEXT NOT NULL,  -- 'user.suspend', 'license.revoke', 'settings.update'
  resource_type TEXT,    -- 'user', 'license', 'plan'
  resource_id TEXT,      -- UUID of affected resource
  
  -- Details
  changes JSONB,         -- Before/after values
  metadata JSONB DEFAULT '{}',
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Partition by month for performance
CREATE INDEX idx_admin_audit_logs_admin_date ON admin_audit_logs(admin_id, created_at DESC);
CREATE INDEX idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX idx_admin_audit_logs_resource ON admin_audit_logs(resource_type, resource_id);
CREATE INDEX idx_admin_audit_logs_created ON admin_audit_logs(created_at DESC);

COMMENT ON TABLE admin_audit_logs IS 'Audit trail of all superadmin actions';

-- =============================================================================
-- PLATFORM ANALYTICS
-- =============================================================================

CREATE TABLE platform_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Metric
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,  -- 'count', 'usd', 'seconds'
  
  -- Dimensions
  dimensions JSONB DEFAULT '{}',  -- {'plan': 'pro', 'region': 'us-east'}
  
  -- Time
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  granularity TEXT DEFAULT 'hour' CHECK (granularity IN ('minute', 'hour', 'day', 'month')),
  
  -- Timestamps
  recorded_at TIMESTAMP DEFAULT NOW(),
  
  -- Prevent duplicates
  UNIQUE(metric_name, period_start, dimensions)
);

CREATE INDEX idx_platform_metrics_name_time ON platform_metrics(metric_name, period_start DESC);
CREATE INDEX idx_platform_metrics_period ON platform_metrics(period_start, period_end);

COMMENT ON TABLE platform_metrics IS 'Aggregated platform metrics for dashboards';

-- Example metrics to track:
-- - 'users.active.count'
-- - 'revenue.monthly.usd'
-- - 'ai_calls.total.count'
-- - 'tokens.consumed.count'

-- =============================================================================
-- FEATURE FLAGS
-- =============================================================================

CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Feature
  feature_key TEXT UNIQUE NOT NULL,
  feature_name TEXT NOT NULL,
  description TEXT,
  
  -- Status
  is_enabled BOOLEAN DEFAULT FALSE,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
  
  -- Targeting
  enabled_for_plans TEXT[] DEFAULT '{}',  -- ['pro', 'enterprise']
  enabled_for_users UUID[] DEFAULT '{}',  -- Specific user IDs
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'general',
  
  -- Audit
  updated_by UUID REFERENCES platform_admins(id),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feature_flags_key ON feature_flags(feature_key);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(is_enabled);

COMMENT ON TABLE feature_flags IS 'Feature flags for gradual rollouts and A/B testing';

-- Seed feature flags
INSERT INTO feature_flags (feature_key, feature_name, description, is_enabled) VALUES
('managed_ai_service', 'Managed AI Service', 'Allow users to use Oraya AI API', true),
('team_accounts', 'Team Accounts', 'Enable team collaboration features', false),
('voice_mode', 'Voice Mode', 'Voice input/output for agents', true),
('memory_sync', 'Memory Sync', 'Sync memories across devices (future)', false),
('advanced_analytics', 'Advanced Analytics', 'Detailed usage analytics for pro users', true);

-- =============================================================================
-- SYSTEM HEALTH
-- =============================================================================

CREATE TABLE system_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Service
  service_name TEXT NOT NULL,  -- 'supabase', 'vercel', 'stripe', 'openai'
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
  
  -- Metrics
  response_time_ms INTEGER,
  error_rate NUMERIC,
  details JSONB,
  
  -- Timestamps
  checked_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_system_health_service_time ON system_health_checks(service_name, checked_at DESC);

COMMENT ON TABLE system_health_checks IS 'Service health monitoring for status page';

-- =============================================================================
-- SUPERADMIN NOTIFICATIONS
-- =============================================================================

CREATE TABLE admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Target
  admin_id UUID REFERENCES platform_admins(id) ON DELETE CASCADE,
  
  -- Notification
  type TEXT NOT NULL,  -- 'alert', 'warning', 'info'
  title TEXT NOT NULL,
  message TEXT,
  action_url TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  -- Priority
  priority INTEGER DEFAULT 0,  -- Higher = more urgent
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX idx_admin_notifications_admin ON admin_notifications(admin_id);
CREATE INDEX idx_admin_notifications_unread ON admin_notifications(admin_id, is_read) WHERE is_read = FALSE;

COMMENT ON TABLE admin_notifications IS 'Notifications for superadmin dashboard (alerts, warnings, etc.)';

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all superadmin tables
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if current user is a platform admin
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM platform_admins
    WHERE user_id = auth.uid()
    AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Check admin role
CREATE OR REPLACE FUNCTION has_admin_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM platform_admins
    WHERE user_id = auth.uid()
    AND is_active = TRUE
    AND (
      role = required_role
      OR role = 'superadmin'  -- Superadmin has all roles
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies: Only platform admins can access these tables

-- platform_admins
CREATE POLICY "Platform admins can view all admins" ON platform_admins
  FOR SELECT USING (is_platform_admin());

CREATE POLICY "Superadmins can manage admins" ON platform_admins
  FOR ALL USING (has_admin_role('superadmin'));

-- platform_settings
CREATE POLICY "Platform admins can view settings" ON platform_settings
  FOR SELECT USING (is_platform_admin());

CREATE POLICY "Admins can update settings" ON platform_settings
  FOR UPDATE USING (has_admin_role('admin'));

-- admin_audit_logs
CREATE POLICY "Platform admins can view audit logs" ON admin_audit_logs
  FOR SELECT USING (is_platform_admin());

CREATE POLICY "System can insert audit logs" ON admin_audit_logs
  FOR INSERT WITH CHECK (TRUE);  -- Allow system to log

-- platform_metrics
CREATE POLICY "Platform admins can view metrics" ON platform_metrics
  FOR SELECT USING (is_platform_admin());

-- feature_flags
CREATE POLICY "Platform admins can view feature flags" ON feature_flags
  FOR SELECT USING (is_platform_admin());

CREATE POLICY "Admins can manage feature flags" ON feature_flags
  FOR ALL USING (has_admin_role('admin'));

-- system_health_checks
CREATE POLICY "Platform admins can view health checks" ON system_health_checks
  FOR SELECT USING (is_platform_admin());

-- admin_notifications
CREATE POLICY "Admins can view own notifications" ON admin_notifications
  FOR SELECT USING (admin_id = (
    SELECT id FROM platform_admins WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can update own notifications" ON admin_notifications
  FOR UPDATE USING (admin_id = (
    SELECT id FROM platform_admins WHERE user_id = auth.uid()
  ));

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_platform_admins_updated_at
  BEFORE UPDATE ON platform_admins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SEED SUPERADMIN USER
-- =============================================================================

-- NOTE: You must create this user in Supabase Auth first, then insert here
-- Example:
-- INSERT INTO platform_admins (user_id, email, full_name, role)
-- VALUES (
--   'your-supabase-user-uuid',
--   'anweshrath@gmail.com',
--   'Anwesh Rath',
--   'superadmin'
-- );

COMMENT ON TABLE platform_admins IS 
'IMPORTANT: Create user in Supabase Auth first, then link here. 
Password must be set in Supabase Auth dashboard.';
