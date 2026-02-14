"use client";

import { Clock, User, Settings, Shield, Key, LogIn, LogOut } from "lucide-react";
import { cn, formatRelativeTime, getInitials } from "@/lib/utils";
import type { AuditLog } from "@/lib/database.types";

interface RecentActivityProps {
    logs: AuditLog[];
}

const mockLogs = [
    { id: "1", admin_email: "admin@oraya.ai", action: "user.create", resource_type: "user", created_at: new Date(Date.now() - 5 * 60000).toISOString() },
    { id: "2", admin_email: "support@oraya.ai", action: "license.activate", resource_type: "license", created_at: new Date(Date.now() - 15 * 60000).toISOString() },
    { id: "3", admin_email: "admin@oraya.ai", action: "settings.update", resource_type: "settings", created_at: new Date(Date.now() - 30 * 60000).toISOString() },
    { id: "4", admin_email: "admin@oraya.ai", action: "auth.login", resource_type: "auth", created_at: new Date(Date.now() - 60 * 60000).toISOString() },
    { id: "5", admin_email: "support@oraya.ai", action: "ai_key.create", resource_type: "ai_key", created_at: new Date(Date.now() - 120 * 60000).toISOString() },
];

const getActionIcon = (action: string) => {
    if (action.startsWith("auth.login")) return LogIn;
    if (action.startsWith("auth.logout")) return LogOut;
    if (action.includes("user")) return User;
    if (action.includes("settings")) return Settings;
    if (action.includes("key") || action.includes("license")) return Key;
    if (action.includes("security")) return Shield;
    return Clock;
};

const getActionColor = (action: string) => {
    if (action.includes("create") || action.includes("activate")) return "text-success bg-success/10";
    if (action.includes("delete") || action.includes("revoke")) return "text-error bg-error/10";
    if (action.includes("update")) return "text-warning bg-warning/10";
    return "text-brand-400 bg-brand-500/10";
};

const formatAction = (action: string) => {
    return action
        .split(".")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" → ");
};

export function RecentActivity({ logs }: RecentActivityProps) {
    const activities = logs.length > 0 ? logs : mockLogs;

    return (
        <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-brand-400" />
                    <h3 className="font-semibold text-surface-900">Recent Activity</h3>
                </div>
                <button className="text-sm text-brand-400 hover:text-brand-300 transition-colors">
                    View all
                </button>
            </div>

            <div className="space-y-1">
                {activities.map((log, index) => {
                    const Icon = getActionIcon(log.action);
                    const colorClass = getActionColor(log.action);

                    return (
                        <div
                            key={log.id}
                            className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-100 transition-colors"
                        >
                            {/* Icon */}
                            <div className={cn("p-2 rounded-lg", colorClass)}>
                                <Icon className="w-4 h-4" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-surface-800">
                                    <span className="font-medium">{log.admin_email?.split("@")[0]}</span>
                                    <span className="text-surface-500"> performed </span>
                                    <span className="font-medium">{formatAction(log.action)}</span>
                                </p>
                                <p className="text-xs text-surface-500 mt-0.5">
                                    {log.resource_type && `on ${log.resource_type}`}
                                </p>
                            </div>

                            {/* Time */}
                            <span className="text-xs text-surface-500 whitespace-nowrap">
                                {formatRelativeTime(log.created_at)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
