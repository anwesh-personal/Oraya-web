"use client";

import { useState } from "react";
import {
    Search,
    MoreHorizontal,
    Eye,
    Settings,
    Trash2,
    CheckCircle,
    XCircle,
    Clock,
    Server,
    Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Engine {
    id: string;
    name: string;
    provider: string;
    model: string;
    status: "active" | "inactive" | "maintenance";
    deployments: number;
    avgLatency: number;
    uptime: number;
    lastDeployed: string;
}

interface EnginesTableProps {
    engines: Engine[];
}

const providerColors: Record<string, string> = {
    openai: "from-emerald-500 to-green-600",
    anthropic: "from-orange-500 to-amber-600",
    google: "from-blue-500 to-cyan-600",
    mistral: "from-purple-500 to-violet-600",
};

export function EnginesTable({ engines }: EnginesTableProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const filteredEngines = engines.filter((engine) =>
        engine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        engine.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        engine.provider.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "active":
                return <CheckCircle className="w-4 h-4 text-success" />;
            case "inactive":
                return <XCircle className="w-4 h-4 text-error" />;
            case "maintenance":
                return <Clock className="w-4 h-4 text-warning" />;
            default:
                return null;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return "bg-success/20 text-success";
            case "inactive":
                return "bg-error/20 text-error";
            case "maintenance":
                return "bg-warning/20 text-warning";
            default:
                return "bg-[var(--surface-400)]/20 text-[var(--surface-500)]";
        }
    };

    return (
        <div className="rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-200)] overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b border-[var(--surface-200)]">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--surface-400)]" />
                    <input
                        type="text"
                        placeholder="Search engines..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    />
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
                                Provider
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">
                                Deployments
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">
                                Avg Latency
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">
                                Uptime
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--surface-200)]">
                        {filteredEngines.map((engine) => (
                            <tr key={engine.id} className="hover:bg-[var(--surface-100)] transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center",
                                            providerColors[engine.provider] || "from-gray-500 to-gray-600"
                                        )}>
                                            <Server className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-[var(--surface-900)]">{engine.name}</p>
                                            <p className="text-sm text-[var(--surface-500)]">{engine.model}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--surface-200)] text-[var(--surface-800)] capitalize">
                                        {engine.provider}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-warning" />
                                        <span className="text-[var(--surface-900)] font-medium">{engine.deployments}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-[var(--surface-900)]">{engine.avgLatency}s</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-[var(--surface-200)] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-success rounded-full"
                                                style={{ width: `${engine.uptime}%` }}
                                            />
                                        </div>
                                        <span className="text-[var(--surface-900)] text-sm">{engine.uptime}%</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(engine.status)}
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                                            getStatusBadge(engine.status)
                                        )}>
                                            {engine.status}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end relative">
                                        <button
                                            onClick={() => setOpenDropdown(openDropdown === engine.id ? null : engine.id)}
                                            className="p-2 rounded-lg hover:bg-[var(--surface-200)] text-[var(--surface-500)] hover:text-[var(--surface-900)] transition-colors"
                                        >
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>

                                        {openDropdown === engine.id && (
                                            <div className="absolute right-0 top-full mt-2 w-40 rounded-xl bg-[var(--surface-50)] border border-[var(--surface-200)] shadow-xl z-50">
                                                <div className="p-1">
                                                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--surface-600)] hover:bg-[var(--surface-100)] text-sm">
                                                        <Eye className="w-4 h-4" />
                                                        View
                                                    </button>
                                                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--surface-600)] hover:bg-[var(--surface-100)] text-sm">
                                                        <Settings className="w-4 h-4" />
                                                        Configure
                                                    </button>
                                                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-error hover:bg-error/10 text-sm">
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

                {filteredEngines.length === 0 && (
                    <div className="py-12 text-center">
                        <Server className="w-12 h-12 text-[var(--surface-400)] mx-auto mb-4" />
                        <p className="text-[var(--surface-500)]">No engines found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
