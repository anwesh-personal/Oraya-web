"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    Search, Trash2, AlertTriangle, Loader2,
    Users as UsersIcon, UserPlus, UserMinus,
    Monitor, Apple, Laptop, BarChart3,
    Clock as ClockIcon, Shield, CheckCircle2, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserProfile {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
}

interface Assignment {
    id: string;
    user_id: string;
    assignment_type: "push" | "entitled";
    is_active: boolean;
    assigned_at: string;
    revoked_at: string | null;
    assigned_by: string | null;
    config_overrides: Record<string, any>;
    user: UserProfile;
}

interface InstallEvent {
    user_id: string;
    event_type: string;
    device_id: string | null;
    device_name: string | null;
    os_type: string | null;
    app_version: string | null;
    created_at: string;
}

interface UsersTabProps { templateId: string; }

// ─── User Avatar ─────────────────────────────────────────────────────────────

function UserAvatar({ user, size = "sm" }: { user: UserProfile; size?: "sm" | "md" }) {
    const sz = size === "md" ? "w-9 h-9 text-sm" : "w-7 h-7 text-xs";
    return user.avatar_url ? (
        <img src={user.avatar_url} alt={user.full_name || ""} className={cn("rounded-full object-cover flex-shrink-0", sz)} />
    ) : (
        <div className={cn("rounded-full bg-[var(--primary)]/20 flex items-center justify-center font-semibold text-[var(--primary)] flex-shrink-0", sz)}>
            {(user.full_name || user.email || "?").charAt(0).toUpperCase()}
        </div>
    );
}

