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
    Ban,
    X,
    Loader2,
} from "lucide-react";
import { cn, formatDate, getStatusBadgeClass } from "@/lib/utils";
import { toast } from "sonner";
import { usePlans } from "@/hooks/usePlans";

interface Organization {
    id: string;
    name: string;
    slug: string;
    description?: string;
    status: string;
    plan_id: string | null;
    owner: {
        id: string;
        full_name: string | null;
        email: string | null;
        avatar_url: string | null;
    } | null;
    member_count: number;
    max_members?: number;
    max_agents?: number;
    created_at: string;
}

interface OrganizationsTableProps {
    organizations: Organization[];
    onRefresh?: () => void;
}

export function OrganizationsTable({ organizations, onRefresh }: OrganizationsTableProps) {
    const { plans, loading: plansLoading } = usePlans({ activeOnly: true });
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Modals
    const [viewOrg, setViewOrg] = useState<Organization | null>(null);
    const [editOrg, setEditOrg] = useState<Organization | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<Organization | null>(null);

    // Edit form
    const [editName, setEditName] = useState("");
    const [editPlan, setEditPlan] = useState("");
    const [editMaxMembers, setEditMaxMembers] = useState(5);

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
            case "active": return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            case "suspended": return <XCircle className="w-4 h-4 text-red-500" />;
            case "inactive": return <XCircle className="w-4 h-4 text-[var(--surface-400)]" />;
            case "pending": return <Clock className="w-4 h-4 text-amber-500" />;
            default: return null;
        }
    };

    const getPlanBadge = (plan: string | null) => {
        const p = plan || "none";
        const defaultColors: Record<string, string> = {
            none: "bg-[var(--surface-200)] text-[var(--surface-500)]",
            free: "bg-[var(--surface-200)] text-[var(--surface-500)]",
        };
        if (defaultColors[p]) return defaultColors[p];
        const tierColors = [
            "bg-blue-500/15 text-blue-400",
            "bg-cyan-500/15 text-cyan-400",
            "bg-purple-500/15 text-purple-400",
            "bg-amber-500/15 text-amber-400",
            "bg-emerald-500/15 text-emerald-400",
            "bg-rose-500/15 text-rose-400",
        ];
        const idx = plans.findIndex((pl) => pl.id === p);
        return idx >= 0 ? tierColors[idx % tierColors.length] : defaultColors.none;
    };

    const handleEdit = (org: Organization) => {
        setEditOrg(org);
        setEditName(org.name);
        setEditPlan(org.plan_id || "");
        setEditMaxMembers(org.max_members || 5);
        setOpenDropdown(null);
    };

    const handleSaveEdit = async () => {
        if (!editOrg) return;
        setActionLoading("edit");
        try {
            const res = await fetch("/api/superadmin/organizations", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    org_id: editOrg.id,
                    updates: { name: editName, plan_id: editPlan || null, max_members: editMaxMembers },
                }),
            });
            if (res.ok) { toast.success("Organization updated"); setEditOrg(null); onRefresh?.(); }
            else { const data = await res.json(); toast.error(data.error || "Failed to update"); }
        } catch { toast.error("Failed to update organization"); }
        finally { setActionLoading(null); }
    };

    const handleSuspend = async (org: Organization) => {
        setActionLoading(org.id);
        const isSuspended = org.status === "suspended" || org.status === "inactive";
        try {
            const res = await fetch("/api/superadmin/organizations", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ org_id: org.id, updates: { suspend: !isSuspended } }),
            });
            if (res.ok) { toast.success(isSuspended ? "Organization reactivated" : "Organization suspended"); onRefresh?.(); }
            else { toast.error("Failed to update organization"); }
        } catch { toast.error("Failed to update organization"); }
        finally { setActionLoading(null); setOpenDropdown(null); }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        setActionLoading("delete");
        try {
            const res = await fetch(`/api/superadmin/organizations?org_id=${deleteConfirm.id}`, { method: "DELETE" });
            if (res.ok) { toast.success("Organization deleted"); setDeleteConfirm(null); onRefresh?.(); }
            else { const data = await res.json(); toast.error(data.error || "Failed to delete"); }
        } catch { toast.error("Failed to delete organization"); }
        finally { setActionLoading(null); }
    };

    return (
        <>
            <div className="rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-200)] overflow-hidden">
                {/* Filters */}
                <div className="p-3 sm:p-4 border-b border-[var(--surface-200)] flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--surface-400)]" />
                        <input
                            type="text"
                            placeholder="Search organizations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-sm text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-sm text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                {/* ── Desktop Table ── */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--surface-200)] bg-[var(--surface-100)]/50">
                                <th className="px-5 py-3 text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">Organization</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">Owner</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">Plan</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">Members</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">Status</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">Created</th>
                                <th className="px-5 py-3 text-right text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--surface-200)]">
                            {filteredOrgs.map((org) => (
                                <tr key={org.id} className="hover:bg-[var(--surface-100)]/50 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
                                                <Building2 className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-[var(--surface-900)] truncate">{org.name}</p>
                                                <p className="text-xs text-[var(--surface-500)]">/{org.slug}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        {org.owner ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium shrink-0">
                                                    {(org.owner.full_name || org.owner.email || "?")?.[0]?.toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm text-[var(--surface-900)] truncate">{org.owner.full_name || "—"}</p>
                                                    <p className="text-xs text-[var(--surface-500)] truncate">{org.owner.email || "—"}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-[var(--surface-400)]">No owner</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={cn("px-2.5 py-1 rounded-lg text-xs font-medium capitalize", getPlanBadge(org.plan_id))}>
                                            {org.plan_id || "No Plan"}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-4 h-4 text-[var(--surface-400)]" />
                                            <span className="text-sm text-[var(--surface-900)]">{org.member_count || 0}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-1.5">
                                            {getStatusIcon(org.status)}
                                            <span className={cn("px-2.5 py-1 rounded-lg text-xs font-medium capitalize", getStatusBadgeClass(org.status))}>
                                                {org.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-[var(--surface-500)]">{formatDate(org.created_at)}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => { setViewOrg(org); }}
                                                title="View details"
                                                className="p-2 rounded-lg hover:bg-[var(--surface-200)] text-[var(--surface-500)] hover:text-[var(--surface-800)] transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(org)}
                                                title="Edit"
                                                className="p-2 rounded-lg hover:bg-[var(--surface-200)] text-[var(--surface-500)] hover:text-[var(--surface-800)] transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <div className="relative">
                                                <button
                                                    onClick={() => setOpenDropdown(openDropdown === org.id ? null : org.id)}
                                                    className="p-2 rounded-lg hover:bg-[var(--surface-200)] text-[var(--surface-500)] hover:text-[var(--surface-800)] transition-colors"
                                                >
                                                    {actionLoading === org.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreHorizontal className="w-4 h-4" />}
                                                </button>
                                                {openDropdown === org.id && (
                                                    <>
                                                        <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                                                        <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-[var(--surface-50)] border border-[var(--surface-200)] shadow-2xl z-50 py-1.5">
                                                            <button
                                                                onClick={() => handleSuspend(org)}
                                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-amber-500 hover:bg-amber-500/10 transition-colors"
                                                            >
                                                                {org.status === "suspended" || org.status === "inactive"
                                                                    ? <><CheckCircle className="w-4 h-4" /> Reactivate</>
                                                                    : <><Ban className="w-4 h-4" /> Suspend</>}
                                                            </button>
                                                            <button
                                                                onClick={() => { setDeleteConfirm(org); setOpenDropdown(null); }}
                                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" /> Delete
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
                    {filteredOrgs.length === 0 && (
                        <div className="py-16 text-center">
                            <Building2 className="w-12 h-12 text-[var(--surface-300)] mx-auto mb-3" />
                            <p className="text-[var(--surface-500)]">No organizations found</p>
                        </div>
                    )}
                </div>

                {/* ── Mobile Card View ── */}
                <div className="lg:hidden divide-y divide-[var(--surface-200)]">
                    {filteredOrgs.map((org) => (
                        <div key={org.id} className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
                                        <Building2 className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-[var(--surface-900)] truncate">{org.name}</p>
                                        <p className="text-xs text-[var(--surface-500)]">/{org.slug}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button onClick={() => setViewOrg(org)} className="p-2 rounded-lg hover:bg-[var(--surface-200)] text-[var(--surface-500)]"><Eye className="w-4 h-4" /></button>
                                    <button onClick={() => handleEdit(org)} className="p-2 rounded-lg hover:bg-[var(--surface-200)] text-[var(--surface-500)]"><Edit className="w-4 h-4" /></button>
                                    <button onClick={() => setDeleteConfirm(org)} className="p-2 rounded-lg hover:bg-red-500/10 text-red-500"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={cn("px-2.5 py-1 rounded-lg text-xs font-medium capitalize", getStatusBadgeClass(org.status))}>{org.status}</span>
                                <span className={cn("px-2.5 py-1 rounded-lg text-xs font-medium capitalize", getPlanBadge(org.plan_id))}>{org.plan_id || "No Plan"}</span>
                                <span className="text-xs text-[var(--surface-500)] flex items-center gap-1"><Users className="w-3 h-3" /> {org.member_count || 0}</span>
                                {org.owner && <span className="text-xs text-[var(--surface-500)]">{org.owner.email}</span>}
                            </div>
                        </div>
                    ))}
                    {filteredOrgs.length === 0 && (
                        <div className="py-16 text-center">
                            <Building2 className="w-12 h-12 text-[var(--surface-300)] mx-auto mb-3" />
                            <p className="text-[var(--surface-500)]">No organizations found</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 sm:p-4 border-t border-[var(--surface-200)] text-sm text-[var(--surface-500)]">
                    Showing {filteredOrgs.length} of {organizations.length} organizations
                </div>
            </div>

            {/* ── View Details Modal ── */}
            {viewOrg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[var(--surface-50)] rounded-2xl border border-[var(--surface-200)] shadow-2xl w-full max-w-lg overflow-y-auto max-h-[85vh]">
                        <div className="flex items-center justify-between p-5 border-b border-[var(--surface-200)] sticky top-0 bg-[var(--surface-50)] z-10">
                            <h3 className="text-lg font-semibold text-[var(--surface-900)]">Organization Details</h3>
                            <button onClick={() => setViewOrg(null)} className="p-2 rounded-lg hover:bg-[var(--surface-200)]"><X className="w-5 h-5 text-[var(--surface-500)]" /></button>
                        </div>
                        <div className="p-5 space-y-5">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
                                    <Building2 className="w-7 h-7 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-lg font-semibold text-[var(--surface-900)] truncate">{viewOrg.name}</p>
                                    <p className="text-sm text-[var(--surface-500)]">/{viewOrg.slug}</p>
                                </div>
                            </div>
                            {viewOrg.description && (
                                <div>
                                    <p className="text-xs text-[var(--surface-500)] uppercase tracking-wider">Description</p>
                                    <p className="text-sm text-[var(--surface-800)] mt-1">{viewOrg.description}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    ["Owner", viewOrg.owner?.full_name || viewOrg.owner?.email || "—"],
                                    ["Status", viewOrg.status],
                                    ["Plan", viewOrg.plan_id || "None"],
                                    ["Members", `${viewOrg.member_count}${viewOrg.max_members ? ` / ${viewOrg.max_members}` : ""}`],
                                    ["Max Agents", viewOrg.max_agents?.toString() || "—"],
                                    ["Created", formatDate(viewOrg.created_at)],
                                ].map(([label, value]) => (
                                    <div key={label}>
                                        <p className="text-xs text-[var(--surface-500)] uppercase tracking-wider">{label}</p>
                                        <p className="text-sm font-medium text-[var(--surface-800)] mt-1 capitalize">{value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Modal ── */}
            {editOrg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[var(--surface-50)] rounded-2xl border border-[var(--surface-200)] shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b border-[var(--surface-200)]">
                            <h3 className="text-lg font-semibold text-[var(--surface-900)]">Edit Organization</h3>
                            <button onClick={() => setEditOrg(null)} className="p-2 rounded-lg hover:bg-[var(--surface-200)]"><X className="w-5 h-5 text-[var(--surface-500)]" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">Name</label>
                                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">Plan</label>
                                <select value={editPlan} onChange={e => setEditPlan(e.target.value)} className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30" disabled={plansLoading}>
                                    <option value="">No Plan</option>
                                    {plansLoading ? (
                                        <option disabled>Loading plans...</option>
                                    ) : (
                                        plans.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">Max Members</label>
                                <input type="number" value={editMaxMembers} onChange={e => setEditMaxMembers(parseInt(e.target.value) || 1)} min={1} className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setEditOrg(null)} className="flex-1 py-2.5 rounded-xl border border-[var(--surface-300)] text-[var(--surface-700)] hover:bg-[var(--surface-200)] transition-colors font-medium">Cancel</button>
                                <button onClick={handleSaveEdit} disabled={actionLoading === "edit"} className="flex-1 py-2.5 rounded-xl text-white font-medium transition-all disabled:opacity-50" style={{ background: 'var(--gradient-primary)' }}>
                                    {actionLoading === "edit" ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation ── */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[var(--surface-50)] rounded-2xl border border-[var(--surface-200)] shadow-2xl w-full max-w-md">
                        <div className="p-5">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 rounded-full bg-red-500/15"><Trash2 className="w-6 h-6 text-red-500" /></div>
                                <div>
                                    <h3 className="text-lg font-semibold text-[var(--surface-900)]">Delete Organization</h3>
                                    <p className="text-sm text-[var(--surface-500)]">This action cannot be undone.</p>
                                </div>
                            </div>
                            <p className="text-[var(--surface-700)] mb-6">
                                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? All team members, shared agents, and associated data will be permanently removed.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-[var(--surface-300)] text-[var(--surface-700)] hover:bg-[var(--surface-200)] transition-colors font-medium">Cancel</button>
                                <button onClick={handleDelete} disabled={actionLoading === "delete"} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50">
                                    {actionLoading === "delete" ? "Deleting..." : "Delete Organization"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
