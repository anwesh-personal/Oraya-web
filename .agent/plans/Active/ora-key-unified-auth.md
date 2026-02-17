# ORA Key — Unified Auth & API Key Architecture

> **Status:** Active — Planning  
> **Created:** 2026-02-18  
> **Priority:** High  
> **Scope:** Cross-project (Oraya Desktop + Oraya SaaS + Superadmin)

---

## 1. Executive Summary

Replace the current email-only login flow with a unified **ORA Key** system where every Oraya user receives a branded key (`ORA-XXXX-XXXX-XXXX-XXXX`) that serves three purposes:

1. **Device Activation** — one-time setup when installing the desktop app on a new machine
2. **API Access** — master API key for third-party integrations, webhooks, SDKs
3. **User Identity** — the user's visible, branded Oraya identifier

Daily login remains **email + password** with **"Remember Me"** and **biometric (Touch ID / Face ID)** for convenience. The ORA key is NOT used for daily login — it's a one-time device activation credential and a persistent API key.

---

## 2. Auth Flow — Complete User Journey

### 2.1 Signup (Web — oraya.ai)

```
User visits oraya.ai/signup
  → Enters email + password
  → Supabase Auth creates the user (auth.users)
  → Trigger creates user_profiles row
  → Trigger generates ORA Key: ORA-XXXX-XXXX-XXXX-XXXX
  → User sees their dashboard with ORA Key displayed prominently
  → "Copy your ORA Key to activate the desktop app"
```

### 2.2 First Launch (Desktop App — Device Activation)

```
User opens Oraya desktop app for the first time
  → Screen 1: "Welcome to Oraya"
  │   Enter your ORA Key: [ORA-________________]
  │   [Activate This Device]
  │   
  │   "Don't have a key? Sign up at oraya.ai"
  │
  → App sends: POST /api/license/activate-device
  │   Body: { ora_key: "ORA-XXXX-...", device_id, device_name, platform }
  │   
  → Server validates:
  │   ✓ Key exists and is active
  │   ✓ User's plan allows another device (check max_devices)
  │   ✓ Device not already activated
  │   
  → Server returns:
  │   { user_email, user_name, plan, features, limits, device_activation_id }
  │
  → Screen 2: "Device Activated! Now sign in"
  │   Email: [anwesh@oraya.ai]  ← pre-filled from activation
  │   Password: [________________]
  │   ☑ Remember me
  │   ☑ Enable Touch ID / Face ID
  │   [Sign In]
  │
  → App authenticates via Supabase Auth (email + password)
  → If "Remember me" → stores refresh token in OS keychain
  → If biometric → stores credentials in Secure Enclave
  → App transitions to main UI
```

### 2.3 Daily Use (Desktop App — Returning User)

```
Scenario A: "Remember me" was ON
  → App starts → reads refresh token from keychain
  → Silent token refresh via Supabase
  → User sees app immediately (no login screen)

Scenario B: Biometric enabled
  → App starts → shows "Unlock with Touch ID" 
  → Biometric verified → retrieves credentials from Secure Enclave
  → Auto-login via Supabase Auth
  → User sees app immediately

Scenario C: Neither enabled (manual login)
  → App starts → login screen
  → Email (pre-filled, saved from activation) + Password
  → [Sign In]

Scenario D: Session expired + "Remember me" was ON
  → Refresh token has expired (e.g., after 30 days of inactivity)
  → Falls back to Scenario B or C
  → Device is STILL activated — no need to re-enter ORA key

Scenario E: Plan expired / suspended
  → App enters degraded mode
  → Local features available (local LLM, local agents)
  → Cloud features disabled
  → Banner: "Your plan has expired. Visit oraya.ai to renew"
  → This already works in the existing architecture
```

### 2.4 API Access (Third-Party Integrations)