// ─── Assign Modal (user picker) ───────────────────────────────────────────────

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
    free: { label: "Free", color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" },
    pro: { label: "Pro", color: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
    enterprise: { label: "Enterprise", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    starter: { label: "Starter", color: "bg-sky-500/20 text-sky-400 border-sky-500/30" },
};
function PlanBadge({ planId }: { planId: string }) {
    const p = PLAN_LABELS[planId] ?? { label: planId, color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" };
    return (
        <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border", p.color)}>
            {p.label}
        </span>
    );
}

interface SearchUser { id: string; full_name: string | null; email: string | null; avatar_url: string | null; plan_id: string; }

const PAGE = 30;

function AssignModal({
    templateId,
    alreadyAssigned,
    onClose,
    onDone,
}: {
    templateId: string;
    alreadyAssigned: string[];
    onClose: () => void;
    onDone: () => void;
}) {
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState<SearchUser[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [selected, setSelected] = useState<SearchUser[]>([]);
    const [assignType, setAssignType] = useState<"push" | "entitled">("push");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const load = useCallback(async (q: string, p: number) => {
        setIsLoading(true);
        try {
            const offset = p * PAGE;
            const res = await fetch(`/api/superadmin/users/search?q=${encodeURIComponent(q)}&limit=${PAGE}&offset=${offset}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
            setUsers(data.users || []);
            setTotal(data.total || 0);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load on open immediately
    useEffect(() => { load("", 0); }, [load]);

    // Debounced search on query change
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => { setPage(0); load(query, 0); }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query, load]);

    const toggle = (user: SearchUser) => {
        setSelected(prev =>
            prev.some(u => u.id === user.id)
                ? prev.filter(u => u.id !== user.id)
                : [...prev, user]
        );
    };

    const handlePage = (dir: 1 | -1) => {
        const next = page + dir;
        setPage(next);
        load(query, next);
    };

    const handleSubmit = async () => {
        if (selected.length === 0) { setError("Select at least one user."); return; }
        setIsSubmitting(true);
        setError(null);
        try {
            const res = await fetch(`/api/superadmin/agent-templates/${templateId}/assignments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_ids: selected.map(u => u.id), assignment_type: assignType }),
            });
            if (!res.ok) { const d = await res.json(); throw new Error(d.error || `HTTP ${res.status}`); }
            onDone();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalPages = Math.ceil(total / PAGE);
    const displayUsers = users.filter(u => !alreadyAssigned.includes(u.id));

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-[var(--surface-50)] border border-[var(--surface-300)] rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="px-5 py-4 border-b border-[var(--surface-300)] flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-[var(--surface-900)]">Assign Users</h3>
                        <p className="text-xs text-[var(--surface-500)] mt-0.5">
                            Select users, choose assignment type, then hit Assign.
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-200)] transition-colors text-[var(--surface-500)]">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Assignment type */}
                <div className="px-5 py-3 border-b border-[var(--surface-300)] flex gap-2">
                    {([
                        { type: "push", label: "Push — force install on desktop", icon: <Shield className="w-3 h-3" /> },
                        { type: "entitled", label: "Entitled — appears in gallery only", icon: <UsersIcon className="w-3 h-3" /> },
                    ] as const).map(({ type, label, icon }) => (
                        <button
                            key={type}
                            onClick={() => setAssignType(type)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                                assignType === type
                                    ? type === "push"
                                        ? "bg-blue-500/15 text-blue-400 border-blue-500/30 ring-1 ring-blue-500/30"
                                        : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 ring-1 ring-emerald-500/30"
                                    : "bg-transparent text-[var(--surface-600)] border-[var(--surface-300)] hover:bg-[var(--surface-100)]"
                            )}
                        >
                            {icon} {type === "push" ? "Push (force install)" : "Entitled (gallery)"}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="px-5 py-2.5 border-b border-[var(--surface-300)]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--surface-400)]" />
                        <input
                            type="text"
                            placeholder="Filter by name or email..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-1.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-sm text-[var(--surface-900)] placeholder:text-[var(--surface-400)] outline-none focus:border-[var(--primary)] transition-all"
                        />
                        {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[var(--surface-400)]" />}
                    </div>
                </div>

                {/* Selected chips */}
                {selected.length > 0 && (
                    <div className="px-4 py-2 border-b border-[var(--surface-300)] flex flex-wrap gap-1.5 bg-[var(--surface-100)]">
                        {selected.map(u => (
                            <span key={u.id} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] text-xs font-medium">
                                {u.full_name || u.email}
                                <button onClick={() => toggle(u)} className="hover:opacity-70"><X className="w-3 h-3" /></button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Users list */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading && users.length === 0 ? (
                        <div className="flex items-center justify-center py-12 text-[var(--surface-500)]">
                            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading users...
                        </div>
                    ) : displayUsers.length === 0 ? (
                        <p className="py-10 text-center text-sm text-[var(--surface-500)]">
                            {query ? "No users match your search." : "No users found."}
                        </p>
                    ) : (
                        displayUsers.map(user => {
                            const isSel = selected.some(u => u.id === user.id);
                            return (
                                <button
                                    key={user.id}
                                    onClick={() => toggle(user)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors border-b border-[var(--surface-200)] last:border-0",
                                        isSel ? "bg-[var(--primary)]/8" : "hover:bg-[var(--surface-100)]"
                                    )}
                                >
                                    <UserAvatar user={user} size="md" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[var(--surface-900)] truncate">{user.full_name || "—"}</p>
                                        <p className="text-xs text-[var(--surface-500)] truncate">{user.email}</p>
                                    </div>
                                    <PlanBadge planId={user.plan_id} />
                                    {isSel && <CheckCircle2 className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />}
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-5 py-2 border-t border-[var(--surface-200)] flex items-center justify-between text-xs text-[var(--surface-500)]">
                        <span>Page {page + 1} of {totalPages} ({total} users)</span>
                        <div className="flex gap-1">
                            <button disabled={page === 0} onClick={() => handlePage(-1)}
                                className="px-2 py-1 rounded-lg border border-[var(--surface-300)] disabled:opacity-40 hover:bg-[var(--surface-100)] transition-colors">←</button>
                            <button disabled={page >= totalPages - 1} onClick={() => handlePage(1)}
                                className="px-2 py-1 rounded-lg border border-[var(--surface-300)] disabled:opacity-40 hover:bg-[var(--surface-100)] transition-colors">→</button>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="px-5 py-3.5 border-t border-[var(--surface-300)] flex items-center gap-3">
                    {error && <p className="text-xs text-red-400 flex items-center gap-1 flex-1"><AlertTriangle className="w-3 h-3" />{error}</p>}
                    <div className="flex items-center gap-2 ml-auto">
                        <button onClick={onClose} className="px-4 py-2 text-sm text-[var(--surface-600)] hover:text-[var(--surface-800)] transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={selected.length === 0 || isSubmitting}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-[var(--primary)]/90 transition-all"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                            Assign {selected.length > 0 ? `(${selected.length})` : ""}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


// ─── Main Component ───────────────────────────────────────────────────────────

export function UsersTab({ templateId }: UsersTabProps) {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [installEvents, setInstallEvents] = useState<InstallEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showPicker, setShowPicker] = useState(false);
    const [revokingId, setRevokingId] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<"assigned" | "installed">("assigned");

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/superadmin/agent-templates/${templateId}/assignments`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setAssignments(data.assignments || []);
            setInstallEvents(data.install_events || []);
        } catch (err: any) {
            setError(err.message || "Failed to load user data");
        } finally {
            setIsLoading(false);
        }
    }, [templateId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleRevoke = async (assignmentId: string) => {
        if (!confirm("Revoke this assignment?")) return;
        setRevokingId(assignmentId);
        try {
            const res = await fetch(
                `/api/superadmin/agent-templates/${templateId}/assignments?assignment_id=${assignmentId}`,
                { method: "DELETE" }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await fetchData();
        } catch (err: any) { setError(err.message); }
        finally { setRevokingId(null); }
    };

    const activeAssignments = assignments.filter(a => a.is_active);
    const installs = installEvents.filter(e => e.event_type === "install");
    const uninstalls = installEvents.filter(e => e.event_type === "uninstall");
    const uniqueDevices = new Set(installEvents.filter(e => e.device_id).map(e => e.device_id)).size;
    const assignedUserIds = activeAssignments.map(a => a.user_id);

    const osIcon = (os: string | null) => {
        switch (os?.toLowerCase()) {
            case "macos": return <Apple className="w-3 h-3" />;
            case "windows": return <Monitor className="w-3 h-3" />;
            case "linux": return <Laptop className="w-3 h-3" />;
            default: return <Monitor className="w-3 h-3" />;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16 text-[var(--surface-500)]">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading user data...
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: "Assigned", value: activeAssignments.length, color: "text-blue-400", icon: <UserPlus className="w-4 h-4" /> },
                    { label: "Installs", value: installs.length, color: "text-emerald-400", icon: <BarChart3 className="w-4 h-4" /> },
                    { label: "Uninstalls", value: uninstalls.length, color: "text-red-400", icon: <UserMinus className="w-4 h-4" /> },
                    { label: "Devices", value: uniqueDevices, color: "text-purple-400", icon: <Monitor className="w-4 h-4" /> },
                ].map(stat => (
                    <div key={stat.label} className="p-3 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-200)] text-center">
                        <div className={cn("flex items-center justify-center gap-1.5 mb-1", stat.color)}>{stat.icon}</div>
                        <p className="text-lg font-bold text-[var(--surface-900)]">{stat.value}</p>
                        <p className="text-[10px] font-medium text-[var(--surface-500)] uppercase tracking-wider">{stat.label}</p>
                    </div>
                ))}
            </div>

            {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
                    <button onClick={() => setError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
                </div>
            )}

            {/* View toggle + assign button */}
            <div className="flex items-center justify-between">
                <div className="flex rounded-lg bg-[var(--surface-100)] border border-[var(--surface-300)] p-0.5">
                    {(["assigned", "installed"] as const).map(view => (
                        <button
                            key={view}
                            onClick={() => setActiveView(view)}
                            className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                                activeView === view
                                    ? "bg-[var(--primary)] text-white shadow-sm"
                                    : "text-[var(--surface-600)] hover:text-[var(--surface-800)]"
                            )}
                        >
                            {view === "assigned" ? `Assigned (${activeAssignments.length})` : `Install Events (${installEvents.length})`}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setShowPicker(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-all shadow-sm"
                >
                    <UserPlus className="w-3.5 h-3.5" /> Assign Users
                </button>
            </div>

            {/* Assigned Users Table */}
            {activeView === "assigned" && (
                <div className="border border-[var(--surface-200)] rounded-xl overflow-hidden">
                    {activeAssignments.length === 0 ? (
                        <div className="text-center py-12 text-[var(--surface-500)]">
                            <UsersIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="text-sm font-medium">No users assigned</p>
                            <p className="text-xs mt-1">Click &ldquo;Assign Users&rdquo; to push this agent to specific users.</p>
                        </div>
                    ) : (
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-[var(--surface-100)] border-b border-[var(--surface-200)]">
                                    <th className="px-4 py-2.5 text-left font-semibold text-[var(--surface-600)] uppercase tracking-wider">User</th>
                                    <th className="px-4 py-2.5 text-left font-semibold text-[var(--surface-600)] uppercase tracking-wider">Type</th>
                                    <th className="px-4 py-2.5 text-left font-semibold text-[var(--surface-600)] uppercase tracking-wider">Assigned</th>
                                    <th className="px-4 py-2.5 text-right font-semibold text-[var(--surface-600)] uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignments.map(a => (
                                    <tr key={a.id} className={cn("border-b border-[var(--surface-200)] last:border-0 hover:bg-[var(--surface-100)] transition-colors", !a.is_active && "opacity-40")}>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <UserAvatar user={a.user} />
                                                <div>
                                                    <p className="font-medium text-[var(--surface-800)]">{a.user.full_name || "Unknown"}</p>
                                                    <p className="text-[var(--surface-500)]">{a.user.email || a.user_id.substring(0, 12) + "..."}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full border",
                                                a.assignment_type === "push"
                                                    ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                                                    : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                            )}>
                                                {a.assignment_type === "push" ? <Shield className="w-2.5 h-2.5" /> : <UsersIcon className="w-2.5 h-2.5" />}
                                                {a.assignment_type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-[var(--surface-500)]">
                                            {new Date(a.assigned_at).toLocaleDateString()}
                                            {!a.is_active && a.revoked_at && (
                                                <p className="text-red-400 text-[10px]">Revoked {new Date(a.revoked_at).toLocaleDateString()}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {a.is_active && (
                                                <button
                                                    onClick={() => handleRevoke(a.id)}
                                                    disabled={revokingId === a.id}
                                                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-auto disabled:opacity-50"
                                                >
                                                    {revokingId === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                                    Revoke
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Install Events */}
            {activeView === "installed" && (
                <div className="border border-[var(--surface-200)] rounded-xl overflow-hidden">
                    {installEvents.length === 0 ? (
                        <div className="text-center py-12 text-[var(--surface-500)]">
                            <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="text-sm font-medium">No install events yet</p>
                        </div>
                    ) : (
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-[var(--surface-100)] border-b border-[var(--surface-200)]">
                                    <th className="px-4 py-2 text-left font-semibold text-[var(--surface-600)] uppercase tracking-wider">Event</th>
                                    <th className="px-4 py-2 text-left font-semibold text-[var(--surface-600)] uppercase tracking-wider">Device</th>
                                    <th className="px-4 py-2 text-left font-semibold text-[var(--surface-600)] uppercase tracking-wider">OS</th>
                                    <th className="px-4 py-2 text-left font-semibold text-[var(--surface-600)] uppercase tracking-wider">Version</th>
                                    <th className="px-4 py-2 text-right font-semibold text-[var(--surface-600)] uppercase tracking-wider">When</th>
                                </tr>
                            </thead>
                            <tbody>
                                {installEvents.map((event, idx) => (
                                    <tr key={idx} className="border-b border-[var(--surface-200)] last:border-0 hover:bg-[var(--surface-100)] transition-colors">
                                        <td className="px-4 py-2.5">
                                            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full",
                                                event.event_type === "install" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                                            )}>
                                                {event.event_type === "install" ? "✓ Install" : "✕ Uninstall"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-[var(--surface-700)]">{event.device_name || event.device_id?.substring(0, 8) || "—"}</td>
                                        <td className="px-4 py-2.5">
                                            <span className="flex items-center gap-1 text-[var(--surface-600)]">{osIcon(event.os_type)} {event.os_type || "—"}</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-[var(--surface-500)] font-mono">{event.app_version || "—"}</td>
                                        <td className="px-4 py-2.5 text-right text-[var(--surface-500)]">
                                            <span className="flex items-center gap-1 justify-end"><ClockIcon className="w-3 h-3" />{new Date(event.created_at).toLocaleString()}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Assign modal */}
            {showPicker && (
                <AssignModal
                    templateId={templateId}
                    alreadyAssigned={assignedUserIds}
                    onClose={() => setShowPicker(false)}
                    onDone={() => { setShowPicker(false); fetchData(); }}
                />
            )}
        </div>
    );
}
