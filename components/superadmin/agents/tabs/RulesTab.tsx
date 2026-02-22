"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Plus, Trash2, AlertTriangle, Loader2,
    ScrollText, ShieldCheck, ShieldOff, Star,
    CheckCircle2, XCircle, ThumbsUp, ThumbsDown,
    ToggleLeft, ToggleRight,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Rule {
    id: string;
    template_id: string;
    rule_type: "must_do" | "must_not" | "prefer" | "avoid";
    content: string;
    category: string | null;
    severity: "critical" | "important" | "suggestion";
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

interface RulesTabProps {
    templateId: string;
}

const RULE_TYPE_META: Record<string, { label: string; color: string; icon: React.ReactNode; prefix: string }> = {
    must_do: {
        label: "Must Do",
        color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        prefix: "✅ ALWAYS:",
    },
    must_not: {
        label: "Must Not",
        color: "bg-red-500/15 text-red-400 border-red-500/30",
        icon: <XCircle className="w-3.5 h-3.5" />,
        prefix: "🚫 NEVER:",
    },
    prefer: {
        label: "Prefer",
        color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        icon: <ThumbsUp className="w-3.5 h-3.5" />,
        prefix: "👍 PREFER:",
    },
    avoid: {
        label: "Avoid",
        color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        icon: <ThumbsDown className="w-3.5 h-3.5" />,
        prefix: "⚠️ AVOID:",
    },
};

const SEVERITY_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    critical: {
        label: "Critical",
        color: "text-red-400",
        icon: <ShieldOff className="w-3 h-3" />,
    },
    important: {
        label: "Important",
        color: "text-amber-400",
        icon: <ShieldCheck className="w-3 h-3" />,
    },
    suggestion: {
        label: "Suggestion",
        color: "text-blue-400",
        icon: <Star className="w-3 h-3" />,
    },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function RulesTab({ templateId }: RulesTabProps) {
    const [rules, setRules] = useState<Rule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Create state
    const [isCreating, setIsCreating] = useState(false);
    const [newType, setNewType] = useState<string>("must_do");
    const [newContent, setNewContent] = useState("");
    const [newCategory, setNewCategory] = useState("");
    const [newSeverity, setNewSeverity] = useState<string>("important");
    const [createError, setCreateError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editType, setEditType] = useState<string>("must_do");
    const [editContent, setEditContent] = useState("");
    const [editCategory, setEditCategory] = useState("");
    const [editSeverity, setEditSeverity] = useState<string>("important");
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Delete state
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // ── Fetch ────────────────────────────────────────────────────────────────

    const fetchRules = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/superadmin/agent-templates/${templateId}/rules`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setRules(data.rules || []);
        } catch (err: any) {
            setError(err.message || "Failed to load rules");
        } finally {
            setIsLoading(false);
        }
    }, [templateId]);

    useEffect(() => { fetchRules(); }, [fetchRules]);

    // ── Create ───────────────────────────────────────────────────────────────

    const handleCreate = async () => {
        if (!newContent.trim()) {
            setCreateError("Rule content is required");
            return;
        }
        setIsSubmitting(true);
        setCreateError(null);
        try {
            const res = await fetch(`/api/superadmin/agent-templates/${templateId}/rules`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rule_type: newType,
                    content: newContent.trim(),
                    category: newCategory.trim() || null,
                    severity: newSeverity,
                    is_active: true,
                    sort_order: rules.length,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `HTTP ${res.status}`);
            }
            setNewContent("");
            setNewCategory("");
            setNewType("must_do");
            setNewSeverity("important");
            setIsCreating(false);
            await fetchRules();
        } catch (err: any) {
            setCreateError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Edit ─────────────────────────────────────────────────────────────────

    const startEditing = (rule: Rule) => {
        setEditingId(rule.id);
        setEditType(rule.rule_type);
        setEditContent(rule.content);
        setEditCategory(rule.category || "");
        setEditSeverity(rule.severity);
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        setIsSavingEdit(true);
        try {
            const res = await fetch(`/api/superadmin/agent-templates/${templateId}/rules`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rule_id: editingId,
                    updates: {
                        rule_type: editType,
                        content: editContent.trim(),
                        category: editCategory.trim() || null,
                        severity: editSeverity,
                    },
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setEditingId(null);
            await fetchRules();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSavingEdit(false);
        }
    };

    // ── Toggle Active ────────────────────────────────────────────────────────

    const handleToggleActive = async (rule: Rule) => {
        try {
            const res = await fetch(`/api/superadmin/agent-templates/${templateId}/rules`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rule_id: rule.id,
                    updates: { is_active: !rule.is_active },
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await fetchRules();
        } catch (err: any) {
            setError(err.message);
        }
    };

    // ── Delete ───────────────────────────────────────────────────────────────

    const handleDelete = async (ruleId: string) => {
        setDeletingId(ruleId);
        try {
            const res = await fetch(
                `/api/superadmin/agent-templates/${templateId}/rules?rule_id=${ruleId}`,
                { method: "DELETE" }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await fetchRules();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setDeletingId(null);
        }
    };

    // ── Group rules by type ──────────────────────────────────────────────────

    const groupedRules = Object.keys(RULE_TYPE_META).map(type => ({
        type,
        meta: RULE_TYPE_META[type],
        rules: rules.filter(r => r.rule_type === type),
    })).filter(g => g.rules.length > 0 || isCreating);

    // ── Render ───────────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16 text-[var(--surface-500)]">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading behavioral rules...
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--surface-700)] uppercase tracking-wider">
                        <ScrollText className="w-4 h-4" /> Behavioral Rules
                    </h3>
                    <p className="text-xs text-[var(--surface-500)] mt-1">
                        Structured guardrails compiled into a rules block appended to the prompt.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-all shadow-sm"
                >
                    <Plus className="w-3.5 h-3.5" /> Add Rule
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto">×</button>
                </div>
            )}

            {/* Create Form */}
            {isCreating && (
                <div className="border border-[var(--primary)]/30 bg-[var(--primary)]/5 rounded-xl p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-[var(--surface-800)]">New Rule</h4>

                    {/* Type + Severity selectors */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-[var(--surface-600)]">Type</label>
                        <div className="grid grid-cols-4 gap-1.5">
                            {Object.entries(RULE_TYPE_META).map(([type, meta]) => (
                                <button
                                    key={type}
                                    onClick={() => setNewType(type)}
                                    className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-all ${newType === type
                                            ? `${meta.color} ring-1 ring-current`
                                            : "bg-[var(--surface-100)] text-[var(--surface-600)] border-[var(--surface-300)]"
                                        }`}
                                >
                                    {meta.icon} {meta.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-[var(--surface-600)]">Severity</label>
                        <div className="flex gap-2">
                            {Object.entries(SEVERITY_META).map(([sev, meta]) => (
                                <button
                                    key={sev}
                                    onClick={() => setNewSeverity(sev)}
                                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${newSeverity === sev
                                            ? `${meta.color} border-current bg-current/10 ring-1 ring-current`
                                            : "text-[var(--surface-600)] border-[var(--surface-300)] bg-[var(--surface-100)]"
                                        }`}
                                >
                                    {meta.icon} {meta.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <textarea
                        value={newContent}
                        onChange={e => setNewContent(e.target.value)}
                        placeholder="Rule content (e.g. 'Always cite sources when making factual claims')"
                        rows={3}
                        className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-sm text-[var(--surface-900)] outline-none focus:border-[var(--primary)] resize-none"
                    />

                    <input
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value)}
                        placeholder="Category (e.g. 'safety', 'formatting', 'accuracy')"
                        className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-sm text-[var(--surface-900)] outline-none focus:border-[var(--primary)]"
                    />

                    {createError && (
                        <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {createError}
                        </p>
                    )}

                    <div className="flex justify-end gap-2">
                        <button onClick={() => { setIsCreating(false); setCreateError(null); }} className="px-3 py-1.5 text-xs text-[var(--surface-600)]">
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={isSubmitting || !newContent.trim()}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[var(--primary)] text-white rounded-lg disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                            Create Rule
                        </button>
                    </div>
                </div>
            )}

            {/* Rules grouped by type */}
            {rules.length === 0 && !isCreating ? (
                <div className="text-center py-12 text-[var(--surface-500)]">
                    <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">No behavioral rules defined</p>
                    <p className="text-xs mt-1">Add rules to enforce agent behavior guardrails.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {groupedRules.map(({ type, meta, rules: groupRules }) => (
                        <div key={type}>
                            <h4 className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2 ${RULE_TYPE_META[type].color.split(" ")[1]}`}>
                                {meta.icon} {meta.label}
                                <span className="text-[var(--surface-400)] font-normal">({groupRules.length})</span>
                            </h4>
                            <div className="space-y-1.5">
                                {groupRules.map(rule => {
                                    const sevMeta = SEVERITY_META[rule.severity] || SEVERITY_META.important;
                                    const isEditing = editingId === rule.id;
                                    const isDeleting = deletingId === rule.id;

                                    if (isEditing) {
                                        return (
                                            <div key={rule.id} className="border border-[var(--primary)]/30 rounded-lg p-3 space-y-2 bg-[var(--primary)]/5">
                                                <div className="grid grid-cols-4 gap-1">
                                                    {Object.entries(RULE_TYPE_META).map(([t, m]) => (
                                                        <button
                                                            key={t}
                                                            onClick={() => setEditType(t)}
                                                            className={`flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px] font-medium border ${editType === t ? `${m.color} ring-1 ring-current` : "bg-[var(--surface-100)] text-[var(--surface-600)] border-[var(--surface-300)]"
                                                                }`}
                                                        >
                                                            {m.icon} {m.label}
                                                        </button>
                                                    ))}
                                                </div>
                                                <textarea
                                                    value={editContent}
                                                    onChange={e => setEditContent(e.target.value)}
                                                    rows={2}
                                                    className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-sm outline-none focus:border-[var(--primary)] resize-none"
                                                />
                                                <div className="flex gap-2">
                                                    {Object.entries(SEVERITY_META).map(([s, m]) => (
                                                        <button
                                                            key={s}
                                                            onClick={() => setEditSeverity(s)}
                                                            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border ${editSeverity === s ? `${m.color} border-current bg-current/10` : "text-[var(--surface-600)] border-[var(--surface-300)]"
                                                                }`}
                                                        >
                                                            {m.icon} {m.label}
                                                        </button>
                                                    ))}
                                                </div>
                                                <input
                                                    value={editCategory}
                                                    onChange={e => setEditCategory(e.target.value)}
                                                    placeholder="Category (optional)"
                                                    className="w-full px-3 py-1.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-xs outline-none focus:border-[var(--primary)]"
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setEditingId(null)} className="px-2 py-1 text-xs text-[var(--surface-600)]">Cancel</button>
                                                    <button
                                                        onClick={handleSaveEdit}
                                                        disabled={isSavingEdit}
                                                        className="flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-[var(--primary)] text-white rounded-lg disabled:opacity-50"
                                                    >
                                                        {isSavingEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Save
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            key={rule.id}
                                            className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border transition-all group ${rule.is_active
                                                    ? "border-[var(--surface-200)] bg-[var(--surface-50)] hover:bg-[var(--surface-100)]"
                                                    : "border-[var(--surface-200)] bg-[var(--surface-100)] opacity-50"
                                                }`}
                                        >
                                            <span className={`shrink-0 mt-0.5 ${sevMeta.color}`}>{sevMeta.icon}</span>
                                            <p className="flex-1 text-sm text-[var(--surface-800)] leading-relaxed">{rule.content}</p>
                                            {rule.category && (
                                                <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-[var(--surface-200)] text-[var(--surface-600)] rounded">
                                                    {rule.category}
                                                </span>
                                            )}
                                            <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => startEditing(rule)} className="p-0.5 text-[var(--surface-400)] hover:text-[var(--primary)]" title="Edit">
                                                    <ScrollText className="w-3 h-3" />
                                                </button>
                                                <button onClick={() => handleToggleActive(rule)} className="p-0.5" title={rule.is_active ? "Disable" : "Enable"}>
                                                    {rule.is_active ? <ToggleRight className="w-3.5 h-3.5 text-emerald-400" /> : <ToggleLeft className="w-3.5 h-3.5 text-[var(--surface-400)]" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(rule.id)}
                                                    disabled={isDeleting}
                                                    className="p-0.5 text-[var(--surface-400)] hover:text-red-400 disabled:opacity-50"
                                                    title="Delete"
                                                >
                                                    {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Compiled Preview */}
            {rules.length > 0 && (
                <div className="border-t border-[var(--surface-200)] pt-4">
                    <h4 className="text-xs font-semibold text-[var(--surface-600)] uppercase tracking-wider mb-2">
                        Compiled Preview (as injected into prompt)
                    </h4>
                    <pre className="px-3 py-2.5 bg-[var(--surface-100)] rounded-lg text-xs text-[var(--surface-700)] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {rules
                            .filter(r => r.is_active)
                            .map(r => {
                                const meta = RULE_TYPE_META[r.rule_type];
                                return `${meta?.prefix || ""} ${r.content}`;
                            })
                            .join("\n")}
                    </pre>
                </div>
            )}
        </div>
    );
}
