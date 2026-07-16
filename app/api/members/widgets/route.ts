// ============================================================================
// Widget Deployments API — CRUD for embedded chat widgets
// Authenticated endpoint (member dashboard)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ─── GET: List user's widgets ────────────────────────────────────────────────

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await (supabase as any)
            .from("widget_deployments")
            .select(`
                *,
                agent_templates:template_id (
                    id, name, emoji, tagline, category, icon_url
                )
            `)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("[widgets/GET] Error:", error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ widgets: data ?? [] });
    } catch (err: any) {
        console.error("[widgets/GET] Unexpected:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ─── POST: Create a new widget ──────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { template_id, name, widget_type, persistence_mode } = body;

        if (!template_id || !name) {
            return NextResponse.json(
                { error: "template_id and name are required" },
                { status: 400 }
            );
        }

        // Verify user has access to this template
        const { data: agentAccess } = await (supabase.rpc as any)(
            "get_user_accessible_agents",
            { p_user_id: user.id }
        );

        const hasAccess = (agentAccess ?? []).some(
            (a: any) => a.template_id === template_id
        );

        if (!hasAccess) {
            return NextResponse.json(
                { error: "You don't have access to this agent template" },
                { status: 403 }
            );
        }

        // Generate API keys
        const { data: apiKey } = await (supabase.rpc as any)("generate_widget_api_key");
        const { data: secretKey } = await (supabase.rpc as any)("generate_widget_secret_key");

        const insertData: Record<string, any> = {
            user_id: user.id,
            template_id,
            name: name.trim(),
            api_key: apiKey,
            secret_key: secretKey,
            widget_type: widget_type || "bubble",
            persistence_mode: persistence_mode || "user_persistent",
        };

        // Optional fields — only set if provided
        const optionalFields = [
            "welcome_message", "placeholder", "avatar_url",
            "position", "primary_color", "accent_color", "bg_color",
            "text_color", "font_family", "border_radius", "bubble_size",
            "chat_width", "chat_height", "dark_mode", "show_branding",
            "custom_css", "allowed_domains", "rate_limit_rpm",
            "max_tokens", "max_history", "auto_open", "auto_open_delay",
            "sound_enabled", "gate_config", "system_prompt_override",
            "temperature", "model_override", "context_window",
            "prompt_stack", "training_data", "rules", "knowledge_base",
        ];

        for (const field of optionalFields) {
            if (body[field] !== undefined) {
                insertData[field] = body[field];
            }
        }

        const { data: widget, error } = await (supabase as any)
            .from("widget_deployments")
            .insert(insertData)
            .select(`
                *,
                agent_templates:template_id (
                    id, name, emoji, tagline, category, icon_url
                )
            `)
            .single();

        if (error) {
            console.error("[widgets/POST] Insert error:", error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ widget }, { status: 201 });
    } catch (err: any) {
        console.error("[widgets/POST] Unexpected:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ─── PATCH: Update a widget ─────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: "Widget id is required" }, { status: 400 });
        }

        // Remove fields that shouldn't be updated directly
        delete updates.user_id;
        delete updates.api_key;
        delete updates.secret_key;
        delete updates.total_conversations;
        delete updates.total_messages;
        delete updates.total_tokens_used;
        delete updates.created_at;

        const { data: widget, error } = await (supabase as any)
            .from("widget_deployments")
            .update(updates)
            .eq("id", id)
            .eq("user_id", user.id)
            .select(`
                *,
                agent_templates:template_id (
                    id, name, emoji, tagline, category, icon_url
                )
            `)
            .single();

        if (error) {
            console.error("[widgets/PATCH] Update error:", error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!widget) {
            return NextResponse.json({ error: "Widget not found" }, { status: 404 });
        }

        return NextResponse.json({ widget });
    } catch (err: any) {
        console.error("[widgets/PATCH] Unexpected:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ─── DELETE: Remove a widget ────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Widget id is required" }, { status: 400 });
        }

        const { error } = await (supabase as any)
            .from("widget_deployments")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) {
            console.error("[widgets/DELETE] Error:", error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        console.error("[widgets/DELETE] Unexpected:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
