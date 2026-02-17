"use client";

import { useState, useEffect } from "react";

export interface Plan {
    id: string;
    name: string;
    description: string | null;
    price_monthly: number;
    price_yearly: number;
    currency: string;
    max_agents: number;
    max_conversations_per_month: number;
    max_ai_calls_per_month: number;
    max_token_usage_per_month: number;
    max_devices: number;
    features: string[];
    is_active: boolean;
    is_public: boolean;
    display_order: number;
    badge: string | null;
    requires_organization: boolean;
    created_at: string;
    updated_at: string;
}

interface UsePlansOptions {
    /** If true, fetches ALL plans (including inactive) from superadmin endpoint. Default: false */
    includeInactive?: boolean;
    /** If true, only returns active plans. Applied client-side as a convenience filter. Default: false */
    activeOnly?: boolean;
}

/**
 * Shared hook to fetch plans from the database.
 *
 * Usage:
 *   const { plans, loading, error, refetch } = usePlans();          // superadmin: all plans
 *   const { plans, loading } = usePlans({ activeOnly: true });      // superadmin: only active
 *   const { plans, loading } = usePlans({ includeInactive: false }); // public: only active+public
 */
export function usePlans(options: UsePlansOptions = {}) {
    const { includeInactive = true, activeOnly = false } = options;
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPlans = async () => {
        setLoading(true);
        setError(null);
        try {
            // Superadmin endpoint returns all plans; public endpoint filters to active+public
            const endpoint = includeInactive
                ? "/api/superadmin/plans"
                : "/api/members/plans";

            const res = await fetch(endpoint);
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to fetch plans");
                return;
            }

            let fetched: Plan[] = data.plans || [];

            if (activeOnly) {
                fetched = fetched.filter((p) => p.is_active);
            }

            setPlans(fetched);
        } catch {
            setError("Failed to fetch plans");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [includeInactive, activeOnly]);

    return { plans, loading, error, refetch: fetchPlans };
}
