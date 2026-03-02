"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddIDEClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddIDEClientModal({ isOpen, onClose, onSuccess }: AddIDEClientModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        display_name: "",
        description: "",
        logo_url: "",
        docs_url: "",
        default_protocols: "mcp_integration",
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem("oraya-superadmin-token");
            const protocols = formData.default_protocols.split(",").map((p) => p.trim());

            const response = await fetch("/api/superadmin/ide-clients", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    default_protocols: protocols,
                    mcp_config_hint: {},
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to add IDE client");
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[var(--surface-50)] rounded-2xl shadow-2xl border border-[var(--surface-300)] overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--surface-300)]">
                    <h2 className="text-lg font-semibold text-[var(--surface-900)]">Add IDE Client</h2>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-[var(--surface-500)] hover:text-[var(--surface-800)] hover:bg-[var(--surface-100)] rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-[var(--warning)] bg-[var(--warning)]/10 border border-[var(--warning)]/20 rounded-xl">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--surface-700)] mb-1">
                                Internal Name
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase() })}
                                placeholder="e.g. cursor"
                                className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--surface-900)]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--surface-700)] mb-1">
                                Display Name
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.display_name}
                                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                                placeholder="e.g. Cursor IDE"
                                className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--surface-900)]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--surface-700)] mb-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={2}
                                className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--surface-900)]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--surface-700)] mb-1">
                                Logo URL
                            </label>
                            <input
                                type="url"
                                value={formData.logo_url}
                                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                                placeholder="https://..."
                                className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--surface-900)]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--surface-700)] mb-1">
                                Docs URL
                            </label>
                            <input
                                type="url"
                                value={formData.docs_url}
                                onChange={(e) => setFormData({ ...formData, docs_url: e.target.value })}
                                placeholder="https://..."
                                className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--surface-900)]"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-[var(--surface-300)] mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-sm font-medium text-[var(--surface-700)] hover:bg-[var(--surface-100)] rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all shadow-lg hover:shadow-xl",
                                isLoading ? "opacity-70 cursor-not-allowed" : ""
                            )}
                            style={{ background: "var(--gradient-primary)" }}
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {isLoading ? "Adding..." : "Add Client"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
