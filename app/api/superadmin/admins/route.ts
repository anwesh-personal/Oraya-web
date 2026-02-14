import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifySuperadminToken } from "@/lib/superadmin-middleware";
import { createHash, randomBytes } from "crypto";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// GET /api/superadmin/admins
// Returns all platform admins (password is never returned)
// ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
    const authResult = await verifySuperadminToken(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    try {
        const { data: admins, error } = await supabase
            .from("platform_admins")
            .select("id, email, name, role, created_at, last_login_at")
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
    const authResult = await verifySuperadminToken(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // Only superadmin role can create other admins
    if (authResult.session?.role !== "superadmin") {
        return NextResponse.json(
            { error: "Only superadmins can create new admins" },
            { status: 403 }
        );
    }

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

        const validRoles = ["super_admin", "admin", "moderator"];
        const adminRole = validRoles.includes(role) ? role : "admin";

        // Check if email already exists
        const { data: existing } = await supabase
            .from("platform_admins")
            .select("id")
            .eq("email", email.toLowerCase().trim())
            .single();

        if (existing) {
            return NextResponse.json(
                { error: "An admin with this email already exists" },
                { status: 409 }
            );
        }

        // Hash password with salt
        const salt = randomBytes(16).toString("hex");
        const passwordHash = createHash("sha256")
            .update(password + salt)
            .digest("hex");

        const { data: newAdmin, error } = await supabase
            .from("platform_admins")
            .insert({
                email: email.toLowerCase().trim(),
                name: name.trim(),
                password_hash: passwordHash,
                salt,
                role: adminRole,
                created_at: new Date().toISOString(),
            })
            .select("id, email, name, role, created_at")
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
    const authResult = await verifySuperadminToken(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    if (authResult.session?.role !== "superadmin") {
        return NextResponse.json(
            { error: "Only superadmins can delete admins" },
            { status: 403 }
        );
    }

    const supabase = createServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "Admin ID is required" }, { status: 400 });
    }

    try {
        // Prevent deleting yourself
        if (id === authResult.session?.adminId) {
            return NextResponse.json(
                { error: "Cannot delete your own account" },
                { status: 400 }
            );
        }

        // Count remaining admins
        const { count } = await supabase
            .from("platform_admins")
            .select("id", { count: "exact", head: true });

        if (count !== null && count <= 1) {
            return NextResponse.json(
                { error: "Cannot delete the last admin" },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from("platform_admins")
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
