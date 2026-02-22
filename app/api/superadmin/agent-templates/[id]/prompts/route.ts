import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// ─── GET: Fetch prompt layers for a template ─────────────────────────────────
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
        const { data: prompts, error } = await (supabase
            .from("agent_template_prompts") as any)
            .select("*")
            .eq("template_id", templateId)
            .order("priority", { ascending: true })
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Fetch prompts error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ prompts: prompts || [] });
    } catch (err: any) {
        console.error("Prompts API error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── POST: Add a prompt layer ────────────────────────────────────────────────
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
    const { prompt_type, label, content, priority, is_active } = body;

    if (!prompt_type || !label || !content) {
        return NextResponse.json(
            { error: "prompt_type, label, and content are required" },
            { status: 400 }
        );
    }

    const validTypes = ["system", "guardrail", "output_format", "context_injection"];
    if (!validTypes.includes(prompt_type)) {
        return NextResponse.json(
            { error: `prompt_type must be one of: ${validTypes.join(", ")}` },
            { status: 400 }
        );
    }

    const supabase = createServiceRoleClient();

    try {
        const { data: prompt, error } = await (supabase
            .from("agent_template_prompts") as any)
            .insert({
                template_id: templateId,
                prompt_type,
                label,
                content,
                priority: priority ?? 0,
                is_active: is_active ?? true,
                created_by: session.adminId,
            })
            .select()
            .single();

        if (error) {
            console.error("Create prompt error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "create_template_prompt",
            resource_type: "agent_template_prompt",
            resource_id: prompt.id,
            changes: { template_id: templateId, prompt_type, label },
        });

        return NextResponse.json({ success: true, prompt });
    } catch (err: any) {
        console.error("Create prompt error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── PATCH: Update a prompt layer ────────────────────────────────────────────
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
    const { prompt_id, updates } = body;

    if (!prompt_id) {
        return NextResponse.json({ error: "prompt_id is required" }, { status: 400 });
    }

    if (!updates || Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const allowedFields = ["prompt_type", "label", "content", "priority", "is_active"];
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
        const { data: prompt, error } = await (supabase
            .from("agent_template_prompts") as any)
            .update(safeUpdates)
            .eq("id", prompt_id)
            .eq("template_id", templateId)
            .select()
            .single();

        if (error) {
            console.error("Update prompt error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "update_template_prompt",
            resource_type: "agent_template_prompt",
            resource_id: prompt_id,
            changes: { template_id: templateId, ...safeUpdates },
        });

        return NextResponse.json({ success: true, prompt });
    } catch (err: any) {
        console.error("Update prompt error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── DELETE: Remove a prompt layer ───────────────────────────────────────────
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
    const promptId = url.searchParams.get("prompt_id");

    if (!promptId) {
        return NextResponse.json({ error: "prompt_id query param is required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    try {
        const { error } = await (supabase
            .from("agent_template_prompts") as any)
            .delete()
            .eq("id", promptId)
            .eq("template_id", templateId);

        if (error) {
            console.error("Delete prompt error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "delete_template_prompt",
            resource_type: "agent_template_prompt",
            resource_id: promptId,
            changes: { template_id: templateId, deleted: true },
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Delete prompt error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
