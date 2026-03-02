"use client";

import { useState, useTransition } from "react";
import {
    Terminal, Shield, Layers, Lock, Plus, Trash2,
    ChevronDown, Check, X, GripVertical, Pencil,
    Save, ToggleLeft, ToggleRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PromptSection {
    id: string;
    name: string;
    slug: string;
    category: string;
    content: string;
    description: string | null;
    is_active: boolean;
    is_system: boolean;
    created_at: string;
    updated_at: string;
}

interface PromptAssignment {
    id: string;
    agent_key: string;
    section_id: string;
    priority: number;
    is_enabled: boolean;
    content_override: string | null;
    section?: PromptSection;
}

interface Props {
    initialSections: PromptSection[];
    initialAssignments: PromptAssignment[];
}

// ─── Category meta ───────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { color: string; icon: typeof Terminal; label: string }> = {
    identity: { color: "rgb(139,92,246)", icon: Terminal, label: "Identity" },
    security: { color: "rgb(239,68,68)", icon: Shield, label: "Security" },
    routing: { color: "rgb(6,182,212)", icon: Layers, label: "Routing" },
    behavior: { color: "rgb(245,158,11)", icon: Lock, label: "Behavior" },
    general: { color: "rgb(107,114,128)", icon: Terminal, label: "General" },
};

