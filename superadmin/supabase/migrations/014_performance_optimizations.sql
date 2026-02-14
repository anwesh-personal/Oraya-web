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
