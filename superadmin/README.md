# Superadmin - Multi-Tenant SaaS Platform

This folder contains everything related to the Oraya SaaS platform administration.

## Structure

```
superadmin/
├── supabase/           # SaaS platform database
│   └── migrations/     # Platform tables (002-014)
├── dashboard/          # Admin UI (to be built)
├── api/                # Admin API endpoints (to be built)
└── docs/               # Platform documentation
```

## Supabase Migrations

| Migration | Purpose |
|-----------|---------|
| 002_superadmin_tables | Platform admins, settings, audit logs |
| 003_user_profiles | User profiles, referrals, preferences |
| 004_plans_and_licensing | Plans, licenses, activations |
| 005_token_wallet_system | Token wallets, purchases, usage |
| 006_managed_ai_service | AI keys, usage logs, pricing |
| 007_teams_collaboration | Teams, members, shared agents |
| 008_analytics_telemetry | App telemetry, feature usage |
| 009_billing_stripe | Stripe integration, payments |
| 010_notifications_emails | Notification system |
| 011_support_system | Support tickets, FAQs |
| 012_api_management | API keys, rate limits |
| 013_gdpr_compliance | Data requests, consent |
| 014_performance_optimizations | Indexes, materialized views |

## Dashboard

Admin dashboard for platform operators to:
- Manage organizations
- View analytics
- Handle billing
- Manage AI providers
- Monitor system health
