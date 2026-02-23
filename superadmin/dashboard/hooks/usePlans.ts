"use client";

import { useState, useEffect } from "react";

export interface Plan {
    id: string;
    name: string;
    description: string | null;
    price_monthly: number;
    price_yearly: number;
    price_monthly_byok: number;
    price_yearly_byok: number;
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
    /** If true, only returns active plans. Default: false */
    activeOnly?: boolean;
}

export function usePlans(options: UsePlansOptions = {}) {
    const { includeInactive = true, activeOnly = false } = options;
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPlans = async () => {
        setLoading(true);
        setError(null);
        try {
            // Use the main app's API for plans
            const endpoint = "/api/superadmin/plans";

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
    }, [includeInactive, activeOnly]);

    return { plans, loading, error, refetch: fetchPlans };
}
