"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Coins,
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    History,
    Zap,
    Star,
    Crown,
    Gift,
    CreditCard,
    ArrowDown,
    ArrowUp,
    Loader2,
    Check,
    AlertTriangle,
    RefreshCw,
    Settings,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface WalletData {
    balance: number;
    currency: string;
    total_purchased: number;
    total_used: number;
    total_refunded: number;
    auto_refill_enabled: boolean;
    auto_refill_threshold: number;
    refill_amount: number;
    low_balance_threshold: number;
    is_frozen: boolean;
    frozen_reason: string | null;
    last_purchase_at: string | null;
    last_usage_at: string | null;
}

interface Purchase {
    id: string;
    tokens_purchased: number;
    bonus_tokens: number;
    total_tokens: number;
    amount_paid: number;
    currency: string;
    payment_status: string;
    purchased_at: string;
    completed_at: string | null;
}

interface UsageLog {
    id: string;
    tokens_used: number;
    service: string;
    operation: string | null;
    balance_before: number;
    balance_after: number;
    agent_id: string | null;
    used_at: string;
}

interface TokenPackage {
    id: string;
    name: string;
    description: string | null;
    token_amount: number;
    bonus_percentage: number;
    total_tokens: number;
    price: number;
    currency: string;
    price_per_1k_tokens: number;
    is_popular: boolean;
    is_best_value: boolean;
    badge: string | null;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toLocaleString();
}

function formatMoney(amount: number, currency: string = "USD"): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
    }).format(amount);
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

type Tab = "packages" | "history" | "usage";

