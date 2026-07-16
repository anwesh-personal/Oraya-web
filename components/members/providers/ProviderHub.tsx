"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, Search, Trash2, Check, X, RefreshCw, Eye, EyeOff,
    Loader2, Shield, Zap, AlertTriangle, ChevronDown, ChevronUp,
    Copy, ExternalLink, Cpu,
} from "lucide-react";
import type { UserAIProvider } from "@/app/dashboard/providers/page";

// ─────────────────────────────────────────────────────────────
// Provider Metadata
// ─────────────────────────────────────────────────────────────

interface ProviderMeta {
    id: string;
    name: string;
    logo: string;       // Emoji fallback (SVG logos can be added later)
    color: string;       // Brand accent — used with color-mix, not raw
    docsUrl: string;
    keyPlaceholder: string;
    keyPrefix: string;   // Expected prefix for quick validation hint
}

const PROVIDERS: ProviderMeta[] = [
    {
        id: "openai",
        name: "OpenAI",
        logo: "🟢",
        color: "#10a37f",
        docsUrl: "https://platform.openai.com/api-keys",
        keyPlaceholder: "sk-proj-...",
        keyPrefix: "sk-",
    },
    {
        id: "anthropic",
        name: "Anthropic",
        logo: "🟤",
        color: "#d4a27f",
        docsUrl: "https://console.anthropic.com/settings/keys",
        keyPlaceholder: "sk-ant-...",
        keyPrefix: "sk-ant-",
    },
    {
        id: "google",
        name: "Google AI",
        logo: "🔵",
        color: "#4285f4",
        docsUrl: "https://aistudio.google.com/app/apikey",
        keyPlaceholder: "AIza...",
        keyPrefix: "AIza",
    },
    {
        id: "mistral",
        name: "Mistral",
        logo: "🟠",
        color: "#ff7000",
        docsUrl: "https://console.mistral.ai/api-keys",
        keyPlaceholder: "...",
        keyPrefix: "",
    },
    {
        id: "xai",
        name: "xAI (Grok)",
        logo: "⚡",
        color: "#1da1f2",
        docsUrl: "https://console.x.ai",
        keyPlaceholder: "xai-...",
        keyPrefix: "xai-",
    },
    {
        id: "custom",
        name: "Custom",
        logo: "🔧",
        color: "#8b5cf6",
        docsUrl: "",
        keyPlaceholder: "Bearer token...",
        keyPrefix: "",
    },
];

function getProviderMeta(id: string): ProviderMeta {
    return PROVIDERS.find(p => p.id === id) || PROVIDERS[PROVIDERS.length - 1];
}

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

interface ProviderHubProps {
    providers: UserAIProvider[];
}

// ─────────────────────────────────────────────────────────────
// Add Provider Modal
// ─────────────────────────────────────────────────────────────

interface AddProviderModalProps {
    onClose: () => void;
    onAdded: (p: UserAIProvider) => void;
}

