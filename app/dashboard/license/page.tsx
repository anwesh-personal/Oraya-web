"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Key,
    Copy,
    Check,
    Monitor,
    Smartphone,
    Laptop,
    Trash2,
    RefreshCw,
    Shield,
    Calendar,
    Clock,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Loader2,
    Eye,
    EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Device {
    id: string;
    device_id: string;
    device_name: string | null;
    device_type: string | null;
    platform: string | null;
    platform_version: string | null;
    app_version: string | null;
    is_active: boolean;
    last_seen_at: string | null;
    activated_at: string | null;
    deactivated_at: string | null;
}

interface Plan {
    name: string;
    description: string | null;
    max_agents: number;
    max_devices: number;
    max_ai_calls_per_month: number;
    max_token_usage_per_month: number;
    features: string[];
}

interface LicenseData {
    plan_id: string;
    plan_name: string;
    status: string;
    license_key: string | null;
    billing_cycle: string | null;
    next_billing_date: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    is_trial: boolean;
    trial_ends_at: string | null;
    expires_at: string | null;
    activated_at: string | null;
    plan: Plan | null;
    devices: Device[];
    usage: {
        ai_calls_used: number;
        tokens_used: number;
        conversations_created: number;
        usage_limit_reached: boolean;
    };
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "long",
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
    return `${days}d ago`;
}

function getDeviceIcon(type: string | null, platform: string | null) {
    if (type === "mobile" || platform?.toLowerCase().includes("android") || platform?.toLowerCase().includes("ios")) {
        return Smartphone;
    }
    if (type === "laptop" || platform?.toLowerCase().includes("mac")) {
        return Laptop;
    }
    return Monitor;
}

