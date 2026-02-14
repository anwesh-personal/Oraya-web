import { createServiceRoleClient } from "@/lib/supabase/server";
import { AgentsGrid } from "@/components/superadmin/agents/AgentsGrid";
import { Plus, Download, Bot, Zap, MessageSquare, Brain } from "lucide-react";

async function getAgentStats() {
    // In a real implementation, this would query agent telemetry
    return {
        totalAgents: 156,
        activeAgents: 89,
        totalConversations: 12450,
        avgResponseTime: 1.2, // seconds
    };
}

async function getAgentTypes() {
    // Agent type distribution
    return [
        { type: "Assistant", count: 78, color: "violet" },
        { type: "Support", count: 34, color: "cyan" },
        { type: "Sales", count: 22, color: "emerald" },
        { type: "Custom", count: 22, color: "amber" },
    ];
}

export default async function AgentsPage() {
    const [stats, agentTypes] = await Promise.all([
        getAgentStats(),
        getAgentTypes(),
    ]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--surface-900)]">Agents</h1>
                    <p className="text-[var(--surface-500)] mt-1">Monitor deployed AI agents across all organizations</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-700)] hover:bg-[var(--surface-200)] transition-all">
                        <Download className="w-4 h-4" />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 border border-primary/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/20">
                            <Bot className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-500)]">Total Agents</p>
                            <p className="text-2xl font-bold text-[var(--surface-900)]">{stats.totalAgents}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-success/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-success/20">
                            <Zap className="w-6 h-6 text-success" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-500)]">Active Now</p>
                            <p className="text-2xl font-bold text-[var(--surface-900)]">{stats.activeAgents}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-info/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-info/20">
                            <MessageSquare className="w-6 h-6 text-info" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-500)]">Total Conversations</p>
                            <p className="text-2xl font-bold text-[var(--surface-900)]">{stats.totalConversations.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-warning/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-warning/20">
                            <Brain className="w-6 h-6 text-warning" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-500)]">Avg Response</p>
                            <p className="text-2xl font-bold text-[var(--surface-900)]">{stats.avgResponseTime}s</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Agent Types Distribution */}
            <div className="p-6 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)]">
                <h2 className="text-lg font-semibold text-[var(--surface-900)] mb-4">Agent Types Distribution</h2>
                <div className="grid grid-cols-4 gap-4">
                    {agentTypes.map((type) => (
                        <div
                            key={type.type}
                            className={`p-4 rounded-xl bg-${type.color}-500/10 border border-${type.color}-500/20`}
                        >
                            <p className="text-[var(--surface-500)] text-sm">{type.type}</p>
                            <p className="text-2xl font-bold text-[var(--surface-900)] mt-1">{type.count}</p>
                            <div className="mt-2 h-1.5 bg-[var(--surface-200)] rounded-full overflow-hidden">
                                <div
                                    className={`h-full bg-${type.color}-500 rounded-full`}
                                    style={{ width: `${(type.count / stats.totalAgents) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Agents Grid */}
            <AgentsGrid />
        </div>
    );
}
