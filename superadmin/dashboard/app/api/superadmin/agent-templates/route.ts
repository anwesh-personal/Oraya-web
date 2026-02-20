import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySuperadminToken } from "@/lib/superadmin-middleware";

const getSupabase = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function GET(request: NextRequest) {
    const authResult = await verifySuperadminToken(request);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: 401 });

    const supabase = getSupabase();
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get("activeOnly") === "true";

    let query = supabase.from("agent_templates").select("*").order("name");
    if (activeOnly) {
        query = query.eq("is_active", true);
    }

    const { data: templates, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ templates });
}

export async function POST(request: NextRequest) {
    const authResult = await verifySuperadminToken(request);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: 401 });

    try {
        const body = await request.json();
        const supabase = getSupabase();
        const { name, description, system_prompt, provider_config, voice_config, capabilities, avatar_url, tags } = body;

        const { data: template, error } = await supabase
            .from("agent_templates")
            .insert([
                {
                    name,
                    description,
                    system_prompt,
                    provider_config: provider_config || {},
                    voice_config: voice_config || {},
                    capabilities: capabilities || [],
                    avatar_url,
                    tags: tags || [],
                    is_active: true,
                    version: 1,
                    created_by: authResult.session?.adminId,
                }
            ])
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ template });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
