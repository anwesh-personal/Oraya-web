import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";


// ─── GET: Fetch all feature flags ────────────────────────────────────────────
export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    try {
        const { data: flags, error } = await (supabase
            .from("feature_flags") as any)
            .select("*")
            .order("category", { ascending: true })
            .order("feature_name", { ascending: true });

        if (error) {
            console.error("[feature-flags] GET error:", error);
            return NextResponse.json({ error: "Failed to fetch feature flags" }, { status: 500 });
        }

        return NextResponse.json({ flags: flags ?? [] });
    } catch (err: any) {
        console.error("[feature-flags] GET exception:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── POST: Create a new feature flag ─────────────────────────────────────────
export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
        feature_key,
        feature_name,
        description,
        is_enabled,
        rollout_percentage,
        enabled_for_plans,
        enabled_for_users,
        tags,
        category,
    } = body;

    if (!feature_key || !feature_name) {
        return NextResponse.json(
            { error: "feature_key and feature_name are required" },
            { status: 400 }
        );
    }

    // Validate key format: lowercase snake_case only
    if (!/^[a-z][a-z0-9_]*$/.test(feature_key)) {
        return NextResponse.json(
            { error: "feature_key must be lowercase snake_case (e.g. my_feature)" },
            { status: 400 }
        );
    }

    const supabase = createServiceRoleClient();

    try {
        const { data: flag, error } = await (supabase
            .from("feature_flags") as any)
            .insert({
                feature_key,
                feature_name,
                description: description ?? null,
                is_enabled: is_enabled ?? false,
                rollout_percentage: rollout_percentage ?? 0,
                enabled_for_plans: enabled_for_plans ?? [],
                enabled_for_users: enabled_for_users ?? [],
                tags: tags ?? [],
                category: category ?? "general",
                updated_by: session.adminId ?? null,
            })
            .select()
            .single();

        if (error) {
            if (error.code === "23505") {
                return NextResponse.json(
                    { error: `Feature flag with key "${feature_key}" already exists` },
                    { status: 409 }
                );
            }
            console.error("[feature-flags] POST error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Audit log
        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "create_feature_flag",
            resource_type: "feature_flag",
            resource_id: flag.id,
            changes: { feature_key, feature_name, is_enabled, enabled_for_plans },
        });

        return NextResponse.json({ success: true, flag });
    } catch (err: any) {
        console.error("[feature-flags] POST exception:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── PATCH: Update an existing feature flag ───────────────────────────────────
export async function PATCH(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { flag_id, updates } = body;

    if (!flag_id) {
        return NextResponse.json({ error: "flag_id is required" }, { status: 400 });
    }
    if (!updates || Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    // Allowlist — only known fields can be patched
    const ALLOWED_FIELDS = [
        "feature_name",
        "description",
        "is_enabled",
        "rollout_percentage",
        "enabled_for_plans",
        "enabled_for_users",
        "tags",
        "category",
    ] as const;

    const safeUpdates: Record<string, unknown> = { updated_by: session.adminId };
    for (const field of ALLOWED_FIELDS) {
        if (field in updates) {
            safeUpdates[field] = updates[field];
        }
    }

    if (Object.keys(safeUpdates).length === 1) {
        // Only updated_by — nothing real to update
        return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    try {
        const { data: flag, error } = await (supabase
            .from("feature_flags") as any)
            .update(safeUpdates)
            .eq("id", flag_id)
            .select()
            .single();

        if (error) {
            console.error("[feature-flags] PATCH error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!flag) {
            return NextResponse.json({ error: "Feature flag not found" }, { status: 404 });
        }

        // Audit log
        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "update_feature_flag",
            resource_type: "feature_flag",
            resource_id: flag_id,
            changes: safeUpdates,
        });

        return NextResponse.json({ success: true, flag });
    } catch (err: any) {
        console.error("[feature-flags] PATCH exception:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── DELETE: Remove a feature flag ───────────────────────────────────────────
export async function DELETE(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const flagId = url.searchParams.get("flag_id");

    if (!flagId) {
        return NextResponse.json({ error: "flag_id is required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    try {
        // Fetch before delete for audit log
        const { data: existing } = await (supabase
            .from("feature_flags") as any)
            .select("feature_key, feature_name")
            .eq("id", flagId)
            .single();

        const { error } = await (supabase
            .from("feature_flags") as any)
            .delete()
            .eq("id", flagId);

        if (error) {
            console.error("[feature-flags] DELETE error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Audit log
        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "delete_feature_flag",
            resource_type: "feature_flag",
            resource_id: flagId,
            changes: existing ?? { deleted: true },
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("[feature-flags] DELETE exception:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
