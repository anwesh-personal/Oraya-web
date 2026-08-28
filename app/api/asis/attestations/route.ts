// ============================================================================
// API: /api/asis/attestations — Paginated Attestation Ledger Query
// ============================================================================
// Server-side paginated query against asis_attestations with filters.
// No hardcoded data — everything from Supabase.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
        const modelId = searchParams.get("model_id");
        const status = searchParams.get("status");
        const search = searchParams.get("search");
        const from = searchParams.get("from");
        const to = searchParams.get("to");
        const offset = (page - 1) * limit;

        // Cast to any — asis_attestations not in generated database.types.ts yet
        const db = supabase as any;

        // Build query
        let query = db
            .from("asis_attestations")
            .select("*", { count: "exact" })
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        // Apply filters
        if (modelId) {
            query = query.eq("model_id", modelId);
        }
        if (status) {
            query = query.eq("verification_status", status);
        }
        if (search) {
            // Search across governance_hash, id (text cast), and model_id
            query = query.or(
                `governance_hash.ilike.%${search}%,model_id.ilike.%${search}%,id.eq.${search}`
            );
        }
        if (from) {
            query = query.gte("created_at", from);
        }
        if (to) {
            query = query.lte("created_at", to);
        }

        const { data, count, error } = await query;

        if (error) {
            console.error("[api/asis/attestations] Query error:", error.message);
            return NextResponse.json(
                { success: false, error: "Failed to fetch attestations" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                attestations: data ?? [],
                pagination: {
                    page,
                    limit,
                    total: count ?? 0,
                    total_pages: Math.ceil((count ?? 0) / limit),
                    has_next: offset + limit < (count ?? 0),
                    has_prev: page > 1,
                },
            },
        });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, error: err?.message || "Internal error" },
            { status: 500 }
        );
    }
}
