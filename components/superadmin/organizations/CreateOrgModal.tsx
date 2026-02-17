"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { usePlans } from "@/hooks/usePlans";

interface CreateOrgModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateOrgModal({ isOpen, onClose, onSuccess }: CreateOrgModalProps) {
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [ownerId, setOwnerId] = useState("");
    const [planId, setPlanId] = useState("");
    const [maxMembers, setMaxMembers] = useState(5);
    const [maxAgents, setMaxAgents] = useState(10);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    const { plans, loading: plansLoading } = usePlans({ activeOnly: true });

    // Auto-generate slug from name
    useEffect(() => {
        setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    }, [name]);

    // Fetch users for owner picker
    useEffect(() => {
        if (!isOpen) return;
        setLoadingUsers(true);
        fetch("/api/superadmin/users")
            .then((res) => res.json())
            .then((data) => setUsers(data.users || []))
            .catch(() => { })
            .finally(() => setLoadingUsers(false));
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name || !slug || !ownerId) {
            setError("Name and owner are required");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/superadmin/organizations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    slug,
                    description: description || undefined,
                    owner_id: ownerId,
                    plan_id: planId || undefined,
                    max_members: maxMembers,
                    max_agents: maxAgents,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to create organization");
                return;
            }

            toast.success(`Organization "${name}" created successfully`);
            // Reset form
            setName("");
            setSlug("");
            setDescription("");
            setOwnerId("");
            setPlanId("");
            setMaxMembers(5);
            setMaxAgents(10);
            onSuccess();
        } catch {
            setError("Network error — please try again");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-[var(--surface-100)] rounded-2xl border border-[var(--surface-300)] shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--surface-300)] sticky top-0 bg-[var(--surface-100)] z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/20">
                            <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-lg font-semibold text-[var(--surface-900)]">Create Organization</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--surface-200)] transition-colors">
                        <X className="w-5 h-5 text-[var(--surface-500)]" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-1">Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Organization"
                            className="w-full px-4 py-2.5 bg-[var(--surface-50)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:border-primary transition-colors"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-1">Slug</label>
                        <div className="flex items-center gap-2">
                            <span className="text-[var(--surface-500)]">/</span>
                            <input
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                                className="flex-1 px-4 py-2.5 bg-[var(--surface-50)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] font-mono text-sm focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description..."
                            rows={2}
                            className="w-full px-4 py-2.5 bg-[var(--surface-50)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:border-primary transition-colors resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-1">Owner *</label>
                        <select
                            value={ownerId}
                            onChange={(e) => setOwnerId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[var(--surface-50)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:border-primary"
                            required
                        >
                            <option value="">
                                {loadingUsers ? "Loading users..." : "Select an owner"}
                            </option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.full_name || u.email} ({u.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-1">Plan</label>
                        <select
                            value={planId}
                            onChange={(e) => setPlanId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[var(--surface-50)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:border-primary"
                            disabled={plansLoading}
                        >
                            <option value="">No Plan</option>
                            {plansLoading ? (
                                <option disabled>Loading plans...</option>
                            ) : (
                                plans.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))
                            )}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--surface-700)] mb-1">Max Members</label>
                            <input
                                type="number"
                                value={maxMembers}
                                onChange={(e) => setMaxMembers(parseInt(e.target.value) || 1)}
                                min={1}
                                className="w-full px-4 py-2.5 bg-[var(--surface-50)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--surface-700)] mb-1">Max Agents</label>
                            <input
                                type="number"
                                value={maxAgents}
                                onChange={(e) => setMaxAgents(parseInt(e.target.value) || 1)}
                                min={1}
                                className="w-full px-4 py-2.5 bg-[var(--surface-50)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-[var(--surface-300)] text-[var(--surface-700)] font-medium hover:bg-[var(--surface-200)] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-medium transition-all disabled:opacity-50"
                            style={{ background: 'var(--gradient-primary)' }}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Organization"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
