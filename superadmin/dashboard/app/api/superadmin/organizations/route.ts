import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifySuperadminToken } from "@/lib/superadmin-middleware";

// ─── GET: List organizations (teams) ──────────────────────────────────────────
export async function GET(request: NextRequest) {
    const auth = await verifySuperadminToken(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    try {
        // Get teams with member count
        const { data: teams, error } = await supabase
            .from("teams")
            .select(`
                *,
                members:team_members(count)
            `)
            .order("created_at", { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get owner profiles separately (teams.owner_id -> auth.users, not user_profiles FK)
        const ownerIds = [...new Set((teams || []).map((t) => t.owner_id))];
        let profileMap = new Map<string, any>();
        if (ownerIds.length > 0) {
            const { data: profiles } = await supabase
                .from("user_profiles")
                .select("id, full_name, avatar_url")
                .in("id", ownerIds);
            profiles?.forEach((p) => profileMap.set(p.id, { ...p, email: null }));

            // Get emails from auth
            const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
            authData?.users?.forEach((u) => {
                const existing = profileMap.get(u.id);
                if (existing) {
                    existing.email = u.email;
                } else if (ownerIds.includes(u.id)) {
                    profileMap.set(u.id, { id: u.id, full_name: null, avatar_url: null, email: u.email });
                }
            });
        }

        // Stats
        const total = teams?.length || 0;
        const active = teams?.filter((t) => t.is_active).length || 0;

        // Calculate revenue from team licenses
        const { data: licenses } = await supabase
            .from("user_licenses")
            .select("amount_paid, status")
            .in("user_id", ownerIds.length > 0 ? ownerIds : ["__none__"])
            .eq("status", "active");

        const totalRevenue = licenses?.reduce((sum, l) => sum + (l.amount_paid || 0), 0) || 0;

        // Map to consistent format
        const organizations = (teams || []).map((team) => ({
            id: team.id,
            name: team.name,
            slug: team.slug,
            description: team.description,
            avatar_url: team.avatar_url,
            status: team.is_active ? (team.suspended_at ? "suspended" : "active") : "inactive",
            plan_id: team.plan_id,
            owner: profileMap.get(team.owner_id) || { id: team.owner_id, full_name: null, email: null, avatar_url: null },
            member_count: team.members?.[0]?.count || 0,
            max_members: team.max_members,
            max_agents: team.max_agents,
            created_at: team.created_at,
            updated_at: team.updated_at,
        }));

        return NextResponse.json({
            organizations,
            stats: {
                total,
                active,
                revenue: totalRevenue,
                growth: 0,
            },
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── POST: Create Organization ────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    const auth = await verifySuperadminToken(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, description, owner_id, plan_id, max_members, max_agents } = body;

    if (!name || !slug || !owner_id) {
        return NextResponse.json(
            { error: "name, slug, and owner_id are required" },
            { status: 400 }
        );
    }

    const supabase = createServiceRoleClient();

    try {
        // Check slug uniqueness
        const { data: existing } = await supabase
            .from("teams")
            .select("id")
            .eq("slug", slug)
            .single();

        if (existing) {
            return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
        }

        // Create team
        const { data: team, error: teamErr } = await supabase
            .from("teams")
            .insert({
                name,
                slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                description: description || null,
                owner_id,
                plan_id: plan_id || null,
                max_members: max_members || 5,
                max_agents: max_agents || 10,
                is_active: true,
            })
            .select()
            .single();

        if (teamErr) {
            return NextResponse.json({ error: teamErr.message }, { status: 500 });
        }

        // Add owner as team member with "owner" role
        await supabase.from("team_members").insert({
            team_id: team.id,
            user_id: owner_id,
            role: "owner",
            status: "active",
            can_manage_members: true,
            can_manage_billing: true,
            joined_at: new Date().toISOString(),
        });

        // Audit log
        await supabase.from("admin_audit_logs").insert({
            admin_id: auth.session!.adminId,
            admin_email: auth.session!.email,
            action: "create_organization",
            resource_type: "team",
            resource_id: team.id,
            changes: { name, slug, owner_id, plan_id },
        });

        return NextResponse.json({ success: true, organization: team });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── PATCH: Update Organization ───────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
    const auth = await verifySuperadminToken(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const { org_id, updates } = body;

    if (!org_id) {
        return NextResponse.json({ error: "org_id required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    try {
        const teamUpdate: any = {};
        if (updates.name !== undefined) teamUpdate.name = updates.name;
        if (updates.description !== undefined) teamUpdate.description = updates.description;
        if (updates.plan_id !== undefined) teamUpdate.plan_id = updates.plan_id;
        if (updates.max_members !== undefined) teamUpdate.max_members = updates.max_members;
        if (updates.max_agents !== undefined) teamUpdate.max_agents = updates.max_agents;
        if (updates.is_active !== undefined) teamUpdate.is_active = updates.is_active;

        // Handle suspend / unsuspend
        if (updates.suspend === true) {
            teamUpdate.suspended_at = new Date().toISOString();
            teamUpdate.suspension_reason = updates.suspension_reason || "Suspended by admin";
            teamUpdate.is_active = false;
        } else if (updates.suspend === false) {
            teamUpdate.suspended_at = null;
            teamUpdate.suspension_reason = null;
            teamUpdate.is_active = true;
        }

        const { error } = await supabase
            .from("teams")
            .update(teamUpdate)
            .eq("id", org_id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Audit log
        await supabase.from("admin_audit_logs").insert({
            admin_id: auth.session!.adminId,
            admin_email: auth.session!.email,
            action: "update_organization",
            resource_type: "team",
            resource_id: org_id,
            changes: teamUpdate,
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── DELETE: Delete Organization ──────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
    const auth = await verifySuperadminToken(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const url = new URL(request.url);
    const orgId = url.searchParams.get("org_id");

    if (!orgId) {
        return NextResponse.json({ error: "org_id is required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    try {
        // Get org name for audit
        const { data: team } = await supabase
            .from("teams")
            .select("name")
            .eq("id", orgId)
            .single();

        // Delete (cascades to members, shared agents, etc.)
        const { error } = await supabase
            .from("teams")
            .delete()
            .eq("id", orgId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Audit log
        await supabase.from("admin_audit_logs").insert({
            admin_id: auth.session!.adminId,
            admin_email: auth.session!.email,
            action: "delete_organization",
            resource_type: "team",
            resource_id: orgId,
            changes: { name: team?.name },
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
