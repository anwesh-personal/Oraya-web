"use client";

import { useState, useEffect } from "react";
import { X, Loader2, UserPlus, Copy, Check, Key, Mail, Shield, Building2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { usePlans } from "@/hooks/usePlans";

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface CreatedUser {
    id: string;
    email: string;
    full_name: string | null;
    ora_key: string | null;
}

interface OrgOption {
    id: string;
    name: string;
    slug: string;
    member_count: number;
    max_members: number;
}

export function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [planId, setPlanId] = useState("free");
    const [billingCycle, setBillingCycle] = useState("monthly");
    const [organizationId, setOrganizationId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const { plans, loading: plansLoading } = usePlans({ activeOnly: true });

    // Organizations state — loaded when a plan requiring org is selected
    const [organizations, setOrganizations] = useState<OrgOption[]>([]);
    const [orgsLoading, setOrgsLoading] = useState(false);

    // Success state
    const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);
    const [copiedKey, setCopiedKey] = useState(false);
    const [copiedPassword, setCopiedPassword] = useState(false);

    // Derived: does the selected plan require an organization?
    const selectedPlan = plans.find((p) => p.id === planId);
    const requiresOrg = selectedPlan?.requires_organization || false;

    // Fetch organizations when the user selects a plan that requires one
    useEffect(() => {
        if (!requiresOrg) {
            setOrganizationId("");
            return;
        }
        if (organizations.length > 0) return; // already loaded

        let cancelled = false;
        setOrgsLoading(true);

        fetch("/api/superadmin/organizations")
            .then((res) => res.json())
            .then((data) => {
                if (cancelled) return;
                const orgs: OrgOption[] = (data.organizations || [])
                    .filter((o: any) => o.status === "active")
                    .map((o: any) => ({
                        id: o.id,
                        name: o.name,
                        slug: o.slug,
                        member_count: o.member_count || 0,
                        max_members: o.max_members,
                    }));
                setOrganizations(orgs);
            })
            .catch(() => {
                if (!cancelled) setOrganizations([]);
            })
            .finally(() => {
                if (!cancelled) setOrgsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [requiresOrg, organizations.length]);

    if (!isOpen) return null;

    const handleCopy = async (text: string, type: "key" | "password") => {
        try {
            await navigator.clipboard.writeText(text);
            if (type === "key") {
                setCopiedKey(true);
                setTimeout(() => setCopiedKey(false), 2000);
            } else {
                setCopiedPassword(true);
                setTimeout(() => setCopiedPassword(false), 2000);
            }
        } catch {
            toast.error("Failed to copy");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Email and password are required");
            return;
        }

        // Client-side enforcement: if plan requires org, org must be selected
        if (requiresOrg && !organizationId) {
            setError(`The "${selectedPlan?.name}" plan requires an organization. Select one below.`);
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/superadmin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    password,
                    full_name: fullName || undefined,
                    plan_id: planId || undefined,
                    billing_cycle: billingCycle,
                    organization_id: organizationId || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to create user");
                return;
            }

            // Show success state with ORA key
            setCreatedUser({
                id: data.user.id,
                email: data.user.email,
                full_name: data.user.full_name,
                ora_key: data.user.ora_key,
            });
        } catch {
            setError("Network error — please try again");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDone = () => {
        // Reset everything
        setEmail("");
        setPassword("");
        setFullName("");
        setPlanId("free");
        setBillingCycle("monthly");
        setOrganizationId("");
        setCreatedUser(null);
        setCopiedKey(false);
        setCopiedPassword(false);
        onSuccess();
    };

    const handleClose = () => {
        if (createdUser) {
            handleDone();
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-[var(--surface-50)] rounded-2xl border border-[var(--surface-200)] shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[var(--surface-200)] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-[var(--primary)]/20">
                            <UserPlus className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <h2 className="text-lg font-semibold text-[var(--surface-900)]">
                            {createdUser ? "User Created" : "Create New User"}
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg hover:bg-[var(--surface-200)] transition-colors"
                    >
                        <X className="w-5 h-5 text-[var(--surface-500)]" />
                    </button>
                </div>

                {createdUser ? (
                    /* ── Success State ── */
                    <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
                        {/* Success Banner */}
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                                <Check className="w-6 h-6 text-emerald-500" />
                            </div>
                            <p className="text-sm font-medium text-[var(--surface-900)]">
                                User <strong>{createdUser.email}</strong> created successfully
                            </p>
                        </div>

                        {/* ORA Key — Prominent Display */}
                        {createdUser.ora_key && (
                            <div className="rounded-2xl border-2 border-[var(--primary)]/30 bg-[var(--primary)]/5 p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Key className="w-4 h-4 text-[var(--primary)]" />
                                    <p className="text-sm font-semibold text-[var(--primary)]">ORA Key</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <code className="flex-1 px-4 py-3 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-base sm:text-lg font-mono font-bold text-[var(--surface-900)] tracking-wider text-center select-all">
                                        {createdUser.ora_key}
                                    </code>
                                    <button
                                        onClick={() => handleCopy(createdUser.ora_key!, "key")}
                                        className="p-3 rounded-xl border border-[var(--surface-300)] hover:bg-[var(--surface-200)] transition-colors shrink-0"
                                        title="Copy ORA Key"
                                    >
                                        {copiedKey ? (
                                            <Check className="w-5 h-5 text-emerald-500" />
                                        ) : (
                                            <Copy className="w-5 h-5 text-[var(--surface-600)]" />
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-[var(--surface-500)] mt-3">
                                    This is the user&apos;s device activation key and API credential. Share it securely.
                                </p>
                            </div>
                        )}

                        {/* Credentials Summary */}
                        <div className="rounded-2xl bg-[var(--surface-100)] border border-[var(--surface-200)] p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-[var(--surface-500)]" />
                                    <span className="text-sm text-[var(--surface-600)]">Email</span>
                                </div>
                                <span className="text-sm font-medium text-[var(--surface-900)]">{createdUser.email}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-[var(--surface-500)]" />
                                    <span className="text-sm text-[var(--surface-600)]">Password</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <code className="text-sm font-mono text-[var(--surface-900)]">
                                        {password ? "••••••••" : "—"}
                                    </code>
                                    {password && (
                                        <button
                                            onClick={() => handleCopy(password, "password")}
                                            className="p-1.5 rounded-lg hover:bg-[var(--surface-200)] transition-colors"
                                            title="Copy password"
                                        >
                                            {copiedPassword ? (
                                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                            ) : (
                                                <Copy className="w-3.5 h-3.5 text-[var(--surface-500)]" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[var(--surface-600)]">Plan</span>
                                <span className="text-sm font-medium text-[var(--surface-900)] capitalize">{planId || "None"}</span>
                            </div>
                            {organizationId && (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-[var(--surface-500)]" />
                                        <span className="text-sm text-[var(--surface-600)]">Organization</span>
                                    </div>
                                    <span className="text-sm font-medium text-[var(--surface-900)]">
                                        {organizations.find((o) => o.id === organizationId)?.name || organizationId}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Done Button */}
                        <button
                            onClick={handleDone}
                            className="w-full py-3 rounded-xl text-white font-medium transition-all shadow-lg"
                            style={{ background: 'var(--gradient-primary)' }}
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    /* ── Create Form ── */
                    <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
                        {error && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">Email *</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="user@example.com"
                                className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-colors"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">Password *</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Minimum 8 characters"
                                className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-colors"
                                required
                                minLength={8}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">Full Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="John Doe"
                                className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-colors"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">Plan</label>
                                <select
                                    value={planId}
                                    onChange={(e) => setPlanId(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                                    disabled={plansLoading}
                                >
                                    <option value="">No Plan</option>
                                    {plansLoading ? (
                                        <option disabled>Loading plans...</option>
                                    ) : (
                                        plans.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}{p.requires_organization ? " (Org Required)" : ""}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">Billing Cycle</label>
                                <select
                                    value={billingCycle}
                                    onChange={(e) => setBillingCycle(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>
                        </div>

                        {/* ── Organization Picker (shows when plan requires org) ── */}
                        {requiresOrg && (
                            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-blue-400" />
                                    <span className="text-sm font-semibold text-[var(--surface-900)]">
                                        Organization Required
                                    </span>
                                </div>
                                <p className="text-xs text-[var(--surface-500)]">
                                    The <strong>{selectedPlan?.name}</strong> plan requires organization membership.
                                    Select an existing organization for this user.
                                </p>
                                <select
                                    value={organizationId}
                                    onChange={(e) => setOrganizationId(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                    disabled={orgsLoading}
                                    required
                                >
                                    <option value="">
                                        {orgsLoading ? "Loading organizations..." : "Select an organization..."}
                                    </option>
                                    {organizations.map((org) => (
                                        <option key={org.id} value={org.id}>
                                            {org.name} ({org.member_count}/{org.max_members === -1 ? "∞" : org.max_members} members)
                                        </option>
                                    ))}
                                </select>
                                {organizations.length === 0 && !orgsLoading && (
                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                                        <p className="text-xs text-amber-600">
                                            No active organizations found. Create an organization first before assigning
                                            a team/enterprise plan.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

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
                                disabled={isSubmitting || (requiresOrg && !organizationId)}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-medium transition-all disabled:opacity-50 shadow-lg"
                                style={{ background: 'var(--gradient-primary)' }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create User"
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
