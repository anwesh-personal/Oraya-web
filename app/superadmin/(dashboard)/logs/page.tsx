import { createServiceRoleClient } from "@/lib/supabase/server";
import { LogsViewer } from "@/components/superadmin/logs/LogsViewer";
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
                    <h1 className="text-3xl font-bold text-[var(--surface-900)]">System Logs</h1>
                    <p className="text-[var(--surface-500)] mt-1">Monitor platform activity and debug issues</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-700)] hover:bg-[var(--surface-200)] transition-all">
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[var(--primary-foreground)] font-medium transition-all shadow-lg" style={{ background: 'var(--gradient-primary)' }}>
                        <Download className="w-4 h-4" />
                        Export Logs
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)]">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-info/20">
                            <Info className="w-5 h-5 text-info" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-500)]">Info</p>
                            <p className="text-xl font-bold text-[var(--surface-900)]">{stats.info.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)]">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-warning/20">
                            <AlertTriangle className="w-5 h-5 text-warning" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-500)]">Warnings</p>
                            <p className="text-xl font-bold text-[var(--surface-900)]">{stats.warning.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)]">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-error/20">
                            <Bug className="w-5 h-5 text-error" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-500)]">Errors</p>
                            <p className="text-xl font-bold text-[var(--surface-900)]">{stats.error.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)]">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-[var(--surface-200)]">
                            <CheckCircle className="w-5 h-5 text-[var(--surface-500)]" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-500)]">Debug</p>
                            <p className="text-xl font-bold text-[var(--surface-900)]">{stats.debug.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logs Viewer */}
            <LogsViewer logs={logs} />
        </div>
    );
}
