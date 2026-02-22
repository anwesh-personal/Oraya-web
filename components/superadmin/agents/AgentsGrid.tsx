"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search, Bot, EyeOff, RefreshCw, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentDetailDrawer, type AgentTemplate } from "./AgentDetailDrawer";

// ─── AgentsGrid ──────────────────────────────────────────────────────────────
// Fetches agent templates from Supabase via API, renders a filterable grid,
// and opens the detail drawer on click.

export function AgentsGrid() {
    const [templates, setTemplates] = useState<AgentTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [tierFilter, setTierFilter] = useState<string>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchTemplates = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/superadmin/agent-templates");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setTemplates(data.templates || []);
        } catch (err: any) {
            console.error("Failed to fetch agent templates:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

    // ── Save handler (passed to drawer) ───────────────────────────────────────
    const handleSave = async (templateId: string, updates: Partial<AgentTemplate>) => {
        const res = await fetch("/api/superadmin/agent-templates", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ template_id: templateId, updates }),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Save failed");
        }

        // Refresh list — the useEffect below will sync the drawer
        await fetchTemplates();
    };


    // ── Sync drawer state when templates refresh (after save) ─────────────────
    useEffect(() => {
        if (selectedTemplate) {
            const refreshed = templates.find(t => t.id === selectedTemplate.id);
            if (refreshed) {
                setSelectedTemplate(refreshed);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [templates]);

    // ── Filters ───────────────────────────────────────────────────────────────
    const allCategories = [...new Set(templates.map(t => t.category).filter(Boolean))] as string[];
    const categories = allCategories; // used for category filter dropdown

    const filtered = templates.filter(t => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q
            || t.name.toLowerCase().includes(q)
            || (t.tagline || "").toLowerCase().includes(q)
            || (t.category || "").toLowerCase().includes(q)
            || (t.tags || []).some(tag => tag.toLowerCase().includes(q));
        const matchesTier = tierFilter === "all" || t.plan_tier === tierFilter;
        const matchesCat = categoryFilter === "all" || t.category === categoryFilter;
        return matchesSearch && matchesTier && matchesCat;
    });

    // ── Tier badge ────────────────────────────────────────────────────────────
    const tierBadge = (tier: string) => {
        switch (tier) {
            case "free": return { label: "FREE", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" };
            case "pro": return { label: "PRO", cls: "bg-amber-500/15 text-amber-400 border-amber-500/25" };
            case "team": return { label: "TEAM", cls: "bg-blue-500/15 text-blue-400 border-blue-500/25" };
            case "enterprise": return { label: "ENT", cls: "bg-purple-500/15 text-purple-400 border-purple-500/25" };
            default: return { label: tier, cls: "bg-gray-500/15 text-gray-400 border-gray-500/25" };
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5">
            {/* Toolbar */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--surface-400)]" />
                    <input
                        type="text"
                        placeholder="Search agents..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all"
                    />
                </div>

                <select
                    value={tierFilter}
                    onChange={e => setTierFilter(e.target.value)}
                    className="px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm"
                >
                    <option value="all">All Tiers</option>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="team">Team</option>
                    <option value="enterprise">Enterprise</option>
                </select>

                <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm"
                >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat!}>{cat}</option>
                    ))}
                </select>

                <button
                    onClick={fetchTemplates}
                    disabled={isLoading}
                    className="p-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-600)] hover:bg-[var(--surface-200)] transition-all disabled:opacity-50"
                    title="Refresh"
                >
                    <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    Failed to load agents: {error}
                </div>
            )}

            {/* Loading skeleton */}
            {isLoading && templates.length === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="p-6 rounded-2xl bg-[var(--surface-100)] border border-[var(--surface-200)] animate-pulse">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-[var(--surface-300)]" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-[var(--surface-300)] rounded w-2/3" />
                                    <div className="h-3 bg-[var(--surface-300)] rounded w-1/3" />
                                </div>
                            </div>
                            <div className="h-3 bg-[var(--surface-300)] rounded w-full mb-2" />
                            <div className="h-3 bg-[var(--surface-300)] rounded w-4/5" />
                        </div>
                    ))}
                </div>
            )}

            {/* Grid */}
            {!isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(template => {
                        const badge = tierBadge(template.plan_tier);
                        return (
                            <div
                                key={template.id}
                                onClick={() => setSelectedTemplate(template)}
                                className={cn(
                                    "p-5 rounded-2xl border cursor-pointer transition-all group",
                                    "bg-[var(--surface-50)] border-[var(--surface-200)]",
                                    "hover:border-[var(--primary)]/40 hover:shadow-lg hover:shadow-[var(--primary)]/5",
                                    !template.is_active && "opacity-50"
                                )}
                            >
                                {/* Header */}
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 border border-[var(--primary)]/20 flex items-center justify-center text-xl shrink-0">
                                        {template.emoji}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-[var(--surface-900)] truncate">
                                                {template.name}
                                            </h3>
                                            {!template.is_active && (
                                                <EyeOff className="w-3.5 h-3.5 text-[var(--surface-400)] shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-sm text-[var(--surface-500)] truncate">
                                            {template.tagline || "No tagline"}
                                        </p>
                                    </div>
                                </div>

                                {/* Badges */}
                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                    <span className={cn("px-2 py-0.5 text-[10px] font-bold border rounded-full uppercase tracking-wider", badge.cls)}>
                                        {badge.label}
                                    </span>
                                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-[var(--surface-200)] text-[var(--surface-600)] rounded-full uppercase">
                                        {template.role}
                                    </span>
                                    {template.category && (
                                        <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--primary)]/10 text-[var(--primary)] rounded-full">
                                            {template.category}
                                        </span>
                                    )}
                                </div>

                                {/* Tags */}
                                {template.tags && template.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {template.tags.slice(0, 4).map(tag => (
                                            <span key={tag} className="px-1.5 py-0.5 text-[10px] bg-[var(--surface-200)] text-[var(--surface-500)] rounded">
                                                {tag}
                                            </span>
                                        ))}
                                        {template.tags.length > 4 && (
                                            <span className="px-1.5 py-0.5 text-[10px] text-[var(--surface-400)]">
                                                +{template.tags.length - 4}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Footer stats */}
                                <div className="flex items-center justify-between pt-3 border-t border-[var(--surface-200)] text-[var(--surface-500)]">
                                    <div className="flex items-center gap-1 text-xs">
                                        <Zap className="w-3 h-3" />
                                        <span>{template.install_count} installs</span>
                                    </div>
                                    <span className="text-xs">v{template.version}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Empty state */}
            {!isLoading && filtered.length === 0 && (
                <div className="py-16 text-center">
                    <Bot className="w-12 h-12 text-[var(--surface-400)] mx-auto mb-4" />
                    <p className="text-[var(--surface-500)]">
                        {templates.length === 0 ? "No agent templates found in Supabase." : "No agents match your filters."}
                    </p>
                </div>
            )}

            {/* Detail Drawer */}
            {selectedTemplate && (
                <AgentDetailDrawer
                    template={selectedTemplate}
                    allCategories={allCategories}
                    onClose={() => setSelectedTemplate(null)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
