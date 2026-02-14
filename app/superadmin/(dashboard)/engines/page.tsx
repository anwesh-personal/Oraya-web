import { createServiceRoleClient } from "@/lib/supabase/server";
import { EnginesTable } from "@/components/superadmin/engines/EnginesTable";
import { Plus, Download, Server, Cpu, HardDrive, Activity } from "lucide-react";

async function getEngineStats() {
    // Engine deployment stats
    return {
        totalEngines: 12,
        activeEngines: 10,
        totalDeployments: 245,
        avgUptime: 99.7,
    };
}

type Engine = {
    id: string;
    name: string;
    provider: string;
    model: string;
    status: "active" | "maintenance" | "inactive";
    deployments: number;
    avgLatency: number;
    uptime: number;
    lastDeployed: string;
};

async function getEngines(): Promise<Engine[]> {
    // In production, fetch from DB
    return [
        {
            id: "1",
            name: "GPT-4o Engine",
            provider: "openai",
            model: "gpt-4o",
            status: "active",
            deployments: 89,
            avgLatency: 1.2,
            uptime: 99.9,
            lastDeployed: "2026-02-09",
        },
        {
            id: "2",
            name: "Claude Sonnet Engine",
            provider: "anthropic",
            model: "claude-3-sonnet",
            status: "active",
            deployments: 56,
            avgLatency: 1.8,
            uptime: 99.8,
            lastDeployed: "2026-02-08",
        },
        {
            id: "3",
            name: "Gemini Pro Engine",
            provider: "google",
            model: "gemini-1.5-pro",
            status: "active",
            deployments: 34,
            avgLatency: 1.5,
            uptime: 99.5,
            lastDeployed: "2026-02-07",
        },
        {
            id: "4",
            name: "GPT-4o Mini Engine",
            provider: "openai",
            model: "gpt-4o-mini",
            status: "active",
            deployments: 66,
            avgLatency: 0.8,
            uptime: 99.9,
            lastDeployed: "2026-02-09",
        },
    ];
}

export default async function EnginesPage() {
    const [stats, engines] = await Promise.all([
        getEngineStats(),
        getEngines(),
    ]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--surface-900)]">AI Engines</h1>
                    <p className="text-[var(--surface-500)] mt-1">Manage and monitor AI model deployments</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-700)] hover:bg-[var(--surface-200)] transition-all">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[var(--primary-foreground)] font-medium transition-all shadow-lg" style={{ background: 'var(--gradient-primary)' }}>
                        <Plus className="w-4 h-4" />
                        Add Engine
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

                <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-warning/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-warning/20">
                            <Activity className="w-6 h-6 text-warning" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-500)]">Avg Uptime</p>
                            <p className="text-2xl font-bold text-[var(--surface-900)]">{stats.avgUptime}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Engines Table */}
            <EnginesTable engines={engines} />
        </div>
    );
}
