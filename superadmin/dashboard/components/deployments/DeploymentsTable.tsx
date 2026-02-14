"use client";

import { useState } from "react";
import {
    Search,
    MoreHorizontal,
    Eye,
    RefreshCw,
    Trash2,
    CheckCircle,
    XCircle,
    Clock,
    Rocket,
    Building2,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface Deployment {
    id: string;
    name: string;
    organization: string;
    engine: string;
    environment: "production" | "staging" | "development";
    status: "active" | "pending" | "failed" | "stopped";
    version: string;
    deployedAt: string;
    deployedBy: string;
    error?: string;
}

interface DeploymentsTableProps {
    deployments: Deployment[];
}

export function DeploymentsTable({ deployments }: DeploymentsTableProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [envFilter, setEnvFilter] = useState<string>("all");
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const filteredDeployments = deployments.filter((dep) => {
        const matchesSearch =
            dep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dep.organization.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || dep.status === statusFilter;
        const matchesEnv = envFilter === "all" || dep.environment === envFilter;
        return matchesSearch && matchesStatus && matchesEnv;
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "active":
                return <CheckCircle className="w-4 h-4 text-emerald-400" />;
            case "failed":
                return <XCircle className="w-4 h-4 text-red-400" />;
            case "pending":
                return <Clock className="w-4 h-4 text-amber-400" />;
            default:
                return null;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return "bg-emerald-500/20 text-emerald-300";
            case "failed":
                return "bg-red-500/20 text-red-300";
            case "pending":
                return "bg-amber-500/20 text-amber-300";
            case "stopped":
                return "bg-gray-500/20 text-gray-300";
            default:
                return "bg-gray-500/20 text-gray-300";
        }
    };

    const getEnvBadge = (env: string) => {
        switch (env) {
            case "production":
                return "bg-violet-500/20 text-violet-300 border-violet-500/30";
            case "staging":
                return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
            case "development":
                return "bg-gray-500/20 text-gray-300 border-gray-500/30";
            default:
                return "bg-gray-500/20 text-gray-300 border-gray-500/30";
        }
    };

    return (
        <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search deployments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                    </select>

                    <select
                        value={envFilter}
                        onChange={(e) => setEnvFilter(e.target.value)}
                        className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    >
                        <option value="all">All Environments</option>
                        <option value="production">Production</option>
                        <option value="staging">Staging</option>
                        <option value="development">Development</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Deployment
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Organization
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Engine
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Environment
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Deployed
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredDeployments.map((dep) => (
                            <tr key={dep.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                            <Rocket className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{dep.name}</p>
                                            <p className="text-sm text-gray-400">v{dep.version}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-gray-400" />
                                        <span className="text-white">{dep.organization}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-gray-300">{dep.engine}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "px-2.5 py-1 rounded-full text-xs font-medium border capitalize",
                                        getEnvBadge(dep.environment)
                                    )}>
                                        {dep.environment}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(dep.status)}
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                                            getStatusBadge(dep.status)
                                        )}>
                                            {dep.status}
                                        </span>
                                    </div>
                                    {dep.error && (
                                        <p className="text-xs text-red-400 mt-1">{dep.error}</p>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div>
                                        <p className="text-sm text-white">{formatDate(dep.deployedAt)}</p>
                                        <p className="text-xs text-gray-400">by {dep.deployedBy}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end relative">
                                        <button
                                            onClick={() => setOpenDropdown(openDropdown === dep.id ? null : dep.id)}
                                            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                        >
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>

                                        {openDropdown === dep.id && (
                                            <div className="absolute right-0 top-full mt-2 w-40 rounded-xl bg-gray-900 border border-white/10 shadow-xl z-50">
                                                <div className="p-1">
                                                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-white/10 text-sm">
                                                        <Eye className="w-4 h-4" />
                                                        View Logs
                                                    </button>
                                                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-white/10 text-sm">
                                                        <RefreshCw className="w-4 h-4" />
                                                        Redeploy
                                                    </button>
                                                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 text-sm">
                                                        <Trash2 className="w-4 h-4" />
                                                        Delete
                                                    </button>
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
                        <Rocket className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No deployments found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