function getCatMeta(cat: string) {
    return CATEGORY_META[cat] || CATEGORY_META.general;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PromptsManager({ initialSections, initialAssignments }: Props) {
    const [sections, setSections] = useState(initialSections);
    const [assignments, setAssignments] = useState(initialAssignments);
    const [selectedAgent, setSelectedAgent] = useState("oraya_ide_gateway");
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const [editingSection, setEditingSection] = useState<string | null>(null);
    const [editDraft, setEditDraft] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<Record<string, "saved" | "error" | null>>({});

    // Get unique agent keys
    const agentKeys = [...new Set(assignments.map(a => a.agent_key))];
    if (!agentKeys.includes("oraya_ide_gateway")) agentKeys.unshift("oraya_ide_gateway");

    // Current agent's assignments sorted by priority
    const currentAssignments = assignments
        .filter(a => a.agent_key === selectedAgent)
        .sort((a, b) => a.priority - b.priority);

    // Sections not assigned to current agent
    const unassignedSections = sections.filter(
        s => !currentAssignments.some(a => a.section_id === s.id) && s.is_active
    );

    const handleSaveSection = async (sectionId: string, content: string) => {
        setSaving(true);
        try {
            const res = await fetch("/api/superadmin/prompts/sections", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: sectionId, content }),
            });
            if (!res.ok) throw new Error("Save failed");
            setSections(prev => prev.map(s => s.id === sectionId ? { ...s, content } : s));
            setEditingSection(null);
            setSaveStatus(prev => ({ ...prev, [sectionId]: "saved" }));
            setTimeout(() => setSaveStatus(prev => ({ ...prev, [sectionId]: null })), 3000);
        } catch {
            setSaveStatus(prev => ({ ...prev, [sectionId]: "error" }));
        } finally {
            setSaving(false);
        }
    };

    const handleToggleAssignment = async (assignmentId: string, enabled: boolean) => {
        try {
            const res = await fetch("/api/superadmin/prompts/assignments", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: assignmentId, is_enabled: enabled }),
            });
            if (!res.ok) throw new Error("Toggle failed");
            setAssignments(prev => prev.map(a => a.id === assignmentId ? { ...a, is_enabled: enabled } : a));
        } catch (e) {
            console.error("Toggle assignment failed:", e);
        }
    };

    const handleDeleteSection = async (sectionId: string) => {
        const section = sections.find(s => s.id === sectionId);
        if (section?.is_system) return; // Can't delete system sections
        if (!confirm(`Delete "${section?.name}"? This will remove it from all agents.`)) return;

        try {
            const res = await fetch(`/api/superadmin/prompts/sections?id=${sectionId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");
            setSections(prev => prev.filter(s => s.id !== sectionId));
            setAssignments(prev => prev.filter(a => a.section_id !== sectionId));
        } catch (e) {
            console.error("Delete section failed:", e);
        }
    };

    return (
        <div className="space-y-6">
            {/* Agent Selector */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)]">
                <Terminal className="w-5 h-5 text-[var(--primary)]" />
                <div>
                    <label className="text-sm font-medium text-[var(--surface-600)]">Headless Agent</label>
                </div>
                <select
                    value={selectedAgent}
                    onChange={e => setSelectedAgent(e.target.value)}
                    className="ml-auto px-4 py-2 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-300)] text-sm font-medium text-[var(--surface-800)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                >
                    {agentKeys.map(key => (
                        <option key={key} value={key}>{key}</option>
                    ))}
                </select>
            </div>

            {/* Assigned Sections */}
            <div className="rounded-2xl border border-[var(--surface-300)] overflow-hidden">
                <div className="p-4 bg-[var(--surface-50)] border-b border-[var(--surface-300)] flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--surface-900)]">
                            Assigned Prompt Sections
                        </h2>
                        <p className="text-sm text-[var(--surface-500)] mt-0.5">
                            Sections are concatenated in priority order to form the agent&apos;s system prompt
                        </p>
                    </div>
                    <span className="px-3 py-1.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-bold border border-[var(--primary)]/20">
                        {currentAssignments.filter(a => a.is_enabled).length} active
                    </span>
                </div>

                {currentAssignments.length === 0 ? (
                    <div className="p-12 text-center text-[var(--surface-500)]">
                        <Terminal className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p className="font-semibold">No sections assigned</p>
                        <p className="text-sm mt-1">Assign prompt sections from the pool below</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--surface-200)]">
                        {currentAssignments.map((assignment) => {
                            const section = assignment.section || sections.find(s => s.id === assignment.section_id);
                            if (!section) return null;
                            const isExpanded = expandedSection === assignment.id;
                            const isEditing = editingSection === assignment.id;
                            const catMeta = getCatMeta(section.category);
                            const CatIcon = catMeta.icon;
                            const status = saveStatus[section.id];

                            return (
                                <div key={assignment.id} className="group">
                                    {/* Section Header */}
                                    <div
                                        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-[var(--surface-50)] transition-colors"
                                        onClick={() => setExpandedSection(isExpanded ? null : assignment.id)}
                                    >
                                        <GripVertical className="w-4 h-4 text-[var(--surface-400)] opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                            style={{ background: `${catMeta.color}15`, border: `1px solid ${catMeta.color}30` }}
                                        >
                                            <CatIcon className="w-4 h-4" style={{ color: catMeta.color }} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-[var(--surface-900)] text-sm">{section.name}</span>
                                                {section.is_system && (
                                                    <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-red-500/10 text-red-500 border border-red-500/20">
                                                        System
                                                    </span>
                                                )}
                                                <span className="px-1.5 py-0.5 text-[10px] font-medium rounded" style={{ background: `${catMeta.color}15`, color: catMeta.color }}>
                                                    {catMeta.label}
                                                </span>
                                            </div>
                                            {section.description && (
                                                <p className="text-xs text-[var(--surface-500)] mt-0.5 truncate">{section.description}</p>
                                            )}
                                        </div>

                                        <span className="text-xs text-[var(--surface-400)] font-mono">P{assignment.priority}</span>

                                        {status === "saved" && <Check className="w-4 h-4 text-emerald-500" />}
                                        {status === "error" && <X className="w-4 h-4 text-red-500" />}

                                        {/* Toggle */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleToggleAssignment(assignment.id, !assignment.is_enabled); }}
                                            className="shrink-0"
                                        >
                                            {assignment.is_enabled ? (
                                                <ToggleRight className="w-6 h-6 text-emerald-500" />
                                            ) : (
                                                <ToggleLeft className="w-6 h-6 text-[var(--surface-400)]" />
                                            )}
                                        </button>

                                        <ChevronDown className={cn("w-4 h-4 text-[var(--surface-400)] transition-transform", isExpanded && "rotate-180")} />
                                    </div>

                                    {/* Section Content (Expanded) */}
                                    {isExpanded && (
                                        <div className="px-4 pb-4 ml-[2.75rem]">
                                            {isEditing ? (
                                                <div className="space-y-3">
                                                    <textarea
                                                        value={editDraft}
                                                        onChange={e => setEditDraft(e.target.value)}
                                                        rows={12}
                                                        className="w-full p-4 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-300)] text-sm font-mono text-[var(--surface-800)] resize-y focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                                                    />
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-[var(--surface-400)] font-mono">{editDraft.length} chars</span>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setEditingSection(null)}
                                                                className="px-3 py-1.5 rounded-lg text-sm text-[var(--surface-600)] hover:bg-[var(--surface-200)] transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={() => handleSaveSection(section.id, editDraft)}
                                                                disabled={saving}
                                                                className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                                            >
                                                                <Save className="w-3.5 h-3.5" />
                                                                {saving ? "Saving…" : "Save"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <pre className="p-4 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-200)] text-sm text-[var(--surface-700)] font-mono whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                                                        {assignment.content_override || section.content || "(empty)"}
                                                    </pre>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-[var(--surface-400)] font-mono">
                                                            {(assignment.content_override || section.content || "").length} chars
                                                            {assignment.content_override && (
                                                                <span className="ml-2 text-amber-500">• override active</span>
                                                            )}
                                                        </span>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setEditDraft(assignment.content_override || section.content || "");
                                                                    setEditingSection(assignment.id);
                                                                }}
                                                                className="px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors flex items-center gap-1.5"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" /> Edit
                                                            </button>
                                                            {!section.is_system && (
                                                                <button
                                                                    onClick={() => handleDeleteSection(section.id)}
                                                                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-1.5"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" /> Remove
                                                                </button>
                                                            )}
                                                        </div>
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

            {/* Unassigned Sections Pool */}
            {unassignedSections.length > 0 && (
                <div className="rounded-2xl border border-dashed border-[var(--surface-300)] p-6">
                    <h3 className="text-sm font-semibold text-[var(--surface-600)] mb-4 uppercase tracking-wider">
                        Available Sections (Unassigned)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {unassignedSections.map((section) => {
                            const catMeta = getCatMeta(section.category);
                            const CatIcon = catMeta.icon;
                            return (
                                <div
                                    key={section.id}
                                    className="p-4 rounded-xl border border-[var(--surface-200)] hover:border-[var(--primary)]/30 hover:shadow-sm transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <CatIcon className="w-4 h-4" style={{ color: catMeta.color }} />
                                        <span className="font-medium text-sm text-[var(--surface-800)]">{section.name}</span>
                                    </div>
                                    {section.description && (
                                        <p className="text-xs text-[var(--surface-500)] line-clamp-2">{section.description}</p>
                                    )}
                                    <button className="mt-3 flex items-center gap-1 text-xs font-medium text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Plus className="w-3 h-3" /> Assign to {selectedAgent}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
