import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ─── GET: Fetch agents assigned to the current user ─────────────────────────
// Called by Oraya Desktop on launch to check for pushed agents.
// Returns templates that have been assigned to this user but not yet installed.
// ─────────────────────────────────────────────────────────────────────────────
export async function GET() {
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Get active assignments for this user
        const { data: assignments, error } = await (supabase
            .from("user_agent_assignments") as any)
            .select(`
                id,
                template_id,
                assignment_type,
                assigned_at,
                config_overrides
            `)
            .eq("user_id", user.id)
            .eq("is_active", true);

        if (error) {
            console.error("Fetch assigned agents error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!assignments || assignments.length === 0) {
            return NextResponse.json({ assigned_agents: [] });
        }

        // Fetch full template data for each assignment
        const templateIds = assignments.map((a: any) => a.template_id);
        const { data: templates } = await (supabase
            .from("agent_templates") as any)
            .select("*")
            .in("id", templateIds)
            .eq("is_active", true);

        // Merge assignment + template data
        const assignedAgents = assignments.map((assignment: any) => {
            const template = (templates || []).find((t: any) => t.id === assignment.template_id);
            return {
                ...assignment,
                template: template || null,
            };
        }).filter((a: any) => a.template !== null);

        return NextResponse.json({ assigned_agents: assignedAgents });
    } catch (err: any) {
        console.error("Assigned agents API error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
