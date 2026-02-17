"use client";

import { useState } from "react";
import {
    Search,
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    Ban,
    Loader2,
    X,
    Users,
} from "lucide-react";
import { cn, formatDate, getStatusBadgeClass } from "@/lib/utils";

interface Organization {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    avatar_url: string | null;
    status: string;
    plan_id: string | null;
    owner: { id: string; full_name: string | null; email: string | null; avatar_url: string | null } | null;
    member_count: number;
    max_members: number;
    max_agents: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    organizations: Organization[];
    onRefresh: () => void;
}

export function OrganizationsTable({ organizations, onRefresh }: Props) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [viewOrg, setViewOrg] = useState<Organization | null>(null);
    const [editOrg, setEditOrg] = useState<Organization | null>(null);
    const [editName, setEditName] = useState("");
    const [editPlan, setEditPlan] = useState("");
    const [editMaxMembers, setEditMaxMembers] = useState(5);

    const filteredOrgs = organizations.filter(
        (org) =>
            org.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            org.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            org.owner?.email?.toLowerCase().includes(searchQuery.toLowerCase())
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
        const url = `/api/superadmin/organizations${params ? `?${params}` : ""}`;
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

    const handleSuspend = async (org: Organization) => {
        const isSuspended = org.status === "suspended";
        if (!confirm(isSuspended ? `Unsuspend ${org.name}?` : `Suspend ${org.name}? All members will lose access.`)) return;
        setActionLoading(org.id);
        try {
            await apiCall("PATCH", {
                org_id: org.id,
                updates: { suspend: !isSuspended },
            });
            onRefresh();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setActionLoading(null);
            setSelectedOrg(null);
        }
    };

    const handleDelete = async (org: Organization) => {
        if (!confirm(`⚠️ DELETE ${org.name}? This removes the org, all memberships, and shared resources. This cannot be undone.`)) return;
        setActionLoading(org.id);
        try {
            await apiCall("DELETE", undefined, `org_id=${org.id}`);
            onRefresh();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setActionLoading(null);
            setSelectedOrg(null);
        }
    };

    const handleEditSave = async () => {
        if (!editOrg) return;
        setActionLoading(editOrg.id);
        try {
            await apiCall("PATCH", {
                org_id: editOrg.id,
                updates: {
                    name: editName || undefined,
                    plan_id: editPlan || undefined,
                    max_members: editMaxMembers,
                },
            });
            setEditOrg(null);
            onRefresh();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setActionLoading(null);
        }
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
                            placeholder="Search by name, slug, or owner..."
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
                                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--surface-500)] uppercase tracking-wider">Organization</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--surface-500)] uppercase tracking-wider">Owner</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--surface-500)] uppercase tracking-wider">Plan</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--surface-500)] uppercase tracking-wider">Members</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--surface-500)] uppercase tracking-wider">Status</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--surface-500)] uppercase tracking-wider">Created</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--surface-500)] uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrgs.map((org) => (
                                <tr key={org.id} className="border-b border-[var(--surface-300)] hover:bg-[var(--surface-100)]/50 transition-colors">
                                    {/* Org */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                                                <span className="text-xs font-semibold text-white">
                                                    {(org.name?.[0] || "O").toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-[var(--surface-800)] block">{org.name}</span>
                                                <span className="text-xs text-[var(--surface-500)] font-mono">{org.slug}</span>
                                            </div>
                                        </div>
                                    </td>
                                    {/* Owner */}
                                    <td className="px-4 py-3">
                                        <span className="text-sm text-[var(--surface-700)]">
                                            {org.owner?.full_name || org.owner?.email || "—"}
                                        </span>
                                    </td>
                                    {/* Plan */}
                                    <td className="px-4 py-3">
                                        <span className={cn("badge", getPlanBadge(org.plan_id))}>
                                            {org.plan_id ? org.plan_id.charAt(0).toUpperCase() + org.plan_id.slice(1) : "None"}
                                        </span>
                                    </td>
                                    {/* Members */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5 text-[var(--surface-400)]" />
                                            <span className="text-sm text-[var(--surface-800)]">{org.member_count}</span>
                                            <span className="text-xs text-[var(--surface-500)]">/ {org.max_members}</span>
                                        </div>
                                    </td>
                                    {/* Status */}
                                    <td className="px-4 py-3">
                                        <span className={cn("badge", getStatusBadgeClass(org.status))}>
                                            {org.status}
                                        </span>
                                    </td>
                                    {/* Created */}
                                    <td className="px-4 py-3">
                                        <span className="text-sm text-[var(--surface-600)]">{formatDate(org.created_at)}</span>
                                    </td>
                                    {/* Actions */}
                                    <td className="px-4 py-3 text-right">
                                        <div className="relative inline-block">
                                            {actionLoading === org.id ? (
                                                <Loader2 className="w-4 h-4 text-[var(--primary)] animate-spin" />
                                            ) : (
                                                <button
                                                    onClick={() => setSelectedOrg(selectedOrg === org.id ? null : org.id)}
                                                    className="p-2 rounded-lg hover:bg-[var(--surface-200)] transition-colors"
                                                >
                                                    <MoreHorizontal className="w-4 h-4 text-[var(--surface-500)]" />
                                                </button>
                                            )}

                                            {selectedOrg === org.id && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setSelectedOrg(null)} />
                                                    <div className="absolute right-0 top-full mt-1 w-44 bg-[var(--surface-50)] border border-[var(--surface-300)] rounded-xl shadow-2xl z-50 py-1">
                                                        <button
                                                            onClick={() => { setViewOrg(org); setSelectedOrg(null); }}
                                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--surface-700)] hover:bg-[var(--surface-200)] transition-colors"
                                                        >
                                                            <Eye className="w-4 h-4" /> View Details
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditOrg(org);
                                                                setEditName(org.name);
                                                                setEditPlan(org.plan_id || "team");
                                                                setEditMaxMembers(org.max_members);
                                                                setSelectedOrg(null);
                                                            }}
                                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--surface-700)] hover:bg-[var(--surface-200)] transition-colors"
                                                        >
                                                            <Edit className="w-4 h-4" /> Edit
                                                        </button>
                                                        <div className="my-1 border-t border-[var(--surface-300)]" />
                                                        <button
                                                            onClick={() => handleSuspend(org)}
                                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors"
                                                        >
                                                            <Ban className="w-4 h-4" /> {org.status === "suspended" ? "Unsuspend" : "Suspend"}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(org)}
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

                    {filteredOrgs.length === 0 && (
                        <div className="py-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-[var(--surface-200)] flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-[var(--surface-400)]" />
                            </div>
                            <p className="text-[var(--surface-500)]">No organizations found</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--surface-300)] text-sm text-[var(--surface-500)]">
                    Showing {filteredOrgs.length} of {organizations.length} organizations
                </div>
            </div>

            {/* ── View Details Modal ── */}
            {viewOrg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewOrg(null)} />
                    <div className="relative w-full max-w-lg mx-4 bg-[var(--surface-50)] border border-[var(--surface-300)] rounded-2xl shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[var(--surface-900)]">Organization Details</h3>
                            <button onClick={() => setViewOrg(null)} className="p-2 rounded-lg hover:bg-[var(--surface-200)]"><X className="w-5 h-5 text-[var(--surface-500)]" /></button>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-[var(--surface-500)]">ID</span><code className="text-[var(--surface-700)] text-xs">{viewOrg.id}</code></div>
                            <div className="flex justify-between"><span className="text-[var(--surface-500)]">Name</span><span className="text-[var(--surface-900)]">{viewOrg.name}</span></div>
                            <div className="flex justify-between"><span className="text-[var(--surface-500)]">Slug</span><span className="text-[var(--surface-900)] font-mono">{viewOrg.slug}</span></div>
                            <div className="flex justify-between"><span className="text-[var(--surface-500)]">Description</span><span className="text-[var(--surface-900)]">{viewOrg.description || "—"}</span></div>
                            <hr className="border-[var(--surface-300)]" />
                            <div className="flex justify-between"><span className="text-[var(--surface-500)]">Owner</span><span className="text-[var(--surface-900)]">{viewOrg.owner?.full_name || viewOrg.owner?.email || "—"}</span></div>
                            <div className="flex justify-between"><span className="text-[var(--surface-500)]">Plan</span><span className="text-[var(--surface-900)]">{viewOrg.plan_id || "None"}</span></div>
                            <div className="flex justify-between"><span className="text-[var(--surface-500)]">Members</span><span className="text-[var(--surface-900)]">{viewOrg.member_count} / {viewOrg.max_members}</span></div>
                            <div className="flex justify-between"><span className="text-[var(--surface-500)]">Max Agents</span><span className="text-[var(--surface-900)]">{viewOrg.max_agents}</span></div>
                            <div className="flex justify-between"><span className="text-[var(--surface-500)]">Status</span><span className="text-[var(--surface-900)]">{viewOrg.status}</span></div>
                            <div className="flex justify-between"><span className="text-[var(--surface-500)]">Created</span><span className="text-[var(--surface-900)]">{formatDate(viewOrg.created_at)}</span></div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Org Modal ── */}
            {editOrg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditOrg(null)} />
                    <div className="relative w-full max-w-md mx-4 bg-[var(--surface-50)] border border-[var(--surface-300)] rounded-2xl shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[var(--surface-900)]">Edit {editOrg.name}</h3>
                            <button onClick={() => setEditOrg(null)} className="p-2 rounded-lg hover:bg-[var(--surface-200)]"><X className="w-5 h-5 text-[var(--surface-500)]" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">Name</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                                />
                            </div>
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
                                <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">Max Members</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={editMaxMembers}
                                    onChange={(e) => setEditMaxMembers(Number(e.target.value))}
                                    className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t border-[var(--surface-300)]">
                                <button onClick={() => setEditOrg(null)} className="px-5 py-2.5 text-sm font-medium text-[var(--surface-600)]">Cancel</button>
                                <button
                                    onClick={handleEditSave}
                                    disabled={actionLoading === editOrg.id}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60"
                                    style={{ background: "var(--gradient-primary)" }}
                                >
                                    {actionLoading === editOrg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
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
