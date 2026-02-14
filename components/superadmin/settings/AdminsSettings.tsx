"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Shield, User, Mail, Calendar, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Admin {
    id: string;
    email: string;
    name: string;
    role: "super_admin" | "admin" | "moderator";
    created_at: string;
    last_login_at: string | null;
}

export function AdminsSettings() {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [newAdmin, setNewAdmin] = useState({
        email: "",
        name: "",
        role: "admin" as Admin["role"],
        password: "",
    });

    const fetchAdmins = useCallback(async () => {
        try {
            setError(null);
            const res = await fetch("/api/superadmin/admins");
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to fetch admins");
            }
            const data = await res.json();
            setAdmins(data.admins || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load admins");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAdmins();
    }, [fetchAdmins]);

    const handleAddAdmin = async () => {
        if (!newAdmin.email || !newAdmin.name || !newAdmin.password) return;

        if (newAdmin.password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch("/api/superadmin/admins", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: newAdmin.email,
                    name: newAdmin.name,
                    password: newAdmin.password,
                    role: newAdmin.role,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create admin");
            }

            setNewAdmin({ email: "", name: "", role: "admin", password: "" });
            setShowAddForm(false);
            setSuccess("Admin created successfully");
            await fetchAdmins();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create admin");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAdmin = async (id: string) => {
        if (!confirm("Are you sure you want to delete this admin?")) return;

        setDeletingId(id);
        setError(null);

        try {
            const res = await fetch(`/api/superadmin/admins?id=${id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete admin");
            }

            setSuccess("Admin deleted successfully");
            await fetchAdmins();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete admin");
        } finally {
            setDeletingId(null);
        }
    };

    const getRoleBadge = (role: Admin["role"]) => {
        switch (role) {
            case "super_admin":
                return "bg-violet-500/20 text-violet-300 border-violet-500/30";
            case "admin":
                return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
            case "moderator":
                return "bg-[var(--surface-400)]/20 text-[var(--surface-600)] border-[var(--surface-400)]/30";
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
                <span className="ml-2 text-[var(--surface-500)]">Loading admins...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Status messages */}
            {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}
            {success && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    {success}
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-[var(--surface-900)]">Platform Admins</h3>
                    <p className="text-sm text-[var(--surface-500)] mt-1">Manage who has access to the admin panel</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium transition-all shadow-lg"
                    style={{ background: 'var(--gradient-primary)', boxShadow: '0 4px 20px -4px var(--primary-glow)' }}
                >
                    <Plus className="w-4 h-4" />
                    Add Admin
                </button>
            </div>

            {/* Add Admin Form */}
            {showAddForm && (
                <div className="p-6 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-200)]">
                    <h4 className="text-lg font-semibold text-[var(--surface-900)] mb-4">Add New Admin</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--surface-600)] mb-2">Name</label>
                            <input
                                type="text"
                                value={newAdmin.name}
                                onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                                placeholder="Full name"
                                className="w-full px-4 py-3 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--surface-600)] mb-2">Email</label>
                            <input
                                type="email"
                                value={newAdmin.email}
                                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                placeholder="email@example.com"
                                className="w-full px-4 py-3 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--surface-600)] mb-2">Password</label>
                            <input
                                type="password"
                                value={newAdmin.password}
                                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                placeholder="Min 8 characters"
                                className="w-full px-4 py-3 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--surface-600)] mb-2">Role</label>
                            <select
                                value={newAdmin.role}
                                onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value as Admin["role"] })}
                                className="w-full px-4 py-3 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                            >
                                <option value="admin">Admin</option>
                                <option value="moderator">Moderator</option>
                                <option value="super_admin">Super Admin</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                        <button
                            onClick={handleAddAdmin}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium transition-all disabled:opacity-50"
                            style={{ background: 'var(--gradient-primary)' }}
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {saving ? "Creating..." : "Create Admin"}
                        </button>
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-200)] rounded-xl text-[var(--surface-600)] hover:bg-[var(--surface-200)] transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Admins Table */}
            <div className="rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-200)] overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[var(--surface-200)]">
                            <th className="px-6 py-4 text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">
                                Admin
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">
                                Created
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">
                                Last Login
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--surface-200)]">
                        {admins.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-[var(--surface-500)] text-sm">
                                    No admins found. Add your first admin above.
                                </td>
                            </tr>
                        )}
                        {admins.map((admin) => (
                            <tr key={admin.id} className="hover:bg-[var(--surface-100)] transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                                            style={{ background: 'var(--gradient-primary)' }}
                                        >
                                            <User className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-[var(--surface-900)]">{admin.name}</p>
                                            <p className="text-sm text-[var(--surface-500)]">{admin.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-xs font-medium border capitalize",
                                        getRoleBadge(admin.role)
                                    )}>
                                        {admin.role.replace("_", " ")}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-[var(--surface-500)]">
                                    {formatDate(admin.created_at)}
                                </td>
                                <td className="px-6 py-4 text-sm text-[var(--surface-500)]">
                                    {admin.last_login_at ? formatDate(admin.last_login_at) : "Never"}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDeleteAdmin(admin.id)}
                                        disabled={deletingId === admin.id}
                                        className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--surface-500)] hover:text-red-400 transition-colors disabled:opacity-50"
                                    >
                                        {deletingId === admin.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
