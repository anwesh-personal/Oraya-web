# Remaining Work — Oraya SaaS

**Last Updated:** February 10, 2026

---

## Priority 1: Verify & Polish (This Week)

### Theme Verification
- [ ] Open each superadmin page in browser with each of the 5 themes × 2 modes (10 combos)
- [ ] Verify Atelier actually renders serif fonts (Lora body, Playfair headings)
- [ ] Verify Operator renders Space Grotesk, not falling back to sans-serif
- [ ] Check that `border-radius: var(--radius)` is applied to all cards/modals
- [ ] Test theme switching animation (should be smooth 0.3s transition)
- [ ] Check for any remaining hardcoded colors in `components/superadmin/` subdirectories

### Components to Audit
Run this to find remaining issues:
```bash
grep -rn --include="*.tsx" -E '(text-white|text-gray-|bg-white/|border-white/|bg-gray-|border-gray-)' components/superadmin/ | grep -v node_modules
```

Known areas that may still have hardcoded colors:
- [ ] `components/superadmin/analytics/AnalyticsDashboard.tsx`
- [ ] `components/superadmin/agents/AgentsGrid.tsx`
- [ ] `components/superadmin/deployments/DeploymentsTable.tsx`
- [ ] `components/superadmin/engines/EnginesTable.tsx`
- [ ] `components/superadmin/logs/LogsViewer.tsx`
- [ ] `components/superadmin/organizations/OrganizationsTable.tsx`
- [ ] `components/superadmin/users/UsersTable.tsx`

---

## Priority 2: Member Portal (Next Sprint)

### Stripe Integration
- [ ] Install `stripe` and `@stripe/stripe-js`
- [ ] Create checkout session API route (`/api/members/checkout`)
- [ ] Create Stripe webhook handler (`/api/webhooks/stripe`)
- [ ] Customer portal link for self-service billing
- [ ] Token package purchase flow

### Desktop ↔ Cloud Bridge APIs
- [ ] `POST /api/v1/license/validate` — Desktop calls this on startup
- [ ] `POST /api/v1/tokens/usage` — Desktop reports token consumption
- [ ] `GET /api/v1/tokens/balance` — Desktop checks remaining tokens

### Research Mode Backend
- [ ] `POST /api/members/research` — Create research job
- [ ] `GET /api/members/research` — List jobs
- [ ] `PATCH /api/members/research/:id` — Pause/resume/cancel

### Landing Page
- [ ] Create proper landing page at `/` (currently redirects to login)
- [ ] Hero section, features, pricing, testimonials

---

## Priority 3: Infrastructure

### Supabase Migrations
- [ ] Make all migrations idempotent (`CREATE TABLE IF NOT EXISTS`)
- [ ] Run full migration suite on fresh database
- [ ] Verify all 15 migration files apply cleanly

### Cleanup Duplicate Apps
- [ ] Decide: keep or remove `superadmin/dashboard/` standalone app
- [ ] Decide: keep or remove `members/app/` standalone app
- [ ] If keeping: configure `basePath` in their `next.config.mjs`
- [ ] If removing: delete directories, update any references

### Deployment
- [ ] Verify production build: `npm run build`
- [ ] Fix `images.domains` deprecation → `images.remotePatterns`
- [ ] Set up Vercel environment variables
- [ ] Test Supabase connection in production

---

## Priority 4: Nice-to-Have

- [ ] Theme preview thumbnails in settings (show mini screenshot per theme)
- [ ] Keyboard shortcut for theme mode toggle (e.g., `Cmd+Shift+D`)
- [ ] Responsive audit at mobile breakpoints
- [ ] Email templates (welcome, password reset, invoice)
- [ ] Rate limiting on API routes
- [ ] Error boundary components
