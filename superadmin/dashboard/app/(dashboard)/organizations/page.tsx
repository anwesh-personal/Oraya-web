"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, RefreshCw, Building2, Users, DollarSign, TrendingUp } from "lucide-react";
import { OrganizationsTable } from "@/components/organizations/OrganizationsTable";
import { CreateOrgModal } from "@/components/organizations/CreateOrgModal";
import { cn, formatNumber, formatCurrency } from "@/lib/utils";

interface OrgStats {
    total: number;
    active: number;
    revenue: number;
    growth: number;
}

export default function OrganizationsPage() {
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [stats, setStats] = useState<OrgStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const fetchData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            const token = localStorage.getItem("oraya-superadmin-token");
            const response = await fetch("/api/superadmin/organizations", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setOrganizations(data.organizations || []);
                setStats(data.stats || null);
            }
        } catch (error) {
            console.error("Error fetching organizations:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = () => fetchData(true);
    const handleOrgCreated = () => {
        setShowCreateModal(false);
        fetchData(true);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--surface-900)]">Organizations</h1>
                    <p className="text-[var(--surface-600)] mt-1">
                        Manage teams, members, and organization settings.
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
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all shadow-lg hover:shadow-xl"
                        style={{
                            background: 'var(--gradient-primary)',
                            boxShadow: '0 4px 20px -4px var(--primary-glow)'
                        }}
                    >
                        <Plus className="w-4 h-4" />
                        Add Organization
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 border border-[var(--primary)]/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-[var(--primary)]/20">
                            <Building2 className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-600)]">Total Orgs</p>
                            <p className="text-2xl font-bold text-[var(--surface-900)]">
                                {isLoading ? "—" : formatNumber(stats?.total || 0)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--success)]/10 to-[var(--success)]/5 border border-[var(--success)]/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-[var(--success)]/20">
                            <Users className="w-5 h-5 text-[var(--success)]" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-600)]">Active Orgs</p>
                            <p className="text-2xl font-bold text-[var(--success)]">
                                {isLoading ? "—" : formatNumber(stats?.active || 0)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--secondary)]/10 to-[var(--secondary)]/5 border border-[var(--secondary)]/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-[var(--secondary)]/20">
                            <DollarSign className="w-5 h-5 text-[var(--secondary)]" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-600)]">Revenue (Active)</p>
                            <p className="text-2xl font-bold text-[var(--secondary)]">
                                {isLoading ? "—" : formatCurrency(stats?.revenue || 0)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-500/20">
                            <TrendingUp className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-600)]">Growth</p>
                            <p className="text-2xl font-bold text-amber-400">
                                {isLoading ? "—" : `${stats?.growth || 0}%`}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                        <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin" />
                        <p className="text-[var(--surface-600)]">Loading organizations...</p>
                    </div>
                </div>
            ) : (
                <OrganizationsTable organizations={organizations} onRefresh={handleRefresh} />
            )}

            {/* Create Modal */}
            <CreateOrgModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleOrgCreated}
            />
        </div>
    );
}
