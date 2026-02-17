"use client";

import { useState } from "react";
import {
    Plus, Edit, Trash2, DollarSign, X, Loader2, Check,
    Shield, Cpu, Monitor, MessageSquare, Zap, Eye, EyeOff,
    GripVertical, ToggleLeft, ToggleRight, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePlans, Plan } from "@/hooks/usePlans";

// ─── Known feature options (for checkbox UI) ──────────────────────────────────
const FEATURE_OPTIONS = [
    { id: "local_ai_only", label: "Local AI Only", description: "Use only locally-hosted AI models" },
    { id: "managed_ai", label: "Managed AI", description: "Access to platform-managed AI providers" },
    { id: "multi_device", label: "Multi-Device", description: "Use on multiple devices simultaneously" },
    { id: "single_device", label: "Single Device", description: "Limited to one device at a time" },
    { id: "priority_support", label: "Priority Support", description: "Faster response times" },
    { id: "advanced_analytics", label: "Advanced Analytics", description: "Detailed usage & performance analytics" },
    { id: "team_sync", label: "Team Sync", description: "Real-time collaboration features" },
    { id: "shared_agents", label: "Shared Agents", description: "Share agents across team members" },
    { id: "unlimited_devices", label: "Unlimited Devices", description: "No device limit" },
    { id: "everything", label: "Everything", description: "All features included" },
    { id: "custom_deployment", label: "Custom Deployment", description: "On-premise or private cloud" },
    { id: "dedicated_support", label: "Dedicated Support", description: "Dedicated account manager" },
    { id: "sla", label: "SLA", description: "Service Level Agreement" },
    { id: "premium_security", label: "Premium Security", description: "Enhanced security features" },
    { id: "voice_features", label: "Voice Features", description: "Text-to-speech and speech-to-text" },
    { id: "cloud_sync", label: "Cloud Sync", description: "Sync data across devices" },
];

// ─── Blank plan template ──────────────────────────────────────────────────────
const blankPlan = {
    id: "",
    name: "",
    description: "",
    price_monthly: 0,
    price_yearly: 0,
    currency: "USD",
    max_agents: 1,
    max_conversations_per_month: 50,
    max_ai_calls_per_month: 1000,
    max_token_usage_per_month: 100000,
    max_devices: 1,
    features: [] as string[],
    is_active: true,
    is_public: true,
    display_order: 0,
    badge: "",
    requires_organization: false,
};

type PlanForm = typeof blankPlan;

