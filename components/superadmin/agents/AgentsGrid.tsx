"use client";

import { useState } from "react";
import {
    Search,
    Filter,
    Bot,
    MessageSquare,
    Clock,
    Activity,
    MoreHorizontal,
    Eye,
    Pause,
    Trash2,
    CheckCircle,
    AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Agent {
    id: string;
    name: string;
    type: string;
    organization: string;
    status: "active" | "idle" | "error" | "paused";
    conversations: number;
    avgResponseTime: number;
    lastActive: string;
    model: string;
}

// Mock data - in production this comes from API
const mockAgents: Agent[] = [
    {
        id: "1",
        name: "Customer Support Bot",
        type: "Support",
        organization: "Acme Corp",
        status: "active",
        conversations: 1234,
        avgResponseTime: 0.8,
        lastActive: "2 min ago",
        model: "gpt-4o",
    },
    {
        id: "2",
        name: "Sales Assistant",
        type: "Sales",
        organization: "TechStart Inc",
        status: "active",
        conversations: 567,
        avgResponseTime: 1.2,
        lastActive: "5 min ago",
        model: "claude-3-sonnet",
    },
    {
        id: "3",
        name: "Knowledge Base Bot",
        type: "Assistant",
        organization: "DataFlow",
        status: "idle",
        conversations: 890,
        avgResponseTime: 1.5,
        lastActive: "1 hour ago",
        model: "gpt-4o-mini",
    },
    {
        id: "4",
        name: "Onboarding Guide",
        type: "Assistant",
        organization: "StartupXYZ",
        status: "error",
        conversations: 234,
        avgResponseTime: 2.1,
        lastActive: "3 hours ago",
        model: "gpt-4o",
    },
    {
        id: "5",
        name: "Code Review Bot",
        type: "Custom",
        organization: "DevTeam Pro",
        status: "paused",
        conversations: 456,
        avgResponseTime: 3.2,
        lastActive: "1 day ago",
        model: "claude-3-opus",
    },
];

export function AgentsGrid() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const filteredAgents = mockAgents.filter((agent) => {
        const matchesSearch =
            agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            agent.organization.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || agent.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: Agent["status"]) => {
        switch (status) {
            case "active":
                return "bg-success";
            case "idle":
                return "bg-warning";
            case "error":
                return "bg-error";
            case "paused":
                return "bg-[var(--surface-400)]";
        }
    };

    const getStatusBadge = (status: Agent["status"]) => {
        switch (status) {
            case "active":
                return "bg-success/20 text-success border-success/30";
            case "idle":
                return "bg-warning/20 text-warning border-warning/30";
            case "error":
                return "bg-error/20 text-error border-error/30";
            case "paused":
                return "bg-[var(--surface-400)]/20 text-[var(--surface-500)] border-[var(--surface-400)]/30";
        }
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--surface-400)]" />
                    <input
                        type="text"
                        placeholder="Search agents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="idle">Idle</option>
                        <option value="error">Error</option>
                        <option value="paused">Paused</option>
                    </select>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAgents.map((agent) => (
                    <div
                        key={agent.id}
                        className="p-6 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-200)] hover:border-[var(--primary)]/30 transition-all group"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{ background: 'var(--gradient-primary)' }}
                                    >
                                        <Bot className="w-6 h-6 text-white" />
                                    </div>
                                    <div
                                        className={cn(
                                            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[var(--surface-50)]",
                                            getStatusColor(agent.status)
                                        )}
                                    />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[var(--surface-900)]">{agent.name}</h3>
                                    <p className="text-sm text-[var(--surface-500)]">{agent.organization}</p>
                                </div>
                            </div>

                            <div className="relative">
                                <button
                                    onClick={() => setOpenDropdown(openDropdown === agent.id ? null : agent.id)}
                                    className="p-2 rounded-lg hover:bg-[var(--surface-200)] text-[var(--surface-500)] hover:text-[var(--surface-900)] transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>

                                {openDropdown === agent.id && (
                                    <div className="absolute right-0 top-full mt-2 w-40 rounded-xl bg-[var(--surface-50)] border border-[var(--surface-200)] shadow-xl z-50">
                                        <div className="p-1">
                                            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--surface-600)] hover:bg-[var(--surface-100)] text-sm">
                                                <Eye className="w-4 h-4" />
                                                View Details
                                            </button>
                                            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--surface-600)] hover:bg-[var(--surface-100)] text-sm">
                                                <Pause className="w-4 h-4" />
                                                Pause Agent
                                            </button>
                                            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-error hover:bg-error/10 text-sm">
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-2 mb-4">
                            <span className={cn(
                                "px-2.5 py-1 rounded-full text-xs font-medium border",
                                getStatusBadge(agent.status)
                            )}>
                                {agent.status}
                            </span>
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--surface-200)] text-[var(--surface-600)]">
                                {agent.type}
                            </span>
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                                {agent.model}
                            </span>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--surface-200)]">
                            <div>
                                <div className="flex items-center gap-1.5 text-[var(--surface-500)] mb-1">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span className="text-xs">Chats</span>
                                </div>
                                <p className="text-lg font-semibold text-[var(--surface-900)]">{agent.conversations}</p>
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 text-[var(--surface-500)] mb-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span className="text-xs">Avg Time</span>
                                </div>
                                <p className="text-lg font-semibold text-[var(--surface-900)]">{agent.avgResponseTime}s</p>
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 text-[var(--surface-500)] mb-1">
                                    <Activity className="w-3.5 h-3.5" />
                                    <span className="text-xs">Last Active</span>
                                </div>
                                <p className="text-sm font-medium text-[var(--surface-900)]">{agent.lastActive}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredAgents.length === 0 && (
                <div className="py-12 text-center">
                    <Bot className="w-12 h-12 text-[var(--surface-400)] mx-auto mb-4" />
                    <p className="text-[var(--surface-500)]">No agents found</p>
                </div>
            )}
        </div>
    );
}
