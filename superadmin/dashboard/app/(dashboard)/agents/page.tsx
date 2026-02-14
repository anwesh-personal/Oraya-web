import { createServiceRoleClient } from "@/lib/supabase/server";
import { AgentsGrid } from "@/components/agents/AgentsGrid";
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
                    <h1 className="text-3xl font-bold text-white">Agents</h1>
                    <p className="text-gray-400 mt-1">Monitor deployed AI agents across all organizations</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 transition-all">
                        <Download className="w-4 h-4" />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-violet-500/20">
                            <Bot className="w-6 h-6 text-violet-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Agents</p>
                            <p className="text-2xl font-bold text-white">{stats.totalAgents}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-500/20">
                            <Zap className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Active Now</p>
                            <p className="text-2xl font-bold text-white">{stats.activeAgents}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-cyan-500/20">
                            <MessageSquare className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Conversations</p>
                            <p className="text-2xl font-bold text-white">{stats.totalConversations.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-500/20">
                            <Brain className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Avg Response</p>
                            <p className="text-2xl font-bold text-white">{stats.avgResponseTime}s</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Agent Types Distribution */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h2 className="text-lg font-semibold text-white mb-4">Agent Types Distribution</h2>
                <div className="grid grid-cols-4 gap-4">
                    {agentTypes.map((type) => (
                        <div
                            key={type.type}
                            className={`p-4 rounded-xl bg-${type.color}-500/10 border border-${type.color}-500/20`}
                        >
                            <p className="text-gray-400 text-sm">{type.type}</p>
                            <p className="text-2xl font-bold text-white mt-1">{type.count}</p>
                            <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
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
