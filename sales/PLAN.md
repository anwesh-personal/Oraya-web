
# Oraya Sales Strategy: The "Immaculate" Plan

This document outlines the high-level architecture for transforming `oraya.dev` into a high-converting, $100M-class SaaS presence.

---

## 1. Domain & Routing Strategy

We will leverage the existing robust Next.js setup in `Oraya Saas` to serve multiple sales "fronts" without complex infrastructure fragmentation.

*   **Root Domain (`oraya.dev`)**: The flagship SaaS landing page.
    *   **Framework**: PASTOR (Problem, Amplify, SolutiOn, Transformation, Offer, Response).
    *   **Goal**: Establish authority, build trust, and convert enterprise/team leads.
    *   **Implementation**: `app/page.tsx` (replacing the current redirect).

*   **Special Offer / Subdomain (`special.oraya.dev`)**: High-intensity direct response page.
    *   **Framework**: 4P (Picture, Promise, Prove, Push) + AIDA (Attention, Interest, Desire, Action).
    *   **Goal**: Rapid conversion for specific cohorts or time-limited offers.
    *   **Implementation**: `app/special/page.tsx`. This can be mapped to a subdomain or `oraya.dev/special`.

*   **App Portal (`app.oraya.dev` or `oraya.dev/login`)**: The actual SaaS application.
    *   **Implementation**: Keep existing `app/login`, `app/dashboard`, etc.

---

## 2. Asset Migration Strategy

*   **Source**: `Oraya` repository (Tauri desktop app assets).
*   **Destination**: `Oraya Saas/public/assets`.
*   **Action**: Completed. All logos, icons, and branding assets have been copied to the SaaS repo to ensure consistent branding without broken links.

---

## 3. The "PASTOR" Framework (Root Page)

We will structure `app/page.tsx` section-by-section using the PASTOR framework:

1.  **P - Problem**: Identify the deep pain of disjointed AI tools, context switching, and data silos. "The AI Fragmentation Nightmare."
2.  **A - Amplify**: Agitate the pain. Show the cost of lost productivity, security risks, and "brain drain." "Your team is drowning in tabs."
3.  **S - Story/Solution**: Introduce Oraya as the "Unified Neural Interface." The story of seamless integration.
4.  **T - Transformation (Testimony)**: Show the "After" state. Teams working in sync, unified context, measurable speed. Social proof.
5.  **O - Offer**: The core value proposition. "The Operating System for Intelligence." Pricing tiers.
6.  **R - Response**: Clear Call to Action (CTA). "Get Started," "Download for Mac," "Talk to Sales."

**Key Sections to Build:**
*   **Hero Section**: High-impact visual (using copied assets) + Headline.
*   **"The Chaos" Section**: Visualizing the problem.
*   **"The Unification" Section**: Screenshots of Oraya in action (War Room, Context Strategies).
*   **Features Grid**: Highlighting the unique selling points (Privacy, Local-First, Team Sync).
*   **Pricing Table**: Transparent, high-value tiers.
*   **CTA Footer**: Final push.

---

## 4. The "4P + AIDA" Framework (Special Page)

We will structure `app/special/page.tsx` for high-velocity conversion:

1.  **P - Picture (Attention)**: "Imagine an AI that knows everything your team knows." (Hook).
2.  **P - Promise (Interest)**: "We promise 10x workflow speed or you don't pay." (Bold claim).
3.  **P - Prove (Desire)**: Case studies, metrics, "War Room" mode demo.
4.  **P - Push (Action)**: Scarcity, limited-time bonuses, immediate access.

---

## 5. Technical Implementation Plan

1.  **Shared UI Library**: Enhance `Oraya Saas/components/ui` with high-end, marketing-specific components (Hero, FeatureGrid, testimonial-slider).
2.  **Theme Synchronization**: Ensure the SaaS `globals.css` matches the desktop app's "Ultra Premium" aesthetic (dark mode default, neon accents).
3.  **Performance**: Use Next.js Image optimization for all migrated assets.

## Next Steps

1.  **Design the Hero Section (PASTOR - P)**: Create the opening statement for `oraya.dev`.
2.  **Build the Component**: Implement the Hero component in `Oraya Saas`.
3.  **Iterate**: Move down the PASTOR framework section by section.
