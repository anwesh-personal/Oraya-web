# ORAYA — DESIGN LANGUAGE & AESTHETICS 🎨

The Oraya aesthetic is defined as **"Cyber-Premium Minimalism."** It combines the technical grit of a HUD (Heads-Up Display) with the glassmorphism of a premium consumer app.

## 1. Color Palettes (The "Sentience" & "Vault" Tokens)

### Neural Core (Sentience)
- **Neon Purple**: `#B794F6` (Primary Action)
- **Neon Cyan**: `#22D3EE` (Intelligence / AI)
- **Neon Blue**: `#60A5FA` (Logic / Terminal)
- **BG Deep**: `#000000` (The Void)

### Sovereign Vault (Security)
- **Gold**: `#F0B429` (Protection / Encrypted)
- **Rose**: `#F43F5E` (Warning / Breach)
- **Emerald**: `#10B981` (Success / Verified)

## 2. Visual Elements

### The "Glassmorphism" Formula
- **Backdrop Blur**: `blur(20px)` to `blur(40px)`
- **Border**: `1px solid rgba(255, 255, 255, 0.08)`
- **Surface**: `rgba(255, 255, 255, 0.03)`
- **Noise**: `0.03 opacity` noise texture overlay (Found in `vault-fortress-interactive.html`).

### Motion Language
- **The "Scanning Beam"**: A linear gradient that sweeps vertically across cards/images to signify active AI processing.
- **Ambient Floating Orbs**: Large, soft-blurred radial gradients drifting between sections (`floatSlow`, `floatSlower` animations).
- **Staggered Reveals**: Elements never appear all at once; they flow from top to bottom with a `duration: 0.8s` and `delay: 0.2s` staggered sequence.

## 3. Typography
- **Display**: `Inter` (Extra Bold / Black) - Tracking `-0.04em`.
- **System/UI**: `Rajdhani` or `Orbitron` (For technical HUD elements only).
- **Code/Data**: `JetBrains Mono` or `Recursive`.

## 4. Key Components (From HTML Templates)

| Component | Design Pattern |
|-----------|----------------|
| **Feature Cards** | Staggered grid, 24px border radius, subtle inner glow on hover. |
| **Control Buttons** | Border-only (`2px`), text-color match, blur background. |
| **Status Badges** | Capsule shape, animated breathing dot, mono-spaced font. |
| **The Vault Visual** | Concentric rotating rings with a pulsing core. |

## 5. Implementation Standard for "Magnificence"
1. **Never use generic grays**: Use deeply saturated blacks (`#050505`) or tinted darks.
2. **Neon touches**: Use neon colors only for glows and strokes, never for solid backgrounds.
3. **Interactive depth**: Every card must respond to mouse movement or scroll position (parallax).
