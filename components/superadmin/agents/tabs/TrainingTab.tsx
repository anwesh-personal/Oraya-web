"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Plus, Trash2, ChevronDown, ChevronUp,
    ToggleLeft, ToggleRight,
    AlertTriangle, Loader2, BookOpen,
    ArrowRight, MessageSquare, Lightbulb, Tag,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Example {
    id: string;
    template_id: string;
    user_input: string;
    expected_output: string;
    explanation: string | null;
    tags: string[];
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

interface TrainingTabProps {
    templateId: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TrainingTab({ templateId }: TrainingTabProps) {
    const [examples, setExamples] = useState<Example[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Create state
    const [isCreating, setIsCreating] = useState(false);
    const [newInput, setNewInput] = useState("");
    const [newOutput, setNewOutput] = useState("");
    const [newExplanation, setNewExplanation] = useState("");
    const [newTags, setNewTags] = useState("");
    const [createError, setCreateError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editInput, setEditInput] = useState("");
    const [editOutput, setEditOutput] = useState("");
    const [editExplanation, setEditExplanation] = useState("");
    const [editTags, setEditTags] = useState("");
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Delete state
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // ── Fetch ────────────────────────────────────────────────────────────────

    const fetchExamples = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/superadmin/agent-templates/${templateId}/examples`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setExamples(data.examples || []);
        } catch (err: any) {
            setError(err.message || "Failed to load examples");
        } finally {
            setIsLoading(false);
        }
    }, [templateId]);

    useEffect(() => { fetchExamples(); }, [fetchExamples]);

    // ── Create ───────────────────────────────────────────────────────────────

    const handleCreate = async () => {
        if (!newInput.trim() || !newOutput.trim()) {
            setCreateError("User input and expected output are required");
            return;
        }
        setIsSubmitting(true);
        setCreateError(null);
        try {
            const res = await fetch(`/api/superadmin/agent-templates/${templateId}/examples`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_input: newInput.trim(),
                    expected_output: newOutput.trim(),
                    explanation: newExplanation.trim() || null,
                    tags: newTags.split(",").map(t => t.trim()).filter(Boolean),
                    is_active: true,
                    sort_order: examples.length,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `HTTP ${res.status}`);
            }
            setNewInput("");
            setNewOutput("");
            setNewExplanation("");
            setNewTags("");
            setIsCreating(false);
            await fetchExamples();
        } catch (err: any) {
            setCreateError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Edit ─────────────────────────────────────────────────────────────────

    const startEditing = (ex: Example) => {
        setEditingId(ex.id);
        setEditInput(ex.user_input);
        setEditOutput(ex.expected_output);
        setEditExplanation(ex.explanation || "");
        setEditTags((ex.tags || []).join(", "));
        setExpandedId(ex.id);
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        setIsSavingEdit(true);
        try {
            const res = await fetch(`/api/superadmin/agent-templates/${templateId}/examples`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    example_id: editingId,
                    updates: {
                        user_input: editInput.trim(),
                        expected_output: editOutput.trim(),
                        explanation: editExplanation.trim() || null,
                        tags: editTags.split(",").map(t => t.trim()).filter(Boolean),
                    },
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setEditingId(null);
            await fetchExamples();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSavingEdit(false);
        }
    };

    // ── Toggle Active ────────────────────────────────────────────────────────

    const handleToggleActive = async (ex: Example) => {
        try {
            const res = await fetch(`/api/superadmin/agent-templates/${templateId}/examples`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    example_id: ex.id,
                    updates: { is_active: !ex.is_active },
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await fetchExamples();
        } catch (err: any) {
            setError(err.message);
        }
    };

    // ── Delete ───────────────────────────────────────────────────────────────

    const handleDelete = async (exampleId: string) => {
        setDeletingId(exampleId);
        try {
            const res = await fetch(
                `/api/superadmin/agent-templates/${templateId}/examples?example_id=${exampleId}`,
                { method: "DELETE" }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await fetchExamples();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setDeletingId(null);
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16 text-[var(--surface-500)]">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading training examples...
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--surface-700)] uppercase tracking-wider">
                        <BookOpen className="w-4 h-4" /> Few-Shot Training
                    </h3>
                    <p className="text-xs text-[var(--surface-500)] mt-1">
                        Calibration examples: user input → ideal response. Injected into context at inference to shape behavior.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-all shadow-sm"
                >
                    <Plus className="w-3.5 h-3.5" /> Add Example
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">×</button>
                </div>
            )}

            {/* Create Form */}
            {isCreating && (
                <div className="border border-[var(--primary)]/30 bg-[var(--primary)]/5 rounded-xl p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-[var(--surface-800)]">New Training Example</h4>

                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-medium text-[var(--surface-600)] flex items-center gap-1 mb-1">
                                <MessageSquare className="w-3 h-3" /> User Input
                            </label>
                            <textarea
                                value={newInput}
                                onChange={e => setNewInput(e.target.value)}
                                placeholder="What the user would say..."
                                rows={3}
                                className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-sm text-[var(--surface-900)] outline-none focus:border-[var(--primary)] resize-none"
                            />
                        </div>

                        <div className="flex items-center justify-center">
                            <div className="flex items-center gap-1 text-[var(--surface-400)]">
                                <ArrowRight className="w-4 h-4" />
                                <span className="text-xs font-medium">should respond with</span>
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-[var(--surface-600)] flex items-center gap-1 mb-1">
                                <Lightbulb className="w-3 h-3" /> Expected Output
                            </label>
                            <textarea
                                value={newOutput}
                                onChange={e => setNewOutput(e.target.value)}
                                placeholder="The ideal agent response..."
                                rows={4}
                                className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-sm text-[var(--surface-900)] outline-none focus:border-[var(--primary)] resize-none"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-[var(--surface-600)] flex items-center gap-1 mb-1">
                                Explanation (internal, not shown to agent)
                            </label>
                            <textarea
                                value={newExplanation}
                                onChange={e => setNewExplanation(e.target.value)}
                                placeholder="Why this is the right response..."
                                rows={2}
                                className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-sm text-[var(--surface-900)] outline-none focus:border-[var(--primary)] resize-none"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-[var(--surface-600)] flex items-center gap-1 mb-1">
                                <Tag className="w-3 h-3" /> Tags (comma-separated)
                            </label>
                            <input
                                value={newTags}
                                onChange={e => setNewTags(e.target.value)}
                                placeholder="code-review, typescript, error-handling"
                                className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-sm text-[var(--surface-900)] outline-none focus:border-[var(--primary)]"
                            />
                        </div>
                    </div>

                    {createError && (
                        <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {createError}
                        </p>
                    )}

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => { setIsCreating(false); setCreateError(null); }}
                            className="px-3 py-1.5 text-xs font-medium text-[var(--surface-600)] hover:text-[var(--surface-800)]"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={isSubmitting || !newInput.trim() || !newOutput.trim()}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 disabled:opacity-50 transition-all"
                        >
                            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                            Create Example
                        </button>
                    </div>
                </div>
            )}

            {/* Examples List */}
            {examples.length === 0 && !isCreating ? (
                <div className="text-center py-12 text-[var(--surface-500)]">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">No training examples yet</p>
                    <p className="text-xs mt-1">Add examples to calibrate the agent&apos;s response style.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {examples.map((ex, idx) => {
                        const isExpanded = expandedId === ex.id;
                        const isEditing = editingId === ex.id;
                        const isDeleting = deletingId === ex.id;

                        return (
                            <div
                                key={ex.id}
                                className={`border rounded-xl transition-all ${ex.is_active
                                        ? "border-[var(--surface-300)] bg-[var(--surface-50)]"
                                        : "border-[var(--surface-200)] bg-[var(--surface-100)] opacity-60"
                                    }`}
                            >
                                {/* Row header */}
                                <div
                                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--surface-100)] rounded-t-xl transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : ex.id)}
                                >
                                    <span className="text-xs font-mono text-[var(--surface-400)] w-5 shrink-0">#{idx + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-[var(--surface-800)] truncate">{ex.user_input}</p>
                                        {ex.tags && ex.tags.length > 0 && (
                                            <div className="flex gap-1 mt-1">
                                                {ex.tags.slice(0, 3).map(tag => (
                                                    <span key={tag} className="px-1.5 py-0.5 text-[10px] font-medium bg-[var(--primary)]/10 text-[var(--primary)] rounded">
                                                        {tag}
                                                    </span>
                                                ))}
                                                {ex.tags.length > 3 && (
                                                    <span className="text-[10px] text-[var(--surface-500)]">+{ex.tags.length - 3}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleToggleActive(ex); }}
                                            className="p-1 rounded-md hover:bg-[var(--surface-200)] transition-colors"
                                        >
                                            {ex.is_active
                                                ? <ToggleRight className="w-4 h-4 text-emerald-400" />
                                                : <ToggleLeft className="w-4 h-4 text-[var(--surface-400)]" />}
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(ex.id); }}
                                            disabled={isDeleting}
                                            className="p-1 rounded-md hover:bg-red-500/10 text-[var(--surface-400)] hover:text-red-400 transition-colors disabled:opacity-50"
                                        >
                                            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                        </button>
                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-[var(--surface-400)]" /> : <ChevronDown className="w-4 h-4 text-[var(--surface-400)]" />}
                                    </div>
                                </div>

                                {/* Expanded */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 space-y-3 border-t border-[var(--surface-200)]">
                                        {isEditing ? (
                                            <div className="pt-3 space-y-3">
                                                <div>
                                                    <label className="text-xs font-medium text-[var(--surface-600)] mb-1 block">User Input</label>
                                                    <textarea
                                                        value={editInput}
                                                        onChange={e => setEditInput(e.target.value)}
                                                        rows={3}
                                                        className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-sm text-[var(--surface-900)] outline-none focus:border-[var(--primary)] resize-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-[var(--surface-600)] mb-1 block">Expected Output</label>
                                                    <textarea
                                                        value={editOutput}
                                                        onChange={e => setEditOutput(e.target.value)}
                                                        rows={5}
                                                        className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-sm text-[var(--surface-900)] outline-none focus:border-[var(--primary)] resize-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-[var(--surface-600)] mb-1 block">Explanation (internal)</label>
                                                    <textarea
                                                        value={editExplanation}
                                                        onChange={e => setEditExplanation(e.target.value)}
                                                        rows={2}
                                                        className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-sm text-[var(--surface-900)] outline-none focus:border-[var(--primary)] resize-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-[var(--surface-600)] mb-1 block">Tags</label>
                                                    <input
                                                        value={editTags}
                                                        onChange={e => setEditTags(e.target.value)}
                                                        className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-sm text-[var(--surface-900)] outline-none focus:border-[var(--primary)]"
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs text-[var(--surface-600)]">Cancel</button>
                                                    <button
                                                        onClick={handleSaveEdit}
                                                        disabled={isSavingEdit}
                                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-[var(--primary)] text-white rounded-lg disabled:opacity-50"
                                                    >
                                                        {isSavingEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="pt-3 space-y-3">
                                                {/* Input → Output display */}
                                                <div className="grid gap-2">
                                                    <div>
                                                        <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">User</span>
                                                        <div className="mt-1 px-3 py-2 bg-blue-500/5 border border-blue-500/15 rounded-lg text-sm text-[var(--surface-800)]">
                                                            {ex.user_input}
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-center">
                                                        <ArrowRight className="w-4 h-4 text-[var(--surface-400)] rotate-90" />
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Agent</span>
                                                        <div className="mt-1 px-3 py-2 bg-emerald-500/5 border border-emerald-500/15 rounded-lg text-sm text-[var(--surface-800)]">
                                                            {ex.expected_output}
                                                        </div>
                                                    </div>
                                                </div>

                                                {ex.explanation && (
                                                    <div className="px-3 py-2 bg-amber-500/5 border border-amber-500/15 rounded-lg">
                                                        <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Why</span>
                                                        <p className="text-xs text-[var(--surface-700)] mt-1">{ex.explanation}</p>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-end">
                                                    <button
                                                        onClick={() => startEditing(ex)}
                                                        className="text-xs text-[var(--primary)] hover:underline font-medium"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
