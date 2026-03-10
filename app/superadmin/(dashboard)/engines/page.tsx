"use client";

import { useState, useEffect } from "react";
import { EnginesTable } from "@/components/superadmin/engines/EnginesTable";
import { Plus, Server, Cpu, HardDrive, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { EngineEditor } from "@/components/superadmin/engines/EngineEditor";

export default function EnginesPage() {
    const [engines, setEngines] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    const [stats, setStats] = useState({
        totalEngines: 0,
        activeEngines: 0,
        totalDeployments: 0,
    });

    const fetchEngines = async (isRefresh = false) => {
        if (isRefresh) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            const response = await fetch("/api/superadmin/engines");
            if (response.ok) {
                const data = await response.json();
                const fetchedEngines = data.engines || [];

                setEngines(fetchedEngines);

                setStats({
                    totalEngines: fetchedEngines.length,
                    activeEngines: fetchedEngines.filter((e: any) => e.status === "active").length,
                    totalDeployments: fetchedEngines.reduce((sum: number, e: any) => sum + (e.deployment_count || 0), 0),
                });
            }
        } catch (error) {
            console.error("Error fetching engines:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchEngines();
    }, []);

    const handleRefresh = () => fetchEngines(true);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--surface-900)]">AI Engines</h1>
                    <p className="text-[var(--surface-500)] mt-1">Manage and monitor AI model deployments</p>
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
                        onClick={() => setIsEditorOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[var(--primary-foreground)] font-medium transition-all shadow-lg"
                        style={{ background: 'var(--gradient-primary)' }}
                    >
                        <Plus className="w-4 h-4" />
                        Add Engine
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 border border-primary/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/20">
                            <Server className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-500)]">Total Engines</p>
                            <p className="text-2xl font-bold text-[var(--surface-900)]">{stats.totalEngines}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-success/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-success/20">
                            <Cpu className="w-6 h-6 text-success" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-500)]">Active</p>
                            <p className="text-2xl font-bold text-[var(--surface-900)]">{stats.activeEngines}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-info/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-info/20">
                            <HardDrive className="w-6 h-6 text-info" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-500)]">Deployments</p>
                            <p className="text-2xl font-bold text-[var(--surface-900)]">{stats.totalDeployments}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Engines Table */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                        <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin" />
                        <p className="text-[var(--surface-600)]">Loading engines...</p>
                    </div>
                </div>
            ) : (
                <EnginesTable engines={engines} onRefresh={handleRefresh} />
            )}

            <EngineEditor
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                onSuccess={() => {
                    setIsEditorOpen(false);
                    handleRefresh();
                }}
            />
        </div>
    );
}
