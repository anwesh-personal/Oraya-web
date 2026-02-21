/**
 * POST /api/desktop/heartbeat
 *
 * Lightweight periodic ping. Cheaper than refresh — just updates
 * last_seen_at and sends minimal telemetry. Does NOT issue a new token.
 *
 * Auth: Bearer <supabase_access_token>
 */

import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
    authenticateDesktopRequest,
    isAuthError,
    getServerConfig,
    isVersionTooOld,
    fetchDeviceActivationByUser,
    getUserLicenseIds,
} from "@/lib/desktop-auth";

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        // ── Rate limit ──
        const rateLimited = applyRateLimit(request, "heartbeat");
        if (rateLimited) return rateLimited;

        // ── Authenticate ──
        const authResult = await authenticateDesktopRequest(request);
        if (isAuthError(authResult)) return authResult;

        const { userId, license } = authResult;

        // ── Parse body ──
        let body: Record<string, unknown> = {};
        try {
            body = (await request.json()) as Record<string, unknown>;
        } catch {
            return NextResponse.json(
                { error: "Invalid JSON body", code: "INVALID_BODY" },
                { status: 400 }
            );
        }

        const deviceId = body.device_id as string;
        const appVersion = body.app_version as string;

        if (!deviceId) {
            return NextResponse.json(
                { error: "device_id is required", code: "VALIDATION_ERROR" },
                { status: 400 }
            );
        }

        // ── Check app version ──
        const config = getServerConfig();
        if (appVersion && isVersionTooOld(appVersion, config.min_app_version)) {
            return NextResponse.json(
                {
                    ok: false,
                    config_changed: true,
                    config,
                    update_required: true,
                },
                { status: 426 } // 426 Upgrade Required
            );
        }

        // ── Update last_seen_at on device activation ──
        const supabase = createServiceRoleClient();
        const isTeamInherited = license?.source === "team_inherited";

        if (license && !isTeamInherited) {
            await (supabase.from("license_activations") as any)
                .update({
                    last_seen_at: new Date().toISOString(),
                    ...(appVersion && { app_version: appVersion }),
                })
                .eq("license_id", license.id)
                .eq("device_id", deviceId)
                .eq("is_active", true);
        } else {
            // Team-inherited or no personal license: find activation by device_id
            const activation = await fetchDeviceActivationByUser(supabase, userId, deviceId);
            if (activation) {
                await (supabase.from("license_activations") as any)
                    .update({
                        last_seen_at: new Date().toISOString(),
                        ...(appVersion && { app_version: appVersion }),
                    })
                    .eq("id", activation.id);
            }
        }

        // ── Update user_profiles.last_seen_at ──
        await (supabase.from("user_profiles") as any)
            .update({
                last_seen_at: new Date().toISOString(),
                ...(appVersion && { desktop_app_version: appVersion }),
            })
            .eq("id", userId);

        // ── Optional: record telemetry ──
        if (body.uptime_hours || body.memory_usage_mb) {
            try {
                // Resolve a real license_id for the usage event
                let eventLicenseId: string | null = null;
                if (license && !isTeamInherited) {
                    eventLicenseId = license.id;
                } else {
                    // Find any personal license ID for this user
                    const licenseIds = await getUserLicenseIds(supabase, userId);
                    eventLicenseId = licenseIds[0] || null;
                }

                // Only insert if we have a valid license_id (column is NOT NULL)
                if (eventLicenseId) {
                    await (supabase.from("license_usage_events") as any)
                        .insert({
                            license_id: eventLicenseId,
                            device_id: deviceId,
                            event_type: "heartbeat",
                            usage_count: 1,
                            metadata: {
                                uptime_hours: body.uptime_hours,
                                memory_usage_mb: body.memory_usage_mb,
                                app_version: appVersion,
                            },
                        });
                }
            } catch {
                // Non-critical — silently ignore
            }
        }

        // ── Response ──
        return NextResponse.json({
            ok: true,
            config_changed: false,
        });
    } catch (error) {
        logger.error("Heartbeat failed", error, { endpoint: "heartbeat" });
        return NextResponse.json(
            { error: "Internal server error", code: "INTERNAL_ERROR" },
            { status: 500 }
        );
    }
}
