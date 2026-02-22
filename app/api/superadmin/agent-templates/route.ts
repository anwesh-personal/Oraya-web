import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// ─── GET: Fetch all agent templates (admin sees inactive too) ────────────────
export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    try {
        const { data: templates, error } = await (supabase
            .from("agent_templates") as any)
            .select("*")
            .order("plan_tier", { ascending: true })
            .order("category", { ascending: true })
            .order("name", { ascending: true });

        if (error) {
            console.error("Agent templates fetch error:", error);
            return NextResponse.json({ error: "Failed to fetch agent templates" }, { status: 500 });
        }

        return NextResponse.json({ templates: templates || [] });
    } catch (err: any) {
        console.error("Agent templates API error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── POST: Create a new agent template ───────────────────────────────────────
export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
        name, emoji, role, tagline, description,
        core_prompt, personality_config,
        plan_tier, category, tags,
    } = body;

    if (!name || !core_prompt) {
        return NextResponse.json({ error: "name and core_prompt are required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    try {
        const { data: template, error } = await (supabase
            .from("agent_templates") as any)
            .insert({
                name,
                emoji: emoji || "🤖",
                role: role || "assistant",
                tagline: tagline || null,
                description: description || null,
                core_prompt,
                personality_config: personality_config || {},
                plan_tier: plan_tier || "free",
                category: category || null,
                tags: tags || [],
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            console.error("Agent template create error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Audit log
        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "create_agent_template",
            resource_type: "agent_template",
            resource_id: template.id,
            changes: { name, plan_tier, category },
        });

        return NextResponse.json({ success: true, template });
    } catch (err: any) {
        console.error("Agent template create error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── PATCH: Update an agent template ─────────────────────────────────────────
export async function PATCH(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { template_id, updates } = body;

    if (!template_id) {
        return NextResponse.json({ error: "template_id is required" }, { status: 400 });
    }

    if (!updates || Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    try {
        const allowedFields = [
            "name", "emoji", "role", "tagline", "description",
            "core_prompt", "personality_config",
            "plan_tier", "is_active", "category", "tags", "version",
        ];

        const safeUpdates: Record<string, any> = {};
        for (const key of allowedFields) {
            if (key in updates) {
                safeUpdates[key] = updates[key];
            }
        }

        if (Object.keys(safeUpdates).length === 0) {
            return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
        }

        const { data: template, error } = await (supabase
            .from("agent_templates") as any)
            .update(safeUpdates)
            .eq("id", template_id)
            .select()
            .single();

        if (error) {
            console.error("Agent template update error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Audit log
        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "update_agent_template",
            resource_type: "agent_template",
            resource_id: template_id,
            changes: safeUpdates,
        });

        return NextResponse.json({ success: true, template });
    } catch (err: any) {
        console.error("Agent template update error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── DELETE: Delete an agent template ────────────────────────────────────────
export async function DELETE(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const templateId = url.searchParams.get("template_id");

    if (!templateId) {
        return NextResponse.json({ error: "template_id is required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    try {
        const { error } = await (supabase
            .from("agent_templates") as any)
            .delete()
            .eq("id", templateId);

        if (error) {
            console.error("Agent template delete error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Audit log
        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "delete_agent_template",
            resource_type: "agent_template",
            resource_id: templateId,
            changes: { deleted: true },
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Agent template delete error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
