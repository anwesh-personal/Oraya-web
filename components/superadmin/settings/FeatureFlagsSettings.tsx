"use client";

import { useState } from "react";
import {
    Plus, Trash2, X, Save, Loader2, Check, AlertCircle,
    ToggleLeft, ToggleRight, Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useFeatureFlags, CreateFeatureFlagInput } from "@/hooks/useFeatureFlags";
import { usePlans } from "@/hooks/usePlans";

// ─── New Flag Modal ───────────────────────────────────────────────────────────

const BLANK_NEW_FLAG: CreateFeatureFlagInput = {
    feature_key: "",
    feature_name: "",
    description: "",
    is_enabled: false,
    rollout_percentage: 0,
    enabled_for_plans: [],
    enabled_for_users: [],
    tags: [],
    category: "general",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function FeatureFlagsSettings() {
    const {
        flags,
        loading: flagsLoading,
        error: flagsError,
        refetch,
        toggleEnabled,
        togglePlan,
        createFlag,
        deleteFlag,
    } = useFeatureFlags();

    // All active plans — columns in the matrix
    const { plans, loading: plansLoading } = usePlans({ activeOnly: true });

    // New flag modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newFlag, setNewFlag] = useState<CreateFeatureFlagInput>(BLANK_NEW_FLAG);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Inline pending actions — track which cells are mid-request
    const [pendingCells, setPendingCells] = useState<Set<string>>(new Set());

    // Category filter
    const [filterCategory, setFilterCategory] = useState("all");
    const categories = ["all", ...Array.from(new Set(flags.map((f) => f.category).filter(Boolean)))];

    const displayed = filterCategory === "all"
        ? flags
        : flags.filter((f) => f.category === filterCategory);

    // ── Handlers ────────────────────────────────────────────────────────────

    const handleToggleEnabled = async (flagId: string, current: boolean) => {
        const key = `enabled-${flagId}`;
        setPendingCells((s) => new Set(s).add(key));
        try {
            await toggleEnabled(flagId, current);
            toast.success(`Feature ${current ? "disabled" : "enabled"}`);
        } catch (e: any) {
            toast.error(e.message ?? "Failed to toggle feature");
        } finally {
            setPendingCells((s) => { const n = new Set(s); n.delete(key); return n; });
        }
    };

    const handleTogglePlan = async (flagId: string, planId: string, currentPlans: string[]) => {
        const key = `plan-${flagId}-${planId}`;
        setPendingCells((s) => new Set(s).add(key));
        try {
            await togglePlan(flagId, planId, currentPlans);
        } catch (e: any) {
            toast.error(e.message ?? "Failed to update flag");
        } finally {
            setPendingCells((s) => { const n = new Set(s); n.delete(key); return n; });
        }
    };

    const handleCreate = async () => {
        if (!newFlag.feature_key.trim() || !newFlag.feature_name.trim()) {
            setCreateError("Key and name are required");
            return;
        }
        setCreating(true);
        setCreateError("");
        try {
            await createFlag(newFlag);
            toast.success(`Feature flag "${newFlag.feature_name}" created`);
            setShowCreateModal(false);
            setNewFlag(BLANK_NEW_FLAG);
        } catch (e: any) {
            setCreateError(e.message ?? "Failed to create flag");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteFlag(deleteTarget);
            toast.success("Feature flag deleted");
            setDeleteTarget(null);
        } catch (e: any) {
            toast.error(e.message ?? "Failed to delete flag");
        } finally {
            setDeleting(false);
        }
    };

    // ── Loading / Error states ───────────────────────────────────────────────

    if (flagsLoading || plansLoading) {
        return (
            <div className="flex items-center justify-center py-20 gap-3 text-[var(--surface-500)]">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading feature flags…
            </div>
        );
    }

    if (flagsError) {
        return (
            <div className="flex items-center gap-3 p-5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div>
                    <p className="font-medium">Failed to load feature flags</p>
                    <p className="text-sm opacity-75">{flagsError}</p>
                </div>
                <button
                    onClick={refetch}
                    className="ml-auto text-sm underline hover:opacity-80 transition-opacity"
                >
                    Retry
                </button>
            </div>
        );
    }

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-[var(--surface-900)]">Feature Flags</h3>
                    <p className="text-sm text-[var(--surface-500)] mt-1">
                        Control which features are available per subscription plan. Changes take effect on next license refresh.
                    </p>
                </div>
                <button
                    onClick={() => { setShowCreateModal(true); setCreateError(""); setNewFlag(BLANK_NEW_FLAG); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium transition-all shadow-lg hover:shadow-xl"
                    style={{ background: "var(--gradient-primary)", boxShadow: "0 4px 20px -4px var(--primary-glow)" }}
                >
                    <Plus className="w-4 h-4" />
                    Add Flag
                </button>
            </div>

            {/* Category filter */}
            {categories.length > 2 && (
                <div className="flex gap-2 flex-wrap">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={cn(
                                "px-3 py-1 rounded-full text-xs font-medium capitalize transition-all border",
                                filterCategory === cat
                                    ? "bg-[var(--primary)]/15 text-[var(--primary)] border-[var(--primary)]/30"
                                    : "bg-transparent text-[var(--surface-500)] border-[var(--surface-200)] hover:border-[var(--surface-300)]"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* Matrix table */}
            <div className="rounded-2xl border border-[var(--surface-200)] bg-[var(--surface-50)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[var(--surface-200)] bg-[var(--surface-100)]/60">
                                <th className="px-5 py-3.5 text-left font-semibold text-[var(--surface-700)] min-w-[260px]">
                                    Feature
                                </th>
                                <th className="px-4 py-3.5 text-center font-semibold text-[var(--surface-700)] w-24">
                                    Global
                                </th>
                                {plans.map((plan) => (
                                    <th
                                        key={plan.id}
                                        className="px-4 py-3.5 text-center font-semibold text-[var(--surface-700)] w-28"
                                    >
                                        {plan.name}
                                    </th>
                                ))}
                                <th className="px-4 py-3.5 w-12" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--surface-200)]">
                            {displayed.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={3 + plans.length}
                                        className="px-5 py-12 text-center text-[var(--surface-400)]"
                                    >
                                        No feature flags configured.{" "}
                                        <button
                                            onClick={() => setShowCreateModal(true)}
                                            className="text-[var(--primary)] hover:underline font-medium"
                                        >
                                            Add one.
                                        </button>
                                    </td>
                                </tr>
                            )}
                            {displayed.map((flag) => (
                                <tr
                                    key={flag.id}
                                    className="group hover:bg-[var(--surface-100)]/60 transition-colors"
                                >
                                    {/* Feature info */}
                                    <td className="px-5 py-4">
                                        <p className="font-medium text-[var(--surface-900)]">
                                            {flag.feature_name}
                                        </p>
                                        {flag.description && (
                                            <p className="text-xs text-[var(--surface-500)] mt-0.5">
                                                {flag.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <code className="text-[10px] font-mono text-[var(--surface-400)] bg-[var(--surface-100)] px-1.5 py-0.5 rounded">
                                                {flag.feature_key}
                                            </code>
                                            {flag.rollout_percentage > 0 && flag.rollout_percentage < 100 && (
                                                <span className="text-[10px] text-amber-500 font-medium">
                                                    {flag.rollout_percentage}% rollout
                                                </span>
                                            )}
                                            {flag.category !== "general" && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--surface-100)] text-[var(--surface-500)] capitalize">
                                                    {flag.category}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Global toggle (is_enabled) */}
                                    <td className="px-4 py-4 text-center">
                                        <button
                                            onClick={() => handleToggleEnabled(flag.id, flag.is_enabled)}
                                            disabled={pendingCells.has(`enabled-${flag.id}`)}
                                            className={cn(
                                                "mx-auto flex items-center justify-center w-9 h-9 rounded-xl transition-all",
                                                flag.is_enabled
                                                    ? "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25"
                                                    : "bg-[var(--surface-100)] text-[var(--surface-400)] hover:bg-[var(--surface-200)]",
                                                "disabled:opacity-40 disabled:cursor-not-allowed"
                                            )}
                                            title={flag.is_enabled ? "Globally enabled — click to disable" : "Globally disabled — click to enable"}
                                        >
                                            {pendingCells.has(`enabled-${flag.id}`) ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : flag.is_enabled ? (
                                                <ToggleRight className="w-5 h-5" />
                                            ) : (
                                                <ToggleLeft className="w-5 h-5" />
                                            )}
                                        </button>
                                    </td>

                                    {/* Per-plan toggles — one column per active plan */}
                                    {plans.map((plan) => {
                                        const isOn = flag.enabled_for_plans.includes(plan.id);
                                        const cellKey = `plan-${flag.id}-${plan.id}`;
                                        const isPending = pendingCells.has(cellKey);
                                        return (
                                            <td key={plan.id} className="px-4 py-4 text-center">
                                                <button
                                                    onClick={() =>
                                                        handleTogglePlan(flag.id, plan.id, flag.enabled_for_plans)
                                                    }
                                                    disabled={isPending}
                                                    className={cn(
                                                        "mx-auto flex items-center justify-center w-8 h-8 rounded-lg transition-all",
                                                        isOn
                                                            ? "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25"
                                                            : "bg-[var(--surface-100)] text-[var(--surface-300)] hover:bg-[var(--surface-200)] hover:text-[var(--surface-500)]",
                                                        "disabled:opacity-40 disabled:cursor-not-allowed"
                                                    )}
                                                    title={`${isOn ? "Remove from" : "Add to"} ${plan.name}`}
                                                >
                                                    {isPending ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : isOn ? (
                                                        <Check className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <X className="w-3.5 h-3.5 opacity-30" />
                                                    )}
                                                </button>
                                            </td>
                                        );
                                    })}

                                    {/* Delete */}
                                    <td className="px-4 py-4 text-center">
                                        <button
                                            onClick={() => setDeleteTarget(flag.id)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--surface-400)] hover:bg-red-500/10 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                                            title="Delete flag"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <p className="text-xs text-[var(--surface-400)]">
                <strong>Global toggle</strong> = feature on/off for everyone regardless of plan.{" "}
                <strong>Plan columns</strong> = feature accessible to users on that specific plan (in addition to tier hierarchy).
            </p>

            {/* ── Create Modal ──────────────────────────────────────────────── */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[var(--surface-50)] rounded-2xl border border-[var(--surface-200)] shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-[var(--surface-200)]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-[var(--primary)]/10">
                                    <Tag className="w-4 h-4 text-[var(--primary)]" />
                                </div>
                                <h2 className="text-base font-semibold text-[var(--surface-900)]">New Feature Flag</h2>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 rounded-lg hover:bg-[var(--surface-200)] transition-colors"
                            >
                                <X className="w-4 h-4 text-[var(--surface-500)]" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            {createError && (
                                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    {createError}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">
                                        Key <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newFlag.feature_key}
                                        onChange={(e) =>
                                            setNewFlag((f) => ({
                                                ...f,
                                                feature_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
                                            }))
                                        }
                                        placeholder="my_feature"
                                        className="w-full px-3 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] font-mono text-sm placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                                    />
                                    <p className="text-[10px] text-[var(--surface-400)] mt-1">snake_case only</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">
                                        Name <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newFlag.feature_name}
                                        onChange={(e) => setNewFlag((f) => ({ ...f, feature_name: e.target.value }))}
                                        placeholder="My Feature"
                                        className="w-full px-3 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] text-sm placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    value={newFlag.description ?? ""}
                                    onChange={(e) => setNewFlag((f) => ({ ...f, description: e.target.value }))}
                                    placeholder="What does this feature do?"
                                    className="w-full px-3 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] text-sm placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">
                                        Category
                                    </label>
                                    <input
                                        type="text"
                                        value={newFlag.category ?? "general"}
                                        onChange={(e) => setNewFlag((f) => ({ ...f, category: e.target.value }))}
                                        placeholder="general"
                                        className="w-full px-3 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] text-sm placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">
                                        Rollout %
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={newFlag.rollout_percentage ?? 0}
                                        onChange={(e) =>
                                            setNewFlag((f) => ({
                                                ...f,
                                                rollout_percentage: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)),
                                            }))
                                        }
                                        className="w-full px-3 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newFlag.is_enabled ?? false}
                                    onChange={(e) => setNewFlag((f) => ({ ...f, is_enabled: e.target.checked }))}
                                    className="w-4 h-4 rounded border-[var(--surface-300)] text-[var(--primary)]"
                                />
                                <span className="text-sm text-[var(--surface-700)]">Enable globally on creation</span>
                            </label>
                        </div>

                        <div className="flex items-center justify-end gap-3 p-5 border-t border-[var(--surface-200)]">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 rounded-xl text-[var(--surface-600)] hover:bg-[var(--surface-100)] transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={creating}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl text-white font-medium text-sm transition-all disabled:opacity-50"
                                style={{ background: "var(--gradient-primary)" }}
                            >
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Create Flag
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation ───────────────────────────────────────── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[var(--surface-50)] rounded-2xl border border-[var(--surface-200)] shadow-2xl w-full max-w-sm p-6">
                        <h3 className="text-base font-semibold text-[var(--surface-900)] mb-2">Delete Feature Flag?</h3>
                        <p className="text-sm text-[var(--surface-500)] mb-6">
                            This cannot be undone. Remove any code references to this flag before deleting.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 px-4 py-2 rounded-xl border border-[var(--surface-200)] text-[var(--surface-700)] hover:bg-[var(--surface-100)] transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
