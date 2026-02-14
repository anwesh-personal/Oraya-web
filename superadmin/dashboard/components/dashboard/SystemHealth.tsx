"use client";

import { Activity, CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";

interface HealthCheck {
    id: string;
    service_name: string;
    status: "healthy" | "degraded" | "down";
    response_time_ms: number | null;
    checked_at: string;
}

interface SystemHealthProps {
    healthChecks: HealthCheck[];
}

const defaultServices = [
    { service_name: "Supabase", status: "healthy", response_time_ms: 45 },
    { service_name: "OpenAI API", status: "healthy", response_time_ms: 120 },
    { service_name: "Anthropic API", status: "healthy", response_time_ms: 89 },
    { service_name: "Vercel", status: "healthy", response_time_ms: 32 },
    { service_name: "Stripe", status: "healthy", response_time_ms: 78 },
];

export function SystemHealth({ healthChecks }: SystemHealthProps) {
    const services = healthChecks.length > 0 ? healthChecks : defaultServices;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "healthy":
                return <CheckCircle className="w-4 h-4 text-emerald-400" />;
            case "degraded":
                return <AlertTriangle className="w-4 h-4 text-amber-400" />;
            case "down":
                return <XCircle className="w-4 h-4 text-rose-400" />;
            default:
                return <Clock className="w-4 h-4 text-surface-500" />;
        }
    };

    const getStatusDot = (status: string) => {
        switch (status) {
            case "healthy":
                return "status-dot-online";
            case "degraded":
                return "status-dot-warning";
            case "down":
                return "status-dot-error";
            default:
                return "status-dot-offline";
        }
    };

    const healthyCount = services.filter((s) => s.status === "healthy").length;
    const healthPercentage = Math.round((healthyCount / services.length) * 100);

    return (
        <div className="card p-5 h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-brand-400" />
                    <h3 className="font-semibold text-surface-900">System Health</h3>
                </div>
                <span className={cn(
                    "badge",
                    healthPercentage === 100 ? "badge-success" : healthPercentage >= 80 ? "badge-warning" : "badge-error"
                )}>
                    {healthPercentage}% Operational
                </span>
            </div>

            <div className="space-y-3">
                {services.map((service, index) => (
                    <div
                        key={service.service_name}
                        className="flex items-center justify-between p-3 bg-surface-100 rounded-xl"
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn("status-dot", getStatusDot(service.status))} />
                            <span className="text-sm font-medium text-surface-800">
                                {service.service_name}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            {service.response_time_ms && (
                                <span className="text-xs text-surface-500">
                                    {service.response_time_ms}ms
                                </span>
                            )}
                            {getStatusIcon(service.status)}
                        </div>
                    </div>
                ))}
            </div>

            <button className="w-full mt-4 py-2 text-sm text-surface-500 hover:text-surface-700 transition-colors">
                View detailed status →
            </button>
        </div>
    );
}
