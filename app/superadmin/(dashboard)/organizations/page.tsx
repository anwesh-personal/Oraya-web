"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, RefreshCw, Building2, Users, DollarSign, TrendingUp } from "lucide-react";
import { OrganizationsTable } from "@/components/superadmin/organizations/OrganizationsTable";
import { CreateOrgModal } from "@/components/superadmin/organizations/CreateOrgModal";
import { formatCurrency } from "@/lib/utils";

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
            const response = await fetch("/api/superadmin/organizations");
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
        <div className="space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[var(--surface-900)]">Organizations</h1>
                    <p className="text-sm text-[var(--surface-500)] mt-1">Manage customer organizations and their members</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-sm font-medium text-[var(--surface-700)] hover:bg-[var(--surface-200)] transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-white font-medium transition-all shadow-lg"
                        style={{ background: 'var(--gradient-primary)' }}
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Organization</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                    { label: "Total Orgs", value: stats?.total, format: (v: number) => v.toString(), icon: Building2, color: "var(--primary)", bg: "var(--primary)" },
                    { label: "Active", value: stats?.active, format: (v: number) => v.toString(), icon: Users, color: "rgb(16,185,129)", bg: "rgb(16,185,129)" },
                    { label: "Revenue", value: stats?.revenue, format: (v: number) => formatCurrency(v), icon: DollarSign, color: "rgb(245,158,11)", bg: "rgb(245,158,11)" },
                    { label: "Growth", value: stats?.growth, format: (v: number) => `+${v}%`, icon: TrendingUp, color: "rgb(59,130,246)", bg: "rgb(59,130,246)" },
                ].map(({ label, value, format, icon: Icon, color, bg }) => (
                    <div key={label} className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-200)]">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl shrink-0" style={{ background: `${bg}15` }}>
                                <Icon className="w-5 h-5" style={{ color }} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs sm:text-sm text-[var(--surface-500)] truncate">{label}</p>
                                <p className="text-lg sm:text-2xl font-bold" style={{ color }}>
                                    {isLoading ? "—" : format(value || 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table / Loading */}
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
