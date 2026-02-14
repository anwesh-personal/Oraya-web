"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    CreditCard,
    Crown,
    Check,
    ChevronRight,
    Loader2,
    Receipt,
    Calendar,
    ExternalLink,
    Star,
    Zap,
    Shield,
    Users,
    Headphones,
    ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Plan {
    id: string;
    name: string;
    description: string | null;
    price_monthly: number;
    price_yearly: number;
    currency: string;
    max_agents: number;
    max_devices: number;
    max_ai_calls_per_month: number;
    max_token_usage_per_month: number;
    features: string[];
    badge: string | null;
}

interface LicenseData {
    plan_id: string;
    plan_name: string;
    status: string;
    billing_cycle: string | null;
    next_billing_date: string | null;
    current_period_end: string | null;
    is_trial: boolean;
    trial_ends_at: string | null;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatMoney(amount: number | null, currency: string = "USD"): string {
    if (amount === null || amount === undefined) return "Custom";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
}

const planFeatureDescriptions: Record<string, { icon: typeof Check; label: string }> = {
    local_ai_only: { icon: Shield, label: "Local AI (BYOK)" },
    single_device: { icon: CreditCard, label: "Single device" },
    managed_ai: { icon: Zap, label: "Managed AI (no API keys needed)" },
    priority_support: { icon: Headphones, label: "Priority support" },
    advanced_analytics: { icon: Star, label: "Advanced analytics" },
    multi_device: { icon: CreditCard, label: "Multi-device" },
    team_sync: { icon: Users, label: "Team synchronization" },
    shared_agents: { icon: Users, label: "Shared agents" },
    unlimited_devices: { icon: CreditCard, label: "Unlimited devices" },
    everything: { icon: Crown, label: "Everything included" },
    custom_deployment: { icon: Shield, label: "Custom deployment" },
    dedicated_support: { icon: Headphones, label: "Dedicated support" },
    sla: { icon: Shield, label: "SLA guarantee" },
    premium_security: { icon: Shield, label: "Premium security" },
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function BillingPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [license, setLicense] = useState<LicenseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
    const [subscribing, setSubscribing] = useState<string | null>(null);
    const [managingPortal, setManagingPortal] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const [plansRes, licenseRes] = await Promise.allSettled([
                    fetch("/api/members/plans"),
                    fetch("/api/members/license"),
                ]);

                if (plansRes.status === "fulfilled" && plansRes.value.ok) {
                    const data = await plansRes.value.json();
                    setPlans(data.plans || []);
                }

                if (licenseRes.status === "fulfilled" && licenseRes.value.ok) {
                    const data = await licenseRes.value.json();
                    setLicense(data.license);
                }
            } catch (err) {
                console.error("Failed to fetch billing data:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    const handleSubscribe = async (planId: string) => {
        setSubscribing(planId);
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan_id: planId, billing_cycle: billingCycle }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.checkout_url) {
                    window.location.href = data.checkout_url;
                }
            }
        } catch (err) {
            console.error("Checkout failed:", err);
        } finally {
            setSubscribing(null);
        }
    };

    const handleManageSubscription = async () => {
        setManagingPortal(true);
        try {
            const res = await fetch("/api/stripe/portal", { method: "POST" });
            if (res.ok) {
                const data = await res.json();
                if (data.portal_url) {
                    window.location.href = data.portal_url;
                }
            }
        } catch (err) {
            console.error("Portal failed:", err);
        } finally {
            setManagingPortal(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
            </div>
        );
    }

    const currentPlanId = license?.plan_id || "free";
    const isSubscribed = currentPlanId !== "free";

    return (
        <div className="max-w-5xl mx-auto">
            {/* ── Header ── */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[var(--surface-900)] font-display">
                    Billing
                </h1>
                <p className="text-[var(--surface-600)] mt-1">
                    Manage your subscription, view invoices, and upgrade your plan.
                </p>
            </div>

            {/* ── Current Plan ── */}
            {isSubscribed && (
                <div className="mb-8 p-6 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)]">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-[var(--primary)]/10">
                                <Crown className="w-6 h-6 text-[var(--primary)]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[var(--surface-900)] capitalize">
                                    {license?.plan_name} Plan
                                </h2>
                                <div className="flex items-center gap-3 mt-1 text-sm text-[var(--surface-500)]">
                                    {license?.billing_cycle && (
                                        <span className="capitalize">{license.billing_cycle} billing</span>
                                    )}
                                    {license?.next_billing_date && (
                                        <>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                Next billing: {formatDate(license.next_billing_date)}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleManageSubscription}
                            disabled={managingPortal}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--surface-300)] text-sm font-medium text-[var(--surface-700)] hover:bg-[var(--surface-100)] transition-colors"
                        >
                            {managingPortal ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <ExternalLink className="w-4 h-4" />
                            )}
                            Manage Subscription
                        </button>
                    </div>
                </div>
            )}

            {/* ── Billing Toggle ── */}
            <div className="flex items-center justify-center gap-3 mb-8">
                <span
                    className={cn(
                        "text-sm font-medium",
                        billingCycle === "monthly" ? "text-[var(--surface-900)]" : "text-[var(--surface-500)]"
                    )}
                >
                    Monthly
                </span>
                <button
                    onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
                    className="relative w-14 h-7 rounded-full bg-[var(--surface-300)] transition-colors"
                    style={{
                        backgroundColor: billingCycle === "yearly" ? "var(--primary)" : undefined,
                    }}
                >
                    <span
                        className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform"
                        style={{
                            transform: billingCycle === "yearly" ? "translateX(28px)" : "translateX(0)",
                        }}
                    />
                </button>
                <span
                    className={cn(
                        "text-sm font-medium",
                        billingCycle === "yearly" ? "text-[var(--surface-900)]" : "text-[var(--surface-500)]"
                    )}
                >
                    Yearly
                </span>
                {billingCycle === "yearly" && (
                    <span className="px-2 py-0.5 rounded-full bg-[var(--success)]/10 text-[var(--success)] text-xs font-bold">
                        Save ~17%
                    </span>
                )}
            </div>

            {/* ── Plans Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {plans.map((plan) => {
                    const isCurrent = plan.id === currentPlanId;
                    const isPopular = plan.id === "pro";
                    const price = billingCycle === "monthly" ? plan.price_monthly : plan.price_yearly;

                    return (
                        <div
                            key={plan.id}
                            className={cn(
                                "relative p-5 rounded-2xl border transition-all",
                                isCurrent
                                    ? "border-[var(--primary)] bg-[var(--primary)]/5 ring-2 ring-[var(--primary)]/20"
                                    : isPopular
                                        ? "border-[var(--primary)]/30 bg-gradient-to-b from-[var(--primary)]/5 to-transparent"
                                        : "border-[var(--surface-300)] bg-[var(--surface-50)]"
                            )}
                        >
                            {/* Badge */}
                            {(plan.badge || isPopular) && (
                                <span className="absolute -top-2.5 left-4 px-3 py-0.5 rounded-full bg-[var(--primary)] text-white text-xs font-bold">
                                    {plan.badge || "Popular"}
                                </span>
                            )}

                            {isCurrent && (
                                <span className="absolute -top-2.5 right-4 px-3 py-0.5 rounded-full bg-[var(--success)] text-white text-xs font-bold">
                                    Current
                                </span>
                            )}

                            <div className="mb-5 pt-2">
                                <h3 className="text-lg font-bold text-[var(--surface-900)]">
                                    {plan.name}
                                </h3>
                                <p className="text-xs text-[var(--surface-500)] mt-1">
                                    {plan.description}
                                </p>
                            </div>

                            <div className="mb-5">
                                <p className="text-3xl font-bold text-[var(--surface-900)]">
                                    {formatMoney(price, plan.currency)}
                                </p>
                                <p className="text-xs text-[var(--surface-500)]">
                                    {price === 0 ? "Free forever" : billingCycle === "monthly" ? "per month" : "per year"}
                                </p>
                            </div>

                            {/* Features */}
                            <ul className="space-y-2 mb-5">
                                <li className="flex items-center gap-2 text-sm text-[var(--surface-700)]">
                                    <Check className="w-4 h-4 text-[var(--success)] flex-shrink-0" />
                                    {plan.max_agents === -1 ? "Unlimited" : plan.max_agents} agent{plan.max_agents !== 1 ? "s" : ""}
                                </li>
                                <li className="flex items-center gap-2 text-sm text-[var(--surface-700)]">
                                    <Check className="w-4 h-4 text-[var(--success)] flex-shrink-0" />
                                    {plan.max_devices === -1 ? "Unlimited" : plan.max_devices} device{plan.max_devices !== 1 ? "s" : ""}
                                </li>
                                {(plan.features as string[])?.slice(0, 4).map((feature, i) => {
                                    const featureInfo = planFeatureDescriptions[feature];
                                    return (
                                        <li key={i} className="flex items-center gap-2 text-sm text-[var(--surface-700)]">
                                            <Check className="w-4 h-4 text-[var(--success)] flex-shrink-0" />
                                            {featureInfo?.label || feature.replace(/_/g, " ")}
                                        </li>
                                    );
                                })}
                            </ul>

                            {/* CTA */}
                            {isCurrent ? (
                                <button
                                    disabled
                                    className="w-full py-2.5 rounded-xl bg-[var(--surface-200)] text-[var(--surface-600)] text-sm font-medium cursor-not-allowed"
                                >
                                    Current Plan
                                </button>
                            ) : plan.id === "enterprise" ? (
                                <a
                                    href="mailto:sales@oraya.dev"
                                    className="block w-full py-2.5 rounded-xl bg-[var(--surface-200)] text-[var(--surface-800)] text-sm font-medium text-center hover:bg-[var(--surface-300)] transition-colors"
                                >
                                    Contact Sales
                                </a>
                            ) : plan.id === "free" ? (
                                <button
                                    disabled
                                    className="w-full py-2.5 rounded-xl bg-[var(--surface-200)] text-[var(--surface-600)] text-sm font-medium cursor-not-allowed"
                                >
                                    Free Forever
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={subscribing === plan.id}
                                    className={cn(
                                        "w-full py-2.5 rounded-xl text-sm font-semibold transition-all",
                                        isPopular
                                            ? "bg-[var(--primary)] text-white hover:opacity-90 shadow-lg shadow-[var(--primary)]/20"
                                            : "bg-[var(--surface-200)] text-[var(--surface-800)] hover:bg-[var(--surface-300)]"
                                    )}
                                >
                                    {subscribing === plan.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                    ) : (
                                        currentPlanId !== "free" ? "Switch Plan" : "Get Started"
                                    )}
                                </button>
                            )}
                        </div>
                    );
                })}

                {plans.length === 0 && (
                    <div className="col-span-full p-8 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] text-center">
                        <CreditCard className="w-10 h-10 text-[var(--surface-400)] mx-auto mb-3" />
                        <h3 className="font-semibold text-[var(--surface-800)] mb-1">
                            Plans loading...
                        </h3>
                        <p className="text-sm text-[var(--surface-500)]">
                            Subscription plans will appear here.
                        </p>
                    </div>
                )}
            </div>

            {/* ── Invoice History Link ── */}
            {isSubscribed && (
                <div className="p-5 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Receipt className="w-5 h-5 text-[var(--surface-500)]" />
                            <div>
                                <p className="text-sm font-medium text-[var(--surface-800)]">
                                    Invoice History
                                </p>
                                <p className="text-xs text-[var(--surface-500)]">
                                    View and download your past invoices via Stripe
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleManageSubscription}
                            className="flex items-center gap-1 text-sm text-[var(--primary)] hover:underline"
                        >
                            View Invoices
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
