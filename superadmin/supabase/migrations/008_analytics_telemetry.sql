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