export default function TokenWalletPage() {
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [usage, setUsage] = useState<UsageLog[]>([]);
    const [packages, setPackages] = useState<TokenPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>("packages");
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [showAutoRefill, setShowAutoRefill] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch("/api/members/tokens");
            if (res.ok) {
                const data = await res.json();
                setWallet(data.wallet);
                setPurchases(data.purchases || []);
                setUsage(data.recent_usage || []);
                setPackages(data.packages || []);
            }
        } catch (err) {
            console.error("Failed to fetch token data:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePurchase = async (packageId: string) => {
        setPurchasing(packageId);
        try {
            const res = await fetch("/api/stripe/buy-tokens", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ package_id: packageId }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.checkout_url) {
                    window.location.href = data.checkout_url;
                }
            }
        } catch (err) {
            console.error("Purchase failed:", err);
        } finally {
            setPurchasing(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
            </div>
        );
    }

    const balancePercentage = wallet
        ? Math.max(0, Math.min(100, (wallet.balance / Math.max(wallet.total_purchased, 1)) * 100))
        : 0;
    const isLowBalance = wallet && wallet.balance < wallet.low_balance_threshold;

    return (
        <div className="max-w-5xl mx-auto">
            {/* ── Header ── */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[var(--surface-900)] font-display">
                    Token Wallet
                </h1>
                <p className="text-[var(--surface-600)] mt-1">
                    Manage your token balance, buy credits, and track usage.
                </p>
            </div>

            {/* ── Frozen Warning ── */}
            {wallet?.is_frozen && (
                <div className="mb-6 p-4 rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/20 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-[var(--error)] flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-[var(--error)]">
                            Your wallet is frozen
                        </p>
                        <p className="text-xs text-[var(--surface-600)]">
                            {wallet.frozen_reason || "Token usage is temporarily suspended. Contact support."}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Balance Overview ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                {/* Current Balance — Large */}
                <div className="md:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-[var(--surface-50)] to-[var(--surface-100)] border border-[var(--surface-300)]">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <p className="text-sm text-[var(--surface-500)] mb-1">Current Balance</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-4xl font-bold text-[var(--surface-900)]">
                                    {formatNumber(wallet?.balance || 0)}
                                </p>
                                <span className="text-lg text-[var(--surface-500)]">tokens</span>
                            </div>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20">
                            <Coins className="w-6 h-6 text-amber-500" />
                        </div>
                    </div>

                    {isLowBalance && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--warning)]/10 border border-[var(--warning)]/20 mb-4">
                            <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />
                            <p className="text-xs text-[var(--warning)] font-medium">
                                Low balance — consider purchasing more tokens
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-xs text-[var(--surface-500)]">Total Purchased</p>
                            <p className="text-sm font-semibold text-[var(--surface-800)] flex items-center gap-1">
                                <ArrowDown className="w-3 h-3 text-[var(--success)]" />
                                {formatNumber(wallet?.total_purchased || 0)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-[var(--surface-500)]">Total Used</p>
                            <p className="text-sm font-semibold text-[var(--surface-800)] flex items-center gap-1">
                                <ArrowUp className="w-3 h-3 text-[var(--error)]" />
                                {formatNumber(wallet?.total_used || 0)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-[var(--surface-500)]">Refunded</p>
                            <p className="text-sm font-semibold text-[var(--surface-800)]">
                                {formatNumber(wallet?.total_refunded || 0)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Auto-Refill Settings */}
                <div className="p-5 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-[var(--surface-500)]" />
                            <p className="text-sm font-medium text-[var(--surface-700)]">Auto-Refill</p>
                        </div>
                        <span
                            className={cn(
                                "text-xs font-medium px-2 py-0.5 rounded-full",
                                wallet?.auto_refill_enabled
                                    ? "bg-[var(--success)]/10 text-[var(--success)]"
                                    : "bg-[var(--surface-200)] text-[var(--surface-500)]"
                            )}
                        >
                            {wallet?.auto_refill_enabled ? "On" : "Off"}
                        </span>
                    </div>
                    {wallet?.auto_refill_enabled ? (
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-[var(--surface-500)]">When below</p>
                                <p className="text-sm font-semibold text-[var(--surface-800)]">
                                    {formatNumber(wallet.auto_refill_threshold)} tokens
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-[var(--surface-500)]">Refill with</p>
                                <p className="text-sm font-semibold text-[var(--surface-800)]">
                                    {formatNumber(wallet.refill_amount)} tokens
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-[var(--surface-500)]">
                            Enable auto-refill to never run out of tokens. Your wallet will be topped up automatically when the balance drops below a threshold.
                        </p>
                    )}
                    <button className="mt-4 w-full px-3 py-2 rounded-lg text-xs font-medium text-[var(--primary)] border border-[var(--primary)]/20 hover:bg-[var(--primary)]/10 transition-colors">
                        <Settings className="w-3.5 h-3.5 inline mr-1.5" />
                        Configure
                    </button>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-300)] mb-6 w-fit">
                {([
                    { key: "packages" as Tab, label: "Buy Tokens", icon: ShoppingCart },
                    { key: "history" as Tab, label: "Purchase History", icon: History },
                    { key: "usage" as Tab, label: "Usage Log", icon: Zap },
                ]).map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            activeTab === tab.key
                                ? "bg-[var(--surface-50)] text-[var(--surface-900)] shadow-sm"
                                : "text-[var(--surface-500)] hover:text-[var(--surface-700)]"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Tab Content ── */}
            {activeTab === "packages" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {packages.map((pkg) => (
                        <div
                            key={pkg.id}
                            className={cn(
                                "relative p-5 rounded-2xl border transition-all",
                                pkg.is_popular
                                    ? "bg-gradient-to-br from-[var(--primary)]/5 to-[var(--secondary)]/5 border-[var(--primary)]/30 shadow-lg shadow-[var(--primary)]/5"
                                    : "bg-[var(--surface-50)] border-[var(--surface-300)] hover:border-[var(--primary)]/20"
                            )}
                        >
                            {/* Badge */}
                            {pkg.badge && (
                                <span
                                    className={cn(
                                        "absolute -top-2.5 right-4 px-3 py-0.5 rounded-full text-xs font-bold",
                                        pkg.is_popular
                                            ? "bg-[var(--primary)] text-white"
                                            : pkg.is_best_value
                                                ? "bg-[var(--success)] text-white"
                                                : "bg-[var(--surface-300)] text-[var(--surface-700)]"
                                    )}
                                >
                                    {pkg.badge}
                                </span>
                            )}

                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-[var(--surface-900)]">
                                    {pkg.name}
                                </h3>
                                <p className="text-sm text-[var(--surface-500)] mt-0.5">
                                    {pkg.description}
                                </p>
                            </div>

                            <div className="mb-4">
                                <p className="text-3xl font-bold text-[var(--surface-900)]">
                                    {formatMoney(pkg.price, pkg.currency)}
                                </p>
                                <p className="text-xs text-[var(--surface-500)] mt-1">
                                    {formatMoney(pkg.price_per_1k_tokens, pkg.currency)} per 1K tokens
                                </p>
                            </div>

                            <div className="space-y-2 mb-5">
                                <div className="flex items-center gap-2 text-sm text-[var(--surface-700)]">
                                    <Coins className="w-4 h-4 text-amber-500" />
                                    <span>{formatNumber(pkg.token_amount)} tokens</span>
                                </div>
                                {pkg.bonus_percentage > 0 && (
                                    <div className="flex items-center gap-2 text-sm text-[var(--success)]">
                                        <Gift className="w-4 h-4" />
                                        <span>+{pkg.bonus_percentage}% bonus ({formatNumber(pkg.total_tokens - pkg.token_amount)} free)</span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => handlePurchase(pkg.id)}
                                disabled={purchasing === pkg.id || wallet?.is_frozen}
                                className={cn(
                                    "w-full py-2.5 rounded-xl font-semibold text-sm transition-all",
                                    pkg.is_popular
                                        ? "bg-[var(--primary)] text-white hover:opacity-90 shadow-lg shadow-[var(--primary)]/20"
                                        : "bg-[var(--surface-200)] text-[var(--surface-800)] hover:bg-[var(--surface-300)]"
                                )}
                            >
                                {purchasing === pkg.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                ) : (
                                    <>
                                        <CreditCard className="w-4 h-4 inline mr-2" />
                                        Buy Now
                                    </>
                                )}
                            </button>
                        </div>
                    ))}

                    {packages.length === 0 && (
                        <div className="col-span-full p-8 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] text-center">
                            <ShoppingCart className="w-10 h-10 text-[var(--surface-400)] mx-auto mb-3" />
                            <h3 className="font-semibold text-[var(--surface-800)] mb-1">
                                No packages available
                            </h3>
                            <p className="text-sm text-[var(--surface-500)]">
                                Token packages will appear here once configured by the platform admin.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "history" && (
                <div className="rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] overflow-hidden">
                    {purchases.length === 0 ? (
                        <div className="p-8 text-center">
                            <History className="w-10 h-10 text-[var(--surface-400)] mx-auto mb-3" />
                            <h3 className="font-semibold text-[var(--surface-800)] mb-1">
                                No purchases yet
                            </h3>
                            <p className="text-sm text-[var(--surface-500)]">
                                Your purchase history will appear here after your first token purchase.
                            </p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--surface-200)]">
                                    <th className="text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider px-4 py-3">Date</th>
                                    <th className="text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider px-4 py-3">Tokens</th>
                                    <th className="text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider px-4 py-3">Bonus</th>
                                    <th className="text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider px-4 py-3">Amount</th>
                                    <th className="text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchases.map((purchase) => (
                                    <tr
                                        key={purchase.id}
                                        className="border-b border-[var(--surface-200)] last:border-0 hover:bg-[var(--surface-100)] transition-colors"
                                    >
                                        <td className="px-4 py-3 text-sm text-[var(--surface-700)]">
                                            {formatDate(purchase.purchased_at)}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-[var(--surface-800)]">
                                            {formatNumber(purchase.tokens_purchased)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[var(--success)]">
                                            {purchase.bonus_tokens > 0 ? `+${formatNumber(purchase.bonus_tokens)}` : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[var(--surface-700)]">
                                            {formatMoney(purchase.amount_paid, purchase.currency)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={cn(
                                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                                                    purchase.payment_status === "completed"
                                                        ? "bg-[var(--success)]/10 text-[var(--success)]"
                                                        : purchase.payment_status === "failed"
                                                            ? "bg-[var(--error)]/10 text-[var(--error)]"
                                                            : "bg-[var(--warning)]/10 text-[var(--warning)]"
                                                )}
                                            >
                                                {purchase.payment_status === "completed" && <Check className="w-3 h-3" />}
                                                {purchase.payment_status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {activeTab === "usage" && (
                <div className="rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] overflow-hidden">
                    {usage.length === 0 ? (
                        <div className="p-8 text-center">
                            <Zap className="w-10 h-10 text-[var(--surface-400)] mx-auto mb-3" />
                            <h3 className="font-semibold text-[var(--surface-800)] mb-1">
                                No usage recorded yet
                            </h3>
                            <p className="text-sm text-[var(--surface-500)]">
                                Token usage from the desktop app will appear here as you interact with AI agents.
                            </p>
                        </div>
                    ) : (
                        <div>
                            {usage.map((log, i) => (
                                <div
                                    key={log.id}
                                    className={cn(
                                        "flex items-center gap-4 px-4 py-3",
                                        i > 0 && "border-t border-[var(--surface-200)]"
                                    )}
                                >
                                    <div className="p-2 rounded-lg bg-[var(--surface-200)]">
                                        <Zap className="w-3.5 h-3.5 text-[var(--surface-600)]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-[var(--surface-800)]">
                                            <span className="font-medium capitalize">{log.service}</span>
                                            {log.operation && (
                                                <span className="text-[var(--surface-500)]"> • {log.operation}</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-[var(--surface-500)]">
                                            {formatDateTime(log.used_at)}
                                            {log.agent_id && ` • Agent: ${log.agent_id}`}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-[var(--error)]">
                                            -{formatNumber(log.tokens_used)}
                                        </p>
                                        <p className="text-xs text-[var(--surface-500)]">
                                            bal: {formatNumber(log.balance_after)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
