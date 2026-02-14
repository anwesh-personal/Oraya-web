import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────
// Stripe Configuration
// ─────────────────────────────────────────────────────────────
// Reads from platform_settings DB table. Falls back to env vars
// if DB is not reachable or not yet configured.
//
// The superadmin Billing Settings page writes these values
// into `platform_settings` with category = "billing".
// ─────────────────────────────────────────────────────────────

// ── Cache ──
// Settings are cached for the lifetime of the process.
// Container restart refreshes them.
let _settingsCache: Map<string, string> | null = null;
let _cacheLoadedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function loadSettingsFromDb(): Promise<Map<string, string>> {
    const now = Date.now();
    if (_settingsCache && now - _cacheLoadedAt < CACHE_TTL_MS) {
        return _settingsCache;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        // Can't reach DB — return empty, fall through to env vars
        return new Map();
    }

    try {
        const supabase = createClient(url, key, {
            auth: { persistSession: false },
        });

        const { data, error } = await supabase
            .from("platform_settings")
            .select("key, value")
            .eq("category", "billing");

        if (error || !data) {
            console.warn("Could not load billing settings from DB:", error?.message);
            return _settingsCache || new Map();
        }

        const map = new Map<string, string>();
        for (const row of data) {
            try {
                // Values are stored as JSON strings
                const parsed = JSON.parse(row.value);
                map.set(row.key, typeof parsed === "string" ? parsed : String(parsed));
            } catch {
                map.set(row.key, String(row.value));
            }
        }

        _settingsCache = map;
        _cacheLoadedAt = now;
        return map;
    } catch (err) {
        console.warn("DB settings load failed, using env vars:", err);
        return _settingsCache || new Map();
    }
}

/**
 * Get a setting value. Checks DB first, then env var fallback.
 */
async function getSetting(dbKey: string, envVar?: string): Promise<string> {
    const settings = await loadSettingsFromDb();
    const dbVal = settings.get(dbKey);
    if (dbVal) return dbVal;
    if (envVar) return process.env[envVar] || "";
    return "";
}

// ─────────────────────────────────────────────────────────────
// Exported getters (async — call these in API routes)
// ─────────────────────────────────────────────────────────────

/**
 * Get the Stripe secret key. DB → env fallback.
 */
export async function getStripeSecretKey(): Promise<string> {
    return getSetting("stripe.secret_key", "STRIPE_SECRET_KEY");
}

/**
 * Get the Stripe publishable key. DB → env fallback.
 */
export async function getStripePublishableKey(): Promise<string> {
    return getSetting("stripe.publishable_key", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
}

/**
 * Get the webhook signing secret. DB → env fallback.
 */
export async function getStripeWebhookSecret(): Promise<string> {
    return getSetting("stripe.webhook_secret", "STRIPE_WEBHOOK_SECRET");
}

/**
 * Get subscription plan price IDs. DB → env fallback.
 */
export async function getPlanPriceIds(): Promise<
    Record<string, { monthly: string; yearly: string }>
> {
    return {
        pro: {
            monthly: await getSetting("stripe.price.pro.monthly", "STRIPE_PRICE_PRO_MONTHLY"),
            yearly: await getSetting("stripe.price.pro.yearly", "STRIPE_PRICE_PRO_YEARLY"),
        },
        team: {
            monthly: await getSetting("stripe.price.team.monthly", "STRIPE_PRICE_TEAM_MONTHLY"),
            yearly: await getSetting("stripe.price.team.yearly", "STRIPE_PRICE_TEAM_YEARLY"),
        },
        enterprise: {
            monthly: await getSetting("stripe.price.enterprise.monthly", "STRIPE_PRICE_ENTERPRISE_MONTHLY"),
            yearly: await getSetting("stripe.price.enterprise.yearly", "STRIPE_PRICE_ENTERPRISE_YEARLY"),
        },
    };
}

/**
 * Get token package price IDs. DB → env fallback.
 */
export async function getTokenPackagePriceIds(): Promise<Record<string, string>> {
    return {
        starter: await getSetting("stripe.price.tokens.starter", "STRIPE_PRICE_TOKENS_STARTER"),
        basic: await getSetting("stripe.price.tokens.basic", "STRIPE_PRICE_TOKENS_BASIC"),
        pro: await getSetting("stripe.price.tokens.pro", "STRIPE_PRICE_TOKENS_PRO"),
        premium: await getSetting("stripe.price.tokens.premium", "STRIPE_PRICE_TOKENS_PREMIUM"),
        enterprise: await getSetting("stripe.price.tokens.enterprise", "STRIPE_PRICE_TOKENS_ENTERPRISE"),
    };
}

/**
 * App URLs for Stripe redirects. DB → env fallback.
 */
export async function getAppUrl(): Promise<string> {
    const url = await getSetting("platform.app_url", "NEXT_PUBLIC_APP_URL");
    return url || "http://localhost:3000";
}

export async function getStripeRedirectUrls() {
    const appUrl = await getAppUrl();
    return {
        successUrl: `${appUrl}/dashboard/billing?checkout=success`,
        cancelUrl: `${appUrl}/dashboard/billing?checkout=cancelled`,
        tokenSuccessUrl: `${appUrl}/dashboard/tokens?purchase=success`,
        tokenCancelUrl: `${appUrl}/dashboard/tokens?purchase=cancelled`,
        portalReturnUrl: `${appUrl}/dashboard/billing`,
    };
}

// ─────────────────────────────────────────────────────────────
// Backwards compatibility — sync exports for non-async contexts
// These use env vars ONLY (for import-time usage in edge/middleware)
// ─────────────────────────────────────────────────────────────

export const STRIPE_WEBHOOK_SECRET =
    process.env.STRIPE_WEBHOOK_SECRET || "";

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const STRIPE_SUCCESS_URL = `${APP_URL}/dashboard/billing?checkout=success`;
export const STRIPE_CANCEL_URL = `${APP_URL}/dashboard/billing?checkout=cancelled`;
export const STRIPE_TOKEN_SUCCESS_URL = `${APP_URL}/dashboard/tokens?purchase=success`;
export const STRIPE_TOKEN_CANCEL_URL = `${APP_URL}/dashboard/tokens?purchase=cancelled`;
export const STRIPE_PORTAL_RETURN_URL = `${APP_URL}/dashboard/billing`;

export const PLAN_PRICE_IDS: Record<
    string,
    { monthly: string; yearly: string }
> = {
    pro: {
        monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
        yearly: process.env.STRIPE_PRICE_PRO_YEARLY || "",
    },
    team: {
        monthly: process.env.STRIPE_PRICE_TEAM_MONTHLY || "",
        yearly: process.env.STRIPE_PRICE_TEAM_YEARLY || "",
    },
    enterprise: {
        monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || "",
        yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || "",
    },
};

export const TOKEN_PACKAGE_PRICE_IDS: Record<string, string> = {
    starter: process.env.STRIPE_PRICE_TOKENS_STARTER || "",
    basic: process.env.STRIPE_PRICE_TOKENS_BASIC || "",
    pro: process.env.STRIPE_PRICE_TOKENS_PRO || "",
    premium: process.env.STRIPE_PRICE_TOKENS_PREMIUM || "",
    enterprise: process.env.STRIPE_PRICE_TOKENS_ENTERPRISE || "",
};

/**
 * Force refresh the settings cache (e.g., after saving new settings)
 */
export function invalidateSettingsCache() {
    _settingsCache = null;
    _cacheLoadedAt = 0;
}