```
External app wants to use Oraya's API:

  curl https://api.oraya.ai/v1/agents \
    -H "Authorization: Bearer ORA-7F2A-B9C1-E4D8-3A6F"

Server middleware:
  → Extract ORA key from Authorization header
  → Look up: ora_keys.key → user_id → user_licenses → plan
  → Check rate limits based on plan
  → Check feature access based on plan
  → Execute request
  → Log usage (ai_calls_used, tokens_used)
```

---

## 3. ORA Key Specification

### 3.1 Format

```
ORA-XXXX-XXXX-XXXX-XXXX

Where X = uppercase alphanumeric (A-Z, 0-9)
Excluding ambiguous characters: 0, O, I, L, 1

Total entropy: 16 chars × log2(32) = 80 bits
(More than enough for a user-facing key)

Examples:
  ORA-7F2A-B9C1-E4D8-3A6F
  ORA-KR5N-WX8T-PQ4M-YJ2V
  ORA-DH6G-ZS3E-UC9B-NF7A
```

### 3.2 Storage

```sql
-- The key lives in user_profiles (always present, 1:1 with user)
ALTER TABLE user_profiles
  ADD COLUMN ora_key TEXT UNIQUE NOT NULL;

-- Index for fast lookups
CREATE UNIQUE INDEX idx_user_profiles_ora_key ON user_profiles(ora_key);

-- The old license_key in user_licenses becomes DEPRECATED
-- (keep for backward compat, stop generating new ones)
```

### 3.3 Generation

```sql
-- Trigger: auto-generate ORA key on user_profiles INSERT
CREATE OR REPLACE FUNCTION generate_ora_key()
RETURNS TRIGGER AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    key TEXT := 'ORA-';
    i INT;
    group_count INT := 0;
BEGIN
    IF NEW.ora_key IS NULL THEN
        FOR i IN 1..16 LOOP
            key := key || substr(chars, floor(random() * length(chars) + 1)::int, 1);
            group_count := group_count + 1;
            IF group_count = 4 AND i < 16 THEN
                key := key || '-';
                group_count := 0;
            END IF;
        END LOOP;
        NEW.ora_key := key;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_ora_key
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_ora_key();
```

### 3.4 Key Lifecycle

| Event | What Happens |
|---|---|
| **User signs up** | ORA key auto-generated, shown on dashboard |
| **User regenerates key** | Old key revoked, ALL devices deactivated, new key issued |
| **Superadmin revokes key** | Key invalidated, all devices kicked, user must get new key |
| **User deleted** | Key deleted (cascade) |
| **Key compromised** | User or admin regenerates → all sessions/devices invalidated |

---

## 4. Security Model

### 4.1 Security Layers

```
Layer 1: ORA Key
  Purpose: Device activation + API access
  When used: Once per device (activation), always for API calls
  Stored: OS Keychain (desktop), hashed in DB (server)
  Risk: If leaked, attacker can activate a device and make API calls
  Mitigation: Can be regenerated (revokes all devices + API access)

Layer 2: Email + Password
  Purpose: User authentication (proving identity)
  When used: First login after activation, login after session expiry
  Stored: Supabase Auth (bcrypt hashed)
  Risk: Standard credential risk
  Mitigation: Rate limiting, password rules, 2FA (future)

Layer 3: Biometric (Touch ID / Face ID)
  Purpose: Convenience — quick unlock without typing password
  When used: Every app open (if enabled)
  Stored: Secure Enclave (never leaves the device)
  Risk: Device physical access
  Mitigation: OS-level biometric security

Layer 4: Session JWT (OLT — Oraya License Token)
  Purpose: Ongoing session validity, carries claims (plan, features, limits)
  When used: Every API call from the desktop app
  Stored: OS Keychain
  Risk: Token theft
  Mitigation: Short expiry (24h), refresh token rotation
```

### 4.2 ORA Key Hashing (API Keys)

For API access, we should store keys hashed (like passwords) so that a database breach doesn't expose all API keys:

