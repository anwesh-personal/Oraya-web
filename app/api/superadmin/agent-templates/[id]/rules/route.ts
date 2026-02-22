import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// ─── GET: Fetch behavioral rules for a template ─────────────────────────────
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
        const { data: rules, error } = await (supabase
            .from("agent_template_rules") as any)
            .select("*")
            .eq("template_id", templateId)
            .order("rule_type", { ascending: true })
            .order("severity", { ascending: true })
            .order("sort_order", { ascending: true });

        if (error) {
            console.error("Fetch rules error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ rules: rules || [] });
    } catch (err: any) {
        console.error("Rules API error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── POST: Add a behavioral rule ─────────────────────────────────────────────
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
    const { rule_type, content, category, severity, sort_order, is_active } = body;

    if (!rule_type || !content) {
        return NextResponse.json(
            { error: "rule_type and content are required" },
            { status: 400 }
        );
    }

    const validTypes = ["must_do", "must_not", "prefer", "avoid"];
    if (!validTypes.includes(rule_type)) {
        return NextResponse.json(
            { error: `rule_type must be one of: ${validTypes.join(", ")}` },
            { status: 400 }
        );
    }

    const validSeverities = ["critical", "important", "suggestion"];
    if (severity && !validSeverities.includes(severity)) {
        return NextResponse.json(
            { error: `severity must be one of: ${validSeverities.join(", ")}` },
            { status: 400 }
        );
    }

    const supabase = createServiceRoleClient();

    try {
        const { data: rule, error } = await (supabase
            .from("agent_template_rules") as any)
            .insert({
                template_id: templateId,
                rule_type,
                content,
                category: category || null,
                severity: severity || "important",
                sort_order: sort_order ?? 0,
                is_active: is_active ?? true,
                created_by: session.adminId,
            })
            .select()
            .single();

        if (error) {
            console.error("Create rule error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "create_template_rule",
            resource_type: "agent_template_rule",
            resource_id: rule.id,
            changes: { template_id: templateId, rule_type, severity },
        });

        return NextResponse.json({ success: true, rule });
    } catch (err: any) {
        console.error("Create rule error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── PATCH: Update a behavioral rule ─────────────────────────────────────────
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: templateId } = await params;
    const body = await request.json();
    const { rule_id, updates } = body;

    if (!rule_id) {
        return NextResponse.json({ error: "rule_id is required" }, { status: 400 });
    }

    if (!updates || Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const allowedFields = ["rule_type", "content", "category", "severity", "sort_order", "is_active"];
    const safeUpdates: Record<string, any> = {};
    for (const key of allowedFields) {
        if (key in updates) {
            safeUpdates[key] = updates[key];
        }
    }

    if (Object.keys(safeUpdates).length === 0) {
        return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    try {
        const { data: rule, error } = await (supabase
            .from("agent_template_rules") as any)
            .update(safeUpdates)
            .eq("id", rule_id)
            .eq("template_id", templateId)
            .select()
            .single();

        if (error) {
            console.error("Update rule error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "update_template_rule",
            resource_type: "agent_template_rule",
            resource_id: rule_id,
            changes: { template_id: templateId, ...safeUpdates },
        });

        return NextResponse.json({ success: true, rule });
    } catch (err: any) {
        console.error("Update rule error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── DELETE: Remove a behavioral rule ────────────────────────────────────────
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
    const ruleId = url.searchParams.get("rule_id");

    if (!ruleId) {
        return NextResponse.json({ error: "rule_id query param is required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    try {
        const { error } = await (supabase
            .from("agent_template_rules") as any)
            .delete()
            .eq("id", ruleId)
            .eq("template_id", templateId);

        if (error) {
            console.error("Delete rule error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "delete_template_rule",
            resource_type: "agent_template_rule",
            resource_id: ruleId,
            changes: { template_id: templateId, deleted: true },
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Delete rule error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
