"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Download, Filter, RefreshCw, Users, Key, Activity, AlertTriangle } from "lucide-react";
import { UsersTable } from "@/components/users/UsersTable";
import { CreateUserModal } from "@/components/users/CreateUserModal";
import { cn, formatNumber } from "@/lib/utils";

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
            const token = localStorage.getItem("oraya-superadmin-token");
            const response = await fetch("/api/superadmin/users", {
                headers: { Authorization: `Bearer ${token}` },
            });

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
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--surface-900)]">Users & Licenses</h1>
                    <p className="text-[var(--surface-600)] mt-1">
                        Manage user accounts, licenses, and subscriptions.
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
                        Add User
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 border border-[var(--primary)]/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-[var(--primary)]/20">
                            <Users className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-600)]">Total Users</p>
                            <p className="text-2xl font-bold text-[var(--surface-900)]">
                                {isLoading ? "—" : formatNumber(stats?.total || 0)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--success)]/10 to-[var(--success)]/5 border border-[var(--success)]/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-[var(--success)]/20">
                            <Key className="w-5 h-5 text-[var(--success)]" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-600)]">Active Licenses</p>
                            <p className="text-2xl font-bold text-[var(--success)]">
                                {isLoading ? "—" : formatNumber(stats?.active || 0)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-500/20">
                            <Activity className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-600)]">Trial Users</p>
                            <p className="text-2xl font-bold text-amber-400">
                                {isLoading ? "—" : formatNumber(stats?.trial || 0)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-500/10 to-rose-500/5 border border-rose-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-rose-500/20">
                            <AlertTriangle className="w-5 h-5 text-rose-400" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-600)]">Churned (30d)</p>
                            <p className="text-2xl font-bold text-rose-400">
                                {isLoading ? "—" : formatNumber(stats?.churned || 0)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Users Table */}
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
