# Oraya SaaS — Agent Handover Document

**Last Updated:** February 10, 2026  
**Workspace:** `/Users/anweshrath/Documents/Cursor/Neeva Pilot/Oraya Saas/`

---

## 🚨 RULES — Read Before Touching Any Code

### Rule 1: NO HARDCODED COLORS — EVER.

Every color must use CSS variables. No exceptions.

```tsx
// ❌ NEVER DO THIS
<h1 className="text-white">Title</h1>
<div className="bg-gray-800 border-gray-700">
<button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">

// ✅ ALWAYS DO THIS
<h1 className="text-[var(--surface-900)]">Title</h1>
<div className="bg-[var(--surface-100)] border-[var(--surface-300)]">
<button className="text-[var(--primary-foreground)]" style={{ background: 'var(--gradient-primary)' }}>
```

**The ONLY exception:** `text-white` on a colored background where the background itself is a CSS variable (e.g., `bg-[var(--primary)]` with `text-white` for a button). Even then, prefer `text-[var(--primary-foreground)]`.

### Rule 2: PREMIUM QUALITY — No MVPs, No Shortcuts

- Use rich animations and micro-interactions
- Use `var(--radius)` for border-radius on all cards/containers
- Use `var(--font-display)` for headings (via CSS `h1-h6` selector)
- Use `var(--font-primary)` for body text (via CSS `body` selector)
- Every gradient must use `var(--gradient-primary)`, `var(--gradient-secondary)`, or `var(--gradient-accent)`
- Glow effects use `var(--primary-glow)`, `var(--success-glow)`, etc.

### Rule 3: THEME-AWARE EVERYTHING

The app has 5 distinct themes × 2 modes (dark/light). Every element must look correct in all 10 combinations.

**Variable Reference Table:**

| Use Case | Variable | Dark Example | Light Example |
|----------|----------|-------------|---------------|
| Page background | `--surface-0` | `#050505` | `#f0f0f2` |
| Card background | `--surface-50` | `#0a0a0a` | `#f8f8fa` |
| Input/elevated bg | `--surface-100` | `#111111` | `#ffffff` |
| Subtle bg | `--surface-200` | `#1a1a1a` | `#f5f5f7` |
| Borders | `--surface-300` | `#252525` | `#d8d8dc` |
| Hover borders | `--surface-400` | `#333333` | `#b8b8be` |
| Secondary text | `--surface-500` | `#555555` | `#8e8e93` |
| Tertiary text | `--surface-600` | `#888888` | `#6e6e73` |
| Body text | `--surface-700` | `#aaaaaa` | `#48484a` |
| Strong text | `--surface-800` | `#dddddd` | `#2c2c2e` |
| Headings/max contrast | `--surface-900` | `#ffffff` | `#1c1c1e` |
| Primary brand | `--primary` | `#00F0FF` | `#0066FF` |
| Primary button text | `--primary-foreground` | `#000000` | `#ffffff` |
| Primary gradient | `--gradient-primary` | cyan→blue | blue→blue |
| Success | `--success` | `#00FF99` | `#009966` |
| Warning | `--warning` | `#FFBB00` | `#D48806` |
| Error | `--error` | `#FF0044` | `#CF1322` |
| Info | `--info` | `#00CCFF` | `#0050B3` |

### Rule 4: FONTS ARE THEME-SPECIFIC

Do NOT import or reference fonts directly. Fonts are loaded dynamically by `ThemeProvider`.

| Theme | Body Font | Heading Font |
|-------|-----------|-------------|
| Origin | Inter | Inter |
| Atelier | Lora (serif) | Playfair Display (serif) |
| Aero | Outfit | Outfit |
| Sovereign | DM Sans | Manrope |
| Operator | Space Grotesk | Space Grotesk |

### Rule 5: GRADIENTS USE INLINE STYLES

Tailwind's `from-[var()]` syntax does NOT work with CSS variables at build time. Always use:

```tsx
// ❌ Doesn't work
<button className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">

// ✅ Works
<button style={{ background: 'var(--gradient-primary)' }}>
```

---

## Architecture Overview

### Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + CSS Variables
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth + JWT (superadmin has custom JWT)
- **State Management:** Zustand
- **Theme System:** Custom (`lib/themes.ts` → `stores/theme-store.ts` → `ThemeProvider`)
- **Deployment:** Vercel

### Directory Structure

```
Oraya Saas/
├── app/
│   ├── superadmin/           # Superadmin panel
│   │   ├── (dashboard)/      # Authenticated pages
│   │   │   ├── agents/
│   │   │   ├── ai-providers/
│   │   │   ├── analytics/
│   │   │   ├── deployments/
│   │   │   ├── engines/
│   │   │   ├── logs/
│   │   │   ├── organizations/
│   │   │   ├── overview/
│   │   │   ├── settings/
│   │   │   ├── users/
│   │   │   └── layout.tsx    # Dashboard layout with sidebar
│   │   ├── login/            # Superadmin login
│   │   └── page.tsx          # Root redirect
│   ├── dashboard/            # Member dashboard pages
│   ├── api/                  # API routes
│   ├── globals.css           # CSS variables, utilities
│   └── layout.tsx            # Root layout
├── components/
│   ├── superadmin/           # Superadmin components (theme-aware)
│   └── members/              # Member components (theme-aware)
├── lib/
│   ├── themes.ts             # 5 themes × 2 modes definition
│   ├── supabase/             # Supabase client configs
│   └── utils.ts              # Utility functions
├── stores/
│   └── theme-store.ts        # Zustand theme state + CSS variable application
├── members/                  # ⚠️ STANDALONE app — may be deprecated
├── superadmin/               # ⚠️ STANDALONE app — may be deprecated
└── .agent/
    ├── handover/             # This documentation
    ├── sessions/             # Session logs
    └── workflows/            # Automation workflows
```

### Theme System Flow

```
lib/themes.ts (defines 5 themes × 2 modes)
    ↓
stores/theme-store.ts (Zustand store, persists to localStorage)
    ↓
ThemeProvider (components/superadmin/theme/ThemeProvider.tsx)
    ↓
Calls applyTheme() → sets CSS variables on document.documentElement
    ↓
globals.css consumes variables → body { font-family: var(--font-primary) }
    ↓
Components use variables → text-[var(--surface-900)], bg-[var(--surface-50)]
```

---

## Running the App

```bash
# Main app (port 3000)
cd "Oraya Saas"
npm run dev

# ⚠️ Standalone superadmin (port 3100) — may conflict, prefer main app
cd superadmin/dashboard
npm run dev
```

**If you see stale UI after theme changes:**
```bash
rm -rf .next && npm run dev
```

---

## Known Issues & Gotchas

1. **Duplicate Next.js apps** — `superadmin/dashboard/` and `members/app/` are standalone copies of what's in the main app's `app/superadmin/` and `app/dashboard/`. The main app is the source of truth.

2. **`images.domains` deprecation** — `next.config.mjs` uses deprecated `images.domains`, should migrate to `images.remotePatterns`.

3. **Supabase migrations** — Some migration files may need `IF NOT EXISTS` guards for re-runnability. See conversation about "Fixing Supabase Migrations".

4. **Superadmin auth** — Uses custom JWT, not Supabase auth. See `superadmin-middleware.ts` and `useSuperadminAuth` hook.

---

## Recent Commits (This Session)

```
6f7bce0e fix: theme-aware app/superadmin pages - fix light theme contrast
21871519 feat: dramatically distinct themes with unique fonts and tinted surfaces
```
