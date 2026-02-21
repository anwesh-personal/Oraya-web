/**
 * GET  /api/desktop/profile — fetch authenticated user's profile & preferences
 * PATCH /api/desktop/profile — update profile fields
 *
 * Auth: Bearer <supabase_access_token>
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
    authenticateDesktopRequest,
    isAuthError,
} from "@/lib/desktop-auth";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// GET — Fetch full profile + preferences
// ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticateDesktopRequest(request);
        if (isAuthError(authResult)) return authResult;

        const { userId, email } = authResult;
        const supabase = createServiceRoleClient();

        // Fetch profile
        const { data: profile } = await (supabase
            .from("user_profiles") as any)
            .select("*, ora_key")
            .eq("id", userId)
            .single();

        // Fetch preferences
        const { data: preferences } = await (supabase
            .from("user_preferences") as any)
            .select("*")
            .eq("user_id", userId)
            .single();

        // Get org membership info
        const { data: orgMembership } = await (supabase
            .from("organization_members") as any)
            .select("organization_id, role, organizations(name, slug)")
            .eq("user_id", userId)
            .limit(1)
            .single();

        return NextResponse.json({
            profile: {
                id: userId,
                email,
                full_name: profile?.full_name || null,
                username: profile?.username || null,
                avatar_url: profile?.avatar_url || null,
                bio: profile?.bio || null,
                timezone: profile?.timezone || "UTC",
                language: profile?.language || "en",
                theme: profile?.theme || "dark",
                account_status: profile?.account_status || "active",
                ora_key: profile?.ora_key || null,
                onboarding_completed: profile?.onboarding_completed || false,
                last_seen_at: profile?.last_seen_at || null,
                referral_code: profile?.referral_code || null,
                created_at: profile?.created_at || null,
                organization: orgMembership
                    ? {
                        id: (orgMembership as any).organization_id,
                        name: ((orgMembership as any).organizations as any)?.name || null,
                        slug: ((orgMembership as any).organizations as any)?.slug || null,
                        role: (orgMembership as any).role,
                    }
                    : null,
            },
            preferences: preferences
                ? {
                    auto_save_enabled: preferences.auto_save_enabled ?? true,
                    compact_mode: preferences.compact_mode ?? false,
                    show_tips: preferences.show_tips ?? true,
                    telemetry_enabled: preferences.telemetry_enabled ?? true,
                    desktop_notifications: preferences.desktop_notifications ?? true,
                    sound_enabled: preferences.sound_enabled ?? true,
                    default_model: preferences.default_model || null,
                    default_voice: preferences.default_voice || null,
                    ai_personality: preferences.ai_personality || "balanced",
                    developer_mode: preferences.developer_mode ?? false,
                    beta_features_enabled: preferences.beta_features_enabled ?? false,
                    custom_settings: preferences.custom_settings || {},
                }
                : null,
        });
    } catch (error) {
        console.error("Desktop profile GET error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// ─────────────────────────────────────────────────────────────
// PATCH — Update profile and/or preferences
// ─────────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
    try {
        const authResult = await authenticateDesktopRequest(request);
        if (isAuthError(authResult)) return authResult;

        const { userId } = authResult;
        const supabase = createServiceRoleClient();
        const body = await request.json();

        // ── Profile fields ──
        const profileAllowed = [
            "full_name",
            "username",
            "avatar_url",
            "bio",
            "timezone",
            "language",
            "theme",
        ];

        const profileUpdates: Record<string, unknown> = {};
        for (const field of profileAllowed) {
            if (field in body) {
                profileUpdates[field] = body[field];
            }
        }

        if (Object.keys(profileUpdates).length > 0) {
            const { error } = await (supabase
                .from("user_profiles") as any)
                .update(profileUpdates)
                .eq("id", userId);

            if (error) {
                console.error("Profile update error:", error);
                return NextResponse.json(
                    { error: `Failed to update profile: ${error.message}` },
                    { status: 500 }
                );
            }
        }

        // ── Preferences fields ──
        const prefsAllowed = [
            "auto_save_enabled",
            "compact_mode",
            "show_tips",
            "telemetry_enabled",
            "desktop_notifications",
            "sound_enabled",
            "default_model",
            "default_voice",
            "ai_personality",
            "developer_mode",
            "beta_features_enabled",
            "custom_settings",
        ];

        const prefsUpdates: Record<string, unknown> = {};
        for (const field of prefsAllowed) {
            if (field in body) {
                prefsUpdates[field] = body[field];
            }
        }

        if (Object.keys(prefsUpdates).length > 0) {
            const { error } = await (supabase
                .from("user_preferences") as any)
                .update(prefsUpdates)
                .eq("user_id", userId);

            if (error) {
                console.error("Preferences update error:", error);
                return NextResponse.json(
                    { error: `Failed to update preferences: ${error.message}` },
                    { status: 500 }
                );
            }
        }

        // Return updated profile
        const response = await GET(request);
        return response;
    } catch (error) {
        console.error("Desktop profile PATCH error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
