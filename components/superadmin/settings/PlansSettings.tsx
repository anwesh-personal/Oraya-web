"use client";

import { useState } from "react";
import { Save, Plus, Edit, Trash2, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface Plan {
    id: string;
    name: string;
    price: number;
    billingCycle: "one-time" | "monthly" | "yearly";
    features: string[];
    limits: {
        agents: number | "unlimited";
        apiCalls: number | "unlimited";
        storage: string;
    };
    isActive: boolean;
}

const initialPlans: Plan[] = [
    {
        id: "free",
        name: "Free",
        price: 0,
        billingCycle: "monthly",
        features: ["3 core agents", "Basic protocols", "Community support"],
        limits: { agents: 3, apiCalls: 100, storage: "100MB" },
        isActive: true,
    },
    {
        id: "byok",
        name: "BYOK",
        price: 49,
        billingCycle: "one-time",
        features: ["3 core agents", "Basic protocols", "Bring your own API keys", "Local-only"],
        limits: { agents: 3, apiCalls: "unlimited", storage: "1GB" },
        isActive: true,
    },
    {
        id: "pro",
        name: "Pro",
        price: 29,
        billingCycle: "monthly",
        features: ["Unlimited agents", "All protocols", "Managed API", "Voice features", "Cloud sync", "Priority support"],
        limits: { agents: "unlimited", apiCalls: 10000, storage: "10GB" },
        isActive: true,
    },
    {
        id: "enterprise",
        name: "Enterprise",
        price: 199,
        billingCycle: "monthly",
        features: ["Everything in Pro", "Team management", "SSO", "White-label", "Dedicated support", "SLA"],
        limits: { agents: "unlimited", apiCalls: "unlimited", storage: "100GB" },
        isActive: true,
    },
];

export function PlansSettings() {
    const [plans, setPlans] = useState<Plan[]>(initialPlans);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-[var(--surface-900)]">Subscription Plans</h3>
                    <p className="text-sm text-[var(--surface-500)] mt-1">Manage pricing tiers and features</p>
                </div>
                <button
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium transition-all shadow-lg"
                    style={{ background: 'var(--gradient-primary)', boxShadow: '0 4px 20px -4px var(--primary-glow)' }}
                >
                    <Plus className="w-4 h-4" />
                    Add Plan
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={cn(
                            "p-6 rounded-2xl border transition-all",
                            plan.id === "pro"
                                ? "bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-[var(--primary)]/30"
                                : "bg-[var(--surface-50)] border-[var(--surface-200)]"
                        )}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xl font-bold text-[var(--surface-900)]">{plan.name}</h4>
                            <div className="flex items-center gap-1">
                                <button className="p-2 rounded-lg hover:bg-[var(--surface-200)] text-[var(--surface-500)] hover:text-[var(--surface-900)] transition-colors">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button className="p-2 rounded-lg hover:bg-error/10 text-[var(--surface-500)] hover:text-error transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-baseline gap-1 mb-4">
                            <span className="text-3xl font-bold text-[var(--surface-900)]">${plan.price}</span>
                            <span className="text-[var(--surface-500)]">
                                /{plan.billingCycle === "one-time" ? "once" : plan.billingCycle === "monthly" ? "mo" : "yr"}
                            </span>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="text-sm">
                                <span className="text-[var(--surface-500)]">Agents: </span>
                                <span className="text-[var(--surface-900)] font-medium">
                                    {plan.limits.agents === "unlimited" ? "Unlimited" : plan.limits.agents}
                                </span>
                            </div>
                            <div className="text-sm">
                                <span className="text-[var(--surface-500)]">API Calls: </span>
                                <span className="text-[var(--surface-900)] font-medium">
                                    {plan.limits.apiCalls === "unlimited" ? "Unlimited" : plan.limits.apiCalls.toLocaleString()}
                                </span>
                            </div>
                            <div className="text-sm">
                                <span className="text-[var(--surface-500)]">Storage: </span>
                                <span className="text-[var(--surface-900)] font-medium">{plan.limits.storage}</span>
                            </div>
                        </div>

                        <ul className="space-y-2">
                            {plan.features.map((feature, idx) => (
                                <li key={idx} className="text-sm text-[var(--surface-600)] flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <div className="mt-6 pt-4 border-t border-[var(--surface-200)]">
                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="text-sm text-[var(--surface-500)]">Active</span>
                                <input
                                    type="checkbox"
                                    checked={plan.isActive}
                                    onChange={() => {
                                        setPlans(plans.map((p) =>
                                            p.id === plan.id ? { ...p, isActive: !p.isActive } : p
                                        ));
                                    }}
                                    className="w-5 h-5 rounded border-[var(--surface-300)] bg-[var(--surface-100)] text-[var(--primary)] focus:ring-[var(--primary)]"
                                />
                            </label>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
