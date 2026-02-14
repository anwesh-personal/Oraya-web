import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// GET /api/members/plans
// Returns all active, public subscription plans.
// ─────────────────────────────────────────────────────────────

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: plans, error } = await (supabase
            .from("plans") as any)
            .select(`
                id,
                name,
                description,
                price_monthly,
                price_yearly,
                currency,
                max_agents,
                max_conversations_per_month,
                max_ai_calls_per_month,
                max_token_usage_per_month,
                max_devices,
                features,
                is_active,
                is_public,
                display_order,
                badge
            `)
            .eq("is_active", true)
            .eq("is_public", true)
            .order("display_order", { ascending: true });

        if (error) {
            console.error("Plans fetch error:", error);
            return NextResponse.json(
                { error: "Failed to fetch plans" },
                { status: 500 }
            );
        }

        return NextResponse.json({ plans: plans || [] });
    } catch (error) {
        console.error("Plans API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