export function PlansSettings() {
    const { plans, loading, refetch } = usePlans();

    // Modal state
    const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
    const [form, setForm] = useState<PlanForm>(blankPlan);
    const [saving, setSaving] = useState(false);
    const [modalError, setModalError] = useState("");

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);
    const [deleting, setDeleting] = useState(false);

    // ─── Handlers ─────────────────────────────────────────────────────────────
    const openCreate = () => {
        setForm({ ...blankPlan, display_order: plans.length });
        setModalMode("create");
        setModalError("");
    };

    const openEdit = (plan: Plan) => {
        setForm({
            id: plan.id,
            name: plan.name,
            description: plan.description || "",
            price_monthly: plan.price_monthly || 0,
            price_yearly: plan.price_yearly || 0,
            currency: plan.currency || "USD",
            max_agents: plan.max_agents ?? 1,
            max_conversations_per_month: plan.max_conversations_per_month ?? 50,
            max_ai_calls_per_month: plan.max_ai_calls_per_month ?? 1000,
            max_token_usage_per_month: plan.max_token_usage_per_month ?? 100000,
            max_devices: plan.max_devices ?? 1,
            features: plan.features || [],
            is_active: plan.is_active,
            is_public: plan.is_public,
            display_order: plan.display_order ?? 0,
            badge: plan.badge || "",
            requires_organization: plan.requires_organization || false,
        });
        setModalMode("edit");
        setModalError("");
    };

    const closeModal = () => {
        setModalMode(null);
        setForm(blankPlan);
        setModalError("");
    };

    const toggleFeature = (featureId: string) => {
        setForm((prev) => ({
            ...prev,
            features: prev.features.includes(featureId)
                ? prev.features.filter((f) => f !== featureId)
                : [...prev.features, featureId],
        }));
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            setModalError("Plan name is required");
            return;
        }
        if (modalMode === "create" && !form.id.trim()) {
            setModalError("Plan ID is required");
            return;
        }

        setSaving(true);
        setModalError("");

        try {
            const endpoint = "/api/superadmin/plans";

            if (modalMode === "create") {
                const res = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form),
                });
                const data = await res.json();
                if (!res.ok) {
                    setModalError(data.error || "Failed to create plan");
                    return;
                }
                toast.success(`Plan "${form.name}" created`);
            } else {
                const { id, ...updates } = form;
                const res = await fetch(endpoint, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ plan_id: id, updates }),
                });
                const data = await res.json();
                if (!res.ok) {
                    setModalError(data.error || "Failed to update plan");
                    return;
                }
                toast.success(`Plan "${form.name}" updated`);
            }

            closeModal();
            refetch();
        } catch {
            setModalError("Network error — please try again");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);

        try {
            const res = await fetch(`/api/superadmin/plans?plan_id=${deleteTarget.id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || "Failed to delete plan");
                return;
            }
            toast.success(`Plan "${deleteTarget.name}" deleted`);
            setDeleteTarget(null);
            refetch();
        } catch {
            toast.error("Failed to delete plan");
        } finally {
            setDeleting(false);
        }
    };

    const handleToggleActive = async (plan: Plan) => {
        try {
            const res = await fetch("/api/superadmin/plans", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plan_id: plan.id,
                    updates: { is_active: !plan.is_active },
                }),
            });
            if (res.ok) {
                toast.success(`Plan "${plan.name}" ${plan.is_active ? "deactivated" : "activated"}`);
                refetch();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to toggle plan");
            }
        } catch {
            toast.error("Failed to toggle plan");
        }
    };

    // ─── Formatters ───────────────────────────────────────────────────────────
    const formatPrice = (price: number | null) => {
        if (price === null || price === undefined) return "Custom";
        return price === 0 ? "Free" : `$${price}`;
    };

    const formatLimit = (value: number | null) => {
        if (value === null || value === undefined || value === -1) return "Unlimited";
        return value.toLocaleString();
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
                <span className="ml-3 text-[var(--surface-500)]">Loading plans...</span>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--surface-900)]">Subscription Plans</h3>
                        <p className="text-sm text-[var(--surface-500)] mt-1">
                            Manage pricing tiers, feature gates, and usage limits
                        </p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium transition-all shadow-lg hover:shadow-xl"
                        style={{ background: 'var(--gradient-primary)', boxShadow: '0 4px 20px -4px var(--primary-glow)' }}
                    >
                        <Plus className="w-4 h-4" />
                        Add Plan
                    </button>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={cn(
                                "relative p-6 rounded-2xl border transition-all group",
                                plan.is_active
                                    ? "bg-[var(--surface-50)] border-[var(--surface-200)] hover:border-[var(--surface-300)] hover:shadow-lg"
                                    : "bg-[var(--surface-100)]/50 border-[var(--surface-200)] opacity-60"
                            )}
                        >
                            {/* Badge */}
                            {plan.badge && (
                                <span className="absolute -top-2.5 right-4 px-3 py-0.5 text-xs font-semibold rounded-full text-white"
                                    style={{ background: 'var(--gradient-primary)' }}>
                                    {plan.badge}
                                </span>
                            )}

                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-xl font-bold text-[var(--surface-900)]">{plan.name}</h4>
                                        {!plan.is_active && (
                                            <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--surface-200)] text-[var(--surface-500)]">
                                                Inactive
                                            </span>
                                        )}
                                        {!plan.is_public && plan.is_active && (
                                            <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/15 text-amber-500">
                                                Hidden
                                            </span>
                                        )}
                                        {plan.requires_organization && (
                                            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/15 text-blue-400 flex items-center gap-1">
                                                <Building2 className="w-3 h-3" /> Org Required
                                            </span>
                                        )}
                                    </div>
                                    {plan.description && (
                                        <p className="text-sm text-[var(--surface-500)] mt-1">{plan.description}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEdit(plan)}
                                        className="p-2 rounded-lg hover:bg-[var(--surface-200)] text-[var(--surface-500)] hover:text-[var(--surface-900)] transition-colors"
                                        title="Edit plan"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteTarget(plan)}
                                        className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--surface-500)] hover:text-red-500 transition-colors"
                                        title="Delete plan"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="flex items-baseline gap-1 mb-5">
                                <span className="text-3xl font-bold text-[var(--surface-900)]">
                                    {formatPrice(plan.price_monthly)}
                                </span>
                                {plan.price_monthly !== null && plan.price_monthly > 0 && (
                                    <span className="text-[var(--surface-500)]">/mo</span>
                                )}
                                {plan.price_yearly !== null && plan.price_yearly > 0 && (
                                    <span className="text-xs text-[var(--surface-400)] ml-2">
                                        (${plan.price_yearly}/yr)
                                    </span>
                                )}
                            </div>

                            {/* Limits */}
                            <div className="space-y-2.5 mb-5">
                                <div className="flex items-center gap-2 text-sm">
                                    <Cpu className="w-4 h-4 text-[var(--surface-400)]" />
                                    <span className="text-[var(--surface-500)]">Agents:</span>
                                    <span className="text-[var(--surface-900)] font-medium">{formatLimit(plan.max_agents)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Monitor className="w-4 h-4 text-[var(--surface-400)]" />
                                    <span className="text-[var(--surface-500)]">Devices:</span>
                                    <span className="text-[var(--surface-900)] font-medium">{formatLimit(plan.max_devices)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Zap className="w-4 h-4 text-[var(--surface-400)]" />
                                    <span className="text-[var(--surface-500)]">API Calls:</span>
                                    <span className="text-[var(--surface-900)] font-medium">{formatLimit(plan.max_ai_calls_per_month)}/mo</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <MessageSquare className="w-4 h-4 text-[var(--surface-400)]" />
                                    <span className="text-[var(--surface-500)]">Conversations:</span>
                                    <span className="text-[var(--surface-900)] font-medium">{formatLimit(plan.max_conversations_per_month)}/mo</span>
                                </div>
                            </div>

                            {/* Features */}
                            {plan.features && plan.features.length > 0 && (
                                <ul className="space-y-1.5 mb-5">
                                    {plan.features.map((feature, idx) => {
                                        const featureInfo = FEATURE_OPTIONS.find((f) => f.id === feature);
                                        return (
                                            <li key={idx} className="text-sm text-[var(--surface-600)] flex items-center gap-2">
                                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                {featureInfo?.label || feature}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}

                            {/* Footer: Toggle active */}
                            <div className="pt-4 border-t border-[var(--surface-200)]">
                                <button
                                    onClick={() => handleToggleActive(plan)}
                                    className="flex items-center gap-2 text-sm text-[var(--surface-500)] hover:text-[var(--surface-700)] transition-colors"
                                >
                                    {plan.is_active ? (
                                        <>
                                            <ToggleRight className="w-5 h-5 text-emerald-500" />
                                            <span>Active</span>
                                        </>
                                    ) : (
                                        <>
                                            <ToggleLeft className="w-5 h-5 text-[var(--surface-400)]" />
                                            <span>Inactive</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Plan ID */}
                            <div className="mt-3">
                                <code className="text-xs text-[var(--surface-400)] font-mono">{plan.id}</code>
                            </div>
                        </div>
                    ))}

                    {plans.length === 0 && (
                        <div className="col-span-full py-16 text-center">
                            <DollarSign className="w-12 h-12 text-[var(--surface-300)] mx-auto mb-3" />
                            <p className="text-[var(--surface-500)]">No plans configured</p>
                            <button
                                onClick={openCreate}
                                className="mt-3 text-sm font-medium text-[var(--primary)] hover:underline"
                            >
                                Create your first plan
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Create / Edit Modal ──────────────────────────────────────────── */}
            {modalMode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[var(--surface-50)] rounded-2xl border border-[var(--surface-200)] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-[var(--surface-200)] shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-[var(--primary)]/10">
                                    <DollarSign className="w-5 h-5 text-[var(--primary)]" />
                                </div>
                                <h2 className="text-lg font-semibold text-[var(--surface-900)]">
                                    {modalMode === "create" ? "Create Plan" : `Edit "${form.name}"`}
                                </h2>
                            </div>
                            <button onClick={closeModal} className="p-2 rounded-lg hover:bg-[var(--surface-200)] transition-colors">
                                <X className="w-5 h-5 text-[var(--surface-500)]" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-6 overflow-y-auto flex-1">
                            {modalError && (
                                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                                    {modalError}
                                </div>
                            )}

                            {/* ─── Identity ── */}
                            <div>
                                <h4 className="text-sm font-semibold text-[var(--surface-700)] mb-3 uppercase tracking-wider">Identity</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">Plan ID *</label>
                                        <input
                                            type="text"
                                            value={form.id}
                                            onChange={(e) => setForm({ ...form, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                                            placeholder="e.g. pro, starter"
                                            disabled={modalMode === "edit"}
                                            className={cn(
                                                "w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] font-mono text-sm placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30",
                                                modalMode === "edit" && "opacity-50 cursor-not-allowed"
                                            )}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">Name *</label>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            placeholder="Pro"
                                            className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                                        />
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">Description</label>
                                    <input
                                        type="text"
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="Short description of this plan"
                                        className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-3">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">Badge</label>
                                        <input
                                            type="text"
                                            value={form.badge}
                                            onChange={(e) => setForm({ ...form, badge: e.target.value })}
                                            placeholder="e.g. Popular, New"
                                            className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">Display Order</label>
                                        <input
                                            type="number"
                                            value={form.display_order}
                                            onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ─── Pricing ── */}
                            <div>
                                <h4 className="text-sm font-semibold text-[var(--surface-700)] mb-3 uppercase tracking-wider">Pricing</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">Monthly ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={form.price_monthly}
                                            onChange={(e) => setForm({ ...form, price_monthly: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">Yearly ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={form.price_yearly}
                                            onChange={(e) => setForm({ ...form, price_yearly: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">Currency</label>
                                        <select
                                            value={form.currency}
                                            onChange={(e) => setForm({ ...form, currency: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                                        >
                                            <option value="USD">USD</option>
                                            <option value="EUR">EUR</option>
                                            <option value="GBP">GBP</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* ─── Limits ── */}
                            <div>
                                <h4 className="text-sm font-semibold text-[var(--surface-700)] mb-3 uppercase tracking-wider">
                                    Limits <span className="text-xs font-normal text-[var(--surface-400)]">(-1 = unlimited)</span>
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">
                                            <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" /> Max Agents</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="-1"
                                            value={form.max_agents}
                                            onChange={(e) => setForm({ ...form, max_agents: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">
                                            <span className="flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5" /> Max Devices</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="-1"
                                            value={form.max_devices}
                                            onChange={(e) => setForm({ ...form, max_devices: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">
                                            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> AI Calls / Month</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="-1"
                                            value={form.max_ai_calls_per_month}
                                            onChange={(e) => setForm({ ...form, max_ai_calls_per_month: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">
                                            <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Conversations / Month</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="-1"
                                            value={form.max_conversations_per_month}
                                            onChange={(e) => setForm({ ...form, max_conversations_per_month: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">
                                            Max Token Usage / Month
                                        </label>
                                        <input
                                            type="number"
                                            min="-1"
                                            value={form.max_token_usage_per_month}
                                            onChange={(e) => setForm({ ...form, max_token_usage_per_month: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ─── Features ── */}
                            <div>
                                <h4 className="text-sm font-semibold text-[var(--surface-700)] mb-3 uppercase tracking-wider">Features</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {FEATURE_OPTIONS.map((feature) => (
                                        <label
                                            key={feature.id}
                                            className={cn(
                                                "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                                                form.features.includes(feature.id)
                                                    ? "border-[var(--primary)]/30 bg-[var(--primary)]/5"
                                                    : "border-[var(--surface-200)] hover:border-[var(--surface-300)]"
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={form.features.includes(feature.id)}
                                                onChange={() => toggleFeature(feature.id)}
                                                className="mt-0.5 w-4 h-4 rounded border-[var(--surface-300)] text-[var(--primary)] focus:ring-[var(--primary)]/30"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-[var(--surface-900)]">{feature.label}</p>
                                                <p className="text-xs text-[var(--surface-500)]">{feature.description}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* ─── Visibility ── */}
                            <div>
                                <h4 className="text-sm font-semibold text-[var(--surface-700)] mb-3 uppercase tracking-wider">Visibility</h4>
                                <div className="flex gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.is_active}
                                            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                            className="w-4 h-4 rounded border-[var(--surface-300)] text-[var(--primary)] focus:ring-[var(--primary)]/30"
                                        />
                                        <span className="text-sm text-[var(--surface-700)]">Active</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.is_public}
                                            onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
                                            className="w-4 h-4 rounded border-[var(--surface-300)] text-[var(--primary)] focus:ring-[var(--primary)]/30"
                                        />
                                        <span className="text-sm text-[var(--surface-700)]">Public (visible on pricing page)</span>
                                    </label>
                                </div>
                            </div>

                            {/* ─── Organization Requirement ── */}
                            <div>
                                <h4 className="text-sm font-semibold text-[var(--surface-700)] mb-3 uppercase tracking-wider flex items-center gap-2">
                                    <Building2 className="w-4 h-4" /> Organization Requirement
                                </h4>
                                <label
                                    className={cn(
                                        "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                                        form.requires_organization
                                            ? "border-blue-500/30 bg-blue-500/5"
                                            : "border-[var(--surface-200)] hover:border-[var(--surface-300)]"
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        checked={form.requires_organization}
                                        onChange={(e) => setForm({ ...form, requires_organization: e.target.checked })}
                                        className="mt-0.5 w-4 h-4 rounded border-[var(--surface-300)] text-blue-500 focus:ring-blue-500/30"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-[var(--surface-900)]">Require Organization Membership</p>
                                        <p className="text-xs text-[var(--surface-500)] mt-1">
                                            When enabled, users can only be assigned this plan if they belong to an
                                            organization (team). This is enforced at the API level — the system will
                                            reject plan assignment if the user is not a member of any active organization.
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center gap-3 p-5 border-t border-[var(--surface-200)] shrink-0">
                            <button
                                onClick={closeModal}
                                className="flex-1 py-2.5 rounded-xl border border-[var(--surface-300)] text-[var(--surface-700)] font-medium hover:bg-[var(--surface-200)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-medium transition-all disabled:opacity-50 shadow-lg"
                                style={{ background: 'var(--gradient-primary)' }}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    modalMode === "create" ? "Create Plan" : "Save Changes"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Delete Confirmation ──────────────────────────────────────────── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[var(--surface-50)] rounded-2xl border border-[var(--surface-200)] shadow-2xl w-full max-w-md">
                        <div className="p-5">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 rounded-full bg-red-500/15">
                                    <Trash2 className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-[var(--surface-900)]">Delete Plan</h3>
                                    <p className="text-sm text-[var(--surface-500)]">
                                        This will fail if any active licenses use this plan.
                                    </p>
                                </div>
                            </div>
                            <p className="text-[var(--surface-700)] mb-6">
                                Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
                                Consider deactivating it instead if users are on this plan.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    className="flex-1 py-2.5 rounded-xl border border-[var(--surface-300)] text-[var(--surface-700)] hover:bg-[var(--surface-200)] transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                                >
                                    {deleting ? "Deleting..." : "Delete Plan"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
