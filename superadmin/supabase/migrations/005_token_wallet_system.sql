-- Migration: 005_token_wallet_system.sql
-- Purpose: Token credits, purchases, wallet management
-- Date: 2026-01-21

-- =============================================================================
-- TOKEN WALLETS
-- =============================================================================

CREATE TABLE token_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Balance
  token_balance BIGINT DEFAULT 0 CHECK (token_balance >= 0),
  total_purchased BIGINT DEFAULT 0,
  total_used BIGINT DEFAULT 0,
  total_refunded BIGINT DEFAULT 0,
  
  -- Auto-refill
  auto_refill_enabled BOOLEAN DEFAULT FALSE,
  auto_refill_threshold BIGINT DEFAULT 10000,
  refill_amount BIGINT DEFAULT 100000,
  refill_payment_method_id TEXT,
  
  -- Alerts
  low_balance_alert_sent BOOLEAN DEFAULT FALSE,
  low_balance_threshold BIGINT DEFAULT 5000,
  
  -- Status
  is_frozen BOOLEAN DEFAULT FALSE,
  frozen_reason TEXT,
  frozen_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_purchase_at TIMESTAMP,
  last_usage_at TIMESTAMP
);

CREATE INDEX idx_token_wallets_user ON token_wallets(user_id);
CREATE INDEX idx_token_wallets_balance ON token_wallets(token_balance);
CREATE INDEX idx_token_wallets_low_balance ON token_wallets(token_balance) WHERE token_balance < 5000;

COMMENT ON TABLE token_wallets IS 'User token credit wallets';

-- =============================================================================
-- TOKEN PURCHASES
-- =============================================================================

CREATE TABLE token_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES token_wallets(id) ON DELETE CASCADE,
  
  -- Purchase details
  tokens_purchased BIGINT NOT NULL,
  bonus_tokens BIGINT DEFAULT 0,
  total_tokens BIGINT GENERATED ALWAYS AS (tokens_purchased + bonus_tokens) STORED,
  
  -- Pricing
  amount_paid DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  price_per_1k_tokens DECIMAL(10,4),
  discount_code TEXT,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Payment
  payment_provider TEXT NOT NULL,
  payment_id TEXT,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded', 'disputed')),
  
  -- Refund
  refund_id TEXT,
  refund_amount DECIMAL(10,2),
  refund_reason TEXT,
  refunded_at TIMESTAMP,
  
  --  Timestamps
  purchased_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_token_purchases_user ON token_purchases(user_id);
CREATE INDEX idx_token_purchases_wallet ON token_purchases(wallet_id);
CREATE INDEX idx_token_purchases_payment_id ON token_purchases(payment_id);
CREATE INDEX idx_token_purchases_status ON token_purchases(payment_status);
CREATE INDEX idx_token_purchases_date ON token_purchases(purchased_at DESC);

COMMENT ON TABLE token_purchases IS 'Token purchase transactions';

-- =============================================================================
-- TOKEN USAGE LOGS
-- =============================================================================

CREATE TABLE token_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES token_wallets(id) ON DELETE CASCADE,
  
  -- Usage details
  tokens_used INTEGER NOT NULL,
  service TEXT NOT NULL,
  operation TEXT,
  
  -- Balance snapshot
  balance_before BIGINT NOT NULL,
  balance_after BIGINT NOT NULL,
  
  -- Context
  device_id TEXT,
  agent_id TEXT,
  conversation_id UUID,
  
  -- Timestamps
  used_at TIMESTAMP DEFAULT NOW()
);

-- Partition by month for performance
CREATE INDEX idx_token_usage_user_date ON token_usage_logs(user_id, used_at DESC);
CREATE INDEX idx_token_usage_wallet_date ON token_usage_logs(wallet_id, used_at DESC);
CREATE INDEX idx_token_usage_service ON token_usage_logs(service);

COMMENT ON TABLE token_usage_logs IS 'Token consumption audit trail';

-- =============================================================================
-- TOKEN PACKAGES
-- =============================================================================

CREATE TABLE token_packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Tokens
  token_amount BIGINT NOT NULL,
  bonus_percentage INTEGER DEFAULT 0,
  total_tokens BIGINT GENERATED ALWAYS AS (token_amount + (token_amount * bonus_percentage / 100)) STORED,
  
  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  price_per_1k_tokens DECIMAL(10,4) GENERATED ALWAYS AS (price / ((token_amount + (token_amount * bonus_percentage / 100)) / 1000.0)) STORED,
  
  -- Display
  is_popular BOOLEAN DEFAULT FALSE,
  is_best_value BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  badge TEXT,
  
  -- Availability
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_token_packages_active ON token_packages(is_active, display_order);

COMMENT ON TABLE token_packages IS 'Pre-defined token purchase packages';

