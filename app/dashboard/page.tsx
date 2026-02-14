"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Key,
    Coins,
    CreditCard,
    Microscope,
    ChevronRight,
    Download,
    Shield,
    Monitor,
    Clock,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    Zap,
    ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface LicenseData {
    plan_id: string;
    plan_name: string;
    status: string;
    license_key: string | null;
    billing_cycle: string | null;
    next_billing_date: string | null;
    current_period_end: string | null;
    is_trial: boolean;
    trial_ends_at: string | null;
    expires_at: string | null;
    plan: {
        name: string;
        max_agents: number;
        max_devices: number;
        max_ai_calls_per_month: number;
        max_token_usage_per_month: number;
        features: string[];
    } | null;
    devices: Array<{
        id: string;
        device_name: string;
        platform: string;
        is_active: boolean;
        last_seen_at: string;
    }>;
    usage: {
        ai_calls_used: number;
        tokens_used: number;
        conversations_created: number;
        usage_limit_reached: boolean;
    };
}

interface WalletData {
    balance: number;
    currency: string;
    total_purchased: number;
    total_used: number;
    is_frozen: boolean;
    frozen_reason: string | null;
    last_purchase_at: string | null;
    last_usage_at: string | null;
}

interface ProfileData {
    full_name: string | null;
    display_name: string | null;
    email: string;
    organization: string | null;
    created_at: string;
}

