import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// ─── GET: List users assigned to this template ──────────────────────────────
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: templateId } = await params;
    const supabase = createServiceRoleClient();

    try {
        // Get assignments with user details
        const { data: assignments, error } = await (supabase
            .from("user_agent_assignments") as any)
            .select(`
                id,
                user_id,
                assignment_type,
                is_active,
                assigned_at,
                revoked_at,
                assigned_by,
                config_overrides
            `)
            .eq("template_id", templateId)
            .order("assigned_at", { ascending: false });

        if (error) {
            console.error("Fetch assignments error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Enrich with user info for each assignment
        const enrichedAssignments = [];
        for (const assignment of (assignments || [])) {
            const { data: user } = await (supabase
                .from("profiles") as any)
                .select("id, full_name, email, avatar_url")
                .eq("id", assignment.user_id)
                .single();

            enrichedAssignments.push({
                ...assignment,
                user: user || { id: assignment.user_id, full_name: "Unknown", email: null },
            });
        }

        // Also get installation events for this template
        const { data: events } = await (supabase
            .from("user_agent_events") as any)
            .select("user_id, event_type, device_id, device_name, os_type, app_version, created_at")
            .eq("template_id", templateId)
            .in("event_type", ["install", "uninstall"])
            .order("created_at", { ascending: false })
            .limit(100);

        return NextResponse.json({
            assignments: enrichedAssignments,
            install_events: events || [],
        });
    } catch (err: any) {
        console.error("Assignments API error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── POST: Assign template to user(s) ───────────────────────────────────────
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: templateId } = await params;
    const body = await request.json();
    const { user_ids, assignment_type } = body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
        return NextResponse.json(
            { error: "user_ids (array) is required" },
            { status: 400 }
        );
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
        // Verify template exists
        const { data: template, error: tplError } = await (supabase
            .from("agent_templates") as any)
            .select("id, name")
            .eq("id", templateId)
            .single();

        if (tplError || !template) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        const results = { assigned: 0, skipped: 0, errors: [] as string[] };

        for (const userId of user_ids) {
            const { error } = await (supabase
                .from("user_agent_assignments") as any)
                .upsert(
                    {
                        user_id: userId,
                        template_id: templateId,
                        assigned_by: session.adminId,
                        assignment_type: type,
                        is_active: true,
                        revoked_at: null,
                        revoked_by: null,
                        assigned_at: new Date().toISOString(),
                    },
                    { onConflict: "user_id,template_id" }
                );

            if (error) {
                results.errors.push(`User ${userId}: ${error.message}`);
            } else {
                results.assigned++;
            }
        }

        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "assign_template_to_users",
            resource_type: "user_agent_assignment",
            resource_id: templateId,
            changes: {
                template_name: template.name,
                user_count: user_ids.length,
                assigned: results.assigned,
                type,
            },
        });

        return NextResponse.json({ success: true, ...results });
    } catch (err: any) {
        console.error("Assign template error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── DELETE: Revoke assignment ──────────────────────────────────────────────
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: templateId } = await params;
    const url = new URL(request.url);
    const assignmentId = url.searchParams.get("assignment_id");
    const userId = url.searchParams.get("user_id");

    if (!assignmentId && !userId) {
        return NextResponse.json(
            { error: "assignment_id or user_id query param is required" },
            { status: 400 }
        );
    }

    const supabase = createServiceRoleClient();

    try {
        // Soft revoke: set is_active = false, record who revoked
        let query = (supabase
            .from("user_agent_assignments") as any)
            .update({
                is_active: false,
                revoked_at: new Date().toISOString(),
                revoked_by: session.adminId,
            })
            .eq("template_id", templateId);

        if (assignmentId) {
            query = query.eq("id", assignmentId);
        } else {
            query = query.eq("user_id", userId);
        }

        const { error } = await query;

        if (error) {
            console.error("Revoke assignment error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "revoke_agent_assignment",
            resource_type: "user_agent_assignment",
            resource_id: assignmentId || userId,
            changes: { template_id: templateId, revoked: true },
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Revoke assignment error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
