import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

/**
 * Generates a cryptographically secure ORA key in the format ORA-XXXX-XXXX-XXXX-XXXX.
 * Uses Node.js crypto module instead of Math.random() for security.
 */
function generateOraKey(): string {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // 30 chars, no ambiguous 0/O/I/L/1
    const bytes = randomBytes(16); // 16 cryptographically random bytes
    let key = "ORA-";
    let groupCount = 0;

    for (let i = 0; i < 16; i++) {
        key += chars[bytes[i] % chars.length];
        groupCount++;
        if (groupCount === 4 && i < 15) {
            key += "-";
            groupCount = 0;
        }
    }

    return key;
}

/**
 * POST /api/superadmin/users/regenerate-key
 *
 * Regenerates a user's ORA Key.
 * - Generates a new ORA-XXXX-XXXX-XXXX-XXXX key
 * - Old key is revoked
 * - All device activations for the user are deactivated
 * - Returns the new key (shown once to the admin)
 *
 * Body: { user_id: string }
 */
export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
        return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    try {
        // 1. Verify user exists
        const { data: user, error: userErr } = await supabase.auth.admin.getUserById(user_id);
        if (userErr || !user?.user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 2. Get the old key (for audit log)
        const { data: oldProfile } = await (supabase
            .from("user_profiles") as any)
            .select("ora_key")
            .eq("id", user_id)
            .single();

        const oldKey = oldProfile?.ora_key || null;

        // 3. Generate and set new ORA key (retry on unique violation, max 3 attempts)
        let newKey = "";
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            newKey = generateOraKey();
            const { error: updateErr } = await (supabase
                .from("user_profiles") as any)
                .update({ ora_key: newKey, updated_at: new Date().toISOString() })
                .eq("id", user_id);

            if (!updateErr) {
                break; // Success
            }

            if (updateErr.code === "23505") {
                // Unique violation — astronomically unlikely, but retry
                attempts++;
                if (attempts >= maxAttempts) {
                    return NextResponse.json({ error: "Failed to generate unique key after retries" }, { status: 500 });
                }
                continue;
            }

            // Any other error is a hard failure
            console.error("Error updating ORA key:", updateErr);
            return NextResponse.json({ error: updateErr.message }, { status: 500 });
        }

        // 4. Deactivate all device activations for this user
        const { data: deactivated } = await (supabase
            .from("device_activations") as any)
            .update({
                is_active: false,
                deactivated_at: new Date().toISOString(),
                deactivated_reason: "key_regenerated",
            })
            .eq("user_id", user_id)
            .eq("is_active", true)
            .select("id");

        const devicesDeactivated = deactivated?.length || 0;

        // 5. Audit log
        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "regenerate_ora_key",
            resource_type: "user",
            resource_id: user_id,
            changes: {
                old_key_prefix: oldKey ? oldKey.substring(0, 8) + "..." : null,
                new_key_prefix: newKey.substring(0, 8) + "...",
                devices_deactivated: devicesDeactivated,
            },
        });

        return NextResponse.json({
            success: true,
            ora_key: newKey,
            devices_deactivated: devicesDeactivated,
            message: `ORA Key regenerated. ${devicesDeactivated} device(s) deactivated.`,
        });
    } catch (err: any) {
        console.error("Error regenerating ORA key:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
