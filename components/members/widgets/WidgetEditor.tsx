"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, Save, Loader2, Settings, Palette, Cpu, BookOpen,
    Layers, ShieldCheck, MessageSquare, Sparkles, Plus, Trash2,
    ChevronDown, ChevronUp, GripVertical, AlertTriangle, Check,
    Upload, Globe, FileText, Image, Eye, Database, Brain,
    Copy, Download, ArrowRight, Tag, X,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface TemplateData {
    prompts: any[];
    examples: any[];
    rules: any[];
    knowledge: any[];
    memories: any[];
}

interface WidgetEditorProps {
    widget: any;
    providers: any[];
    templateData: TemplateData | null;
}

interface QAPair {
    id: string;
    question: string;
    answer: string;
    explanation?: string;
    tags?: string[];
    isInherited?: boolean;
}

interface PromptLayer {
    id: string;
    label: string;
    content: string;
    priority: number;
    promptType?: string;
    isInherited?: boolean;
}

interface BehaviorRule {
    id: string;
    rule: string;
    severity: "critical" | "important" | "standard";
    ruleType?: string;
    category?: string;
    isInherited?: boolean;
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
    { key: "knowledge", label: "Knowledge", icon: Database },
    { key: "rules", label: "Rules", icon: ShieldCheck },
    { key: "tone", label: "Tone & Style", icon: MessageSquare },
    { key: "memory", label: "Factory Memory", icon: Brain },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function uid(): string {
    return Math.random().toString(36).slice(2, 10);
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function WidgetEditor({ widget, providers, templateData }: WidgetEditorProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabKey>("general");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");
    const [showPreview, setShowPreview] = useState(true);

    const tmpl = widget.agent_templates;

    // ── Form state: General ──
    const [name, setName] = useState(widget.name || "");
    const [agentDisplayName, setAgentDisplayName] = useState(widget.config?.agent_display_name || tmpl?.name || "");
    const [agentBio, setAgentBio] = useState(widget.config?.agent_bio || tmpl?.tagline || "");
    const [avatarUrl, setAvatarUrl] = useState(widget.config?.avatar_url || tmpl?.icon_url || "");
    const [welcomeMessage, setWelcomeMessage] = useState(widget.config?.welcome_message || "Hi! How can I help you today?");
    const [widgetType, setWidgetType] = useState(widget.widget_type || "bubble");
    const [position, setPosition] = useState(widget.config?.position || "bottom-right");
    const [persistenceMode, setPersistenceMode] = useState(widget.persistence_mode || "ephemeral");
    const [domainWhitelist, setDomainWhitelist] = useState((widget.domain_whitelist || []).join(", "));

    // ── Core Prompt (from template, overridable) ──
    const [corePrompt, setCorePrompt] = useState(widget.config?.core_prompt_override || tmpl?.core_prompt || "");

    // Appearance
    const [primaryColor, setPrimaryColor] = useState(widget.primary_color || widget.config?.primary_color || "#6366f1");
    const [accentColor, setAccentColor] = useState(widget.accent_color || widget.config?.accent_color || "#4f46e5");
    const [bgColor, setBgColor] = useState(widget.bg_color || widget.config?.bg_color || "#ffffff");
    const [textColor, setTextColor] = useState(widget.text_color || widget.config?.text_color || "#1a1a2e");
    const [fontFamily, setFontFamily] = useState(widget.font_family || widget.config?.font_family || "Inter, system-ui, sans-serif");
    const [darkMode, setDarkMode] = useState(widget.dark_mode ?? widget.config?.dark_mode ?? false);
    const [borderRadius, setBorderRadius] = useState(widget.border_radius ?? widget.config?.border_radius ?? 16);
    const [showBranding, setShowBranding] = useState(widget.show_branding ?? widget.config?.branding !== false);
    const [bubbleSize, setBubbleSize] = useState(widget.bubble_size ?? 60);
    const [chatWidth, setChatWidth] = useState(widget.chat_width ?? 400);
    const [chatHeight, setChatHeight] = useState(widget.chat_height ?? 620);
    const [companyLogoUrl, setCompanyLogoUrl] = useState(widget.config?.company_logo_url || "");
    const [windowStyle, setWindowStyle] = useState<string>(widget.config?.window_style || "solid");
    const [soundEnabled, setSoundEnabled] = useState(widget.sound_enabled ?? false);
    const [autoOpen, setAutoOpen] = useState(widget.auto_open ?? false);
    const [autoOpenDelay, setAutoOpenDelay] = useState(widget.auto_open_delay ?? 3000);

    // AI Model
    const [selectedProviderId, setSelectedProviderId] = useState(widget.user_provider_id || "");
    const [selectedModel, setSelectedModel] = useState(widget.config?.model || "");

    // ── Training Data (template inherited + user additions) ──
    const [qaItems, setQaItems] = useState<QAPair[]>(() => {
        // User overrides take priority
        const userQA = widget.config?.training_qa || [];
        if (userQA.length > 0) {
            return userQA.map((qa: any) => ({
                id: uid(), question: qa.question || "", answer: qa.answer || "",
                explanation: qa.explanation || "", tags: qa.tags || [], isInherited: false,
            }));
        }
        // Fall back to template examples
        const tExamples = templateData?.examples || [];
        if (tExamples.length > 0) {
            return tExamples.map((ex: any) => ({
                id: uid(), question: ex.user_input || "", answer: ex.expected_output || "",
                explanation: ex.explanation || "", tags: ex.tags || [], isInherited: true,
            }));
        }
        return [];
    });
    const [rawContext, setRawContext] = useState(widget.config?.raw_context || "");
    const [bulkImportMode, setBulkImportMode] = useState<"none" | "csv" | "paste">("none");
    const [bulkImportText, setBulkImportText] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Prompt Stack (template inherited + user) ──
    const [promptLayers, setPromptLayers] = useState<PromptLayer[]>(() => {
        const userLayers = widget.config?.prompt_stack || [];
        if (userLayers.length > 0) {
            return userLayers.map((p: any, i: number) => ({
                id: uid(), label: p.label || `Layer ${i + 1}`, content: p.content || "",
                priority: p.priority ?? i, promptType: p.prompt_type || "system", isInherited: false,
            }));
        }
        const tPrompts = templateData?.prompts || [];
        if (tPrompts.length > 0) {
            return tPrompts.map((p: any) => ({
                id: uid(), label: p.label || "Untitled", content: p.content || "",
                priority: p.priority ?? 0, promptType: p.prompt_type || "system", isInherited: true,
            }));
        }
        return [{ id: uid(), label: "Identity", content: "", priority: 0, promptType: "system", isInherited: false }];
    });

    // ── Knowledge Bases (read-only from template) ──
    const templateKnowledge = useMemo(() => templateData?.knowledge || [], [templateData]);

    // ── Rules (template inherited + user) ──
    const [rules, setRules] = useState<BehaviorRule[]>(() => {
        const userRules = widget.config?.rules || [];
        if (userRules.length > 0) {
            return userRules.map((r: any) => ({
                id: uid(), rule: r.rule || "", severity: r.severity || "standard",
                ruleType: r.rule_type || "must_do", category: r.category || "", isInherited: false,
            }));
        }
        const tRules = templateData?.rules || [];
        if (tRules.length > 0) {
            return tRules.map((r: any) => ({
                id: uid(), rule: r.content || "", severity: r.severity || "important",
                ruleType: r.rule_type || "must_do", category: r.category || "", isInherited: true,
            }));
        }
        return [];
    });

    // ── Factory Memory (read-only from template) ──
    const templateMemories = useMemo(() => templateData?.memories || [], [templateData]);

    // ── Tone & Personality ──
    const [formality, setFormality] = useState<number>(widget.config?.tone?.formality ?? 50);
    const [verbosity, setVerbosity] = useState<number>(widget.config?.tone?.verbosity ?? 50);
    const [emojiUsage, setEmojiUsage] = useState<string>(widget.config?.tone?.emoji_usage ?? "moderate");
    const [responseStyle, setResponseStyle] = useState<string>(widget.config?.tone?.response_style ?? "balanced");
    const [personalityText, setPersonalityText] = useState(
        widget.config?.personality_override?.personality || tmpl?.personality_config?.personality || ""
    );
    const [styleText, setStyleText] = useState(
        widget.config?.personality_override?.style || tmpl?.personality_config?.style || ""
    );
    const [toneText, setToneText] = useState(
        widget.config?.personality_override?.tone || tmpl?.personality_config?.tone || ""
    );

    // ── Save ──
    const handleSave = useCallback(async () => {
        setSaving(true);
        setSaved(false);
        setError("");

        const config = {
            ...(widget.config || {}),
            // General
            agent_display_name: agentDisplayName,
            agent_bio: agentBio,
            avatar_url: avatarUrl,
            welcome_message: welcomeMessage,
            position,
            core_prompt_override: corePrompt,
            // Appearance (also in top-level columns)
            primary_color: primaryColor,
            accent_color: accentColor,
            bg_color: bgColor,
            text_color: textColor,
            font_family: fontFamily,
            dark_mode: darkMode,
            border_radius: borderRadius,
            branding: showBranding,
            company_logo_url: companyLogoUrl,
            window_style: windowStyle,
            // AI Model
            model: selectedModel,
            // Training Data
            training_qa: qaItems.filter(qa => qa.question.trim() || qa.answer.trim()).map(qa => ({
                question: qa.question.trim(),
                answer: qa.answer.trim(),
                explanation: qa.explanation?.trim() || "",
                tags: qa.tags || [],
            })),
            raw_context: rawContext,
            // Prompt Stack
            prompt_stack: promptLayers.map(p => ({
                label: p.label,
                content: p.content,
                priority: p.priority,
                prompt_type: p.promptType || "system",
            })),
            // Rules
            rules: rules.filter(r => r.rule.trim()).map(r => ({
                rule: r.rule.trim(),
                severity: r.severity,
                rule_type: r.ruleType || "must_do",
                category: r.category || "",
            })),
            // Tone & Personality
            tone: {
                formality,
                verbosity,
                emoji_usage: emojiUsage,
                response_style: responseStyle,
            },
            personality_override: {
                personality: personalityText,
                style: styleText,
                tone: toneText,
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
                    // Dedicated DB columns
                    primary_color: primaryColor,
                    accent_color: accentColor,
                    bg_color: bgColor,
                    text_color: textColor,
                    font_family: fontFamily,
                    border_radius: borderRadius,
                    dark_mode: darkMode,
                    show_branding: showBranding,
                    bubble_size: bubbleSize,
                    chat_width: chatWidth,
                    chat_height: chatHeight,
                    sound_enabled: soundEnabled,
                    auto_open: autoOpen,
                    auto_open_delay: autoOpenDelay,
                    avatar_url: avatarUrl || null,
                    welcome_message: welcomeMessage,
                    placeholder: widget.placeholder || "Type a message...",
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
        widget, name, agentDisplayName, agentBio, avatarUrl, welcomeMessage,
        widgetType, position, persistenceMode, domainWhitelist, corePrompt,
        primaryColor, accentColor, bgColor, textColor, fontFamily,
        darkMode, borderRadius, showBranding, bubbleSize, chatWidth, chatHeight,
        companyLogoUrl, windowStyle, soundEnabled, autoOpen, autoOpenDelay,
        selectedProviderId, selectedModel, qaItems, rawContext, promptLayers, rules,
        formality, verbosity, emojiUsage, responseStyle,
        personalityText, styleText, toneText,
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
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                        style={{
                            background: showPreview ? "color-mix(in srgb, var(--primary) 10%, var(--surface-50))" : "var(--surface-100)",
                            border: showPreview ? "1px solid var(--primary)" : "1px solid var(--surface-200)",
                            color: showPreview ? "var(--primary)" : "var(--surface-600)",
                        }}
                    >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                    </button>
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

                            {/* ── Agent Identity ── */}
                            <div className="p-4 rounded-xl space-y-4" style={{ background: "color-mix(in srgb, var(--primary) 3%, var(--surface-100))", border: "1px solid color-mix(in srgb, var(--primary) 10%, var(--surface-200))" }}>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--surface-500)]">Agent Identity</h3>
                                <div className="flex items-start gap-5">
                                    {/* Avatar preview */}
                                    <div className="flex flex-col items-center gap-2 flex-shrink-0">
                                        <div
                                            className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden"
                                            style={{
                                                background: avatarUrl
                                                    ? "transparent"
                                                    : "color-mix(in srgb, var(--primary) 12%, var(--surface-200))",
                                                border: "2px solid color-mix(in srgb, var(--primary) 25%, var(--surface-200))",
                                            }}
                                        >
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt="Agent" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-3xl">{tmpl?.emoji || "🤖"}</span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-[var(--surface-500)]">Avatar</span>
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <label className="text-xs font-semibold text-[var(--surface-700)] mb-1.5 block">Display Name</label>
                                            <input type="text" value={agentDisplayName} onChange={e => setAgentDisplayName(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--primary)]"
                                                style={inputStyle} placeholder="Agent name shown to visitors" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-[var(--surface-700)] mb-1.5 block">Bio / Tagline</label>
                                            <input type="text" value={agentBio} onChange={e => setAgentBio(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--primary)]"
                                                style={inputStyle} placeholder="Short description shown in chat header" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-[var(--surface-700)] mb-1.5 block">Avatar URL</label>
                                            <input type="text" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border text-sm font-mono outline-none transition-colors focus:border-[var(--primary)]"
                                                style={inputStyle} placeholder="https://your-domain.com/avatar.png" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── Widget Config ── */}
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

                            {/* ── Core Prompt Override ── */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-semibold text-[var(--surface-700)]">Core System Prompt</label>
                                    {tmpl?.core_prompt && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                                            style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)", color: "var(--primary)" }}>
                                            Inherited from {tmpl.name}
                                        </span>
                                    )}
                                </div>
                                <textarea value={corePrompt} onChange={e => setCorePrompt(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--primary)] resize-none font-mono"
                                    style={inputStyle} rows={6} placeholder="You are a helpful AI assistant..." />
                                <p className="text-[10px] text-[var(--surface-400)] mt-1">{corePrompt.length.toLocaleString()} chars • ~{Math.ceil(corePrompt.length / 4).toLocaleString()} tokens</p>
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
                        <div className="space-y-6">
                            <h2 className="text-lg font-bold text-[var(--surface-900)]">Design Studio</h2>

                            {/* ── Color Palette ── */}
                            <div className="p-4 rounded-xl space-y-4" style={{ background: "color-mix(in srgb, var(--primary) 3%, var(--surface-100))", border: "1px solid color-mix(in srgb, var(--primary) 10%, var(--surface-200))" }}>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--surface-500)]">Color Palette</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {([
                                        { label: "Primary", val: primaryColor, set: setPrimaryColor },
                                        { label: "Accent", val: accentColor, set: setAccentColor },
                                        { label: "Background", val: bgColor, set: setBgColor },
                                        { label: "Text", val: textColor, set: setTextColor },
                                    ] as const).map(c => (
                                        <div key={c.label}>
                                            <label className="text-xs font-semibold text-[var(--surface-700)] mb-1.5 block">{c.label}</label>
                                            <div className="flex items-center gap-2">
                                                <input type="color" value={c.val} onChange={e => c.set(e.target.value)}
                                                    className="w-10 h-10 rounded-lg border cursor-pointer flex-shrink-0" style={{ borderColor: "var(--surface-200)" }} />
                                                <input type="text" value={c.val} onChange={e => c.set(e.target.value)}
                                                    className="flex-1 px-3 py-2 rounded-lg border text-xs font-mono outline-none transition-colors focus:border-[var(--primary)]"
                                                    style={inputStyle} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Live swatch preview */}
                                <div className="flex gap-2 pt-2">
                                    <div className="flex-1 h-8 rounded-lg" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }} />
                                    <div className="w-16 h-8 rounded-lg border" style={{ background: bgColor, borderColor: "var(--surface-200)" }} />
                                    <div className="w-16 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: bgColor, color: textColor }}>Aa</div>
                                </div>
                            </div>

                            {/* ── Typography ── */}
                            <div className="p-4 rounded-xl space-y-4" style={{ background: "var(--surface-100)", border: "1px solid var(--surface-200)" }}>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--surface-500)]">Typography</h3>
                                <div>
                                    <label className="text-xs font-semibold text-[var(--surface-700)] mb-1.5 block">Font Family</label>
                                    <select value={fontFamily} onChange={e => setFontFamily(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--primary)]"
                                        style={inputStyle}>
                                        <option value="Inter, system-ui, sans-serif">Inter (Modern)</option>
                                        <option value="DM Sans, sans-serif">DM Sans (Clean)</option>
                                        <option value="Plus Jakarta Sans, sans-serif">Plus Jakarta Sans (Premium)</option>
                                        <option value="Poppins, sans-serif">Poppins (Friendly)</option>
                                        <option value="Roboto, sans-serif">Roboto (Neutral)</option>
                                        <option value="Montserrat, sans-serif">Montserrat (Bold)</option>
                                        <option value="system-ui, -apple-system, sans-serif">System Default</option>
                                    </select>
                                </div>
                            </div>

                            {/* ── Company Logo ── */}
                            <div className="p-4 rounded-xl space-y-3" style={{ background: "var(--surface-100)", border: "1px solid var(--surface-200)" }}>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--surface-500)]">Company Logo</h3>
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                                        style={{ background: "var(--surface-200)", border: "1px solid var(--surface-300)" }}>
                                        {companyLogoUrl ? (
                                            <img src={companyLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                                        ) : (
                                            <Image className="w-5 h-5 text-[var(--surface-400)]" />
                                        )}
                                    </div>
                                    <input type="text" value={companyLogoUrl} onChange={e => setCompanyLogoUrl(e.target.value)}
                                        className="flex-1 px-4 py-3 rounded-xl border text-sm font-mono outline-none transition-colors focus:border-[var(--primary)]"
                                        style={inputStyle} placeholder="https://your-company.com/logo.png" />
                                </div>
                                <p className="text-[10px] text-[var(--surface-400)]">Shown in the chat header. Use a square or landscape logo (SVG or PNG recommended).</p>
                            </div>

                            {/* ── Dimensions ── */}
                            <div className="p-4 rounded-xl space-y-4" style={{ background: "var(--surface-100)", border: "1px solid var(--surface-200)" }}>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--surface-500)]">Dimensions</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {([
                                        { label: "Border Radius", val: borderRadius, set: setBorderRadius, min: 0, max: 32, unit: "px" },
                                        { label: "Bubble Size", val: bubbleSize, set: setBubbleSize, min: 42, max: 80, unit: "px" },
                                        { label: "Chat Width", val: chatWidth, set: setChatWidth, min: 320, max: 500, unit: "px" },
                                        { label: "Chat Height", val: chatHeight, set: setChatHeight, min: 400, max: 720, unit: "px" },
                                    ] as const).map(d => (
                                        <div key={d.label}>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <label className="text-xs font-semibold text-[var(--surface-700)]">{d.label}</label>
                                                <span className="text-xs font-mono text-[var(--surface-500)]">{d.val}{d.unit}</span>
                                            </div>
                                            <input type="range" min={d.min} max={d.max} value={d.val}
                                                onChange={e => d.set(Number(e.target.value))}
                                                className="w-full" style={{ accentColor: "var(--primary)" }} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ── Window Style Presets ── */}
                            <div className="p-4 rounded-xl space-y-3" style={{ background: "var(--surface-100)", border: "1px solid var(--surface-200)" }}>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--surface-500)]">Window Style</h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {([
                                        { key: "solid", label: "Solid", desc: "Clean flat" },
                                        { key: "glass", label: "Glass", desc: "Frosted blur" },
                                        { key: "gradient", label: "Gradient", desc: "Vibrant header" },
                                        { key: "shadow", label: "Shadow", desc: "Elevated card" },
                                    ] as const).map(preset => (
                                        <button key={preset.key} onClick={() => setWindowStyle(preset.key)}
                                            className="p-3 rounded-xl border text-center transition-all"
                                            style={{
                                                background: windowStyle === preset.key
                                                    ? "color-mix(in srgb, var(--primary) 10%, var(--surface-50))"
                                                    : "var(--surface-50)",
                                                borderColor: windowStyle === preset.key ? "var(--primary)" : "var(--surface-200)",
                                                boxShadow: windowStyle === preset.key ? "0 0 0 1px var(--primary)" : "none",
                                            }}>
                                            <span className="text-xs font-bold block" style={{ color: windowStyle === preset.key ? "var(--primary)" : "var(--surface-900)" }}>
                                                {preset.label}
                                            </span>
                                            <span className="text-[10px] text-[var(--surface-500)]">{preset.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ── Toggles ── */}
                            <div className="grid grid-cols-2 gap-3">
                                {([
                                    { label: "Dark Mode", desc: "Dark theme for widget", checked: darkMode, set: (v: boolean) => setDarkMode(v) },
                                    { label: "Show Branding", desc: "\"Powered by Oraya\" badge", checked: showBranding, set: (v: boolean) => setShowBranding(v) },
                                    { label: "Sound Effects", desc: "Play sound on new messages", checked: soundEnabled, set: (v: boolean) => setSoundEnabled(v) },
                                    { label: "Auto-Open", desc: "Open chat after page load", checked: autoOpen, set: (v: boolean) => setAutoOpen(v) },
                                ] as const).map(t => (
                                    <label key={t.label} className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:bg-[var(--surface-50)]"
                                        style={{ borderColor: t.checked ? "var(--primary)" : "var(--surface-200)", background: t.checked ? "color-mix(in srgb, var(--primary) 5%, var(--surface-50))" : "var(--surface-50)" }}>
                                        <input type="checkbox" checked={t.checked} onChange={e => t.set(e.target.checked)}
                                            className="w-4 h-4 rounded" style={{ accentColor: "var(--primary)" }} />
                                        <div>
                                            <span className="text-xs font-semibold text-[var(--surface-900)] block">{t.label}</span>
                                            <span className="text-[10px] text-[var(--surface-500)]">{t.desc}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            {autoOpen && (
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-semibold text-[var(--surface-700)]">Auto-Open Delay</label>
                                        <span className="text-xs font-mono text-[var(--surface-500)]">{(autoOpenDelay / 1000).toFixed(1)}s</span>
                                    </div>
                                    <input type="range" min="1000" max="10000" step="500" value={autoOpenDelay}
                                        onChange={e => setAutoOpenDelay(Number(e.target.value))}
                                        className="w-full" style={{ accentColor: "var(--primary)" }} />
                                </div>
                            )}
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

                    {/* ═══════ Training Data ═══════ */}
                    {activeTab === "training" && (
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-[var(--surface-900)]">Training Data</h2>
                                    <p className="text-xs text-[var(--surface-500)]">
                                        Few-shot examples teach the agent how to respond. {qaItems.length > 0 && <span className="font-semibold text-[var(--primary)]">{qaItems.length} examples loaded</span>}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setBulkImportMode(bulkImportMode === "none" ? "paste" : "none")}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                                        style={{
                                            background: bulkImportMode !== "none"
                                                ? "color-mix(in srgb, var(--primary) 15%, var(--surface-100))"
                                                : "var(--surface-200)",
                                            color: bulkImportMode !== "none" ? "var(--primary)" : "var(--surface-700)",
                                            border: `1px solid ${bulkImportMode !== "none" ? "var(--primary)" : "var(--surface-300)"}`,
                                        }}
                                    >
                                        <Upload className="w-3 h-3" /> Bulk Import
                                    </button>
                                    <button
                                        onClick={() => setQaItems(prev => [...prev, { id: uid(), question: "", answer: "", explanation: "", tags: [], isInherited: false }])}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                                        style={{ background: "var(--gradient-primary)" }}
                                    >
                                        <Plus className="w-3 h-3" /> Add Example
                                    </button>
                                </div>
                            </div>

                            {/* ── Bulk Import Panel ── */}
                            {bulkImportMode !== "none" && (
                                <div className="p-4 rounded-xl space-y-3" style={{ background: "color-mix(in srgb, var(--primary) 5%, var(--surface-100))", border: "1px solid color-mix(in srgb, var(--primary) 20%, var(--surface-200))" }}>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-[var(--surface-900)] flex items-center gap-2">
                                            <Upload className="w-4 h-4 text-[var(--primary)]" />
                                            Bulk Import
                                        </h3>
                                        <button onClick={() => { setBulkImportMode("none"); setBulkImportText(""); }} className="p-1 rounded hover:bg-[var(--surface-200)]">
                                            <X className="w-3.5 h-3.5 text-[var(--surface-500)]" />
                                        </button>
                                    </div>

                                    {/* Mode toggle */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setBulkImportMode("csv")}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                                            style={{
                                                background: bulkImportMode === "csv" ? "color-mix(in srgb, var(--primary) 12%, var(--surface-50))" : "var(--surface-100)",
                                                border: `1px solid ${bulkImportMode === "csv" ? "var(--primary)" : "var(--surface-200)"}`,
                                                color: bulkImportMode === "csv" ? "var(--primary)" : "var(--surface-600)",
                                            }}
                                        >
                                            <FileText className="w-3 h-3" /> Upload CSV/JSON
                                        </button>
                                        <button
                                            onClick={() => setBulkImportMode("paste")}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                                            style={{
                                                background: bulkImportMode === "paste" ? "color-mix(in srgb, var(--primary) 12%, var(--surface-50))" : "var(--surface-100)",
                                                border: `1px solid ${bulkImportMode === "paste" ? "var(--primary)" : "var(--surface-200)"}`,
                                                color: bulkImportMode === "paste" ? "var(--primary)" : "var(--surface-600)",
                                            }}
                                        >
                                            <Copy className="w-3 h-3" /> Paste Text
                                        </button>
                                    </div>

                                    {/* CSV/JSON upload */}
                                    {bulkImportMode === "csv" && (
                                        <div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".csv,.json,.txt"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    const reader = new FileReader();
                                                    reader.onload = (ev) => {
                                                        const text = ev.target?.result as string;
                                                        setBulkImportText(text);
                                                    };
                                                    reader.readAsText(file);
                                                }}
                                            />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full py-6 rounded-xl border-2 border-dashed text-center transition-colors hover:bg-[var(--surface-100)]"
                                                style={{ borderColor: "var(--surface-300)", color: "var(--surface-500)" }}
                                            >
                                                <Upload className="w-6 h-6 mx-auto mb-2 opacity-60" />
                                                <p className="text-sm font-semibold">Drop a CSV or JSON file here</p>
                                                <p className="text-[11px] mt-1">CSV: <code className="px-1 py-0.5 rounded bg-[var(--surface-200)]">question,answer</code> — JSON: <code className="px-1 py-0.5 rounded bg-[var(--surface-200)]">[{"{"}q, a{"}"}]</code></p>
                                            </button>
                                        </div>
                                    )}

                                    {/* Paste mode */}
                                    {bulkImportMode === "paste" && (
                                        <div>
                                            <textarea
                                                value={bulkImportText}
                                                onChange={(e) => setBulkImportText(e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border text-sm font-mono outline-none transition-colors focus:border-[var(--primary)] resize-none"
                                                style={inputStyle}
                                                rows={8}
                                                placeholder={"Q: What is your return policy?\nA: We offer 30-day returns on all items.\n---\nQ: How do I track my order?\nA: Visit our tracking page and enter your order number.\n---\n\nOr paste tab-separated:\nWhat is your return policy?\\tWe offer 30-day returns.\nHow do I track my order?\\tVisit our tracking page."}
                                            />
                                        </div>
                                    )}

                                    {/* Preview + Import button */}
                                    {bulkImportText.trim() && (() => {
                                        // Parse the bulk text
                                        let parsed: { question: string; answer: string }[] = [];
                                        const text = bulkImportText.trim();

                                        // Try JSON first
                                        try {
                                            const json = JSON.parse(text);
                                            if (Array.isArray(json)) {
                                                parsed = json.map((item: any) => ({
                                                    question: item.question || item.q || item.user_input || item.input || "",
                                                    answer: item.answer || item.a || item.expected_output || item.output || item.response || "",
                                                })).filter(p => p.question && p.answer);
                                            }
                                        } catch {
                                            // Try Q:/A: block format
                                            const blocks = text.split(/---+|\n\n/).filter((b: string) => b.trim());
                                            const qaParsed = blocks.map((block: string) => {
                                                const qMatch = block.match(/Q:\s*(.*)/i);
                                                const aMatch = block.match(/A:\s*([\s\S]*?)(?=$|Q:)/i);
                                                if (qMatch && aMatch) {
                                                    return { question: qMatch[1].trim(), answer: aMatch[1].trim() };
                                                }
                                                return null;
                                            }).filter(Boolean) as { question: string; answer: string }[];

                                            if (qaParsed.length > 0) {
                                                parsed = qaParsed;
                                            } else {
                                                // Try CSV/TSV
                                                const lines = text.split("\n").filter((l: string) => l.trim());
                                                const hasHeader = lines[0]?.toLowerCase().includes("question") || lines[0]?.toLowerCase().includes("input");
                                                const start = hasHeader ? 1 : 0;
                                                parsed = lines.slice(start).map((line: string) => {
                                                    const sep = line.includes("\t") ? "\t" : ",";
                                                    const parts = line.split(sep).map((s: string) => s.replace(/^"|"$/g, "").trim());
                                                    return { question: parts[0] || "", answer: parts[1] || "" };
                                                }).filter(p => p.question && p.answer);
                                            }
                                        }

                                        return (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between px-1">
                                                    <span className="text-xs font-semibold text-[var(--surface-700)]">
                                                        {parsed.length} example{parsed.length !== 1 ? "s" : ""} detected
                                                    </span>
                                                    {parsed.length > 0 && (
                                                        <span className="text-[10px] text-[var(--surface-500)]">
                                                            Preview: &ldquo;{parsed[0].question.slice(0, 60)}...&rdquo;
                                                        </span>
                                                    )}
                                                </div>
                                                {parsed.length > 0 && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                const newItems = parsed.map(p => ({
                                                                    id: uid(), question: p.question, answer: p.answer,
                                                                    explanation: "", tags: [] as string[], isInherited: false,
                                                                }));
                                                                setQaItems(prev => [...prev, ...newItems]);
                                                                setBulkImportText("");
                                                                setBulkImportMode("none");
                                                            }}
                                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
                                                            style={{ background: "var(--gradient-primary)" }}
                                                        >
                                                            <Plus className="w-3 h-3" /> Append ({parsed.length}) to Existing
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const newItems = parsed.map(p => ({
                                                                    id: uid(), question: p.question, answer: p.answer,
                                                                    explanation: "", tags: [] as string[], isInherited: false,
                                                                }));
                                                                setQaItems(newItems);
                                                                setBulkImportText("");
                                                                setBulkImportMode("none");
                                                            }}
                                                            className="px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all hover:bg-[var(--surface-100)]"
                                                            style={{ borderColor: "var(--surface-300)", color: "var(--surface-700)" }}
                                                        >
                                                            Replace All
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* ── Q&A Cards ── */}
                            {qaItems.length === 0 ? (
                                <div className="p-8 rounded-xl border border-dashed text-center" style={{ borderColor: "var(--surface-300)" }}>
                                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" style={{ color: "var(--primary)" }} />
                                    <p className="text-sm font-semibold text-[var(--surface-700)] mb-1">No training examples yet</p>
                                    <p className="text-xs text-[var(--surface-500)]">Add Q&A pairs manually or use Bulk Import for 100+ examples at once.</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                                    {qaItems.map((qa, idx) => (
                                        <div
                                            key={qa.id}
                                            className="p-4 rounded-xl border space-y-3"
                                            style={{
                                                background: qa.isInherited
                                                    ? "color-mix(in srgb, var(--primary) 3%, var(--surface-50))"
                                                    : "var(--surface-100)",
                                                borderColor: qa.isInherited
                                                    ? "color-mix(in srgb, var(--primary) 15%, var(--surface-200))"
                                                    : "var(--surface-200)",
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-[var(--surface-500)] uppercase tracking-wider">#{idx + 1}</span>
                                                {qa.isInherited && (
                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                                                        style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)" }}>
                                                        Template
                                                    </span>
                                                )}
                                                {qa.tags && qa.tags.length > 0 && qa.tags.map((tag, ti) => (
                                                    <span key={ti} className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
                                                        style={{ background: "var(--surface-200)", color: "var(--surface-600)" }}>
                                                        {tag}
                                                    </span>
                                                ))}
                                                <div className="flex-1" />
                                                <button
                                                    onClick={() => setQaItems(prev => prev.filter(q => q.id !== qa.id))}
                                                    className="p-1 rounded-md transition-colors hover:bg-[var(--surface-200)]"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--surface-500)] mb-1 block">User Input</label>
                                                    <textarea
                                                        value={qa.question}
                                                        onChange={e => setQaItems(prev => prev.map(q => q.id === qa.id ? { ...q, question: e.target.value, isInherited: false } : q))}
                                                        className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:border-[var(--primary)] resize-none"
                                                        style={inputStyle}
                                                        rows={3}
                                                        placeholder="User's question or input..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--surface-500)] mb-1 block">Expected Response</label>
                                                    <textarea
                                                        value={qa.answer}
                                                        onChange={e => setQaItems(prev => prev.map(q => q.id === qa.id ? { ...q, answer: e.target.value, isInherited: false } : q))}
                                                        className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:border-[var(--primary)] resize-none"
                                                        style={inputStyle}
                                                        rows={3}
                                                        placeholder="Ideal agent response..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ── Raw Knowledge Context ── */}
                            <div className="pt-3" style={{ borderTop: "1px solid var(--surface-200)" }}>
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <h3 className="text-sm font-bold text-[var(--surface-900)]">Raw Knowledge Context</h3>
                                        <p className="text-[11px] text-[var(--surface-500)]">Paste unstructured text — product docs, FAQs, company info — the agent will reference.</p>
                                    </div>
                                    {rawContext && (
                                        <span className="text-[10px] font-mono text-[var(--surface-400)]">{rawContext.length.toLocaleString()} chars</span>
                                    )}
                                </div>
                                <textarea
                                    value={rawContext}
                                    onChange={e => setRawContext(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--primary)] resize-none"
                                    style={inputStyle}
                                    rows={6}
                                    placeholder="Paste your company knowledge base, product documentation, FAQ content, or any reference material here..."
                                />
                            </div>
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

                            {/* ── Personality Config (from template, overridable) ── */}
                            <div className="p-4 rounded-xl space-y-4" style={{ background: "color-mix(in srgb, var(--primary) 3%, var(--surface-100))", border: "1px solid color-mix(in srgb, var(--primary) 10%, var(--surface-200))" }}>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--surface-500)]">Personality Config</h3>
                                    {tmpl?.personality_config && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                                            style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)", color: "var(--primary)" }}>
                                            Inherited from {tmpl.name}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-[var(--surface-700)] mb-1.5 block">Personality</label>
                                    <textarea value={personalityText} onChange={e => setPersonalityText(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--primary)] resize-none"
                                        style={inputStyle} rows={3}
                                        placeholder="Pragmatic craftsman. Strong opinions loosely held." />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-[var(--surface-700)] mb-1.5 block">Communication Style</label>
                                    <textarea value={styleText} onChange={e => setStyleText(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--primary)] resize-none"
                                        style={inputStyle} rows={3}
                                        placeholder="Implementation-driven. Complete runnable code." />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-[var(--surface-700)] mb-1.5 block">Tone of Voice</label>
                                    <textarea value={toneText} onChange={e => setToneText(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--primary)] resize-none"
                                        style={inputStyle} rows={3}
                                        placeholder="Collegial. Like a senior engineer pairing with you." />
                                </div>
                            </div>

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

                    {/* ═══════ Knowledge (read-only from template) ═══════ */}
                    {activeTab === "knowledge" && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-bold text-[var(--surface-900)]">Knowledge Bases</h2>
                                <p className="text-xs text-[var(--surface-500)]">
                                    Inherited from the agent template. Contact your admin to modify.
                                </p>
                            </div>

                            {templateKnowledge.length === 0 ? (
                                <div className="p-8 rounded-xl border border-dashed text-center" style={{ borderColor: "var(--surface-300)" }}>
                                    <Database className="w-8 h-8 mx-auto mb-2 opacity-40" style={{ color: "var(--primary)" }} />
                                    <p className="text-sm font-semibold text-[var(--surface-700)] mb-1">No knowledge bases configured</p>
                                    <p className="text-xs text-[var(--surface-500)]">The selected agent template has no knowledge bases attached.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {templateKnowledge.map((kb: any) => (
                                        <div key={kb.id} className="p-4 rounded-xl border"
                                            style={{ background: "color-mix(in srgb, var(--primary) 2%, var(--surface-50))", borderColor: "var(--surface-200)" }}>
                                            <div className="flex items-center gap-2 mb-2">
                                                {kb.kb_type === "document" && <FileText className="w-4 h-4 text-blue-400" />}
                                                {kb.kb_type === "url" && <Globe className="w-4 h-4 text-green-400" />}
                                                {kb.kb_type === "manual" && <BookOpen className="w-4 h-4 text-purple-400" />}
                                                {kb.kb_type === "structured" && <Database className="w-4 h-4 text-amber-400" />}
                                                <span className="text-sm font-bold text-[var(--surface-900)]">{kb.name}</span>
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                                                    style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)", color: "var(--primary)" }}>
                                                    {kb.kb_type}
                                                </span>
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold ml-auto"
                                                    style={{
                                                        background: kb.indexing_status === "indexed" ? "color-mix(in srgb, #22c55e 10%, transparent)" : "color-mix(in srgb, #f59e0b 10%, transparent)",
                                                        color: kb.indexing_status === "indexed" ? "#22c55e" : "#f59e0b",
                                                    }}>
                                                    {kb.indexing_status}
                                                </span>
                                            </div>
                                            {kb.description && <p className="text-xs text-[var(--surface-500)] mb-2">{kb.description}</p>}
                                            <div className="flex gap-4 text-[10px] text-[var(--surface-400)]">
                                                <span>{kb.total_chunks} chunks</span>
                                                <span>Strategy: {kb.retrieval_strategy}</span>
                                                <span>Model: {kb.embedding_model}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══════ Factory Memory (read-only from template) ═══════ */}
                    {activeTab === "memory" && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-bold text-[var(--surface-900)]">Factory Memory</h2>
                                <p className="text-xs text-[var(--surface-500)]">
                                    Pre-loaded memories from the agent template. These shape the agent&apos;s baseline knowledge.
                                </p>
                            </div>

                            {templateMemories.length === 0 ? (
                                <div className="p-8 rounded-xl border border-dashed text-center" style={{ borderColor: "var(--surface-300)" }}>
                                    <Brain className="w-8 h-8 mx-auto mb-2 opacity-40" style={{ color: "var(--primary)" }} />
                                    <p className="text-sm font-semibold text-[var(--surface-700)] mb-1">No factory memories</p>
                                    <p className="text-xs text-[var(--surface-500)]">The selected agent template has no pre-loaded memories.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {templateMemories.map((mem: any) => {
                                        const catColors: Record<string, string> = {
                                            personality: "text-purple-400 bg-purple-500/10",
                                            skill: "text-blue-400 bg-blue-500/10",
                                            knowledge: "text-green-400 bg-green-500/10",
                                            rule: "text-red-400 bg-red-500/10",
                                            context: "text-amber-400 bg-amber-500/10",
                                            preference: "text-cyan-400 bg-cyan-500/10",
                                            example: "text-pink-400 bg-pink-500/10",
                                        };
                                        return (
                                            <div key={mem.id} className="p-3 rounded-xl border flex items-start gap-3"
                                                style={{ background: "var(--surface-100)", borderColor: "var(--surface-200)" }}>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${catColors[mem.category] || "text-[var(--surface-500)] bg-[var(--surface-200)]"}`}>
                                                            {mem.category}
                                                        </span>
                                                        <span className="text-[10px] font-mono text-[var(--surface-400)]">
                                                            importance: {(mem.importance * 100).toFixed(0)}%
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-[var(--surface-700)] leading-relaxed">{mem.content}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* ── Live Preview Panel ── */}
                {showPreview && (
                    <div className="w-[340px] flex-shrink-0 sticky top-4 self-start">
                        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--surface-200)", background: "var(--surface-50)" }}>
                            {/* Preview header */}
                            <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid var(--surface-200)" }}>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--surface-500)]">Live Preview</span>
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            </div>

                            {/* Mini widget preview */}
                            <div className="p-5" style={{ background: darkMode ? "#1a1a2e" : "#f0f0f5" }}>
                                {/* Bubble */}
                                <div className="flex justify-end mb-3">
                                    <div className="flex items-center justify-center rounded-full"
                                        style={{
                                            width: `${Math.min(bubbleSize, 52)}px`,
                                            height: `${Math.min(bubbleSize, 52)}px`,
                                            background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                                            boxShadow: `0 4px 16px ${primaryColor}40`,
                                        }}>
                                        <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
                                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Chat window */}
                                <div className="overflow-hidden" style={{
                                    borderRadius: `${borderRadius}px`,
                                    background: darkMode ? (bgColor === "#ffffff" ? "#1a1a2e" : bgColor) : bgColor,
                                    border: `1px solid ${darkMode ? "#333" : "#e2e8f0"}`,
                                    boxShadow: windowStyle === "shadow" ? "0 12px 40px rgba(0,0,0,0.18)" : "0 4px 16px rgba(0,0,0,0.08)",
                                    backdropFilter: windowStyle === "glass" ? "blur(12px)" : undefined,
                                    fontFamily: fontFamily,
                                }}>
                                    {/* Header */}
                                    <div className="flex items-center gap-2.5 px-4 py-3" style={{
                                        background: windowStyle === "gradient"
                                            ? `linear-gradient(135deg, ${primaryColor}, ${accentColor})`
                                            : primaryColor,
                                    }}>
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm overflow-hidden"
                                            style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.15)" }}>
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{tmpl?.emoji || "🤖"}</span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-white leading-tight">
                                                {agentDisplayName || name || "AI Assistant"}
                                            </div>
                                            <div className="text-[9px] text-white/70">Online</div>
                                        </div>
                                        {companyLogoUrl && (
                                            <img src={companyLogoUrl} alt="" className="w-5 h-5 ml-auto object-contain opacity-80" />
                                        )}
                                    </div>

                                    {/* Messages */}
                                    <div className="p-3 space-y-2" style={{ minHeight: "140px" }}>
                                        {/* Welcome */}
                                        <div className="text-center py-2">
                                            <span className="text-xl">{tmpl?.emoji || "🤖"}</span>
                                            <p className="text-[10px] mt-1" style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                                                {welcomeMessage || "Hi! How can I help you today?"}
                                            </p>
                                        </div>
                                        {/* Sample user msg */}
                                        <div className="flex justify-end">
                                            <div className="px-3 py-1.5 rounded-xl text-[10px] text-white max-w-[70%]"
                                                style={{ background: primaryColor, borderRadius: `${Math.min(borderRadius, 16)}px` }}>
                                                Hello! I need help
                                            </div>
                                        </div>
                                        {/* Sample bot msg */}
                                        <div className="flex justify-start">
                                            <div className="px-3 py-1.5 rounded-xl text-[10px] max-w-[75%]"
                                                style={{
                                                    background: darkMode ? "#2d2d44" : "#f1f5f9",
                                                    color: darkMode ? "#e2e8f0" : textColor,
                                                    borderRadius: `${Math.min(borderRadius, 16)}px`,
                                                }}>
                                                Of course! I&apos;m here to help. What can I do for you today? 😊
                                            </div>
                                        </div>
                                    </div>

                                    {/* Input area */}
                                    <div className="px-3 pb-2 flex items-center gap-2">
                                        <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px]"
                                            style={{
                                                background: darkMode ? "#2d2d44" : "#f8fafc",
                                                border: `1px solid ${darkMode ? "#444" : "#e2e8f0"}`,
                                                color: darkMode ? "#64748b" : "#94a3b8",
                                            }}>
                                            Type a message...
                                        </div>
                                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: primaryColor }}>
                                            <svg viewBox="0 0 24 24" width="12" height="12" fill="white">
                                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Branding */}
                                    {showBranding && (
                                        <div className="text-center py-1.5" style={{ borderTop: `1px solid ${darkMode ? "#333" : "#eee"}` }}>
                                            <span className="text-[8px]" style={{ color: darkMode ? "#555" : "#aaa" }}>Powered by Oraya</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Preview info */}
                            <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderTop: "1px solid var(--surface-200)" }}>
                                <div className="text-[10px] text-[var(--surface-500)]">
                                    {chatWidth}×{chatHeight}px • {fontFamily.split(",")[0].replace(/"/g, "")}
                                </div>
                                <div className="flex gap-1">
                                    <div className="w-3 h-3 rounded-full" style={{ background: primaryColor }} />
                                    <div className="w-3 h-3 rounded-full" style={{ background: accentColor }} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
