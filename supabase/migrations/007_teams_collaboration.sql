-- Migration: 007_teams_collaboration.sql
-- Purpose: Team accounts, members, permissions, shared resources
-- Date: 2026-01-21

-- =============================================================================
-- TEAMS
-- =============================================================================

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  avatar_url TEXT,
  
  -- Ownership
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT REFERENCES plans(id),
  
  -- Limits
  max_members INTEGER DEFAULT 5,
  max_agents INTEGER DEFAULT 10,
  max_shared_conversations INTEGER DEFAULT 100,
  
  -- Billing
  billing_email TEXT,
  billing_user_id UUID REFERENCES auth.users(id),
  
  -- Settings
  settings JSONB DEFAULT '{}',
  
  -- Features
  shared_token_pool BOOLEAN DEFAULT FALSE,
  shared_ai_keys BOOLEAN DEFAULT FALSE,
  member_can_invite BOOLEAN DEFAULT FALSE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  suspended_at TIMESTAMP,
  suspension_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_teams_owner ON teams(owner_id);
CREATE INDEX idx_teams_slug ON teams(slug);
CREATE INDEX idx_teams_active ON teams(is_active);

COMMENT ON TABLE teams IS 'Team accounts for collaboration';

-- =============================================================================
-- TEAM MEMBERS
-- =============================================================================

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Role
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'guest')),
  
  -- Permissions
  can_manage_members BOOLEAN DEFAULT FALSE,
  can_manage_billing BOOLEAN DEFAULT FALSE,
  can_create_agents BOOLEAN DEFAULT TRUE,
  can_share_conversations BOOLEAN DEFAULT TRUE,
  can_use_team_tokens BOOLEAN DEFAULT TRUE,
  custom_permissions JSONB DEFAULT '{}',
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('invited', 'active', 'suspended', 'left')),
  
  -- Invitation
  invited_by UUID REFERENCES auth.users(id),
  invitation_token TEXT UNIQUE,
  invitation_sent_at TIMESTAMP,
  invitation_accepted_at TIMESTAMP,
  invitation_expires_at TIMESTAMP,
  
  -- Activity
  last_active_at TIMESTAMP,
  
  -- Timestamps
  joined_at TIMESTAMP,
  left_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_role ON team_members(team_id, role);
CREATE INDEX idx_team_members_status ON team_members(status);
CREATE INDEX idx_team_members_invitation ON team_members(invitation_token) WHERE status = 'invited';

COMMENT ON TABLE team_members IS 'Team membership and permissions';

-- =============================================================================
-- TEAM INVITATIONS LOG
-- =============================================================================

CREATE TABLE team_invitation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Status
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'accepted', 'declined', 'expired', 'revoked')),
  
  -- Details
  role TEXT NOT NULL,
  message TEXT,
  
  -- Timestamps
  sent_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX idx_team_invitation_log_team ON team_invitation_log(team_id);
CREATE INDEX idx_team_invitation_log_email ON team_invitation_log(invited_email);

COMMENT ON TABLE team_invitation_log IS 'Team invitation audit trail';

-- =============================================================================
-- TEAM SHARED RESOURCES
-- =============================================================================

CREATE TABLE team_shared_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Agent info (stored locally, this is just metadata)
  agent_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  shared_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Access control
  access_level TEXT DEFAULT 'view' CHECK (access_level IN ('view', 'use', 'edit')),
  allowed_members UUID[] DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  shared_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  
  UNIQUE(team_id, agent_id)
);

CREATE INDEX idx_team_shared_agents_team ON team_shared_agents(team_id);

COMMENT ON TABLE team_shared_agents IS 'Agents shared within team';

-- =============================================================================
-- TEAM TOKEN POOL
-- =============================================================================

CREATE TABLE team_token_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Balance
  token_balance BIGINT DEFAULT 0 CHECK (token_balance >= 0),
  total_purchased BIGINT DEFAULT 0,
  total_used BIGINT DEFAULT 0,
  
  -- Per-member limits
  per_member_daily_limit BIGINT,
  per_member_monthly_limit BIGINT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_purchase_at TIMESTAMP,
  last_usage_at TIMESTAMP
);

