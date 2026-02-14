-- Migration: 003_user_profiles.sql
-- Purpose: User profiles and preferences (extends Supabase Auth)
-- Date: 2026-01-21

-- =============================================================================
-- USER PROFILES
-- =============================================================================

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identity
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  
  -- Preferences
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'auto')),
  
  -- Communication
  email_notifications_enabled BOOLEAN DEFAULT TRUE,
  marketing_emails_enabled BOOLEAN DEFAULT FALSE,
  
  -- Status
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'cancelled', 'deleted')),
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  
  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 0,
  onboarding_data JSONB DEFAULT '{}',
  
  -- Activity
  last_seen_at TIMESTAMP,
  desktop_app_version TEXT,
  
  -- Referrals
  referred_by UUID REFERENCES user_profiles(id),
  referral_code TEXT UNIQUE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_status ON user_profiles(account_status);
CREATE INDEX idx_user_profiles_referral ON user_profiles(referral_code);
CREATE INDEX idx_user_profiles_last_seen ON user_profiles(last_seen_at DESC);

COMMENT ON TABLE user_profiles IS 'Extended user data beyond Supabase Auth';

-- =============================================================================
-- REFERRAL SYSTEM
-- =============================================================================

CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who referred whom
  referrer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  
  -- Rewards
  referrer_reward_tokens BIGINT DEFAULT 0,
  referred_reward_tokens BIGINT DEFAULT 0,
  reward_given_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(referrer_id, referred_id)
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_id);

COMMENT ON TABLE referrals IS 'User referral tracking and rewards';

-- =============================================================================
-- USER PREFERENCES
-- =============================================================================

CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- App behavior
  auto_save_enabled BOOLEAN DEFAULT TRUE,
  compact_mode BOOLEAN DEFAULT FALSE,
  show_tips BOOLEAN DEFAULT TRUE,
  
  -- Privacy
  telemetry_enabled BOOLEAN DEFAULT TRUE,
  share_usage_data BOOLEAN DEFAULT FALSE,
  
  -- Notifications
  desktop_notifications BOOLEAN DEFAULT TRUE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  
  -- AI preferences
  default_model TEXT,
  default_voice TEXT,
  ai_personality TEXT DEFAULT 'balanced',  -- 'creative', 'balanced', 'precise'
  
  -- Advanced
  developer_mode BOOLEAN DEFAULT FALSE,
  beta_features_enabled BOOLEAN DEFAULT FALSE,
  
  -- Custom settings (JSON for flexibility)
  custom_settings JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE user_preferences IS 'Granular user preferences for desktop app';

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can view own referrals
CREATE POLICY "Users can view own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Users can manage own preferences
CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Platform admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (is_platform_admin());

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email_verified)
  VALUES (
    NEW.id,
    NEW.email_confirmed_at IS NOT NULL
  );
  
  -- Also create preferences
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Generate referral code on profile creation
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := encode(gen_random_bytes(6), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_user_referral_code
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();
