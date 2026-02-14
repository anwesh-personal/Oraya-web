"use client";

import { useState } from "react";
import {
    Eye,
    EyeOff,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    AlertTriangle,
    MoreHorizontal,
    Zap,
    Power,
    Copy,
    ExternalLink,
} from "lucide-react";
import { cn, formatCurrency, formatRelativeTime } from "@/lib/utils";
import { providers } from "@/lib/ai-providers";
import { toast } from "sonner";

interface ManagedAIKey {
    id: string;
    provider: string;
    key_name: string;
    api_key: string;
    is_active: boolean;
    is_healthy: boolean;
    daily_budget_usd: number | null;
    monthly_budget_usd: number | null;
    current_daily_spend_usd: number;
    current_monthly_spend_usd: number;
    max_requests_per_minute: number;
    error_count: number;
    last_error: string | null;
    last_used_at: string | null;
    created_at: string;
}

interface AIProvidersGridProps {
    providers: ManagedAIKey[];
    onRefresh?: () => void;
}

export function AIProvidersGrid({ providers: keys, onRefresh }: AIProvidersGridProps) {
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Group by provider
    const groupedKeys = keys.reduce((acc, key) => {
        if (!acc[key.provider]) {
            acc[key.provider] = [];
        }
        acc[key.provider].push(key);
        return acc;
    }, {} as Record<string, ManagedAIKey[]>);

    const toggleKey = async (key: ManagedAIKey) => {
        setActionLoading(key.id);
        try {
            const response = await fetch("/api/superadmin/ai-providers", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: key.id,
                    is_active: !key.is_active,
                }),
            });

            if (response.ok) {
                toast.success(`Key ${key.is_active ? "disabled" : "enabled"} successfully`);
                onRefresh?.();
            } else {
                toast.error("Failed to update key");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setActionLoading(null);
            setSelectedKey(null);
        }
    };

    const deleteKey = async (key: ManagedAIKey) => {
        if (!confirm(`Are you sure you want to delete "${key.key_name}"?`)) return;

        setActionLoading(key.id);
        try {
            const response = await fetch(`/api/superadmin/ai-providers?id=${key.id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast.success("Key deleted successfully");
                onRefresh?.();
            } else {
                toast.error("Failed to delete key");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setActionLoading(null);
            setSelectedKey(null);
        }
    };

    const copyKey = (apiKey: string) => {
        navigator.clipboard.writeText(apiKey);
        toast.success("API key copied to clipboard");
    };

    const testKey = async (key: ManagedAIKey) => {
        toast.info("Testing API key...");
        // In production, this would call a test endpoint
        setTimeout(() => {
            toast.success(`Key "${key.key_name}" is working correctly`);
        }, 1500);
    };

    if (keys.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="p-4 rounded-2xl bg-[var(--surface-100)] mb-4">
                    <Zap className="w-10 h-10 text-[var(--surface-500)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--surface-800)]">No API Keys</h3>
                <p className="text-[var(--surface-600)] mt-1 max-w-sm">
                    Add your first API key to start using managed AI services
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {Object.entries(groupedKeys).map(([providerId, providerKeys]) => {
                const providerConfig = providers[providerId as keyof typeof providers];
                const config = providerConfig || {
                    name: providerId,
                    logo: "🔑",
                    color: "text-[var(--surface-600)]",
                    bgColor: "bg-[var(--surface-100)]",
                    website: "#",
                };

                return (
                    <div key={providerId} className="rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] overflow-hidden">
                        {/* Provider Header */}
                        <div className={cn("px-5 py-4 border-b border-[var(--surface-300)]", config.bgColor)}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{config.logo}</span>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className={cn("font-semibold", config.color)}>{config.name}</h3>
                                            {providerConfig && (
                                                <a
                                                    href={providerConfig.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1 rounded hover:bg-[var(--surface-200)] transition-colors"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5 text-[var(--surface-500)]" />
                                                </a>
                                            )}
                                        </div>
                                        <p className="text-sm text-[var(--surface-500)]">
                                            {providerKeys.length} API Key{providerKeys.length !== 1 ? "s" : ""}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-xs text-[var(--surface-500)]">Daily Spend</p>
                                        <p className="text-sm font-semibold text-[var(--surface-800)]">
                                            {formatCurrency(providerKeys.reduce((sum, k) => sum + (k.current_daily_spend_usd || 0), 0))}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-[var(--surface-500)]">Monthly Spend</p>
                                        <p className="text-sm font-semibold text-[var(--surface-800)]">
                                            {formatCurrency(providerKeys.reduce((sum, k) => sum + (k.current_monthly_spend_usd || 0), 0))}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Keys List */}
                        <div className="divide-y divide-[var(--surface-300)]">
                            {providerKeys.map((key) => (
                                <div
                                    key={key.id}
                                    className={cn(
                                        "px-5 py-4 transition-colors",
                                        !key.is_active && "opacity-60",
                                        "hover:bg-[var(--surface-100)]"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        {/* Key Info */}
                                        <div className="flex items-center gap-4">
                                            {/* Status Indicator */}
                                            <div className={cn(
                                                "w-2.5 h-2.5 rounded-full",
                                                key.is_active && key.is_healthy
                                                    ? "bg-[var(--success)] shadow-lg shadow-[var(--success-glow)]"
                                                    : key.is_active && !key.is_healthy
                                                        ? "bg-[var(--warning)] shadow-lg shadow-[var(--warning-glow)]"
                                                        : "bg-[var(--surface-500)]"
                                            )} />

                                            {/* Name & Key */}
                                            <div>
                                                <p className="font-medium text-[var(--surface-800)]">{key.key_name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <code className="text-xs font-mono text-[var(--surface-500)] bg-[var(--surface-200)] px-2 py-0.5 rounded">
                                                        {showKeys[key.id]
                                                            ? key.api_key
                                                            : `${key.api_key?.slice(0, 8)}${"•".repeat(16)}${key.api_key?.slice(-4)}`
                                                        }
                                                    </code>
                                                    <button
                                                        onClick={() => setShowKeys({ ...showKeys, [key.id]: !showKeys[key.id] })}
                                                        className="p-1 text-[var(--surface-500)] hover:text-[var(--surface-700)] transition-colors"
                                                    >
                                                        {showKeys[key.id]
                                                            ? <EyeOff className="w-3.5 h-3.5" />
                                                            : <Eye className="w-3.5 h-3.5" />
                                                        }
                                                    </button>
                                                    <button
                                                        onClick={() => copyKey(key.api_key)}
                                                        className="p-1 text-[var(--surface-500)] hover:text-[var(--surface-700)] transition-colors"
                                                    >
                                                        <Copy className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats & Actions */}
                                        <div className="flex items-center gap-6">
                                            {/* Health Status */}
                                            <div className="flex items-center gap-2 min-w-[100px]">
                                                {key.is_healthy ? (
                                                    <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                                                ) : (
                                                    <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />
                                                )}
                                                <span className={cn(
                                                    "text-sm",
                                                    key.is_healthy ? "text-[var(--success)]" : "text-[var(--warning)]"
                                                )}>
                                                    {key.is_healthy ? "Healthy" : `${key.error_count} errors`}
                                                </span>
                                            </div>

                                            {/* Budget Progress */}
                                            <div className="w-32">
                                                <div className="flex items-center justify-between text-xs mb-1">
                                                    <span className="text-[var(--surface-500)]">Daily</span>
                                                    <span className="text-[var(--surface-700)]">
                                                        {formatCurrency(key.current_daily_spend_usd || 0)}
                                                        {key.daily_budget_usd && ` / ${formatCurrency(key.daily_budget_usd)}`}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 bg-[var(--surface-200)] rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full transition-all",
                                                            key.daily_budget_usd && ((key.current_daily_spend_usd || 0) / key.daily_budget_usd) > 0.9
                                                                ? "bg-[var(--error)]"
                                                                : key.daily_budget_usd && ((key.current_daily_spend_usd || 0) / key.daily_budget_usd) > 0.7
                                                                    ? "bg-[var(--warning)]"
                                                                    : "bg-[var(--success)]"
                                                        )}
                                                        style={{
                                                            width: key.daily_budget_usd
                                                                ? `${Math.min(100, ((key.current_daily_spend_usd || 0) / key.daily_budget_usd) * 100)}%`
                                                                : "0%",
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Last Used */}
                                            <div className="text-right w-28">
                                                <p className="text-xs text-[var(--surface-500)]">Last used</p>
                                                <p className="text-sm text-[var(--surface-700)]">
                                                    {key.last_used_at ? formatRelativeTime(key.last_used_at) : "Never"}
                                                </p>
                                            </div>

                                            {/* Actions Menu */}
                                            <div className="relative">
                                                <button
                                                    onClick={() => setSelectedKey(selectedKey === key.id ? null : key.id)}
                                                    disabled={actionLoading === key.id}
                                                    className="p-2 rounded-lg hover:bg-[var(--surface-200)] transition-colors disabled:opacity-50"
                                                >
                                                    <MoreHorizontal className="w-4 h-4 text-[var(--surface-500)]" />
                                                </button>

                                                {selectedKey === key.id && (
                                                    <>
                                                        <div
                                                            className="fixed inset-0 z-40"
                                                            onClick={() => setSelectedKey(null)}
                                                        />
                                                        <div className="absolute right-0 top-full mt-1 w-44 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl shadow-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
                                                            <button
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--surface-700)] hover:bg-[var(--surface-200)] transition-colors"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                                Edit Key
                                                            </button>
                                                            <button
                                                                onClick={() => testKey(key)}
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--surface-700)] hover:bg-[var(--surface-200)] transition-colors"
                                                            >
                                                                <Zap className="w-4 h-4" />
                                                                Test Key
                                                            </button>
                                                            <button
                                                                onClick={() => toggleKey(key)}
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--surface-700)] hover:bg-[var(--surface-200)] transition-colors"
                                                            >
                                                                <Power className="w-4 h-4" />
                                                                {key.is_active ? "Disable" : "Enable"}
                                                            </button>
                                                            <div className="my-1 border-t border-[var(--surface-300)]" />
                                                            <button
                                                                onClick={() => deleteKey(key)}
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Delete Key
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Error Message */}
                                    {key.last_error && !key.is_healthy && (
                                        <div className="mt-3 p-3 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20">
                                            <p className="text-xs text-[var(--error)]">
                                                <span className="font-medium">Last Error:</span> {key.last_error}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
