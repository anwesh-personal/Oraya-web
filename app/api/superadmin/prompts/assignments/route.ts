import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireSuperadmin } from "@/lib/auth";

// ─── PATCH: Toggle assignment or update priority ─────────────────────────────
export async function PATCH(request: NextRequest) {
    await requireSuperadmin();
    const { id, is_enabled, priority, content_override } = await request.json();

    if (!id) return NextResponse.json({ error: "Assignment ID required" }, { status: 400 });

    const supabase = createServiceRoleClient();
    const updates: Record<string, any> = {};
    if (is_enabled !== undefined) updates.is_enabled = is_enabled;
    if (priority !== undefined) updates.priority = priority;
    if (content_override !== undefined) updates.content_override = content_override;

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data, error } = await (supabase.from("headless_agent_prompt_assignments") as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

// ─── POST: Assign a section to an agent ──────────────────────────────────────
export async function POST(request: NextRequest) {
    await requireSuperadmin();
    const { agent_key, section_id, priority } = await request.json();

    if (!agent_key || !section_id) {
        return NextResponse.json({ error: "agent_key and section_id required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await (supabase.from("headless_agent_prompt_assignments") as any)
        .insert({
            agent_key,
            section_id,
            priority: priority || 100,
            is_enabled: true,
        })
        .select("*, section:headless_prompt_sections(*)")
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
}

// ─── DELETE: Remove assignment ───────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
    await requireSuperadmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Assignment ID required" }, { status: 400 });

    const supabase = createServiceRoleClient();
    const { error } = await (supabase.from("headless_agent_prompt_assignments") as any)
        .delete()
        .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
