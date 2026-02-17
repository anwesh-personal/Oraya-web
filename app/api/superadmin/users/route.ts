import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { PlanEnforcer } from "@/lib/plan-enforcer";

export const dynamic = "force-dynamic";

// ─── GET: List users with profile & license info ─────────────────────────────
export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    try {
        // Get users from auth
        const { data: authUsers, error: authErr } =
            await supabase.auth.admin.listUsers({ perPage: 200 });

        if (authErr) {
            return NextResponse.json({ error: authErr.message }, { status: 500 });
        }

        // Get all licenses
        const { data: licenses } = await (supabase
            .from("user_licenses") as any)
            .select("*")
            .order("created_at", { ascending: false });

        // Get all profiles
        const { data: profiles } = await (supabase
            .from("user_profiles") as any)
            .select("id, full_name, username, avatar_url, account_status, ora_key, created_at");

        // Build lookup maps
        const licenseMap = new Map<string, any>();
        licenses?.forEach((l: any) => licenseMap.set(l.user_id, l));

        const profileMap = new Map<string, any>();
        profiles?.forEach((p: any) => profileMap.set(p.id, p));

        // Merge auth users with profiles and licenses
        const users = (authUsers?.users || []).map((authUser) => {
            const profile = profileMap.get(authUser.id);
            const license = licenseMap.get(authUser.id);
            return {
                id: authUser.id,
                email: authUser.email || "",
                full_name: profile?.full_name || null,
                username: profile?.username || null,
                avatar_url: profile?.avatar_url || null,
                account_status: profile?.account_status || "active",
                ora_key: profile?.ora_key || null,
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

        // Stats
        const totalUsers = authUsers?.users?.length || 0;
        const activeLicenses = licenses?.filter((l: any) => l.status === "active").length || 0;
        const trialUsers = licenses?.filter((l: any) => l.is_trial).length || 0;

        return NextResponse.json({
            users,
            stats: {
                total: totalUsers,
                active: activeLicenses,
                trial: trialUsers,
                churned: licenses?.filter((l: any) => l.status === "cancelled").length || 0,
            },
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── POST: Create a new user ──────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, password, full_name, plan_id, billing_cycle, organization_id } = body;

    if (!email || !password) {
        return NextResponse.json(
            { error: "Email and password are required" },
            { status: 400 }
        );
    }

    const supabase = createServiceRoleClient();

    try {
        // 1. Pre-flight: Validate plan assignment rules BEFORE creating the user
        if (plan_id) {
            const plan = await PlanEnforcer.getPlan(supabase, plan_id);
            if (!plan) {
                return NextResponse.json({ error: `Plan "${plan_id}" does not exist` }, { status: 400 });
            }
            if (!plan.is_active) {
                return NextResponse.json({ error: `Plan "${plan.name}" is not active` }, { status: 400 });
            }
            // If plan requires org, caller MUST provide organization_id
            if (plan.requires_organization && !organization_id) {
                return NextResponse.json(
                    {
                        error: `The "${plan.name}" plan requires organization membership. Select an organization for this user.`,
                        requires_organization: true,
                    },
                    { status: 422 }
                );
            }
        }

        // 2. If adding to an org, check member limit BEFORE creating the user
        if (organization_id) {
            const memberCheck = await PlanEnforcer.canAddMember(supabase, organization_id);
            if (!memberCheck.allowed) {
                return NextResponse.json({ error: memberCheck.reason }, { status: 409 });
            }
        }

        // 3. Create Supabase auth user
        const { data: authData, error: authErr } =
            await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
            });

        if (authErr) {
            return NextResponse.json({ error: authErr.message }, { status: 400 });
        }

        const userId = authData.user.id;

        // 4. Create user profile
        if (full_name) {
            await (supabase.from("user_profiles") as any).upsert({
                id: userId,
                full_name,
                account_status: "active",
                onboarding_completed: true,
            });
        }

        // 5. Create license if plan specified
        let license = null;
        if (plan_id) {
            const { data: licenseData } = await (supabase
                .from("user_licenses") as any)
                .insert({
                    user_id: userId,
                    plan_id: plan_id || "free",
                    status: "active",
                    billing_cycle: billing_cycle || "monthly",
                    activated_at: new Date().toISOString(),
                })
                .select()
                .single();
            license = licenseData;
        }

        // 6. Add user to organization if specified
        if (organization_id) {
            const { error: memberErr } = await (supabase.from("team_members") as any).insert({
                team_id: organization_id,
                user_id: userId,
                role: "member",
                status: "active",
                joined_at: new Date().toISOString(),
            });
            if (memberErr) {
                console.error("Failed to add user to organization:", memberErr);
                // Don't fail the entire creation — user is already created
            }
        }

        // 7. Fetch the auto-generated ORA key from user_profiles
        const { data: profile } = await (supabase
            .from("user_profiles") as any)
            .select("ora_key")
            .eq("id", userId)
            .single();

        const ora_key = profile?.ora_key || null;

        // 8. Audit log
        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "create_user",
            resource_type: "user",
            resource_id: userId,
            changes: { email, full_name, plan_id, organization_id, ora_key },
        });

        return NextResponse.json({
            success: true,
            user: { id: userId, email: authData.user.email, full_name, ora_key },
            license,
            organization_id: organization_id || null,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── PATCH: Update user ───────────────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, updates } = body;

    if (!user_id) {
        return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    try {
        const changes: Record<string, any> = {};

        // Update auth user fields
        if (updates.email || updates.password) {
            const authUpdate: any = {};
            if (updates.email) authUpdate.email = updates.email;
            if (updates.password) authUpdate.password = updates.password;
            await supabase.auth.admin.updateUserById(user_id, authUpdate);
            if (updates.email) changes.email = updates.email;
        }

        // Update profile
        if (updates.full_name !== undefined || updates.username !== undefined) {
            const profileUpdate: any = {};
            if (updates.full_name !== undefined) profileUpdate.full_name = updates.full_name;
            if (updates.username !== undefined) profileUpdate.username = updates.username;
            await (supabase.from("user_profiles") as any)
                .update(profileUpdate)
                .eq("id", user_id);
            Object.assign(changes, profileUpdate);
        }

        // Update license — must handle case where no license row exists
        if (updates.plan_id || updates.license_status || updates.billing_cycle) {
            // Enforce plan assignment rules if changing plan
            if (updates.plan_id) {
                const planCheck = await PlanEnforcer.canAssignPlan(supabase, user_id, updates.plan_id);
                if (!planCheck.allowed) {
                    return NextResponse.json(
                        {
                            error: planCheck.reason,
                            requires_organization: planCheck.details?.requires_organization || false,
                        },
                        { status: 422 }
                    );
                }
            }

            // Check if user already has a license row
            const { data: existingLicense } = await (supabase
                .from("user_licenses") as any)
                .select("id, plan_id, status")
                .eq("user_id", user_id)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (existingLicense) {
                // Update existing license row
                const licenseUpdate: any = {};
                if (updates.plan_id) licenseUpdate.plan_id = updates.plan_id;
                if (updates.license_status) licenseUpdate.status = updates.license_status;
                if (updates.billing_cycle) licenseUpdate.billing_cycle = updates.billing_cycle;
                licenseUpdate.updated_at = new Date().toISOString();

                const { error: licErr } = await (supabase.from("user_licenses") as any)
                    .update(licenseUpdate)
                    .eq("id", existingLicense.id);

                if (licErr) {
                    console.error("License update error:", licErr);
                    // If it's a unique constraint violation (changing plan_id), delete old and insert new
                    if (licErr.code === "23505") {
                        await (supabase.from("user_licenses") as any)
                            .delete()
                            .eq("id", existingLicense.id);
                        await (supabase.from("user_licenses") as any)
                            .insert({
                                user_id,
                                plan_id: updates.plan_id || existingLicense.plan_id,
                                status: updates.license_status || existingLicense.status || "active",
                                billing_cycle: updates.billing_cycle || "monthly",
                                activated_at: new Date().toISOString(),
                            });
                    }
                }
                Object.assign(changes, { plan_id: updates.plan_id, status: updates.license_status });
            } else {
                // No license exists — create one (trigger auto-generates license_key)
                const { error: insertErr } = await (supabase.from("user_licenses") as any)
                    .insert({
                        user_id,
                        plan_id: updates.plan_id || "free",
                        status: updates.license_status || "active",
                        billing_cycle: updates.billing_cycle || "monthly",
                        activated_at: new Date().toISOString(),
                    });

                if (insertErr) {
                    console.error("License insert error:", insertErr);
                }
                Object.assign(changes, { plan_id: updates.plan_id, license_created: true });
            }
        }

        // Audit log
        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
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
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get("user_id");

    if (!userId) {
        return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    try {
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        const { error } = await supabase.auth.admin.deleteUser(userId);
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
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
