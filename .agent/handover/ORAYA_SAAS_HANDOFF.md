# ORAYA SAAS — Complete Handoff Document

> **Last Updated:** 2026-02-17  
> **Project:** Oraya SaaS Platform (Website + Admin Panel + Member Portal)  
> **Repository:** `anwesh-personal/Oraya-web` (GitHub)  
> **Deployment:** Vercel (auto-deploy from `main`)  
> **Domain:** `oraya.dev`  
> **Status:** Active Development — Sales page is live, admin panel functional, member portal WIP

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Environment & Configuration](#4-environment--configuration)
5. [The Sales Page (Root `/`)](#5-the-sales-page-root-)
6. [The Mogul Funnel (`/mogul`)](#6-the-mogul-funnel-mogul)
7. [Member Portal (`/dashboard`)](#7-member-portal-dashboard)
8. [Superadmin Panel (`/superadmin`)](#8-superadmin-panel-superadmin)
9. [Authentication System](#9-authentication-system)
10. [API Routes](#10-api-routes)
11. [Database Schema (Supabase)](#11-database-schema-supabase)
12. [Theme System](#12-theme-system)
13. [Design System & Typography](#13-design-system--typography)
14. [Stripe Integration](#14-stripe-integration)
15. [Key Libraries & Dependencies](#15-key-libraries--dependencies)
16. [Public Assets](#16-public-assets)
17. [Known Issues & Unfinished Work](#17-known-issues--unfinished-work)
18. [Strategic Brainstorm Notes](#18-strategic-brainstorm-notes)
19. [How to Run](#19-how-to-run)
20. [Related Projects](#20-related-projects)

---

## 1. PROJECT OVERVIEW

**Oraya Saas** is the web platform for the Oraya desktop application (a Rust/Tauri native AI OS). This project serves multiple purposes:

- **Public Sales Page** (`/`) — Premium, cinematic landing page selling the Oraya product
- **Mogul Sales Funnel** (`/mogul`) — Alternative high-ticket sales page using PASTOR + 4P hybrid framework
- **Member Portal** (`/dashboard`) — Post-purchase dashboard for users to manage licenses, tokens, billing, and research
- **Superadmin Panel** (`/superadmin`) — Internal admin dashboard for managing users, organizations, AI providers, analytics, deployments, etc.
- **Legal Pages** — `/privacy`, `/terms`, `/disclaimer`
- **Auth Pages** — `/login`, `/register`, `/forgot-password`

The core product (Oraya itself) is a **separate Rust/Tauri application** located at `/Users/anweshrath/Documents/Cursor/Neeva Pilot/Oraya`. This SaaS project is the web companion — it does NOT contain the desktop app code.

---

## 2. TECH STACK

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Framework** | Next.js 14 (App Router) | Pages are in `app/` directory |
| **Language** | TypeScript | Strict mode in `tsconfig.json` |
| **Styling** | Tailwind CSS 3.4 | CSS variables for theming, `globals.css` has 12K+ of custom styles |
| **Animations** | Framer Motion 12 | Used extensively in sales page and admin |
| **UI Components** | Radix UI | Dialog, Dropdown, Tabs, Select, Switch, Toast, Tooltip, Popover, Avatar, Separator |
| **Database** | Supabase (PostgreSQL) | Hosted project: `izcdcpfbukhwulyorwgd` |
| **Auth (Members)** | Supabase Auth | Email/password, session via cookies |
| **Auth (Superadmin)** | Custom JWT (jose) | Separate auth system, `bcryptjs` for password hashing |
| **Payments** | Stripe | Checkout, portal, webhooks, token purchases |
| **State Management** | Zustand 5 | Used for stores |
| **Charts** | Recharts 2.15 | Admin analytics |
| **Icons** | Lucide React | Used throughout |
| **Fonts** | Google Fonts | Inter (body), Outfit (display), JetBrains Mono (mono) — loaded via `next/font` |
| **Notifications** | Sonner | Toast notifications |

---

## 3. PROJECT STRUCTURE

```
Oraya Saas/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # ROOT SALES PAGE (the main landing page)
│   ├── layout.tsx                # Root layout (fonts, ThemeProvider, ResponsiveProvider)
│   ├── globals.css               # 12K+ lines of global styles + CSS variables
│   ├── mogul/page.tsx            # MOGUL FUNNEL (alternative sales page)
│   ├── login/page.tsx            # Member login
│   ├── register/page.tsx         # Member registration
│   ├── forgot-password/page.tsx  # Password reset
│   ├── dashboard/                # MEMBER PORTAL (protected by middleware)
│   │   ├── page.tsx              # Main dashboard (23K+ bytes — very dense)
│   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   ├── billing/              # Billing management
│   │   ├── license/              # License management
│   │   ├── tokens/               # Token wallet
│   │   ├── research/             # Research hub
│   │   └── settings/             # User settings
│   ├── superadmin/               # SUPERADMIN PANEL
│   │   ├── page.tsx              # Redirects to login or dashboard
│   │   ├── login/page.tsx        # Superadmin login (separate auth)
│   │   └── (dashboard)/          # Protected admin pages
│   │       ├── layout.tsx        # Admin dashboard layout
│   │       ├── overview/         # Dashboard overview & stats
│   │       ├── users/            # User management
│   │       ├── organizations/    # Org management
│   │       ├── agents/           # Agent management
│   │       ├── ai-providers/     # AI provider config
│   │       ├── models/           # Model management
│   │       ├── analytics/        # Analytics dashboard
│   │       ├── logs/             # System logs
│   │       ├── engines/          # Engine management
│   │       ├── deployments/      # Deployment tracking
│   │       └── settings/         # Admin settings
│   ├── api/                      # API ROUTES
│   │   ├── auth/                 # Auth endpoints (login, register, forgot-password, logout, me)
│   │   ├── members/              # Member endpoints (license, plans, profile, tokens)
│   │   ├── stripe/               # Stripe endpoints (checkout, portal, webhooks, buy-tokens)
│   │   ├── superadmin/           # Superadmin endpoints (admins, auth, ai-providers, impersonate, models, settings)
│   │   └── v1/                   # V1 API for desktop app bridge (keys, license, research, tokens)
│   ├── privacy/                  # Privacy policy page
│   ├── terms/                    # Terms of service page
│   └── disclaimer/               # Disclaimer page
│
├── components/
│   ├── sales/                    # ALL SALES PAGE COMPONENTS (39 files + 3 subdirs)
│   │   ├── Hero.tsx              # Main hero section (20K — very complex)
│   │   ├── Problem.tsx           # Pain amplification section
│   │   ├── Manifesto.tsx         # Founder story / trust builder
│   │   ├── Transformation.tsx    # Before/After comparison
│   │   ├── TerminalDemo.tsx      # Interactive terminal demo
│   │   ├── SovereigntyScorecard.tsx  # Competitive comparison matrix
│   │   ├── EntropyAudit.tsx      # "Anti-wrapper" manifesto
│   │   ├── StatsCounter.tsx      # Animated stats
│   │   ├── AgentEcosystem.tsx    # Agent showcase (Ora, Ova, Mara)
│   │   ├── AgentOrchestration.tsx # Agent orchestration flow
│   │   ├── SwarmLogs.tsx         # Live swarm activity logs
│   │   ├── NeuralArchitecture.tsx # Architecture diagram
│   │   ├── RawDirectives.tsx     # Raw config/code snippets
│   │   ├── ModesShowcase.tsx     # Modes (Assistant, Brainstorm, War Room, Ghost)
│   │   ├── SelfHealingUI.tsx     # Self-healing filesystem demo
│   │   ├── IntelligenceMantle.tsx # Intelligence layer showcase
│   │   ├── FeaturesAIOS.tsx      # Bento grid features (53K — the largest component)
│   │   ├── MultiWorkspace.tsx    # Multi-workspace intelligence
│   │   ├── SecurityVault.tsx     # Security architecture
│   │   ├── PerimeterMap.tsx      # Sovereign perimeter blueprint
│   │   ├── ResearchMemory.tsx    # Research + memory system
│   │   ├── GlobalRelay.tsx       # Global infrastructure network
│   │   ├── GrandOffer.tsx        # Value stack / grand offer
│   │   ├── Pricing.tsx           # Pricing tiers (3 plans)
│   │   ├── FAQSection.tsx        # FAQ accordion
│   │   ├── FinalCTA.tsx          # Final call to action
│   │   ├── Navbar.tsx            # Sales page navbar
│   │   ├── Footer.tsx            # Footer
│   │   ├── SocialProof.tsx       # Logo marquee (NOTE: uses placeholder logos)
│   │   ├── NeuralBackground.tsx  # Animated neural background
│   │   ├── CursorGlow.tsx        # Cursor glow effect
│   │   ├── SpotlightCursor.tsx   # Spotlight cursor effect
│   │   ├── Story.tsx             # Story section (alternate)
│   │   ├── ComparisonSection.tsx # Feature comparison
│   │   ├── OrchestrationFlow.tsx # Orchestration visualization
│   │   ├── Amplify.tsx           # Amplification section
│   │   ├── TheCore.tsx           # Core concept section
│   │   ├── LegalLayout.tsx       # Legal pages layout
│   │   ├── DesignPlayground.tsx  # Design testing playground
│   │   ├── mogul/                # MOGUL-SPECIFIC COMPONENTS (11 files)
│   │   │   ├── MogulHero.tsx
│   │   │   ├── MogulProblem.tsx
│   │   │   ├── MogulStory.tsx
│   │   │   ├── MogulTerminal.tsx
│   │   │   ├── MogulTransformation.tsx
│   │   │   ├── MogulDemoVideos.tsx
│   │   │   ├── MogulComparison.tsx
│   │   │   ├── MogulBonuses.tsx
│   │   │   ├── MogulStats.tsx
│   │   │   ├── MogulPricingComparison.tsx
│   │   │   └── MogulFinalCTA.tsx
│   │   ├── responsive/           # Responsive utilities
│   │   │   ├── ResponsiveProvider.tsx
│   │   │   └── ResponsiveSwitcher.tsx
│   │   └── ui/
│   │       └── SalesLightbox.tsx # Cinematic video modal
│   │
│   ├── superadmin/               # SUPERADMIN DASHBOARD COMPONENTS (13 subdirs)
│   │   ├── layout/               # Dashboard layout (sidebar, topbar)
│   │   ├── dashboard/            # Dashboard overview cards/widgets
│   │   ├── users/                # User management table
│   │   ├── organizations/        # Org management
│   │   ├── agents/               # Agent management
│   │   ├── ai-providers/         # AI provider configuration
│   │   ├── analytics/            # Analytics charts
│   │   ├── logs/                 # Log viewer
│   │   ├── engines/              # Engine management
│   │   ├── deployments/          # Deployment tracking
│   │   ├── settings/             # Admin settings (7 subdirs — rich config)
│   │   ├── theme/                # Theme selector + provider
│   │   └── ui/                   # Shared admin UI components
│   │
│   ├── members/                  # MEMBER DASHBOARD COMPONENTS
│   │   ├── layout/               # Member layout (sidebar, topbar)
│   │   └── theme/                # Member theme components
│   │
│   └── theme/                    # GLOBAL THEME COMPONENTS
│       ├── ThemeProvider.tsx      # Root theme provider
│       └── ThemeSelector.tsx      # Theme picker UI
│
├── lib/                          # SHARED LIBRARIES
│   ├── auth.ts                   # Superadmin JWT auth (jose, bcryptjs)
│   ├── superadmin-middleware.ts   # Superadmin route protection
│   ├── supabase/                 # Supabase client factories
│   │   ├── client.ts             # Browser client
│   │   └── server.ts             # Server client (SSR)
│   ├── stripe/                   # Stripe configuration
│   │   ├── client.ts             # Client-side Stripe
│   │   └── server.ts             # Server-side Stripe
│   ├── ai-providers.ts           # AI provider definitions (31K — extensive)
│   ├── agents.ts                 # Agent type definitions
│   ├── themes.ts                 # Theme system (5 themes × 2 modes = 10 variants, 620 lines)
│   ├── database.types.ts         # Auto-generated Supabase types (51K)
│   ├── utils.ts                  # Utility functions (cn, formatDate, etc.)
│   └── bridge/                   # Desktop app bridge helpers
│
├── supabase/
│   └── migrations/               # 21 SQL migration files
│       ├── 002_superadmin_tables.sql
│       ├── 003_user_profiles.sql
│       ├── 004_plans_and_licensing.sql
│       ├── 005_token_wallet_system.sql
│       ├── 006_managed_ai_service.sql
│       ├── 007_teams_collaboration.sql
│       ├── 008_analytics_telemetry.sql
│       ├── 009_billing_stripe.sql
│       ├── 010_notifications_emails.sql
│       ├── 011_support_system.sql
│       ├── 012_api_management.sql
│       ├── 013_gdpr_compliance.sql
│       ├── 014_performance_optimizations.sql
│       ├── 015_add_superadmin_user.sql
│       ├── 016_superadmin_auth.sql
│       ├── 017_bridge_helper_functions.sql
│       ├── 20260210060003_fix_referral_code.sql
│       └── BULK_006_to_014*.sql  # 4 bulk migration variants (idempotent)
│
├── stores/                       # Zustand stores
├── superadmin/                   # Additional superadmin resources
│   ├── README.md
│   ├── dashboard/                # Extended admin dashboard views
│   └── supabase/                 # Additional Supabase configs
│
├── public/                       # STATIC ASSETS
│   ├── architect_authentic_likeness.png  # Founder photo (used in Manifesto)
│   ├── assets/                   # Additional assets (neural_mesh, sovereign_node, etc.)
│   └── logos/                    # Brand logos
│
├── docs/                         # Documentation
├── backups/                      # Backup files
├── sales/                        # Sales strategy docs
│
├── SALES_COPY_AND_STRUCTURE.md   # Complete copy for every sales section
├── PROPOSED_MISSING_SECTIONS.md  # Proposed additional sections
├── ORCHESTRATED_SOVEREIGNTY.md   # Sales framework documentation
│
├── middleware.ts                 # Next.js middleware (protects /dashboard routes)
├── tailwind.config.js            # Tailwind config with CSS variable-based theming
├── next.config.js                # Next.js config (image domains, security headers)
├── tsconfig.json                 # TypeScript config
└── package.json                  # Dependencies and scripts
```

---

## 4. ENVIRONMENT & CONFIGURATION

### `.env.local` Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (`izcdcpfbukhwulyorwgd.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only, elevated privileges) |
| `JWT_SECRET` | Secret for superadmin JWT signing |
| `NEXT_PUBLIC_APP_URL` | App URL (localhost:3000 in dev) |
| `NODE_ENV` | Environment flag |

### Missing / Needed (Not Yet Configured)
- `STRIPE_SECRET_KEY` — Stripe server-side key
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook verification
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe client key

---

## 5. THE SALES PAGE (Root `/`)

### Architecture
The root page (`app/page.tsx`) is a **single-page cinematic sales experience** organized into 7 Acts:

```
ACT I — THE PRELUDE
  └─ SalesHero → SocialProof

ACT II — THE VOID
  └─ ProblemSection → Manifesto

ACT III — THE KERNEL
  └─ TransformationSection → TerminalDemo

ACT IV — THE METRICS
  └─ SovereigntyScorecard → EntropyAudit → StatsCounter

ACT V — THE DEPTH (15 sections — this is the "whitepaper" zone)
  └─ AgentEcosystem → AgentOrchestration → SwarmLogs
  └─ NeuralArchitecture → RawDirectives → ModesShowcase
  └─ SelfHealingUI → IntelligenceMantle → FeaturesAIOS
  └─ MultiWorkspace → SecurityVault → PerimeterMap
  └─ ResearchMemory → GlobalRelay

ACT VI — THE VALUE
  └─ GrandOffer → PricingSection

ACT VII — THE EPILOGUE
  └─ FAQSection → FinalCTA → Footer
```

### Visual Design Philosophy
- **Dark, cinematic, premium** — jet black backgrounds with amber/gold (`primary`) and teal/cyan (`secondary`) accents
- **Font stack**: Outfit (display), Inter (body), JetBrains Mono (code)
- **Design language**: "Command Center" / "Neural Interface" — heavy use of monospace labels, system status badges, technical metadata overlays
- **Key visual elements**:
  - `NeuralBackground` — Animated particle/neural mesh backdrop
  - `CursorGlow` — Custom cursor glow effect
  - Vertical Spine — Center line that runs the full page length
  - Atmospheric Glow — Fixed radial gradient overlay
  - `noise-overlay` — Subtle noise texture on sections
  - Section dividers with colored glow lines

### Pricing Tiers (Current)
| Plan | Price | Key Features |
|------|-------|-------------|
| Solo_Recon_Node | $9.95/mo | 1 Agent, 1 Workspace, Local LLM |
| Architect_Elite_Swarm | $49/mo | Full Swarm, Unlimited Workspaces, Ghost Ops, Hardware Dominion |
| Sovereign_Entity | $67/node | Dedicated Node, Air-Gapped, White-Glove |

### Key Interactive Features
- **Hero Revelation Mode**: Hold CMD key to reveal "KERNEL_LIVE" easter egg
- **Terminal Demo**: Interactive terminal with command hints and streamed output
- **Agent Ecosystem**: Animated agent cards with spawn interaction
- **Ask Ora Widget**: Chat input in pricing section (currently non-functional — UI only)

### Conversion Concerns (From Brainstorming Session)
- **ACT V is too dense** — 15 technical sections create feature fatigue
- **Social proof uses placeholder logos** — not real partners
- **No risk reversal** near pricing (no guarantee, no free trial mention)
- **Only one CTA type** — "Download" — no soft entry (email, waitlist)
- **No "who is this for" qualifier** after hero
- **No urgency mechanism** (limited spots, price increase, etc.)
- **Proposed solution**: Split into "Sales Spine" (11 sections) vs "Knowledge Depth" (15 sections on `/features`)

---

## 6. THE MOGUL FUNNEL (`/mogul`)

### Status: **Parked — Needs Revisit**

An alternative high-ticket sales funnel designed for a "Mogul" persona using the PASTOR + 4P hybrid sales framework. Currently has all components built but the overall feel wasn't satisfactory.

### Components (11 dedicated Mogul components):
- `MogulHero.tsx` — High-ticket hero with sovereignty positioning
- `MogulStory.tsx` — Scroll-driven cinematic 3-scene storyteller (300vh sticky scroll)
- `MogulProblem.tsx` — Pain amplification for business owners
- `MogulTerminal.tsx` — Glitchy Ring-0 terminal with streamed logs
- `MogulTransformation.tsx` — Before/After for mogul persona
- `MogulDemoVideos.tsx` — Video demonstration section
- `MogulComparison.tsx` — Competitive comparison
- `MogulBonuses.tsx` — Bonus stack
- `MogulStats.tsx` — Key metrics
- `MogulPricingComparison.tsx` — Value comparison pricing
- `MogulFinalCTA.tsx` — Final close

### Issues Identified:
- MogulTerminal had runtime crashes (fixed — optional chaining on log lines)
- MogulStory had blank scroll space between scenes (fixed — tightened scroll ranges)
- Overall "feel" didn't satisfy the user — needs complete rethinking

---

## 7. MEMBER PORTAL (`/dashboard`)

### Status: **Functional but WIP**

Protected by Supabase Auth middleware. Users must be logged in to access.

### Dashboard Pages:
| Route | Purpose |
|-------|---------|
| `/dashboard` | Main dashboard — overview with stats, recent activity |
| `/dashboard/billing` | Billing management (Stripe portal integration) |
| `/dashboard/license` | License key management |
| `/dashboard/tokens` | Token wallet (buy, track usage) |
| `/dashboard/research` | Research hub |
| `/dashboard/settings` | User settings |

### Member Layout:
- Sidebar navigation
- Theme-aware UI

---

## 8. SUPERADMIN PANEL (`/superadmin`)

### Status: **Functional**

Completely separate authentication system from member auth. Uses custom JWT tokens signed with `jose`.

### Dashboard Pages:
| Route | Purpose |
|-------|---------|
| `/superadmin/login` | Admin login (bcrypt password verification) |
| `/superadmin/(dashboard)/overview` | Overview with key metrics (Active Orgs, Users, KBs, Runs, MRR) |
| `/superadmin/(dashboard)/users` | User management table |
| `/superadmin/(dashboard)/organizations` | Org management |
| `/superadmin/(dashboard)/agents` | Agent management |
| `/superadmin/(dashboard)/ai-providers` | AI provider configuration |
| `/superadmin/(dashboard)/models` | Model management |
| `/superadmin/(dashboard)/analytics` | Analytics dashboard (Recharts) |
| `/superadmin/(dashboard)/logs` | System logs viewer |
| `/superadmin/(dashboard)/engines` | Engine management |
| `/superadmin/(dashboard)/deployments` | Deployment tracking |
| `/superadmin/(dashboard)/settings` | Admin settings (7 sub-sections) |

### Superadmin Component Library:
Extensive component library under `components/superadmin/` with dedicated components for each admin section, dashboard widgets, and shared UI elements.

### Superadmin Settings Sub-sections:
The settings page is particularly rich with 7 configuration areas for managing various aspects of the platform.

---

## 9. AUTHENTICATION SYSTEM

### Two Separate Auth Systems:

#### Member Auth (Supabase):
- **Login**: `POST /api/auth/login` → Supabase email/password auth
- **Register**: `POST /api/auth/register` → Creates Supabase user
- **Forgot Password**: `POST /api/auth/forgot-password` → Supabase password reset
- **Logout**: `POST /api/auth/logout` → Clears Supabase session
- **Me**: `GET /api/auth/me` → Returns current user
- **Middleware**: `middleware.ts` protects `/dashboard` routes via Supabase SSR cookies

#### Superadmin Auth (Custom JWT):
- **Login**: `POST /api/superadmin/auth/login` → Verifies bcrypt password, issues JWT
- **Verification**: `POST /api/superadmin/auth/verify` → Validates JWT token
- **Session**: Stored in `superadmin_session` cookie (httpOnly, 24h expiry)
- **Middleware**: `lib/superadmin-middleware.ts` validates JWT on admin API routes
- **Role Hierarchy**: `superadmin > admin > support > readonly`
- **Permission System**: Role-based + granular permission checks
- Database table: `platform_admins` in Supabase

---

## 10. API ROUTES

### Auth (`/api/auth/`)
- `POST /login` — Member login
- `POST /register` — Member registration
- `POST /forgot-password` — Password reset
- `POST /logout` — Session cleanup
- `GET /me` — Current user info

### Members (`/api/members/`)
- `/license` — License management
- `/plans` — Available plans
- `/profile` — User profile CRUD
- `/tokens` — Token balance/transactions

### Stripe (`/api/stripe/`)
- `/checkout` — Create Stripe checkout session
- `/portal` — Create Stripe billing portal session
- `/webhooks` — Stripe webhook handler
- `/buy-tokens` — Token purchase flow

### Superadmin (`/api/superadmin/`)
- `/auth/login` — Admin login
- `/auth/verify` — Token verification
- `/admins` — Admin CRUD
- `/ai-providers` — AI provider management
- `/impersonate` — User impersonation
- `/models` — Model management
- `/settings` — Platform settings

### V1 Desktop Bridge (`/api/v1/`)
- `/keys` — API key management (for desktop app)
- `/license/activate` — License activation
- `/license/verify` — License verification
- `/research` — Research data sync
- `/tokens/balance` — Token balance check
- `/tokens/use` — Token consumption

---

## 11. DATABASE SCHEMA (Supabase)

### Migration Files (21 total, ordered):

| Migration | Purpose | Size |
|-----------|---------|------|
| `002_superadmin_tables` | Platform admins, system config | 13K |
| `003_user_profiles` | User profiles, preferences | 6K |
| `004_plans_and_licensing` | Plans, licenses, activation | 9K |
| `005_token_wallet_system` | Token wallets, transactions, packages | 12K |
| `006_managed_ai_service` | AI providers, models, usage tracking | 11K |
| `007_teams_collaboration` | Teams, memberships, roles | 12K |
| `008_analytics_telemetry` | Analytics events, heatmaps, funnels | 14K |
| `009_billing_stripe` | Stripe customers, subscriptions, invoices | 16K |
| `010_notifications_emails` | Notification templates, delivery, preferences | 14K |
| `011_support_system` | Tickets, messages, SLA, knowledge base | 15K |
| `012_api_management` | API keys, rate limits, webhooks | 15K |
| `013_gdpr_compliance` | Data requests, consent, retention policies | 15K |
| `014_performance_optimizations` | Indexes, materialized views, partitioning | 14K |
| `015_add_superadmin_user` | Seed initial superadmin | 1K |
| `016_superadmin_auth` | Auth helper functions | 1K |
| `017_bridge_helper_functions` | Desktop app bridge SQL helpers | 3K |

### Important Notes:
- Migrations were consolidated from multiple disparate systems into a single ordered set
- `BULK_006_to_014*.sql` files are idempotent versions for re-running (4 iterations)
- All migrations use `IF NOT EXISTS` / `CREATE OR REPLACE` for idempotency
- The auto-generated types file (`lib/database.types.ts`) is 51K and covers the full schema

---

## 12. THEME SYSTEM

### Architecture
The theme system is defined in `lib/themes.ts` (620 lines) and provides:

- **5 distinct themes**: Origin, Atelier, Aero, Sovereign, Operator
- **2 modes per theme**: Dark and Light (= 10 total variants)
- **Each theme has unique**: Color palette, font stack, border radius, surface scale

### Themes:

| Theme | Vibe | Fonts | Radius |
|-------|------|-------|--------|
| **Origin** | Cyberpunk Void — Electric Cyan + Hot Magenta | Inter / JetBrains Mono | 12px |
| **Atelier** | Vintage Craft — Gold + Sienna | Lora (serif) + Playfair Display | 4px |
| **Aero** | Swiss Brutalism — Pure B&W + Electric Orange | Outfit | 6px |
| **Sovereign** | Royal Luxury — Deep Violet + Gold | DM Sans + Manrope | 16px |
| **Operator** | Neural Terminal — Cyan + Acid Green | Space Grotesk + Fira Code | 2px |

### CSS Variable System
Themes are applied via CSS custom properties set on the `<body>` element:
- `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-glow`
- `--secondary`, `--secondary-foreground`
- `--surface-0` through `--surface-900` (11-stop surface scale)
- `--success`, `--warning`, `--error`, `--info` (with glow variants)
- `--gradient-primary`, `--gradient-secondary`, `--gradient-accent`
- `--font-primary`, `--font-display`, `--font-mono`
- `--radius`

### Theme Provider
- `components/theme/ThemeProvider.tsx` — Root provider, wraps the entire app
- `components/theme/ThemeSelector.tsx` — UI for switching themes
- Theme choice persisted (intended to sync with Supabase, check current impl)

---

## 13. DESIGN SYSTEM & TYPOGRAPHY

### Sales Page Design Language
- **Primary color**: Amber/Gold (`#F59E0B` / `var(--primary)`)
- **Secondary color**: Teal/Cyan
- **Background**: Jet black (#000000 to #0A0A0A)
- **Surface scale**: 11 stops from pitch black to white
- **Font sizes**: Uses `clamp()` extensively for responsive typography
- **Spacing**: Generous — sections use `py-12` to `py-40` padding
- **Border radius**: Large — `rounded-[40px]` to `rounded-[60px]` for cards
- **Borders**: Ultra-subtle `border-white/[0.03]` to `border-white/[0.08]`
- **Glass effects**: `backdrop-blur-3xl`, `bg-white/[0.02]`
- **Shadows**: Deep `shadow-2xl`, `shadow-[0_80px_160px_-40px_...]`

### Custom Tailwind Extensions (in `tailwind.config.js`):
- Custom animations: `fade-in`, `slide-up`, `slide-down`, `pulse-glow`, `shimmer`, `gradient-x`, `float-slow`, `float-slower`
- Custom colors aliased to CSS variables
- Custom font families aliased to CSS variables

---

## 14. STRIPE INTEGRATION

### Status: **Scaffolded, needs API keys**

- `lib/stripe/client.ts` — Client-side Stripe.js initialization
- `lib/stripe/server.ts` — Server-side Stripe instance
- `app/api/stripe/checkout/route.ts` — Creates checkout sessions
- `app/api/stripe/portal/route.ts` — Creates billing portal sessions
- `app/api/stripe/webhooks/route.ts` — Webhook handler
- `app/api/stripe/buy-tokens/route.ts` — Token purchase flow

### Missing:
- Stripe API keys not in `.env.local`
- Webhook secret not configured
- Product/Price IDs need to be created in Stripe dashboard
- Token purchase flow needs to be connected to the token wallet system

---

## 15. KEY LIBRARIES & DEPENDENCIES

### Production Dependencies
| Package | Version | Usage |
|---------|---------|-------|
| `next` | ^14.2.0 | Framework |
| `react` / `react-dom` | ^18.3.0 | UI |
| `framer-motion` | ^12.34.0 | Animations (HEAVY use in sales page) |
| `@supabase/supabase-js` | ^2.45.0 | Database client |
| `@supabase/ssr` | ^0.5.0 | Server-side Supabase (cookies) |
| `stripe` | ^20.3.1 | Server-side Stripe |
| `@stripe/stripe-js` | ^3.0.0 | Client-side Stripe |
| `jose` | ^5.9.0 | JWT signing/verification |
| `bcryptjs` | ^2.4.3 | Password hashing |
| `lucide-react` | ^0.460.0 | Icons |
| `recharts` | ^2.15.0 | Admin analytics charts |
| `sonner` | ^1.7.0 | Toast notifications |
| `zustand` | ^5.0.0 | State management |
| `@radix-ui/*` | Various | UI primitives |
| `class-variance-authority` | ^0.7.0 | Component variants |
| `clsx` + `tailwind-merge` | Latest | Class name utilities |
| `date-fns` | ^4.1.0 | Date formatting |

---

## 16. PUBLIC ASSETS

| File | Purpose | Size |
|------|---------|------|
| `architect_authentic_likeness.png` | Founder photo (Manifesto section) | 2.7MB |
| `architect_authentic_likeness.JPG` | Alternate founder photo | 254K |
| `1_architect_authentic_likeness.png` | Variant 1 | 58K |
| `2-architect_authentic_likeness.png` | Variant 2 | 1.5MB |
| `3architect_authentic_likeness.png` | Variant 3 | 1.4MB |
| `hollow_kernel_prism_*.png` | Generated kernel visual | 27K |
| `neural_constellation_core_*.png` | Generated neural visual | 72K |
| `assets/neural_mesh.png` | Neural mesh texture | — |
| `assets/sovereign_node.png` | Sovereign node visual | — |

---

## 17. KNOWN ISSUES & UNFINISHED WORK

### Critical
- [ ] **Stripe not connected** — API keys missing, products not created
- [ ] **Social proof uses placeholder logos** — `SocialProof.tsx` shows fake company names (KERNEL_RND, NEURAL_AXON, etc.)
- [ ] **Ask Ora widget is non-functional** — UI exists in pricing section but has no backend

### High Priority
- [ ] **Sales page ACT V too dense** — 15 technical sections cause scroll fatigue (see brainstorm notes)
- [ ] **Mogul funnel needs complete rethink** — User wasn't satisfied with the feel
- [ ] **No email capture / soft CTA** — Only "Download" CTA exists, losing non-ready visitors
- [ ] **No risk reversal** — No free trial, guarantee, or "try before you buy" mentioned
- [ ] **No urgency mechanism** — No scarcity, time pressure, or founding member pricing

### Medium Priority
- [ ] **Desktop app bridge API** (`/api/v1/`) — Endpoints exist but need testing with actual Rust app
- [ ] **Theme persistence** — Verify if theme choice persists via Supabase or only localStorage
- [ ] **Member dashboard** — Functional but UI polish needed, data connections may be incomplete
- [ ] **Image optimization** — Founder photos are very large (2.7MB main); need compression

### Low Priority
- [ ] **Design playground** — `/design-playground` and `/hero-playground` are dev-only testing routes
- [ ] **Backup files** — `app/backups/` and root `backups/` contain old versions; could be cleaned up

---

## 18. STRATEGIC BRAINSTORM NOTES

### Sales Page Conversion Strategy (Discussed 2026-02-15)

The sales page has "all the right elements" but is structured as a whitepaper, not a conversion funnel. Key insight: **it's a genius reference document and a beautiful visual experience, but the feature density creates fatigue before the prospect reaches pricing.**

#### Proposed Architecture:

**Sales Spine (stays on `/`):**
Hero → Problem → Manifesto → Transformation → TerminalDemo → StatsCounter → AgentEcosystem → GrandOffer → Pricing → FAQ → FinalCTA

**Knowledge Depth (moves to `/features` or collapsed UI):**
SovereigntyScorecard, EntropyAudit, AgentOrchestration, SwarmLogs, NeuralArchitecture, RawDirectives, ModesShowcase, SelfHealingUI, IntelligenceMantle, FeaturesAIOS, MultiWorkspace, SecurityVault, PerimeterMap, ResearchMemory, GlobalRelay

#### Key Additions Needed:
1. "Who is this for?" qualifier after hero (persona cards)
2. Risk reversal near pricing (guarantee / free trial)
3. Soft CTA (email capture for non-ready visitors)
4. Real social proof (actual user quotes, even if just 3)
5. "What would this cost?" cost comparison before pricing
6. Urgency mechanism (founding member, price increase date)
7. Video walkthrough or animated demo in hero

---

## 19. HOW TO RUN

### Development
```bash
cd "/Users/anweshrath/Documents/Cursor/Neeva Pilot/Oraya Saas"
npm install
npm run dev        # Starts on port 3000
```

### Production Build
```bash
npm run build
npm start          # Starts on port 3000
```

### Database Types
```bash
npm run db:generate   # Regenerates Supabase types (requires SUPABASE_PROJECT_ID env var)
```

### Deployment
- Push to `main` branch → Vercel auto-deploys
- Domain: `oraya.dev`

---

## 20. RELATED PROJECTS

| Project | Location | Description |
|---------|----------|-------------|
| **Oraya (Desktop App)** | `/Users/anweshrath/Documents/Cursor/Neeva Pilot/Oraya` | The main Oraya product — Rust/Tauri native AI OS. This is what the SaaS website sells. |
| **Oraya SaaS** | `/Users/anweshrath/Documents/Cursor/Neeva Pilot/Oraya Saas` | THIS project — the website, admin panel, member portal |

---

## APPENDIX: KEY FILE SIZES (For Context on Complexity)

| File | Size | Significance |
|------|------|-------------|
| `FeaturesAIOS.tsx` | 53K | Largest component — massive bento grid |
| `database.types.ts` | 51K | Auto-generated — shows schema breadth |
| `ai-providers.ts` | 31K | Extensive AI provider definitions |
| `MultiWorkspace.tsx` | 27K | Complex workspace visualization |
| `dashboard/page.tsx` | 24K | Dense member dashboard |
| `themes.ts` | 22K | 5 full theme definitions |
| `ResearchMemory.tsx` | 21K | Research system showcase |
| `Hero.tsx` | 20K | Complex hero with revelation mode |
| `ModesShowcase.tsx` | 20K | 4-mode interactive showcase |
| `SelfHealingUI.tsx` | 20K | Self-healing filesystem demo |
| `SovereigntyScorecard.tsx` | 19K | Competitive comparison matrix |
| `OrchestrationFlow.tsx` | 20K | Orchestration visualization |
| `IntelligenceMantle.tsx` | 19K | Intelligence layer showcase |
| `GlobalRelay.tsx` | 17K | Global infrastructure network |
| `AgentEcosystem.tsx` | 16K | Agent showcase |
| `SecurityVault.tsx` | 15K | Security architecture |
| `MogulHero.tsx` | 15K | Mogul hero (alternative) |
| `Pricing.tsx` | 14K | 3-tier pricing with Ask Ora |
| `GrandOffer.tsx` | 13K | 16-item value stack |
| `Problem.tsx` | 13K | Pain amplification |
| `globals.css` | 12K | Global styles + noise overlays + animations |
| `TerminalDemo.tsx` | 13K | Interactive terminal |
| `MogulTerminal.tsx` | 11K | Mogul terminal variant |

---

*This document was generated as a comprehensive handoff for the Oraya SaaS project. When resuming work on this codebase, start here to understand the full scope before diving into any specific area.*
