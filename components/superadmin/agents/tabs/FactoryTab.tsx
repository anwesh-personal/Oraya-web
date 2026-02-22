"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Plus, Trash2, AlertTriangle, Loader2,
    Brain, Upload, Package, Sparkles,
    BookKey, Lightbulb, Cog, MessageSquare,
    Eye, SlidersHorizontal, Rocket,
    ToggleLeft, ToggleRight, ChevronDown, ChevronUp,
    Clock,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FactoryMemory {
    id: string;
    template_id: string;
    factory_id: string;
    category: "personality" | "skill" | "knowledge" | "rule" | "context" | "preference" | "example";
    content: string;
    importance: number;
    tags: string[];
    version_added: number;
    version_removed: number | null;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface FactoryTabProps {
    templateId: string;
}

const CATEGORY_META: Record<string, { label: string; color: string; icon: React.ReactNode; hint: string }> = {
    personality: {
        label: "Personality",
        color: "bg-purple-500/15 text-purple-400 border-purple-500/30",
        icon: <Sparkles className="w-3.5 h-3.5" />,
        hint: "Define who the agent IS — core traits, approach, temperament",
    },
    skill: {
        label: "Skill",
        color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        icon: <Cog className="w-3.5 h-3.5" />,
        hint: "Technical capabilities and domain expertise",
    },
    knowledge: {
        label: "Knowledge",
        color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        icon: <BookKey className="w-3.5 h-3.5" />,
        hint: "Factual information the agent should know",
    },
    rule: {
        label: "Rule",
        color: "bg-red-500/15 text-red-400 border-red-500/30",
        icon: <Eye className="w-3.5 h-3.5" />,
        hint: "Behavioral constraints enforced in memory",
    },
    context: {
        label: "Context",
        color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        icon: <MessageSquare className="w-3.5 h-3.5" />,
        hint: "Environmental facts: who created this, what platform is this",
    },
    preference: {
        label: "Preference",
        color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
        icon: <SlidersHorizontal className="w-3.5 h-3.5" />,
        hint: "Soft preferences for output style and interaction patterns",
    },
    example: {
        label: "Example",
        color: "bg-pink-500/15 text-pink-400 border-pink-500/30",
        icon: <Lightbulb className="w-3.5 h-3.5" />,
        hint: "Example patterns stored as memories for retrieval",
    },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function FactoryTab({ templateId }: FactoryTabProps) {
    const [memories, setMemories] = useState<FactoryMemory[]>([]);
    const [factoryVersion, setFactoryVersion] = useState(0);
    const [factoryPublishedAt, setFactoryPublishedAt] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string>("all");

    // Create state
    const [isCreating, setIsCreating] = useState(false);
    const [newCategory, setNewCategory] = useState<string>("knowledge");
    const [newContent, setNewContent] = useState("");
    const [newImportance, setNewImportance] = useState(0.7);
    const [newTags, setNewTags] = useState("");
    const [createError, setCreateError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editCategory, setEditCategory] = useState<string>("knowledge");
    const [editContent, setEditContent] = useState("");
    const [editImportance, setEditImportance] = useState(0.7);
    const [editTags, setEditTags] = useState("");
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Publish state
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishResult, setPublishResult] = useState<any>(null);

    // Delete state
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // ── Fetch ────────────────────────────────────────────────────────────────

    const fetchMemories = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/superadmin/agent-templates/${templateId}/factory-memories`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setMemories(data.memories || []);
            setFactoryVersion(data.factory_version ?? 0);
            setFactoryPublishedAt(data.factory_published_at);
        } catch (err: any) {
            setError(err.message || "Failed to load factory memories");
        } finally {
            setIsLoading(false);
        }
    }, [templateId]);

    useEffect(() => { fetchMemories(); }, [fetchMemories]);

    // ── Create ───────────────────────────────────────────────────────────────

    const handleCreate = async () => {
        if (!newContent.trim()) {
            setCreateError("Content is required");
            return;
        }
        setIsSubmitting(true);
        setCreateError(null);
        try {
            const res = await fetch(`/api/superadmin/agent-templates/${templateId}/factory-memories`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category: newCategory,
                    content: newContent.trim(),
                    importance: newImportance,
                    tags: newTags.split(",").map(t => t.trim()).filter(Boolean),
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `HTTP ${res.status}`);
            }
            setNewContent("");
            setNewTags("");
            setNewImportance(0.7);
            setIsCreating(false);
            await fetchMemories();
        } catch (err: any) {
            setCreateError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Edit ─────────────────────────────────────────────────────────────────

    const startEditing = (mem: FactoryMemory) => {
        setEditingId(mem.id);
        setEditCategory(mem.category);
        setEditContent(mem.content);
        setEditImportance(mem.importance);
        setEditTags((mem.tags || []).join(", "));
        setExpandedId(mem.id);
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        setIsSavingEdit(true);
        try {
            const res = await fetch(`/api/superadmin/agent-templates/${templateId}/factory-memories`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    memory_id: editingId,
                    updates: {
                        category: editCategory,
                        content: editContent.trim(),
                        importance: editImportance,
                        tags: editTags.split(",").map(t => t.trim()).filter(Boolean),
                    },
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setEditingId(null);
            await fetchMemories();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSavingEdit(false);
        }
    };

    // ── Toggle Active ────────────────────────────────────────────────────────

    const handleToggleActive = async (mem: FactoryMemory) => {
        try {
            const res = await fetch(`/api/superadmin/agent-templates/${templateId}/factory-memories`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    memory_id: mem.id,
                    updates: { is_active: !mem.is_active },
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await fetchMemories();
        } catch (err: any) {
            setError(err.message);
        }
    };

    // ── Delete (soft) ────────────────────────────────────────────────────────

    const handleDelete = async (memoryId: string) => {
        setDeletingId(memoryId);
        try {
            const res = await fetch(
                `/api/superadmin/agent-templates/${templateId}/factory-memories?memory_id=${memoryId}`,
                { method: "DELETE" }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await fetchMemories();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setDeletingId(null);
        }
    };

    // ── Publish ──────────────────────────────────────────────────────────────

    const handlePublish = async () => {
        if (!confirm(`Publish factory update v${factoryVersion + 1}? This will make the current memory set available to all installed agents via OTA.`)) {
            return;
        }
        setIsPublishing(true);
        setPublishResult(null);
        try {
            const res = await fetch(`/api/superadmin/agent-templates/${templateId}/factory-memories/publish`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `HTTP ${res.status}`);
            }
            const data = await res.json();
            setPublishResult(data.summary);
            setFactoryVersion(data.summary?.to_version ?? factoryVersion + 1);
            setFactoryPublishedAt(new Date().toISOString());
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsPublishing(false);
        }
    };

    // ── Filter ───────────────────────────────────────────────────────────────

    const filteredMemories = categoryFilter === "all"
        ? memories
        : memories.filter(m => m.category === categoryFilter);

    const categoryCounts = Object.keys(CATEGORY_META).reduce((acc, cat) => {
        acc[cat] = memories.filter(m => m.category === cat).length;
        return acc;
    }, {} as Record<string, number>);

    // ── Render ───────────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16 text-[var(--surface-500)]">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading factory memories...
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Version Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[var(--primary)]/5 to-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/20 flex items-center justify-center">
                        <Package className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[var(--surface-900)]">
                                Factory v{factoryVersion}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-[var(--primary)]/15 text-[var(--primary)] rounded-full border border-[var(--primary)]/20">
                                {memories.length} memories
                            </span>
                        </div>
                        {factoryPublishedAt ? (
                            <p className="text-xs text-[var(--surface-500)] flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                Last published {new Date(factoryPublishedAt).toLocaleString()}
                            </p>
                        ) : (
                            <p className="text-xs text-amber-400 mt-0.5">Never published</p>
                        )}
                    </div>
                </div>
                <button
                    onClick={handlePublish}
                    disabled={isPublishing || memories.length === 0}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[var(--primary)] text-white rounded-xl hover:bg-[var(--primary)]/90 disabled:opacity-50 transition-all shadow-lg shadow-[var(--primary)]/20"
                >
                    {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                    {isPublishing ? "Publishing..." : `Publish v${factoryVersion + 1}`}
                </button>
            </div>

            {/* Publish Result */}
            {publishResult && (
                <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 space-y-1">
                    <p className="font-semibold">✅ Published v{publishResult.to_version} successfully!</p>
                    <p className="text-emerald-400/80">
                        {publishResult.total_active_memories} active memories •{" "}
                        {publishResult.changes_since_last_publish?.added || 0} added •{" "}
                        {publishResult.changes_since_last_publish?.modified || 0} modified •{" "}
                        {publishResult.changes_since_last_publish?.removed || 0} removed
                    </p>
                    <button onClick={() => setPublishResult(null)} className="text-emerald-400 hover:text-emerald-300 underline">
                        Dismiss
                    </button>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto">×</button>
                </div>
            )}

            {/* Controls: Filter + Add */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 flex-wrap">
                    <button
                        onClick={() => setCategoryFilter("all")}
                        className={`px-2 py-1 text-[10px] font-semibold rounded-md border transition-all ${categoryFilter === "all"
                                ? "bg-[var(--primary)]/15 text-[var(--primary)] border-[var(--primary)]/30"
                                : "bg-[var(--surface-100)] text-[var(--surface-600)] border-[var(--surface-300)]"
                            }`}
                    >
                        All ({memories.length})
                    </button>
                    {Object.entries(CATEGORY_META).map(([cat, meta]) => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-md border transition-all ${categoryFilter === cat
                                    ? `${meta.color}`
                                    : "bg-[var(--surface-100)] text-[var(--surface-600)] border-[var(--surface-300)]"
                                }`}
                        >
                            {meta.icon} {categoryCounts[cat] || 0}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-all shadow-sm"
                >
                    <Plus className="w-3.5 h-3.5" /> Add Memory
                </button>
            </div>

            {/* Create Form */}
            {isCreating && (
                <div className="border border-[var(--primary)]/30 bg-[var(--primary)]/5 rounded-xl p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-[var(--surface-800)]">New Factory Memory</h4>

                    {/* Category selector */}
                    <div className="grid grid-cols-4 gap-1.5">
                        {Object.entries(CATEGORY_META).map(([cat, meta]) => (
                            <button
                                key={cat}
                                onClick={() => setNewCategory(cat)}
                                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium border transition-all ${newCategory === cat
                                        ? `${meta.color} ring-1 ring-current`
                                        : "bg-[var(--surface-100)] text-[var(--surface-600)] border-[var(--surface-300)]"
                                    }`}
                            >
                                {meta.icon} {meta.label}
                            </button>
                        ))}
                    </div>

                    <p className="text-xs text-[var(--surface-500)] italic">
                        {CATEGORY_META[newCategory]?.hint}
                    </p>

                    <textarea
                        value={newContent}
                        onChange={e => setNewContent(e.target.value)}
                        placeholder="Memory content (e.g. 'I'm an expert in TypeScript, React, and Rust...')"
                        rows={4}
                        className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-sm text-[var(--surface-900)] outline-none focus:border-[var(--primary)] resize-none"
                    />

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 flex-1">
                            <label className="text-xs font-medium text-[var(--surface-600)]">Importance:</label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={newImportance}
                                onChange={e => setNewImportance(parseFloat(e.target.value))}
                                className="flex-1 accent-[var(--primary)]"
                            />
                            <span className="text-xs font-mono text-[var(--surface-700)] w-8 text-right">
                                {newImportance.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <input
                        value={newTags}
                        onChange={e => setNewTags(e.target.value)}
                        placeholder="Tags (comma-separated): typescript, architecture, best-practices"
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
                            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                            Create Memory
                        </button>
                    </div>
                </div>
            )}

            {/* Memories List */}
            {filteredMemories.length === 0 && !isCreating ? (
                <div className="text-center py-12 text-[var(--surface-500)]">
                    <Brain className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">
                        {categoryFilter === "all" ? "No factory memories yet" : `No ${categoryFilter} memories`}
                    </p>
                    <p className="text-xs mt-1">Factory memories are seeded into the agent&apos;s memory DB on install.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredMemories.map(mem => {
                        const meta = CATEGORY_META[mem.category] || CATEGORY_META.knowledge;
                        const isExpanded = expandedId === mem.id;
                        const isEditing = editingId === mem.id;
                        const isDeleting = deletingId === mem.id;

                        return (
                            <div
                                key={mem.id}
                                className={`border rounded-xl transition-all ${mem.is_active
                                        ? "border-[var(--surface-300)] bg-[var(--surface-50)]"
                                        : "border-red-500/20 bg-red-500/5 opacity-70"
                                    }`}
                            >
                                {/* Row header */}
                                <div
                                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--surface-100)] rounded-t-xl transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : mem.id)}
                                >
                                    <span className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold border rounded-full shrink-0 ${meta.color}`}>
                                        {meta.icon} {meta.label}
                                    </span>
                                    <p className="text-sm text-[var(--surface-800)] truncate flex-1">{mem.content}</p>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {/* Importance indicator */}
                                        <div className="w-12 h-1.5 bg-[var(--surface-200)] rounded-full overflow-hidden" title={`Importance: ${mem.importance.toFixed(2)}`}>
                                            <div
                                                className="h-full rounded-full bg-[var(--primary)] transition-all"
                                                style={{ width: `${mem.importance * 100}%` }}
                                            />
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleToggleActive(mem); }}
                                            className="p-1 rounded-md hover:bg-[var(--surface-200)] transition-colors"
                                        >
                                            {mem.is_active
                                                ? <ToggleRight className="w-4 h-4 text-emerald-400" />
                                                : <ToggleLeft className="w-4 h-4 text-[var(--surface-400)]" />}
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(mem.id); }}
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
                                                <div className="grid grid-cols-4 gap-1">
                                                    {Object.entries(CATEGORY_META).map(([cat, m]) => (
                                                        <button
                                                            key={cat}
                                                            onClick={() => setEditCategory(cat)}
                                                            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border ${editCategory === cat ? `${m.color} ring-1 ring-current` : "bg-[var(--surface-100)] text-[var(--surface-600)] border-[var(--surface-300)]"
                                                                }`}
                                                        >
                                                            {m.icon} {m.label}
                                                        </button>
                                                    ))}
                                                </div>
                                                <textarea
                                                    value={editContent}
                                                    onChange={e => setEditContent(e.target.value)}
                                                    rows={4}
                                                    className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-sm outline-none focus:border-[var(--primary)] resize-none"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <label className="text-xs text-[var(--surface-600)]">Importance:</label>
                                                    <input
                                                        type="range"
                                                        min="0" max="1" step="0.05"
                                                        value={editImportance}
                                                        onChange={e => setEditImportance(parseFloat(e.target.value))}
                                                        className="flex-1 accent-[var(--primary)]"
                                                    />
                                                    <span className="text-xs font-mono w-8">{editImportance.toFixed(2)}</span>
                                                </div>
                                                <input
                                                    value={editTags}
                                                    onChange={e => setEditTags(e.target.value)}
                                                    placeholder="Tags (comma-separated)"
                                                    className="w-full px-3 py-1.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-xs outline-none focus:border-[var(--primary)]"
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setEditingId(null)} className="px-2 py-1 text-xs text-[var(--surface-600)]">Cancel</button>
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
                                            <div className="pt-3 space-y-2">
                                                <p className="text-sm text-[var(--surface-800)] leading-relaxed whitespace-pre-wrap">
                                                    {mem.content}
                                                </p>
                                                <div className="flex items-center justify-between text-xs text-[var(--surface-500)]">
                                                    <div className="flex items-center gap-3">
                                                        <span>Importance: <b className="text-[var(--surface-700)]">{mem.importance.toFixed(2)}</b></span>
                                                        <span>Version: <b className="text-[var(--surface-700)]">v{mem.version_added}</b></span>
                                                        <span className="font-mono text-[10px] text-[var(--surface-400)]">{mem.factory_id.substring(0, 8)}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => startEditing(mem)}
                                                        className="text-[var(--primary)] hover:underline font-medium"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                                {mem.tags && mem.tags.length > 0 && (
                                                    <div className="flex gap-1 flex-wrap">
                                                        {mem.tags.map((tag: any, i: number) => (
                                                            <span key={i} className="px-1.5 py-0.5 text-[10px] font-medium bg-[var(--surface-200)] text-[var(--surface-600)] rounded">
                                                                {typeof tag === 'string' ? tag : String(tag)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
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
