import { createServiceRoleClient } from "@/lib/supabase/server";
import { DeploymentsTable } from "@/components/deployments/DeploymentsTable";
import { Plus, Download, Rocket, CheckCircle, Clock, AlertTriangle } from "lucide-react";

async function getDeploymentStats() {
    return {
        total: 245,
        active: 212,
        pending: 18,
        failed: 15,
    };
}

type Deployment = {
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
};

async function getDeployments(): Promise<Deployment[]> {
    // In production, fetch from DB
    return [
        {
            id: "1",
            name: "Production - Acme Corp",
            organization: "Acme Corp",
            engine: "GPT-4o Engine",
            environment: "production",
            status: "active",
            version: "2.1.0",
            deployedAt: "2026-02-09T14:30:00Z",
            deployedBy: "admin@acme.com",
        },
        {
            id: "2",
            name: "Staging - TechStart",
            organization: "TechStart Inc",
            engine: "Claude Sonnet Engine",
            environment: "staging",
            status: "active",
            version: "2.0.5",
            deployedAt: "2026-02-08T10:15:00Z",
            deployedBy: "dev@techstart.io",
        },
        {
            id: "3",
            name: "Production - DataFlow",
            organization: "DataFlow",
            engine: "Gemini Pro Engine",
            environment: "production",
            status: "pending",
            version: "2.1.1",
            deployedAt: "2026-02-09T16:00:00Z",
            deployedBy: "ops@dataflow.com",
        },
        {
            id: "4",
            name: "Development - StartupXYZ",
            organization: "StartupXYZ",
            engine: "GPT-4o Mini Engine",
            environment: "development",
            status: "failed",
            version: "2.0.0",
            deployedAt: "2026-02-07T09:00:00Z",
            deployedBy: "dev@startupxyz.io",
            error: "Connection timeout to AI provider",
        },
    ];
}

export default async function DeploymentsPage() {
    const [stats, deployments] = await Promise.all([
        getDeploymentStats(),
        getDeployments(),
    ]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Deployments</h1>
                    <p className="text-gray-400 mt-1">Monitor and manage engine deployments across organizations</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 transition-all">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-white font-medium hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25">
                        <Plus className="w-4 h-4" />
                        New Deployment
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-violet-500/20">
                            <Rocket className="w-6 h-6 text-violet-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Deployments</p>
                            <p className="text-2xl font-bold text-white">{stats.total}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-500/20">
                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Active</p>
                            <p className="text-2xl font-bold text-white">{stats.active}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-500/20">
                            <Clock className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Pending</p>
                            <p className="text-2xl font-bold text-white">{stats.pending}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-red-500/20">
                            <AlertTriangle className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Failed</p>
                            <p className="text-2xl font-bold text-white">{stats.failed}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <DeploymentsTable deployments={deployments} />
        </div>
    );
}
