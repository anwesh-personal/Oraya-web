import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// ─── GET: All agents for a specific user ────────────────────────────────────
// Returns both:
//   - Assigned agents (from user_agent_assignments, pushed by superadmin)
//   - Installed agents (from user_agent_events, reported by desktop)
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const supabase = createServiceRoleClient();

    try {
        // 1. Current assignments for this user (superadmin-pushed or plan-entitled)
        const { data: assignments, error: assignError } = await (supabase
            .from("user_agent_assignments") as any)
            .select(`
                id,
                template_id,
                assignment_type,
                is_active,
                assigned_at,
                revoked_at,
                config_overrides
            `)
            .eq("user_id", userId)
            .order("assigned_at", { ascending: false });

        if (assignError) {
            console.error("Fetch user assignments error:", assignError);
            return NextResponse.json({ error: assignError.message }, { status: 500 });
        }

        // Enrich assignments with template identity
        const enrichedAssignments = [];
        for (const a of (assignments || [])) {
            const { data: template } = await (supabase
                .from("agent_templates") as any)
                .select("id, name, emoji, role, plan_tier, category")
                .eq("id", a.template_id)
                .single();

            enrichedAssignments.push({
                ...a,
                template: template || { id: a.template_id, name: "Deleted Template" },
            });
        }

        // 2. Installation events from this user's desktop devices
        //    Latest event per (agent_name, template_id) to determine current install state
        const { data: events, error: eventError } = await (supabase
            .from("user_agent_events") as any)
            .select(`
                id,
                template_id,
                agent_name,
                event_type,
                device_id,
                device_name,
                os_type,
                app_version,
                source,
                installed_version,
                created_at
            `)
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(200);

        if (eventError) {
            console.error("Fetch user agent events error:", eventError);
            return NextResponse.json({ error: eventError.message }, { status: 500 });
        }

        // 3. Derive current install state per (agent_name + template_id) from event stream
        //    The most recent event wins — if it's "install" or "update" → currently installed
        const installStateMap = new Map<string, {
            agent_name: string;
            template_id: string | null;
            is_installed: boolean;
            installed_version: number | null;
            device_id: string | null;
            device_name: string | null;
            last_event: string;
            last_seen_at: string;
        }>();

        for (const evt of (events || [])) {
            const key = `${evt.agent_name}::${evt.template_id ?? "custom"}`;
            if (!installStateMap.has(key)) {
                installStateMap.set(key, {
                    agent_name: evt.agent_name,
                    template_id: evt.template_id,
                    is_installed: evt.event_type !== "uninstall",
                    installed_version: evt.installed_version ?? null,
                    device_id: evt.device_id,
                    device_name: evt.device_name,
                    last_event: evt.event_type,
                    last_seen_at: evt.created_at,
                });
            }
        }

        const installed_agents = Array.from(installStateMap.values());

        return NextResponse.json({
            user_id: userId,
            assignments: enrichedAssignments,
            installed_agents,
            raw_events: events || [],
        });
    } catch (err: any) {
        console.error("User agents API error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── POST: Assign an agent template to this specific user ───────────────────
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const body = await request.json();
    const { template_id, assignment_type } = body;

    if (!template_id) {
        return NextResponse.json({ error: "template_id is required" }, { status: 400 });
    }

    const type = assignment_type || "push";
    if (!["push", "entitled"].includes(type)) {
        return NextResponse.json(
            { error: "assignment_type must be 'push' or 'entitled'" },
            { status: 400 }
        );
    }

    const supabase = createServiceRoleClient();

    try {
        // Verify the template exists
        const { data: template, error: tplError } = await (supabase
            .from("agent_templates") as any)
            .select("id, name, emoji")
            .eq("id", template_id)
            .single();

        if (tplError || !template) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        // Upsert the assignment — idempotent; reactivates if previously revoked
        const { data: assignment, error: upsertError } = await (supabase
            .from("user_agent_assignments") as any)
            .upsert(
                {
                    user_id: userId,
                    template_id,
                    assigned_by: session.adminId,
                    assignment_type: type,
                    is_active: true,
                    revoked_at: null,
                    revoked_by: null,
                    assigned_at: new Date().toISOString(),
                },
                { onConflict: "user_id,template_id" }
            )
            .select()
            .single();

        if (upsertError) {
            console.error("Assign agent error:", upsertError);
            return NextResponse.json({ error: upsertError.message }, { status: 500 });
        }

        // Audit log
        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "assign_agent_to_user",
            resource_type: "user_agent_assignment",
            resource_id: assignment?.id,
            changes: {
                user_id: userId,
                template_id,
                template_name: template.name,
                assignment_type: type,
            },
        });

        return NextResponse.json({ success: true, assignment });
    } catch (err: any) {
        console.error("Assign agent to user error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── DELETE: Revoke an assignment from this user ────────────────────────────
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const url = new URL(request.url);
    const templateId = url.searchParams.get("template_id");

    if (!templateId) {
        return NextResponse.json(
            { error: "template_id query param is required" },
            { status: 400 }
        );
    }

    const supabase = createServiceRoleClient();

    try {
        const { error } = await (supabase
            .from("user_agent_assignments") as any)
            .update({
                is_active: false,
                revoked_at: new Date().toISOString(),
                revoked_by: session.adminId,
            })
            .eq("user_id", userId)
            .eq("template_id", templateId);

        if (error) {
            console.error("Revoke user agent assignment error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "revoke_agent_from_user",
            resource_type: "user_agent_assignment",
            resource_id: `${userId}::${templateId}`,
            changes: { user_id: userId, template_id: templateId, revoked: true },
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Revoke user agent error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
