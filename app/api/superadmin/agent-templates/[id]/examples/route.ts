import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// ─── GET: Fetch few-shot examples for a template ─────────────────────────────
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
        const { data: examples, error } = await (supabase
            .from("agent_template_examples") as any)
            .select("*")
            .eq("template_id", templateId)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Fetch examples error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ examples: examples || [] });
    } catch (err: any) {
        console.error("Examples API error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── POST: Add a few-shot example ────────────────────────────────────────────
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
    const { user_input, expected_output, explanation, tags, sort_order, is_active } = body;

    if (!user_input || !expected_output) {
        return NextResponse.json(
            { error: "user_input and expected_output are required" },
            { status: 400 }
        );
    }

    const supabase = createServiceRoleClient();

    try {
        const { data: example, error } = await (supabase
            .from("agent_template_examples") as any)
            .insert({
                template_id: templateId,
                user_input,
                expected_output,
                explanation: explanation || null,
                tags: tags || [],
                sort_order: sort_order ?? 0,
                is_active: is_active ?? true,
                created_by: session.adminId,
            })
            .select()
            .single();

        if (error) {
            console.error("Create example error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "create_template_example",
            resource_type: "agent_template_example",
            resource_id: example.id,
            changes: { template_id: templateId },
        });

        return NextResponse.json({ success: true, example });
    } catch (err: any) {
        console.error("Create example error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── PATCH: Update a few-shot example ────────────────────────────────────────
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
    const { example_id, updates } = body;

    if (!example_id) {
        return NextResponse.json({ error: "example_id is required" }, { status: 400 });
    }

    if (!updates || Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const allowedFields = ["user_input", "expected_output", "explanation", "tags", "sort_order", "is_active"];
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
        const { data: example, error } = await (supabase
            .from("agent_template_examples") as any)
            .update(safeUpdates)
            .eq("id", example_id)
            .eq("template_id", templateId)
            .select()
            .single();

        if (error) {
            console.error("Update example error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "update_template_example",
            resource_type: "agent_template_example",
            resource_id: example_id,
            changes: { template_id: templateId, ...safeUpdates },
        });

        return NextResponse.json({ success: true, example });
    } catch (err: any) {
        console.error("Update example error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── DELETE: Remove a few-shot example ───────────────────────────────────────
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
    const exampleId = url.searchParams.get("example_id");

    if (!exampleId) {
        return NextResponse.json({ error: "example_id query param is required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    try {
        const { error } = await (supabase
            .from("agent_template_examples") as any)
            .delete()
            .eq("id", exampleId)
            .eq("template_id", templateId);

        if (error) {
            console.error("Delete example error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "delete_template_example",
            resource_type: "agent_template_example",
            resource_id: exampleId,
            changes: { template_id: templateId, deleted: true },
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Delete example error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
