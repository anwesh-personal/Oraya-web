import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// ─── GET: Fetch factory memories for a template ─────────────────────────────
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: templateId } = await params;
    const url = new URL(request.url);
    const includeRemoved = url.searchParams.get("include_removed") === "true";

    const supabase = createServiceRoleClient();

    try {
        let query = (supabase
            .from("agent_template_memories") as any)
            .select("*")
            .eq("template_id", templateId);

        // By default, only show active (non-removed) memories
        if (!includeRemoved) {
            query = query.is("version_removed", null).eq("is_active", true);
        }

        const { data: memories, error } = await query
            .order("category", { ascending: true })
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Fetch factory memories error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Also fetch the current factory_version from the template
        const { data: template, error: tplError } = await (supabase
            .from("agent_templates") as any)
            .select("factory_version, factory_published_at")
            .eq("id", templateId)
            .single();

        if (tplError) {
            console.error("Fetch template version error:", tplError);
        }

        return NextResponse.json({
            memories: memories || [],
            factory_version: template?.factory_version ?? 0,
            factory_published_at: template?.factory_published_at ?? null,
        });
    } catch (err: any) {
        console.error("Factory memories API error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── POST: Add a factory memory ──────────────────────────────────────────────
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
    const { category, content, importance, tags, sort_order, is_active } = body;

    if (!category || !content) {
        return NextResponse.json(
            { error: "category and content are required" },
            { status: 400 }
        );
    }

    const validCategories = [
        "personality", "skill", "knowledge", "rule",
        "context", "preference", "example",
    ];
    if (!validCategories.includes(category)) {
        return NextResponse.json(
            { error: `category must be one of: ${validCategories.join(", ")}` },
            { status: 400 }
        );
    }

    if (importance !== undefined && (importance < 0 || importance > 1)) {
        return NextResponse.json(
            { error: "importance must be between 0.0 and 1.0" },
            { status: 400 }
        );
    }

    const supabase = createServiceRoleClient();

    try {
        // Get current factory_version to set version_added
        const { data: template } = await (supabase
            .from("agent_templates") as any)
            .select("factory_version")
            .eq("id", templateId)
            .single();

        const currentVersion = (template?.factory_version ?? 0) + 1; // will be published as next version

        const { data: memory, error } = await (supabase
            .from("agent_template_memories") as any)
            .insert({
                template_id: templateId,
                category,
                content,
                importance: importance ?? 0.7,
                tags: tags || [],
                version_added: currentVersion,
                sort_order: sort_order ?? 0,
                is_active: is_active ?? true,
                created_by: session.adminId,
            })
            .select()
            .single();

        if (error) {
            console.error("Create factory memory error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "create_factory_memory",
            resource_type: "agent_template_memory",
            resource_id: memory.id,
            changes: { template_id: templateId, category, content: content.substring(0, 100) },
        });

        return NextResponse.json({ success: true, memory });
    } catch (err: any) {
        console.error("Create factory memory error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── PATCH: Update a factory memory ──────────────────────────────────────────
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
    const { memory_id, updates } = body;

    if (!memory_id) {
        return NextResponse.json({ error: "memory_id is required" }, { status: 400 });
    }

    if (!updates || Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const allowedFields = ["category", "content", "importance", "tags", "sort_order", "is_active"];
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
        const { data: memory, error } = await (supabase
            .from("agent_template_memories") as any)
            .update(safeUpdates)
            .eq("id", memory_id)
            .eq("template_id", templateId)
            .select()
            .single();

        if (error) {
            console.error("Update factory memory error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "update_factory_memory",
            resource_type: "agent_template_memory",
            resource_id: memory_id,
            changes: { template_id: templateId, ...safeUpdates },
        });

        return NextResponse.json({ success: true, memory });
    } catch (err: any) {
        console.error("Update factory memory error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── DELETE: Soft-delete a factory memory (sets version_removed) ─────────────
// We soft-delete so the OTA patch system knows to remove it from user devices.
// Hard deleting would make it invisible to the patch diff.
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
    const memoryId = url.searchParams.get("memory_id");

    if (!memoryId) {
        return NextResponse.json({ error: "memory_id query param is required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    try {
        // Get current factory version for version_removed tracking
        const { data: template } = await (supabase
            .from("agent_templates") as any)
            .select("factory_version")
            .eq("id", templateId)
            .single();

        const nextVersion = (template?.factory_version ?? 0) + 1;

        // Soft delete: set version_removed and is_active = false
        const { data: memory, error } = await (supabase
            .from("agent_template_memories") as any)
            .update({
                version_removed: nextVersion,
                is_active: false,
            })
            .eq("id", memoryId)
            .eq("template_id", templateId)
            .select()
            .single();

        if (error) {
            console.error("Delete factory memory error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "delete_factory_memory",
            resource_type: "agent_template_memory",
            resource_id: memoryId,
            changes: { template_id: templateId, soft_deleted: true, version_removed: nextVersion },
        });

        return NextResponse.json({ success: true, memory });
    } catch (err: any) {
        console.error("Delete factory memory error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
