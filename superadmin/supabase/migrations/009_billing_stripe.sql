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
