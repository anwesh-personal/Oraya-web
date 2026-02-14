import { createServiceRoleClient } from "@/lib/supabase/server";
import { EnginesTable } from "@/components/engines/EnginesTable";
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
                    <h1 className="text-3xl font-bold text-white">AI Engines</h1>
                    <p className="text-gray-400 mt-1">Manage and monitor AI model deployments</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 transition-all">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-white font-medium hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25">
                        <Plus className="w-4 h-4" />
                        Add Engine
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-violet-500/20">
                            <Server className="w-6 h-6 text-violet-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Engines</p>
                            <p className="text-2xl font-bold text-white">{stats.totalEngines}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-500/20">
                            <Cpu className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Active</p>
                            <p className="text-2xl font-bold text-white">{stats.activeEngines}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-cyan-500/20">
                            <HardDrive className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Deployments</p>
                            <p className="text-2xl font-bold text-white">{stats.totalDeployments}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-500/20">
                            <Activity className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Avg Uptime</p>
                            <p className="text-2xl font-bold text-white">{stats.avgUptime}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Engines Table */}
            <EnginesTable engines={engines} />
        </div>
    );
}
