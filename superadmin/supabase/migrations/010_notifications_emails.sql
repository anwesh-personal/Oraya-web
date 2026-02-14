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
