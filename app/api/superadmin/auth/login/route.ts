import { NextRequest, NextResponse } from "next/server";
import { createSession, setSessionCookie } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifySuperadminPassword } from "@/lib/superadmin-password";
import { decideSaaSLoginRole } from "@/lib/saas-rbac";

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        // Service role bypasses RLS to read platform_admins
        const supabase = createServiceRoleClient();

        // Get admin by email from platform_admins
        const { data: admin, error: adminError } = await (supabase
            .from("platform_admins") as any)
            .select("*")
            .eq("email", email.toLowerCase())
            .eq("is_active", true)
            .single();

        if (adminError || !admin) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Check if account is locked
        if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
            return NextResponse.json(
                { error: "Account is temporarily locked. Try again later." },
                { status: 423 }
            );
        }

        // Check password_hash exists
        if (!admin.password_hash) {
            console.error("Superadmin has no password_hash set:", email);
            return NextResponse.json(
                { error: "Account not configured. Contact system administrator." },
                { status: 500 }
            );
        }

        // Verify password against the stored bcrypt hash. Fails closed for any
        // non-bcrypt (legacy) stored value — those rows require a password reset.
        const passwordValid = await verifySuperadminPassword(
            password,
            admin.password_hash
        );

        if (!passwordValid) {
            // Increment failed attempts
            await (supabase
                .from("platform_admins") as any)
                .update({
                    failed_login_attempts: (admin.failed_login_attempts || 0) + 1,
                    locked_until:
                        (admin.failed_login_attempts || 0) >= 4
                            ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
                            : null,
                })
                .eq("id", admin.id);

            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Password matched. SaaS still accepts only its own roles —
        // MOS `scoped` / unknown never receive a cookie.
        const allowedRole = decideSaaSLoginRole(admin.role);
        if (!allowedRole.ok) {
            await (supabase.from("admin_audit_logs") as any).insert({
                admin_id: admin.id,
                admin_email: admin.email,
                action: "auth.login_refused_surface",
                metadata: {
                    reason: "non_saas_role",
                    user_agent: request.headers.get("user-agent"),
                },
                ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
            });
            return NextResponse.json(
                { error: allowedRole.error },
                { status: allowedRole.status }
            );
        }

        // Create session token
        const token = await createSession({
            adminId: admin.id,
            email: admin.email,
            role: allowedRole.role,
            permissions: (admin.permissions as Record<string, boolean>) || {},
        });

        // Update last login and reset failed attempts
        await (supabase
            .from("platform_admins") as any)
            .update({
                last_login_at: new Date().toISOString(),
                failed_login_attempts: 0,
                locked_until: null,
            })
            .eq("id", admin.id);

        // Log the login
        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: admin.id,
            admin_email: admin.email,
            action: "auth.login",
            metadata: {
                user_agent: request.headers.get("user-agent"),
            },
            ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        });

        // Set session cookie
        await setSessionCookie(token);

        return NextResponse.json({
            success: true,
            admin: {
                id: admin.id,
                email: admin.email,
                fullName: admin.full_name,
                role: allowedRole.role,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
