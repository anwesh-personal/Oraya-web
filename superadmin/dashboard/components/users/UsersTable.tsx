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
    Loader2,
    X,
} from "lucide-react";
import { cn, formatDate, getStatusBadgeClass, truncate } from "@/lib/utils";

interface User {
    id: string;
    email: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    account_status: string;
    email_confirmed: boolean;
    created_at: string;
    last_sign_in_at: string | null;
    license_id: string | null;
    plan_id: string | null;
    license_key: string | null;
    license_status: string | null;
    billing_cycle: string | null;
    ai_calls_used: number;
    tokens_used: number;
    amount_paid: number;
}

interface UsersTableProps {
    users: User[];
    onRefresh: () => void;
}

export function UsersTable({ users, onRefresh }: UsersTableProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [viewUser, setViewUser] = useState<User | null>(null);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [editPlan, setEditPlan] = useState("");
    const [editStatus, setEditStatus] = useState("");

    const filteredUsers = users.filter((user) =>
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.license_key?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getPlanBadge = (plan: string | null) => {
        const classes: Record<string, string> = {
            free: "bg-[var(--surface-200)] text-[var(--surface-600)] border-[var(--surface-300)]",
            pro: "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20",
            team: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
            enterprise: "bg-violet-500/10 text-violet-400 border-violet-500/20",
        };
        return classes[plan || "free"] || classes.free;
    };

    const apiCall = async (method: string, body?: any, params?: string) => {
        const token = localStorage.getItem("oraya-superadmin-token");
        const url = `/api/superadmin/users${params ? `?${params}` : ""}`;
        const res = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            ...(body ? { body: JSON.stringify(body) } : {}),
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Request failed");
        }
        return res.json();
    };

    const handleSuspend = async (user: User) => {
        if (!confirm(`Suspend ${user.email}? Their license will be suspended.`)) return;
        setActionLoading(user.id);
        try {
            await apiCall("PATCH", {
                user_id: user.id,
                updates: { license_status: "suspended" },
            });
            onRefresh();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setActionLoading(null);
            setSelectedUser(null);
        }
    };

    const handleDelete = async (user: User) => {
        if (!confirm(`⚠️ DELETE ${user.email}? This will permanently remove the user, their profile, and all licenses. This cannot be undone.`)) return;
        setActionLoading(user.id);
        try {
            await apiCall("DELETE", undefined, `user_id=${user.id}`);
            onRefresh();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setActionLoading(null);
            setSelectedUser(null);
        }
    };

    const handleEditSave = async () => {
        if (!editUser) return;
        setActionLoading(editUser.id);
        try {
            await apiCall("PATCH", {
                user_id: editUser.id,
                updates: {
                    plan_id: editPlan || undefined,
                    license_status: editStatus || undefined,
                },
            });
            setEditUser(null);
            onRefresh();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRegenKey = async (user: User) => {
        if (!confirm(`Regenerate license key for ${user.email}?`)) return;
        alert("Key regeneration requires manual database update. Feature coming soon.");
        setSelectedUser(null);
    };

    return (
        <>
            <div className="rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] overflow-hidden">
                {/* Search */}
                <div className="p-4 border-b border-[var(--surface-300)]">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--surface-500)]" />
                        <input
                            type="text"
                            placeholder="Search by email, name, or license key..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-sm text-[var(--surface-800)] placeholder:text-[var(--surface-500)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-all"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--surface-300)] bg-[var(--surface-100)]/50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--surface-500)] uppercase tracking-wider">User</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--surface-500)] uppercase tracking-wider">Plan</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--surface-500)] uppercase tracking-wider">License Key</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--surface-500)] uppercase tracking-wider">Status</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--surface-500)] uppercase tracking-wider">Usage</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--surface-500)] uppercase tracking-wider">Created</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--surface-500)] uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="border-b border-[var(--surface-300)] hover:bg-[var(--surface-100)]/50 transition-colors">
                                    {/* User */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                                                <span className="text-xs font-semibold text-white">
                                                    {(user.full_name?.[0] || user.email?.[0] || "U").toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-[var(--surface-800)] block">
                                                    {user.full_name || user.email?.split("@")[0]}
                                                </span>
                                                <span className="text-xs text-[var(--surface-500)]">{user.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    {/* Plan */}
                                    <td className="px-4 py-3">
                                        <span className={cn("badge", getPlanBadge(user.plan_id))}>
                                            {user.plan_id ? user.plan_id.charAt(0).toUpperCase() + user.plan_id.slice(1) : "None"}
                                        </span>
                                    </td>
                                    {/* License Key */}
                                    <td className="px-4 py-3">
                                        <code className="text-xs font-mono text-[var(--surface-600)] bg-[var(--surface-200)] px-2 py-1 rounded">
                                            {user.license_key ? truncate(user.license_key, 16) : "—"}
                                        </code>
                                    </td>
                                    {/* Status */}
                                    <td className="px-4 py-3">
                                        <span className={cn("badge", getStatusBadgeClass(user.license_status || "inactive"))}>
                                            {user.license_status || "no license"}
                                        </span>
                                    </td>
                                    {/* Usage */}
                                    <td className="px-4 py-3">
                                        <div className="text-sm">
                                            <span className="text-[var(--surface-800)]">{user.ai_calls_used?.toLocaleString()}</span>
                                            <span className="text-[var(--surface-500)]"> calls</span>
                                        </div>
                                    </td>
                                    {/* Created */}
                                    <td className="px-4 py-3">
                                        <span className="text-sm text-[var(--surface-600)]">
                                            {formatDate(user.created_at)}
                                        </span>
                                    </td>
                                    {/* Actions */}
                                    <td className="px-4 py-3 text-right">
                                        <div className="relative inline-block">
                                            {actionLoading === user.id ? (
                                                <Loader2 className="w-4 h-4 text-[var(--primary)] animate-spin" />
                                            ) : (
                                                <button
                                                    onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
                                                    className="p-2 rounded-lg hover:bg-[var(--surface-200)] transition-colors"
                                                >
                                                    <MoreHorizontal className="w-4 h-4 text-[var(--surface-500)]" />
                                                </button>
                                            )}

                                            {selectedUser === user.id && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setSelectedUser(null)} />
                                                    <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--surface-50)] border border-[var(--surface-300)] rounded-xl shadow-2xl z-50 py-1">
                                                        <button
                                                            onClick={() => { setViewUser(user); setSelectedUser(null); }}
                                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--surface-700)] hover:bg-[var(--surface-200)] transition-colors"
                                                        >
                                                            <Eye className="w-4 h-4" /> View Details
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditUser(user);
                                                                setEditPlan(user.plan_id || "free");
                                                                setEditStatus(user.license_status || "active");
                                                                setSelectedUser(null);
                                                            }}
                                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--surface-700)] hover:bg-[var(--surface-200)] transition-colors"
                                                        >
                                                            <Edit className="w-4 h-4" /> Edit User
                                                        </button>
                                                        <button
                                                            onClick={() => handleRegenKey(user)}
                                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--surface-700)] hover:bg-[var(--surface-200)] transition-colors"
                                                        >
                                                            <Key className="w-4 h-4" /> Regenerate Key
                                                        </button>
                                                        <div className="my-1 border-t border-[var(--surface-300)]" />
                                                        <button
                                                            onClick={() => handleSuspend(user)}
                                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors"
                                                        >
                                                            <Ban className="w-4 h-4" /> Suspend
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(user)}
                                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" /> Delete
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

                    {filteredUsers.length === 0 && (
                        <div className="py-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-[var(--surface-200)] flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-[var(--surface-400)]" />
                            </div>
                            <p className="text-[var(--surface-500)]">No users found</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--surface-300)] text-sm text-[var(--surface-500)]">
                    Showing {filteredUsers.length} of {users.length} users
                </div>
            </div>

            {/* ── View Details Modal ── */}
            {viewUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewUser(null)} />
                    <div className="relative w-full max-w-lg mx-4 bg-[var(--surface-50)] border border-[var(--surface-300)] rounded-2xl shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[var(--surface-900)]">User Details</h3>
                            <button onClick={() => setViewUser(null)} className="p-2 rounded-lg hover:bg-[var(--surface-200)]"><X className="w-5 h-5 text-[var(--surface-500)]" /></button>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-[var(--surface-500)]">ID</span><code className="text-[var(--surface-700)] text-xs">{viewUser.id}</code></div>
                            <div className="flex justify-between"><span className="text-[var(--surface-500)]">Email</span><span className="text-[var(--surface-900)]">{viewUser.email}</span></div>
                            <div className="flex justify-between"><span className="text-[var(--surface-500)]">Name</span><span className="text-[var(--surface-900)]">{viewUser.full_name || "—"}</span></div>
                            <div className="flex justify-between"><span className="text-[var(--surface-500)]">Username</span><span className="text-[var(--surface-900)]">{viewUser.username || "—"}</span></div>
                            <hr className="border-[var(--surface-300)]" />
                            <div className="flex justify-between"><span className="text-[var(--surface-500)]">Plan</span><span className="text-[var(--surface-900)]">{viewUser.plan_id || "None"}</span></div>
                            <div className="flex justify-between"><span className="text-[var(--surface-500)]">License Key</span><code className="text-xs text-[var(--surface-700)]">{viewUser.license_key || "—"}</code></div>
                            <div className="flex justify-between"><span className="text-[var(--surface-500)]">License Status</span><span className="text-[var(--surface-900)]">{viewUser.license_status || "None"}</span></div>
                            <div className="flex justify-between"><span className="text-[var(--surface-500)]">Billing Cycle</span><span className="text-[var(--surface-900)]">{viewUser.billing_cycle || "—"}</span></div>
                            <hr className="border-[var(--surface-300)]" />
                            <div className="flex justify-between"><span className="text-[var(--surface-500)]">AI Calls Used</span><span className="text-[var(--surface-900)]">{viewUser.ai_calls_used.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span className="text-[var(--surface-500)]">Tokens Used</span><span className="text-[var(--surface-900)]">{viewUser.tokens_used.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span className="text-[var(--surface-500)]">Email Confirmed</span><span className="text-[var(--surface-900)]">{viewUser.email_confirmed ? "Yes" : "No"}</span></div>
                            <div className="flex justify-between"><span className="text-[var(--surface-500)]">Created</span><span className="text-[var(--surface-900)]">{formatDate(viewUser.created_at)}</span></div>
                            <div className="flex justify-between"><span className="text-[var(--surface-500)]">Last Sign In</span><span className="text-[var(--surface-900)]">{viewUser.last_sign_in_at ? formatDate(viewUser.last_sign_in_at) : "Never"}</span></div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit User Modal ── */}
            {editUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditUser(null)} />
                    <div className="relative w-full max-w-md mx-4 bg-[var(--surface-50)] border border-[var(--surface-300)] rounded-2xl shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[var(--surface-900)]">Edit {editUser.email}</h3>
                            <button onClick={() => setEditUser(null)} className="p-2 rounded-lg hover:bg-[var(--surface-200)]"><X className="w-5 h-5 text-[var(--surface-500)]" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">Plan</label>
                                <select
                                    value={editPlan}
                                    onChange={(e) => setEditPlan(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                                >
                                    <option value="free">Free</option>
                                    <option value="pro">Pro</option>
                                    <option value="team">Team</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">License Status</label>
                                <select
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                                >
                                    <option value="active">Active</option>
                                    <option value="suspended">Suspended</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="expired">Expired</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t border-[var(--surface-300)]">
                                <button onClick={() => setEditUser(null)} className="px-5 py-2.5 text-sm font-medium text-[var(--surface-600)]">Cancel</button>
                                <button
                                    onClick={handleEditSave}
                                    disabled={actionLoading === editUser.id}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60"
                                    style={{ background: "var(--gradient-primary)" }}
                                >
                                    {actionLoading === editUser.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}


