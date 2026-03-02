import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireSuperadmin } from "@/lib/auth";

// ─── PATCH: Update section content ───────────────────────────────────────────
export async function PATCH(request: NextRequest) {
    await requireSuperadmin();
    const { id, content, name, category, description, is_active } = await request.json();

    if (!id) return NextResponse.json({ error: "Section ID required" }, { status: 400 });

    const supabase = createServiceRoleClient();
    const updates: Record<string, any> = {};
    if (content !== undefined) updates.content = content;
    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (description !== undefined) updates.description = description;
    if (is_active !== undefined) updates.is_active = is_active;

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data, error } = await (supabase.from("headless_prompt_sections") as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

// ─── POST: Create a new section ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
    await requireSuperadmin();
    const { name, slug, category, content, description } = await request.json();

    if (!name || !slug) return NextResponse.json({ error: "Name and slug required" }, { status: 400 });

    const supabase = createServiceRoleClient();
    const { data, error } = await (supabase.from("headless_prompt_sections") as any)
        .insert({
            name,
            slug,
            category: category || "general",
            content: content || "",
            description: description || null,
            is_active: true,
            is_system: false,
        })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
}

// ─── DELETE: Remove a section (non-system only) ──────────────────────────────
export async function DELETE(request: NextRequest) {
    await requireSuperadmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Section ID required" }, { status: 400 });

    const supabase = createServiceRoleClient();

    // Check if it's a system section
    const { data: section } = await (supabase.from("headless_prompt_sections") as any)
        .select("is_system")
        .eq("id", id)
        .single();

    if (section?.is_system) {
        return NextResponse.json({ error: "Cannot delete system sections" }, { status: 403 });
    }

    const { error } = await (supabase.from("headless_prompt_sections") as any)
        .delete()
        .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