-- Seed packages
INSERT INTO token_packages (id, name, description, token_amount, bonus_percentage, price, badge) VALUES
('starter', 'Starter', '10K tokens', 10000, 0, 5.00, NULL),
('basic', 'Basic', '100K tokens + 10% bonus', 100000, 10, 45.00, NULL),
('pro', 'Pro', '500K tokens + 20% bonus', 500000, 20, 200.00, 'Popular'),
('premium', 'Premium', '1M tokens + 30% bonus', 1000000, 30, 350.00, 'Best Value'),
('enterprise', 'Enterprise', '5M tokens + 40% bonus', 5000000, 40, 1500.00, 'Enterprise');

-- =============================================================================
-- DISCOUNT CODES
-- =============================================================================

CREATE TABLE discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  
  -- Discount
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'bonus_tokens')),
  discount_value DECIMAL(10,2) NOT NULL,
  
  -- Restrictions
  min_purchase_amount DECIMAL(10,2),
  max_uses INTEGER,
  uses_per_user INTEGER DEFAULT 1,
  applicable_packages TEXT[],
  
  -- Tracking
  times_used INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Validity
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,
  
  -- Metadata
  created_by UUID REFERENCES platform_admins(id),
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_discount_codes_code ON discount_codes(code);
CREATE INDEX idx_discount_codes_active ON discount_codes(is_active, valid_from, valid_until);

COMMENT ON TABLE discount_codes IS 'Promotional discount codes';

-- =============================================================================
-- DISCOUNT USAGE
-- =============================================================================

CREATE TABLE discount_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_id UUID NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_id UUID NOT NULL REFERENCES token_purchases(id) ON DELETE CASCADE,
  
  -- Discount applied
  discount_amount DECIMAL(10,2) NOT NULL,
  
  -- Timestamp
  used_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(discount_id, purchase_id)
);

CREATE INDEX idx_discount_usage_discount ON discount_usage(discount_id);
CREATE INDEX idx_discount_usage_user ON discount_usage(user_id);

COMMENT ON TABLE discount_usage IS 'Discount code usage tracking';

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE token_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_usage ENABLE ROW LEVEL SECURITY;

-- Wallets: self manage
CREATE POLICY "Users can view own wallet" ON token_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet settings" ON token_wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- Purchases: self read, admin all
CREATE POLICY "Users can view own purchases" ON token_purchases
  FOR SELECT USING (auth.uid() = user_id);

-- Usage logs: self read
CREATE POLICY "Users can view own usage" ON token_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Packages: public read
CREATE POLICY "Anyone can view active packages" ON token_packages
  FOR SELECT USING (is_active = TRUE);

-- Discount codes: validated reads only
CREATE POLICY "Active codes viewable" ON discount_codes
  FOR SELECT USING (is_active = TRUE AND NOW() BETWEEN valid_from AND COALESCE(valid_until, 'infinity'));

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_token_wallets_updated_at
  BEFORE UPDATE ON token_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_token_packages_updated_at
  BEFORE UPDATE ON token_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create wallet on user signup
CREATE OR REPLACE FUNCTION create_token_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO token_wallets (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_token_wallet();

-- Update wallet on purchase completion
CREATE OR REPLACE FUNCTION credit_tokens_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'completed' AND OLD.payment_status != 'completed' THEN
    UPDATE token_wallets
    SET 
      token_balance = token_balance + NEW.total_tokens,
      total_purchased = total_purchased + NEW.total_tokens,
      last_purchase_at = NEW.completed_at
    WHERE id = NEW.wallet_id;
    
    NEW.completed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER credit_tokens_trigger
  BEFORE UPDATE ON token_purchases
  FOR EACH ROW
  WHEN (NEW.payment_status = 'completed')
  EXECUTE FUNCTION credit_tokens_on_purchase();

-- Deduct tokens on usage
CREATE OR REPLACE FUNCTION deduct_tokens()
RETURNS TRIGGER AS $$
DECLARE
  current_balance BIGINT;
BEGIN
  -- Get and lock wallet
  SELECT token_balance INTO current_balance
  FROM token_wallets
  WHERE id = NEW.wallet_id
  FOR UPDATE;
  
  -- Check sufficient balance
  IF current_balance < NEW.tokens_used THEN
    RAISE EXCEPTION 'Insufficient token balance';
  END IF;
  
  -- Set before balance
  NEW.balance_before := current_balance;
  NEW.balance_after := current_balance - NEW.tokens_used;
  
  -- Update wallet
  UPDATE token_wallets
  SET 
    token_balance = token_balance - NEW.tokens_used,
    total_used = total_used + NEW.tokens_used,
    last_usage_at = NEW.used_at
  WHERE id = NEW.wallet_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deduct_tokens_trigger
  BEFORE INSERT ON token_usage_logs
  FOR EACH ROW
  EXECUTE FUNCTION deduct_tokens();
