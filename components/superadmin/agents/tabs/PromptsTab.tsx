"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Plus, Trash2, ChevronDown, ChevronUp,
    GripVertical, ToggleLeft, ToggleRight,
    AlertTriangle, Loader2, Layers,
    ShieldAlert, FileText, Wand2, MessageSquare,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PromptLayer {
    id: string;
    template_id: string;
    prompt_type: "system" | "guardrail" | "output_format" | "context_injection";
    label: string;
    content: string;
    priority: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface PromptsTabProps {
    templateId: string;
}

const PROMPT_TYPE_META: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
    system: {
        label: "System",
        color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        icon: <FileText className="w-3.5 h-3.5" />,
        description: "Additional system-level instructions layered on top of the core prompt",
    },
    guardrail: {
        label: "Guardrail",
        color: "bg-red-500/15 text-red-400 border-red-500/30",
        icon: <ShieldAlert className="w-3.5 h-3.5" />,
        description: "Behavioral boundaries and safety rules the agent must follow",
    },
    output_format: {
        label: "Output Format",
        color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        icon: <Wand2 className="w-3.5 h-3.5" />,
        description: "Response formatting directives (markdown, JSON, structured output)",
    },
    context_injection: {
        label: "Context Injection",
        color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        icon: <MessageSquare className="w-3.5 h-3.5" />,
        description: "Dynamic per-conversation context rules injected at inference time",
    },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function PromptsTab({ templateId }: PromptsTabProps) {
    const [prompts, setPrompts] = useState<PromptLayer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // New prompt form
    const [isCreating, setIsCreating] = useState(false);
    const [newType, setNewType] = useState<string>("system");
    const [newLabel, setNewLabel] = useState("");
    const [newContent, setNewContent] = useState("");
    const [newPriority, setNewPriority] = useState(0);
    const [createError, setCreateError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Inline editing state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState("");
    const [editContent, setEditContent] = useState("");
    const [editPriority, setEditPriority] = useState(0);
    const [editType, setEditType] = useState<string>("system");
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Delete state
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // ── Fetch ────────────────────────────────────────────────────────────────

    const fetchPrompts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/superadmin/agent-templates/${templateId}/prompts`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setPrompts(data.prompts || []);
        } catch (err: any) {
            setError(err.message || "Failed to load prompts");
        } finally {
            setIsLoading(false);
        }
    }, [templateId]);

    useEffect(() => { fetchPrompts(); }, [fetchPrompts]);

    // ── Create ───────────────────────────────────────────────────────────────

    const handleCreate = async () => {
        if (!newLabel.trim() || !newContent.trim()) {
            setCreateError("Label and content are required");
            return;
        }
        setIsSubmitting(true);
        setCreateError(null);
        try {
            const res = await fetch(`/api/superadmin/agent-templates/${templateId}/prompts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt_type: newType,
                    label: newLabel.trim(),
                    content: newContent.trim(),
                    priority: newPriority,
                    is_active: true,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `HTTP ${res.status}`);
            }
            setNewLabel("");
            setNewContent("");
            setNewPriority(0);
            setNewType("system");
            setIsCreating(false);
            await fetchPrompts();
        } catch (err: any) {
            setCreateError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Update ───────────────────────────────────────────────────────────────

    const startEditing = (prompt: PromptLayer) => {
        setEditingId(prompt.id);
        setEditLabel(prompt.label);
        setEditContent(prompt.content);
        setEditPriority(prompt.priority);
        setEditType(prompt.prompt_type);
        setExpandedId(prompt.id);
    };

    const cancelEditing = () => {
        setEditingId(null);
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        setIsSavingEdit(true);
        try {
            const res = await fetch(`/api/superadmin/agent-templates/${templateId}/prompts`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt_id: editingId,
                    updates: {
                        prompt_type: editType,
                        label: editLabel.trim(),
                        content: editContent.trim(),
                        priority: editPriority,
                    },
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `HTTP ${res.status}`);
            }
            setEditingId(null);
            await fetchPrompts();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSavingEdit(false);
        }
    };

    // ── Toggle Active ────────────────────────────────────────────────────────

    const handleToggleActive = async (prompt: PromptLayer) => {
        try {
            const res = await fetch(`/api/superadmin/agent-templates/${templateId}/prompts`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt_id: prompt.id,
                    updates: { is_active: !prompt.is_active },
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await fetchPrompts();
        } catch (err: any) {
            setError(err.message);
        }
    };

    // ── Delete ───────────────────────────────────────────────────────────────

    const handleDelete = async (promptId: string) => {
        setDeletingId(promptId);
        try {
            const res = await fetch(
                `/api/superadmin/agent-templates/${templateId}/prompts?prompt_id=${promptId}`,
                { method: "DELETE" }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await fetchPrompts();
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
                Loading prompt layers...
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--surface-700)] uppercase tracking-wider">
                        <Layers className="w-4 h-4" /> Prompt Stack
                    </h3>
                    <p className="text-xs text-[var(--surface-500)] mt-1">
                        Additional prompt layers stacked on top of the core prompt. Lower priority = earlier in context.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-all shadow-sm"
                >
                    <Plus className="w-3.5 h-3.5" /> Add Layer
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
                    <h4 className="text-sm font-semibold text-[var(--surface-800)]">New Prompt Layer</h4>

                    {/* Type Selector */}
                    <div className="grid grid-cols-2 gap-2">
                        {Object.entries(PROMPT_TYPE_META).map(([type, meta]) => (
                            <button
                                key={type}
                                onClick={() => setNewType(type)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${newType === type
                                        ? `${meta.color} ring-1 ring-current`
                                        : "bg-[var(--surface-100)] text-[var(--surface-600)] border-[var(--surface-300)] hover:bg-[var(--surface-200)]"
                                    }`}
                            >
                                {meta.icon} {meta.label}
                            </button>
                        ))}
                    </div>

                    <p className="text-xs text-[var(--surface-500)] italic">
                        {PROMPT_TYPE_META[newType]?.description}
                    </p>

                    <div className="space-y-2">
                        <input
                            value={newLabel}
                            onChange={e => setNewLabel(e.target.value)}
                            placeholder="Layer label (e.g. 'Code Review Safety Rails')"
                            className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-sm text-[var(--surface-900)] outline-none focus:border-[var(--primary)] transition-colors"
                        />
                        <textarea
                            value={newContent}
                            onChange={e => setNewContent(e.target.value)}
                            placeholder="Prompt content..."
                            rows={6}
                            className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-sm text-[var(--surface-900)] font-mono outline-none focus:border-[var(--primary)] resize-none transition-colors"
                            spellCheck={false}
                        />
                        <div className="flex items-center gap-3">
                            <label className="text-xs text-[var(--surface-600)] font-medium">Priority:</label>
                            <input
                                type="number"
                                value={newPriority}
                                onChange={e => setNewPriority(parseInt(e.target.value) || 0)}
                                className="w-20 px-2 py-1 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-sm text-[var(--surface-900)] outline-none focus:border-[var(--primary)]"
                            />
                            <span className="text-xs text-[var(--surface-500)]">Lower = earlier in prompt</span>
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
                            className="px-3 py-1.5 text-xs font-medium text-[var(--surface-600)] hover:text-[var(--surface-800)] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={isSubmitting || !newLabel.trim() || !newContent.trim()}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 disabled:opacity-50 transition-all"
                        >
                            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                            Create Layer
                        </button>
                    </div>
                </div>
            )}

            {/* Prompt Layers List */}
            {prompts.length === 0 && !isCreating ? (
                <div className="text-center py-12 text-[var(--surface-500)]">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">No prompt layers yet</p>
                    <p className="text-xs mt-1">The agent currently uses only the core prompt.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {prompts.map((prompt, idx) => {
                        const meta = PROMPT_TYPE_META[prompt.prompt_type] || PROMPT_TYPE_META.system;
                        const isExpanded = expandedId === prompt.id;
                        const isEditing = editingId === prompt.id;
                        const isDeleting = deletingId === prompt.id;

                        return (
                            <div
                                key={prompt.id}
                                className={`border rounded-xl transition-all ${prompt.is_active
                                        ? "border-[var(--surface-300)] bg-[var(--surface-50)]"
                                        : "border-[var(--surface-200)] bg-[var(--surface-100)] opacity-60"
                                    }`}
                            >
                                {/* Row header */}
                                <div
                                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--surface-100)] rounded-t-xl transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : prompt.id)}
                                >
                                    <GripVertical className="w-3.5 h-3.5 text-[var(--surface-400)] shrink-0" />
                                    <span className="text-xs font-mono text-[var(--surface-400)] w-5 shrink-0">{prompt.priority}</span>
                                    <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-semibold border rounded-full shrink-0 ${meta.color}`}>
                                        {meta.icon} {meta.label}
                                    </span>
                                    <span className="text-sm font-medium text-[var(--surface-800)] truncate">
                                        {prompt.label}
                                    </span>
                                    <div className="ml-auto flex items-center gap-2 shrink-0">
                                        {/* Toggle active */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleToggleActive(prompt); }}
                                            className="p-1 rounded-md hover:bg-[var(--surface-200)] transition-colors"
                                            title={prompt.is_active ? "Disable layer" : "Enable layer"}
                                        >
                                            {prompt.is_active
                                                ? <ToggleRight className="w-4 h-4 text-emerald-400" />
                                                : <ToggleLeft className="w-4 h-4 text-[var(--surface-400)]" />
                                            }
                                        </button>
                                        {/* Delete */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(prompt.id); }}
                                            disabled={isDeleting}
                                            className="p-1 rounded-md hover:bg-red-500/10 text-[var(--surface-400)] hover:text-red-400 transition-colors disabled:opacity-50"
                                            title="Delete layer"
                                        >
                                            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                        </button>
                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-[var(--surface-400)]" /> : <ChevronDown className="w-4 h-4 text-[var(--surface-400)]" />}
                                    </div>
                                </div>

                                {/* Expanded content */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 space-y-3 border-t border-[var(--surface-200)]">
                                        {isEditing ? (
                                            <>
                                                <div className="pt-3 space-y-3">
                                                    {/* Edit type */}
                                                    <div className="grid grid-cols-4 gap-1.5">
                                                        {Object.entries(PROMPT_TYPE_META).map(([type, m]) => (
                                                            <button
                                                                key={type}
                                                                onClick={() => setEditType(type)}
                                                                className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-all ${editType === type
                                                                        ? `${m.color} ring-1 ring-current`
                                                                        : "bg-[var(--surface-100)] text-[var(--surface-600)] border-[var(--surface-300)]"
                                                                    }`}
                                                            >
                                                                {m.icon} {m.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <input
                                                        value={editLabel}
                                                        onChange={e => setEditLabel(e.target.value)}
                                                        className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-sm text-[var(--surface-900)] outline-none focus:border-[var(--primary)]"
                                                        placeholder="Label..."
                                                    />
                                                    <textarea
                                                        value={editContent}
                                                        onChange={e => setEditContent(e.target.value)}
                                                        rows={8}
                                                        className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-sm text-[var(--surface-900)] font-mono outline-none focus:border-[var(--primary)] resize-none"
                                                        spellCheck={false}
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-xs text-[var(--surface-600)]">Priority:</label>
                                                        <input
                                                            type="number"
                                                            value={editPriority}
                                                            onChange={e => setEditPriority(parseInt(e.target.value) || 0)}
                                                            className="w-20 px-2 py-1 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-sm outline-none focus:border-[var(--primary)]"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={cancelEditing} className="px-3 py-1.5 text-xs text-[var(--surface-600)] hover:text-[var(--surface-800)]">
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleSaveEdit}
                                                        disabled={isSavingEdit}
                                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-[var(--primary)] text-white rounded-lg disabled:opacity-50"
                                                    >
                                                        {isSavingEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                                        Save Changes
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <pre className="mt-3 px-3 py-2.5 bg-[var(--surface-100)] rounded-lg text-xs text-[var(--surface-700)] font-mono whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                                                    {prompt.content}
                                                </pre>
                                                <div className="flex items-center justify-between text-xs text-[var(--surface-500)]">
                                                    <span>{prompt.content.length.toLocaleString()} chars · ~{Math.ceil(prompt.content.length / 4).toLocaleString()} tokens</span>
                                                    <button
                                                        onClick={() => startEditing(prompt)}
                                                        className="text-[var(--primary)] hover:underline font-medium"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                            </>
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
