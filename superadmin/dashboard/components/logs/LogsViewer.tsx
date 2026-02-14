"use client";

import { useState } from "react";
import {
    Search,
    Filter,
    ChevronDown,
    ChevronRight,
    Info,
    AlertTriangle,
    XCircle,
    Bug,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface Log {
    id: string;
    timestamp: string;
    level: "info" | "warning" | "error" | "debug";
    service: string;
    message: string;
    metadata: Record<string, unknown>;
}

interface LogsViewerProps {
    logs: Log[];
}

export function LogsViewer({ logs }: LogsViewerProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [levelFilter, setLevelFilter] = useState<string>("all");
    const [serviceFilter, setServiceFilter] = useState<string>("all");
    const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

    const services = [...new Set(logs.map((log) => log.service))];

    const filteredLogs = logs.filter((log) => {
        const matchesSearch =
            log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.service.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLevel = levelFilter === "all" || log.level === levelFilter;
        const matchesService = serviceFilter === "all" || log.service === serviceFilter;
        return matchesSearch && matchesLevel && matchesService;
    });

    const toggleExpanded = (id: string) => {
        const newExpanded = new Set(expandedLogs);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedLogs(newExpanded);
    };

    const getLevelIcon = (level: Log["level"]) => {
        switch (level) {
            case "info":
                return <Info className="w-4 h-4 text-blue-400" />;
            case "warning":
                return <AlertTriangle className="w-4 h-4 text-amber-400" />;
            case "error":
                return <XCircle className="w-4 h-4 text-red-400" />;
            case "debug":
                return <Bug className="w-4 h-4 text-gray-400" />;
        }
    };

    const getLevelBadge = (level: Log["level"]) => {
        switch (level) {
            case "info":
                return "bg-blue-500/20 text-blue-300";
            case "warning":
                return "bg-amber-500/20 text-amber-300";
            case "error":
                return "bg-red-500/20 text-red-300";
            case "debug":
                return "bg-gray-500/20 text-gray-300";
        }
    };

    return (
        <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b border-white/10 flex items-center gap-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                </div>

                <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                >
                    <option value="all">All Levels</option>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="debug">Debug</option>
                </select>

                <select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                >
                    <option value="all">All Services</option>
                    {services.map((service) => (
                        <option key={service} value={service}>
                            {service}
                        </option>
                    ))}
                </select>
            </div>

            {/* Logs List */}
            <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                {filteredLogs.map((log) => (
                    <div key={log.id} className="hover:bg-white/5 transition-colors">
                        <button
                            onClick={() => toggleExpanded(log.id)}
                            className="w-full px-4 py-3 flex items-center gap-4 text-left"
                        >
                            {expandedLogs.has(log.id) ? (
                                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            )}

                            <span className="text-xs text-gray-500 font-mono w-44 flex-shrink-0">
                                {new Date(log.timestamp).toLocaleString()}
                            </span>

                            <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-medium uppercase w-16 text-center flex-shrink-0",
                                getLevelBadge(log.level)
                            )}>
                                {log.level}
                            </span>

                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/10 text-gray-300 w-24 text-center flex-shrink-0">
                                {log.service}
                            </span>

                            <span className="text-gray-300 text-sm truncate flex-1">
                                {log.message}
                            </span>
                        </button>

                        {expandedLogs.has(log.id) && (
                            <div className="px-4 pb-4 pl-12">
                                <pre className="p-4 rounded-xl bg-gray-900/50 border border-white/5 text-xs text-gray-400 overflow-x-auto">
                                    {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                ))}

                {filteredLogs.length === 0 && (
                    <div className="py-12 text-center">
                        <Info className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No logs found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
