import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Tables, Updatable } from "@/lib/database.types";

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
            .select("*")
            .eq("id", user.id)
            .single() as { data: Tables<"user_profiles"> | null; error: any };

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

        const updates: Updatable<"user_profiles"> = {};
        for (const field of allowedFields) {
            if (field in body) {
                (updates as any)[field] = body[field];
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
            .single() as { data: Tables<"user_profiles"> | null; error: any };

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
