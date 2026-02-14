"use client";

import { useState, useEffect } from "react";
import { Plus, RefreshCw, AlertTriangle, Key, Activity, DollarSign, Zap } from "lucide-react";
import { AIProvidersGrid } from "@/components/ai-providers/AIProvidersGrid";
import { AddKeyModal } from "@/components/ai-providers/AddKeyModal";
import { cn, formatCurrency } from "@/lib/utils";

interface KeyStats {
    total: number;
    healthy: number;
    unhealthy: number;
    inactive: number;
    dailySpend: number;
    monthlySpend: number;
    byProvider: Record<string, number>;
}

export default function AIProvidersPage() {
    const [keys, setKeys] = useState<any[]>([]);
    const [stats, setStats] = useState<KeyStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    const fetchData = async (isRefresh = false) => {
        if (isRefresh) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            const token = localStorage.getItem("oraya-superadmin-token");
            const response = await fetch("/api/superadmin/ai-providers", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setKeys(data.keys || []);
                setStats(data.stats || null);
            }
        } catch (error) {
            console.error("Error fetching AI providers:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRefresh = () => {
        fetchData(true);
    };

    const handleKeyAdded = () => {
        fetchData(true);
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--surface-900)]">AI Providers</h1>
                    <p className="text-[var(--surface-600)] mt-1">
                        Manage API keys for managed AI services across all providers
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-sm font-medium text-[var(--surface-700)] hover:bg-[var(--surface-200)] transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                        Refresh
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all shadow-lg hover:shadow-xl"
                        style={{
                            background: 'var(--gradient-primary)',
                            boxShadow: '0 4px 20px -4px var(--primary-glow)'
                        }}
                    >
                        <Plus className="w-4 h-4" />
                        Add API Key
                    </button>
                </div>
            </div>

            {/* Budget Warning Banner */}
            {stats && stats.monthlySpend > 5000 && (
                <div className="flex items-center gap-4 p-4 bg-[var(--warning)]/10 border border-[var(--warning)]/30 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-[var(--warning)] flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-[var(--warning)]">High Spend Alert</p>
                        <p className="text-sm text-[var(--surface-600)] mt-0.5">
                            Monthly spend is {formatCurrency(stats.monthlySpend)}. Consider reviewing usage patterns.
                        </p>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 border border-[var(--primary)]/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-[var(--primary)]/20">
                            <Key className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-600)]">Total API Keys</p>
                            <p className="text-2xl font-bold text-[var(--surface-900)]">
                                {isLoading ? "—" : stats?.total || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--success)]/10 to-[var(--success)]/5 border border-[var(--success)]/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-[var(--success)]/20">
                            <Zap className="w-5 h-5 text-[var(--success)]" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-600)]">Healthy Keys</p>
                            <p className="text-2xl font-bold text-[var(--success)]">
                                {isLoading ? "—" : stats?.healthy || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--secondary)]/10 to-[var(--secondary)]/5 border border-[var(--secondary)]/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-[var(--secondary)]/20">
                            <Activity className="w-5 h-5 text-[var(--secondary)]" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-600)]">Daily Spend</p>
                            <p className="text-2xl font-bold text-[var(--secondary)]">
                                {isLoading ? "—" : formatCurrency(stats?.dailySpend || 0)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-500/20">
                            <DollarSign className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-600)]">Monthly Spend</p>
                            <p className="text-2xl font-bold text-amber-400">
                                {isLoading ? "—" : formatCurrency(stats?.monthlySpend || 0)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Providers Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                        <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin" />
                        <p className="text-[var(--surface-600)]">Loading providers...</p>
                    </div>
                </div>
            ) : (
                <AIProvidersGrid providers={keys} onRefresh={handleRefresh} />
            )}

            {/* Add Key Modal */}
            <AddKeyModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={handleKeyAdded}
            />
        </div>
    );
}
