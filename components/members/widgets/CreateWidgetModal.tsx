"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Bot, Sparkles, Globe, Shield, Palette } from "lucide-react";
import type { WidgetDeployment, AgentTemplateOption } from "@/app/dashboard/widgets/page";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface CreateWidgetModalProps {
    agents: AgentTemplateOption[];
    onClose: () => void;
    onCreated: (widget: WidgetDeployment) => void;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function CreateWidgetModal({ agents, onClose, onCreated }: CreateWidgetModalProps) {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Form state
    const [name, setName] = useState("");
    const [templateId, setTemplateId] = useState("");
    const [widgetType, setWidgetType] = useState<"bubble" | "inline" | "fullpage">("bubble");
    const [persistenceMode, setPersistenceMode] = useState<string>("user_persistent");
    const [primaryColor, setPrimaryColor] = useState("#7c3aed");
    const [accentColor, setAccentColor] = useState("#6d28d9");
    const [darkMode, setDarkMode] = useState(false);
    const [welcomeMessage, setWelcomeMessage] = useState("Hi! How can I help you today?");
    const [position, setPosition] = useState("bottom-right");
    const [rateLimitRpm, setRateLimitRpm] = useState(20);
    const [allowedDomains, setAllowedDomains] = useState("");
    const [autoOpen, setAutoOpen] = useState(false);

    // ─── Submit ─────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!name.trim() || !templateId) {
            setError("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/members/widgets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    template_id: templateId,
                    widget_type: widgetType,
                    persistence_mode: persistenceMode,
                    primary_color: primaryColor,
                    accent_color: accentColor,
                    dark_mode: darkMode,
                    welcome_message: welcomeMessage.trim(),
                    position,
                    rate_limit_rpm: rateLimitRpm,
                    auto_open: autoOpen,
                    allowed_domains: allowedDomains
                        .split(",")
                        .map(d => d.trim())
                        .filter(Boolean),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create widget");
            }

            const { widget } = await res.json();
            onCreated(widget);
        } catch (err: any) {
            setError(err.message || "Something went wrong.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedAgent = agents.find(a => a.id === templateId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
                style={{
                    background: "var(--surface-50)",
                    border: "1px solid var(--surface-200)",
                }}
            >
                {/* Header */}
                <div
                    className="px-6 py-4 flex items-center justify-between"
                    style={{
                        background: "var(--gradient-primary)",
                    }}
                >
                    <div>
                        <h2 className="text-lg font-bold text-white">Create Widget</h2>
                        <p className="text-xs text-white/70">Step {step} of 3</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-[var(--surface-200)]">
                    <motion.div
                        className="h-full"
                        style={{ background: "var(--primary)" }}
                        animate={{ width: `${(step / 3) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>

                <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                    {/* ── Step 1: Agent & Name ── */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <div>
                                <label className="text-sm font-semibold text-[var(--surface-700)] mb-2 block">
                                    Widget Name *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g., Support Chat, Sales Bot..."
                                    className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--primary)]"
                                    style={{
                                        background: "var(--surface-100)",
                                        borderColor: "var(--surface-200)",
                                        color: "var(--surface-900)",
                                    }}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-[var(--surface-700)] mb-2 block">
                                    <Bot className="w-4 h-4 inline mr-1.5 opacity-60" />
                                    Select Agent *
                                </label>
                                <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto pr-1">
                                    {agents.map(agent => (
                                        <button
                                            key={agent.id}
                                            onClick={() => setTemplateId(agent.id)}
                                            className="p-3 rounded-xl border text-left transition-all hover:shadow-sm"
                                            style={{
                                                background: templateId === agent.id
                                                    ? "color-mix(in srgb, var(--primary) 8%, var(--surface-50))"
                                                    : "var(--surface-50)",
                                                borderColor: templateId === agent.id
                                                    ? "var(--primary)"
                                                    : "var(--surface-200)",
                                                borderWidth: templateId === agent.id ? "2px" : "1px",
                                            }}
                                        >
                                            <div className="text-xl mb-1">{agent.emoji}</div>
                                            <div className="text-xs font-bold text-[var(--surface-900)] truncate">
                                                {agent.name}
                                            </div>
                                            {agent.tagline && (
                                                <div className="text-[10px] text-[var(--surface-500)] truncate mt-0.5">
                                                    {agent.tagline}
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Appearance ── */}
                    {step === 2 && (
                        <div className="space-y-5">
                            <div>
                                <label className="text-sm font-semibold text-[var(--surface-700)] mb-2 block">
                                    <Sparkles className="w-4 h-4 inline mr-1.5 opacity-60" />
                                    Widget Type
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(["bubble", "inline", "fullpage"] as const).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setWidgetType(type)}
                                            className="p-3 rounded-xl border text-center transition-all"
                                            style={{
                                                background: widgetType === type
                                                    ? "color-mix(in srgb, var(--primary) 8%, var(--surface-50))"
                                                    : "var(--surface-50)",
                                                borderColor: widgetType === type
                                                    ? "var(--primary)"
                                                    : "var(--surface-200)",
                                                borderWidth: widgetType === type ? "2px" : "1px",
                                            }}
                                        >
                                            <div className="text-xs font-bold text-[var(--surface-900)] capitalize">
                                                {type === "fullpage" ? "Full Page" : type}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-[var(--surface-700)] mb-1.5 block">
                                        <Palette className="w-3.5 h-3.5 inline mr-1 opacity-60" />
                                        Primary Color
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={primaryColor}
                                            onChange={e => setPrimaryColor(e.target.value)}
                                            className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                                        />
                                        <input
                                            type="text"
                                            value={primaryColor}
                                            onChange={e => setPrimaryColor(e.target.value)}
                                            className="flex-1 px-3 py-2 rounded-lg border text-xs outline-none"
                                            style={{
                                                background: "var(--surface-100)",
                                                borderColor: "var(--surface-200)",
                                                color: "var(--surface-900)",
                                            }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-[var(--surface-700)] mb-1.5 block">
                                        Accent Color
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={accentColor}
                                            onChange={e => setAccentColor(e.target.value)}
                                            className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                                        />
                                        <input
                                            type="text"
                                            value={accentColor}
                                            onChange={e => setAccentColor(e.target.value)}
                                            className="flex-1 px-3 py-2 rounded-lg border text-xs outline-none"
                                            style={{
                                                background: "var(--surface-100)",
                                                borderColor: "var(--surface-200)",
                                                color: "var(--surface-900)",
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-[var(--surface-700)] mb-1.5 block">
                                    Welcome Message
                                </label>
                                <textarea
                                    value={welcomeMessage}
                                    onChange={e => setWelcomeMessage(e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
                                    style={{
                                        background: "var(--surface-100)",
                                        borderColor: "var(--surface-200)",
                                        color: "var(--surface-900)",
                                    }}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-[var(--surface-700)]">
                                    Dark Mode
                                </label>
                                <button
                                    onClick={() => setDarkMode(!darkMode)}
                                    className="w-11 h-6 rounded-full transition-colors relative"
                                    style={{
                                        background: darkMode ? "var(--primary)" : "var(--surface-300)",
                                    }}
                                >
                                    <div
                                        className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm"
                                        style={{ left: darkMode ? "22px" : "2px" }}
                                    />
                                </button>
                            </div>

                            {widgetType === "bubble" && (
                                <div>
                                    <label className="text-xs font-semibold text-[var(--surface-700)] mb-1.5 block">
                                        Position
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {["bottom-right", "bottom-left", "top-right", "top-left"].map(pos => (
                                            <button
                                                key={pos}
                                                onClick={() => setPosition(pos)}
                                                className="px-2 py-2 rounded-lg border text-[10px] font-semibold capitalize transition-all"
                                                style={{
                                                    background: position === pos
                                                        ? "color-mix(in srgb, var(--primary) 10%, var(--surface-50))"
                                                        : "var(--surface-50)",
                                                    borderColor: position === pos
                                                        ? "var(--primary)"
                                                        : "var(--surface-200)",
                                                    color: "var(--surface-700)",
                                                }}
                                            >
                                                {pos.replace("-", " ")}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Step 3: Behavior ── */}
                    {step === 3 && (
                        <div className="space-y-5">
                            <div>
                                <label className="text-sm font-semibold text-[var(--surface-700)] mb-2 block">
                                    <Shield className="w-4 h-4 inline mr-1.5 opacity-60" />
                                    Conversation Persistence
                                </label>
                                <div className="space-y-2">
                                    {[
                                        { value: "ephemeral", label: "💨 Ephemeral", desc: "No history — fresh start every time" },
                                        { value: "ip_persistent", label: "🌐 IP Persistent", desc: "Resume by visitor IP address" },
                                        { value: "user_persistent", label: "👤 User Persistent", desc: "Resume by browser fingerprint/cookie" },
                                        { value: "gated", label: "🔐 Gated", desc: "Require name/email before chatting" },
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setPersistenceMode(opt.value)}
                                            className="w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3"
                                            style={{
                                                background: persistenceMode === opt.value
                                                    ? "color-mix(in srgb, var(--primary) 6%, var(--surface-50))"
                                                    : "var(--surface-50)",
                                                borderColor: persistenceMode === opt.value
                                                    ? "var(--primary)"
                                                    : "var(--surface-200)",
                                                borderWidth: persistenceMode === opt.value ? "2px" : "1px",
                                            }}
                                        >
                                            <div className="flex-1">
                                                <div className="text-xs font-bold text-[var(--surface-900)]">{opt.label}</div>
                                                <div className="text-[10px] text-[var(--surface-500)]">{opt.desc}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-[var(--surface-700)] mb-1.5 block">
                                    <Globe className="w-3.5 h-3.5 inline mr-1 opacity-60" />
                                    Allowed Domains (comma-separated, empty = all)
                                </label>
                                <input
                                    type="text"
                                    value={allowedDomains}
                                    onChange={e => setAllowedDomains(e.target.value)}
                                    placeholder="example.com, app.example.com"
                                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                                    style={{
                                        background: "var(--surface-100)",
                                        borderColor: "var(--surface-200)",
                                        color: "var(--surface-900)",
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-[var(--surface-700)] mb-1.5 block">
                                        Rate Limit (msg/min)
                                    </label>
                                    <input
                                        type="number"
                                        value={rateLimitRpm}
                                        onChange={e => setRateLimitRpm(parseInt(e.target.value) || 20)}
                                        min={1}
                                        max={100}
                                        className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                                        style={{
                                            background: "var(--surface-100)",
                                            borderColor: "var(--surface-200)",
                                            color: "var(--surface-900)",
                                        }}
                                    />
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={autoOpen}
                                            onChange={e => setAutoOpen(e.target.checked)}
                                            className="accent-[var(--primary)]"
                                        />
                                        <span className="text-xs font-semibold text-[var(--surface-700)]">
                                            Auto-open on load
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="text-xs text-red-500 text-center bg-red-50 rounded-lg p-2">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div
                    className="px-6 py-4 flex items-center justify-between"
                    style={{ borderTop: "1px solid var(--surface-200)" }}
                >
                    {step > 1 ? (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors hover:bg-[var(--surface-200)]"
                            style={{ color: "var(--surface-600)" }}
                        >
                            Back
                        </button>
                    ) : (
                        <div />
                    )}

                    {step < 3 ? (
                        <button
                            onClick={() => {
                                if (step === 1 && (!name.trim() || !templateId)) {
                                    setError("Please fill in the widget name and select an agent.");
                                    return;
                                }
                                setError("");
                                setStep(step + 1);
                            }}
                            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                            style={{ background: "var(--gradient-primary)" }}
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                            style={{ background: "var(--gradient-primary)" }}
                        >
                            {isSubmitting ? "Creating..." : "Create Widget"}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
