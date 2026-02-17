"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, RefreshCw, Users, Key, Activity, AlertTriangle } from "lucide-react";
import { UsersTable } from "@/components/superadmin/users/UsersTable";
import { CreateUserModal } from "@/components/superadmin/users/CreateUserModal";

interface UserStats {
    total: number;
    active: number;
    trial: number;
    churned: number;
}

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const fetchData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            const response = await fetch("/api/superadmin/users");
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users || []);
                setStats(data.stats || null);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = () => fetchData(true);
    const handleUserCreated = () => {
        setShowCreateModal(false);
        fetchData(true);
    };

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[var(--surface-900)]">Users & Licenses</h1>
                    <p className="text-sm text-[var(--surface-500)] mt-1">
                        Manage user accounts, licenses, and subscriptions.
                    </p>
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
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-medium text-white transition-all shadow-lg hover:shadow-xl"
                        style={{ background: 'var(--gradient-primary)' }}
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add User</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                    { label: "Total Users", value: stats?.total, icon: Users, color: "var(--primary)", bg: "var(--primary)" },
                    { label: "Active Licenses", value: stats?.active, icon: Key, color: "rgb(16,185,129)", bg: "rgb(16,185,129)" },
                    { label: "Trial Users", value: stats?.trial, icon: Activity, color: "rgb(245,158,11)", bg: "rgb(245,158,11)" },
                    { label: "Churned (30d)", value: stats?.churned, icon: AlertTriangle, color: "rgb(239,68,68)", bg: "rgb(239,68,68)" },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-200)]">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl shrink-0" style={{ background: `${bg}15` }}>
                                <Icon className="w-5 h-5" style={{ color }} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs sm:text-sm text-[var(--surface-500)] truncate">{label}</p>
                                <p className="text-lg sm:text-2xl font-bold" style={{ color: color }}>
                                    {isLoading ? "—" : (value || 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Users Table / Loading */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                        <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin" />
                        <p className="text-[var(--surface-600)]">Loading users...</p>
                    </div>
                </div>
            ) : (
                <UsersTable users={users} onRefresh={handleRefresh} />
            )}

            {/* Create User Modal */}
            <CreateUserModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleUserCreated}
            />
        </div>
    );
}
