import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// GET /api/members/profile
// Returns the authenticated user's profile from user_profiles.
//
// PATCH /api/members/profile
// Updates the authenticated user's profile.
// ─────────────────────────────────────────────────────────────

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Fetch profile from user_profiles table
        const { data: profile, error: profileError } = await supabase
            .from("user_profiles")
            .select(`
                id,
                email,
                full_name,
                display_name,
                avatar_url,
                organization,
                role,
                bio,
                timezone,
                locale,
                referral_code,
                referred_by,
                is_active,
                last_login_at,
                created_at,
                updated_at
            `)
            .eq("id", user.id)
            .single();

        if (profileError) {
            console.error("Profile fetch error:", profileError);
            return NextResponse.json(
                { error: "Failed to fetch profile" },
                { status: 500 }
            );
        }

        return NextResponse.json({ profile });
    } catch (error) {
        console.error("Profile API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const supabase = await createServerSupabaseClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();

        // Whitelist allowed fields for update
        const allowedFields = [
            "full_name",
            "display_name",
            "avatar_url",
            "organization",
            "bio",
            "timezone",
            "locale",
        ];

        const updates: Record<string, unknown> = {};
        for (const field of allowedFields) {
            if (field in body) {
                updates[field] = body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: "No valid fields to update" },
                { status: 400 }
            );
        }

        const { data: profile, error: updateError } = await supabase
            .from("user_profiles")
            .update(updates)
            .eq("id", user.id)
            .select()
            .single();

        if (updateError) {
            console.error("Profile update error:", updateError);
            return NextResponse.json(
                { error: "Failed to update profile" },
                { status: 500 }
            );
        }

        return NextResponse.json({ profile });
    } catch (error) {
        console.error("Profile update API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
