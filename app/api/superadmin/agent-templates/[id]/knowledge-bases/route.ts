import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// ─── GET: Fetch knowledge bases for a template ──────────────────────────────
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
        const { data: knowledgeBases, error } = await (supabase
            .from("agent_template_knowledge_bases") as any)
            .select("*")
            .eq("template_id", templateId)
            .order("name", { ascending: true });

        if (error) {
            console.error("Fetch KBs error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ knowledge_bases: knowledgeBases || [] });
    } catch (err: any) {
        console.error("KBs API error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── POST: Create a knowledge base ──────────────────────────────────────────
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
    const {
        name, description, kb_type,
        source_url, content, file_path, file_size_bytes, mime_type,
        retrieval_strategy, chunk_size, chunk_overlap, max_chunks_per_query, embedding_model,
        is_active,
    } = body;

    if (!name || !kb_type) {
        return NextResponse.json(
            { error: "name and kb_type are required" },
            { status: 400 }
        );
    }

    const validTypes = ["document", "url", "structured", "manual"];
    if (!validTypes.includes(kb_type)) {
        return NextResponse.json(
            { error: `kb_type must be one of: ${validTypes.join(", ")}` },
            { status: 400 }
        );
    }

    // Type-specific validation
    if (kb_type === "url" && !source_url) {
        return NextResponse.json({ error: "source_url is required for 'url' type" }, { status: 400 });
    }
    if (kb_type === "manual" && !content) {
        return NextResponse.json({ error: "content is required for 'manual' type" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    try {
        const { data: kb, error } = await (supabase
            .from("agent_template_knowledge_bases") as any)
            .insert({
                template_id: templateId,
                name,
                description: description || null,
                kb_type,
                source_url: source_url || null,
                content: content || null,
                file_path: file_path || null,
                file_size_bytes: file_size_bytes || null,
                mime_type: mime_type || null,
                retrieval_strategy: retrieval_strategy || "semantic",
                chunk_size: chunk_size ?? 512,
                chunk_overlap: chunk_overlap ?? 64,
                max_chunks_per_query: max_chunks_per_query ?? 5,
                embedding_model: embedding_model || "text-embedding-3-small",
                is_active: is_active ?? true,
                indexing_status: "pending",
                created_by: session.adminId,
            })
            .select()
            .single();

        if (error) {
            console.error("Create KB error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "create_template_kb",
            resource_type: "agent_template_knowledge_base",
            resource_id: kb.id,
            changes: { template_id: templateId, name, kb_type },
        });

        return NextResponse.json({ success: true, knowledge_base: kb });
    } catch (err: any) {
        console.error("Create KB error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── PATCH: Update a knowledge base ─────────────────────────────────────────
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
    const { kb_id, updates } = body;

    if (!kb_id) {
        return NextResponse.json({ error: "kb_id is required" }, { status: 400 });
    }

    if (!updates || Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const allowedFields = [
        "name", "description", "source_url", "content",
        "retrieval_strategy", "chunk_size", "chunk_overlap",
        "max_chunks_per_query", "embedding_model", "is_active",
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

    const supabase = createServiceRoleClient();

    try {
        const { data: kb, error } = await (supabase
            .from("agent_template_knowledge_bases") as any)
            .update(safeUpdates)
            .eq("id", kb_id)
            .eq("template_id", templateId)
            .select()
            .single();

        if (error) {
            console.error("Update KB error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "update_template_kb",
            resource_type: "agent_template_knowledge_base",
            resource_id: kb_id,
            changes: { template_id: templateId, ...safeUpdates },
        });

        return NextResponse.json({ success: true, knowledge_base: kb });
    } catch (err: any) {
        console.error("Update KB error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── DELETE: Remove a knowledge base ────────────────────────────────────────
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
    const kbId = url.searchParams.get("kb_id");

    if (!kbId) {
        return NextResponse.json({ error: "kb_id query param is required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    try {
        const { error } = await (supabase
            .from("agent_template_knowledge_bases") as any)
            .delete()
            .eq("id", kbId)
            .eq("template_id", templateId);

        if (error) {
            console.error("Delete KB error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "delete_template_kb",
            resource_type: "agent_template_knowledge_base",
            resource_id: kbId,
            changes: { template_id: templateId, deleted: true },
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Delete KB error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
