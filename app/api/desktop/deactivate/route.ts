/**
 * POST /api/desktop/deactivate
 *
 * Explicit device deactivation. Called when the user logs out of the
 * desktop app or explicitly deactivates this device.
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
    getUserLicenseIds,
} from "@/lib/desktop-auth";

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        // ── Rate limit ──
        const rateLimited = applyRateLimit(request, "deactivate");
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
        const reason = (body.reason as string) || "user_logout";

        if (!deviceId) {
            return NextResponse.json(
                { error: "device_id is required", code: "VALIDATION_ERROR" },
                { status: 400 }
            );
        }

        // ── Deactivate the device ──
        const supabase = createServiceRoleClient();
        const isTeamInherited = license?.source === "team_inherited";

        let deactivated = false;

        // Try direct license lookup first (personal license)
        if (license && !isTeamInherited) {
            const { data, error } = await (supabase.from("license_activations") as any)
                .update({
                    is_active: false,
                    deactivated_at: new Date().toISOString(),
                    deactivated_reason: reason,
                })
                .eq("license_id", license.id)
                .eq("device_id", deviceId)
                .eq("is_active", true)
                .select("id")
                .maybeSingle();

            if (!error && data) {
                deactivated = true;
            }
        }

        // Fallback: find by device_id across all user's licenses
        if (!deactivated) {
            const licenseIds = await getUserLicenseIds(supabase, userId);

            if (licenseIds.length > 0) {
                const { data, error } = await (supabase.from("license_activations") as any)
                    .update({
                        is_active: false,
                        deactivated_at: new Date().toISOString(),
                        deactivated_reason: reason,
                    })
                    .in("license_id", licenseIds)
                    .eq("device_id", deviceId)
                    .eq("is_active", true)
                    .select("id");

                if (!error && data && data.length > 0) {
                    deactivated = true;
                }
            }
        }

        // ── Post-deactivation: revoke tokens + log event ──
        if (deactivated) {
            // Fetch user's license IDs once (reuse for both revocation and logging)
            const licenseIds = await getUserLicenseIds(supabase, userId);

            // Revoke any active tokens for this device
            try {
                if (licenseIds.length > 0) {
                    await (supabase.from("desktop_license_tokens") as any)
                        .update({
                            is_revoked: true,
                            revoked_at: new Date().toISOString(),
                            revoked_reason: `deactivation:${reason}`,
                        })
                        .in("license_id", licenseIds)
                        .eq("device_id", deviceId)
                        .eq("is_revoked", false);
                }
            } catch {
                // Non-critical — tokens will expire naturally
            }

            // Log the deactivation event
            try {
                const eventLicenseId =
                    license && !isTeamInherited
                        ? license.id
                        : licenseIds[0] || null;

                if (eventLicenseId) {
                    await (supabase.from("license_usage_events") as any)
                        .insert({
                            license_id: eventLicenseId,
                            device_id: deviceId,
                            event_type: "device_deactivated",
                            usage_count: 0,
                            metadata: { reason },
                        });
                }
            } catch {
                // Non-critical
            }
        }

        return NextResponse.json({
            deactivated,
            ...(!deactivated && {
                message: "No active activation found for this device. It may already be deactivated.",
            }),
        });
    } catch (error) {
        logger.error("Deactivation failed", error, { endpoint: "deactivate" });
        return NextResponse.json(
            { error: "Internal server error", code: "INTERNAL_ERROR" },
            { status: 500 }
        );
    }
}
