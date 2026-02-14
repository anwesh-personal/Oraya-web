"use client";

import { useState } from "react";
import {
    Search,
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    Users,
    Building2,
    CheckCircle,
    XCircle,
    Clock,
} from "lucide-react";
import { cn, formatDate, formatCurrency, getStatusBadgeClass } from "@/lib/utils";

interface Organization {
    id: string;
    name: string;
    slug: string;
    status: string;
    plan_id: string | null;
    owner: {
        id: string;
        full_name: string;
        email: string;
        avatar_url: string | null;
    } | null;
    _count?: { count: number }[];
    created_at: string;
    mrr?: number;
}

interface OrganizationsTableProps {
    organizations: Organization[];
}

export function OrganizationsTable({ organizations }: OrganizationsTableProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const filteredOrgs = organizations.filter((org) => {
        const matchesSearch =
            org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            org.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
            org.owner?.email?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "all" || org.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "active":
                return <CheckCircle className="w-4 h-4 text-success" />;
            case "suspended":
                return <XCircle className="w-4 h-4 text-error" />;
            case "pending":
                return <Clock className="w-4 h-4 text-warning" />;
            default:
                return null;
        }
    };

    return (
        <div className="rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-200)] overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b border-[var(--surface-200)] flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--surface-400)]" />
                    <input
                        type="text"
                        placeholder="Search organizations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)]/50"
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
                        <option value="suspended">Suspended</option>
                        <option value="pending">Pending</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[var(--surface-200)]">
                            <th className="px-6 py-4 text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">
                                Organization
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">
                                Owner
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">
                                Plan
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">
                                Members
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">
                                Created
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--surface-200)]">
                        {filteredOrgs.map((org) => (
                            <tr
                                key={org.id}
                                className="hover:bg-[var(--surface-100)] transition-colors"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                                            style={{ background: 'var(--gradient-primary)' }}
                                        >
                                            <Building2 className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-[var(--surface-900)]">{org.name}</p>
                                            <p className="text-sm text-[var(--surface-500)]">/{org.slug}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {org.owner ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                                                {org.owner.full_name?.charAt(0) || org.owner.email?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm text-[var(--surface-900)]">{org.owner.full_name || "—"}</p>
                                                <p className="text-xs text-[var(--surface-500)]">{org.owner.email}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-[var(--surface-400)]">No owner</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-xs font-medium",
                                        org.plan_id === "enterprise" && "bg-primary/20 text-primary",
                                        org.plan_id === "pro" && "bg-info/20 text-info",
                                        org.plan_id === "starter" && "bg-[var(--surface-400)]/20 text-[var(--surface-500)]",
                                        !org.plan_id && "bg-[var(--surface-400)]/20 text-[var(--surface-500)]"
                                    )}>
                                        {org.plan_id || "No Plan"}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-[var(--surface-400)]" />
                                        <span className="text-[var(--surface-900)]">{org._count?.[0]?.count || 0}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(org.status)}
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                                            getStatusBadgeClass(org.status)
                                        )}>
                                            {org.status}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-[var(--surface-500)]">
                                    {formatDate(org.created_at)}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end relative">
                                        <button
                                            onClick={() => setOpenDropdown(openDropdown === org.id ? null : org.id)}
                                            className="p-2 rounded-lg hover:bg-[var(--surface-200)] text-[var(--surface-500)] hover:text-[var(--surface-900)] transition-colors"
                                        >
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>

                                        {openDropdown === org.id && (
                                            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[var(--surface-50)] border border-[var(--surface-200)] shadow-xl z-50">
                                                <div className="p-1">
                                                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[var(--surface-600)] hover:bg-[var(--surface-100)] transition-colors">
                                                        <Eye className="w-4 h-4" />
                                                        View Details
                                                    </button>
                                                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[var(--surface-600)] hover:bg-[var(--surface-100)] transition-colors">
                                                        <Edit className="w-4 h-4" />
                                                        Edit
                                                    </button>
                                                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-error hover:bg-error/10 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredOrgs.length === 0 && (
                    <div className="py-12 text-center">
                        <Building2 className="w-12 h-12 text-[var(--surface-400)] mx-auto mb-4" />
                        <p className="text-[var(--surface-500)]">No organizations found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