```
Storage:
  ora_key_prefix: "ORA-7F2A" (first segment, for display/identification)
  ora_key_hash: sha256(full_key) (for validation)

Lookup flow:
  1. Extract key from request
  2. Hash it: sha256("ORA-7F2A-B9C1-E4D8-3A6F")
  3. SELECT * FROM user_profiles WHERE ora_key_hash = $hash
```

**Note:** For the initial implementation, we store the full key (not hashed) for simplicity — the existing `license_key` column also stores plaintext. Hashing can be added as a security hardening step later.

---

## 5. Database Changes

### 5.1 Migration: Add ORA Key to user_profiles

```sql
-- Migration: XXX_ora_key.sql

-- Add ora_key column
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS ora_key TEXT UNIQUE;

-- Generate keys for existing users who don't have one
-- (Uses the trigger function defined above)
DO $$
DECLARE
    chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    r RECORD;
    key TEXT;
    i INT;
    gc INT;
BEGIN
    FOR r IN SELECT id FROM user_profiles WHERE ora_key IS NULL LOOP
        key := 'ORA-';
        gc := 0;
        FOR i IN 1..16 LOOP
            key := key || substr(chars, floor(random() * length(chars) + 1)::int, 1);
            gc := gc + 1;
            IF gc = 4 AND i < 16 THEN
                key := key || '-';
                gc := 0;
            END IF;
        END LOOP;
        UPDATE user_profiles SET ora_key = key WHERE id = r.id;
    END LOOP;
END $$;

-- Make it NOT NULL after backfill
ALTER TABLE user_profiles ALTER COLUMN ora_key SET NOT NULL;

-- Add trigger for future inserts
CREATE OR REPLACE FUNCTION generate_ora_key() ...  -- (as defined in 3.3)
CREATE TRIGGER auto_generate_ora_key ...            -- (as defined in 3.3)
```

### 5.2 New Table: Device Activations (ORA Key based)

```sql
-- Replaces / augments license_activations
CREATE TABLE IF NOT EXISTS device_activations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ora_key TEXT NOT NULL REFERENCES user_profiles(ora_key) ON DELETE CASCADE,
    
    -- Device info
    device_id TEXT NOT NULL,
    device_name TEXT,
    device_platform TEXT,  -- 'macos', 'windows', 'linux'
    device_platform_version TEXT,
    app_version TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Timestamps
    activated_at TIMESTAMPTZ DEFAULT NOW(),
    deactivated_at TIMESTAMPTZ,
    deactivated_reason TEXT,
    
    UNIQUE(user_id, device_id)
);

CREATE INDEX idx_device_activations_user ON device_activations(user_id);
CREATE INDEX idx_device_activations_ora_key ON device_activations(ora_key);
CREATE INDEX idx_device_activations_active ON device_activations(is_active);
```

---

## 6. API Endpoints

### 6.1 Device Activation (New)

```
POST /api/license/activate-device
Body: {
    ora_key: "ORA-XXXX-XXXX-XXXX-XXXX",
    device_id: "unique-hardware-id",
    device_name: "Anwesh's MacBook Pro",
    device_platform: "macos",
    device_platform_version: "14.2",
    app_version: "1.0.0"
}

Response (success): {
    success: true,
    user: { email, full_name },
    plan: { id, name, features, limits },
    activation_id: "uuid",
    devices_active: 2,
    devices_max: 3
}

Response (error - max devices): {
    error: "device_limit_reached",
    message: "Your Pro plan allows 3 devices. Deactivate one at oraya.ai/settings",
    devices_active: 3,
    devices_max: 3
}

Response (error - invalid key): {
    error: "invalid_key",
    message: "This ORA Key is not valid"
}
```

### 6.2 Key Validation (API Access)

```
-- Middleware for all /api/v1/* routes
Authorization: Bearer ORA-XXXX-XXXX-XXXX-XXXX

Middleware resolves:
  ora_key → user_id → plan → rate_limits → feature_flags

Sets on request context:
  req.user_id
  req.plan_id
  req.rate_limit (calls/min based on plan)
  req.features (array of allowed features)
```

