import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifySuperadminToken } from "@/lib/superadmin-middleware";

// ─── GET: List users with profile & license info ─────────────────────────────
export async function GET(request: NextRequest) {
    const auth = await verifySuperadminToken(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";
    const offset = (page - 1) * limit;

    try {
        // Get users from auth + profiles + licenses
        const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers({
            page,
            perPage: limit,
        });

        if (authErr) {
            return NextResponse.json({ error: authErr.message }, { status: 500 });
        }

        // Get all licenses
        let licenseQuery = supabase
            .from("user_licenses")
            .select("*")
            .order("created_at", { ascending: false });

        if (status && status !== "all") {
            licenseQuery = licenseQuery.eq("status", status);
        }

        const { data: licenses } = await licenseQuery;

        // Get all profiles
        const { data: profiles } = await supabase
            .from("user_profiles")
            .select("id, full_name, username, avatar_url, account_status, created_at");

        // Build lookup maps
        const licenseMap = new Map<string, any>();
        licenses?.forEach((l) => {
            licenseMap.set(l.user_id, l);
        });

        const profileMap = new Map<string, any>();
        profiles?.forEach((p) => {
            profileMap.set(p.id, p);
        });

        // Merge auth users with profiles and licenses
        let users = (authUsers?.users || []).map((authUser) => {
            const profile = profileMap.get(authUser.id);
            const license = licenseMap.get(authUser.id);
            return {
                id: authUser.id,
                email: authUser.email || "",
                full_name: profile?.full_name || null,
                username: profile?.username || null,
                avatar_url: profile?.avatar_url || null,
                account_status: profile?.account_status || "active",
                email_confirmed: !!authUser.email_confirmed_at,
                created_at: authUser.created_at,
                last_sign_in_at: authUser.last_sign_in_at,
                // License
                license_id: license?.id || null,
                plan_id: license?.plan_id || null,
                license_key: license?.license_key || null,
                license_status: license?.status || null,
                billing_cycle: license?.billing_cycle || null,
                ai_calls_used: license?.ai_calls_used || 0,
                tokens_used: license?.tokens_used || 0,
                amount_paid: license?.amount_paid || 0,
            };
        });

        // Apply search filter
        if (search) {
            const q = search.toLowerCase();
            users = users.filter(
                (u) =>
                    u.email.toLowerCase().includes(q) ||
                    u.full_name?.toLowerCase().includes(q) ||
                    u.license_key?.toLowerCase().includes(q)
            );
        }

        // Stats
        const totalUsers = authUsers?.users?.length || 0;
        const activeLicenses = licenses?.filter((l) => l.status === "active").length || 0;
        const trialUsers = licenses?.filter((l) => l.is_trial).length || 0;

        return NextResponse.json({
            users,
            stats: {
                total: totalUsers,
                active: activeLicenses,
                trial: trialUsers,
                churned: licenses?.filter((l) => l.status === "cancelled").length || 0,
            },
            page,
            limit,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── POST: Create a new user ──────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    const auth = await verifySuperadminToken(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const { email, password, full_name, plan_id, billing_cycle } = body;

    if (!email || !password) {
        return NextResponse.json(
            { error: "Email and password are required" },
            { status: 400 }
        );
    }

    const supabase = createServiceRoleClient();

    try {
        // 1. Create Supabase auth user
        const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm for admin-created users
        });

        if (authErr) {
            return NextResponse.json({ error: authErr.message }, { status: 400 });
        }

        const userId = authData.user.id;

        // 2. Create/update user profile
        if (full_name) {
            await supabase.from("user_profiles").upsert({
                id: userId,
                full_name,
                account_status: "active",
                onboarding_completed: true,
            });
        }

        // 3. Create license if plan specified
        let license = null;
        if (plan_id) {
            const { data: licenseData, error: licenseErr } = await supabase
                .from("user_licenses")
                .insert({
                    user_id: userId,
                    plan_id: plan_id || "free",
                    status: "active",
                    billing_cycle: billing_cycle || "monthly",
                    activated_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (licenseErr) {
                console.error("License creation error:", licenseErr);
            }
            license = licenseData;
        }

        // 4. Audit log
        await supabase.from("admin_audit_logs").insert({
            admin_id: auth.session!.adminId,
            admin_email: auth.session!.email,
            action: "create_user",
            resource_type: "user",
            resource_id: userId,
            changes: { email, full_name, plan_id },
        });

        return NextResponse.json({
            success: true,
            user: {
                id: userId,
                email: authData.user.email,
                full_name,
            },
            license,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── PATCH: Update user ───────────────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
    const auth = await verifySuperadminToken(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, updates } = body;

    if (!user_id) {
        return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    try {
        const changes: Record<string, any> = {};

        // Update auth user fields (email, password)
        if (updates.email || updates.password) {
            const authUpdate: any = {};
            if (updates.email) authUpdate.email = updates.email;
            if (updates.password) authUpdate.password = updates.password;
            await supabase.auth.admin.updateUserById(user_id, authUpdate);
            if (updates.email) changes.email = updates.email;
        }

        // Update profile
        if (updates.full_name !== undefined || updates.username !== undefined || updates.avatar_url !== undefined) {
            const profileUpdate: any = {};
            if (updates.full_name !== undefined) profileUpdate.full_name = updates.full_name;
            if (updates.username !== undefined) profileUpdate.username = updates.username;
            if (updates.avatar_url !== undefined) profileUpdate.avatar_url = updates.avatar_url;

            await supabase
                .from("user_profiles")
                .update(profileUpdate)
                .eq("id", user_id);

            Object.assign(changes, profileUpdate);
        }

        // Update license
        if (updates.plan_id || updates.license_status || updates.billing_cycle) {
            const licenseUpdate: any = {};
            if (updates.plan_id) licenseUpdate.plan_id = updates.plan_id;
            if (updates.license_status) licenseUpdate.status = updates.license_status;
            if (updates.billing_cycle) licenseUpdate.billing_cycle = updates.billing_cycle;

            await supabase
                .from("user_licenses")
                .update(licenseUpdate)
                .eq("user_id", user_id);

            Object.assign(changes, licenseUpdate);
        }

        // Audit log
        await supabase.from("admin_audit_logs").insert({
            admin_id: auth.session!.adminId,
            admin_email: auth.session!.email,
            action: "update_user",
            resource_type: "user",
            resource_id: user_id,
            changes,
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── DELETE: Delete user ──────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
    const auth = await verifySuperadminToken(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get("user_id");

    if (!userId) {
        return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    try {
        // Get user email for audit log
        const { data: userData } = await supabase.auth.admin.getUserById(userId);

        // Delete auth user (cascades to profiles, licenses, etc.)
        const { error } = await supabase.auth.admin.deleteUser(userId);
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Audit log
        await supabase.from("admin_audit_logs").insert({
            admin_id: auth.session!.adminId,
            admin_email: auth.session!.email,
            action: "delete_user",
            resource_type: "user",
            resource_id: userId,
            changes: { email: userData?.user?.email },
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
