"use client";

import { useState, useEffect, useRef } from "react";
import {
    X,
    Rocket,
    Users,
    CreditCard,
    Search,
    CheckCircle,
    AlertCircle,
    Loader2,
    Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DeployModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    engine: {
        id: string;
        name: string;
    } | null;
}

interface Plan {
    id: string;
    name: string;
    is_active: boolean;
}

interface UserResult {
    id: string;
    email: string | null;
    full_name: string | null;
    plan_id: string;
}

interface Deployment {
    id: string;
    master_engine_id: string;
    target_type: "plan" | "user";
    target_id: string;
    target_name: string;
    engine_name: string;
    status: string;
    deployed_at: string;
}

export function DeployModal({ isOpen, onClose, onSuccess, engine }: DeployModalProps) {
    const [targetType, setTargetType] = useState<"plan" | "user">("plan");
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedTargetId, setSelectedTargetId] = useState<string>("");
    const [userSearch, setUserSearch] = useState("");
    const [userResults, setUserResults] = useState<UserResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployError, setDeployError] = useState<string | null>(null);
    const [deploySuccess, setDeploySuccess] = useState(false);

    // Existing deployments for this engine
    const [existingDeployments, setExistingDeployments] = useState<Deployment[]>([]);
    const [isLoadingDeployments, setIsLoadingDeployments] = useState(false);

    // Fetch plans on open
    useEffect(() => {
        if (isOpen) {
            fetchPlans();
            if (engine) fetchDeployments();
            // Reset state
            setSelectedTargetId("");
            setUserSearch("");
            setUserResults([]);
            setDeployError(null);
            setDeploySuccess(false);
        }
    }, [isOpen, engine]);

    const fetchPlans = async () => {
        try {
            const res = await fetch("/api/superadmin/plans");
            if (res.ok) {
                const data = await res.json();
                setPlans(data.plans || []);
            }
        } catch (err) {
            console.error("Failed to fetch plans:", err);
        }
    };

    const fetchDeployments = async () => {
        if (!engine) return;
        setIsLoadingDeployments(true);
        try {
            const res = await fetch(`/api/superadmin/engines/deploy?engine_id=${engine.id}`);
            if (res.ok) {
                const data = await res.json();
                setExistingDeployments(data.deployments || []);
            }
        } catch (err) {
            console.error("Failed to fetch deployments:", err);
        } finally {
            setIsLoadingDeployments(false);
        }
    };

    // Debounce timer ref for user search
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const searchUsers = (query: string) => {
        setUserSearch(query);
        if (query.length < 2) {
            setUserResults([]);
            return;
        }

        // Clear previous timer
        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
        }

        // Debounce: wait 300ms before firing the search
        searchTimerRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`/api/superadmin/users/search?q=${encodeURIComponent(query)}&limit=10`);
                if (res.ok) {
                    const data = await res.json();
                    setUserResults(data.users || []);
                }
            } catch (err) {
                console.error("User search failed:", err);
            } finally {
                setIsSearching(false);
            }
        }, 300);
    };

    const handleDeploy = async () => {
        if (!engine || !selectedTargetId) return;

        setIsDeploying(true);
        setDeployError(null);
        setDeploySuccess(false);

        try {
            const res = await fetch("/api/superadmin/engines/deploy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    engine_id: engine.id,
                    target_type: targetType,
                    target_id: selectedTargetId,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setDeployError(data.error || "Deployment failed");
                return;
            }

            setDeploySuccess(true);
            fetchDeployments(); // Refresh list
            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (err: any) {
            setDeployError(err.message || "Deployment failed");
        } finally {
            setIsDeploying(false);
        }
    };

    const handleUndeploy = async (deploymentId: string) => {
        try {
            const res = await fetch(`/api/superadmin/engines/deploy?id=${deploymentId}`, { method: "DELETE" });
            if (res.ok) {
                fetchDeployments();
            }
        } catch (err) {
            console.error("Undeploy failed:", err);
        }
    };

    if (!isOpen || !engine) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-[var(--surface-50)] rounded-2xl border border-[var(--surface-200)] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--surface-200)]">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20">
                            <Rocket className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--surface-900)]">Deploy Engine</h2>
                            <p className="text-sm text-[var(--surface-500)]">{engine.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-[var(--surface-200)] text-[var(--surface-500)] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Target Type Toggle */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-3">Deploy to</label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setTargetType("plan"); setSelectedTargetId(""); }}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl border-2 transition-all font-medium",
                                    targetType === "plan"
                                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-700"
                                        : "border-[var(--surface-200)] text-[var(--surface-500)] hover:border-[var(--surface-300)]"
                                )}
                            >
                                <CreditCard className="w-5 h-5" />
                                Plan
                            </button>
                            <button
                                onClick={() => { setTargetType("user"); setSelectedTargetId(""); }}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl border-2 transition-all font-medium",
                                    targetType === "user"
                                        ? "border-blue-500 bg-blue-500/10 text-blue-700"
                                        : "border-[var(--surface-200)] text-[var(--surface-500)] hover:border-[var(--surface-300)]"
                                )}
                            >
                                <Users className="w-5 h-5" />
                                Individual User
                            </button>
                        </div>
                    </div>

                    {/* Plan Selector */}
                    {targetType === "plan" && (
                        <div>
                            <label className="block text-sm font-medium text-[var(--surface-700)] mb-2">Select Plan</label>
                            <div className="space-y-2">
                                {plans.map((plan) => (
                                    <button
                                        key={plan.id}
                                        onClick={() => setSelectedTargetId(plan.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left",
                                            selectedTargetId === plan.id
                                                ? "border-emerald-500 bg-emerald-500/5"
                                                : "border-[var(--surface-200)] hover:border-[var(--surface-300)]"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <CreditCard className={cn(
                                                "w-4 h-4",
                                                selectedTargetId === plan.id ? "text-emerald-600" : "text-[var(--surface-400)]"
                                            )} />
                                            <div>
                                                <p className="font-medium text-[var(--surface-900)]">{plan.name}</p>
                                                <p className="text-xs text-[var(--surface-500)]">ID: {plan.id}</p>
                                            </div>
                                        </div>
                                        {selectedTargetId === plan.id && (
                                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                                        )}
                                        {!plan.is_active && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                                Inactive
                                            </span>
                                        )}
                                    </button>
                                ))}
                                {plans.length === 0 && (
                                    <p className="text-center py-4 text-[var(--surface-400)] text-sm">No plans found</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* User Search */}
                    {targetType === "user" && (
                        <div>
                            <label className="block text-sm font-medium text-[var(--surface-700)] mb-2">Search User</label>
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--surface-400)]" />
                                <input
                                    type="text"
                                    placeholder="Search by email or name..."
                                    value={userSearch}
                                    onChange={(e) => searchUsers(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                                {isSearching && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--surface-400)] animate-spin" />
                                )}
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {userResults.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => setSelectedTargetId(user.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left",
                                            selectedTargetId === user.id
                                                ? "border-blue-500 bg-blue-500/5"
                                                : "border-[var(--surface-200)] hover:border-[var(--surface-300)]"
                                        )}
                                    >
                                        <div>
                                            <p className="font-medium text-[var(--surface-900)]">
                                                {user.full_name || user.email || "Unknown"}
                                            </p>
                                            <p className="text-xs text-[var(--surface-500)]">{user.email}</p>
                                        </div>
                                        {selectedTargetId === user.id && (
                                            <CheckCircle className="w-5 h-5 text-blue-600" />
                                        )}
                                    </button>
                                ))}
                                {userSearch.length >= 2 && !isSearching && userResults.length === 0 && (
                                    <p className="text-center py-4 text-[var(--surface-400)] text-sm">No users found</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Deploy Button */}
                    <button
                        onClick={handleDeploy}
                        disabled={!selectedTargetId || isDeploying}
                        className={cn(
                            "w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
                            selectedTargetId && !isDeploying
                                ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg hover:shadow-xl"
                                : "bg-[var(--surface-200)] text-[var(--surface-400)] cursor-not-allowed"
                        )}
                    >
                        {isDeploying ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : deploySuccess ? (
                            <CheckCircle className="w-5 h-5" />
                        ) : (
                            <Rocket className="w-5 h-5" />
                        )}
                        {isDeploying ? "Deploying..." : deploySuccess ? "Deployed!" : "Deploy Engine"}
                    </button>

                    {/* Error */}
                    {deployError && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {deployError}
                        </div>
                    )}

                    {/* Existing Deployments */}
                    {existingDeployments.length > 0 && (
                        <div className="border-t border-[var(--surface-200)] pt-6">
                            <h3 className="text-sm font-medium text-[var(--surface-700)] mb-3">
                                Active Deployments ({existingDeployments.length})
                            </h3>
                            <div className="space-y-2">
                                {existingDeployments.map((dep) => (
                                    <div
                                        key={dep.id}
                                        className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-200)]"
                                    >
                                        <div className="flex items-center gap-3">
                                            {dep.target_type === "plan" ? (
                                                <CreditCard className="w-4 h-4 text-emerald-600" />
                                            ) : (
                                                <Users className="w-4 h-4 text-blue-600" />
                                            )}
                                            <div>
                                                <p className="font-medium text-[var(--surface-900)] text-sm">{dep.target_name}</p>
                                                <p className="text-xs text-[var(--surface-500)]">
                                                    {dep.target_type === "plan" ? "Plan" : "User"} •{" "}
                                                    {new Date(dep.deployed_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleUndeploy(dep.id)}
                                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                                            title="Remove deployment"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
