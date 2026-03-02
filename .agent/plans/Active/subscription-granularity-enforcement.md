# Implementation Plan: Dynamic Subscription Granularity & Feature Enforcement
# STATUS: ✅ FULLY EXECUTED

## What Was Done

### ✅ Phase 1 — SaaS Migration: `036_dynamic_plan_tier_ranking.sql`
- **Dropped** hardcoded `CHECK (plan_tier IN ('standard', 'pro', ...))` constraints from both `agent_templates` and `ide_specialist_registry` via dynamic PL/pgSQL (safe even if constraint names vary).
- **Rewrote** `plan_tier_rank(TEXT)` from a hardcoded CASE/WHEN to a live query against `plans.display_order`. Any plan ID — including custom admin-created ones — is now ranked correctly. Unknown / inactive plans return 0 (safe fallback).
- **Rebuilt** all 3 dependent RPCs (`get_user_accessible_agents`, `get_specialist_for_ide`, `get_user_specialists`) so they inherit the dynamic ranking with no logic changes needed.
- Added `COMMENT ON COLUMN plans.display_order` documenting its role as the canonical tier ranking field.

### ✅ Phase 2 — SaaS Superadmin: Real Feature Flags
- Created `app/api/superadmin/feature-flags/route.ts` — full GET / POST / PATCH / DELETE API backed by the real `feature_flags` Supabase table. All mutations write the `updated_by` admin ID and emit audit log entries.
- Created `hooks/useFeatureFlags.ts` — typed React hook with `toggleEnabled`, `togglePlan`, `updateFlag`, `createFlag`, `deleteFlag`. All mutations refetch from the DB; no optimistic updates that could diverge from server state.
- **Rewrote** `FeatureFlagsSettings.tsx` — loads live flags from DB, renders a matrix with one column per active plan (from `usePlans()`), individual enable/disable toggles per cell with loading states, real create/delete modals. The old `console.log("Saving...")` mock is gone.
- **Fixed** `AgentExplorer.tsx` — removed `TIER_RANK = { free: 1, ... }` constant. Replaced `tierColor()` and `tierClearance()` with functions that accept a `PlanRankMap` (derived from `plans.display_order`). Threaded through all sub-components.

### ✅ Phase 3 — Desktop Rust Backend
- **`archiver.rs`** — Replaced the hardcoded plan-name allow-list `match user_plan { "enterprise" => vec!["free","pro",...] ... }` with a proper authenticated POST to `get_user_accessible_agents` RPC. Plan ranking authority is now 100% server-side. Command signature changed from `(user_plan: Option<String>)` to `(user_id: String, user_jwt: String)`.
- **`license.rs`** — Fixed `is_trial` detection. No longer checks `claims.plan == "free" || claims.plan == "trial"`. Now reads `claims.plan_features.contains("trial")` — any plan can be a trial if the SaaS marks its `features` array with `"trial"`.
- **`types.rs`** — Updated stale comment on `LicenseTokenClaims.plan` to reflect that plan IDs are now dynamic.
- **`license.rs`** — Added `desktop_get_supabase_token` Tauri command. Returns `{ access_token, user_id }` for any authenticated state. Internally calls `ensure_valid_access_token()` (refreshes if near-expiry).
- **`main.rs`** — Registered `desktop_get_supabase_token` in the invoke handler.

### ✅ Phase 4 — Desktop UI
- **`licenseService.ts`** — Added `getSupabaseToken()` wrapper for the new command.
- **`TemplateSelectionStep.tsx`** — Replaced `userPlan: 'enterprise'` with a two-step call: `desktop_get_supabase_token` → `fetch_cloud_templates({ userId, userJwt })`. The access token is always fresh. The plan tier filtering happens on the server.

## SaaS as Source of Truth — How It Now Works End-to-End

```
Superadmin creates/edits plan (display_order = N)
        ↓
User's JWT minted with plan_id = <that plan id>
        ↓
Desktop calls desktop_get_supabase_token → gets live Supabase JWT
        ↓
fetch_cloud_templates( user_id, user_jwt )
        ↓
Supabase RPC get_user_accessible_agents( user_id )
        ↓
plan_tier_rank(user.plan_id) = plans.display_order for that plan
        ↓
Returns templates where plan_tier_rank(template.plan_tier) <= user rank
```

No plan names live in desktop code. Creating a `trial`, `growth`, `vip`, or any custom plan from Superadmin and setting its `display_order` is all you need. Everything downstream picks it up automatically on the next license refresh.

## Trial Plans — How to Create One
1. Go to Superadmin → Plans → New Plan
2. Set `id = trial`, `display_order = 1` (same level as standard, or lower), `features = ["trial"]`
3. Add whatever agent templates you want at the `trial` plan tier
4. The desktop `is_trial` flag is set automatically because `plan_features` contains `"trial"`

No code changes needed anywhere.

## Pending for Next Session
- Apply `036_dynamic_plan_tier_ranking.sql` to production Supabase via `supabase db push`
- Pass `planRankMap={Object.fromEntries(plans.map(p => [p.id, p.display_order]))}` from the members agent page down to `<AgentExplorer />` (parent page change)
- The `"free"` string still exists in some UI label copy (non-functional) — clean up in a separate pass