function AddProviderModal({ onClose, onAdded }: AddProviderModalProps) {
    const [step, setStep] = useState(1);
    const [selectedProvider, setSelectedProvider] = useState<string>("");
    const [label, setLabel] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [baseUrl, setBaseUrl] = useState("");
    const [validating, setValidating] = useState(false);
    const [validated, setValidated] = useState(false);
    const [validationError, setValidationError] = useState("");
    const [models, setModels] = useState<{ id: string; name: string }[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const meta = selectedProvider ? getProviderMeta(selectedProvider) : null;

    // ── Real-time validate ──
    const validateKey = useCallback(async () => {
        if (!apiKey.trim()) return;
        setValidating(true);
        setValidated(false);
        setValidationError("");
        setModels([]);

        try {
            const res = await fetch("/api/members/providers/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider: selectedProvider,
                    api_key: apiKey.trim(),
                    base_url: baseUrl.trim() || undefined,
                }),
            });
            const data = await res.json();

            if (data.valid) {
                setValidated(true);
                setModels(data.models || []);
            } else {
                setValidationError(data.error || "Key validation failed");
            }
        } catch {
            setValidationError("Network error during validation");
        } finally {
            setValidating(false);
        }
    }, [apiKey, selectedProvider, baseUrl]);

    // ── Save ──
    const handleSave = async () => {
        if (!label.trim()) {
            setError("Please give this key a label.");
            return;
        }
        setSaving(true);
        setError("");

        try {
            const res = await fetch("/api/members/providers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider: selectedProvider,
                    label: label.trim(),
                    api_key: apiKey.trim(),
                    base_url: selectedProvider === "custom" ? baseUrl.trim() : undefined,
                    is_valid: validated,
                    available_models: models,
                }),
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || "Save failed");
            }
            const { provider } = await res.json();
            onAdded(provider);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
                style={{
                    background: "var(--surface-50)",
                    border: "1px solid var(--surface-200)",
                }}
            >
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between" style={{ background: "var(--gradient-primary)" }}>
                    <div>
                        <h2 className="text-lg font-bold text-white">Add AI Provider</h2>
                        <p className="text-xs text-white/70">Step {step} of 2</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>

                {/* Progress */}
                <div className="h-1" style={{ background: "var(--surface-200)" }}>
                    <motion.div className="h-full" style={{ background: "var(--primary)" }} animate={{ width: `${(step / 2) * 100}%` }} transition={{ duration: 0.3 }} />
                </div>

                <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                    {/* ── Step 1: Pick provider ── */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <label className="text-sm font-semibold text-[var(--surface-700)] block">
                                Choose Provider
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {PROVIDERS.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => { setSelectedProvider(p.id); setLabel(p.name); }}
                                        className="p-4 rounded-xl border text-center transition-all hover:shadow-sm"
                                        style={{
                                            background: selectedProvider === p.id
                                                ? `color-mix(in srgb, ${p.color} 8%, var(--surface-50))`
                                                : "var(--surface-50)",
                                            borderColor: selectedProvider === p.id ? p.color : "var(--surface-200)",
                                            borderWidth: selectedProvider === p.id ? "2px" : "1px",
                                        }}
                                    >
                                        <div className="text-2xl mb-1">{p.logo}</div>
                                        <div className="text-xs font-bold text-[var(--surface-900)]">{p.name}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Key + Validate ── */}
                    {step === 2 && meta && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-[var(--surface-700)] mb-1.5 block">
                                    Label *
                                </label>
                                <input
                                    type="text"
                                    value={label}
                                    onChange={e => setLabel(e.target.value)}
                                    placeholder={`e.g., My ${meta.name} Key, Production Key...`}
                                    className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--primary)]"
                                    style={{ background: "var(--surface-100)", borderColor: "var(--surface-200)", color: "var(--surface-900)" }}
                                />
                            </div>

                            {selectedProvider === "custom" && (
                                <div>
                                    <label className="text-xs font-semibold text-[var(--surface-700)] mb-1.5 block">
                                        Base URL *
                                    </label>
                                    <input
                                        type="url"
                                        value={baseUrl}
                                        onChange={e => setBaseUrl(e.target.value)}
                                        placeholder="https://your-api.com"
                                        className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--primary)]"
                                        style={{ background: "var(--surface-100)", borderColor: "var(--surface-200)", color: "var(--surface-900)" }}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-semibold text-[var(--surface-700)] mb-1.5 block">
                                    API Key *
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={e => { setApiKey(e.target.value); setValidated(false); setValidationError(""); setModels([]); }}
                                        placeholder={meta.keyPlaceholder}
                                        className="flex-1 px-4 py-3 rounded-xl border text-sm font-mono outline-none transition-colors focus:border-[var(--primary)]"
                                        style={{ background: "var(--surface-100)", borderColor: "var(--surface-200)", color: "var(--surface-900)" }}
                                    />
                                    <button
                                        onClick={validateKey}
                                        disabled={validating || !apiKey.trim()}
                                        className="px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                                        style={{ background: "var(--gradient-primary)" }}
                                    >
                                        {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                        {validating ? "Checking..." : "Validate"}
                                    </button>
                                </div>
                                {meta.docsUrl && (
                                    <a
                                        href={meta.docsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-medium transition-colors hover:underline"
                                        style={{ color: "var(--primary)" }}
                                    >
                                        <ExternalLink className="w-3 h-3" /> Get your {meta.name} API key
                                    </a>
                                )}
                            </div>

                            {/* Validation result */}
                            {validated && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="p-4 rounded-xl"
                                    style={{
                                        background: "color-mix(in srgb, #22c55e 8%, var(--surface-50))",
                                        border: "1px solid color-mix(in srgb, #22c55e 25%, transparent)",
                                    }}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Check className="w-4 h-4 text-green-500" />
                                        <span className="text-sm font-bold text-green-700">Key Valid — {models.length} model{models.length !== 1 ? "s" : ""} found</span>
                                    </div>
                                    {models.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {models.slice(0, 12).map(m => (
                                                <span
                                                    key={m.id}
                                                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                                                    style={{
                                                        background: "color-mix(in srgb, var(--primary) 10%, var(--surface-50))",
                                                        color: "var(--surface-700)",
                                                        border: "1px solid var(--surface-200)",
                                                    }}
                                                >
                                                    {m.name || m.id}
                                                </span>
                                            ))}
                                            {models.length > 12 && (
                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold" style={{ color: "var(--surface-500)" }}>
                                                    +{models.length - 12} more
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {validationError && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-3 rounded-xl flex items-center gap-2"
                                    style={{
                                        background: "color-mix(in srgb, #ef4444 8%, var(--surface-50))",
                                        border: "1px solid color-mix(in srgb, #ef4444 25%, transparent)",
                                    }}
                                >
                                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    <span className="text-xs text-red-600">{validationError}</span>
                                </motion.div>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="text-xs text-red-500 text-center rounded-lg p-2" style={{ background: "color-mix(in srgb, #ef4444 8%, var(--surface-50))" }}>
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: "1px solid var(--surface-200)" }}>
                    {step > 1 ? (
                        <button onClick={() => setStep(1)} className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors hover:bg-[var(--surface-200)]" style={{ color: "var(--surface-600)" }}>
                            Back
                        </button>
                    ) : <div />}

                    {step === 1 ? (
                        <button
                            onClick={() => { if (!selectedProvider) { setError("Pick a provider."); return; } setError(""); setStep(2); }}
                            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                            style={{ background: "var(--gradient-primary)" }}
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            onClick={handleSave}
                            disabled={saving || !validated || !label.trim()}
                            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                            style={{ background: "var(--gradient-primary)" }}
                        >
                            {saving ? "Saving..." : "Save Provider"}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function ProviderHub({ providers: initial }: ProviderHubProps) {
    const [providers, setProviders] = useState(initial);
    const [search, setSearch] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const filtered = providers.filter(p =>
        p.label.toLowerCase().includes(search.toLowerCase()) ||
        p.provider.toLowerCase().includes(search.toLowerCase())
    );

    // Toggle active
    const toggleActive = useCallback(async (prov: UserAIProvider) => {
        const res = await fetch("/api/members/providers", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: prov.id, is_active: !prov.is_active }),
        });
        if (res.ok) {
            const { provider: updated } = await res.json();
            setProviders(prev => prev.map(p => p.id === updated.id ? updated : p));
        }
    }, []);

    // Delete
    const handleDelete = useCallback(async (id: string) => {
        setDeletingId(id);
        const res = await fetch(`/api/members/providers?id=${id}`, { method: "DELETE" });
        if (res.ok) setProviders(prev => prev.filter(p => p.id !== id));
        setDeletingId(null);
    }, []);

    // On add
    const handleAdded = useCallback((p: UserAIProvider) => {
        setProviders(prev => [p, ...prev]);
        setShowAdd(false);
    }, []);

    // Stats
    const totalModels = providers.reduce((n, p) => n + (p.available_models?.length || 0), 0);
    const validCount = providers.filter(p => p.is_valid && p.is_active).length;

    return (
        <div className="space-y-6">
            {/* ── Stats Bar ── */}
            {providers.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: "Active Providers", value: validCount, icon: <Cpu className="w-4 h-4" /> },
                        { label: "Total Models", value: totalModels, icon: <Zap className="w-4 h-4" /> },
                        { label: "Total Keys", value: providers.length, icon: <Shield className="w-4 h-4" /> },
                    ].map(s => (
                        <div
                            key={s.label}
                            className="px-4 py-3 rounded-xl border flex items-center gap-3"
                            style={{ background: "var(--surface-50)", borderColor: "var(--surface-200)" }}
                        >
                            <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center"
                                style={{
                                    background: "color-mix(in srgb, var(--primary) 10%, var(--surface-100))",
                                    color: "var(--primary)",
                                }}
                            >
                                {s.icon}
                            </div>
                            <div>
                                <p className="text-lg font-bold text-[var(--surface-900)]">{s.value}</p>
                                <p className="text-[10px] text-[var(--surface-500)] font-medium">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Toolbar ── */}
            <div className="flex items-center gap-3">
                <div
                    className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors"
                    style={{ background: "var(--surface-50)", borderColor: "var(--surface-200)" }}
                >
                    <Search className="w-4 h-4 text-[var(--surface-400)]" />
                    <input
                        type="text"
                        placeholder="Search providers..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-sm text-[var(--surface-900)] placeholder:text-[var(--surface-400)]"
                    />
                </div>
                <button
                    onClick={() => setShowAdd(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: "var(--gradient-primary)" }}
                >
                    <Plus className="w-4 h-4" />
                    Add Provider
                </button>
            </div>

            {/* ── Empty State ── */}
            {providers.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed"
                    style={{ borderColor: "var(--surface-200)", background: "var(--surface-50)" }}
                >
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                        style={{ background: "color-mix(in srgb, var(--primary) 10%, var(--surface-100))" }}
                    >
                        <Cpu className="w-8 h-8 text-[var(--primary)] opacity-60" />
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--surface-900)] mb-1">No AI providers configured</h3>
                    <p className="text-sm text-[var(--surface-500)] mb-6 max-w-sm text-center">
                        Add your own API keys for OpenAI, Claude, Gemini, Grok, Mistral, or any custom provider to power your agent widgets.
                    </p>
                    <button
                        onClick={() => setShowAdd(true)}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                        style={{ background: "var(--gradient-primary)" }}
                    >
                        <Plus className="w-4 h-4" />
                        Add Your First Provider
                    </button>
                </motion.div>
            )}

            {/* ── Provider Cards ── */}
            {filtered.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((prov, i) => {
                            const meta = getProviderMeta(prov.provider);
                            const isExpanded = expandedId === prov.id;

                            return (
                                <motion.div
                                    key={prov.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="rounded-2xl border overflow-hidden transition-all hover:shadow-lg"
                                    style={{
                                        background: "var(--surface-50)",
                                        borderColor: prov.is_valid && prov.is_active
                                            ? `color-mix(in srgb, ${meta.color} 30%, var(--surface-200))`
                                            : "var(--surface-200)",
                                    }}
                                >
                                    {/* Card Header */}
                                    <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--surface-200)" }}>
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                                            style={{
                                                background: `color-mix(in srgb, ${meta.color} 10%, var(--surface-100))`,
                                                border: `1px solid color-mix(in srgb, ${meta.color} 20%, transparent)`,
                                            }}
                                        >
                                            {meta.logo}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-bold text-[var(--surface-900)] truncate">{prov.label}</h3>
                                                <span
                                                    className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                                    style={{
                                                        background: prov.is_valid && prov.is_active
                                                            ? "color-mix(in srgb, #22c55e 15%, transparent)"
                                                            : prov.is_active
                                                            ? "color-mix(in srgb, #f59e0b 15%, transparent)"
                                                            : "color-mix(in srgb, #ef4444 15%, transparent)",
                                                        color: prov.is_valid && prov.is_active
                                                            ? "#16a34a"
                                                            : prov.is_active
                                                            ? "#d97706"
                                                            : "#dc2626",
                                                    }}
                                                >
                                                    {prov.is_valid && prov.is_active ? "Valid" : prov.is_active ? "Unvalidated" : "Off"}
                                                </span>
                                            </div>
                                            <p className="text-xs text-[var(--surface-500)]">
                                                {meta.name} • <span className="font-mono">{prov.api_key_hint}</span> • {prov.available_models?.length || 0} models
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button
                                                onClick={() => setExpandedId(isExpanded ? null : prov.id)}
                                                className="p-2 rounded-lg transition-colors hover:bg-[var(--surface-200)]"
                                                title="Show models"
                                            >
                                                {isExpanded
                                                    ? <ChevronUp className="w-4 h-4 text-[var(--surface-500)]" />
                                                    : <ChevronDown className="w-4 h-4 text-[var(--surface-500)]" />
                                                }
                                            </button>
                                            <button
                                                onClick={() => toggleActive(prov)}
                                                className="p-2 rounded-lg transition-colors hover:bg-[var(--surface-200)]"
                                                title={prov.is_active ? "Disable" : "Enable"}
                                            >
                                                {prov.is_active
                                                    ? <Eye className="w-4 h-4 text-[var(--surface-600)]" />
                                                    : <EyeOff className="w-4 h-4 text-[var(--surface-400)]" />
                                                }
                                            </button>
                                            <button
                                                onClick={() => handleDelete(prov.id)}
                                                disabled={deletingId === prov.id}
                                                className="p-2 rounded-lg transition-colors hover:bg-[var(--surface-200)]"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded models list */}
                                    <AnimatePresence>
                                        {isExpanded && prov.available_models?.length > 0 && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-5 py-3" style={{ background: "var(--surface-100)" }}>
                                                    <p className="text-[10px] font-bold text-[var(--surface-500)] uppercase tracking-wider mb-2">
                                                        Available Models ({prov.available_models.length})
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {prov.available_models.map((m: any) => (
                                                            <span
                                                                key={m.id}
                                                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                                                                style={{
                                                                    background: "var(--surface-50)",
                                                                    color: "var(--surface-700)",
                                                                    border: "1px solid var(--surface-200)",
                                                                }}
                                                            >
                                                                {m.name || m.id}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Footer */}
                                    <div
                                        className="px-5 py-2 flex items-center justify-between text-[11px]"
                                        style={{ borderTop: "1px solid var(--surface-200)", color: "var(--surface-400)" }}
                                    >
                                        <span>
                                            {prov.validated_at
                                                ? `Validated ${new Date(prov.validated_at).toLocaleDateString()}`
                                                : "Not validated"
                                            }
                                        </span>
                                        <span>Added {new Date(prov.created_at).toLocaleDateString()}</span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* ── Modal ── */}
            {showAdd && (
                <AddProviderModal
                    onClose={() => setShowAdd(false)}
                    onAdded={handleAdded}
                />
            )}
        </div>
    );
}
