import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/superadmin/users/search?q=anwesh&limit=30&offset=0
export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

    const supabase = createServiceRoleClient();

    try {
        // Fetch users from auth (supports limit/offset)
        const { data: authData, error: authErr } =
            await supabase.auth.admin.listUsers({ page: Math.floor(offset / limit) + 1, perPage: limit });
        if (authErr) throw authErr;

        const authUsers = authData?.users || [];

        // Filter by query if provided
        const filtered = q
            ? authUsers.filter(u =>
                (u.email || "").toLowerCase().includes(q.toLowerCase()) ||
                (u.user_metadata?.full_name || "").toLowerCase().includes(q.toLowerCase()))
            : authUsers;

        if (filtered.length === 0) return NextResponse.json({ users: [], total: authData?.total || 0 });

        const ids = filtered.map(u => u.id);

        // Fetch profiles
        const { data: profiles } = await (supabase.from("user_profiles") as any)
            .select("id, full_name, avatar_url")
            .in("id", ids);

        // Fetch plans
        const { data: licenses } = await (supabase.from("user_licenses") as any)
            .select("user_id, plan_id, status")
            .in("user_id", ids)
            .eq("status", "active");

        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
        const licenseMap = new Map((licenses || []).map((l: any) => [l.user_id, l]));

        const users = filtered.map(u => {
            const profile = profileMap.get(u.id) as any;
            const license = licenseMap.get(u.id) as any;
            return {
                id: u.id,
                email: u.email || null,
                full_name: profile?.full_name || u.user_metadata?.full_name || null,
                avatar_url: profile?.avatar_url || null,
                plan_id: license?.plan_id || "standard",
            };
        });

        return NextResponse.json({ users, total: authData?.total || filtered.length });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

