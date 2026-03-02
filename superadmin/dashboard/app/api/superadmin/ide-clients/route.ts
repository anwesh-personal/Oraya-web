import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifySuperadminToken } from "@/lib/superadmin-middleware";

// ─── GET: List all IDE clients ────────────────────────────────────────────────
export async function GET(request: NextRequest) {
    const auth = await verifySuperadminToken(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    try {
        const { data, error } = await supabase
            .from("ide_clients")
            .select("*")
            .order("display_name", { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ clients: data ?? [] });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── POST: Create a new IDE client entry ──────────────────────────────────────
export async function POST(request: NextRequest) {
    const auth = await verifySuperadminToken(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const {
        name,
        display_name,
        description,
        logo_url,
        docs_url,
        mcp_config_hint,
        default_protocols,
        is_active,
    } = body;

    if (!name?.trim() || !display_name?.trim()) {
        return NextResponse.json(
            { error: "name and display_name are required" },
            { status: 400 }
        );
    }

    const supabase = createServiceRoleClient();

    try {
        const { data, error } = await supabase
            .from("ide_clients")
            .insert({
                name: name.trim().toLowerCase(),
                display_name: display_name.trim(),
                description: description?.trim() || null,
                logo_url: logo_url?.trim() || null,
                docs_url: docs_url?.trim() || null,
                mcp_config_hint: mcp_config_hint ?? {},
                default_protocols: default_protocols ?? ["mcp_integration"],
                is_active: is_active ?? true,
                created_by: auth.session!.adminId,
                updated_by: auth.session!.adminId,
            })
            .select()
            .single();

        if (error) {
            if (error.code === "23505") {
                return NextResponse.json(
                    { error: `An IDE client with name '${name}' already exists.` },
                    { status: 409 }
                );
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Audit log
        await supabase.from("admin_audit_logs").insert({
            admin_id: auth.session!.adminId,
            admin_email: auth.session!.email,
            action: "create_ide_client",
            resource_type: "ide_client",
            resource_id: data.id,
            changes: { name, display_name },
        });

        return NextResponse.json({ success: true, client: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── PATCH: Update an IDE client ──────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
    const auth = await verifySuperadminToken(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
        return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const allowed: Record<string, any> = {};
    if (updates.display_name !== undefined) allowed.display_name = updates.display_name;
    if (updates.description !== undefined) allowed.description = updates.description;
    if (updates.logo_url !== undefined) allowed.logo_url = updates.logo_url;
    if (updates.docs_url !== undefined) allowed.docs_url = updates.docs_url;
    if (updates.mcp_config_hint !== undefined) allowed.mcp_config_hint = updates.mcp_config_hint;
    if (updates.default_protocols !== undefined) allowed.default_protocols = updates.default_protocols;
    if (updates.is_active !== undefined) allowed.is_active = updates.is_active;
    allowed.updated_by = auth.session!.adminId;

    try {
        const { error } = await supabase
            .from("ide_clients")
            .update(allowed)
            .eq("id", id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await supabase.from("admin_audit_logs").insert({
            admin_id: auth.session!.adminId,
            admin_email: auth.session!.email,
            action: "update_ide_client",
            resource_type: "ide_client",
            resource_id: id,
            changes: allowed,
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── DELETE: Remove an IDE client ─────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
    const auth = await verifySuperadminToken(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    try {
        const { data: client } = await supabase
            .from("ide_clients")
            .select("name")
            .eq("id", id)
            .single();

        const { error } = await supabase
            .from("ide_clients")
            .delete()
            .eq("id", id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await supabase.from("admin_audit_logs").insert({
            admin_id: auth.session!.adminId,
            admin_email: auth.session!.email,
            action: "delete_ide_client",
            resource_type: "ide_client",
            resource_id: id,
            changes: { name: client?.name },
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
