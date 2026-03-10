"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    X,
    Server,
    Image as ImageIcon,
    Headphones,
    Video,
    Loader2,
    AlertCircle,
    Check,
    ArrowUp,
    ArrowDown,
    Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { providers as providerConfig, type AIModel } from "@/lib/ai-providers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/superadmin/ui/tabs";

interface EngineEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    engine?: any; // If editing an existing engine
}

// Map the desktop category keys to icons and labels
const CATEGORIES = [
    { id: "llm", label: "LLMs", icon: Server },
    { id: "image", label: "Image", icon: ImageIcon },
    { id: "audio", label: "Audio", icon: Headphones },
    { id: "video", label: "Video", icon: Video },
    { id: "research", label: "Research Server", icon: Server }, // Add research category here if needed
];

export function EngineEditor({ isOpen, onClose, onSuccess, engine }: EngineEditorProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingKeys, setIsFetchingKeys] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form metadata
    const [name, setName] = useState(engine?.name || "");
    const [description, setDescription] = useState(engine?.description || "");

    // The available keys fetched from the backend `managed_ai_keys`
    const [availableKeys, setAvailableKeys] = useState<any[]>([]);

    // State for the engine provider slots being constructed
    // We group them by category for the UI
    const [slots, setSlots] = useState<Record<string, any[]>>({
        llm: [],
        image: [],
        audio: [],
        video: [],
        research: [],
    });

    // Populate state if editing
    useEffect(() => {
        if (engine && engine.slots) {
            setName(engine.name);
            setDescription(engine.description || "");

            const grouped: Record<string, any[]> = {
                llm: [], image: [], audio: [], video: [], research: []
            };

            engine.slots.forEach((slot: any) => {
                const cat = slot.category;
                if (grouped[cat]) {
                    grouped[cat].push({
                        ...slot,
                        // Ensure we parse the DB state into UI-friendly state
                        uiKey: Math.random().toString(36).substring(7),
                    });
                }
            });

            // Sort each category by priority
            Object.keys(grouped).forEach(cat => {
                grouped[cat].sort((a, b) => (a.priority || 0) - (b.priority || 0));
            });

            setSlots(grouped);
        } else {
            setName("");
            setDescription("");
            setSlots({ llm: [], image: [], audio: [], video: [], research: [] });
        }
    }, [engine, isOpen]);

    // Fetch available keys when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchAvailableKeys();
        }
    }, [isOpen]);

    const fetchAvailableKeys = async () => {
        setIsFetchingKeys(true);
        try {
            const response = await fetch("/api/superadmin/ai-providers");
            if (response.ok) {
                const data = await response.json();
                // We only want healthy/active keys
                const usableKeys = (data.keys || []).filter((k: any) => k.is_active && k.is_healthy);
                setAvailableKeys(usableKeys);
            }
        } catch (err) {
            console.error("Failed to fetch keys", err);
        } finally {
            setIsFetchingKeys(false);
        }
    };

    const handleAddSlot = (category: string) => {
        setSlots(prev => {
            const newSlot = {
                uiKey: Math.random().toString(36).substring(7),
                category: category,
                managed_key_id: "",
                selected_model: "",
                is_enabled: true,
                priority: prev[category].length
            };
            return {
                ...prev,
                [category]: [...prev[category], newSlot]
            };
        });
    };

    const handleUpdateSlot = (category: string, index: number, updates: any) => {
        setSlots(prev => {
            const arr = [...prev[category]];
            arr[index] = { ...arr[index], ...updates };

            // If key changed, we might want to auto-select a default model if known
            if (updates.managed_key_id) {
                const keyObj = availableKeys.find(k => k.id === updates.managed_key_id);
                if (keyObj && !arr[index].selected_model) {
                    const provDetails = providerConfig[keyObj.provider as keyof typeof providerConfig];
                    if (provDetails && provDetails.defaultModel) {
                        arr[index].selected_model = provDetails.defaultModel;
                    }
                }
            }

            return { ...prev, [category]: arr };
        });
    };

    const handleRemoveSlot = (category: string, index: number) => {
        setSlots(prev => {
            const arr = [...prev[category]];
            arr.splice(index, 1);
            // Re-index priorities
            arr.forEach((s, idx) => { s.priority = idx; });
            return { ...prev, [category]: arr };
        });
    };

    const handleMoveSlot = (category: string, index: number, direction: 'up' | 'down') => {
        setSlots(prev => {
            const arr = [...prev[category]];
            if (direction === 'up' && index > 0) {
                [arr[index], arr[index - 1]] = [arr[index - 1], arr[index]];
            } else if (direction === 'down' && index < arr.length - 1) {
                [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
            }
            // Re-index priorities
            arr.forEach((s, idx) => { s.priority = idx; });
            return { ...prev, [category]: arr };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Flatten slots array for the API
            const flattenedSlots = Object.values(slots).flat().filter(s => s.managed_key_id);

            const payload = {
                id: engine?.id,
                name,
                description,
                status: "active",
                slots: flattenedSlots
            };

            const url = "/api/superadmin/engines";
            const method = engine ? "PATCH" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to save engine");
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-4xl mx-4 h-[85vh] flex flex-col overflow-hidden rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] shadow-2xl animate-in fade-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--surface-300)] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-[var(--primary)]/10">
                            <Server className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--surface-900)]">
                                {engine ? "Edit Master Engine" : "Create Master Engine"}
                            </h2>
                            <p className="text-sm text-[var(--surface-600)]">
                                Configure provider fallbacks and models
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-[var(--surface-200)] transition-colors"
                    >
                        <X className="w-5 h-5 text-[var(--surface-600)]" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/30 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-[var(--error)]" />
                            <p className="text-sm text-[var(--error)]">{error}</p>
                        </div>
                    )}

                    <form id="engine-form" onSubmit={handleSubmit} className="space-y-8">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--surface-700)] mb-2">
                                    Engine Name *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Enterprise Bundle v2"
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-300)] text-[var(--surface-800)] placeholder:text-[var(--surface-500)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--surface-700)] mb-2">
                                    Description (optional)
                                </label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="High performance configuration for enterprise plans"
                                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-300)] text-[var(--surface-800)] placeholder:text-[var(--surface-500)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all"
                                />
                            </div>
                        </div>

                        <hr className="border-[var(--surface-200)]" />

                        {/* Configuration Tabs */}
                        <div>
                            <h3 className="text-sm font-medium text-[var(--surface-700)] mb-4">
                                Provider Configuration (Priority Ordered)
                            </h3>

                            <Tabs defaultValue="llm" className="w-full">
                                <TabsList className="mb-4">
                                    {CATEGORIES.map(cat => (
                                        <TabsTrigger key={cat.id} value={cat.id} className="gap-2">
                                            <cat.icon className="w-4 h-4" />
                                            {cat.label}
                                            {slots[cat.id]?.length > 0 && (
                                                <span className="ml-1 px-1.5 py-0.5 rounded-md bg-[var(--primary)]/20 text-[var(--primary)] text-xs">
                                                    {slots[cat.id].length}
                                                </span>
                                            )}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>

                                {CATEGORIES.map(categoryObj => {
                                    const catId = categoryObj.id;
                                    const catSlots = slots[catId] || [];

                                    return (
                                        <TabsContent key={catId} value={catId} className="space-y-4">
                                            {catSlots.length === 0 ? (
                                                <div className="p-8 text-center rounded-xl border border-dashed border-[var(--surface-300)] bg-[var(--surface-100)]/50">
                                                    <categoryObj.icon className="w-8 h-8 text-[var(--surface-400)] mx-auto mb-3" />
                                                    <p className="text-[var(--surface-600)] mb-4">No providers configured for {categoryObj.label}</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddSlot(catId)}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--surface-200)] hover:bg-[var(--surface-300)] text-[var(--surface-700)] rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        Add First Provider
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {catSlots.map((slot, index) => {
                                                        const isFirst = index === 0;
                                                        const isLast = index === catSlots.length - 1;

                                                        // Find which provider this key belongs to (to show correct models)
                                                        const keyObj = availableKeys.find(k => k.id === slot.managed_key_id);
                                                        const providerConfigObj = keyObj ? providerConfig[keyObj.provider as keyof typeof providerConfig] : null;

                                                        return (
                                                            <div key={slot.uiKey} className="flex gap-3 items-stretch">
                                                                {/* Up/Down Controls */}
                                                                <div className="flex flex-col rounded-lg overflow-hidden border border-[var(--surface-200)] bg-[var(--surface-100)]">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleMoveSlot(catId, index, 'up')}
                                                                        disabled={isFirst}
                                                                        className="p-1.5 hover:bg-[var(--surface-300)] disabled:opacity-30 disabled:hover:bg-transparent text-[var(--surface-600)] flex-1 flex items-center justify-center transition-colors"
                                                                    >
                                                                        <ArrowUp className="w-4 h-4" />
                                                                    </button>
                                                                    <div className="h-px bg-[var(--surface-200)]" />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleMoveSlot(catId, index, 'down')}
                                                                        disabled={isLast}
                                                                        className="p-1.5 hover:bg-[var(--surface-300)] disabled:opacity-30 disabled:hover:bg-transparent text-[var(--surface-600)] flex-1 flex items-center justify-center transition-colors"
                                                                    >
                                                                        <ArrowDown className="w-4 h-4" />
                                                                    </button>
                                                                </div>

                                                                {/* Main Card */}
                                                                <div className="flex-1 grid grid-cols-12 gap-4 p-4 rounded-xl border border-[var(--surface-200)] bg-[var(--surface-50)]">

                                                                    {/* Key Selection */}
                                                                    <div className="col-span-5">
                                                                        <label className="block text-xs font-medium text-[var(--surface-500)] mb-1.5 uppercase tracking-wider">
                                                                            Provider Key
                                                                        </label>
                                                                        <select
                                                                            value={slot.managed_key_id}
                                                                            onChange={(e) => handleUpdateSlot(catId, index, { managed_key_id: e.target.value })}
                                                                            className="w-full px-3 py-2 rounded-lg bg-[var(--surface-100)] border border-[var(--surface-300)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                                                                        >
                                                                            <option value="" disabled>Select a configured key...</option>
                                                                            {availableKeys.map(k => (
                                                                                <option key={k.id} value={k.id}>
                                                                                    {k.key_name} ({k.provider})
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </div>

                                                                    {/* Model Selection */}
                                                                    <div className="col-span-5">
                                                                        <label className="block text-xs font-medium text-[var(--surface-500)] mb-1.5 uppercase tracking-wider">
                                                                            Default Model
                                                                        </label>
                                                                        <select
                                                                            value={slot.selected_model}
                                                                            onChange={(e) => handleUpdateSlot(catId, index, { selected_model: e.target.value })}
                                                                            disabled={!providerConfigObj}
                                                                            className="w-full px-3 py-2 rounded-lg bg-[var(--surface-100)] border border-[var(--surface-300)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50"
                                                                        >
                                                                            <option value="" disabled>Select model...</option>
                                                                            {providerConfigObj?.models.map((m: AIModel) => (
                                                                                <option key={m.id} value={m.modelId}>
                                                                                    {m.name}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </div>

                                                                    {/* Actions */}
                                                                    <div className="col-span-2 flex items-end justify-end gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleUpdateSlot(catId, index, { is_enabled: !slot.is_enabled })}
                                                                            className={cn(
                                                                                "px-3 py-2 rounded-lg text-sm font-medium transition-colors border",
                                                                                slot.is_enabled
                                                                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                                                    : "bg-[var(--surface-200)] text-[var(--surface-600)] border-[var(--surface-300)]"
                                                                            )}
                                                                        >
                                                                            {slot.is_enabled ? "Enabled" : "Disabled"}
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveSlot(catId, index)}
                                                                            className="p-2 rounded-lg text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}

                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddSlot(catId)}
                                                        className="w-full py-3 mt-2 border-2 border-dashed border-[var(--surface-300)] hover:border-[var(--primary)]/50 rounded-xl text-[var(--surface-600)] hover:text-[var(--primary)] flex items-center justify-center gap-2 transition-colors text-sm font-medium"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        Add Fallback Provider
                                                    </button>
                                                </div>
                                            )}
                                        </TabsContent>
                                    );
                                })}
                            </Tabs>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--surface-300)] bg-[var(--surface-100)] shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl text-[var(--surface-600)] hover:bg-[var(--surface-200)] transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="engine-form"
                        disabled={isLoading || !name.trim()}
                        className="px-6 py-2.5 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        style={{ background: 'var(--gradient-primary)' }}
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {engine ? "Save Changes" : "Create Engine"}
                    </button>
                </div>
            </div>
        </div>
    );
}
