"use client";

import { useState, useCallback } from "react";
import {
    Plus, Trash2, Check, X, Loader2, Shield, Zap,
    AlertTriangle, ChevronDown, ChevronUp, Copy,
    ExternalLink, Cpu, Eye, EyeOff, Power, MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { providers as providerRegistry } from "@/lib/ai-providers";
import type { UserAIProvider } from "@/app/dashboard/providers/page";

// ─────────────────────────────────────────────────────────────
// Provider Card Metadata (visual only — for unconfigured cards)
// ─────────────────────────────────────────────────────────────

interface ProviderCardMeta {
    id: string;
    name: string;
    logo: string;
    color: string;        // CSS color for brand accent
    bgClass: string;      // Tailwind bg class
    colorClass: string;   // Tailwind text class
    docsUrl: string;
    keyPlaceholder: string;
    keyPrefix: string;
    description: string;
}

const PROVIDER_CARDS: ProviderCardMeta[] = [
    {
        id: "oraya",
        name: "Oraya (ORAK Gateway)",
        logo: "🔥",
        color: "#f59e0b",
        bgClass: "bg-amber-500/10",
        colorClass: "text-amber-400",
        docsUrl: "https://myoraya.space/dashboard/api-keys",
        keyPlaceholder: "ORAK-...",
        keyPrefix: "ORAK-",
        description: "Oraya Sovereign Engine — Spark, Core, Rune, Iris, Prism, Voice",
    },
    {
        id: "openai",
        name: "OpenAI",
        logo: "🤖",
        color: "#10a37f",
        bgClass: "bg-emerald-500/10",
        colorClass: "text-emerald-400",
        docsUrl: "https://platform.openai.com/api-keys",
        keyPlaceholder: "sk-proj-...",
        keyPrefix: "sk-",
        description: "GPT-4o, o1, o3 — industry-leading reasoning and multimodal",
    },
    {
        id: "anthropic",
        name: "Anthropic",
        logo: "🧠",
        color: "#d4a27f",
        bgClass: "bg-orange-500/10",
        colorClass: "text-orange-400",
        docsUrl: "https://console.anthropic.com/settings/keys",
        keyPlaceholder: "sk-ant-...",
        keyPrefix: "sk-ant-",
        description: "Claude 4, Sonnet, Haiku — exceptional writing and analysis",
    },
    {
        id: "google",
        name: "Google AI",
        logo: "✨",
        color: "#4285f4",
        bgClass: "bg-blue-500/10",
        colorClass: "text-blue-400",
        docsUrl: "https://aistudio.google.com/app/apikey",
        keyPlaceholder: "AIza...",
        keyPrefix: "AIza",
        description: "Gemini 2.0 Flash, Pro — massive context windows",
    },
    {
        id: "mistral",
        name: "Mistral AI",
        logo: "🌀",
        color: "#ff7000",
        bgClass: "bg-violet-500/10",
        colorClass: "text-violet-400",
        docsUrl: "https://console.mistral.ai/api-keys",
        keyPlaceholder: "...",
        keyPrefix: "",
        description: "Mistral Large, Codestral — multilingual and code",
    },
    {
        id: "xai",
        name: "xAI (Grok)",
        logo: "⚡",
        color: "#1da1f2",
        bgClass: "bg-sky-500/10",
        colorClass: "text-sky-400",
        docsUrl: "https://console.x.ai",
        keyPlaceholder: "xai-...",
        keyPrefix: "xai-",
        description: "Grok models with real-time knowledge",
    },
    {
        id: "custom",
        name: "Custom / OpenAI-Compatible",
        logo: "🔧",
        color: "#8b5cf6",
        bgClass: "bg-purple-500/10",
        colorClass: "text-purple-400",
        docsUrl: "",
        keyPlaceholder: "Bearer token...",
        keyPrefix: "",
        description: "Any OpenAI-compatible endpoint (Ollama, LiteLLM, etc.)",
    },
];

function getCardMeta(id: string): ProviderCardMeta {
    return PROVIDER_CARDS.find(p => p.id === id) || PROVIDER_CARDS[PROVIDER_CARDS.length - 1];
}

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

interface ProviderHubProps {
    providers: UserAIProvider[];
}

// ─────────────────────────────────────────────────────────────
// ProviderCard — individual provider card (always visible)
// ─────────────────────────────────────────────────────────────

function ProviderCard({
    meta,
    existingKeys,
    onKeyAdded,
    onKeyDeleted,
    onKeyToggled,
}: {
    meta: ProviderCardMeta;
    existingKeys: UserAIProvider[];
    onKeyAdded: (key: UserAIProvider) => void;
    onKeyDeleted: (id: string) => void;
    onKeyToggled: (id: string, active: boolean) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [addingKey, setAddingKey] = useState(false);

    // Add key form state — fully isolated per card
    const [label, setLabel] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [baseUrl, setBaseUrl] = useState("");
    const [validating, setValidating] = useState(false);
    const [validated, setValidated] = useState(false);
    const [validationError, setValidationError] = useState("");
    const [models, setModels] = useState<{ id: string; name: string }[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const hasKeys = existingKeys.length > 0;

    // ── Reset form ──
    const resetForm = () => {
        setLabel("");
        setApiKey("");
        setBaseUrl("");
        setValidated(false);
        setValidationError("");
        setModels([]);
        setError("");
        setAddingKey(false);
    };

    // ── Validate key ──
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
                    provider: meta.id,
                    api_key: apiKey.trim(),
                    base_url: baseUrl.trim() || undefined,
                }),
            });
            const data = await res.json();
            if (data.valid) {
                setValidated(true);
                setModels(data.models || []);
            } else {
                setValidationError(data.error || "Invalid key");
            }
        } catch (err: any) {
            setValidationError(err.message);
        } finally {
            setValidating(false);
        }
    }, [apiKey, meta.id, baseUrl]);

    // ── Save key ──
    const handleSave = async () => {
        if (!label.trim()) { setError("Give this key a label."); return; }
        setSaving(true);
        setError("");
        try {
            const res = await fetch("/api/members/providers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider: meta.id,
                    label: label.trim(),
                    api_key: apiKey.trim(),
                    base_url: meta.id === "custom" ? baseUrl.trim() : undefined,
                    is_valid: validated,
                    available_models: models,
                }),
            });
            if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Save failed"); }
            const { provider } = await res.json();
            onKeyAdded(provider);
            resetForm();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // ── Delete key ──
    const handleDelete = async (id: string) => {
        if (!confirm("Delete this API key? This cannot be undone.")) return;
        setActionLoading(id);
        try {
            const res = await fetch(`/api/members/providers?id=${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");
            onKeyDeleted(id);
        } catch { /* silent */ } finally {
            setActionLoading(null);
        }
    };

    // ── Toggle key ──
    const handleToggle = async (id: string, currentActive: boolean) => {
        setActionLoading(id);
        try {
            const res = await fetch("/api/members/providers", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, is_active: !currentActive }),
            });
            if (!res.ok) throw new Error("Toggle failed");
            onKeyToggled(id, !currentActive);
        } catch { /* silent */ } finally {
            setActionLoading(null);
        }
    };

    const inputCls = "w-full px-4 py-3 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-300)] text-[var(--surface-800)] placeholder:text-[var(--surface-500)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all";

    return (
        <div className="rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] overflow-hidden transition-all hover:shadow-lg">
            {/* ── Provider Header ── */}
            <div
                className={cn("px-5 py-4 border-b border-[var(--surface-300)]", meta.bgClass)}
                style={{ cursor: "pointer" }}
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{meta.logo}</span>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className={cn("font-semibold", meta.colorClass)}>{meta.name}</h3>
                                {meta.docsUrl && (
                                    <a
                                        href={meta.docsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 rounded hover:bg-[var(--surface-200)] transition-colors"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <ExternalLink className="w-3.5 h-3.5 text-[var(--surface-500)]" />
                                    </a>
                                )}
                            </div>
                            <p className="text-xs text-[var(--surface-500)]">{meta.description}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {hasKeys ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--success)]/15 text-[var(--success)]">
                                {existingKeys.length} Key{existingKeys.length > 1 ? "s" : ""}
                            </span>
                        ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--surface-200)] text-[var(--surface-500)]">
                                Not Configured
                            </span>
                        )}
                        {expanded ? (
                            <ChevronUp className="w-4 h-4 text-[var(--surface-500)]" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-[var(--surface-500)]" />
                        )}
                    </div>
                </div>
            </div>

            {/* ── Expanded Body ── */}
            {expanded && (
                <div className="divide-y divide-[var(--surface-200)]">
                    {/* ─── Existing Keys ─── */}
                    {existingKeys.map(key => (
                        <div
                            key={key.id}
                            className={cn(
                                "px-5 py-4 transition-colors hover:bg-[var(--surface-100)]",
                                !key.is_active && "opacity-50"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {/* Health dot */}
                                    <div className={cn(
                                        "w-2.5 h-2.5 rounded-full shrink-0",
                                        key.is_valid && key.is_active
                                            ? "bg-[var(--success)] shadow-lg shadow-green-500/30"
                                            : key.is_active
                                                ? "bg-[var(--warning)] shadow-lg shadow-amber-500/30"
                                                : "bg-[var(--surface-400)]"
                                    )} />
                                    <div>
                                        <p className="font-medium text-sm text-[var(--surface-800)]">{key.label}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <code className="text-xs font-mono text-[var(--surface-500)] bg-[var(--surface-200)] px-2 py-0.5 rounded">
                                                {key.api_key_hint || "••••••••"}
                                            </code>
                                            {key.available_models && key.available_models.length > 0 && (
                                                <span className="text-[10px] text-[var(--surface-500)]">
                                                    · {key.available_models.length} model{key.available_models.length > 1 ? "s" : ""}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Toggle */}
                                    <button
                                        onClick={() => handleToggle(key.id, key.is_active)}
                                        disabled={actionLoading === key.id}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                            key.is_active
                                                ? "bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/20"
                                                : "bg-[var(--surface-200)] text-[var(--surface-500)] hover:bg-[var(--surface-300)]"
                                        )}
                                    >
                                        {actionLoading === key.id ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : key.is_active ? (
                                            <span className="flex items-center gap-1"><Power className="w-3 h-3" /> Active</span>
                                        ) : (
                                            <span className="flex items-center gap-1"><Power className="w-3 h-3" /> Disabled</span>
                                        )}
                                    </button>
                                    {/* Delete */}
                                    <button
                                        onClick={() => handleDelete(key.id)}
                                        disabled={actionLoading === key.id}
                                        className="p-2 rounded-lg text-[var(--surface-500)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                        title="Delete key"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* ─── Add Key Inline Form ─── */}
                    {addingKey ? (
                        <div className="px-5 py-5 space-y-4 bg-[var(--surface-100)]/50">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-[var(--surface-800)]">
                                    Add {meta.name} Key
                                </h4>
                                <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-[var(--surface-200)] transition-colors">
                                    <X className="w-4 h-4 text-[var(--surface-500)]" />
                                </button>
                            </div>

                            {error && (
                                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                                </div>
                            )}

                            {/* Label */}
                            <div>
                                <label className="block text-xs font-medium text-[var(--surface-700)] mb-1.5">Key Name</label>
                                <input
                                    type="text"
                                    value={label}
                                    onChange={e => setLabel(e.target.value)}
                                    placeholder="e.g., Production Key, Personal Key"
                                    className={inputCls}
                                />
                            </div>

                            {/* Custom base URL */}
                            {meta.id === "custom" && (
                                <div>
                                    <label className="block text-xs font-medium text-[var(--surface-700)] mb-1.5">Base URL</label>
                                    <input
                                        type="url"
                                        value={baseUrl}
                                        onChange={e => setBaseUrl(e.target.value)}
                                        placeholder="https://your-endpoint.com/v1"
                                        className={inputCls}
                                    />
                                </div>
                            )}

                            {/* API Key + Validate */}
                            <div>
                                <label className="block text-xs font-medium text-[var(--surface-700)] mb-1.5">API Key</label>
                                <div className="flex gap-2">
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={e => { setApiKey(e.target.value); setValidated(false); setValidationError(""); }}
                                        placeholder={meta.keyPlaceholder}
                                        className={cn(inputCls, "font-mono flex-1")}
                                    />
                                    <button
                                        type="button"
                                        onClick={validateKey}
                                        disabled={!apiKey.trim() || validating}
                                        className="px-4 py-3 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-40 shrink-0"
                                        style={{ background: "var(--gradient-primary)" }}
                                    >
                                        {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Validate"}
                                    </button>
                                </div>
                            </div>

                            {/* Validation result */}
                            {validated && (
                                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                                    <div className="flex items-center gap-2 text-sm font-medium text-green-400">
                                        <Check className="w-4 h-4" /> Key valid — {models.length} model{models.length !== 1 ? "s" : ""} available
                                    </div>
                                    {models.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {models.slice(0, 8).map(m => (
                                                <span key={m.id} className="px-2 py-0.5 rounded-md bg-[var(--surface-200)] text-[10px] font-mono text-[var(--surface-600)]">
                                                    {m.name || m.id}
                                                </span>
                                            ))}
                                            {models.length > 8 && (
                                                <span className="px-2 py-0.5 rounded-md bg-[var(--surface-200)] text-[10px] text-[var(--surface-500)]">
                                                    +{models.length - 8} more
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            {validationError && (
                                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                                    <X className="w-4 h-4 shrink-0" /> {validationError}
                                </div>
                            )}

                            {/* Save */}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={resetForm}
                                    className="px-4 py-2.5 rounded-xl text-sm text-[var(--surface-600)] hover:bg-[var(--surface-200)] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !validated || !label.trim()}
                                    className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 flex items-center gap-2"
                                    style={{ background: "var(--gradient-primary)" }}
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {saving ? "Saving..." : "Save Key"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Add Key Button */
                        <div className="px-5 py-3">
                            <button
                                onClick={() => { setAddingKey(true); setExpanded(true); }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-[var(--surface-300)] text-sm font-semibold text-[var(--surface-600)] transition-all hover:bg-[var(--surface-100)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                            >
                                <Plus className="w-4 h-4" /> Add {meta.name} Key
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// ProviderHub — main export: grid of all provider cards
// ─────────────────────────────────────────────────────────────

export default function ProviderHub({ providers: initialProviders }: ProviderHubProps) {
    const [allKeys, setAllKeys] = useState<UserAIProvider[]>(initialProviders);

    // Group keys by provider
    const keysByProvider = allKeys.reduce((acc, key) => {
        if (!acc[key.provider]) acc[key.provider] = [];
        acc[key.provider].push(key);
        return acc;
    }, {} as Record<string, UserAIProvider[]>);

    // ── Callbacks ──
    const handleKeyAdded = useCallback((newKey: UserAIProvider) => {
        setAllKeys(prev => [newKey, ...prev]);
    }, []);

    const handleKeyDeleted = useCallback((id: string) => {
        setAllKeys(prev => prev.filter(k => k.id !== id));
    }, []);

    const handleKeyToggled = useCallback((id: string, active: boolean) => {
        setAllKeys(prev => prev.map(k => k.id === id ? { ...k, is_active: active } : k));
    }, []);

    const totalConfigured = PROVIDER_CARDS.filter(p => (keysByProvider[p.id]?.length ?? 0) > 0).length;

    return (
        <div className="space-y-6">
            {/* Summary bar */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--surface-900)]">AI Providers</h1>
                    <p className="text-sm text-[var(--surface-500)] mt-1">
                        Add your own API keys to power agent widgets. Keys are encrypted at rest.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-200)]">
                        <Shield className="w-4 h-4 text-[var(--primary)]" />
                        <span className="text-sm font-medium text-[var(--surface-700)]">
                            {totalConfigured} / {PROVIDER_CARDS.length} Configured
                        </span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-200)]">
                        <Cpu className="w-4 h-4 text-[var(--primary)]" />
                        <span className="text-sm font-medium text-[var(--surface-700)]">
                            {allKeys.length} Key{allKeys.length !== 1 ? "s" : ""} Total
                        </span>
                    </div>
                </div>
            </div>

            {/* Provider cards grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {PROVIDER_CARDS.map(meta => (
                    <ProviderCard
                        key={meta.id}
                        meta={meta}
                        existingKeys={keysByProvider[meta.id] || []}
                        onKeyAdded={handleKeyAdded}
                        onKeyDeleted={handleKeyDeleted}
                        onKeyToggled={handleKeyToggled}
                    />
                ))}
            </div>
        </div>
    );
}
