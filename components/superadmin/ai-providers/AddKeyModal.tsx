"use client";

import { useState } from "react";
import {
    Plus,
    X,
    AlertCircle,
    Eye,
    EyeOff,
    Loader2,
    Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { providers, type ProviderId } from "@/lib/ai-providers";

interface AddKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddKeyModal({ isOpen, onClose, onSuccess }: AddKeyModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showKey, setShowKey] = useState(false);
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        provider: "" as ProviderId | "",
        key_name: "",
        api_key: "",
        daily_budget_usd: "",
        monthly_budget_usd: "",
        max_requests_per_minute: "60",
        priority: "0",
        notes: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/superadmin/ai-providers", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    daily_budget_usd: formData.daily_budget_usd ? parseFloat(formData.daily_budget_usd) : null,
                    monthly_budget_usd: formData.monthly_budget_usd ? parseFloat(formData.monthly_budget_usd) : null,
                    max_requests_per_minute: parseInt(formData.max_requests_per_minute),
                    priority: parseInt(formData.priority),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to add key");
            }

            onSuccess();
            onClose();
            resetForm();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            provider: "",
            key_name: "",
            api_key: "",
            daily_budget_usd: "",
            monthly_budget_usd: "",
            max_requests_per_minute: "60",
            priority: "0",
            notes: "",
        });
        setStep(1);
        setError(null);
        setShowKey(false);
    };

    if (!isOpen) return null;

    const selectedProvider = formData.provider ? providers[formData.provider] : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => {
                    onClose();
                    resetForm();
                }}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--surface-300)]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-[var(--primary)]/10">
                            <Plus className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--surface-900)]">
                                Add API Key
                            </h2>
                            <p className="text-sm text-[var(--surface-600)]">
                                Step {step} of 2
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            onClose();
                            resetForm();
                        }}
                        className="p-2 rounded-lg hover:bg-[var(--surface-200)] transition-colors"
                    >
                        <X className="w-5 h-5 text-[var(--surface-600)]" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/30 flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-[var(--error)]" />
                                <p className="text-sm text-[var(--error)]">{error}</p>
                            </div>
                        )}

                        {step === 1 ? (
                            <>
                                {/* Step 1: Select Provider */}
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-[var(--surface-700)]">
                                        Select Provider
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {Object.values(providers).map((provider) => (
                                            <button
                                                key={provider.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, provider: provider.id })}
                                                className={cn(
                                                    "relative p-4 rounded-xl border transition-all text-left group",
                                                    formData.provider === provider.id
                                                        ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]/30"
                                                        : "border-[var(--surface-300)] hover:border-[var(--surface-400)] hover:bg-[var(--surface-100)]"
                                                )}
                                            >
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className="text-2xl">{provider.logo}</span>
                                                    <span className={cn(
                                                        "text-sm font-medium",
                                                        formData.provider === provider.id
                                                            ? "text-[var(--primary)]"
                                                            : "text-[var(--surface-700)]"
                                                    )}>
                                                        {provider.name}
                                                    </span>
                                                </div>
                                                {formData.provider === provider.id && (
                                                    <div className="absolute top-2 right-2">
                                                        <Check className="w-4 h-4 text-[var(--primary)]" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {selectedProvider && (
                                    <div className="mt-6 p-4 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-300)]">
                                        <p className="text-sm text-[var(--surface-600)]">
                                            {selectedProvider.description}
                                        </p>
                                        <a
                                            href={selectedProvider.apiDocsUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 mt-2 text-sm text-[var(--primary)] hover:underline"
                                        >
                                            View API Documentation →
                                        </a>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                {/* Step 2: Key Details */}
                                <div className="space-y-5">
                                    {/* Provider Badge */}
                                    {selectedProvider && (
                                        <div className={cn(
                                            "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg",
                                            selectedProvider.bgColor
                                        )}>
                                            <span>{selectedProvider.logo}</span>
                                            <span className={cn("text-sm font-medium", selectedProvider.color)}>
                                                {selectedProvider.name}
                                            </span>
                                        </div>
                                    )}

                                    {/* Key Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-2">
                                            Key Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.key_name}
                                            onChange={(e) => setFormData({ ...formData, key_name: e.target.value })}
                                            placeholder="e.g., Production Key 1"
                                            required
                                            className="w-full px-4 py-3 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-300)] text-[var(--surface-800)] placeholder:text-[var(--surface-500)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all"
                                        />
                                    </div>

                                    {/* API Key */}
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-2">
                                            API Key *
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showKey ? "text" : "password"}
                                                value={formData.api_key}
                                                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                                                placeholder="sk-..."
                                                required
                                                className="w-full px-4 py-3 pr-12 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-300)] text-[var(--surface-800)] placeholder:text-[var(--surface-500)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowKey(!showKey)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--surface-500)] hover:text-[var(--surface-700)]"
                                            >
                                                {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Budget Row */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--surface-700)] mb-2">
                                                Daily Budget (USD)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.daily_budget_usd}
                                                onChange={(e) => setFormData({ ...formData, daily_budget_usd: e.target.value })}
                                                placeholder="100.00"
                                                className="w-full px-4 py-3 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-300)] text-[var(--surface-800)] placeholder:text-[var(--surface-500)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--surface-700)] mb-2">
                                                Monthly Budget (USD)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.monthly_budget_usd}
                                                onChange={(e) => setFormData({ ...formData, monthly_budget_usd: e.target.value })}
                                                placeholder="2000.00"
                                                className="w-full px-4 py-3 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-300)] text-[var(--surface-800)] placeholder:text-[var(--surface-500)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Rate Limiting */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--surface-700)] mb-2">
                                                Rate Limit (req/min)
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.max_requests_per_minute}
                                                onChange={(e) => setFormData({ ...formData, max_requests_per_minute: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-300)] text-[var(--surface-800)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--surface-700)] mb-2">
                                                Priority
                                            </label>
                                            <select
                                                value={formData.priority}
                                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-300)] text-[var(--surface-800)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all"
                                            >
                                                <option value="0">Normal</option>
                                                <option value="1">High</option>
                                                <option value="2">Critical</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-2">
                                            Notes (optional)
                                        </label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            placeholder="Any additional notes..."
                                            rows={3}
                                            className="w-full px-4 py-3 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-300)] text-[var(--surface-800)] placeholder:text-[var(--surface-500)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all resize-none"
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--surface-300)] bg-[var(--surface-100)]">
                        {step === 1 ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        resetForm();
                                    }}
                                    className="px-4 py-2.5 rounded-xl text-[var(--surface-600)] hover:bg-[var(--surface-200)] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    disabled={!formData.provider}
                                    className="px-6 py-2.5 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    style={{ background: 'var(--gradient-primary)' }}
                                >
                                    Continue
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-4 py-2.5 rounded-xl text-[var(--surface-600)] hover:bg-[var(--surface-200)] transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading || !formData.key_name || !formData.api_key}
                                    className="px-6 py-2.5 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                    style={{ background: 'var(--gradient-primary)' }}
                                >
                                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {isLoading ? "Adding..." : "Add Key"}
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
