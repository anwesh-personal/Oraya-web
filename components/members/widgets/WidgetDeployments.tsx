"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, Search, MoreVertical, Copy, Check, Trash2,
    Globe, MessageSquare, Zap, Eye, EyeOff, ExternalLink,
    Settings2, Code2, Activity, Shield,
} from "lucide-react";
import type { WidgetDeployment, AgentTemplateOption } from "@/app/dashboard/widgets/page";
import { CreateWidgetModal } from "./CreateWidgetModal";
import { EmbedCodeModal } from "./EmbedCodeModal";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface WidgetDeploymentsProps {
    widgets: WidgetDeployment[];
    availableAgents: AgentTemplateOption[];
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const PERSISTENCE_LABELS: Record<string, { label: string; icon: string; desc: string }> = {
    ephemeral: { label: "Ephemeral", icon: "💨", desc: "No history saved" },
    ip_persistent: { label: "IP Persistent", icon: "🌐", desc: "Tied to visitor IP" },
    user_persistent: { label: "User Persistent", icon: "👤", desc: "Tied to browser" },
    gated: { label: "Gated", icon: "🔐", desc: "Requires signup" },
};

const TYPE_LABELS: Record<string, { label: string; desc: string }> = {
    bubble: { label: "Floating Bubble", desc: "Corner chat bubble" },
    inline: { label: "Inline Chat", desc: "Embedded in page" },
    fullpage: { label: "Full Page", desc: "Full-screen chat" },
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return n.toString();
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function WidgetDeployments({ widgets: initialWidgets, availableAgents }: WidgetDeploymentsProps) {
    const [widgets, setWidgets] = useState(initialWidgets);
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [embedWidget, setEmbedWidget] = useState<WidgetDeployment | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Filter
    const filtered = widgets.filter(w =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.agent_templates?.name?.toLowerCase().includes(search.toLowerCase())
    );

    // Copy API key
    const copyKey = useCallback(async (key: string, widgetId: string) => {
        await navigator.clipboard.writeText(key);
        setCopiedId(widgetId);
        setTimeout(() => setCopiedId(null), 2000);
    }, []);

    // Toggle active
    const toggleActive = useCallback(async (widget: WidgetDeployment) => {
        const res = await fetch("/api/members/widgets", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: widget.id, is_active: !widget.is_active }),
        });
        if (res.ok) {
            const { widget: updated } = await res.json();
            setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
        }
    }, []);

    // Delete widget
    const deleteWidget = useCallback(async (id: string) => {
        setDeletingId(id);
        const res = await fetch(`/api/members/widgets?id=${id}`, { method: "DELETE" });
        if (res.ok) {
            setWidgets(prev => prev.filter(w => w.id !== id));
        }
        setDeletingId(null);
    }, []);

    // On create success
    const handleCreated = useCallback((widget: WidgetDeployment) => {
        setWidgets(prev => [widget, ...prev]);
        setShowCreate(false);
    }, []);

    return (
        <div className="space-y-6">
            {/* ── Toolbar ── */}
            <div className="flex items-center gap-3">
                <div
                    className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors"
                    style={{
                        background: "var(--surface-50)",
                        borderColor: "var(--surface-200)",
                    }}
                >
                    <Search className="w-4 h-4 text-[var(--surface-400)]" />
                    <input
                        type="text"
                        placeholder="Search widgets..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-sm text-[var(--surface-900)] placeholder:text-[var(--surface-400)]"
                    />
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: "var(--gradient-primary)" }}
                >
                    <Plus className="w-4 h-4" />
                    Create Widget
                </button>
            </div>

            {/* ── Empty State ── */}
            {widgets.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed"
                    style={{
                        borderColor: "var(--surface-200)",
                        background: "var(--surface-50)",
                    }}
                >
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                        style={{
                            background: "color-mix(in srgb, var(--primary) 10%, var(--surface-100))",
                        }}
                    >
                        <Code2 className="w-8 h-8 text-[var(--primary)] opacity-60" />
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--surface-900)] mb-1">
                        No widgets yet
                    </h3>
                    <p className="text-sm text-[var(--surface-500)] mb-6 max-w-sm text-center">
                        Deploy an AI agent as an embeddable chat widget on any website.
                        Pick an agent, customize the look, and get your embed code.
                    </p>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                        style={{ background: "var(--gradient-primary)" }}
                    >
                        <Plus className="w-4 h-4" />
                        Create Your First Widget
                    </button>
                </motion.div>
            )}

            {/* ── Widget Grid ── */}
            {filtered.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((widget, i) => (
                            <motion.div
                                key={widget.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.05 }}
                                className="rounded-2xl border overflow-hidden transition-all hover:shadow-lg"
                                style={{
                                    background: "var(--surface-50)",
                                    borderColor: widget.is_active
                                        ? "color-mix(in srgb, var(--primary) 30%, var(--surface-200))"
                                        : "var(--surface-200)",
                                }}
                            >
                                {/* Card Header */}
                                <div
                                    className="px-5 py-4 flex items-center gap-3"
                                    style={{
                                        borderBottom: "1px solid var(--surface-200)",
                                    }}
                                >
                                    {/* Agent emoji */}
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                                        style={{
                                            background: "color-mix(in srgb, var(--primary) 10%, var(--surface-100))",
                                            border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)",
                                        }}
                                    >
                                        {widget.agent_templates?.emoji || "🤖"}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-bold text-[var(--surface-900)] truncate">
                                                {widget.name}
                                            </h3>
                                            <span
                                                className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                                style={{
                                                    background: widget.is_active
                                                        ? "color-mix(in srgb, #22c55e 15%, transparent)"
                                                        : "color-mix(in srgb, #ef4444 15%, transparent)",
                                                    color: widget.is_active ? "#16a34a" : "#dc2626",
                                                }}
                                            >
                                                {widget.is_active ? "Live" : "Off"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-[var(--surface-500)] truncate">
                                            {widget.agent_templates?.name || "Unknown Agent"} • {TYPE_LABELS[widget.widget_type]?.label}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button
                                            onClick={() => setEmbedWidget(widget)}
                                            className="p-2 rounded-lg transition-colors hover:bg-[var(--surface-200)]"
                                            title="Get Embed Code"
                                        >
                                            <Code2 className="w-4 h-4 text-[var(--primary)]" />
                                        </button>
                                        <button
                                            onClick={() => toggleActive(widget)}
                                            className="p-2 rounded-lg transition-colors hover:bg-[var(--surface-200)]"
                                            title={widget.is_active ? "Deactivate" : "Activate"}
                                        >
                                            {widget.is_active
                                                ? <Eye className="w-4 h-4 text-[var(--surface-600)]" />
                                                : <EyeOff className="w-4 h-4 text-[var(--surface-400)]" />
                                            }
                                        </button>
                                        <button
                                            onClick={() => deleteWidget(widget.id)}
                                            disabled={deletingId === widget.id}
                                            className="p-2 rounded-lg transition-colors hover:bg-red-50"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                                        </button>
                                    </div>
                                </div>

                                {/* Stats Row */}
                                <div className="px-5 py-3 grid grid-cols-3 gap-4">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="w-3.5 h-3.5 text-[var(--surface-400)]" />
                                        <div>
                                            <p className="text-xs text-[var(--surface-500)]">Messages</p>
                                            <p className="text-sm font-bold text-[var(--surface-900)]">
                                                {formatNumber(widget.total_messages)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-3.5 h-3.5 text-[var(--surface-400)]" />
                                        <div>
                                            <p className="text-xs text-[var(--surface-500)]">Sessions</p>
                                            <p className="text-sm font-bold text-[var(--surface-900)]">
                                                {formatNumber(widget.total_conversations)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-3.5 h-3.5 text-[var(--surface-400)]" />
                                        <div>
                                            <p className="text-xs text-[var(--surface-500)]">Tokens</p>
                                            <p className="text-sm font-bold text-[var(--surface-900)]">
                                                {formatNumber(widget.total_tokens_used)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Info */}
                                <div
                                    className="px-5 py-2.5 flex items-center justify-between text-[11px]"
                                    style={{
                                        borderTop: "1px solid var(--surface-150, var(--surface-200))",
                                        color: "var(--surface-400)",
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1">
                                            <Shield className="w-3 h-3" />
                                            {PERSISTENCE_LABELS[widget.persistence_mode]?.label}
                                        </span>
                                        <span>•</span>
                                        <span>{widget.rate_limit_rpm} msg/min</span>
                                        {widget.allowed_domains?.length > 0 && (
                                            <>
                                                <span>•</span>
                                                <span>{widget.allowed_domains.length} domain{widget.allowed_domains.length > 1 ? "s" : ""}</span>
                                            </>
                                        )}
                                    </div>
                                    <span>{timeAgo(widget.created_at)}</span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* ── Modals ── */}
            {showCreate && (
                <CreateWidgetModal
                    agents={availableAgents}
                    onClose={() => setShowCreate(false)}
                    onCreated={handleCreated}
                />
            )}

            {embedWidget && (
                <EmbedCodeModal
                    widget={embedWidget}
                    onClose={() => setEmbedWidget(null)}
                />
            )}
        </div>
    );
}
