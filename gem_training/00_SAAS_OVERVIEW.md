# 00_SAAS_OVERVIEW.md

**Oraya SaaS Architecture**  
**Updated:** March 2026

The Oraya SaaS platform is the centralized backend that powers the entire Oraya ecosystem. While individual users run the Oraya Desktop app locally, the SaaS platform manages licensing, authentication, and the distribution of Cloud Specialist Agents.

---

## 🏗️ Core Stack

- **Frontend/API**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments/Licensing**: Stripe
- **Hosting**: Vercel

---

## 🔄 Cloud ↔ Desktop Sync

The Oraya Desktop application operates offline-first but relies on the SaaS backend for crucial updates via the `sync/` module in Rust.

1. **Auth & License Status**: Upon login in Desktop, a token is exchanged with Supabase. The Desktop app queries the SaaS API to check active subscriptions (`user_licenses` table) to determine what tier (Standard, Pro, Enterprise) the user is on.
2. **Cloud Agents**: The Desktop app periodically pulls down agent templates via the `get_user_accessible_agents` RPC.
3. **Telemetry**: Anonymized usage and token consumption data are pushed to the SaaS for dashboard metrics.

---

## 🗄️ Database Architecture (Supabase)

Our Supabase instance acts as the global truth for agent configs.

### Key Schemas:

- `users` / `user_licenses`: Tracks subscription tiers.
- `agent_templates`: The base configuration for all global agents (Ora, Mara, Axon, Cipher, etc.).
- `user_agent_assignments`: Tracks which users have access to which premium agents.

### The Template Compilation Engine

When the Desktop app asks for agent updates, it hits the `get_user_accessible_agents` RPC (defined in Migration `046`). Since prompts are modularized into separate tables for maintainability on the web dashboard, the database actually stitches them together before sending them to Desktop.

The SaaS database concatenates:
1. Base `core_prompt`
2. `agent_template_prompts` (Expertise)
3. `agent_template_examples` (Few-shot)
4. `agent_template_rules` (Guardrails)
5. `agent_template_knowledge_bases` (Inline Manual type KB only)

The resulting massive string is sent to the local SQLite `agents.core_prompt` column on the user's machine, allowing the local Rust `SmartContextBuilder` to do its final injections.