CREATE INDEX idx_team_token_pools_team ON team_token_pools(team_id);

COMMENT ON TABLE team_token_pools IS 'Shared token pool for teams';

-- =============================================================================
-- TEAM MEMBER TOKEN USAGE
-- =============================================================================

CREATE TABLE team_member_token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Usage
  tokens_used BIGINT NOT NULL,
  service TEXT NOT NULL,
  
  -- Period tracking
  usage_date DATE DEFAULT CURRENT_DATE,
  
  -- Timestamps
  used_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_team_member_usage_team_user ON team_member_token_usage(team_id, user_id, usage_date);

COMMENT ON TABLE team_member_token_usage IS 'Per-member token usage tracking';

-- =============================================================================
-- TEAM ACTIVITY LOG
-- =============================================================================

CREATE TABLE team_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Activity
  activity_type TEXT NOT NULL,
  activity_description TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_team_activity_team_date ON team_activity_log(team_id, created_at DESC);
CREATE INDEX idx_team_activity_type ON team_activity_log(activity_type);

COMMENT ON TABLE team_activity_log IS 'Team activity audit trail';

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_shared_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_token_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_member_token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_activity_log ENABLE ROW LEVEL SECURITY;

-- Helper: Check if user is team member
CREATE OR REPLACE FUNCTION is_team_member(team_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = team_uuid
    AND user_id = auth.uid()
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Check if user is team admin
CREATE OR REPLACE FUNCTION is_team_admin(team_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = team_uuid
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Teams: Members can view
CREATE POLICY "Team members can view team" ON teams
  FOR SELECT USING (is_team_member(id));

-- Team admins can update
CREATE POLICY "Team admins can update team" ON teams
  FOR UPDATE USING (is_team_admin(id));

-- Members: View team members
CREATE POLICY "Team members can view members" ON team_members
  FOR SELECT USING (is_team_member(team_id));

-- Admins can manage members
CREATE POLICY "Team admins can manage members" ON team_members
  FOR ALL USING (is_team_admin(team_id));

-- Shared agents: Members can view
CREATE POLICY "Team members can view shared agents" ON team_shared_agents
  FOR SELECT USING (is_team_member(team_id));

-- Token pool: Members can view
CREATE POLICY "Team members can view token pool" ON team_token_pools
  FOR SELECT USING (is_team_member(team_id));

-- Activity log: Members can view
CREATE POLICY "Team members can view activity" ON team_activity_log
  FOR SELECT USING (is_team_member(team_id));

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create token pool for team
CREATE OR REPLACE FUNCTION create_team_token_pool()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.shared_token_pool = TRUE THEN
    INSERT INTO team_token_pools (team_id)
    VALUES (NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_team_created_token_pool
  AFTER INSERT ON teams
  FOR EACH ROW
  EXECUTE FUNCTION create_team_token_pool();

-- Generate invitation token
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'invited' AND NEW.invitation_token IS NULL THEN
    NEW.invitation_token := encode(gen_random_bytes(32), 'base64');
    NEW.invitation_expires_at := NOW() + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_team_invitation_token
  BEFORE INSERT ON team_members
  FOR EACH ROW
  WHEN (NEW.status = 'invited')
  EXECUTE FUNCTION generate_invitation_token();

-- Log team activity
CREATE OR REPLACE FUNCTION log_team_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO team_activity_log (team_id, user_id, activity_type, activity_description)
    VALUES (
      NEW.team_id,
      NEW.user_id,
      'member_joined',
      'Member joined the team'
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'left' THEN
    INSERT INTO team_activity_log (team_id, user_id, activity_type, activity_description)
    VALUES (
      NEW.team_id,
      NEW.user_id,
      'member_left',
      'Member left the team'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_member_changes
  AFTER INSERT OR UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION log_team_activity();
