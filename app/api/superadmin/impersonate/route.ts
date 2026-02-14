import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

/**
 * POST /api/superadmin/impersonate
 * 
 * Allows a superadmin to generate a magic link to impersonate any member.
 * Uses Supabase Admin API to generate a link for the target user.
 * 
 * Required: Active superadmin session
 * Body: { userId: string }
 */
export async function POST(request: NextRequest) {
    try {
        // Verify superadmin session
        const session = await getSession();
        if (!session || session.role !== "superadmin") {
            return NextResponse.json(
                { error: "Unauthorized — superadmin access required" },
                { status: 403 }
            );
        }

        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: "userId is required" },
                { status: 400 }
            );
        }

        const supabase = createServiceRoleClient();

        // Get the user to verify they exist
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

        if (userError || !userData?.user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Generate a magic link for impersonation
        // This creates a one-time login link for the target user
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: "magiclink",
            email: userData.user.email!,
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`,
            },
        });

        if (linkError || !linkData) {
            console.error("Failed to generate impersonation link:", linkError);
            return NextResponse.json(
                { error: "Failed to generate login link" },
                { status: 500 }
            );
        }

        // The generated link contains the token — extract it and build the auth callback URL
        // linkData.properties contains hashed_token, verification_type, etc.
        const token = linkData.properties?.hashed_token;

        if (!token) {
            return NextResponse.json(
                { error: "Failed to generate token" },
                { status: 500 }
            );
        }

        // Build the verification URL that directly logs in as the user
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const verifyUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify?token=${token}&type=magiclink&redirect_to=${encodeURIComponent(appUrl + "/dashboard")}`;

        return NextResponse.json({
            url: verifyUrl,
            user: {
                id: userData.user.id,
                email: userData.user.email,
                name: userData.user.user_metadata?.full_name || userData.user.user_metadata?.name || null,
            },
            message: `Impersonation link generated for ${userData.user.email}`,
        });
    } catch (error) {
        console.error("Impersonation error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
