"use client";

import { useState, useEffect } from "react";
import { X, Building2, Loader2 } from "lucide-react";

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
    const [planId, setPlanId] = useState("team");
    const [maxMembers, setMaxMembers] = useState(5);
    const [maxAgents, setMaxAgents] = useState(10);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [users, setUsers] = useState<{ id: string; email: string }[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Fetch users for owner picker
            const token = localStorage.getItem("oraya-superadmin-token");
            fetch("/api/superadmin/users", {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((r) => r.json())
                .then((data) => {
                    setUsers(
                        (data.users || []).map((u: any) => ({
                            id: u.id,
                            email: u.email,
                        }))
                    );
                })
                .catch(() => { });
        }
    }, [isOpen]);

    // Auto-generate slug from name
    const handleNameChange = (v: string) => {
        setName(v);
        setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const token = localStorage.getItem("oraya-superadmin-token");
            const response = await fetch("/api/superadmin/organizations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name,
                    slug,
                    description: description || undefined,
                    owner_id: ownerId,
                    plan_id: planId,
                    max_members: maxMembers,
                    max_agents: maxAgents,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Failed to create organization");
            }

            // Reset
            setName("");
            setSlug("");
            setDescription("");
            setOwnerId("");
            setPlanId("team");
            setMaxMembers(5);
            setMaxAgents(10);
            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg mx-4 bg-[var(--surface-50)] border border-[var(--surface-300)] rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--surface-300)]">
                    <div className="flex items-center gap-3">
                        <div
                            className="p-2.5 rounded-xl"
                            style={{
                                background: "var(--gradient-primary)",
                                boxShadow: "0 4px 12px -2px var(--primary-glow)",
                            }}
                        >
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-[var(--surface-900)]">Create Organization</h3>
                            <p className="text-sm text-[var(--surface-500)]">Add a new team/org</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--surface-200)] text-[var(--surface-500)] transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 text-sm text-[var(--error)] bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-xl">
                            {error}
                        </div>
                    )}

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">
                            Organization Name <span className="text-[var(--error)]">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="Acme Corp"
                            className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-all"
                        />
                    </div>

                    {/* Slug */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">
                            Slug <span className="text-[var(--error)]">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={slug}
                            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                            placeholder="acme-corp"
                            className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-all font-mono text-sm"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            placeholder="Optional description..."
                            className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-all resize-none"
                        />
                    </div>

                    {/* Owner */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">
                            Owner <span className="text-[var(--error)]">*</span>
                        </label>
                        <select
                            required
                            value={ownerId}
                            onChange={(e) => setOwnerId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-all"
                        >
                            <option value="">Select a user...</option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>{u.email}</option>
                            ))}
                        </select>
                    </div>

                    {/* Plan + Limits */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">Plan</label>
                            <select
                                value={planId}
                                onChange={(e) => setPlanId(e.target.value)}
                                className="w-full px-3 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all"
                            >
                                <option value="free">Free</option>
                                <option value="pro">Pro</option>
                                <option value="team">Team</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">Max Members</label>
                            <input
                                type="number"
                                min={1}
                                value={maxMembers}
                                onChange={(e) => setMaxMembers(Number(e.target.value))}
                                className="w-full px-3 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">Max Agents</label>
                            <input
                                type="number"
                                min={1}
                                value={maxAgents}
                                onChange={(e) => setMaxAgents(Number(e.target.value))}
                                className="w-full px-3 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--surface-300)]">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-[var(--surface-600)] hover:text-[var(--surface-800)] transition-colors">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-all shadow-lg disabled:opacity-60"
                            style={{ background: "var(--gradient-primary)", boxShadow: "0 4px 20px -4px var(--primary-glow)" }}
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
                            {isLoading ? "Creating..." : "Create Organization"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
