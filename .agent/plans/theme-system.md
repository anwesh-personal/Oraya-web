# Theme System — Architecture & Guide

**Last Updated:** February 10, 2026

---

## Overview

Oraya SaaS has a 5-theme × 2-mode (dark/light) design system. Every UI element must be theme-aware.

---

## Theme Identities

### 1. Origin — Cyberpunk Void
- **Vibe:** Deep space, electric neon, glassmorphic
- **Fonts:** Inter (clean neo-grotesque)
- **Radius:** 12px (soft rounded)
- **Dark:** Pure black bg, cyan primary (#00F0FF), magenta secondary (#FF00AA)
- **Light:** Cool neutral gray bg (#f0f0f2), blue primary (#0066FF)
- **Surfaces (dark):** Pure neutral: #050505 → #0a0a0a → #111111 → #1a1a1a
- **Surfaces (light):** Apple-style neutral: #f0f0f2 → #f8f8fa → #ffffff

### 2. Atelier — Vintage Craftsmanship
- **Vibe:** Analog warmth, artisan workshop, old-world luxury
- **Fonts:** Lora (serif body!) + Playfair Display (serif headings!)
- **Radius:** 4px (sharp, editorial)
- **Dark:** Warm charcoal bg (#0F0D0A), gold primary (#C5A55A), sienna secondary
- **Light:** CREAM/PARCHMENT bg (#F5EDE0), chocolate primary (#6B4226), forest green secondary
- **Surfaces (dark):** Brown-tinted: #0F0D0A → #181510 → #221F18 → #2C2820
- **Surfaces (light):** Warm linen: #EDE4D4 → #F5EDE0 → #FDF8F0 → #F8F0E4

### 3. Aero — Swiss Brutalism
- **Vibe:** Editorial precision, zero decoration, maximum contrast
- **Fonts:** Outfit (geometric modern sans)
- **Radius:** 6px (crisp, efficient)
- **Dark:** Pure black bg (#000000), white primary (#FFFFFF), orange secondary (#FF4F00)
- **Light:** Pure white bg (#FAFAFA), black primary (#000000), orange secondary (#FF4F00)
- **Surfaces (dark):** Pure gray: #000000 → #080808 → #101010 → #181818
- **Surfaces (light):** Pure stark: #F2F2F2 → #FAFAFA → #FFFFFF → #F5F5F5

### 4. Sovereign — Royal Luxury
- **Vibe:** Purple velvet, gold accents, luxury SaaS
- **Fonts:** DM Sans (body) + Manrope (headings)
- **Radius:** 16px (pillowy soft)
- **Dark:** Deep indigo bg (#050510), purple primary (#7C3AED), gold secondary (#D4AF37)
- **Light:** INDIGO-SLATE bg (#EEF0FF), deep purple primary (#6D28D9), amber secondary
- **Surfaces (dark):** Indigo-tinted: #050510 → #0B0B18 → #121228 → #181834
- **Surfaces (light):** Blue-lavender: #E8EAFE → #EEF0FF → #F8F8FF → #F0F1FE

### 5. Operator — Neural Terminal
- **Vibe:** Hacker terminal, bioluminescent, sci-fi interface
- **Fonts:** Space Grotesk (angular techy) + Fira Code (mono)
- **Radius:** 2px (hard-edged, terminal)
- **Dark:** Deep teal-black bg (#000000), cyan primary (#00EAFF), acid green secondary (#CCFF00)
- **Light:** TEAL/MINT bg (#E4F0F0), dark teal primary (#007A85), olive green secondary
- **Surfaces (dark):** Teal-tinted: #000000 → #040808 → #0A1010 → #0F1818
- **Surfaces (light):** Cool mint: #D8E8E8 → #E4F0F0 → #F0F8F8 → #E8F2F2

---

## Implementation Details

### Files Involved

| File | Role |
|------|------|
| `lib/themes.ts` | Theme definitions (colors, fonts, radius, gradients) |
| `stores/theme-store.ts` | Zustand store, persists to `oraya-theme-storage`, applies CSS vars |
| `components/superadmin/theme/ThemeProvider.tsx` | Mounts in layout, calls `initializeTheme()` |
| `app/globals.css` | Consumes CSS variables for body, headings, code, scrollbars |
| `components/superadmin/settings/ThemeSettings.tsx` | UI for selecting theme + mode |

### CSS Variable Mapping

`getThemeCSSVariables()` generates these CSS custom properties:

```
--font-primary, --font-display, --font-mono
--radius
--primary, --primary-foreground, --primary-hover, --primary-glow
--secondary, --secondary-foreground
--surface-0 through --surface-900
--success, --success-glow, --warning, --warning-glow, --error, --error-glow, --info, --info-glow
--gradient-primary, --gradient-secondary, --gradient-accent
```

### How Fonts Load

ThemeProvider dynamically creates a `<link>` tag in `<head>`:
```js
const link = document.createElement('link');
link.id = 'theme-font';
link.href = theme.fonts.url;  // Google Fonts URL
link.rel = 'stylesheet';
document.head.appendChild(link);
```

This means fonts load on theme switch — there may be a brief FOUT (flash of unstyled text) on first load.

---

## Adding a New Theme

1. Add the theme ID to `ThemeId` type
2. Add the full theme object to `themes` record
3. Ensure it has unique: font family, surface tint, primary/secondary colors
4. Test in both dark and light modes
5. Verify all stat cards, buttons, modals, tables render correctly

---

## Common Patterns

### Stat Cards
```tsx
<div className="p-6 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 border border-primary/20">
    <p className="text-sm text-[var(--surface-500)]">Label</p>
    <p className="text-2xl font-bold text-[var(--surface-900)]">{value}</p>
</div>
```

### Section Headers
```tsx
<h1 className="text-3xl font-bold text-[var(--surface-900)]">Title</h1>
<p className="text-[var(--surface-500)] mt-1">Subtitle</p>
```

### Secondary Buttons
```tsx
<button className="bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-700)] hover:bg-[var(--surface-200)]">
```

### Primary Buttons
```tsx
<button className="text-[var(--primary-foreground)]" style={{ background: 'var(--gradient-primary)' }}>
```

### Cards/Containers
```tsx
<div className="card p-6">     {/* Uses .card class from globals.css */}
<div className="bg-[var(--surface-50)] border border-[var(--surface-300)] rounded-[var(--radius)]">
```