function formatNumber(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toLocaleString();
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function LicensePage() {
    const [license, setLicense] = useState<LicenseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showKey, setShowKey] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showUsageDetails, setShowUsageDetails] = useState(false);
    const [deactivating, setDeactivating] = useState<string | null>(null);

    const fetchLicense = useCallback(async () => {
        try {
            const res = await fetch("/api/members/license");
            if (res.ok) {
                const data = await res.json();
                setLicense(data.license);
            }
        } catch (err) {
            console.error("Failed to fetch license:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLicense();
    }, [fetchLicense]);

    const copyLicenseKey = async () => {
        if (!license?.license_key) return;
        await navigator.clipboard.writeText(license.license_key);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDeactivateDevice = async (deviceId: string) => {
        if (!confirm("Are you sure you want to deactivate this device? You can always reactivate by opening Oraya on that device.")) {
            return;
        }
        setDeactivating(deviceId);
        try {
            const res = await fetch(`/api/members/license/deactivate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ device_id: deviceId }),
            });
            if (res.ok) {
                await fetchLicense();
            }
        } catch (err) {
            console.error("Deactivation failed:", err);
        } finally {
            setDeactivating(null);
        }
    };

    const maskedKey = (key: string) => {
        if (key.length <= 8) return key;
        return key.substring(0, 4) + "••••••••••••" + key.substring(key.length - 4);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
            </div>
        );
    }

    const isFreePlan = !license || license.plan_id === "free";
    const activeDevices = license?.devices?.filter(d => d.is_active) || [];
    const inactiveDevices = license?.devices?.filter(d => !d.is_active) || [];

    return (
        <div className="max-w-4xl mx-auto">
            {/* ── Header ── */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[var(--surface-900)] font-display">
                    License & Devices
                </h1>
                <p className="text-[var(--surface-600)] mt-1">
                    Manage your Oraya license, view your activation key, and control registered devices.
                </p>
            </div>

            {/* ── License Overview ── */}
            <div className="mb-8 p-6 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)]">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-[var(--primary)]/10">
                            <Shield className="w-6 h-6 text-[var(--primary)]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--surface-900)] capitalize">
                                {license?.plan_name || "Free"} Plan
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                                        license?.status === "active"
                                            ? "bg-[var(--success)]/10 text-[var(--success)]"
                                            : "bg-[var(--error)]/10 text-[var(--error)]"
                                    )}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                    {license?.status === "active" ? "Active" : license?.status || "Inactive"}
                                </span>
                                {license?.billing_cycle && (
                                    <span className="text-xs text-[var(--surface-500)] capitalize">
                                        • {license.billing_cycle}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    {license?.is_trial && (
                        <span className="px-3 py-1 rounded-full bg-[var(--warning)]/10 text-[var(--warning)] text-xs font-medium border border-[var(--warning)]/20">
                            Trial
                        </span>
                    )}
                </div>

                {/* Plan details grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-[var(--surface-100)]">
                        <p className="text-xs text-[var(--surface-500)] mb-1">Period Ends</p>
                        <p className="text-sm font-semibold text-[var(--surface-800)]">
                            {formatDate(license?.current_period_end || license?.expires_at || null)}
                        </p>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--surface-100)]">
                        <p className="text-xs text-[var(--surface-500)] mb-1">Max Devices</p>
                        <p className="text-sm font-semibold text-[var(--surface-800)]">
                            {license?.plan?.max_devices === -1 ? "Unlimited" : license?.plan?.max_devices || 1}
                        </p>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--surface-100)]">
                        <p className="text-xs text-[var(--surface-500)] mb-1">Max Agents</p>
                        <p className="text-sm font-semibold text-[var(--surface-800)]">
                            {license?.plan?.max_agents === -1 ? "Unlimited" : license?.plan?.max_agents || 1}
                        </p>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--surface-100)]">
                        <p className="text-xs text-[var(--surface-500)] mb-1">AI Calls / mo</p>
                        <p className="text-sm font-semibold text-[var(--surface-800)]">
                            {license?.plan?.max_ai_calls_per_month === -1 ? "Unlimited" : formatNumber(license?.plan?.max_ai_calls_per_month || 1000)}
                        </p>
                    </div>
                </div>

                {/* License Key */}
                {license?.license_key && (
                    <div className="p-4 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-200)]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Key className="w-4 h-4 text-[var(--surface-500)]" />
                                <div>
                                    <p className="text-xs text-[var(--surface-500)] mb-0.5">License Key</p>
                                    <p className="text-sm font-mono font-medium text-[var(--surface-800)]">
                                        {showKey ? license.license_key : maskedKey(license.license_key)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowKey(!showKey)}
                                    className="p-2 rounded-lg hover:bg-[var(--surface-200)] text-[var(--surface-500)] transition-colors"
                                    title={showKey ? "Hide key" : "Show key"}
                                >
                                    {showKey ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                                <button
                                    onClick={copyLicenseKey}
                                    className="p-2 rounded-lg hover:bg-[var(--surface-200)] text-[var(--surface-500)] transition-colors"
                                    title="Copy license key"
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-[var(--success)]" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Usage This Period ── */}
            {!isFreePlan && (
                <div className="mb-8">
                    <button
                        onClick={() => setShowUsageDetails(!showUsageDetails)}
                        className="flex items-center gap-2 mb-4 text-lg font-semibold text-[var(--surface-800)] hover:text-[var(--surface-900)] transition-colors"
                    >
                        Usage This Period
                        {showUsageDetails ? (
                            <ChevronUp className="w-5 h-5" />
                        ) : (
                            <ChevronDown className="w-5 h-5" />
                        )}
                    </button>
                    {showUsageDetails && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <UsageMeter
                                label="AI Calls"
                                used={license?.usage?.ai_calls_used || 0}
                                max={license?.plan?.max_ai_calls_per_month || 1000}
                            />
                            <UsageMeter
                                label="Tokens"
                                used={license?.usage?.tokens_used || 0}
                                max={license?.plan?.max_token_usage_per_month || 100000}
                            />
                            <UsageMeter
                                label="Conversations"
                                used={license?.usage?.conversations_created || 0}
                                max={-1}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* ── Active Devices ── */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[var(--surface-800)]">
                        Active Devices ({activeDevices.length})
                    </h2>
                    <button
                        onClick={fetchLicense}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--surface-500)] hover:text-[var(--surface-700)] hover:bg-[var(--surface-100)] transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Refresh
                    </button>
                </div>

                {activeDevices.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] text-center">
                        <Monitor className="w-10 h-10 text-[var(--surface-400)] mx-auto mb-3" />
                        <h3 className="font-semibold text-[var(--surface-800)] mb-1">
                            No active devices
                        </h3>
                        <p className="text-sm text-[var(--surface-500)] max-w-sm mx-auto">
                            Download and install the Oraya desktop app, then sign in with your account to activate this device.
                        </p>
                    </div>
                ) : (
                    <div className="rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] overflow-hidden">
                        {activeDevices.map((device, i) => {
                            const DeviceIcon = getDeviceIcon(device.device_type, device.platform);
                            return (
                                <div
                                    key={device.id}
                                    className={cn(
                                        "flex items-center gap-4 p-4",
                                        i > 0 && "border-t border-[var(--surface-200)]"
                                    )}
                                >
                                    <div className="p-2.5 rounded-xl bg-[var(--success)]/10">
                                        <DeviceIcon className="w-5 h-5 text-[var(--success)]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[var(--surface-800)]">
                                            {device.device_name || "Unknown Device"}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-[var(--surface-500)] mt-0.5 flex-wrap">
                                            {device.platform && (
                                                <span>
                                                    {device.platform}
                                                    {device.platform_version ? ` ${device.platform_version}` : ""}
                                                </span>
                                            )}
                                            {device.app_version && (
                                                <>
                                                    <span>•</span>
                                                    <span>v{device.app_version}</span>
                                                </>
                                            )}
                                            <span>•</span>
                                            <span>Last seen {timeAgo(device.last_seen_at)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center gap-1 text-xs text-[var(--success)] mr-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                                            Active
                                        </span>
                                        <button
                                            onClick={() => handleDeactivateDevice(device.id)}
                                            disabled={deactivating === device.id}
                                            className="p-2 rounded-lg hover:bg-[var(--error)]/10 text-[var(--surface-400)] hover:text-[var(--error)] transition-colors"
                                            title="Deactivate device"
                                        >
                                            {deactivating === device.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Deactivated Devices ── */}
            {inactiveDevices.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold text-[var(--surface-800)] mb-4">
                        Deactivated Devices ({inactiveDevices.length})
                    </h2>
                    <div className="rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] overflow-hidden opacity-60">
                        {inactiveDevices.map((device, i) => {
                            const DeviceIcon = getDeviceIcon(device.device_type, device.platform);
                            return (
                                <div
                                    key={device.id}
                                    className={cn(
                                        "flex items-center gap-4 p-4",
                                        i > 0 && "border-t border-[var(--surface-200)]"
                                    )}
                                >
                                    <div className="p-2.5 rounded-xl bg-[var(--surface-200)]">
                                        <DeviceIcon className="w-5 h-5 text-[var(--surface-500)]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[var(--surface-600)]">
                                            {device.device_name || "Unknown Device"}
                                        </p>
                                        <p className="text-xs text-[var(--surface-400)]">
                                            Deactivated {formatDate(device.deactivated_at)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Usage Meter Sub-component
// ─────────────────────────────────────────────────────────────

function UsageMeter({
    label,
    used,
    max,
}: {
    label: string;
    used: number;
    max: number;
}) {
    const isUnlimited = max === -1;
    const percentage = isUnlimited ? 0 : Math.min((used / max) * 100, 100);
    const isHigh = percentage > 80;
    const isExhausted = percentage >= 100;

    return (
        <div className="p-4 rounded-xl bg-[var(--surface-50)] border border-[var(--surface-300)]">
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-[var(--surface-700)]">{label}</p>
                {isExhausted && (
                    <AlertTriangle className="w-4 h-4 text-[var(--error)]" />
                )}
            </div>
            <p className="text-lg font-bold text-[var(--surface-900)] mb-2">
                {formatNumber(used)}
                <span className="text-sm font-normal text-[var(--surface-500)]">
                    {" / "}
                    {isUnlimited ? "∞" : formatNumber(max)}
                </span>
            </p>
            {!isUnlimited && (
                <div className="w-full h-2 rounded-full bg-[var(--surface-200)] overflow-hidden">
                    <div
                        className={cn(
                            "h-full rounded-full transition-all duration-500",
                            isExhausted
                                ? "bg-[var(--error)]"
                                : isHigh
                                    ? "bg-[var(--warning)]"
                                    : "bg-[var(--primary)]"
                        )}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            )}
        </div>
    );
}
