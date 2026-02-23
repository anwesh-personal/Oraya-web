"use client";

import { useState } from "react";
import {
    Plus, Edit, Trash2, DollarSign, X, Loader2, Check,
    Shield, Cpu, Monitor, MessageSquare, Zap, Eye, EyeOff,
    GripVertical, ToggleLeft, ToggleRight, Building2, Key,
    Package, ArrowRight, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePlans, Plan } from "@/hooks/usePlans";

// ─── Known feature options ───────────────────────────────────────────────────
const FEATURE_OPTIONS = [
    { id: "local_ai_only", label: "Local AI Only", description: "Use only locally-hosted AI models", icon: Monitor },
    { id: "managed_ai", label: "Managed AI", description: "Access to platform-managed AI", icon: Zap },
    { id: "multi_device", label: "Multi-Device", description: "Use on multiple devices", icon: Monitor },
    { id: "priority_support", label: "Priority Support", description: "Faster response times", icon: Shield },
    { id: "advanced_analytics", label: "Advanced Analytics", description: "Detailed usage insights", icon: Layers },
    { id: "team_sync", label: "Team Sync", description: "Real-time collaboration", icon: Building2 },
    { id: "shared_agents", label: "Shared Agents", description: "Share agents across team", icon: Package },
    { id: "everything", label: "Everything", description: "All features included", icon: Shield },
    { id: "voice_ai", label: "Voice AI", description: "Text-to-speech features", icon: Zap },
    { id: "research", label: "Research", description: "Autonomous research tools", icon: Cpu },
    { id: "white_label", label: "White Label", description: "Custom branding", icon: Shield },
];

