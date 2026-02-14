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
