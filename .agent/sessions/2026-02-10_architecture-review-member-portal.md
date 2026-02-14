# Session Log: 2026-02-10 — Oraya SaaS Architecture Review & Member Portal Build

**Date:** February 10, 2026  
**Time:** ~06:00 IST – ongoing  
**Workspace:** Oraya SaaS + Oraya Desktop

---

## What Happened This Session

### 1. Full Architecture Audit
- Mapped the complete Oraya ecosystem: Desktop (Tauri/Rust) + SaaS (Next.js/Supabase)
- Reviewed all documentation in `/Oraya/docs/MASTER_ORAYA/` and `/Oraya/docs/Sales/`
- Audited the actual codebase vs what the January docs claimed

### 2. Corrected My Own Mistake
- Initially said "UI and agent intelligence still needs work" on the desktop app
- After actually checking the code: Desktop app is **massively built out**:
  - 135+ React components (Chat, Settings, Thinking, Vision, Terminal, etc.)
  - 18 AI providers in Rust (Gemini, OpenAI, Anthropic, DeepSeek, etc.)
  - 39 tool executors across macOS/Windows/Linux
  - 11 cognition modules (context builder, goal manager, self-reflection, etc.)
  - Full memory/RAG, voice (STT/TTS), brain workers
- The January docs were outdated — the app had progressed significantly

### 3. Identified What's Actually Missing
The Desktop app is solid. What's missing is the **SaaS web layer**:

| Missing | Why It Matters |
|---------|---------------|
| Member Dashboard (real) | Current one is a hardcoded shell |
| Stripe Billing | DB schema exists, no Stripe SDK or checkout |
| License Management UI | DB tables exist (`user_licenses`, `license_activations`), no member UI |
| Token Wallet UI (web) | Desktop has it, web doesn't |
| 24/7 Research Mode (cloud) | The one cloud-dependent feature |
| Desktop ↔ Cloud Bridge APIs | License validation, token metering |
| Landing Page | Root `/` just redirects to `/login` |

### 4. Created FINISH_PLAN.md
- Saved to `/docs/FINISH_PLAN.md`
- 6 phases, ~45 files, estimated 12-18 days
- Initially over-scoped the member portal (too many pages)

### 5. Corrected the Plan After User Feedback
User pointed out: **"Ora is a desktop app. The member area doesn't need a lot."**

Revised member portal to just 4 pages:
- **Overview** — License status, token balance, download link
- **License & Devices** — Activation key, machines, deactivation
- **Token Wallet** — Balance, purchases, usage
- **Billing** — Stripe checkout, invoices, plan management
- **24/7 Research** — The one cloud feature
- **Settings** — Profile, password, API keys

Removed: ~~Agents~~, ~~Knowledge Base~~, ~~Analytics~~, ~~Conversations~~, ~~Marketplace~~ (all handled by desktop app)

### 6. Started Building Member Portal

#### Files Created:
- **`/docs/FINISH_PLAN.md`** — Complete implementation plan (6 phases, ~45 files)

#### Layout & Shell Components (Rewritten):
- **`/components/members/layout/MemberSidebar.tsx`** — Collapsible sidebar with theme-aware CSS vars, lean nav (Overview, License, Tokens, Research, Billing, Settings), plan badge, download CTA, ThemeSwitcher, logout
- **`/components/members/layout/MemberHeader.tsx`** — Token balance display, desktop app deep link (oraya://open), search bar, notifications, user dropdown with outside-click handling
- **`/app/dashboard/layout.tsx`** — Auth wrapper that fetches user/license/tokens in parallel, renders sidebar + header, redirects to /login if unauthenticated

#### API Routes (New):
- **`/app/api/members/license/route.ts`** — GET: user's active license + plan details + device activations (force-dynamic)
- **`/app/api/members/tokens/route.ts`** — GET: wallet balance, purchases, usage logs, available packages (force-dynamic)  
- **`/app/api/members/profile/route.ts`** — GET + PATCH: user profile from user_profiles table, whitelisted field updates (force-dynamic)
- **`/app/api/members/plans/route.ts`** — GET: all active/public subscription plans (force-dynamic)

#### Dashboard Pages (New):
- **`/app/dashboard/page.tsx`** — Overview with real data: smart alerts (frozen wallet, trial expiry, usage limits), stats cards (license, tokens, devices, AI calls), quick actions, active devices list, upgrade CTA for free users
- **`/app/dashboard/license/page.tsx`** — License key (masked/reveal/copy), plan details grid, usage meters with progress bars, active device list with deactivation, deactivated devices history
- **`/app/dashboard/tokens/page.tsx`** — Balance overview, auto-refill settings, 3 tabs (Buy Packages with Stripe checkout, Purchase History table, Usage Log with per-entry breakdown)
- **`/app/dashboard/billing/page.tsx`** — Current plan status, monthly/yearly toggle, plan comparison cards, Stripe checkout + customer portal integration, invoice history
- **`/app/dashboard/research/page.tsx`** — 24/7 cloud research: job list with status (running/paused/completed/failed), create form (name/query/schedule/sources), play/pause/delete, expandable details, stats
- **`/app/dashboard/settings/page.tsx`** — 4 sections: Profile (name/org/bio/timezone/referral), Security (change password), Appearance (full ThemeSwitcher panel), Danger Zone (account deletion)

#### Bug Fixes:
- **`/app/login/page.tsx`** — Wrapped in Suspense boundary to fix Next.js useSearchParams build error (pre-existing issue)
- All API routes got `export const dynamic = "force-dynamic"` to prevent static prerendering of cookie-dependent routes

#### Build Status: ✅ CLEAN — All 39 pages generate successfully

#### In Progress (next session):
- Stripe SDK integration (checkout session, webhooks, customer portal)
- Desktop ↔ Cloud bridge APIs (`/api/v1/license/validate`, `/api/v1/tokens/usage`)
- Research mode backend API routes
- Landing page at `/`
- Email system (welcome, invoice, password reset)

---

## Key Decisions Made

1. **Member portal is lean** — Desktop app handles agents, knowledge, analytics. Web portal is just account/billing/license.
2. **Theme-aware everything** — All member components use CSS variables, not hardcoded colors.
3. **Real data from Supabase** — No more hardcoded stats. Fetch from `token_wallets`, `user_licenses`, `license_activations`, etc.
4. **Production quality** — No MVPs, no band-aids, no corner cutting.

---

## DB Tables Being Used
- `user_profiles` (003)
- `plans`, `user_licenses`, `license_activations`, `license_usage_events` (004)
- `token_wallets`, `token_purchases`, `token_usage_logs`, `token_packages`, `discount_codes` (005)
- `managed_ai_keys`, `ai_usage_logs` (006)
- `stripe_customers`, `payment_transactions`, `invoices`, `refunds` (009)

---

## Next Steps (When Continuing)
1. Create `app/dashboard/layout.tsx` — Auth wrapper + sidebar + header
2. Rewrite `app/dashboard/page.tsx` — Real data from Supabase
3. Create API routes: `/api/members/profile`, `/tokens`, `/license`
4. Create sub-pages: license, tokens, billing, research, settings
5. Stripe integration (SDK, checkout, webhooks)
6. Desktop ↔ Cloud bridge APIs (`/api/v1/license/validate`, `/api/v1/tokens/usage`)
7. Landing page at `/`
