"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Plus, Trash2, AlertTriangle, Loader2,
    Database, Globe, FileText, PenLine,
    LayoutGrid, ExternalLink,
    ToggleLeft, ToggleRight,
    ChevronDown, ChevronUp,
    CheckCircle2, XCircle, Clock as ClockIcon, RefreshCw,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface KnowledgeBase {
    id: string;
    template_id: string;
    name: string;
    description: string | null;
    kb_type: "document" | "url" | "structured" | "manual";
    source_url: string | null;
    content: string | null;
    file_path: string | null;
    file_size_bytes: number | null;
    mime_type: string | null;
    retrieval_strategy: "semantic" | "keyword" | "hybrid";
    chunk_size: number;
    chunk_overlap: number;
    max_chunks_per_query: number;
    embedding_model: string;
    is_active: boolean;
    indexing_status: "pending" | "indexing" | "indexed" | "failed";
    indexing_error: string | null;
    total_chunks: number;
    last_indexed_at: string | null;
    created_at: string;
    updated_at: string;
}

interface KnowledgeTabProps {
    templateId: string;
}

const KB_TYPE_META: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
    document: {
        label: "Document",
        color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        icon: <FileText className="w-3.5 h-3.5" />,
        description: "Uploaded file (PDF, MD, TXT) to extract and index",
    },
    url: {
        label: "URL",
        color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        icon: <Globe className="w-3.5 h-3.5" />,
        description: "Web page to crawl, extract, and index",
    },
    structured: {
        label: "Structured",
        color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        icon: <LayoutGrid className="w-3.5 h-3.5" />,
        description: "JSON/CSV tabular data for structured lookups",
    },
    manual: {
        label: "Manual",
        color: "bg-purple-500/15 text-purple-400 border-purple-500/30",
        icon: <PenLine className="w-3.5 h-3.5" />,
        description: "Hand-written knowledge entries authored directly",
    },
};

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: "Pending", color: "text-amber-400", icon: <ClockIcon className="w-3 h-3" /> },
    indexing: { label: "Indexing", color: "text-blue-400", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    indexed: { label: "Indexed", color: "text-emerald-400", icon: <CheckCircle2 className="w-3 h-3" /> },
    failed: { label: "Failed", color: "text-red-400", icon: <XCircle className="w-3 h-3" /> },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function KnowledgeTab({ templateId }: KnowledgeTabProps) {
    const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Create state
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [newType, setNewType] = useState<string>("manual");
    const [newContent, setNewContent] = useState("");
    const [newSourceUrl, setNewSourceUrl] = useState("");
    const [newRetrievalStrategy, setNewRetrievalStrategy] = useState<string>("semantic");
    const [newChunkSize, setNewChunkSize] = useState(512);
    const [newMaxChunks, setNewMaxChunks] = useState(5);
    const [newEmbeddingModel, setNewEmbeddingModel] = useState("text-embedding-3-small");
    const [createError, setCreateError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editContent, setEditContent] = useState("");
    const [editSourceUrl, setEditSourceUrl] = useState("");
    const [editRetrievalStrategy, setEditRetrievalStrategy] = useState<string>("semantic");
    const [editChunkSize, setEditChunkSize] = useState(512);
    const [editMaxChunks, setEditMaxChunks] = useState(5);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Delete state
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // ── Fetch ────────────────────────────────────────────────────────────────

    const fetchKBs = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/superadmin/agent-templates/${templateId}/knowledge-bases`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setKnowledgeBases(data.knowledgeBases || []);
        } catch (err: any) {
            setError(err.message || "Failed to load knowledge bases");
        } finally {
            setIsLoading(false);
        }
    }, [templateId]);

    useEffect(() => { fetchKBs(); }, [fetchKBs]);

    // ── Create ───────────────────────────────────────────────────────────────

    const handleCreate = async () => {
        if (!newName.trim()) {
            setCreateError("Name is required");
            return;
        }
        if (newType === "url" && !newSourceUrl.trim()) {
            setCreateError("Source URL is required for URL type");
            return;
        }
        if (newType === "manual" && !newContent.trim()) {
            setCreateError("Content is required for Manual type");
            return;
        }
        setIsSubmitting(true);
        setCreateError(null);
        try {
            const res = await fetch(`/api/superadmin/agent-templates/${templateId}/knowledge-bases`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newName.trim(),
                    description: newDescription.trim() || null,
                    kb_type: newType,
                    content: (newType === "manual" || newType === "structured") ? newContent.trim() : null,
                    source_url: newType === "url" ? newSourceUrl.trim() : null,
                    retrieval_strategy: newRetrievalStrategy,
                    chunk_size: newChunkSize,
                    max_chunks_per_query: newMaxChunks,
                    embedding_model: newEmbeddingModel,
                    is_active: true,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `HTTP ${res.status}`);
            }
            setNewName("");
            setNewDescription("");
            setNewContent("");
            setNewSourceUrl("");
            setIsCreating(false);
            await fetchKBs();
        } catch (err: any) {
            setCreateError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Edit ─────────────────────────────────────────────────────────────────

    const startEditing = (kb: KnowledgeBase) => {
        setEditingId(kb.id);
        setEditName(kb.name);
        setEditDescription(kb.description || "");
        setEditContent(kb.content || "");
        setEditSourceUrl(kb.source_url || "");
        setEditRetrievalStrategy(kb.retrieval_strategy);
        setEditChunkSize(kb.chunk_size);
        setEditMaxChunks(kb.max_chunks_per_query);
        setExpandedId(kb.id);
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        setIsSavingEdit(true);
        try {
            const res = await fetch(`/api/superadmin/agent-templates/${templateId}/knowledge-bases`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    kb_id: editingId,
                    updates: {
                        name: editName.trim(),
                        description: editDescription.trim() || null,
                        content: editContent.trim() || null,
                        source_url: editSourceUrl.trim() || null,
                        retrieval_strategy: editRetrievalStrategy,
                        chunk_size: editChunkSize,
                        max_chunks_per_query: editMaxChunks,
                    },
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setEditingId(null);
            await fetchKBs();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSavingEdit(false);
        }
    };

    // ── Toggle Active ────────────────────────────────────────────────────────

    const handleToggleActive = async (kb: KnowledgeBase) => {
        try {
            const res = await fetch(`/api/superadmin/agent-templates/${templateId}/knowledge-bases`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    kb_id: kb.id,
                    updates: { is_active: !kb.is_active },
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await fetchKBs();
        } catch (err: any) {
            setError(err.message);
        }
    };

    // ── Delete ───────────────────────────────────────────────────────────────

    const handleDelete = async (kbId: string) => {
        setDeletingId(kbId);
        try {
            const res = await fetch(
                `/api/superadmin/agent-templates/${templateId}/knowledge-bases?kb_id=${kbId}`,
                { method: "DELETE" }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await fetchKBs();
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
                Loading knowledge bases...
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--surface-700)] uppercase tracking-wider">
                        <Database className="w-4 h-4" /> Knowledge Bases
                    </h3>
                    <p className="text-xs text-[var(--surface-500)] mt-1">
                        RAG sources the agent can query at inference time. Indexed on the desktop client.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-all shadow-sm"
                >
                    <Plus className="w-3.5 h-3.5" /> Add KB
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
                    <h4 className="text-sm font-semibold text-[var(--surface-800)]">New Knowledge Base</h4>

                    {/* Type Selector */}
                    <div className="grid grid-cols-4 gap-2">
                        {Object.entries(KB_TYPE_META).map(([type, meta]) => (
                            <button
                                key={type}
                                onClick={() => setNewType(type)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${newType === type
                                        ? `${meta.color} ring-1 ring-current`
                                        : "bg-[var(--surface-100)] text-[var(--surface-600)] border-[var(--surface-300)]"
                                    }`}
                            >
                                {meta.icon} {meta.label}
                            </button>
                        ))}
                    </div>

                    <p className="text-xs text-[var(--surface-500)] italic">
                        {KB_TYPE_META[newType]?.description}
                    </p>

                    <input
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Knowledge base name (e.g. 'Oraya Codebase Conventions')"
                        className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-sm text-[var(--surface-900)] outline-none focus:border-[var(--primary)]"
                    />

                    <input
                        value={newDescription}
                        onChange={e => setNewDescription(e.target.value)}
                        placeholder="Description (optional)"
                        className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-sm text-[var(--surface-900)] outline-none focus:border-[var(--primary)]"
                    />

                    {/* Type-specific fields */}
                    {newType === "url" && (
                        <div>
                            <label className="text-xs font-medium text-[var(--surface-600)] mb-1 block">Source URL</label>
                            <div className="flex gap-2">
                                <input
                                    value={newSourceUrl}
                                    onChange={e => setNewSourceUrl(e.target.value)}
                                    placeholder="https://docs.example.com/api"
                                    className="flex-1 px-3 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-sm text-[var(--surface-900)] outline-none focus:border-[var(--primary)]"
                                />
                                {newSourceUrl && (
                                    <a href={newSourceUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-[var(--surface-400)] hover:text-[var(--primary)]">
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {(newType === "manual" || newType === "structured") && (
                        <div>
                            <label className="text-xs font-medium text-[var(--surface-600)] mb-1 block">
                                {newType === "structured" ? "Data (JSON/CSV)" : "Content"}
                            </label>
                            <textarea
                                value={newContent}
                                onChange={e => setNewContent(e.target.value)}
                                placeholder={newType === "structured" ? '[\n  {"key": "value"}\n]' : "Enter knowledge content..."}
                                rows={6}
                                className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-sm text-[var(--surface-900)] font-mono outline-none focus:border-[var(--primary)] resize-none"
                                spellCheck={false}
                            />
                        </div>
                    )}

                    {newType === "document" && (
                        <div className="text-center py-4 border-2 border-dashed border-[var(--surface-300)] rounded-lg bg-[var(--surface-100)]">
                            <FileText className="w-6 h-6 mx-auto text-[var(--surface-400)] mb-2" />
                            <p className="text-xs text-[var(--surface-500)]">File upload available after creation</p>
                            <p className="text-[10px] text-[var(--surface-400)] mt-1">Supported: PDF, MD, TXT, DOCX</p>
                        </div>
                    )}

                    {/* RAG Configuration */}
                    <div className="border-t border-[var(--surface-200)] pt-3 space-y-2">
                        <h5 className="text-xs font-semibold text-[var(--surface-600)] uppercase tracking-wider">RAG Configuration</h5>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-[10px] text-[var(--surface-500)] block mb-0.5">Retrieval Strategy</label>
                                <select
                                    value={newRetrievalStrategy}
                                    onChange={e => setNewRetrievalStrategy(e.target.value)}
                                    className="w-full px-2 py-1.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-xs text-[var(--surface-900)] outline-none focus:border-[var(--primary)]"
                                >
                                    <option value="semantic">Semantic (Vector)</option>
                                    <option value="keyword">Keyword (BM25)</option>
                                    <option value="hybrid">Hybrid (Fusion)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-[var(--surface-500)] block mb-0.5">Chunk Size</label>
                                <input
                                    type="number"
                                    value={newChunkSize}
                                    onChange={e => setNewChunkSize(parseInt(e.target.value) || 512)}
                                    className="w-full px-2 py-1.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-xs text-[var(--surface-900)] outline-none focus:border-[var(--primary)]"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-[var(--surface-500)] block mb-0.5">Max Chunks</label>
                                <input
                                    type="number"
                                    value={newMaxChunks}
                                    onChange={e => setNewMaxChunks(parseInt(e.target.value) || 5)}
                                    className="w-full px-2 py-1.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-xs text-[var(--surface-900)] outline-none focus:border-[var(--primary)]"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-[var(--surface-500)] block mb-0.5">Embedding Model</label>
                            <select
                                value={newEmbeddingModel}
                                onChange={e => setNewEmbeddingModel(e.target.value)}
                                className="w-full px-2 py-1.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-xs text-[var(--surface-900)] outline-none focus:border-[var(--primary)]"
                            >
                                <option value="text-embedding-3-small">text-embedding-3-small (OpenAI, 1536d)</option>
                                <option value="text-embedding-3-large">text-embedding-3-large (OpenAI, 3072d)</option>
                                <option value="text-embedding-ada-002">text-embedding-ada-002 (OpenAI, legacy)</option>
                                <option value="nomic-embed-text">nomic-embed-text (Local, 768d)</option>
                            </select>
                        </div>
                    </div>

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
                            disabled={isSubmitting || !newName.trim()}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[var(--primary)] text-white rounded-lg disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                            Create KB
                        </button>
                    </div>
                </div>
            )}

            {/* KB Cards */}
            {knowledgeBases.length === 0 && !isCreating ? (
                <div className="text-center py-12 text-[var(--surface-500)]">
                    <Database className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">No knowledge bases</p>
                    <p className="text-xs mt-1">Add RAG sources to give the agent domain-specific knowledge.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {knowledgeBases.map(kb => {
                        const typeMeta = KB_TYPE_META[kb.kb_type] || KB_TYPE_META.manual;
                        const statusMeta = STATUS_META[kb.indexing_status] || STATUS_META.pending;
                        const isExpanded = expandedId === kb.id;
                        const isEditing = editingId === kb.id;
                        const isDeleting = deletingId === kb.id;

                        return (
                            <div
                                key={kb.id}
                                className={`border rounded-xl transition-all ${kb.is_active
                                        ? "border-[var(--surface-300)] bg-[var(--surface-50)]"
                                        : "border-[var(--surface-200)] bg-[var(--surface-100)] opacity-60"
                                    }`}
                            >
                                {/* Row header */}
                                <div
                                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--surface-100)] rounded-t-xl transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : kb.id)}
                                >
                                    <span className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold border rounded-full shrink-0 ${typeMeta.color}`}>
                                        {typeMeta.icon} {typeMeta.label}
                                    </span>
                                    <span className="text-sm font-medium text-[var(--surface-800)] truncate flex-1">{kb.name}</span>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {/* Status badge */}
                                        <span className={`flex items-center gap-1 text-[10px] font-medium ${statusMeta.color}`}>
                                            {statusMeta.icon} {statusMeta.label}
                                        </span>
                                        {kb.total_chunks > 0 && (
                                            <span className="text-[10px] text-[var(--surface-500)]">{kb.total_chunks} chunks</span>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleToggleActive(kb); }}
                                            className="p-1 rounded-md hover:bg-[var(--surface-200)]"
                                        >
                                            {kb.is_active
                                                ? <ToggleRight className="w-4 h-4 text-emerald-400" />
                                                : <ToggleLeft className="w-4 h-4 text-[var(--surface-400)]" />}
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(kb.id); }}
                                            disabled={isDeleting}
                                            className="p-1 rounded-md hover:bg-red-500/10 text-[var(--surface-400)] hover:text-red-400 disabled:opacity-50"
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
                                                <input
                                                    value={editName}
                                                    onChange={e => setEditName(e.target.value)}
                                                    className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-sm outline-none focus:border-[var(--primary)]"
                                                    placeholder="Name"
                                                />
                                                <input
                                                    value={editDescription}
                                                    onChange={e => setEditDescription(e.target.value)}
                                                    className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-sm outline-none focus:border-[var(--primary)]"
                                                    placeholder="Description"
                                                />
                                                {(kb.kb_type === "url") && (
                                                    <input
                                                        value={editSourceUrl}
                                                        onChange={e => setEditSourceUrl(e.target.value)}
                                                        className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-sm outline-none focus:border-[var(--primary)]"
                                                        placeholder="Source URL"
                                                    />
                                                )}
                                                {(kb.kb_type === "manual" || kb.kb_type === "structured") && (
                                                    <textarea
                                                        value={editContent}
                                                        onChange={e => setEditContent(e.target.value)}
                                                        rows={6}
                                                        className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-sm font-mono outline-none focus:border-[var(--primary)] resize-none"
                                                        spellCheck={false}
                                                    />
                                                )}
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <label className="text-[10px] text-[var(--surface-500)] block mb-0.5">Retrieval</label>
                                                        <select
                                                            value={editRetrievalStrategy}
                                                            onChange={e => setEditRetrievalStrategy(e.target.value)}
                                                            className="w-full px-2 py-1.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-xs outline-none focus:border-[var(--primary)]"
                                                        >
                                                            <option value="semantic">Semantic</option>
                                                            <option value="keyword">Keyword</option>
                                                            <option value="hybrid">Hybrid</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-[var(--surface-500)] block mb-0.5">Chunk Size</label>
                                                        <input
                                                            type="number"
                                                            value={editChunkSize}
                                                            onChange={e => setEditChunkSize(parseInt(e.target.value) || 512)}
                                                            className="w-full px-2 py-1.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-xs outline-none focus:border-[var(--primary)]"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-[var(--surface-500)] block mb-0.5">Max Chunks</label>
                                                        <input
                                                            type="number"
                                                            value={editMaxChunks}
                                                            onChange={e => setEditMaxChunks(parseInt(e.target.value) || 5)}
                                                            className="w-full px-2 py-1.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-lg text-xs outline-none focus:border-[var(--primary)]"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setEditingId(null)} className="px-2 py-1 text-xs text-[var(--surface-600)]">Cancel</button>
                                                    <button
                                                        onClick={handleSaveEdit}
                                                        disabled={isSavingEdit}
                                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-[var(--primary)] text-white rounded-lg disabled:opacity-50"
                                                    >
                                                        {isSavingEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Save
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="pt-3 space-y-3">
                                                {kb.description && (
                                                    <p className="text-xs text-[var(--surface-600)]">{kb.description}</p>
                                                )}

                                                {kb.source_url && (
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <Globe className="w-3 h-3 text-[var(--surface-400)]" />
                                                        <a href={kb.source_url} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline truncate">
                                                            {kb.source_url}
                                                        </a>
                                                    </div>
                                                )}

                                                {kb.content && (
                                                    <pre className="px-3 py-2 bg-[var(--surface-100)] rounded-lg text-xs text-[var(--surface-700)] font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                                                        {kb.content.substring(0, 500)}
                                                        {kb.content.length > 500 ? "..." : ""}
                                                    </pre>
                                                )}

                                                {kb.indexing_error && (
                                                    <div className="px-3 py-2 bg-red-500/5 border border-red-500/15 rounded-lg text-xs text-red-400">
                                                        {kb.indexing_error}
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between text-xs text-[var(--surface-500)]">
                                                    <div className="flex items-center gap-3">
                                                        <span>{kb.retrieval_strategy} · {kb.chunk_size} chunk size · {kb.max_chunks_per_query} max</span>
                                                        <span className="font-mono text-[10px]">{kb.embedding_model}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => startEditing(kb)}
                                                        className="text-[var(--primary)] hover:underline font-medium"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>

                                                {kb.last_indexed_at && (
                                                    <p className="text-[10px] text-[var(--surface-400)]">
                                                        Last indexed: {new Date(kb.last_indexed_at).toLocaleString()}
                                                    </p>
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
