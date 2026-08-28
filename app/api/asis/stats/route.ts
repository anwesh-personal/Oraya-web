// ============================================================================
// API: /api/asis/stats — Aggregated Attestation Statistics
// ============================================================================
// Returns aggregate counts, per-model breakdowns, and last attestation time.
// All computed from asis_attestations table — zero hardcoded values.
// ============================================================================

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const db = supabase as any;

        // Run aggregate queries in parallel
        const [totalRes, validRes, invalidRes, pendingRes, unattestedRes, latestRes, modelsRes] = await Promise.all([
            // Total count
            db
                .from("asis_attestations")
                .select("id", { count: "exact", head: true })
                .eq("user_id", user.id),

            // Verified valid count
            db
                .from("asis_attestations")
                .select("id", { count: "exact", head: true })
                .eq("user_id", user.id)
                .eq("verification_status", "verified_valid"),

            // Verified invalid count
            db
                .from("asis_attestations")
                .select("id", { count: "exact", head: true })
                .eq("user_id", user.id)
                .eq("verification_status", "verified_invalid"),

            // Pending count
            db
                .from("asis_attestations")
                .select("id", { count: "exact", head: true })
                .eq("user_id", user.id)
                .eq("verification_status", "pending"),

            db
                .from("asis_attestations")
                .select("id", { count: "exact", head: true })
                .eq("user_id", user.id)
                .eq("verification_status", "unattested"),

            // Latest attestation timestamp
            db
                .from("asis_attestations")
                .select("created_at")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(1)
                .single(),

            // Distinct models with counts — fetch all and aggregate client-side
            // (Supabase doesn't natively support GROUP BY via PostgREST)
            db
                .from("asis_attestations")
                .select("model_id")
                .eq("user_id", user.id),
        ]);

        // Compute per-model breakdown
        const modelCounts: Record<string, number> = {};
        if (modelsRes.data) {
            for (const row of modelsRes.data) {
                const mid = (row as any).model_id as string;
                modelCounts[mid] = (modelCounts[mid] || 0) + 1;
            }
        }

        const totalCount = totalRes.count ?? 0;
        const validCount = validRes.count ?? 0;
        const invalidCount = invalidRes.count ?? 0;
        const pendingCount = pendingRes.count ?? 0;
        const unattestedCount = unattestedRes.count ?? 0;
        const passRate = totalCount > 0 ? ((validCount / totalCount) * 100) : 0;

        return NextResponse.json({
            success: true,
            kind: "governance_leaves",
            data: {
                total: totalCount,
                verified_valid: validCount,
                verified_invalid: invalidCount,
                pending: pendingCount,
                unattested: unattestedCount,
                pass_rate: Math.round(passRate * 100) / 100,
                last_attestation_at: latestRes.data?.created_at ?? null,
                models: modelCounts,
            },
        });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, error: err?.message || "Internal error" },
            { status: 500 }
        );
    }
}
