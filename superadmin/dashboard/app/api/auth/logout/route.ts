import { NextResponse } from "next/server";
import { clearSession, getSession } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST() {
    try {
        const session = await getSession();

        if (session) {
            // Log the logout
            const supabase = createServiceRoleClient();
            await supabase.from("admin_audit_logs").insert({
                admin_id: session.adminId,
                admin_email: session.email,
                action: "auth.logout",
            });
        }

        await clearSession();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
