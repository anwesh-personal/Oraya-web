"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, Save, Loader2, Settings, Palette, Cpu, BookOpen,
    Layers, ShieldCheck, MessageSquare, Sparkles, Plus, Trash2,
    ChevronDown, ChevronUp, GripVertical, AlertTriangle, Check,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface WidgetEditorProps {
    widget: any;
    providers: any[];
}

interface QAPair {
    id: string;
    question: string;
    answer: string;
}

interface PromptLayer {
    id: string;
    label: string;
    content: string;
    priority: number;
}

interface BehaviorRule {
    id: string;
    rule: string;
    severity: "critical" | "important" | "standard";
}

// ─────────────────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────────────────

const TABS = [
    { key: "general", label: "General", icon: Settings },
    { key: "appearance", label: "Appearance", icon: Palette },
    { key: "ai_model", label: "AI Model", icon: Cpu },
    { key: "training", label: "Training Data", icon: BookOpen },
    { key: "prompts", label: "Prompt Stack", icon: Layers },
    { key: "rules", label: "Rules", icon: ShieldCheck },
    { key: "tone", label: "Tone & Style", icon: MessageSquare },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function uid(): string {
    return Math.random().toString(36).slice(2, 10);
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function WidgetEditor({ widget, providers }: WidgetEditorProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabKey>("general");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    // ── Form state ──
    const [name, setName] = useState(widget.name || "");
    const [welcomeMessage, setWelcomeMessage] = useState(widget.config?.welcome_message || "Hi! How can I help you today?");
    const [widgetType, setWidgetType] = useState(widget.widget_type || "bubble");
    const [position, setPosition] = useState(widget.config?.position || "bottom-right");
    const [persistenceMode, setPersistenceMode] = useState(widget.persistence_mode || "ephemeral");
    const [domainWhitelist, setDomainWhitelist] = useState((widget.domain_whitelist || []).join(", "));

    // Appearance
    const [primaryColor, setPrimaryColor] = useState(widget.config?.primary_color || "#6366f1");
    const [darkMode, setDarkMode] = useState(widget.config?.dark_mode ?? false);
    const [borderRadius, setBorderRadius] = useState(widget.config?.border_radius ?? 16);
    const [showBranding, setShowBranding] = useState(widget.config?.branding !== false);

    // AI Model
    const [selectedProviderId, setSelectedProviderId] = useState(widget.user_provider_id || "");
    const [selectedModel, setSelectedModel] = useState(widget.config?.model || "");

    // Training QA
    const [qaItems, setQaItems] = useState<QAPair[]>(() => {
        const existing = widget.config?.training_qa || [];
        return existing.length > 0
            ? existing.map((qa: any) => ({ id: uid(), question: qa.question || "", answer: qa.answer || "" }))
            : [{ id: uid(), question: "", answer: "" }];
    });

    // Prompt Stack
    const [promptLayers, setPromptLayers] = useState<PromptLayer[]>(() => {
        const existing = widget.config?.prompt_stack || [];
        return existing.length > 0
            ? existing.map((p: any, i: number) => ({ id: uid(), label: p.label || `Layer ${i + 1}`, content: p.content || "", priority: p.priority ?? i }))
            : [{ id: uid(), label: "Identity", content: "", priority: 0 }];
    });

    // Rules
    const [rules, setRules] = useState<BehaviorRule[]>(() => {
        const existing = widget.config?.rules || [];
        return existing.length > 0
            ? existing.map((r: any) => ({ id: uid(), rule: r.rule || "", severity: r.severity || "standard" }))
            : [];
    });

    // Tone
    const [formality, setFormality] = useState<number>(widget.config?.tone?.formality ?? 50);
    const [verbosity, setVerbosity] = useState<number>(widget.config?.tone?.verbosity ?? 50);
    const [emojiUsage, setEmojiUsage] = useState<string>(widget.config?.tone?.emoji_usage ?? "moderate");
    const [responseStyle, setResponseStyle] = useState<string>(widget.config?.tone?.response_style ?? "balanced");

    // ── Save ──
    const handleSave = useCallback(async () => {
        setSaving(true);
        setSaved(false);
        setError("");

        const config = {
            ...(widget.config || {}),
            welcome_message: welcomeMessage,
            position,
            primary_color: primaryColor,
            dark_mode: darkMode,
            border_radius: borderRadius,
            branding: showBranding,
            model: selectedModel,
            training_qa: qaItems.filter(qa => qa.question.trim() || qa.answer.trim()).map(qa => ({
                question: qa.question.trim(),
                answer: qa.answer.trim(),
            })),
            prompt_stack: promptLayers.map(p => ({
                label: p.label,
                content: p.content,
                priority: p.priority,
            })),
            rules: rules.filter(r => r.rule.trim()).map(r => ({
                rule: r.rule.trim(),
                severity: r.severity,
            })),
            tone: {
                formality,
                verbosity,
                emoji_usage: emojiUsage,
                response_style: responseStyle,
            },
        };

        try {
            const res = await fetch("/api/members/widgets", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: widget.id,
                    name: name.trim(),
                    widget_type: widgetType,
                    persistence_mode: persistenceMode,
                    domain_whitelist: domainWhitelist.split(",").map((d: string) => d.trim()).filter(Boolean),
                    user_provider_id: selectedProviderId || null,
                    config,
                }),
            });
            if (!res.ok) throw new Error((await res.json()).error || "Save failed");
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }, [
        widget, name, welcomeMessage, widgetType, position, persistenceMode,
        domainWhitelist, primaryColor, darkMode, borderRadius, showBranding,
        selectedProviderId, selectedModel, qaItems, promptLayers, rules,
        formality, verbosity, emojiUsage, responseStyle,
    ]);

    // ── Shared input style ──
    const inputStyle = {
        background: "var(--surface-100)",
        borderColor: "var(--surface-200)",
        color: "var(--surface-900)",
    };

    return (
        <div className="space-y-5">
            {/* ── Header ── */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/dashboard/widgets")}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-[var(--surface-200)]"
                        style={{ border: "1px solid var(--surface-200)" }}
                    >
                        <ArrowLeft className="w-4 h-4 text-[var(--surface-600)]" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-[var(--surface-900)] font-display">
                            {name || "Untitled Widget"}
                        </h1>
                        <p className="text-xs text-[var(--surface-500)]">
                            {widget.agent_templates?.name || "Unknown Agent"} • {widget.widget_key}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {error && (
                        <span className="text-xs text-red-500 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {error}
                        </span>
                    )}
                    {saved && (
                        <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "#22c55e" }}>
                            <Check className="w-3 h-3" /> Saved
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                        style={{ background: "var(--gradient-primary)" }}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>

            {/* ── Layout: Sidebar Tabs + Content ── */}
            <div className="flex gap-5">
                {/* Tab sidebar */}
                <div
                    className="w-48 flex-shrink-0 rounded-xl p-2 space-y-1"
                    style={{ background: "var(--surface-50)", border: "1px solid var(--surface-200)" }}
                >
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                                style={{
                                    background: isActive ? "color-mix(in srgb, var(--primary) 10%, var(--surface-50))" : "transparent",
                                    color: isActive ? "var(--primary)" : "var(--surface-600)",
                                }}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab content */}
                <div
                    className="flex-1 rounded-xl p-6 min-h-[500px]"
                    style={{ background: "var(--surface-50)", border: "1px solid var(--surface-200)" }}
                >

                    {/* ═══════ General ═══════ */}
                    {activeTab === "general" && (
                        <div className="space-y-5">
                            <h2 className="text-lg font-bold text-[var(--surface-900)]">General Settings</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-[var(--surface-700)] mb-1.5 block">Widget Name *</label>
                                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--primary)]"
                                        style={inputStyle} placeholder="My Customer Support Widget" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-[var(--surface-700)] mb-1.5 block">Widget Type</label>
                                    <select value={widgetType} onChange={e => setWidgetType(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--primary)]"
                                        style={inputStyle}>
                                        <option value="bubble">Floating Bubble</option>
                                        <option value="inline">Inline Embed</option>
                                        <option value="fullpage">Full Page</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-[var(--surface-700)] mb-1.5 block">Welcome Message</label>
                                <textarea value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--primary)] resize-none"
                                    style={inputStyle} rows={3} placeholder="Hi! How can I help you today?" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-[var(--surface-700)] mb-1.5 block">Position</label>
                                    <select value={position} onChange={e => setPosition(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--primary)]"
                                        style={inputStyle}>
                                        <option value="bottom-right">Bottom Right</option>
                                        <option value="bottom-left">Bottom Left</option>
                                        <option value="top-right">Top Right</option>
                                        <option value="top-left">Top Left</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-[var(--surface-700)] mb-1.5 block">Persistence Mode</label>
                                    <select value={persistenceMode} onChange={e => setPersistenceMode(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--primary)]"
                                        style={inputStyle}>
                                        <option value="ephemeral">Ephemeral (No History)</option>
                                        <option value="ip_persistent">IP Persistent</option>
                                        <option value="user_persistent">User Persistent (Cookie)</option>
                                        <option value="gated">Gated (Signup Wall)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-[var(--surface-700)] mb-1.5 block">Allowed Domains (comma-separated, leave empty for all)</label>
                                <input type="text" value={domainWhitelist} onChange={e => setDomainWhitelist(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border text-sm font-mono outline-none transition-colors focus:border-[var(--primary)]"
                                    style={inputStyle} placeholder="example.com, app.example.com" />
                            </div>
                        </div>
                    )}

                    {/* ═══════ Appearance ═══════ */}
                    {activeTab === "appearance" && (
                        <div className="space-y-5">
                            <h2 className="text-lg font-bold text-[var(--surface-900)]">Appearance</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-[var(--surface-700)] mb-1.5 block">Primary Color</label>
                                    <div className="flex items-center gap-3">
                                        <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                                            className="w-12 h-12 rounded-xl border cursor-pointer" style={{ borderColor: "var(--surface-200)" }} />
                                        <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                                            className="flex-1 px-4 py-3 rounded-xl border text-sm font-mono outline-none transition-colors focus:border-[var(--primary)]"
                                            style={inputStyle} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-[var(--surface-700)] mb-1.5 block">Border Radius</label>
                                    <div className="flex items-center gap-3">
                                        <input type="range" min="0" max="32" value={borderRadius}
                                            onChange={e => setBorderRadius(Number(e.target.value))}
                                            className="flex-1" style={{ accentColor: "var(--primary)" }} />
                                        <span className="text-sm font-mono text-[var(--surface-600)] w-12 text-right">{borderRadius}px</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors hover:bg-[var(--surface-100)]"
                                    style={{ borderColor: "var(--surface-200)" }}>
                                    <input type="checkbox" checked={darkMode} onChange={e => setDarkMode(e.target.checked)}
                                        className="w-5 h-5 rounded" style={{ accentColor: "var(--primary)" }} />
                                    <div>
                                        <span className="text-sm font-semibold text-[var(--surface-900)]">Dark Mode</span>
                                        <p className="text-[11px] text-[var(--surface-500)]">Use dark theme for the chat widget</p>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors hover:bg-[var(--surface-100)]"
                                    style={{ borderColor: "var(--surface-200)" }}>
                                    <input type="checkbox" checked={showBranding} onChange={e => setShowBranding(e.target.checked)}
                                        className="w-5 h-5 rounded" style={{ accentColor: "var(--primary)" }} />
                                    <div>
                                        <span className="text-sm font-semibold text-[var(--surface-900)]">Show Branding</span>
                                        <p className="text-[11px] text-[var(--surface-500)]">"Powered by Oraya" badge in widget</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* ═══════ AI Model ═══════ */}
                    {activeTab === "ai_model" && (
                        <div className="space-y-5">
                            <h2 className="text-lg font-bold text-[var(--surface-900)]">AI Model Selection</h2>

                            {providers.length === 0 ? (
                                <div className="p-6 rounded-xl text-center" style={{ background: "var(--surface-100)", border: "1px solid var(--surface-200)" }}>
                                    <Cpu className="w-10 h-10 mx-auto mb-3 opacity-40" style={{ color: "var(--primary)" }} />
                                    <p className="text-sm font-semibold text-[var(--surface-900)] mb-1">No AI Providers Configured</p>
                                    <p className="text-xs text-[var(--surface-500)] mb-4">
                                        Add your API keys first to select a model for this widget.
                                    </p>
                                    <a href="/dashboard/providers"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                                        style={{ background: "var(--gradient-primary)" }}>
                                        <Plus className="w-4 h-4" /> Add AI Provider
                                    </a>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-[var(--surface-700)] mb-1.5 block">Provider</label>
                                        <select value={selectedProviderId} onChange={e => { setSelectedProviderId(e.target.value); setSelectedModel(""); }}
                                            className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--primary)]"
                                            style={inputStyle}>
                                            <option value="">— Select a provider —</option>
                                            {providers.map((p: any) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.label} ({p.provider}) — {p.api_key_hint} {p.is_valid ? "✓" : "⚠"}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {selectedProviderId && (() => {
                                        const prov = providers.find((p: any) => p.id === selectedProviderId);
                                        const models = prov?.available_models || [];
                                        return (
                                            <div>
                                                <label className="text-xs font-semibold text-[var(--surface-700)] mb-1.5 block">
                                                    Model {models.length > 0 && <span className="font-normal text-[var(--surface-500)]">({models.length} available)</span>}
                                                </label>
                                                {models.length > 0 ? (
                                                    <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--primary)]"
                                                        style={inputStyle}>
                                                        <option value="">— Select a model —</option>
                                                        {models.map((m: any) => (
                                                            <option key={m.id} value={m.id}>{m.name || m.id}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input type="text" value={selectedModel} onChange={e => setSelectedModel(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl border text-sm font-mono outline-none transition-colors focus:border-[var(--primary)]"
                                                        style={inputStyle} placeholder="Enter model ID manually (e.g., gpt-4o)" />
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══════ Prompt Stack ═══════ */}
                    {activeTab === "prompts" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-[var(--surface-900)]">Prompt Stack</h2>
                                    <p className="text-xs text-[var(--surface-500)]">
                                        Layered instructions executed in priority order (0 = highest).
                                    </p>
                                </div>
                                <button
                                    onClick={() => setPromptLayers(prev => [...prev, { id: uid(), label: `Layer ${prev.length + 1}`, content: "", priority: prev.length }])}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                                    style={{ background: "var(--gradient-primary)" }}
                                >
                                    <Plus className="w-3 h-3" /> Add Layer
                                </button>
                            </div>

                            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                                {promptLayers
                                    .sort((a, b) => a.priority - b.priority)
                                    .map((layer, idx) => (
                                    <div
                                        key={layer.id}
                                        className="p-4 rounded-xl border space-y-3"
                                        style={{ background: "var(--surface-100)", borderColor: "var(--surface-200)" }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <GripVertical className="w-4 h-4 text-[var(--surface-400)] flex-shrink-0" />
                                            <input
                                                type="text"
                                                value={layer.label}
                                                onChange={e => setPromptLayers(prev => prev.map(l => l.id === layer.id ? { ...l, label: e.target.value } : l))}
                                                className="flex-1 px-3 py-1.5 rounded-lg border text-sm font-semibold outline-none transition-colors focus:border-[var(--primary)]"
                                                style={inputStyle}
                                                placeholder="Layer name (e.g., Identity, Context, Guardrails)"
                                            />
                                            <input
                                                type="number"
                                                value={layer.priority}
                                                onChange={e => setPromptLayers(prev => prev.map(l => l.id === layer.id ? { ...l, priority: Number(e.target.value) } : l))}
                                                className="w-16 px-2 py-1.5 rounded-lg border text-sm text-center font-mono outline-none transition-colors focus:border-[var(--primary)]"
                                                style={inputStyle}
                                                title="Priority (0 = highest)"
                                            />
                                            <button
                                                onClick={() => setPromptLayers(prev => prev.filter(l => l.id !== layer.id))}
                                                className="p-1.5 rounded-md transition-colors hover:bg-[var(--surface-200)]"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                            </button>
                                        </div>
                                        <textarea
                                            value={layer.content}
                                            onChange={e => setPromptLayers(prev => prev.map(l => l.id === layer.id ? { ...l, content: e.target.value } : l))}
                                            className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:border-[var(--primary)] resize-none"
                                            style={inputStyle}
                                            rows={4}
                                            placeholder="Enter prompt instructions for this layer..."
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ═══════ Rules ═══════ */}
                    {activeTab === "rules" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-[var(--surface-900)]">Behavioral Rules</h2>
                                    <p className="text-xs text-[var(--surface-500)]">
                                        Define rules the agent must follow. Higher severity = stricter enforcement.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setRules(prev => [...prev, { id: uid(), rule: "", severity: "standard" }])}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                                    style={{ background: "var(--gradient-primary)" }}
                                >
                                    <Plus className="w-3 h-3" /> Add Rule
                                </button>
                            </div>

                            {rules.length === 0 ? (
                                <div className="p-8 rounded-xl border border-dashed text-center" style={{ borderColor: "var(--surface-300)" }}>
                                    <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-40" style={{ color: "var(--primary)" }} />
                                    <p className="text-sm text-[var(--surface-500)]">No rules configured. Add rules to control agent behavior.</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                                    {rules.map((rule, idx) => (
                                        <div
                                            key={rule.id}
                                            className="p-4 rounded-xl border space-y-3"
                                            style={{ background: "var(--surface-100)", borderColor: "var(--surface-200)" }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-bold text-[var(--surface-500)] uppercase tracking-wider flex-shrink-0">
                                                    Rule #{idx + 1}
                                                </span>
                                                <select
                                                    value={rule.severity}
                                                    onChange={e => setRules(prev => prev.map(r => r.id === rule.id ? { ...r, severity: e.target.value as any } : r))}
                                                    className="px-3 py-1 rounded-lg border text-xs font-semibold outline-none transition-colors focus:border-[var(--primary)]"
                                                    style={{
                                                        ...inputStyle,
                                                        color: rule.severity === "critical" ? "#dc2626"
                                                            : rule.severity === "important" ? "#d97706"
                                                            : "var(--surface-700)",
                                                    }}
                                                >
                                                    <option value="standard">Standard</option>
                                                    <option value="important">Important</option>
                                                    <option value="critical">Critical</option>
                                                </select>
                                                <div className="flex-1" />
                                                <button
                                                    onClick={() => setRules(prev => prev.filter(r => r.id !== rule.id))}
                                                    className="p-1 rounded-md transition-colors hover:bg-[var(--surface-200)]"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                </button>
                                            </div>
                                            <textarea
                                                value={rule.rule}
                                                onChange={e => setRules(prev => prev.map(r => r.id === rule.id ? { ...r, rule: e.target.value } : r))}
                                                className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:border-[var(--primary)] resize-none"
                                                style={inputStyle}
                                                rows={2}
                                                placeholder="e.g., Never share internal pricing. Always recommend contacting sales for custom quotes."
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══════ Tone & Style ═══════ */}
                    {activeTab === "tone" && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-bold text-[var(--surface-900)]">Tone & Personality</h2>

                            {/* Formality slider */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-semibold text-[var(--surface-700)]">Formality</label>
                                    <span className="text-xs font-mono text-[var(--surface-500)]">{formality}%</span>
                                </div>
                                <input type="range" min="0" max="100" value={formality}
                                    onChange={e => setFormality(Number(e.target.value))}
                                    className="w-full" style={{ accentColor: "var(--primary)" }} />
                                <div className="flex justify-between mt-1">
                                    <span className="text-[10px] text-[var(--surface-400)]">Casual</span>
                                    <span className="text-[10px] text-[var(--surface-400)]">Formal</span>
                                </div>
                            </div>

                            {/* Verbosity slider */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-semibold text-[var(--surface-700)]">Verbosity</label>
                                    <span className="text-xs font-mono text-[var(--surface-500)]">{verbosity}%</span>
                                </div>
                                <input type="range" min="0" max="100" value={verbosity}
                                    onChange={e => setVerbosity(Number(e.target.value))}
                                    className="w-full" style={{ accentColor: "var(--primary)" }} />
                                <div className="flex justify-between mt-1">
                                    <span className="text-[10px] text-[var(--surface-400)]">Concise</span>
                                    <span className="text-[10px] text-[var(--surface-400)]">Detailed</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Emoji usage */}
                                <div>
                                    <label className="text-xs font-semibold text-[var(--surface-700)] mb-1.5 block">Emoji Usage</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {["none", "moderate", "frequent"].map(opt => (
                                            <button
                                                key={opt}
                                                onClick={() => setEmojiUsage(opt)}
                                                className="px-3 py-2.5 rounded-xl border text-xs font-semibold capitalize transition-all"
                                                style={{
                                                    background: emojiUsage === opt
                                                        ? "color-mix(in srgb, var(--primary) 10%, var(--surface-50))"
                                                        : "var(--surface-100)",
                                                    borderColor: emojiUsage === opt ? "var(--primary)" : "var(--surface-200)",
                                                    color: emojiUsage === opt ? "var(--primary)" : "var(--surface-600)",
                                                }}
                                            >
                                                {opt === "none" ? "🚫 None" : opt === "moderate" ? "🙂 Moderate" : "😄 Frequent"}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Response style */}
                                <div>
                                    <label className="text-xs font-semibold text-[var(--surface-700)] mb-1.5 block">Response Style</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {["technical", "balanced", "conversational"].map(opt => (
                                            <button
                                                key={opt}
                                                onClick={() => setResponseStyle(opt)}
                                                className="px-3 py-2.5 rounded-xl border text-xs font-semibold capitalize transition-all"
                                                style={{
                                                    background: responseStyle === opt
                                                        ? "color-mix(in srgb, var(--primary) 10%, var(--surface-50))"
                                                        : "var(--surface-100)",
                                                    borderColor: responseStyle === opt ? "var(--primary)" : "var(--surface-200)",
                                                    color: responseStyle === opt ? "var(--primary)" : "var(--surface-600)",
                                                }}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
