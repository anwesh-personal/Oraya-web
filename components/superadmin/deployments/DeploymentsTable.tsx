"use client";

import { useState, useEffect } from "react";
import {
    Search,
    MoreHorizontal,
    Trash2,
    CheckCircle,
    XCircle,
    Rocket,
    CreditCard,
    Users,
    Server,
    RefreshCw,
} from "lucide-react";
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

interface DeploymentsTableProps {
    deployments: Deployment[];
    isLoading: boolean;
    onUndeploy: (deploymentId: string) => void;
}

export function DeploymentsTable({ deployments, isLoading, onUndeploy }: DeploymentsTableProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const filteredDeployments = deployments.filter((dep) => {
        const matchesSearch =
            dep.engine_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dep.target_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === "all" || dep.target_type === typeFilter;
        const matchesStatus = statusFilter === "all" || dep.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
    });

    const handleUndeploy = (depId: string) => {
        setConfirmDelete(null);
        setOpenDropdown(null);
        onUndeploy(depId);
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = () => setOpenDropdown(null);
        if (openDropdown) {
            document.addEventListener("click", handleClick);
            return () => document.removeEventListener("click", handleClick);
        }
    }, [openDropdown]);

    if (isLoading) {
        return (
            <div className="rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-200)] p-16">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin" />
                    <p className="text-[var(--surface-500)]">Loading deployments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-200)] overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b border-[var(--surface-200)] flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--surface-400)]" />
                    <input
                        type="text"
                        placeholder="Search by engine or target name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    >
                        <option value="all">All Targets</option>
                        <option value="plan">Plans</option>
                        <option value="user">Users</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[var(--surface-200)]">
                            <th className="px-6 py-4 text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">
                                Engine
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">
                                Target
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">
                                Type
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">
                                Deployed
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--surface-200)]">
                        {filteredDeployments.map((dep) => (
                            <tr key={dep.id} className="hover:bg-[var(--surface-100)] transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                                            style={{ background: 'var(--gradient-primary)' }}
                                        >
                                            <Server className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-[var(--surface-900)]">{dep.engine_name}</p>
                                            <p className="text-xs text-[var(--surface-500)] font-mono">{dep.master_engine_id.slice(0, 8)}...</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {dep.target_type === "plan" ? (
                                            <CreditCard className="w-4 h-4 text-emerald-500" />
                                        ) : (
                                            <Users className="w-4 h-4 text-blue-500" />
                                        )}
                                        <span className="text-[var(--surface-900)]">{dep.target_name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "px-2.5 py-1 rounded-full text-xs font-medium border capitalize",
                                        dep.target_type === "plan"
                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/25"
                                            : "bg-blue-500/10 text-blue-600 border-blue-500/25"
                                    )}>
                                        {dep.target_type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {dep.status === "active" ? (
                                            <CheckCircle className="w-4 h-4 text-success" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-[var(--surface-400)]" />
                                        )}
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                                            dep.status === "active"
                                                ? "bg-success/20 text-success"
                                                : "bg-[var(--surface-400)]/20 text-[var(--surface-500)]"
                                        )}>
                                            {dep.status}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div>
                                        <p className="text-sm text-[var(--surface-900)]">
                                            {new Date(dep.deployed_at).toLocaleDateString("en-US", {
                                                month: "short", day: "numeric", year: "numeric"
                                            })}
                                        </p>
                                        <p className="text-xs text-[var(--surface-500)]">
                                            {new Date(dep.deployed_at).toLocaleTimeString("en-US", {
                                                hour: "2-digit", minute: "2-digit"
                                            })}
                                        </p>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenDropdown(openDropdown === dep.id ? null : dep.id);
                                            }}
                                            className="p-2 rounded-lg hover:bg-[var(--surface-200)] text-[var(--surface-500)] hover:text-[var(--surface-900)] transition-colors"
                                        >
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>

                                        {openDropdown === dep.id && (
                                            <div
                                                className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[var(--surface-50)] border border-[var(--surface-200)] shadow-xl z-50"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="p-1">
                                                    {confirmDelete === dep.id ? (
                                                        <div className="p-3 space-y-2">
                                                            <p className="text-xs text-[var(--surface-600)]">Remove this deployment?</p>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleUndeploy(dep.id)}
                                                                    className="flex-1 px-3 py-1.5 rounded-lg bg-error/10 text-error text-xs font-medium hover:bg-error/20 transition-colors"
                                                                >
                                                                    Confirm
                                                                </button>
                                                                <button
                                                                    onClick={() => setConfirmDelete(null)}
                                                                    className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--surface-100)] text-[var(--surface-600)] text-xs font-medium hover:bg-[var(--surface-200)] transition-colors"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setConfirmDelete(dep.id)}
                                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-error hover:bg-error/10 text-sm transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Remove Deployment
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredDeployments.length === 0 && (
                    <div className="py-12 text-center">
                        <Rocket className="w-12 h-12 text-[var(--surface-400)] mx-auto mb-4" />
                        <p className="text-[var(--surface-500)]">
                            {deployments.length === 0
                                ? "No engine deployments yet. Deploy an engine from the Engines page."
                                : "No deployments match your filters."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
