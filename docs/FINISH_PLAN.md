# 🏗️ ORAYA SAAS — FINISH PLAN
**Everything needed to go from "works for admin" to "ready for paying users"**

**Date:** February 10, 2026  
**Status:** In Progress  
**Author:** Antigravity AI + Anwesh Rath

---

## 📊 CURRENT STATE AUDIT

### ✅ What's DONE and Working

| Area | Status | Details |
|------|--------|---------|
| **Supabase Auth** | ✅ | Login, Register, Forgot Password, Email verification, Auth callback |
| **DB Schema** | ✅ | 14 migrations (002–014): profiles, plans, tokens, AI, teams, analytics, billing, notifications, support, API, GDPR, perf |
| **Superadmin Auth** | ✅ | JWT-based login, session management, role hierarchy |
| **Superadmin Dashboard** | ✅ | Overview, Organizations, Users, Agents, Engines, AI Providers, Models, Deployments, Analytics, Logs, Settings |
| **Superadmin Settings** | ✅ | General, Themes, Feature Flags, Plans, Billing, Security, Admins |
| **Theme System** | ✅ | 5 themes × 2 modes, CSS variables, Zustand store, ThemeSwitcher |
| **Middleware** | ✅ | Protects /dashboard, refreshes Supabase session |
| **Auth Triggers** | ✅ | Auto-create profile, wallet, AI prefs, notif prefs, referral code on signup |
| **Desktop App** | ✅ | Chat UI, 18 AI providers, 39 tools, cognition, memory/RAG, voice, brain workers |

### ❌ What's MISSING

| Area | Status | What's Needed |
|------|--------|---------------|
| **Member Dashboard** | 🔴 Shell only | All stats hardcoded. No sub-pages. No sidebar/layout. |
| **Member Sub-pages** | 🔴 Don't exist | /dashboard/agents, /knowledge, /analytics, /billing, /settings, /tokens |
| **Landing Page** | 🔴 Missing | Root `/` just redirects to `/login`. No marketing page. |
| **Stripe Integration** | 🔴 Schema only | DB tables exist but no Stripe SDK, no checkout, no webhook handler |
| **Token Wallet UI** | 🔴 Missing | DB tables exist (`token_wallets`, `token_purchases`, `token_usage_logs`) but no member-facing UI |
| **Desktop ↔ Cloud Bridge** | 🔴 Missing | No license validation API, no token metering API, no sync endpoints |
| **API Routes for Members** | 🔴 Minimal | Only auth routes. No /api/members/profile, /tokens, /billing, /agents, /usage |
| **Email System** | 🔴 Not wired | DB tables exist (`notification_templates`, `email_logs`) but no email provider |
| **Member Layout** | 🔴 Missing | No sidebar, no header, no proper dashboard shell like superadmin has |

---

## 🎯 IMPLEMENTATION PLAN

### Priority Order
1. **Phase 1: Member Portal Foundation** — The user sees a real dashboard
2. **Phase 2: Stripe Billing** — Users can pay
3. **Phase 3: Desktop ↔ Cloud Bridge** — Desktop app connects to SaaS
4. **Phase 4: Landing Page** — Marketing page at `/`
5. **Phase 5: Email & Notifications** — Transactional emails
6. **Phase 6: Polish & Launch** — Final touches

---

## PHASE 1: MEMBER PORTAL FOUNDATION
**Goal:** A member logs in and sees their real profile, token balance, usage stats, and can navigate to sub-pages.

### 1.1 Member Layout Shell
Create the member dashboard layout (sidebar + header) mirroring the superadmin pattern.

**Files to create:**
```
app/(members)/layout.tsx                    — Auth check + redirect
app/(members)/dashboard/layout.tsx          — Sidebar + Header wrapper
components/members/layout/MemberSidebar.tsx — Navigation sidebar
components/members/layout/MemberHeader.tsx  — Top header bar
```

**Sidebar navigation:**
- 🏠 Overview (`/dashboard`)
- 🤖 My Agents (`/dashboard/agents`)
- 📚 Knowledge Base (`/dashboard/knowledge`)
- 💰 Token Wallet (`/dashboard/tokens`)
- 📊 Analytics (`/dashboard/analytics`)
- 💳 Billing (`/dashboard/billing`)
- ⚙️ Settings (`/dashboard/settings`)

### 1.2 API Routes for Member Data
Create backend routes that fetch real data from Supabase.

