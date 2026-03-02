"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FeatureFlag {
    id: string;
    feature_key: string;
    feature_name: string;
    description: string | null;
    is_enabled: boolean;
    rollout_percentage: number;
    /** Plan IDs (from the plans table) that have this feature enabled */
    enabled_for_plans: string[];
    /** Specific user UUIDs that have this feature enabled regardless of plan */
    enabled_for_users: string[];
    tags: string[];
    category: string;
    updated_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface FeatureFlagUpdate {
    feature_name?: string;
    description?: string;
    is_enabled?: boolean;
    rollout_percentage?: number;
    enabled_for_plans?: string[];
    enabled_for_users?: string[];
    tags?: string[];
    category?: string;
}

export interface CreateFeatureFlagInput {
    feature_key: string;
    feature_name: string;
    description?: string;
    is_enabled?: boolean;
    rollout_percentage?: number;
    enabled_for_plans?: string[];
    enabled_for_users?: string[];
    tags?: string[];
    category?: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useFeatureFlags — reads and mutates the live feature_flags table.
 *
 * All mutations (toggle, update, create, delete) immediately refetch to ensure
 * the local state reflects the server's truth without manual optimistic updates.
 */
export function useFeatureFlags() {
    const [flags, setFlags] = useState<FeatureFlag[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFlags = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/superadmin/feature-flags");
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? "Failed to fetch feature flags");
                return;
            }
            setFlags(data.flags ?? []);
        } catch {
            setError("Network error — could not load feature flags");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFlags();
    }, [fetchFlags]);

    /**
     * Toggle is_enabled for a single flag.
     */
    const toggleEnabled = useCallback(
        async (flagId: string, currentValue: boolean): Promise<void> => {
            const res = await fetch("/api/superadmin/feature-flags", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    flag_id: flagId,
                    updates: { is_enabled: !currentValue },
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed to toggle flag");
            await fetchFlags();
        },
        [fetchFlags]
    );

    /**
     * Toggle a plan ID in enabled_for_plans for a flag.
     */
    const togglePlan = useCallback(
        async (flagId: string, planId: string, currentPlans: string[]): Promise<void> => {
            const next = currentPlans.includes(planId)
                ? currentPlans.filter((p) => p !== planId)
                : [...currentPlans, planId];

            const res = await fetch("/api/superadmin/feature-flags", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    flag_id: flagId,
                    updates: { enabled_for_plans: next },
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed to update flag plans");
            await fetchFlags();
        },
        [fetchFlags]
    );

    /**
     * Update arbitrary fields on a flag.
     */
    const updateFlag = useCallback(
        async (flagId: string, updates: FeatureFlagUpdate): Promise<void> => {
            const res = await fetch("/api/superadmin/feature-flags", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ flag_id: flagId, updates }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed to update flag");
            await fetchFlags();
        },
        [fetchFlags]
    );

    /**
     * Create a new feature flag.
     */
    const createFlag = useCallback(
        async (input: CreateFeatureFlagInput): Promise<FeatureFlag> => {
            const res = await fetch("/api/superadmin/feature-flags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed to create flag");
            await fetchFlags();
            return data.flag as FeatureFlag;
        },
        [fetchFlags]
    );

    /**
     * Delete a feature flag by ID.
     */
    const deleteFlag = useCallback(
        async (flagId: string): Promise<void> => {
            const res = await fetch(
                `/api/superadmin/feature-flags?flag_id=${encodeURIComponent(flagId)}`,
                { method: "DELETE" }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed to delete flag");
            await fetchFlags();
        },
        [fetchFlags]
    );

    return {
        flags,
        loading,
        error,
        refetch: fetchFlags,
        toggleEnabled,
        togglePlan,
        updateFlag,
        createFlag,
        deleteFlag,
    };
}