const blankPlan = {
    id: "",
    name: "",
    description: "",
    price_monthly: 0,
    price_yearly: 0,
    price_monthly_byok: 0,
    price_yearly_byok: 0,
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
    const [priceType, setPriceType] = useState<"managed" | "byok">("managed");

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
            price_monthly_byok: plan.price_monthly_byok || 0,
            price_yearly_byok: plan.price_yearly_byok || 0,
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

    const handleSave = async () => {
        if (!form.name.trim()) return setModalError("Plan name is required");
        if (modalMode === "create" && !form.id.trim()) return setModalError("Plan ID is required");

        setSaving(true);
        setModalError("");

        try {
            const endpoint = "/api/superadmin/plans";
            const res = await fetch(endpoint, {
                method: modalMode === "create" ? "POST" : "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(modalMode === "create" ? form : { plan_id: form.id, updates: form }),
            });

            if (!res.ok) {
                const data = await res.json();
                setModalError(data.error || "Failed to save plan");
                return;
            }

            toast.success(`Plan "${form.name}" saved successfully`);
            setModalMode(null);
            refetch();
        } catch {
            setModalError("Network error occurred");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/superadmin/plans?plan_id=${deleteTarget.id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                toast.error(data.error || "Failed to delete plan");
                return;
            }
            toast.success("Plan deleted");
            setDeleteTarget(null);
            refetch();
        } finally {
            setDeleting(false);
        }
    };

    const toggleFeature = (id: string) => {
        setForm(f => ({
            ...f,
            features: f.features.includes(id) ? f.features.filter(x => x !== id) : [...f.features, id]
        }));
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--primary)]" />
            <p className="text-[var(--surface-500)] animate-pulse">Synchronizing pricing tiers...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* ─── Header ─── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h3 className="text-2xl font-bold text-[var(--surface-900)] tracking-tight">Subscription Architecture</h3>
                    <p className="text-[var(--surface-500)] mt-1.5 max-w-xl">
                        Design and scale your platform's economic model. Toggle between Managed and BYOK pricing views to audit your margins.
                    </p>
                </div>

                <div className="flex items-center gap-3 p-1.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-2xl">
                    <button
                        onClick={() => setPriceType("managed")}
                        className={cn(
                            "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                            priceType === "managed" ? "bg-white text-[var(--surface-900)] shadow-sm" : "text-[var(--surface-500)] hover:text-[var(--surface-700)]"
                        )}
                    >
                        <Zap className={cn("w-4 h-4", priceType === "managed" ? "text-amber-500" : "")} />
                        Managed AI
                    </button>
                    <button
                        onClick={() => setPriceType("byok")}
                        className={cn(
                            "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                            priceType === "byok" ? "bg-white text-[var(--surface-900)] shadow-sm" : "text-[var(--surface-500)] hover:text-[var(--surface-700)]"
                        )}
                    >
                        <Key className={cn("w-4 h-4", priceType === "byok" ? "text-indigo-500" : "")} />
                        BYOK
                    </button>
                    <div className="w-px h-6 bg-[var(--surface-300)] mx-1" />
                    <button
                        onClick={openCreate}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[var(--primary-glow)]"
                        style={{ background: 'var(--gradient-primary)' }}
                    >
                        <Plus className="w-4 h-4 inline-block mr-1.5" />
                        Create Tier
                    </button>
                </div>
            </div>

            {/* ─── Plans Grid ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={cn(
                            "group relative flex flex-col p-8 rounded-[2.5rem] border transition-all duration-500",
                            plan.is_active
                                ? "bg-white/80 backdrop-blur-xl border-[var(--surface-200)] hover:border-[var(--primary)]/30 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)]"
                                : "bg-[var(--surface-100)]/40 border-dashed border-[var(--surface-300)] grayscale"
                        )}
                    >
                        {/* Status Tags */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            {plan.badge && (
                                <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full text-white" style={{ background: 'var(--gradient-primary)' }}>
                                    {plan.badge}
                                </span>
                            )}
                            {plan.requires_organization && (
                                <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                    Org
                                </span>
                            )}
                        </div>

                        {/* Title & Actions */}
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="text-2xl font-black text-[var(--surface-900)] tracking-tighter">{plan.name}</h4>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                <button onClick={() => openEdit(plan)} className="p-2 hover:bg-[var(--surface-100)] rounded-full text-[var(--surface-500)] hover:text-[var(--primary)] transition-colors">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => setDeleteTarget(plan)} className="p-2 hover:bg-red-50 rounded-full text-[var(--surface-400)] hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-[var(--surface-500)] line-clamp-2 min-h-[2.5rem] mb-6">{plan.description || "No description provided."}</p>

                        {/* Pricing */}
                        <div className="mb-8">
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-black text-[var(--surface-900)]">
                                    ${priceType === 'managed' ? plan.price_monthly : plan.price_monthly_byok}
                                </span>
                                <span className="text-[var(--surface-400)] font-medium">/mo</span>
                            </div>
                            <div className="text-sm text-[var(--surface-400)] mt-1 ml-1">
                                or ${priceType === 'managed' ? plan.price_yearly : plan.price_yearly_byok} billed annually
                            </div>
                        </div>

                        {/* Limits Visualizer */}
                        <div className="space-y-4 mb-8">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="text-[var(--surface-500)] font-semibold flex items-center gap-1.5 uppercase tracking-wide">
                                    <Cpu className="w-3.5 h-3.5" /> Agents
                                </span>
                                <span className="text-[var(--surface-900)] font-bold">{plan.max_agents === -1 ? '∞' : plan.max_agents}</span>
                            </div>
                            <div className="h-1.5 w-full bg-[var(--surface-200)] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                                    style={{ width: plan.max_agents === -1 ? '100%' : `${Math.min(100, (plan.max_agents / 20) * 100)}%` }}
                                />
                            </div>

                            <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="text-[var(--surface-500)] font-semibold flex items-center gap-1.5 uppercase tracking-wide">
                                    <Monitor className="w-3.5 h-3.5" /> Devices
                                </span>
                                <span className="text-[var(--surface-900)] font-bold">{plan.max_devices === -1 ? '∞' : plan.max_devices}</span>
                            </div>
                        </div>

                        {/* Feature List */}
                        <div className="flex-1">
                            <h5 className="text-[10px] font-black text-[var(--surface-400)] uppercase tracking-widest mb-4">Core Capabilities</h5>
                            <ul className="space-y-3">
                                {plan.features?.slice(0, 5).map((fid) => {
                                    const feat = FEATURE_OPTIONS.find(o => o.id === fid);
                                    return (
                                        <li key={fid} className="flex items-center gap-3 text-sm text-[var(--surface-600)]">
                                            <div className="p-1 rounded-md bg-emerald-50 text-emerald-500">
                                                <Check className="w-3 h-3" />
                                            </div>
                                            <span className="truncate">{feat?.label || fid}</span>
                                        </li>
                                    );
                                })}
                                {plan.features?.length > 5 && (
                                    <li className="text-xs text-[var(--surface-400)] font-medium pl-8 italic">
                                        + {plan.features.length - 5} additional features
                                    </li>
                                )}
                            </ul>
                        </div>

                        {/* Quick Toggle */}
                        <div className="mt-8 pt-6 border-t border-[var(--surface-100)] flex items-center justify-between">
                            <span className="text-xs font-mono text-[var(--surface-400)]">{plan.id}</span>
                            <button
                                onClick={async () => {
                                    await fetch("/api/superadmin/plans", {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ plan_id: plan.id, updates: { is_active: !plan.is_active } }),
                                    });
                                    refetch();
                                    toast.success(`Plan ${plan.is_active ? 'deactivated' : 'activated'}`);
                                }}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1 rounded-full transition-all text-[10px] font-bold uppercase",
                                    plan.is_active ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                )}
                            >
                                {plan.is_active ? <><Eye className="w-3 h-3" /> Visible</> : <><EyeOff className="w-3 h-3" /> Hidden</>}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* ─── Modals (Edit/Create) ─── */}
            {modalMode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setModalMode(null)} />
                    <div className="relative bg-white rounded-[3rem] border border-[var(--surface-200)] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-8 border-b border-[var(--surface-100)] bg-[var(--surface-50)]/50">
                            <div className="flex items-center gap-4">
                                <div className="p-4 rounded-3xl bg-white shadow-sm border border-[var(--surface-200)]">
                                    <Package className="w-6 h-6 text-[var(--primary)]" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-[var(--surface-900)] tracking-tighter">
                                        {modalMode === 'create' ? 'Evolve a New Tier' : `Refine ${form.name}`}
                                    </h2>
                                    <p className="text-sm text-[var(--surface-500)] font-medium">Configure capabilities and value extraction.</p>
                                </div>
                            </div>
                            <button onClick={() => setModalMode(null)} className="p-3 bg-white hover:bg-red-50 hover:text-red-500 rounded-2xl border border-[var(--surface-200)] transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-10 space-y-12">
                            {modalError && (
                                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm font-bold flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                                    {modalError}
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                {/* Left Col: Identity & Limits */}
                                <div className="space-y-10">
                                    <section>
                                        <h4 className="text-xs font-black text-[var(--surface-400)] uppercase tracking-[0.2em] mb-6">Fundamental Identity</h4>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-[var(--surface-600)] ml-1">Plan Identifier</label>
                                                    <input
                                                        disabled={modalMode === 'edit'}
                                                        value={form.id}
                                                        onChange={e => setForm(f => ({ ...f, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                                                        className="w-full px-5 py-4 bg-[var(--surface-50)] border border-[var(--surface-200)] rounded-[1.25rem] font-mono text-sm focus:ring-2 ring-[var(--primary)]/20 outline-none transition-all disabled:opacity-50"
                                                        placeholder="e.g. quantum-pro"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-[var(--surface-600)] ml-1">Display Name</label>
                                                    <input
                                                        value={form.name}
                                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                                        className="w-full px-5 py-4 bg-[var(--surface-50)] border border-[var(--surface-200)] rounded-[1.25rem] text-[var(--surface-900)] font-bold focus:ring-2 ring-[var(--primary)]/20 outline-none transition-all"
                                                        placeholder="Pro"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-[var(--surface-600)] ml-1">Elevator Pitch</label>
                                                <textarea
                                                    value={form.description}
                                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                                    className="w-full px-5 py-4 bg-[var(--surface-50)] border border-[var(--surface-200)] rounded-[1.25rem] text-[var(--surface-900)] h-24 resize-none transition-all"
                                                    placeholder="A brief description of who this plan is for..."
                                                />
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <h4 className="text-xs font-black text-[var(--surface-400)] uppercase tracking-[0.2em] mb-6">Resource Allocation</h4>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                                            {[
                                                { label: 'Max Agents', key: 'max_agents', icon: Cpu },
                                                { label: 'Max Devices', key: 'max_devices', icon: Monitor },
                                                { label: 'AI Calls/Mo', key: 'max_ai_calls_per_month', icon: Zap },
                                                { label: 'Conversations/Mo', key: 'max_conversations_per_month', icon: MessageSquare },
                                            ].map(limit => (
                                                <div key={limit.key} className="space-y-2">
                                                    <label className="flex items-center gap-2 text-xs font-bold text-[var(--surface-600)] ml-1">
                                                        <limit.icon className="w-3.5 h-3.5" />
                                                        {limit.label}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={form[limit.key as keyof PlanForm] as number}
                                                        onChange={e => setForm(f => ({ ...f, [limit.key]: parseInt(e.target.value) || 0 }))}
                                                        className="w-full px-5 py-4 bg-[var(--surface-50)] border border-[var(--surface-200)] rounded-[1.25rem] text-[var(--surface-900)] font-bold transition-all"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>

                                {/* Right Col: Pricing & Features */}
                                <div className="space-y-10">
                                    <section>
                                        <div className="flex items-center justify-between mb-6">
                                            <h4 className="text-xs font-black text-[var(--surface-400)] uppercase tracking-[0.2em]">Monetization Engine</h4>
                                            <span className="px-3 py-1 bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase rounded-lg border border-amber-500/20">USD</span>
                                        </div>

                                        <div className="bg-[var(--surface-50)] rounded-[2rem] border border-[var(--surface-200)] overflow-hidden">
                                            <div className="grid grid-cols-2 divide-x divide-[var(--surface-200)]">
                                                <div className="p-8 space-y-6">
                                                    <h5 className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-widest">
                                                        <Zap className="w-3 h-3" /> Managed AI
                                                    </h5>
                                                    <div className="space-y-4">
                                                        <div className="space-y-1.5">
                                                            <span className="text-[10px] font-bold text-[var(--surface-400)] ml-1">Monthly</span>
                                                            <input type="number" step="0.01" value={form.price_monthly} onChange={e => setForm(f => ({ ...f, price_monthly: parseFloat(e.target.value) }))} className="w-full bg-transparent text-2xl font-black outline-none" />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <span className="text-[10px] font-bold text-[var(--surface-400)] ml-1">Yearly</span>
                                                            <input type="number" step="0.01" value={form.price_yearly} onChange={e => setForm(f => ({ ...f, price_yearly: parseFloat(e.target.value) }))} className="w-full bg-transparent text-xl font-bold text-[var(--surface-600)] outline-none" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-8 space-y-6 bg-white/50">
                                                    <h5 className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                                        <Key className="w-3 h-3" /> BYOK Mod
                                                    </h5>
                                                    <div className="space-y-4">
                                                        <div className="space-y-1.5">
                                                            <span className="text-[10px] font-bold text-[var(--surface-400)] ml-1 text-indigo-400">Monthly</span>
                                                            <input type="number" step="0.01" value={form.price_monthly_byok} onChange={e => setForm(f => ({ ...f, price_monthly_byok: parseFloat(e.target.value) }))} className="w-full bg-transparent text-2xl font-black outline-none text-indigo-700" />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <span className="text-[10px] font-bold text-[var(--surface-400)] ml-1 text-indigo-400">Yearly</span>
                                                            <input type="number" step="0.01" value={form.price_yearly_byok} onChange={e => setForm(f => ({ ...f, price_yearly_byok: parseFloat(e.target.value) }))} className="w-full bg-transparent text-xl font-bold text-indigo-500/80 outline-none" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <h4 className="text-xs font-black text-[var(--surface-400)] uppercase tracking-[0.2em] mb-6">Capability Matrix</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {FEATURE_OPTIONS.map(feat => (
                                                <button
                                                    key={feat.id}
                                                    onClick={() => toggleFeature(feat.id)}
                                                    className={cn(
                                                        "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                                                        form.features.includes(feat.id)
                                                            ? "bg-[var(--primary)]/5 border-[var(--primary)]/30 text-[var(--surface-900)] ring-1 ring-[var(--primary)]/10 shadow-sm"
                                                            : "bg-white border-[var(--surface-200)] text-[var(--surface-500)] hover:border-[var(--surface-300)]"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "p-2 rounded-xl border transition-colors",
                                                        form.features.includes(feat.id) ? "bg-white border-[var(--primary)]/20 text-[var(--primary)]" : "bg-[var(--surface-50)] border-[var(--surface-200)]"
                                                    )}>
                                                        <feat.icon className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold truncate leading-none mb-1">{feat.label}</p>
                                                        <p className="text-[10px] font-medium opacity-60 truncate">{feat.description}</p>
                                                    </div>
                                                    {form.features.includes(feat.id) && <Check className="w-4 h-4 text-[var(--primary)] shrink-0" />}
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 border-t border-[var(--surface-100)] bg-[var(--surface-50)]/50 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div
                                        onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                                        className={cn(
                                            "w-10 h-6 rounded-full p-1 transition-all duration-300",
                                            form.is_active ? "bg-emerald-500" : "bg-[var(--surface-300)]"
                                        )}
                                    >
                                        <div className={cn("w-4 h-4 bg-white rounded-full transition-all duration-300 transform", form.is_active ? "translate-x-4" : "translate-x-0")} />
                                    </div>
                                    <span className="text-sm font-bold text-[var(--surface-700)]">Active</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div
                                        onClick={() => setForm(f => ({ ...f, is_public: !f.is_public }))}
                                        className={cn(
                                            "w-10 h-6 rounded-full p-1 transition-all duration-300",
                                            form.is_public ? "bg-indigo-500" : "bg-[var(--surface-300)]"
                                        )}
                                    >
                                        <div className={cn("w-4 h-4 bg-white rounded-full transition-all duration-300 transform", form.is_public ? "translate-x-4" : "translate-x-0")} />
                                    </div>
                                    <span className="text-sm font-bold text-[var(--surface-700)]">Public</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div
                                        onClick={() => setForm(f => ({ ...f, requires_organization: !f.requires_organization }))}
                                        className={cn(
                                            "w-10 h-6 rounded-full p-1 transition-all duration-300",
                                            form.requires_organization ? "bg-blue-500" : "bg-[var(--surface-300)]"
                                        )}
                                    >
                                        <div className={cn("w-4 h-4 bg-white rounded-full transition-all duration-300 transform", form.requires_organization ? "translate-x-4" : "translate-x-0")} />
                                    </div>
                                    <span className="text-sm font-bold text-[var(--surface-700)]">Org Required</span>
                                </label>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setModalMode(null)}
                                    className="px-8 py-4 rounded-2xl border border-[var(--surface-200)] bg-white text-[var(--surface-600)] font-bold hover:bg-[var(--surface-50)] transition-all active:scale-95"
                                >
                                    Discard
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-8 py-4 rounded-2xl text-white font-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-[var(--primary-glow)] flex items-center gap-3 min-w-[160px] justify-center"
                                    style={{ background: 'var(--gradient-primary)' }}
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Propagate Changes</span>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Delete Confirmation ─── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setDeleteTarget(null)} />
                    <div className="relative bg-white rounded-[3rem] p-10 max-w-md w-full animate-in zoom-in-95 duration-200 shadow-2xl">
                        <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mb-8 border border-red-100 mx-auto">
                            <Trash2 className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-2xl font-black text-[var(--surface-900)] text-center tracking-tight mb-3">Terminate Tier?</h3>
                        <p className="text-[var(--surface-500)] text-center mb-10 font-medium">
                            Deleting <strong>{deleteTarget.name}</strong> is irreversible. This will only succeed if zero active licenses are assigned.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-4 px-6 rounded-2xl border border-[var(--surface-200)] font-bold text-[var(--surface-600)] hover:bg-[var(--surface-50)] transition-all">
                                Abort
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 py-4 px-6 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-200"
                            >
                                {deleting ? 'Terminating...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
