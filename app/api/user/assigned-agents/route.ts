import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ─── GET /api/user/assigned-agents ───────────────────────────────────────────
// Returns all agent templates accessible to the authenticated user, via:
//   1. Plan-based entitlement (hierarchical: enterprise ⊇ team ⊇ pro ⊇ free)
//   2. Explicit superadmin assignment (push)
//
// Both sources are unified by the `get_user_accessible_agents` Postgres
// function (migration 024). Explicit assignments take priority when a template
// is available through both channels.
// ─────────────────────────────────────────────────────────────────────────────
export async function GET() {
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { data, error } = await (supabase.rpc as any)(
            "get_user_accessible_agents",
            { p_user_id: user.id }
        );

        if (error) {
            console.error("[assigned-agents] RPC error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Reshape the flat RPC result into the AssignedAgent shape the frontend expects
        const assigned_agents = (data ?? []).map((row: any) => ({
            id: row.assignment_id ?? row.template_id, // entitled rows have no assignment row
            template_id: row.template_id,
            assignment_type: row.assignment_type,
            assigned_at: row.assigned_at,
            config_overrides: row.config_overrides ?? {},
            template: {
                id: row.template_id,
                name: row.template_name,
                emoji: row.template_emoji,
                description: row.template_description,
                icon_url: null,
                category: row.template_category,
                factory_version: row.factory_version,
                factory_published_at: row.factory_published_at,
                plan_tier: row.template_plan_tier,
                version: row.template_version,
                tags: row.template_tags ?? [],
            },
        }));

        return NextResponse.json({ assigned_agents });
    } catch (err: any) {
        console.error("[assigned-agents] Unexpected error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
