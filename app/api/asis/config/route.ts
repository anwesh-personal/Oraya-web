// ============================================================================
// API: /api/asis/config — ASIS Engine Configuration Read/Write
// ============================================================================
// GET: Fetch all config rows (authenticated read)
// PATCH: Update individual config values (superadmin only via service_role)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/asis/config — Read all engine config rows.
 * Optionally filter by ?category=engine|circuit|crypto|hardware|policy|display
 */
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
        const category = searchParams.get("category");

        // Cast to any — asis_engine_config not in generated database.types.ts yet
        const db = supabase as any;

        let query = db
            .from("asis_engine_config")
            .select("*")
            .order("category")
            .order("config_key");

        if (category) {
            query = query.eq("category", category);
        }

        const { data, error } = await query;

        if (error) {
            console.error("[api/asis/config] Query error:", error.message);
            return NextResponse.json(
                { success: false, error: "Failed to fetch engine config" },
                { status: 500 }
            );
        }

        // Transform into a key-value map for easy frontend consumption
        const configMap: Record<string, any> = {};
        for (const row of data ?? []) {
            configMap[row.config_key] = {
                value: row.config_value,
                label: row.label,
                description: row.description,
                category: row.category,
                is_editable: row.is_editable,
                updated_at: row.updated_at,
            };
        }

        return NextResponse.json({
            success: true,
            claim_kind: "declared_target",
            disclaimer:
                "asis_engine_config values are declared configuration / targets, not achieved certifications. SOC2 / ISO 27001 / NIST mappings are not live attestations.",
            data: {
                config: configMap,
                rows: data ?? [],
            },
        });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, error: err?.message || "Internal error" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/asis/config — Update a single config value.
 * Body: { config_key: string, config_value: any }
 * Requires superadmin role (checked via existing superadmin middleware pattern).
 */
export async function PATCH(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Superadmin check — verify against superadmin_users table
        // Cast to any — superadmin_users and asis_engine_config not in generated types
        const db = supabase as any;

        const { data: adminRow } = await db
            .from("superadmin_users")
            .select("id")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .single();

        if (!adminRow) {
            return NextResponse.json(
                { success: false, error: "Forbidden: superadmin access required" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { config_key, config_value } = body;

        if (!config_key || config_value === undefined) {
            return NextResponse.json(
                { success: false, error: "Missing config_key or config_value" },
                { status: 400 }
            );
        }

        // Check if the config is editable
        const { data: existing } = await db
            .from("asis_engine_config")
            .select("is_editable")
            .eq("config_key", config_key)
            .single();

        if (!existing) {
            return NextResponse.json(
                { success: false, error: `Config key '${config_key}' not found` },
                { status: 404 }
            );
        }

        if (!existing.is_editable) {
            return NextResponse.json(
                { success: false, error: `Config key '${config_key}' is system-managed and cannot be edited` },
                { status: 403 }
            );
        }

        const { data: updated, error: updateError } = await db
            .from("asis_engine_config")
            .update({
                config_value,
                updated_by: user.id,
                updated_at: new Date().toISOString(),
            })
            .eq("config_key", config_key)
            .select()
            .single();

        if (updateError) {
            console.error("[api/asis/config] Update error:", updateError.message);
            return NextResponse.json(
                { success: false, error: "Failed to update config" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: updated,
        });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, error: err?.message || "Internal error" },
            { status: 500 }
        );
    }
}