**Files to create:**
```
app/api/members/profile/route.ts       — GET/PATCH user profile
app/api/members/tokens/route.ts        — GET wallet balance, usage
app/api/members/tokens/purchase/route.ts — POST buy tokens (later connects to Stripe)
app/api/members/usage/route.ts         — GET usage stats (conversations, API calls, tokens)
app/api/members/agents/route.ts        — GET/POST user's agents
app/api/members/license/route.ts       — GET license status
```

### 1.3 Dashboard Overview Page (Real Data)
Replace the hardcoded dashboard with real stats from Supabase.

**File to modify:**
```
app/(members)/dashboard/page.tsx
```

**Stats to fetch (real):**
- Token balance (from `token_wallets`)
- Active agents (from user's agents)
- Total conversations (from desktop sync or API usage)
- API calls today (from `ai_usage_logs`)
- License tier & status (from `user_licenses`)
- Recent activity (from `token_usage_logs`)

### 1.4 Member Settings Page
User can view/edit profile, change password, manage API keys.

**Files to create:**
```
app/(members)/dashboard/settings/page.tsx
components/members/settings/ProfileSettings.tsx
components/members/settings/SecuritySettings.tsx
components/members/settings/ApiKeysSettings.tsx
components/members/settings/PreferencesSettings.tsx
```

### 1.5 Token Wallet Page
User sees balance, purchase history, usage breakdown.

**Files to create:**
```
app/(members)/dashboard/tokens/page.tsx
components/members/tokens/WalletBalance.tsx
components/members/tokens/UsageBreakdown.tsx
components/members/tokens/PurchaseHistory.tsx
components/members/tokens/BuyTokensModal.tsx
```

### 1.6 Agents Page
User sees their agents from the desktop app (synced).

**Files to create:**
```
app/(members)/dashboard/agents/page.tsx
components/members/agents/AgentCard.tsx
components/members/agents/AgentsList.tsx
```

### 1.7 Analytics Page
User sees their usage charts.

**Files to create:**
```
app/(members)/dashboard/analytics/page.tsx
components/members/analytics/UsageChart.tsx
components/members/analytics/TokenUsageChart.tsx
components/members/analytics/ConversationStats.tsx
```

### Phase 1 Deliverables
- [ ] Member layout with sidebar + header
- [ ] 6 API routes for member data
- [ ] Dashboard overview with real data
- [ ] Settings page (profile, security, API keys)
- [ ] Token wallet page (balance, history, usage)
- [ ] Agents page (list, cards)
- [ ] Analytics page (usage charts)

---

## PHASE 2: STRIPE BILLING
**Goal:** Users can subscribe to plans and buy token packages with Stripe.

### 2.1 Stripe Setup
**Install & configure:**
```
npm install stripe @stripe/stripe-js
```

**Environment variables needed:**
```
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

### 2.2 Stripe Webhook Handler
This is the core — Stripe sends events when payments succeed/fail.

**Files to create:**
```
app/api/webhooks/stripe/route.ts
lib/stripe.ts                        — Stripe client + helpers
```

**Events to handle:**
- `checkout.session.completed` → Activate license, create token purchase
- `customer.subscription.created` → Set user tier
- `customer.subscription.updated` → Update tier
- `customer.subscription.deleted` → Downgrade to free
- `invoice.payment_succeeded` → Log payment
- `invoice.payment_failed` → Notify user
- `charge.refunded` → Process refund

### 2.3 Billing Page
User manages subscription and sees invoices.

**Files to create:**
```
app/(members)/dashboard/billing/page.tsx
components/members/billing/CurrentPlan.tsx
components/members/billing/PlanSelector.tsx
components/members/billing/InvoiceHistory.tsx
components/members/billing/PaymentMethods.tsx
```

### 2.4 Checkout Flow
**Files to create:**
```
app/api/stripe/checkout/route.ts          — Create Stripe Checkout Session
app/api/stripe/portal/route.ts            — Create Stripe Customer Portal session
app/api/stripe/create-customer/route.ts   — Create Stripe Customer on signup
```

### 2.5 Token Purchase Flow
Users buy token packs via Stripe (one-time purchases).

**Files to create:**
```
app/api/stripe/buy-tokens/route.ts   — Create payment for token pack
```

**Token packs (example):**
- Starter: 10,000 tokens — $5
- Pro: 50,000 tokens — $20
- Mega: 200,000 tokens — $60

### Phase 2 Deliverables
- [ ] Stripe SDK installed and configured
- [ ] Webhook handler for all payment events
- [ ] Billing page with plan management
- [ ] Checkout flow (subscribe to plan)
- [ ] Customer portal integration
- [ ] Token purchase flow (buy credits)
- [ ] Stripe customer auto-created on signup

---

## PHASE 3: DESKTOP ↔ CLOUD BRIDGE
**Goal:** The desktop app validates license, reports usage, syncs data with the SaaS cloud.

### 3.1 License Validation API
Desktop app calls this on startup to check if the user has a valid license.

**Files to create:**
```
app/api/v1/license/validate/route.ts
app/api/v1/license/activate/route.ts
```

**Request:** `POST /api/v1/license/validate`
```json
{
  "license_key": "xxx",
  "machine_id": "xxx",
  "app_version": "1.0.0"
}
```

**Response:**
```json
{
  "valid": true,
  "tier": "pro",
  "features": {
    "voice": true,
    "custom_agents": true,
    "cloud_sync": true,
    "max_agents": -1,
    "master_protocol": true
  },
  "token_balance": 45000,
  "expires_at": "2026-03-10T00:00:00Z"
}
```

### 3.2 Token Metering API
Desktop app reports token usage after each AI call.

**Files to create:**
```
app/api/v1/tokens/usage/route.ts     — POST report usage
app/api/v1/tokens/balance/route.ts   — GET current balance
```

**Request:** `POST /api/v1/tokens/usage`
```json
{
  "provider": "gemini",
  "model": "gemini-2.5-pro",
  "tokens_input": 1200,
  "tokens_output": 800,
  "agent_id": "ora",
  "conversation_id": "xxx"
}
```

### 3.3 Managed AI Proxy (Pro Tier)
Pro users don't need their own API keys — the SaaS provides managed access.

**Files to create:**
```
app/api/v1/ai/chat/route.ts          — Proxy to AI providers using platform keys
app/api/v1/ai/models/route.ts        — GET available models for user's tier
```

**Flow:**
1. Desktop app sends chat request → SaaS API
2. SaaS validates license + token balance
3. SaaS forwards to AI provider (Gemini, OpenAI, etc.) using platform's managed keys
4. SaaS deducts tokens from wallet
5. SaaS returns response to desktop

### 3.4 Cloud Sync API
Desktop app syncs agents, memories, settings to cloud.

**Files to create:**
```
app/api/v1/sync/push/route.ts        — Desktop pushes data
app/api/v1/sync/pull/route.ts        — Desktop pulls data
app/api/v1/sync/status/route.ts      — GET last sync status
```

### 3.5 Desktop App Integration Points
**Files to modify in Desktop app (`/Oraya/src-tauri/src/sync/`):**
- Update `supabase_client.rs` to call SaaS API endpoints
- Add license validation on app startup
- Add token balance check before AI calls
- Add usage reporting after AI calls

### Phase 3 Deliverables
- [ ] License validation/activation API
- [ ] Token metering API (report usage, check balance)
- [ ] Managed AI proxy for Pro tier
- [ ] Cloud sync push/pull API
- [ ] Desktop app calls SaaS APIs

---

## PHASE 4: LANDING PAGE
**Goal:** A stunning marketing page at `/` that converts visitors to signups.

### 4.1 Landing Page Structure
**File to create:**
```
app/(marketing)/page.tsx
app/(marketing)/layout.tsx
app/(marketing)/pricing/page.tsx
```

**Sections:**
1. **Hero** — "The AI Operating System" + gradient CTA
2. **Features** — Multi-agent, 116 tools, voice, cross-platform
3. **How It Works** — 3-step visual flow
4. **Agent Showcase** — Ora, Mara, Ova with personality previews
5. **Pricing** — Free / BYOK / Pro / Enterprise cards
6. **Testimonials** — Social proof (placeholder initially)
7. **CTA** — Download / Sign up
8. **Footer** — Links, socials, legal

### 4.2 Pricing Page
Dedicated pricing page with detailed feature comparison.

### Phase 4 Deliverables
- [ ] Landing page with hero, features, pricing
- [ ] Pricing page with feature matrix
- [ ] Responsive design, micro-animations
- [ ] SEO optimized (meta, OG tags, structured data)

---

## PHASE 5: EMAIL & NOTIFICATIONS
**Goal:** Transactional emails for auth, billing, and alerts.

### 5.1 Email Provider Setup
**Options:** Resend, SendGrid, or AWS SES

**Files to create:**
```
lib/email.ts                          — Email client wrapper
lib/email-templates/                  — HTML email templates
  welcome.ts
  password-reset.ts
  payment-receipt.ts
  subscription-change.ts
  low-balance-alert.ts
  weekly-digest.ts
```

### 5.2 Notification System
**Files to create:**
```
app/api/members/notifications/route.ts
components/members/NotificationBell.tsx
```

### Phase 5 Deliverables
- [ ] Email provider integrated
- [ ] 6 email templates
- [ ] In-app notification system
- [ ] Low balance alerts
- [ ] Weekly usage digest

---

## PHASE 6: POLISH & LAUNCH
**Goal:** Production-ready, everything tested, deployed.

### 6.1 Error Handling & Loading States
- Add error boundaries
- Add skeleton loading states to all pages
- Add toast notifications (Sonner already installed)
- Add proper 404/500 pages

### 6.2 Security Hardening
- Rate limiting on all API routes
- CSRF protection
- Input sanitization
- API key rotation for managed keys

### 6.3 Performance
- Server-side rendering where possible
- Image optimization
- API response caching
- Database query optimization

### 6.4 Testing
- API route tests
- Auth flow E2E test
- Billing flow E2E test
- License validation E2E test

### 6.5 Deployment
- Vercel production deployment
- Stripe webhook URL configured
- Environment variables set
- DNS configured
- SSL verified

### Phase 6 Deliverables
- [ ] Error boundaries + loading states
- [ ] Security hardening
- [ ] Performance optimization
- [ ] E2E tests for critical flows
- [ ] Production deployment

---

## 📅 ESTIMATED TIMELINE

| Phase | Effort | Dependencies |
|-------|--------|-------------|
| **Phase 1: Member Portal** | 3-4 days | None (can start now) |
| **Phase 2: Stripe Billing** | 2-3 days | Stripe account setup |
| **Phase 3: Desktop ↔ Cloud** | 3-4 days | Phase 1 + 2 |
| **Phase 4: Landing Page** | 1-2 days | None (parallel) |
| **Phase 5: Email** | 1-2 days | Email provider account |
| **Phase 6: Polish** | 2-3 days | All above |
| **TOTAL** | **~12-18 days** | |

---

## 📁 FILE INVENTORY

### New Files to Create (~45 files)

```
# Member Layout
app/(members)/layout.tsx
app/(members)/dashboard/layout.tsx
components/members/layout/MemberSidebar.tsx
components/members/layout/MemberHeader.tsx

# Member Pages
app/(members)/dashboard/page.tsx                 (rewrite existing)
app/(members)/dashboard/settings/page.tsx
app/(members)/dashboard/tokens/page.tsx
app/(members)/dashboard/agents/page.tsx
app/(members)/dashboard/analytics/page.tsx
app/(members)/dashboard/billing/page.tsx
app/(members)/dashboard/knowledge/page.tsx

# Member Components (~15)
components/members/settings/ProfileSettings.tsx
components/members/settings/SecuritySettings.tsx
components/members/settings/ApiKeysSettings.tsx
components/members/settings/PreferencesSettings.tsx
components/members/tokens/WalletBalance.tsx
components/members/tokens/UsageBreakdown.tsx
components/members/tokens/PurchaseHistory.tsx
components/members/tokens/BuyTokensModal.tsx
components/members/agents/AgentCard.tsx
components/members/agents/AgentsList.tsx
components/members/analytics/UsageChart.tsx
components/members/analytics/TokenUsageChart.tsx
components/members/billing/CurrentPlan.tsx
components/members/billing/PlanSelector.tsx
components/members/billing/InvoiceHistory.tsx

# Member API Routes (~6)
app/api/members/profile/route.ts
app/api/members/tokens/route.ts
app/api/members/tokens/purchase/route.ts
app/api/members/usage/route.ts
app/api/members/agents/route.ts
app/api/members/license/route.ts

# Stripe
lib/stripe.ts
app/api/webhooks/stripe/route.ts
app/api/stripe/checkout/route.ts
app/api/stripe/portal/route.ts
app/api/stripe/buy-tokens/route.ts

# Desktop Bridge (v1 API)
app/api/v1/license/validate/route.ts
app/api/v1/license/activate/route.ts
app/api/v1/tokens/usage/route.ts
app/api/v1/tokens/balance/route.ts
app/api/v1/ai/chat/route.ts
app/api/v1/ai/models/route.ts
app/api/v1/sync/push/route.ts
app/api/v1/sync/pull/route.ts

# Landing Page
app/(marketing)/page.tsx
app/(marketing)/layout.tsx
app/(marketing)/pricing/page.tsx

# Email
lib/email.ts
```

---

## 🎯 RECOMMENDED START

**Start with Phase 1.1 (Member Layout)** — it unblocks everything else.
Once the layout shell is in place, all sub-pages can be built in parallel.

Phase 4 (Landing Page) can also be built in parallel since it has zero dependencies.

---

**Built with precision by Antigravity AI + Anwesh Rath**  
**Let's finish this. 🔥**
