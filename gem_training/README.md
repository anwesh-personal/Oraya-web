# 🎓 Oraya SaaS — System Documentation & Training Data

> Canonical source of truth for the Oraya SaaS platform.
> Covers: Supabase, Next.js app, agent templates, licensing, user management.

## Purpose

This folder contains system documentation and training materials for the
Oraya SaaS platform (cloud backend that powers agent distribution, user
management, licensing, and prompt compilation).

## Structure

```
gem_training/
├── README.md                    # This file
├── 00_SAAS_OVERVIEW.md          # SaaS architecture: Next.js, Supabase, auth
├── 01_AGENT_TEMPLATES.md        # Cloud agent templates and prompt compilation
├── 02_USER_MANAGEMENT.md        # Users, plans, licenses, tiers
├── 03_SAAS_DESKTOP_SYNC.md      # How SaaS ↔ Desktop sync works
├── 04_MIGRATIONS.md             # Supabase migrations, VPS DB, seed data
│
├── superadmin/                  # Superadmin dashboard documentation
│   └── OVERVIEW.md
│
├── evolution/                   # System evolution and changelog
│   └── CHANGELOG.md
│
└── checklists/                  # Audit results and TODO tracking
    ├── done.md
    └── next_version.md
```

## Status

🔴 **IN PROGRESS** — Files being populated as part of March 2026 repo cleanup.
