import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Tables } from "@/lib/database.types";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// GET /api/members/license
// Returns the authenticated user's license info, plan details,
// and device activations.
// ─────────────────────────────────────────────────────────────

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();

        // Verify authentication
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Fetch user profile for ORA Key
        const { data: profile } = await supabase
            .from("user_profiles")
            .select("ora_key")
            .eq("id", user.id)
            .single();

        // Fetch user license with plan details
        const { data: license, error: licenseError } = await (supabase
            .from("user_licenses") as any)
            .select("*")
            .eq("user_id", user.id)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle() as { data: Tables<"user_licenses"> | null; error: any };

        if (licenseError) {
            console.error("License fetch error:", licenseError);
            return NextResponse.json(
                { error: "Failed to fetch license information" },
                { status: 500 }
            );
        }

        // If no license, user is on free plan
        if (!license) {
            return NextResponse.json({
                license: {
                    plan_id: "free",
                    plan_name: "Free",
                    status: "active",
                    license_key: null,
                    ora_key: profile?.ora_key || null,
                    billing_cycle: null,
                    devices: [],
                    usage: {
                        ai_calls_used: 0,
                        tokens_used: 0,
                        conversations_created: 0,
                    },
                },
            });
        }

        // Fetch plan details
        const { data: plan } = await (supabase
            .from("plans") as any)
            .select("name, description, max_agents, max_devices, max_ai_calls_per_month, max_token_usage_per_month, features")
            .eq("id", license.plan_id)
            .single() as { data: Tables<"plans"> | null };

        // Fetch device activations
        const { data: devices } = await (supabase
            .from("license_activations") as any)
            .select(`
                id,
                device_id,
                device_name,
                device_type,
                platform,
                platform_version,
                app_version,
                is_active,
                last_seen_at,
                activated_at,
                deactivated_at
            `)
            .eq("license_id", license.id)
            .order("activated_at", { ascending: false });

        return NextResponse.json({
            license: {
                plan_id: license.plan_id,
                plan_name: plan?.name || license.plan_id,
                status: license.status,
                license_key: license.license_key,
                ora_key: profile?.ora_key || null,
                billing_cycle: license.billing_cycle,
                next_billing_date: license.next_billing_date,
                current_period_start: license.current_period_start,
                current_period_end: license.current_period_end,
                is_trial: license.is_trial,
                trial_ends_at: license.trial_ends_at,
                expires_at: license.expires_at,
                activated_at: license.activated_at,
                plan: plan || null,
                devices: devices || [],
                usage: {
                    ai_calls_used: license.ai_calls_used,
                    tokens_used: license.tokens_used,
                    conversations_created: license.conversations_created,
                    usage_limit_reached: license.usage_limit_reached,
                },
            },
        });
    } catch (error) {
        console.error("License API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
