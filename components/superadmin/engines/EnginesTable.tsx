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
    Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EngineEditor } from "./EngineEditor";
import { DeployModal } from "./DeployModal";

interface Engine {
    id: string;
    name: string;
    description?: string;
    status: "active" | "archived" | "draft";
    slots?: any[];
    slot_count?: number;
    deployment_count?: number;
    categories?: {
        llm: number;
        image: number;
        audio: number;
        video: number;
    };
    created_at: string;
}

interface EnginesTableProps {
    engines: Engine[];
    onRefresh: () => void;
}


export function EnginesTable({ engines, onRefresh }: EnginesTableProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    // Modal state
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingEngine, setEditingEngine] = useState<Engine | null>(null);
    const [isDeployOpen, setIsDeployOpen] = useState(false);
    const [deployingEngine, setDeployingEngine] = useState<Engine | null>(null);


    const handleEdit = (engine: Engine) => {
        setEditingEngine(engine);
        setIsEditorOpen(true);
        setOpenDropdown(null);
    };

    const handleDeploy = (engine: Engine) => {
        setDeployingEngine(engine);
        setIsDeployOpen(true);
        setOpenDropdown(null);
    };

    const filteredEngines = engines.filter((engine) =>
        engine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (engine.description || "").toLowerCase().includes(searchQuery.toLowerCase())
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
                                Slots (by category)
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">
                                Deployments
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
                                            "from-gray-500 to-gray-600"
                                        )}>
                                            <Server className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-[var(--surface-900)]">{engine.name}</p>
                                            <p className="text-sm text-[var(--surface-500)]">{engine.description || "No description"}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-2">
                                        {engine.categories?.llm ? (
                                            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                                {engine.categories.llm} LLM
                                            </span>
                                        ) : null}
                                        {engine.categories?.image ? (
                                            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                                {engine.categories.image} Image
                                            </span>
                                        ) : null}
                                        {engine.categories?.audio ? (
                                            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-purple-500/10 text-purple-600 border border-purple-500/20">
                                                {engine.categories.audio} Audio
                                            </span>
                                        ) : null}
                                        {!engine.slot_count && <span className="text-[var(--surface-400)] text-sm">Empty</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-warning" />
                                        <span className="text-[var(--surface-900)] font-medium">{engine.deployment_count || 0}</span>
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
                                                    <button
                                                        onClick={() => handleEdit(engine)}
                                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--surface-600)] hover:bg-[var(--surface-100)] text-sm"
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                        Configure
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeploy(engine)}
                                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-emerald-600 hover:bg-emerald-500/10 text-sm"
                                                    >
                                                        <Rocket className="w-4 h-4" />
                                                        Deploy
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

            <EngineEditor
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                onSuccess={() => {
                    setIsEditorOpen(false);
                    onRefresh();
                }}
                engine={editingEngine}
            />

            <DeployModal
                isOpen={isDeployOpen}
                onClose={() => setIsDeployOpen(false)}
                onSuccess={() => {
                    setIsDeployOpen(false);
                    onRefresh();
                }}
                engine={deployingEngine}
            />
        </div>
    );
}
