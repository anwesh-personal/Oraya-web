// ============================================================================
// API: /api/asis/attestations/[id] — Single Attestation Fetch
// ============================================================================
// Fetches a single attestation record by UUID for the verification page.
// Public read via RLS policy (asis_attestations_public_verify).
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { success: false, error: "Missing attestation ID" },
                { status: 400 }
            );
        }

        const supabase = await createServerSupabaseClient();

        // Cast to any — asis_attestations not in generated database.types.ts yet
        const { data, error } = await (supabase as any)
            .from("asis_attestations")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !data) {
            return NextResponse.json(
                { success: false, error: "Attestation not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: data,
        });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, error: err?.message || "Internal error" },
            { status: 500 }
        );
    }
}