### 6.3 Key Management

```
POST /api/user/regenerate-key
  → Generates new ORA key
  → Revokes old key
  → Deactivates ALL devices
  → Returns new key (shown once, user must copy it)

GET /api/user/devices
  → Lists all activated devices for the current user

DELETE /api/user/devices/:device_id
  → Deactivates a specific device
```

---

## 7. Desktop App Changes (Tauri / Rust)

### 7.1 New IPC Commands

```rust
// New commands to add to src-tauri/src/commands/

/// Activate device with ORA key (step 1 of first-time setup)
#[tauri::command]
async fn desktop_activate_device(
    ora_key: String,
    state: State<'_, AppState>,
) -> Result<DeviceActivationResponse, String>

/// Check if device is already activated
#[tauri::command]
async fn desktop_check_activation(
    state: State<'_, AppState>,
) -> Result<ActivationStatus, String>

/// Deactivate this device (logout + remove activation)
#[tauri::command]
async fn desktop_deactivate_device(
    state: State<'_, AppState>,
) -> Result<(), String>

/// Store credentials for biometric unlock
#[tauri::command]
async fn desktop_enable_biometric(
    email: String,
    password: String,
    state: State<'_, AppState>,
) -> Result<(), String>

/// Authenticate using biometric
#[tauri::command]  
async fn desktop_biometric_login(
    state: State<'_, AppState>,
) -> Result<AuthStateResponse, String>
```

### 7.2 Login Screen Changes

```
Current flow:
  LoginScreen → email + password → login

New flow:
  App Start
    ├── Device not activated → ActivationScreen (enter ORA key)
    │   └── Activation successful → LoginScreen (email pre-filled)
    │       └── Login successful → Main App
    │
    └── Device activated
        ├── Session valid → Main App (auto-login)
        ├── Biometric enabled → BiometricPrompt → Main App
        └── Session expired → LoginScreen (email pre-filled) → Main App
```

### 7.3 Biometric Integration

```rust
// macOS: Use Security.framework / LocalAuthentication
// Windows: Use Windows Hello API
// Linux: Use libsecret + polkit

// Crate: https://crates.io/crates/keyring (cross-platform keychain)
// Crate: For biometric prompt, use tauri-plugin-biometric or native FFI

// Storage:
//   Keychain entry: "com.oraya.desktop.credentials"
//   Contains: { email, encrypted_password, ora_key }
//   Protected by: biometric (Touch ID / Face ID / Windows Hello)
```

---

## 8. Superadmin Changes

### 8.1 Users Table

- Show ORA Key prominently (currently shows license_key)
- Add "Regenerate Key" action (revokes old key + all devices)
- Add "View Devices" to see activated devices per user
- Add "Revoke Key" to force-deactivate a user

### 8.2 User Creation

- When superadmin creates a user, the ORA key is auto-generated
- Show it in the creation success dialog: "User created. ORA Key: ORA-XXXX-..."
- Option to email the ORA key to the user

### 8.3 Device Management

- New "Devices" column or expandable row showing activated devices
- Ability to deactivate individual devices
- Ability to deactivate ALL devices for a user

---

## 9. Web Dashboard Changes (oraya.ai)

### 9.1 User Profile / Settings

```
Your ORA Key
┌──────────────────────────────────────┐
│  ORA-7F2A-B9C1-E4D8-3A6F            │
│  [Copy]  [Regenerate]                │
│                                       │
│  ⚠ Regenerating will sign you out    │
│    of all devices                     │
└──────────────────────────────────────┘

Active Devices (2 of 3)
┌──────────────────────────────────────┐
│  💻 Anwesh's MacBook Pro              │
│     macOS 14.2 · Oraya v1.0.0       │
│     Last seen: 2 minutes ago         │
│     [Deactivate]                     │
│                                       │
│  💻 Work Desktop                      │
│     Windows 11 · Oraya v1.0.0        │
│     Last seen: 3 hours ago           │
│     [Deactivate]                     │
└──────────────────────────────────────┘
```