// ─────────────────────────────────────────────────────────────
// Helper: Format numbers
// ─────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toLocaleString();
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function timeAgo(dateStr: string | null): string {
    if (!dateStr) return "Never";
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(dateStr);
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function DashboardOverview() {
    const [license, setLicense] = useState<LicenseData | null>(null);
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [licenseRes, tokenRes, profileRes] = await Promise.allSettled([
                    fetch("/api/members/license"),
                    fetch("/api/members/tokens"),
                    fetch("/api/members/profile"),
                ]);

                if (licenseRes.status === "fulfilled" && licenseRes.value.ok) {
                    const data = await licenseRes.value.json();
                    setLicense(data.license);
                }

                if (tokenRes.status === "fulfilled" && tokenRes.value.ok) {
                    const data = await tokenRes.value.json();
                    setWallet(data.wallet);
                }

                if (profileRes.status === "fulfilled" && profileRes.value.ok) {
                    const data = await profileRes.value.json();
                    setProfile(data.profile);
                }
            } catch (err) {
                console.error("Dashboard data fetch error:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
            </div>
        );
    }

    const firstName = profile?.full_name?.split(" ")[0] ||
        profile?.display_name ||
        profile?.email?.split("@")[0] ||
        "there";

    const isFreePlan = !license || license.plan_id === "free";
    const isTrialActive = license?.is_trial && license?.trial_ends_at &&
        new Date(license.trial_ends_at) > new Date();

    return (
        <div className="max-w-6xl mx-auto">
            {/* ── Header ── */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[var(--surface-900)] font-display">
                    Welcome back, {firstName}!
                </h1>
                <p className="text-[var(--surface-600)] mt-1">
                    Your Oraya command center. Manage your license, tokens, and cloud services.
                </p>
            </div>

            {/* ── Alerts ── */}
            {wallet?.is_frozen && (
                <div className="mb-6 p-4 rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/20 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-[var(--error)] flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-[var(--error)]">
                            Your token wallet is frozen
                        </p>
                        <p className="text-xs text-[var(--surface-600)]">
                            {wallet.frozen_reason || "Please contact support."}
                        </p>
                    </div>
                </div>
            )}

            {isTrialActive && (
                <div className="mb-6 p-4 rounded-xl bg-[var(--warning)]/10 border border-[var(--warning)]/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-[var(--warning)] flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-[var(--warning)]">
                                Trial expires {formatDate(license?.trial_ends_at || null)}
                            </p>
                            <p className="text-xs text-[var(--surface-600)]">
                                Upgrade to keep your agents and data.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/dashboard/billing"
                        className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        Upgrade Now
                    </Link>
                </div>
            )}

            {license?.usage?.usage_limit_reached && (
                <div className="mb-6 p-4 rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-[var(--error)] flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-[var(--error)]">
                                You&apos;ve hit your usage limit
                            </p>
                            <p className="text-xs text-[var(--surface-600)]">
                                Buy more tokens or upgrade your plan.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/dashboard/tokens"
                        className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        Buy Tokens
                    </Link>
                </div>
            )}

            {/* ── Stats Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {/* License Status */}
                <Link
                    href="/dashboard/license"
                    className="group p-5 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] hover:border-[var(--primary)]/30 hover:shadow-lg hover:shadow-[var(--primary)]/5 transition-all"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 rounded-xl bg-[var(--primary)]/10">
                            <Shield className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-[var(--surface-400)] group-hover:text-[var(--primary)] transition-colors" />
                    </div>
                    <p className="text-sm text-[var(--surface-500)] mb-1">License</p>
                    <p className="text-xl font-bold text-[var(--surface-900)] capitalize">
                        {license?.plan_name || "Free"}
                    </p>
                    <p className="text-xs text-[var(--surface-500)] mt-1">
                        {license?.status === "active" ? (
                            <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-[var(--success)]" />
                                Active
                            </span>
                        ) : (
                            license?.status || "No license"
                        )}
                    </p>
                </Link>

                {/* Token Balance */}
                <Link
                    href="/dashboard/tokens"
                    className="group p-5 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] hover:border-[var(--secondary)]/30 hover:shadow-lg hover:shadow-[var(--secondary)]/5 transition-all"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 rounded-xl bg-[var(--secondary)]/10">
                            <Coins className="w-5 h-5 text-[var(--secondary)]" />
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-[var(--surface-400)] group-hover:text-[var(--secondary)] transition-colors" />
                    </div>
                    <p className="text-sm text-[var(--surface-500)] mb-1">Token Balance</p>
                    <p className="text-xl font-bold text-[var(--surface-900)]">
                        {formatNumber(wallet?.balance || 0)}
                    </p>
                    <p className="text-xs text-[var(--surface-500)] mt-1">
                        {wallet?.total_used
                            ? `${formatNumber(wallet.total_used)} used total`
                            : "No usage yet"}
                    </p>
                </Link>

                {/* Active Devices */}
                <Link
                    href="/dashboard/license"
                    className="group p-5 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] hover:border-[var(--success)]/30 hover:shadow-lg hover:shadow-[var(--success)]/5 transition-all"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 rounded-xl bg-[var(--success)]/10">
                            <Monitor className="w-5 h-5 text-[var(--success)]" />
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-[var(--surface-400)] group-hover:text-[var(--success)] transition-colors" />
                    </div>
                    <p className="text-sm text-[var(--surface-500)] mb-1">Active Devices</p>
                    <p className="text-xl font-bold text-[var(--surface-900)]">
                        {license?.devices?.filter(d => d.is_active).length || 0}
                    </p>
                    <p className="text-xs text-[var(--surface-500)] mt-1">
                        of {license?.plan?.max_devices === -1 ? "∞" : license?.plan?.max_devices || 1} allowed
                    </p>
                </Link>

                {/* AI Usage */}
                <div className="p-5 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 rounded-xl bg-[var(--warning)]/10">
                            <Zap className="w-5 h-5 text-[var(--warning)]" />
                        </div>
                        <TrendingUp className="w-4 h-4 text-[var(--surface-400)]" />
                    </div>
                    <p className="text-sm text-[var(--surface-500)] mb-1">AI Calls This Period</p>
                    <p className="text-xl font-bold text-[var(--surface-900)]">
                        {formatNumber(license?.usage?.ai_calls_used || 0)}
                    </p>
                    <p className="text-xs text-[var(--surface-500)] mt-1">
                        of {license?.plan?.max_ai_calls_per_month === -1 ? "∞" : formatNumber(license?.plan?.max_ai_calls_per_month || 1000)} / month
                    </p>
                </div>
            </div>

            {/* ── Quick Actions ── */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-[var(--surface-800)] mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Download Desktop */}
                    <a
                        href="https://oraya.dev/download"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group p-5 rounded-2xl bg-gradient-to-br from-[var(--primary)]/5 to-[var(--secondary)]/5 border border-[var(--primary)]/15 hover:border-[var(--primary)]/30 transition-all"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-[var(--primary)]/10">
                                    <Download className="w-5 h-5 text-[var(--primary)]" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[var(--surface-900)]">
                                        Download Oraya
                                    </h3>
                                    <p className="text-sm text-[var(--surface-600)] mt-0.5">
                                        Get the desktop app
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-[var(--primary)] group-hover:translate-x-1 transition-transform" />
                        </div>
                    </a>

                    {/* Buy Tokens */}
                    <Link
                        href="/dashboard/tokens"
                        className="group p-5 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] hover:border-[var(--secondary)]/30 transition-all"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-[var(--secondary)]/10">
                                    <Coins className="w-5 h-5 text-[var(--secondary)]" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[var(--surface-900)]">
                                        Buy Tokens
                                    </h3>
                                    <p className="text-sm text-[var(--surface-600)] mt-0.5">
                                        Top up your wallet
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-[var(--surface-500)] group-hover:text-[var(--secondary)] group-hover:translate-x-1 transition-all" />
                        </div>
                    </Link>

                    {/* 24/7 Research */}
                    <Link
                        href="/dashboard/research"
                        className="group p-5 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] hover:border-[var(--primary)]/30 transition-all"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-[var(--primary)]/10">
                                    <Microscope className="w-5 h-5 text-[var(--primary)]" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[var(--surface-900)]">
                                        24/7 Research
                                    </h3>
                                    <p className="text-sm text-[var(--surface-600)] mt-0.5">
                                        Cloud-powered research
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-[var(--surface-500)] group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all" />
                        </div>
                    </Link>
                </div>
            </div>

            {/* ── Active Devices List ── */}
            {license?.devices && license.devices.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-[var(--surface-800)]">
                            Active Devices
                        </h2>
                        <Link
                            href="/dashboard/license"
                            className="text-sm text-[var(--primary)] hover:underline"
                        >
                            Manage →
                        </Link>
                    </div>
                    <div className="rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] overflow-hidden">
                        {license.devices.filter(d => d.is_active).map((device, i) => (
                            <div
                                key={device.id}
                                className={cn(
                                    "flex items-center gap-4 p-4",
                                    i > 0 && "border-t border-[var(--surface-200)]"
                                )}
                            >
                                <div className="p-2 rounded-lg bg-[var(--success)]/10">
                                    <Monitor className="w-4 h-4 text-[var(--success)]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[var(--surface-800)] truncate">
                                        {device.device_name || "Unknown Device"}
                                    </p>
                                    <p className="text-xs text-[var(--surface-500)]">
                                        {device.platform} • Last seen {timeAgo(device.last_seen_at)}
                                    </p>
                                </div>
                                <span className="flex items-center gap-1 text-xs text-[var(--success)]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                                    Online
                                </span>
                            </div>
                        ))}
                        {license.devices.filter(d => d.is_active).length === 0 && (
                            <div className="p-8 text-center">
                                <Monitor className="w-8 h-8 text-[var(--surface-400)] mx-auto mb-2" />
                                <p className="text-sm text-[var(--surface-500)]">
                                    No active devices. Download the desktop app to get started.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Upgrade CTA (for free users) ── */}
            {isFreePlan && (
                <div className="p-6 rounded-2xl bg-gradient-to-r from-[var(--primary)]/10 via-[var(--secondary)]/10 to-[var(--primary)]/5 border border-[var(--primary)]/20">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-[var(--surface-900)]">
                                Unlock the full power of Oraya
                            </h3>
                            <p className="text-sm text-[var(--surface-600)] mt-1">
                                Get managed AI, unlimited agents, voice features, and 24/7 cloud research.
                            </p>
                        </div>
                        <Link
                            href="/dashboard/billing"
                            className="px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-[var(--primary)]/20"
                        >
                            View Plans →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
