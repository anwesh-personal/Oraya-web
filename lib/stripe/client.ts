import Stripe from "stripe";
import { getStripeSecretKey } from "./config";

// ─────────────────────────────────────────────────────────────
// Stripe Server-Side Client (Lazy Singleton)
// ─────────────────────────────────────────────────────────────
// Uses the SECRET key — never exposed to browsers.
// Reads from platform_settings DB first, then falls back to
// STRIPE_SECRET_KEY env var. Lazy so it doesn't fail at build time.
// ─────────────────────────────────────────────────────────────

let _stripe: Stripe | null = null;
let _stripeKey: string | null = null;

/**
 * Get the Stripe client instance. Creates one lazily.
 * Call this in API route handlers (not at module top level).
 */
export async function getStripeClient(): Promise<Stripe> {
    const key = await getStripeSecretKey();

    if (!key) {
        throw new Error(
            "Stripe secret key not configured.\n" +
            "Set it via Superadmin → Settings → Billing, or add STRIPE_SECRET_KEY to .env.local.\n" +
            "Get your key from https://dashboard.stripe.com/apikeys"
        );
    }

    // Reuse client if key hasn't changed
    if (_stripe && _stripeKey === key) return _stripe;

    _stripe = new Stripe(key, {
        apiVersion: "2026-01-28.clover",
        typescript: true,
        appInfo: {
            name: "Oraya AI OS",
            version: "1.0.0",
            url: "https://oraya.dev",
        },
    });
    _stripeKey = key;

    return _stripe;
}

// ─────────────────────────────────────────────────────────────
// Sync fallback — uses env var only (for backward compat)
// ─────────────────────────────────────────────────────────────

function getStripeSync(): Stripe {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
        throw new Error(
            "STRIPE_SECRET_KEY is not set. Add it to your .env.local file.\n" +
            "Or configure it via Superadmin → Settings → Billing.\n" +
            "Get your key from https://dashboard.stripe.com/apikeys"
        );
    }

    if (_stripe && _stripeKey === key) return _stripe;

    _stripe = new Stripe(key, {
        apiVersion: "2026-01-28.clover",
        typescript: true,
        appInfo: {
            name: "Oraya AI OS",
            version: "1.0.0",
            url: "https://oraya.dev",
        },
    });
    _stripeKey = key;
    return _stripe;
}

// Proxy for backward-compat sync usage
const stripe = new Proxy({} as Stripe, {
    get(_target, prop) {
        return (getStripeSync() as unknown as Record<string | symbol, unknown>)[prop];
    },
});

export default stripe;
