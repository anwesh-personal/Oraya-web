import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { hashSuperadminPassword } from "@/lib/superadmin-password";
import {
    createAdminInsertPayload,
    parsePlatformAdminRole,
} from "@/lib/platform-admin-roles";
import { requireSaaSSession } from "@/lib/saas-route-guard";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// GET /api/superadmin/admins
// Returns all platform admins (password is never returned)
// ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
    const auth = await requireSaaSSession("read", request);
    if ("response" in auth) return auth.response;

    const supabase = createServiceRoleClient();

    try {
        const { data: admins, error } = await (supabase
            .from("platform_admins") as any)
            .select("id, email, full_name, role, created_at, last_login_at")
            .order("created_at", { ascending: true });

        if (error) throw error;

        return NextResponse.json({ admins: admins || [] });
    } catch (error) {
        console.error("Error fetching admins:", error);
        return NextResponse.json(
            { error: "Failed to fetch admins" },
            { status: 500 }
        );
    }
}

// ─────────────────────────────────────────────────────────────
// POST /api/superadmin/admins
// Create a new platform admin
// Body: { email, name, password, role }
// ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    const auth = await requireSaaSSession("superadmin", request);
    if ("response" in auth) return auth.response;

    const supabase = createServiceRoleClient();

    try {
        const body = await request.json();
        const { email, name, password, role } = body;

        if (!email || !name || !password) {
            return NextResponse.json(
                { error: "email, name, and password are required" },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters" },
                { status: 400 }
            );
        }

        // Must match the platform_admins.role CHECK constraint (see migration 002).
        // Reject unknown values — never coerce to admin (that over-granted).
        const parsedRole = parsePlatformAdminRole(role);
        if (!parsedRole.ok) {
            return NextResponse.json(
                { error: parsedRole.error },
                { status: parsedRole.status }
            );
        }

        // Check if email already exists
        const { data: existing } = await (supabase
            .from("platform_admins") as any)
            .select("id")
            .eq("email", email.toLowerCase().trim())
            .single();

        if (existing) {
            return NextResponse.json(
                { error: "An admin with this email already exists" },
                { status: 409 }
            );
        }

        // Hash password with bcrypt (cost 12) — the format the login verifier
        // expects. Never SHA256: the table has no salt column and login uses
        // bcrypt compare, so a SHA256 hash could never authenticate.
        const passwordHash = await hashSuperadminPassword(password);

        const { data: newAdmin, error } = await (supabase
            .from("platform_admins") as any)
            .insert({
                ...createAdminInsertPayload({
                    email: email.toLowerCase().trim(),
                    name: name.trim(),
                    passwordHash,
                    role: parsedRole.role,
                }),
                created_at: new Date().toISOString(),
            })
            .select("id, email, full_name, role, created_at")
            .single();

        if (error) throw error;

        return NextResponse.json({ admin: newAdmin }, { status: 201 });
    } catch (error) {
        console.error("Error creating admin:", error);
        return NextResponse.json(
            { error: "Failed to create admin" },
            { status: 500 }
        );
    }
}

// ─────────────────────────────────────────────────────────────
// DELETE /api/superadmin/admins?id=xxx
// Delete a platform admin
// ─────────────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
    const auth = await requireSaaSSession("superadmin", request);
    if ("response" in auth) return auth.response;
    const { session } = auth;

    const supabase = createServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "Admin ID is required" }, { status: 400 });
    }

    try {
        // Prevent deleting yourself
        if (id === session.adminId) {
            return NextResponse.json(
                { error: "Cannot delete your own account" },
                { status: 400 }
            );
        }

        // Count remaining admins
        const { count } = await (supabase
            .from("platform_admins") as any)
            .select("id", { count: "exact", head: true });

        if (count !== null && count <= 1) {
            return NextResponse.json(
                { error: "Cannot delete the last admin" },
                { status: 400 }
            );
        }

        const { error } = await (supabase
            .from("platform_admins") as any)
            .delete()
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ deleted: true });
    } catch (error) {
        console.error("Error deleting admin:", error);
        return NextResponse.json(
            { error: "Failed to delete admin" },
            { status: 500 }
        );
    }
}
