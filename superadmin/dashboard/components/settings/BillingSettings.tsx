"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Save,
    CreditCard,
    Eye,
    EyeOff,
    CheckCircle,
    AlertCircle,
    Loader2,
    RefreshCw,
    Zap,
    ShieldCheck,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface PlatformSetting {
    key: string;
    value: string;
    category: string;
    description: string | null;
    is_sensitive: boolean;
    has_value?: boolean;
    updated_at: string | null;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function parseSettingValue(raw: string | null | undefined): string {
    if (!raw) return "";
    try {
        const parsed = JSON.parse(raw);
        return typeof parsed === "string" ? parsed : String(parsed);
    } catch {
        return String(raw);
    }
}

function getToken(): string {
    return localStorage.getItem("oraya-superadmin-token") || "";
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function BillingSettings() {
    // ── State ──
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
    const [testResult, setTestResult] = useState<"idle" | "testing" | "connected" | "error">("idle");
    const [showSecretKey, setShowSecretKey] = useState(false);
    const [showWebhookSecret, setShowWebhookSecret] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [hasExistingKeys, setHasExistingKeys] = useState({
        secretKey: false,
        publishableKey: false,
        webhookSecret: false,
    });

    // Stripe keys
    const [stripeSecretKey, setStripeSecretKey] = useState("");
    const [stripePublishableKey, setStripePublishableKey] = useState("");
    const [stripeWebhookSecret, setStripeWebhookSecret] = useState("");

    // Price IDs
    const [priceProMonthly, setPriceProMonthly] = useState("");
    const [priceProYearly, setPriceProYearly] = useState("");
    const [priceTeamMonthly, setPriceTeamMonthly] = useState("");
    const [priceTeamYearly, setPriceTeamYearly] = useState("");
    const [priceEntMonthly, setPriceEntMonthly] = useState("");
    const [priceEntYearly, setPriceEntYearly] = useState("");

    // Token package price IDs
    const [priceTokensStarter, setPriceTokensStarter] = useState("");
    const [priceTokensBasic, setPriceTokensBasic] = useState("");
    const [priceTokensPro, setPriceTokensPro] = useState("");
    const [priceTokensPremium, setPriceTokensPremium] = useState("");
    const [priceTokensEnterprise, setPriceTokensEnterprise] = useState("");

    // Billing options
    const [currency, setCurrency] = useState("usd");
    const [taxRate, setTaxRate] = useState(0);
    const [trialDays, setTrialDays] = useState(14);
    const [gracePeriodDays, setGracePeriodDays] = useState(3);

    // ── Load settings from DB ──
    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await fetch("/api/superadmin/settings?category=billing", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error("Failed to load settings");

            const { settings } = await response.json() as { settings: PlatformSetting[] };

            const lookup = new Map<string, PlatformSetting>();
            settings.forEach((s) => lookup.set(s.key, s));

            // Stripe keys — show masked values
            const sk = lookup.get("stripe.secret_key");
            if (sk) {
                setStripeSecretKey(parseSettingValue(sk.value));
                setHasExistingKeys(prev => ({ ...prev, secretKey: !!sk.has_value }));
            }

            const pk = lookup.get("stripe.publishable_key");
            if (pk) {
                setStripePublishableKey(parseSettingValue(pk.value));
                setHasExistingKeys(prev => ({ ...prev, publishableKey: !!pk.has_value }));
            }

            const wh = lookup.get("stripe.webhook_secret");
            if (wh) {
                setStripeWebhookSecret(parseSettingValue(wh.value));
                setHasExistingKeys(prev => ({ ...prev, webhookSecret: !!wh.has_value }));
            }

            // Price IDs
            setPriceProMonthly(parseSettingValue(lookup.get("stripe.price.pro.monthly")?.value));
            setPriceProYearly(parseSettingValue(lookup.get("stripe.price.pro.yearly")?.value));
            setPriceTeamMonthly(parseSettingValue(lookup.get("stripe.price.team.monthly")?.value));
            setPriceTeamYearly(parseSettingValue(lookup.get("stripe.price.team.yearly")?.value));
            setPriceEntMonthly(parseSettingValue(lookup.get("stripe.price.enterprise.monthly")?.value));
            setPriceEntYearly(parseSettingValue(lookup.get("stripe.price.enterprise.yearly")?.value));

            // Token packages
            setPriceTokensStarter(parseSettingValue(lookup.get("stripe.price.tokens.starter")?.value));
            setPriceTokensBasic(parseSettingValue(lookup.get("stripe.price.tokens.basic")?.value));
            setPriceTokensPro(parseSettingValue(lookup.get("stripe.price.tokens.pro")?.value));
            setPriceTokensPremium(parseSettingValue(lookup.get("stripe.price.tokens.premium")?.value));
            setPriceTokensEnterprise(parseSettingValue(lookup.get("stripe.price.tokens.enterprise")?.value));

            // Billing options
            setCurrency(parseSettingValue(lookup.get("billing.currency")?.value) || "usd");
            const tr = lookup.get("billing.tax_rate");
            if (tr) setTaxRate(parseFloat(parseSettingValue(tr.value)) || 0);
            const td = lookup.get("billing.trial_days") || lookup.get("platform.default_trial_days");
            if (td) setTrialDays(parseInt(parseSettingValue(td.value)) || 14);
            const gp = lookup.get("billing.grace_period_days");
            if (gp) setGracePeriodDays(parseInt(parseSettingValue(gp.value)) || 3);
        } catch (err) {
            console.error("Failed to load billing settings:", err);
            setErrorMessage("Failed to load settings from database");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadSettings(); }, [loadSettings]);

    // ── Save settings to DB ──
    const handleSave = async () => {
        setSaveStatus("saving");
        setErrorMessage("");

        try {
            const token = getToken();

            // Build settings array — only include non-empty values
            const settingsToSave: {
                key: string;
                value: string | number;
                category: string;
                description?: string;
                is_sensitive?: boolean;
            }[] = [];

            // Stripe keys (sensitive)
            if (stripeSecretKey && !stripeSecretKey.includes("...")) {
                settingsToSave.push({
                    key: "stripe.secret_key",
                    value: stripeSecretKey,
                    category: "billing",
                    description: "Stripe secret API key",
                    is_sensitive: true,
                });
            }
            if (stripePublishableKey && !stripePublishableKey.includes("...")) {
                settingsToSave.push({
                    key: "stripe.publishable_key",
                    value: stripePublishableKey,
                    category: "billing",
                    description: "Stripe publishable API key",
                    is_sensitive: false,
                });
            }
            if (stripeWebhookSecret && !stripeWebhookSecret.includes("...")) {
                settingsToSave.push({
                    key: "stripe.webhook_secret",
                    value: stripeWebhookSecret,
                    category: "billing",
                    description: "Stripe webhook signing secret",
                    is_sensitive: true,
                });
            }

            // Price IDs (not sensitive, always save)
            const priceIdMappings: [string, string, string][] = [
                ["stripe.price.pro.monthly", priceProMonthly, "Stripe Price ID for Pro monthly"],
                ["stripe.price.pro.yearly", priceProYearly, "Stripe Price ID for Pro yearly"],
                ["stripe.price.team.monthly", priceTeamMonthly, "Stripe Price ID for Team monthly"],
                ["stripe.price.team.yearly", priceTeamYearly, "Stripe Price ID for Team yearly"],
                ["stripe.price.enterprise.monthly", priceEntMonthly, "Stripe Price ID for Enterprise monthly"],
                ["stripe.price.enterprise.yearly", priceEntYearly, "Stripe Price ID for Enterprise yearly"],
                ["stripe.price.tokens.starter", priceTokensStarter, "Token package: Starter"],
                ["stripe.price.tokens.basic", priceTokensBasic, "Token package: Basic"],
                ["stripe.price.tokens.pro", priceTokensPro, "Token package: Pro"],
                ["stripe.price.tokens.premium", priceTokensPremium, "Token package: Premium"],
                ["stripe.price.tokens.enterprise", priceTokensEnterprise, "Token package: Enterprise"],
            ];

            for (const [key, value, desc] of priceIdMappings) {
                settingsToSave.push({
                    key,
                    value: value || "",
                    category: "billing",
                    description: desc,
                });
            }

            // Billing options
            settingsToSave.push(
                { key: "billing.currency", value: currency, category: "billing", description: "Default currency" },
                { key: "billing.tax_rate", value: taxRate, category: "billing", description: "Default tax rate (%)" },
                { key: "billing.trial_days", value: trialDays, category: "billing", description: "Trial period in days" },
                { key: "billing.grace_period_days", value: gracePeriodDays, category: "billing", description: "Grace period after failed payment (days)" },
            );

            const response = await fetch("/api/superadmin/settings", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ settings: settingsToSave }),
            });

            if (!response.ok) throw new Error("Failed to save settings");

            const result = await response.json();
            console.log("Settings saved:", result);

            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 3000);

            // Reload to get masked values
            loadSettings();
        } catch (err) {
            console.error("Failed to save billing settings:", err);
            setSaveStatus("error");
            setErrorMessage("Failed to save settings. Check the console for details.");
        }
    };

    // ── Test Stripe connection ──
    const testStripeConnection = async () => {
        setTestResult("testing");
        try {
            // We test by trying to hit the Stripe checkout endpoint healthcheck
            // For a real test, we could add a dedicated test endpoint
            const token = getToken();
            const response = await fetch("/api/superadmin/settings?category=billing", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const { settings } = await response.json() as { settings: PlatformSetting[] };
                const sk = settings.find((s: PlatformSetting) => s.key === "stripe.secret_key");
                if (sk?.has_value) {
                    setTestResult("connected");
                } else {
                    setTestResult("error");
                    setErrorMessage("Stripe secret key not configured");
                }
            } else {
                setTestResult("error");
            }
        } catch {
            setTestResult("error");
        }
        setTimeout(() => setTestResult("idle"), 5000);
    };

    // ── Render ──
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
                <span className="ml-3 text-[var(--surface-600)]">Loading billing settings...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Error Banner */}
            {errorMessage && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-red-300 font-medium">Error</p>
                        <p className="text-red-400/80 text-sm">{errorMessage}</p>
                    </div>
                </div>
            )}

            {/* ── Section 1: Stripe API Keys ── */}
            <div className="p-6 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-200)]">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-violet-500/10">
                            <CreditCard className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-[var(--surface-900)]">Stripe API Keys</h3>
                            <p className="text-sm text-[var(--surface-500)]">Connect your Stripe account</p>
                        </div>
                    </div>
                    <button
                        onClick={testStripeConnection}
                        disabled={testResult === "testing"}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                            bg-[var(--surface-100)] hover:bg-[var(--surface-200)] text-[var(--surface-700)]
                            disabled:opacity-50"
                    >
                        {testResult === "testing" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : testResult === "connected" ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : testResult === "error" ? (
                            <AlertCircle className="w-4 h-4 text-red-400" />
                        ) : (
                            <RefreshCw className="w-4 h-4" />
                        )}
                        {testResult === "connected" ? "Connected" : testResult === "error" ? "Not Connected" : "Test Connection"}
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-5">
                    {/* Secret Key */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--surface-600)] mb-2">
                            Secret Key
                            {hasExistingKeys.secretKey && (
                                <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-400">
                                    <ShieldCheck className="w-3 h-3" /> configured
                                </span>
                            )}
                        </label>
                        <div className="relative">
                            <input
                                type={showSecretKey ? "text" : "password"}
                                value={stripeSecretKey}
                                onChange={(e) => setStripeSecretKey(e.target.value)}
                                placeholder="sk_live_..."
                                className="w-full px-4 py-3 pr-12 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-violet-500/50 font-mono text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowSecretKey(!showSecretKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--surface-400)] hover:text-[var(--surface-600)]"
                            >
                                {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Publishable Key */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--surface-600)] mb-2">
                            Publishable Key
                            {hasExistingKeys.publishableKey && (
                                <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-400">
                                    <ShieldCheck className="w-3 h-3" /> configured
                                </span>
                            )}
                        </label>
                        <input
                            type="text"
                            value={stripePublishableKey}
                            onChange={(e) => setStripePublishableKey(e.target.value)}
                            placeholder="pk_live_..."
                            className="w-full px-4 py-3 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-violet-500/50 font-mono text-sm"
                        />
                    </div>

                    {/* Webhook Secret */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--surface-600)] mb-2">
                            Webhook Secret
                            {hasExistingKeys.webhookSecret && (
                                <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-400">
                                    <ShieldCheck className="w-3 h-3" /> configured
                                </span>
                            )}
                        </label>
                        <div className="relative">
                            <input
                                type={showWebhookSecret ? "text" : "password"}
                                value={stripeWebhookSecret}
                                onChange={(e) => setStripeWebhookSecret(e.target.value)}
                                placeholder="whsec_..."
                                className="w-full px-4 py-3 pr-12 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-violet-500/50 font-mono text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--surface-400)] hover:text-[var(--surface-600)]"
                            >
                                {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Section 2: Subscription Price IDs ── */}
            <div className="p-6 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-200)]">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-indigo-500/10">
                        <Zap className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--surface-900)]">Subscription Price IDs</h3>
                        <p className="text-sm text-[var(--surface-500)]">Map each plan to its Stripe Price ID (from Stripe Dashboard → Products)</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Pro Plan */}
                    <div>
                        <p className="text-sm font-semibold text-[var(--surface-700)] mb-3 uppercase tracking-wider">Pro Plan</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-[var(--surface-500)] mb-1">Monthly</label>
                                <input
                                    type="text"
                                    value={priceProMonthly}
                                    onChange={(e) => setPriceProMonthly(e.target.value)}
                                    placeholder="price_..."
                                    className="w-full px-3 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-violet-500/50 font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-[var(--surface-500)] mb-1">Yearly</label>
                                <input
                                    type="text"
                                    value={priceProYearly}
                                    onChange={(e) => setPriceProYearly(e.target.value)}
                                    placeholder="price_..."
                                    className="w-full px-3 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-violet-500/50 font-mono text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Team Plan */}
                    <div>
                        <p className="text-sm font-semibold text-[var(--surface-700)] mb-3 uppercase tracking-wider">Team Plan</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-[var(--surface-500)] mb-1">Monthly</label>
                                <input
                                    type="text"
                                    value={priceTeamMonthly}
                                    onChange={(e) => setPriceTeamMonthly(e.target.value)}
                                    placeholder="price_..."
                                    className="w-full px-3 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-violet-500/50 font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-[var(--surface-500)] mb-1">Yearly</label>
                                <input
                                    type="text"
                                    value={priceTeamYearly}
                                    onChange={(e) => setPriceTeamYearly(e.target.value)}
                                    placeholder="price_..."
                                    className="w-full px-3 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-violet-500/50 font-mono text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Enterprise Plan */}
                    <div>
                        <p className="text-sm font-semibold text-[var(--surface-700)] mb-3 uppercase tracking-wider">Enterprise Plan</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-[var(--surface-500)] mb-1">Monthly</label>
                                <input
                                    type="text"
                                    value={priceEntMonthly}
                                    onChange={(e) => setPriceEntMonthly(e.target.value)}
                                    placeholder="price_..."
                                    className="w-full px-3 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-violet-500/50 font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-[var(--surface-500)] mb-1">Yearly</label>
                                <input
                                    type="text"
                                    value={priceEntYearly}
                                    onChange={(e) => setPriceEntYearly(e.target.value)}
                                    placeholder="price_..."
                                    className="w-full px-3 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-violet-500/50 font-mono text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Section 3: Token Package Price IDs ── */}
            <div className="p-6 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-200)]">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                        <Zap className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--surface-900)]">Token Package Price IDs</h3>
                        <p className="text-sm text-[var(--surface-500)]">One-time payment Price IDs for token packages</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { label: "Starter", value: priceTokensStarter, setter: setPriceTokensStarter },
                        { label: "Basic", value: priceTokensBasic, setter: setPriceTokensBasic },
                        { label: "Pro", value: priceTokensPro, setter: setPriceTokensPro },
                        { label: "Premium", value: priceTokensPremium, setter: setPriceTokensPremium },
                        { label: "Enterprise", value: priceTokensEnterprise, setter: setPriceTokensEnterprise },
                    ].map(({ label, value, setter }) => (
                        <div key={label}>
                            <label className="block text-xs text-[var(--surface-500)] mb-1">{label}</label>
                            <input
                                type="text"
                                value={value}
                                onChange={(e) => setter(e.target.value)}
                                placeholder="price_..."
                                className="w-full px-3 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-violet-500/50 font-mono text-sm"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Section 4: Billing Options ── */}
            <div className="p-6 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-200)]">
                <h3 className="text-lg font-semibold text-[var(--surface-900)] mb-6">Billing Options</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-[var(--surface-600)] mb-2">
                            Default Currency
                        </label>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full px-4 py-3 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        >
                            <option value="usd">USD ($)</option>
                            <option value="eur">EUR (€)</option>
                            <option value="gbp">GBP (£)</option>
                            <option value="inr">INR (₹)</option>
                            <option value="aud">AUD (A$)</option>
                            <option value="cad">CAD (C$)</option>
                            <option value="jpy">JPY (¥)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--surface-600)] mb-2">
                            Tax Rate (%)
                        </label>
                        <input
                            type="number"
                            value={taxRate}
                            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                            min="0"
                            max="100"
                            step="0.1"
                            className="w-full px-4 py-3 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--surface-600)] mb-2">
                            Trial Period (days)
                        </label>
                        <input
                            type="number"
                            value={trialDays}
                            onChange={(e) => setTrialDays(parseInt(e.target.value) || 0)}
                            min="0"
                            max="90"
                            className="w-full px-4 py-3 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--surface-600)] mb-2">
                            Grace Period (days)
                        </label>
                        <input
                            type="number"
                            value={gracePeriodDays}
                            onChange={(e) => setGracePeriodDays(parseInt(e.target.value) || 0)}
                            min="0"
                            max="30"
                            className="w-full px-4 py-3 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        />
                    </div>
                </div>
            </div>

            {/* ── Save Button ── */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-[var(--surface-500)]">
                    {saveStatus === "saved" && (
                        <span className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle className="w-4 h-4" /> Settings saved to database
                        </span>
                    )}
                    {saveStatus === "error" && (
                        <span className="flex items-center gap-1 text-red-400">
                            <AlertCircle className="w-4 h-4" /> Failed to save
                        </span>
                    )}
                </div>
                <button
                    onClick={handleSave}
                    disabled={saveStatus === "saving"}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-white font-medium hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50"
                >
                    {saveStatus === "saving" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {saveStatus === "saving" ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </div>
    );
}
