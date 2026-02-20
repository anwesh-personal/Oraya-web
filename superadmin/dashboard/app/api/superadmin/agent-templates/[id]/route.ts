import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySuperadminToken } from "@/lib/superadmin-middleware";

const getSupabase = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const authResult = await verifySuperadminToken(request);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: 401 });

    const supabase = getSupabase();
    const { data: template, error } = await supabase
        .from("agent_templates")
        .select("*")
        .eq("id", params.id)
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ template });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const authResult = await verifySuperadminToken(request);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: 401 });

    try {
        const body = await request.json();

        const supabase = getSupabase();
        // Fetch current version
        const { data: current } = await supabase.from("agent_templates").select("version").eq("id", params.id).single();
        const nextVersion = current ? current.version + 1 : 1;

        const { data: template, error } = await supabase
            .from("agent_templates")
            .update({ ...body, version: nextVersion, updated_at: new Date().toISOString() })
            .eq("id", params.id)
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ template });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const authResult = await verifySuperadminToken(request);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: 401 });

    const supabase = getSupabase();
    const { error } = await supabase
        .from("agent_templates")
        .delete()
        .eq("id", params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
