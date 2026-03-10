"use client";

import { useState, useEffect } from "react";
import { DeploymentsTable } from "@/components/superadmin/deployments/DeploymentsTable";
import { Rocket, CheckCircle, XCircle, RefreshCw, CreditCard, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Deployment {
    id: string;
    master_engine_id: string;
    target_type: "plan" | "user";
    target_id: string;
    target_name: string;
    engine_name: string;
    status: string;
    deployed_at: string;
    updated_at: string;
}

export default function DeploymentsPage() {
    const [deployments, setDeployments] = useState<Deployment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const stats = {
        total: deployments.length,
        active: deployments.filter((d) => d.status === "active").length,
        plans: deployments.filter((d) => d.target_type === "plan").length,
        users: deployments.filter((d) => d.target_type === "user").length,
    };

    const fetchDeployments = async (isRefresh = false) => {
        if (isRefresh) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            const res = await fetch("/api/superadmin/engines/deploy");
            if (res.ok) {
                const data = await res.json();
                setDeployments(data.deployments || []);
            }
        } catch (err) {
            console.error("Failed to fetch deployments:", err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDeployments();
    }, []);

    const handleRefresh = () => fetchDeployments(true);

    const handleUndeploy = async (deploymentId: string) => {
        try {
            const res = await fetch(`/api/superadmin/engines/deploy?id=${deploymentId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                fetchDeployments(true);
            }
        } catch (err) {
            console.error("Undeploy failed:", err);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--surface-900)]">Deployments</h1>
                    <p className="text-[var(--surface-500)] mt-1">
                        Engine assignments across plans and users
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
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 border border-primary/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/20">
                            <Rocket className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-500)]">Total Deployments</p>
                            <p className="text-2xl font-bold text-[var(--surface-900)]">{stats.total}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-success/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-success/20">
                            <CheckCircle className="w-6 h-6 text-success" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-500)]">Active</p>
                            <p className="text-2xl font-bold text-[var(--surface-900)]">{stats.active}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-500/20">
                            <CreditCard className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-500)]">Plan Assignments</p>
                            <p className="text-2xl font-bold text-[var(--surface-900)]">{stats.plans}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-500/20">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-500)]">User Overrides</p>
                            <p className="text-2xl font-bold text-[var(--surface-900)]">{stats.users}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <DeploymentsTable
                deployments={deployments}
                isLoading={isLoading}
                onUndeploy={handleUndeploy}
            />
        </div>
    );
}
