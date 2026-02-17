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
    X,
    Lock,
    Mail,
    Copy,
    Check,
    RefreshCw,
} from "lucide-react";
import { cn, formatDate, getStatusBadgeClass, truncate, copyToClipboard } from "@/lib/utils";
import { toast } from "sonner";
import { usePlans } from "@/hooks/usePlans";
import { Building2, AlertTriangle } from "lucide-react";

interface UsersTableProps {
    users: any[];
    onRefresh?: () => void;
}

export function UsersTable({ users, onRefresh }: UsersTableProps) {
    const { plans, loading: plansLoading } = usePlans({ activeOnly: true });
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [impersonating, setImpersonating] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Modals
    const [viewUser, setViewUser] = useState<any | null>(null);
    const [editUser, setEditUser] = useState<any | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<any | null>(null);
    const [resetPasswordUser, setResetPasswordUser] = useState<any | null>(null);

    // Edit form state
    const [editPlan, setEditPlan] = useState("");
    const [editStatus, setEditStatus] = useState("");

    // Password reset state
    const [resetMode, setResetMode] = useState<"set" | "email">("set");
    const [newPassword, setNewPassword] = useState("");
    const [sendEmail, setSendEmail] = useState(true);
    const [copied, setCopied] = useState(false);

    // ORA Key regeneration state
    const [regenerateKeyUser, setRegenerateKeyUser] = useState<any | null>(null);
    const [regeneratedKey, setRegeneratedKey] = useState<string | null>(null);
    const [copiedOraKey, setCopiedOraKey] = useState(false);

    const filteredUsers = users.filter((user) =>
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.ora_key?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.license_key?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
            window.open(data.url, "_blank");
            setSelectedUser(null);
        } catch {
            toast.error("Failed to impersonate user");
        } finally {
            setImpersonating(null);
        }
    };

    const handleEdit = (user: any) => {
        setEditUser(user);
        setEditPlan(user.plan_id || "free");
        setEditStatus(user.license_status || "active");
        setSelectedUser(null);
    };

    const handleSaveEdit = async () => {
        if (!editUser) return;
        setActionLoading("edit");
        try {
            const res = await fetch("/api/superadmin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: editUser.id,
                    updates: { plan_id: editPlan, license_status: editStatus },
                }),
            });
            if (res.ok) {
                toast.success("User updated successfully");
                setEditUser(null);
                onRefresh?.();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to update user");
            }
        } catch {
            toast.error("Failed to update user");
        } finally {
            setActionLoading(null);
        }
    };

    const handleSuspend = async (user: any) => {
        setActionLoading(user.id);
        const isSuspended = user.account_status === "suspended" || user.license_status === "suspended";
        try {
            const res = await fetch("/api/superadmin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: user.id,
                    updates: { license_status: isSuspended ? "active" : "suspended" },
                }),
            });
            if (res.ok) {
                toast.success(isSuspended ? "User unsuspended" : "User suspended");
                onRefresh?.();
            } else {
                toast.error("Failed to update user status");
            }
        } catch {
            toast.error("Failed to update user status");
        } finally {
            setActionLoading(null);
            setSelectedUser(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        setActionLoading("delete");
        try {
            const res = await fetch(`/api/superadmin/users?user_id=${deleteConfirm.id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                toast.success("User deleted successfully");
                setDeleteConfirm(null);
                onRefresh?.();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to delete user");
            }
        } catch {
            toast.error("Failed to delete user");
        } finally {
            setActionLoading(null);
        }
    };

    // ── Password Reset Handlers ──
    const openResetPassword = (user: any) => {
        setResetPasswordUser(user);
        setResetMode("set");
        setNewPassword("");
        setSendEmail(true);
        setCopied(false);
        setSelectedUser(null);
    };

    const generateRandomPassword = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
        let pwd = "";
        for (let i = 0; i < 16; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
        setNewPassword(pwd);
    };

    const handleSetPassword = async () => {
        if (!resetPasswordUser || !newPassword) return;
        setActionLoading("reset-pwd");
        try {
            const res = await fetch("/api/superadmin/users/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: resetPasswordUser.id,
                    new_password: newPassword,
                    send_email: sendEmail,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(sendEmail ? "Password set & email sent" : "Password set successfully");
                setResetPasswordUser(null);
            } else {
                toast.error(data.error || "Failed to set password");
            }
        } catch {
            toast.error("Failed to set password");
        } finally {
            setActionLoading(null);
        }
    };

    const handleSendResetEmail = async () => {
        if (!resetPasswordUser) return;
        setActionLoading("reset-email");
        try {
            const res = await fetch("/api/superadmin/users/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: resetPasswordUser.id,
                    send_reset_link: true,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Reset password email sent");
                setResetPasswordUser(null);
            } else {
                toast.error(data.error || "Failed to send reset email");
            }
        } catch {
            toast.error("Failed to send reset email");
        } finally {
            setActionLoading(null);
        }
    };

    const handleCopyPassword = async () => {
        const ok = await copyToClipboard(newPassword);
        if (ok) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // ── ORA Key Regeneration ──
    const handleRegenerateKey = async () => {
        if (!regenerateKeyUser) return;
        setActionLoading("regenerate-key");
        try {
            const res = await fetch("/api/superadmin/users/regenerate-key", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: regenerateKeyUser.id }),
            });
            const data = await res.json();
            if (res.ok) {
                setRegeneratedKey(data.ora_key);
                toast.success(data.message || "ORA Key regenerated");
                onRefresh?.();
            } else {
                toast.error(data.error || "Failed to regenerate key");
            }
        } catch {
            toast.error("Failed to regenerate key");
        } finally {
            setActionLoading(null);
        }
    };

    const handleCopyOraKey = async (key: string) => {
        const ok = await copyToClipboard(key);
        if (ok) {
            setCopiedOraKey(true);
            setTimeout(() => setCopiedOraKey(false), 2000);
        }
    };

    const getPlanBadge = (plan: string) => {
        // Dynamic color assignment based on plan index for non-default plans
        const defaultColors: Record<string, string> = {
            free: "bg-[var(--surface-200)] text-[var(--surface-600)]",
        };
        const tierColors = [
            "bg-blue-500/15 text-blue-400",
            "bg-cyan-500/15 text-cyan-400",
            "bg-purple-500/15 text-purple-400",
            "bg-amber-500/15 text-amber-400",
            "bg-emerald-500/15 text-emerald-400",
            "bg-rose-500/15 text-rose-400",
        ];
        if (defaultColors[plan]) return defaultColors[plan];
        const idx = plans.findIndex((p) => p.id === plan);
        return idx >= 0 ? tierColors[idx % tierColors.length] : "bg-[var(--surface-200)] text-[var(--surface-600)]";
    };

    const isSuspended = (user: any) =>
        user.account_status === "suspended" || user.license_status === "suspended";

    return (
        <>
            <div className="rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-200)] overflow-hidden">
                {/* Search */}
                <div className="p-3 sm:p-4 border-b border-[var(--surface-200)]">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--surface-400)]" />
                        <input
                            type="text"
                            placeholder="Search by email, name, or ORA key..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-sm text-[var(--surface-800)] placeholder:text-[var(--surface-500)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-colors"
                        />
                    </div>
                </div>

                {/* ── Desktop Table ── */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--surface-200)] bg-[var(--surface-100)]/50">
                                <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--surface-500)] uppercase tracking-wider">User</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--surface-500)] uppercase tracking-wider">Plan</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--surface-500)] uppercase tracking-wider">ORA Key</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--surface-500)] uppercase tracking-wider">Status</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--surface-500)] uppercase tracking-wider">Usage</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--surface-500)] uppercase tracking-wider">Created</th>
                                <th className="text-right px-5 py-3 text-xs font-semibold text-[var(--surface-500)] uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--surface-200)]">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-[var(--surface-100)]/50 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
                                                <span className="text-xs font-semibold text-white">
                                                    {(user.full_name || user.email)?.[0]?.toUpperCase() || "U"}
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-[var(--surface-900)] truncate">
                                                    {user.full_name || user.email || `User ${user.id?.slice(0, 8)}`}
                                                </p>
                                                {user.full_name && (
                                                    <p className="text-xs text-[var(--surface-500)] truncate">{user.email}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={cn("px-2.5 py-1 rounded-lg text-xs font-medium", getPlanBadge(user.plan_id || "free"))}>
                                            {(user.plan_id || "free").charAt(0).toUpperCase() + (user.plan_id || "free").slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        {user.ora_key ? (
                                            <div className="flex items-center gap-1.5">
                                                <code className="text-xs font-mono text-[var(--primary)] bg-[var(--primary)]/10 px-2.5 py-1 rounded-lg font-semibold tracking-wide">
                                                    {user.ora_key}
                                                </code>
                                                <button
                                                    onClick={() => handleCopyOraKey(user.ora_key)}
                                                    title="Copy ORA Key"
                                                    className="p-1 rounded hover:bg-[var(--surface-200)] text-[var(--surface-500)] transition-colors"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-[var(--surface-400)]">—</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={cn("px-2.5 py-1 rounded-lg text-xs font-medium capitalize", getStatusBadgeClass(user.license_status || user.account_status || "active"))}>
                                            {user.license_status || user.account_status || "active"}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="text-sm text-[var(--surface-800)]">{(user.ai_calls_used || 0).toLocaleString()}</span>
                                        <span className="text-xs text-[var(--surface-500)]"> calls</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="text-sm text-[var(--surface-600)]">{formatDate(user.created_at)}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-end gap-1">
                                            {/* Quick action buttons (always visible) */}
                                            <button
                                                onClick={() => { setViewUser(user); }}
                                                title="View details"
                                                className="p-2 rounded-lg hover:bg-[var(--surface-200)] text-[var(--surface-500)] hover:text-[var(--surface-800)] transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(user)}
                                                title="Edit user"
                                                className="p-2 rounded-lg hover:bg-[var(--surface-200)] text-[var(--surface-500)] hover:text-[var(--surface-800)] transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => openResetPassword(user)}
                                                title="Reset password"
                                                className="p-2 rounded-lg hover:bg-[var(--surface-200)] text-[var(--surface-500)] hover:text-[var(--surface-800)] transition-colors"
                                            >
                                                <Lock className="w-4 h-4" />
                                            </button>

                                            {/* More menu */}
                                            <div className="relative">
                                                <button
                                                    onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
                                                    className="p-2 rounded-lg hover:bg-[var(--surface-200)] text-[var(--surface-500)] hover:text-[var(--surface-800)] transition-colors"
                                                >
                                                    {actionLoading === user.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    )}
                                                </button>
                                                {selectedUser === user.id && (
                                                    <>
                                                        <div className="fixed inset-0 z-40" onClick={() => setSelectedUser(null)} />
                                                        <div className="absolute right-0 top-full mt-1 w-52 bg-[var(--surface-50)] border border-[var(--surface-200)] rounded-xl shadow-2xl z-50 py-1.5">
                                                            <button
                                                                onClick={() => handleImpersonate(user.id)}
                                                                disabled={impersonating === user.id}
                                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors font-medium"
                                                            >
                                                                {impersonating === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                                                                Login as User
                                                            </button>
                                                            <div className="my-1 mx-2 border-t border-[var(--surface-200)]" />
                                                            <button
                                                                onClick={() => { setRegenerateKeyUser(user); setRegeneratedKey(null); setSelectedUser(null); }}
                                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--surface-700)] hover:bg-[var(--surface-200)] transition-colors"
                                                            >
                                                                <RefreshCw className="w-4 h-4" />
                                                                Regenerate ORA Key
                                                            </button>
                                                            <div className="my-1 mx-2 border-t border-[var(--surface-200)]" />
                                                            <button
                                                                onClick={() => handleSuspend(user)}
                                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-amber-500 hover:bg-amber-500/10 transition-colors"
                                                            >
                                                                {isSuspended(user) ? <><CheckCircle className="w-4 h-4" /> Unsuspend</> : <><Ban className="w-4 h-4" /> Suspend</>}
                                                            </button>
                                                            <button
                                                                onClick={() => { setDeleteConfirm(user); setSelectedUser(null); }}
                                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredUsers.length === 0 && (
                        <div className="py-16 text-center text-[var(--surface-500)]">No users found</div>
                    )}
                </div>

                {/* ── Mobile/Tablet Card View ── */}
                <div className="lg:hidden divide-y divide-[var(--surface-200)]">
                    {filteredUsers.map((user) => (
                        <div key={user.id} className="p-4 space-y-3">
                            {/* Top row: avatar + info + actions */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
                                        <span className="text-sm font-semibold text-white">
                                            {(user.full_name || user.email)?.[0]?.toUpperCase() || "U"}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-[var(--surface-900)] truncate">
                                            {user.full_name || user.email}
                                        </p>
                                        {user.full_name && (
                                            <p className="text-xs text-[var(--surface-500)] truncate">{user.email}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => setViewUser(user)}
                                        className="p-2 rounded-lg hover:bg-[var(--surface-200)] text-[var(--surface-500)]"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="p-2 rounded-lg hover:bg-[var(--surface-200)] text-[var(--surface-500)]"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => openResetPassword(user)}
                                        className="p-2 rounded-lg hover:bg-[var(--surface-200)] text-[var(--surface-500)]"
                                    >
                                        <Lock className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => { setDeleteConfirm(user); }}
                                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-500"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Meta row */}
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={cn("px-2.5 py-1 rounded-lg text-xs font-medium", getPlanBadge(user.plan_id || "free"))}>
                                    {(user.plan_id || "free").charAt(0).toUpperCase() + (user.plan_id || "free").slice(1)}
                                </span>
                                <span className={cn("px-2.5 py-1 rounded-lg text-xs font-medium capitalize", getStatusBadgeClass(user.license_status || user.account_status || "active"))}>
                                    {user.license_status || user.account_status || "active"}
                                </span>
                                <span className="text-xs text-[var(--surface-500)]">
                                    {(user.ai_calls_used || 0).toLocaleString()} calls
                                </span>
                                <span className="text-xs text-[var(--surface-500)]">
                                    {formatDate(user.created_at)}
                                </span>
                            </div>
                        </div>
                    ))}
                    {filteredUsers.length === 0 && (
                        <div className="py-16 text-center text-[var(--surface-500)]">No users found</div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 sm:p-4 border-t border-[var(--surface-200)]">
                    <p className="text-sm text-[var(--surface-500)]">
                        Showing {filteredUsers.length} of {users.length} users
                    </p>
                </div>
            </div>

            {/* ────── VIEW DETAILS MODAL ────── */}
            {viewUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[var(--surface-50)] rounded-2xl border border-[var(--surface-200)] shadow-2xl w-full max-w-lg overflow-y-auto max-h-[85vh]">
                        <div className="flex items-center justify-between p-5 border-b border-[var(--surface-200)] sticky top-0 bg-[var(--surface-50)] z-10">
                            <h3 className="text-lg font-semibold text-[var(--surface-900)]">User Details</h3>
                            <button onClick={() => setViewUser(null)} className="p-2 rounded-lg hover:bg-[var(--surface-200)]"><X className="w-5 h-5 text-[var(--surface-500)]" /></button>
                        </div>
                        <div className="p-5 space-y-5">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
                                    <span className="text-xl font-bold text-white">{(viewUser.full_name || viewUser.email)?.[0]?.toUpperCase()}</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-lg font-semibold text-[var(--surface-900)] truncate">{viewUser.full_name || "No name"}</p>
                                    <p className="text-sm text-[var(--surface-500)] truncate">{viewUser.email}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    ["Plan", viewUser.plan_id || "None"],
                                    ["Status", viewUser.license_status || viewUser.account_status || "active"],
                                    ["AI Calls", (viewUser.ai_calls_used || 0).toLocaleString()],
                                    ["Tokens Used", (viewUser.tokens_used || 0).toLocaleString()],
                                    ["Billing", viewUser.billing_cycle || "N/A"],
                                    ["Created", formatDate(viewUser.created_at)],
                                ].map(([label, value]) => (
                                    <div key={label}>
                                        <p className="text-xs text-[var(--surface-500)] uppercase tracking-wider">{label}</p>
                                        <p className="text-sm font-medium text-[var(--surface-800)] mt-1 capitalize">{value}</p>
                                    </div>
                                ))}
                            </div>
                            {viewUser.ora_key && (
                                <div className="rounded-xl border-2 border-[var(--primary)]/20 bg-[var(--primary)]/5 p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Key className="w-4 h-4 text-[var(--primary)]" />
                                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">ORA Key</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 text-sm font-mono font-bold text-[var(--surface-900)] tracking-wider">{viewUser.ora_key}</code>
                                        <button
                                            onClick={() => handleCopyOraKey(viewUser.ora_key)}
                                            className="p-2 rounded-lg hover:bg-[var(--surface-200)] text-[var(--surface-500)] transition-colors"
                                        >
                                            {copiedOraKey ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            )}
                            {viewUser.license_key && (
                                <div>
                                    <p className="text-xs text-[var(--surface-500)] uppercase tracking-wider">Legacy License Key</p>
                                    <code className="text-xs font-mono text-[var(--surface-500)] bg-[var(--surface-200)] px-3 py-2 rounded-lg block mt-1 break-all">{viewUser.license_key}</code>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ────── EDIT MODAL ────── */}
            {editUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[var(--surface-50)] rounded-2xl border border-[var(--surface-200)] shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b border-[var(--surface-200)]">
                            <h3 className="text-lg font-semibold text-[var(--surface-900)]">Edit User</h3>
                            <button onClick={() => setEditUser(null)} className="p-2 rounded-lg hover:bg-[var(--surface-200)]"><X className="w-5 h-5 text-[var(--surface-500)]" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">Plan</label>
                                <select
                                    value={editPlan}
                                    onChange={e => setEditPlan(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]"
                                    disabled={plansLoading}
                                >
                                    {plansLoading ? (
                                        <option disabled>Loading plans...</option>
                                    ) : (
                                        plans.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}{p.requires_organization ? " (Org Required)" : ""}
                                            </option>
                                        ))
                                    )}
                                </select>
                                {/* Org-required warning */}
                                {(() => {
                                    const selectedPlan = plans.find(p => p.id === editPlan);
                                    if (selectedPlan?.requires_organization) {
                                        return (
                                            <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                                <Building2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                                <p className="text-xs text-blue-400">
                                                    The <strong>{selectedPlan.name}</strong> plan requires organization membership.
                                                    If this user is not in an organization, the save will be rejected.
                                                    Add the user to an organization first from the Organizations tab.
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">License Status</label>
                                <select
                                    value={editStatus}
                                    onChange={e => setEditStatus(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]"
                                >
                                    <option value="active">Active</option>
                                    <option value="trial">Trial</option>
                                    <option value="suspended">Suspended</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="expired">Expired</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setEditUser(null)} className="flex-1 py-2.5 rounded-xl border border-[var(--surface-300)] text-[var(--surface-700)] hover:bg-[var(--surface-200)] transition-colors font-medium">Cancel</button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={actionLoading === "edit"}
                                    className="flex-1 py-2.5 rounded-xl text-white font-medium transition-all disabled:opacity-50"
                                    style={{ background: 'var(--gradient-primary)' }}
                                >
                                    {actionLoading === "edit" ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ────── RESET PASSWORD MODAL ────── */}
            {resetPasswordUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[var(--surface-50)] rounded-2xl border border-[var(--surface-200)] shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b border-[var(--surface-200)]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-amber-500/15">
                                    <Lock className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-[var(--surface-900)]">Reset Password</h3>
                                    <p className="text-xs text-[var(--surface-500)]">{resetPasswordUser.email}</p>
                                </div>
                            </div>
                            <button onClick={() => setResetPasswordUser(null)} className="p-2 rounded-lg hover:bg-[var(--surface-200)]"><X className="w-5 h-5 text-[var(--surface-500)]" /></button>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Mode tabs */}
                            <div className="flex rounded-xl bg-[var(--surface-100)] p-1 gap-1">
                                <button
                                    onClick={() => setResetMode("set")}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                                        resetMode === "set"
                                            ? "bg-[var(--surface-50)] text-[var(--surface-900)] shadow-sm"
                                            : "text-[var(--surface-500)] hover:text-[var(--surface-700)]"
                                    )}
                                >
                                    <Lock className="w-4 h-4" />
                                    Set Password
                                </button>
                                <button
                                    onClick={() => setResetMode("email")}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                                        resetMode === "email"
                                            ? "bg-[var(--surface-50)] text-[var(--surface-900)] shadow-sm"
                                            : "text-[var(--surface-500)] hover:text-[var(--surface-700)]"
                                    )}
                                >
                                    <Mail className="w-4 h-4" />
                                    Send Reset Email
                                </button>
                            </div>

                            {resetMode === "set" ? (
                                <>
                                    {/* Manual password set */}
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">New Password</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    type="text"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    placeholder="Enter new password"
                                                    className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] font-mono text-sm placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] pr-10"
                                                />
                                                {newPassword && (
                                                    <button
                                                        onClick={handleCopyPassword}
                                                        title="Copy password"
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-[var(--surface-200)] text-[var(--surface-500)]"
                                                    >
                                                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                    </button>
                                                )}
                                            </div>
                                            <button
                                                onClick={generateRandomPassword}
                                                type="button"
                                                className="px-3 py-2.5 rounded-xl border border-[var(--surface-300)] bg-[var(--surface-100)] text-xs font-medium text-[var(--surface-700)] hover:bg-[var(--surface-200)] transition-colors whitespace-nowrap"
                                            >
                                                Generate
                                            </button>
                                        </div>
                                    </div>

                                    {/* Send credential email */}
                                    <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-200)] cursor-pointer hover:bg-[var(--surface-200)]/50 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={sendEmail}
                                            onChange={(e) => setSendEmail(e.target.checked)}
                                            className="w-4 h-4 rounded accent-[var(--primary)]"
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-[var(--surface-800)]">Send password via email</p>
                                            <p className="text-xs text-[var(--surface-500)]">Email the new password to {resetPasswordUser.email}</p>
                                        </div>
                                    </label>

                                    <button
                                        onClick={handleSetPassword}
                                        disabled={!newPassword || actionLoading === "reset-pwd"}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-medium transition-all disabled:opacity-50"
                                        style={{ background: 'var(--gradient-primary)' }}
                                    >
                                        {actionLoading === "reset-pwd" ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Setting Password...</>
                                        ) : (
                                            <><Lock className="w-4 h-4" /> Set Password</>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <>
                                    {/* Send reset link via email */}
                                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                        <div className="flex items-start gap-3">
                                            <Mail className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-[var(--surface-900)]">Send Password Reset Link</p>
                                                <p className="text-xs text-[var(--surface-600)] mt-1">
                                                    This will send a password reset email to <strong>{resetPasswordUser.email}</strong> via Supabase Auth.
                                                    The user will be able to choose their own new password.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSendResetEmail}
                                        disabled={actionLoading === "reset-email"}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-medium transition-all disabled:opacity-50"
                                        style={{ background: 'var(--gradient-primary)' }}
                                    >
                                        {actionLoading === "reset-email" ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                                        ) : (
                                            <><Mail className="w-4 h-4" /> Send Reset Email</>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ────── DELETE CONFIRMATION ────── */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[var(--surface-50)] rounded-2xl border border-[var(--surface-200)] shadow-2xl w-full max-w-md">
                        <div className="p-5">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 rounded-full bg-red-500/15"><Trash2 className="w-6 h-6 text-red-500" /></div>
                                <div>
                                    <h3 className="text-lg font-semibold text-[var(--surface-900)]">Delete User</h3>
                                    <p className="text-sm text-[var(--surface-500)]">This action cannot be undone.</p>
                                </div>
                            </div>
                            <p className="text-[var(--surface-700)] mb-6">
                                Are you sure you want to delete <strong>{deleteConfirm.email}</strong>? All associated data including licenses and profiles will be permanently removed.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-[var(--surface-300)] text-[var(--surface-700)] hover:bg-[var(--surface-200)] transition-colors font-medium">Cancel</button>
                                <button
                                    onClick={handleDelete}
                                    disabled={actionLoading === "delete"}
                                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                                >
                                    {actionLoading === "delete" ? "Deleting..." : "Delete User"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ────── REGENERATE ORA KEY MODAL ────── */}
            {regenerateKeyUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[var(--surface-50)] rounded-2xl border border-[var(--surface-200)] shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b border-[var(--surface-200)]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-[var(--primary)]/15">
                                    <RefreshCw className="w-5 h-5 text-[var(--primary)]" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-[var(--surface-900)]">Regenerate ORA Key</h3>
                                    <p className="text-xs text-[var(--surface-500)]">{regenerateKeyUser.email}</p>
                                </div>
                            </div>
                            <button onClick={() => { setRegenerateKeyUser(null); setRegeneratedKey(null); }} className="p-2 rounded-lg hover:bg-[var(--surface-200)]">
                                <X className="w-5 h-5 text-[var(--surface-500)]" />
                            </button>
                        </div>

                        <div className="p-5 space-y-5">
                            {regeneratedKey ? (
                                /* Success: show new key */
                                <>
                                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                                        <Check className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                                        <p className="text-sm font-medium text-[var(--surface-900)]">New ORA Key Generated</p>
                                        <p className="text-xs text-[var(--surface-500)] mt-1">All devices have been deactivated</p>
                                    </div>

                                    <div className="rounded-xl border-2 border-[var(--primary)]/30 bg-[var(--primary)]/5 p-4">
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 text-base font-mono font-bold text-[var(--surface-900)] tracking-wider text-center select-all">
                                                {regeneratedKey}
                                            </code>
                                            <button
                                                onClick={() => handleCopyOraKey(regeneratedKey)}
                                                className="p-2.5 rounded-xl border border-[var(--surface-300)] hover:bg-[var(--surface-200)] transition-colors"
                                            >
                                                {copiedOraKey ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-[var(--surface-600)]" />}
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-xs text-[var(--surface-500)] text-center">Share this key securely with the user. It will not be shown again.</p>

                                    <button
                                        onClick={() => { setRegenerateKeyUser(null); setRegeneratedKey(null); }}
                                        className="w-full py-2.5 rounded-xl text-white font-medium transition-all"
                                        style={{ background: 'var(--gradient-primary)' }}
                                    >
                                        Done
                                    </button>
                                </>
                            ) : (
                                /* Confirmation: warn about consequences */
                                <>
                                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                        <div className="flex items-start gap-3">
                                            <Ban className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-[var(--surface-900)]">This will:</p>
                                                <ul className="text-xs text-[var(--surface-600)] mt-2 space-y-1.5">
                                                    <li>• Revoke the current ORA Key</li>
                                                    <li>• Sign out the user from <strong>all devices</strong></li>
                                                    <li>• Invalidate all API access using the old key</li>
                                                    <li>• Generate a new ORA Key</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {regenerateKeyUser.ora_key && (
                                        <div>
                                            <p className="text-xs text-[var(--surface-500)] mb-1">Current Key</p>
                                            <code className="text-xs font-mono text-[var(--surface-500)] line-through">{regenerateKeyUser.ora_key}</code>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => { setRegenerateKeyUser(null); setRegeneratedKey(null); }}
                                            className="flex-1 py-2.5 rounded-xl border border-[var(--surface-300)] text-[var(--surface-700)] hover:bg-[var(--surface-200)] transition-colors font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleRegenerateKey}
                                            disabled={actionLoading === "regenerate-key"}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
                                        >
                                            {actionLoading === "regenerate-key" ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" /> Regenerating...</>
                                            ) : (
                                                <><RefreshCw className="w-4 h-4" /> Regenerate</>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
