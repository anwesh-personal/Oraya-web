"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Plus, Trash2, AlertTriangle, Loader2,
    Users as UsersIcon, UserPlus, UserMinus,
    Monitor, Apple, Laptop, BarChart3,
    Clock as ClockIcon, Shield,
} from "lucide-react";

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

interface UsersTabProps {
    templateId: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function UsersTab({ templateId }: UsersTabProps) {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [installEvents, setInstallEvents] = useState<InstallEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Assign state
    const [isAssigning, setIsAssigning] = useState(false);
    const [newUserIds, setNewUserIds] = useState("");
    const [assignType, setAssignType] = useState<string>("push");
    const [assignError, setAssignError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Revoke state
    const [revokingId, setRevokingId] = useState<string | null>(null);

    // View toggle
    const [activeView, setActiveView] = useState<"assigned" | "installed">("assigned");

    // ── Fetch ────────────────────────────────────────────────────────────────

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

    // ── Assign ───────────────────────────────────────────────────────────────

    const handleAssign = async () => {
        const ids = newUserIds.split(",").map(s => s.trim()).filter(Boolean);
        if (ids.length === 0) {
            setAssignError("Enter at least one user ID");
            return;
        }
        setIsSubmitting(true);
        setAssignError(null);
        try {
            const res = await fetch(`/api/superadmin/agent-templates/${templateId}/assignments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_ids: ids,
                    assignment_type: assignType,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `HTTP ${res.status}`);
            }
            const data = await res.json();
            if (data.errors?.length > 0) {
                setAssignError(data.errors.join("; "));
            }
            setNewUserIds("");
            setIsAssigning(false);
            await fetchData();
        } catch (err: any) {
            setAssignError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Revoke ───────────────────────────────────────────────────────────────

    const handleRevoke = async (assignmentId: string) => {
        if (!confirm("Revoke this assignment? The user will no longer receive updates for this agent.")) return;
        setRevokingId(assignmentId);
        try {
            const res = await fetch(
                `/api/superadmin/agent-templates/${templateId}/assignments?assignment_id=${assignmentId}`,
                { method: "DELETE" }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await fetchData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setRevokingId(null);
        }
    };

    // ── Stats ────────────────────────────────────────────────────────────────

    const activeAssignments = assignments.filter(a => a.is_active);
    const revokedAssignments = assignments.filter(a => !a.is_active);
    const installs = installEvents.filter(e => e.event_type === "install");
    const uninstalls = installEvents.filter(e => e.event_type === "uninstall");
    const uniqueDevices = new Set(installEvents.filter(e => e.device_id).map(e => e.device_id)).size;

    // ── OS Icon ──────────────────────────────────────────────────────────────

    const osIcon = (os: string | null) => {
        switch (os?.toLowerCase()) {
            case "macos": return <Apple className="w-3 h-3" />;
            case "windows": return <Monitor className="w-3 h-3" />;
            case "linux": return <Laptop className="w-3 h-3" />;
            default: return <Monitor className="w-3 h-3" />;
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16 text-[var(--surface-500)]">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading user data...
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Stats cards */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: "Assigned", value: activeAssignments.length, color: "text-blue-400", icon: <UserPlus className="w-4 h-4" /> },
                    { label: "Installs", value: installs.length, color: "text-emerald-400", icon: <BarChart3 className="w-4 h-4" /> },
                    { label: "Uninstalls", value: uninstalls.length, color: "text-red-400", icon: <UserMinus className="w-4 h-4" /> },
                    { label: "Devices", value: uniqueDevices, color: "text-purple-400", icon: <Monitor className="w-4 h-4" /> },
                ].map(stat => (
                    <div key={stat.label} className="p-3 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-200)] text-center">
                        <div className={`flex items-center justify-center gap-1.5 mb-1 ${stat.color}`}>{stat.icon}</div>
                        <p className="text-lg font-bold text-[var(--surface-900)]">{stat.value}</p>
                        <p className="text-[10px] font-medium text-[var(--surface-500)] uppercase tracking-wider">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto">×</button>
                </div>
            )}

            {/* View Toggle + Assign Button */}
            <div className="flex items-center justify-between">
                <div className="flex rounded-lg bg-[var(--surface-100)] border border-[var(--surface-300)] p-0.5">
                    <button
                        onClick={() => setActiveView("assigned")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeView === "assigned"
                                ? "bg-[var(--primary)] text-white shadow-sm"
                                : "text-[var(--surface-600)] hover:text-[var(--surface-800)]"
                            }`}
                    >
                        Assigned ({activeAssignments.length})
                    </button>
                    <button
                        onClick={() => setActiveView("installed")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeView === "installed"
                                ? "bg-[var(--primary)] text-white shadow-sm"
                                : "text-[var(--surface-600)] hover:text-[var(--surface-800)]"
                            }`}
                    >
                        Install Events ({installEvents.length})
                    </button>
                </div>
                <button
                    onClick={() => setIsAssigning(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-all shadow-sm"
                >
                    <UserPlus className="w-3.5 h-3.5" /> Assign Users
                </button>
            </div>

            {/* Assign Form */}
            {isAssigning && (
                <div className="border border-[var(--primary)]/30 bg-[var(--primary)]/5 rounded-xl p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-[var(--surface-800)]">Assign Template to Users</h4>

                    <div>
                        <label className="text-xs font-medium text-[var(--surface-600)] mb-1 block">User IDs (comma-separated)</label>
                        <textarea
                            value={newUserIds}
                            onChange={e => setNewUserIds(e.target.value)}
                            placeholder="Paste user UUIDs, one per line or comma-separated..."
                            rows={3}
                            className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-sm text-[var(--surface-900)] font-mono outline-none focus:border-[var(--primary)] resize-none"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setAssignType("push")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${assignType === "push"
                                    ? "bg-blue-500/15 text-blue-400 border-blue-500/30 ring-1 ring-blue-500/30"
                                    : "bg-[var(--surface-100)] text-[var(--surface-600)] border-[var(--surface-300)]"
                                }`}
                        >
                            <Shield className="w-3 h-3" /> Push (force install)
                        </button>
                        <button
                            onClick={() => setAssignType("entitled")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${assignType === "entitled"
                                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 ring-1 ring-emerald-500/30"
                                    : "bg-[var(--surface-100)] text-[var(--surface-600)] border-[var(--surface-300)]"
                                }`}
                        >
                            <UsersIcon className="w-3 h-3" /> Entitled (available in gallery)
                        </button>
                    </div>

                    {assignError && (
                        <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {assignError}
                        </p>
                    )}

                    <div className="flex justify-end gap-2">
                        <button onClick={() => { setIsAssigning(false); setAssignError(null); }} className="px-3 py-1.5 text-xs text-[var(--surface-600)]">
                            Cancel
                        </button>
                        <button
                            onClick={handleAssign}
                            disabled={isSubmitting || !newUserIds.trim()}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[var(--primary)] text-white rounded-lg disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                            Assign
                        </button>
                    </div>
                </div>
            )}

            {/* Assigned Users Table */}
            {activeView === "assigned" && (
                <div className="border border-[var(--surface-200)] rounded-xl overflow-hidden">
                    {activeAssignments.length === 0 ? (
                        <div className="text-center py-10 text-[var(--surface-500)]">
                            <UsersIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="text-sm font-medium">No users assigned</p>
                            <p className="text-xs mt-1">Assign users to push this agent to their Oraya desktop.</p>
                        </div>
                    ) : (
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-[var(--surface-100)] border-b border-[var(--surface-200)]">
                                    <th className="px-4 py-2 text-left font-semibold text-[var(--surface-600)] uppercase tracking-wider">User</th>
                                    <th className="px-4 py-2 text-left font-semibold text-[var(--surface-600)] uppercase tracking-wider">Type</th>
                                    <th className="px-4 py-2 text-left font-semibold text-[var(--surface-600)] uppercase tracking-wider">Assigned</th>
                                    <th className="px-4 py-2 text-right font-semibold text-[var(--surface-600)] uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignments.map(a => (
                                    <tr
                                        key={a.id}
                                        className={`border-b border-[var(--surface-200)] last:border-0 hover:bg-[var(--surface-100)] transition-colors ${!a.is_active ? "opacity-40" : ""
                                            }`}
                                    >
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium text-[var(--surface-800)]">{a.user.full_name || "Unknown"}</p>
                                                <p className="text-[var(--surface-500)]">{a.user.email || a.user_id.substring(0, 12) + "..."}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full border ${a.assignment_type === "push"
                                                    ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                                                    : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                                }`}>
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
                        <div className="text-center py-10 text-[var(--surface-500)]">
                            <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="text-sm font-medium">No install events yet</p>
                            <p className="text-xs mt-1">Events appear when users install or uninstall this agent.</p>
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
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full ${event.event_type === "install"
                                                    ? "bg-emerald-500/15 text-emerald-400"
                                                    : "bg-red-500/15 text-red-400"
                                                }`}>
                                                {event.event_type === "install" ? "✓ Install" : "✕ Uninstall"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-[var(--surface-700)]">
                                            {event.device_name || event.device_id?.substring(0, 8) || "—"}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span className="flex items-center gap-1 text-[var(--surface-600)]">
                                                {osIcon(event.os_type)} {event.os_type || "—"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-[var(--surface-500)] font-mono">
                                            {event.app_version || "—"}
                                        </td>
                                        <td className="px-4 py-2.5 text-right text-[var(--surface-500)]">
                                            <span className="flex items-center gap-1 justify-end">
                                                <ClockIcon className="w-3 h-3" />
                                                {new Date(event.created_at).toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}
