"use client";

import { useState } from "react";
import {
    Search,
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    Key,
    Ban,
    CheckCircle,
    LogIn,
    Loader2,
} from "lucide-react";
import { cn, formatDate, formatCurrency, getStatusBadgeClass, truncate } from "@/lib/utils";
import type { UserLicense } from "@/lib/database.types";
import { toast } from "sonner";

interface UsersTableProps {
    users: UserLicense[];
}

// Mock data for demo
const mockUsers = [
    { id: "1", user_id: "u1", email: "john@example.com", plan_id: "pro", license_key: "ORA-ABC123DEF456", status: "active", billing_cycle: "monthly", created_at: "2025-12-01", ai_calls_used: 850, tokens_used: 125000 },
    { id: "2", user_id: "u2", email: "sarah@techcorp.io", plan_id: "team", license_key: "ORA-GHI789JKL012", status: "active", billing_cycle: "yearly", created_at: "2025-11-15", ai_calls_used: 2340, tokens_used: 456000 },
    { id: "3", user_id: "u3", email: "mike@startup.com", plan_id: "pro", license_key: "ORA-MNO345PQR678", status: "trial", billing_cycle: "trial", created_at: "2026-01-28", ai_calls_used: 120, tokens_used: 23000 },
    { id: "4", user_id: "u4", email: "emma@design.co", plan_id: "free", license_key: "ORA-STU901VWX234", status: "active", billing_cycle: "monthly", created_at: "2026-01-10", ai_calls_used: 45, tokens_used: 8900 },
    { id: "5", user_id: "u5", email: "alex@enterprise.net", plan_id: "enterprise", license_key: "ORA-YZA567BCD890", status: "active", billing_cycle: "yearly", created_at: "2025-10-22", ai_calls_used: 12500, tokens_used: 2340000 },
] as any[];

export function UsersTable({ users }: UsersTableProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [impersonating, setImpersonating] = useState<string | null>(null);

    const handleImpersonate = async (userId: string) => {
        setImpersonating(userId);
        try {
            const res = await fetch("/api/superadmin/impersonate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || "Failed to impersonate user");
                return;
            }
            // Open in new tab so superadmin session stays intact
            window.open(data.url, "_blank");
            setSelectedUser(null);
        } catch (err) {
            toast.error("Failed to impersonate user");
        } finally {
            setImpersonating(null);
        }
    };

    const displayUsers = users.length > 0 ? users : mockUsers;

    const filteredUsers = displayUsers.filter((user) =>
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.license_key?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getPlanBadge = (plan: string) => {
        const classes: Record<string, string> = {
            free: "bg-surface-200 text-surface-600 border-surface-300",
            pro: "bg-brand-500/10 text-brand-400 border-brand-500/20",
            team: "bg-info/10 text-info border-info/20",
            enterprise: "bg-primary/10 text-primary border-primary/20",
        };
        return classes[plan] || classes.free;
    };

    return (
        <div className="card overflow-hidden">
            {/* Search */}
            <div className="p-4 border-b border-surface-300">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                    <input
                        type="text"
                        placeholder="Search by email or license key..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-surface-100 border border-surface-300 rounded-lg text-sm text-surface-800 placeholder:text-surface-500 focus:outline-none focus:border-brand-500 transition-colors"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-surface-300 bg-surface-100/50">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                                User
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                                Plan
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                                License Key
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                                Usage
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                                Created
                            </th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user, index) => (
                            <tr
                                key={user.id}
                                className="border-b border-surface-300 hover:bg-surface-100/50 transition-colors"
                            >
                                {/* User */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
                                            <span className="text-xs font-semibold text-white">
                                                {user.email?.[0]?.toUpperCase() || "U"}
                                            </span>
                                        </div>
                                        <span className="text-sm font-medium text-surface-800">
                                            {user.email || `User ${user.user_id?.slice(0, 8)}`}
                                        </span>
                                    </div>
                                </td>

                                {/* Plan */}
                                <td className="px-4 py-3">
                                    <span className={cn("badge", getPlanBadge(user.plan_id))}>
                                        {user.plan_id?.charAt(0).toUpperCase() + user.plan_id?.slice(1)}
                                    </span>
                                </td>

                                {/* License Key */}
                                <td className="px-4 py-3">
                                    <code className="text-xs font-mono text-surface-600 bg-surface-200 px-2 py-1 rounded">
                                        {truncate(user.license_key || "N/A", 16)}
                                    </code>
                                </td>

                                {/* Status */}
                                <td className="px-4 py-3">
                                    <span className={cn("badge", getStatusBadgeClass(user.status))}>
                                        {user.status}
                                    </span>
                                </td>

                                {/* Usage */}
                                <td className="px-4 py-3">
                                    <div className="text-sm">
                                        <span className="text-surface-800">{user.ai_calls_used?.toLocaleString()}</span>
                                        <span className="text-surface-500"> calls</span>
                                    </div>
                                </td>

                                {/* Created */}
                                <td className="px-4 py-3">
                                    <span className="text-sm text-surface-600">
                                        {formatDate(user.created_at)}
                                    </span>
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-3 text-right">
                                    <div className="relative inline-block">
                                        <button
                                            onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
                                            className="p-2 rounded-lg hover:bg-surface-200 transition-colors"
                                        >
                                            <MoreHorizontal className="w-4 h-4 text-surface-500" />
                                        </button>

                                        {selectedUser === user.id && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-40"
                                                    onClick={() => setSelectedUser(null)}
                                                />
                                                <div className="absolute right-0 top-full mt-1 w-48 bg-surface-100 border border-surface-300 rounded-xl shadow-2xl z-50 py-2">
                                                    <button
                                                        onClick={() => handleImpersonate(user.user_id || user.id)}
                                                        disabled={impersonating === (user.user_id || user.id)}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-primary/10 transition-colors font-medium"
                                                    >
                                                        {impersonating === (user.user_id || user.id) ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <LogIn className="w-4 h-4" />
                                                        )}
                                                        Login as User
                                                    </button>
                                                    <div className="my-1 border-t border-surface-300" />
                                                    <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-surface-700 hover:bg-surface-200 transition-colors">
                                                        <Eye className="w-4 h-4" />
                                                        View Details
                                                    </button>
                                                    <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-surface-700 hover:bg-surface-200 transition-colors">
                                                        <Edit className="w-4 h-4" />
                                                        Edit User
                                                    </button>
                                                    <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-surface-700 hover:bg-surface-200 transition-colors">
                                                        <Key className="w-4 h-4" />
                                                        Regenerate Key
                                                    </button>
                                                    <div className="my-1 border-t border-surface-300" />
                                                    <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-warning hover:bg-warning/10 transition-colors">
                                                        <Ban className="w-4 h-4" />
                                                        Suspend
                                                    </button>
                                                    <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-surface-300 flex items-center justify-between">
                <p className="text-sm text-surface-500">
                    Showing {filteredUsers.length} of {displayUsers.length} users
                </p>
                <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 text-sm text-surface-600 bg-surface-100 border border-surface-300 rounded-lg hover:bg-surface-200 transition-colors disabled:opacity-50" disabled>
                        Previous
                    </button>
                    <button className="px-3 py-1.5 text-sm text-surface-600 bg-surface-100 border border-surface-300 rounded-lg hover:bg-surface-200 transition-colors">
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