---

## 10. Implementation Phases

### Phase 1: Database + Key Generation (1-2 hours)
- [ ] Write migration: add `ora_key` to `user_profiles`
- [ ] Write trigger: auto-generate ORA key on insert
- [ ] Backfill existing users with ORA keys
- [ ] Update superadmin user creation to show ORA key

### Phase 2: Superadmin UI (1-2 hours)
- [ ] Show ORA key in UsersTable (replace/augment license_key display)
- [ ] Add "Regenerate Key" action
- [ ] Add "View Devices" expansion/modal
- [ ] Show ORA key in CreateUserModal success state

### Phase 3: SaaS API — Device Activation (2-3 hours)
- [ ] `POST /api/license/activate-device` — validate key, register device
- [ ] `GET /api/user/devices` — list activated devices
- [ ] `DELETE /api/user/devices/:id` — deactivate device
- [ ] `POST /api/user/regenerate-key` — new key, revoke old, deactivate all
- [ ] API middleware for ORA key auth on `/api/v1/*` routes

### Phase 4: Desktop App — Activation Flow (3-4 hours)
- [ ] New Tauri command: `desktop_activate_device`
- [ ] New UI: `ActivationScreen` component (enter ORA key)
- [ ] Update `AuthGate` to check activation status first
- [ ] Update `LoginScreen` to pre-fill email from activation
- [ ] Store activation state in keychain

### Phase 5: Desktop App — Biometric (2-3 hours)
- [ ] Add `keyring` crate for cross-platform keychain
- [ ] Add biometric plugin or native FFI
- [ ] New Tauri commands: `desktop_enable_biometric`, `desktop_biometric_login`
- [ ] Update login UI with biometric option + "Remember me"
- [ ] Biometric prompt component

### Phase 6: Web Dashboard (1-2 hours)
- [ ] ORA Key display in user settings/profile page
- [ ] Copy + Regenerate functionality
- [ ] Device management UI (list, deactivate)

### Phase 7: API Gateway (2-3 hours)
- [ ] Middleware: resolve `Bearer ORA-XXXX` → user → plan → limits
- [ ] Rate limiting per plan tier
- [ ] Usage tracking (calls, tokens) per key
- [ ] API documentation / developer portal

---

## 11. Migration Path

```
Current State:
  - user_profiles: no ora_key
  - user_licenses: has license_key (ORA-XXXXXXXXXXXX format)
  - Desktop login: email + password only
  - No device activation flow
  - No biometric
  - No API key access

Target State:
  - user_profiles: ora_key (ORA-XXXX-XXXX-XXXX-XXXX)
  - user_licenses: license_key deprecated (keep for compat)
  - Desktop login: ORA key activation (once) → email + password / biometric (daily)
  - Device activation tracked in device_activations table
  - Biometric available on supported platforms
  - ORA key usable as API key for external integrations

Backward Compatibility:
  - Existing users: auto-assigned ORA key via migration backfill
  - Existing desktop sessions: continue to work (activation retroactively recorded)
  - Existing license_key: still functional, but ora_key is the canonical key
  - Old login flow: still works (email + password) — device activation is additive
```

---

## 12. Open Questions

1. **Key rotation policy** — should keys auto-rotate periodically, or only on user request?
2. **Scoped keys** — should we support creating sub-keys with limited permissions (like GitHub fine-grained tokens)?
3. **Key prefix by plan** — `ORA-FREE-XXXX`, `ORA-PRO-XXXX`, `ORA-ENT-XXXX`? Cool but leaks plan info.
4. **2FA** — should ORA key activation require 2FA in the future?
5. **Key format** — confirm `ORA-XXXX-XXXX-XXXX-XXXX` (16 chars, 80 bits entropy) is sufficient, or go longer?

---

*This plan will be implemented after the Superadmin UI fixes are complete.*
