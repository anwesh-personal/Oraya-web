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
