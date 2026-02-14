import { createServiceRoleClient } from "@/lib/supabase/server";
import { LogsViewer } from "@/components/logs/LogsViewer";
import { Download, Filter, RefreshCw, AlertTriangle, Info, Bug, CheckCircle } from "lucide-react";

type Log = {
    id: string;
    timestamp: string;
    level: "info" | "warning" | "error" | "debug";
    service: string;
    message: string;
    metadata: Record<string, any>;
};

async function getLogs(): Promise<Log[]> {
    // In production, fetch from logging service
    return [
        {
            id: "1",
            timestamp: "2026-02-10T02:30:00Z",
            level: "info",
            service: "auth",
            message: "User login successful",
            metadata: { userId: "user_123", email: "john@example.com" },
        },
        {
            id: "2",
            timestamp: "2026-02-10T02:29:45Z",
            level: "warning",
            service: "api",
            message: "Rate limit approaching for organization",
            metadata: { orgId: "org_456", usage: "85%" },
        },
        {
            id: "3",
            timestamp: "2026-02-10T02:29:30Z",
            level: "error",
            service: "ai-engine",
            message: "API call failed: Connection timeout",
            metadata: { provider: "openai", model: "gpt-4o", error: "ETIMEDOUT" },
        },
        {
            id: "4",
            timestamp: "2026-02-10T02:29:15Z",
            level: "info",
            service: "billing",
            message: "Subscription renewed successfully",
            metadata: { userId: "user_789", plan: "pro", amount: "$29.00" },
        },
        {
            id: "5",
            timestamp: "2026-02-10T02:29:00Z",
            level: "debug",
            service: "agent",
            message: "Agent response generated",
            metadata: { agentId: "agent_001", tokens: 1234, latency: "1.2s" },
        },
        {
            id: "6",
            timestamp: "2026-02-10T02:28:45Z",
            level: "error",
            service: "webhook",
            message: "Webhook delivery failed",
            metadata: { url: "https://api.example.com/webhook", status: 500 },
        },
        {
            id: "7",
            timestamp: "2026-02-10T02:28:30Z",
            level: "info",
            service: "deployment",
            message: "Engine deployment completed",
            metadata: { engine: "claude-sonnet", environment: "production" },
        },
        {
            id: "8",
            timestamp: "2026-02-10T02:28:15Z",
            level: "warning",
            service: "storage",
            message: "Storage quota at 80%",
            metadata: { used: "8.2GB", total: "10GB" },
        },
    ];
}

async function getLogStats() {
    return {
        total: 15420,
        info: 12340,
        warning: 2100,
        error: 890,
        debug: 90,
    };
}

export default async function LogsPage() {
    const [logs, stats] = await Promise.all([
        getLogs(),
        getLogStats(),
    ]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">System Logs</h1>
                    <p className="text-gray-400 mt-1">Monitor platform activity and debug issues</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 transition-all">
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-white font-medium hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25">
                        <Download className="w-4 h-4" />
                        Export Logs
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-500/20">
                            <Info className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Info</p>
                            <p className="text-xl font-bold text-white">{stats.info.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-500/20">
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Warnings</p>
                            <p className="text-xl font-bold text-white">{stats.warning.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-red-500/20">
                            <Bug className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Errors</p>
                            <p className="text-xl font-bold text-white">{stats.error.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gray-500/20">
                            <CheckCircle className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Debug</p>
                            <p className="text-xl font-bold text-white">{stats.debug.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logs Viewer */}
            <LogsViewer logs={logs} />
        </div>
    );
}
