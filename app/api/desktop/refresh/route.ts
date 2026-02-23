/**
 * POST /api/desktop/refresh
 *
 * Silent token refresh. Called periodically when the desktop app is online.
 * Validates the license is still active, updates usage, and issues a
 * fresh signed OLT.
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
    fetchDeviceActivation,
    fetchDeviceActivationByUser,
    recordTokenIssuance,
    getServerConfig,
    isVersionTooOld,
    buildManagedAiClaims,
} from "@/lib/desktop-auth";
import {
    createLicenseToken,
    extractJtiFromToken,
    extractExpFromToken,
    type ManagedAiClaims,
} from "@/lib/license-signing";

// =============================================================================
// REQUEST VALIDATION
// =============================================================================

interface RefreshRequestBody {
    device_id: string;
    current_token_iat: number;
    app_version: string;
    usage_summary?: {
        agent_runs?: number;
        ai_calls?: number;
        tokens_used?: number;
        search_queries?: number;
        active_hours?: number;
        period_start?: string;
        period_end?: string;
    };
}

function validateRequest(body: unknown): RefreshRequestBody | string {
    if (!body || typeof body !== "object") {
        return "Request body is required";
    }

    const b = body as Record<string, unknown>;

    if (!b.device_id || typeof b.device_id !== "string") {
        return "device_id is required";
    }
    if (!b.app_version || typeof b.app_version !== "string") {
        return "app_version is required";
    }

    return {
        device_id: b.device_id as string,
        current_token_iat: typeof b.current_token_iat === "number" ? b.current_token_iat : 0,
        app_version: (b.app_version as string).slice(0, 20),
        usage_summary: b.usage_summary as RefreshRequestBody["usage_summary"],
    };
}

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        // ── Step 0: Rate limit ──
        const rateLimited = applyRateLimit(request, "refresh");
        if (rateLimited) return rateLimited;

        // ── Step 1: Authenticate ──
        const authResult = await authenticateDesktopRequest(request);
        if (isAuthError(authResult)) return authResult;

        const { userId, email, ipAddress, userAgent, license, team } = authResult;

        // ── Step 2: Validate ──
        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { error: "Invalid JSON body", code: "INVALID_BODY" },
                { status: 400 }
            );
        }

        const validation = validateRequest(body);
        if (typeof validation === "string") {
            return NextResponse.json(
                { error: validation, code: "VALIDATION_ERROR" },
                { status: 400 }
            );
        }

        const req = validation;

        // ── Step 3: Check app version ──
        const config = getServerConfig();
        if (isVersionTooOld(req.app_version, config.min_app_version)) {
            return NextResponse.json(
                {
                    error: `App version ${req.app_version} is too old. Please update.`,
                    code: "APP_VERSION_TOO_OLD",
                    update_url: config.update_url,
                    min_version: config.min_app_version,
                    latest_version: config.latest_app_version,
                },
                { status: 406 }
            );
        }

        // ── Step 4: Verify license exists and is active ──
        if (!license) {
            return NextResponse.json(
                {
                    error: "No active license found. Please re-activate.",
                    code: "NO_LICENSE",
                },
                { status: 403 }
            );
        }

        if (license.status === "suspended") {
            return NextResponse.json(
                {
                    error: "Your account has been suspended.",
                    code: "ACCOUNT_SUSPENDED",
                },
                { status: 403 }
            );
        }

        if (license.status === "cancelled" || license.status === "expired") {
            return NextResponse.json(
                {
                    error: "Your license has expired. Please renew.",
                    code: "LICENSE_EXPIRED",
                },
                { status: 403 }
            );
        }

        // ── Step 5: Verify device is still activated ──
        const supabase = createServiceRoleClient();
        const isTeamInherited = license.source === "team_inherited";

        // Find the device activation — for team-inherited, look across user's licenses
        let activation;
        if (!isTeamInherited) {
            activation = await fetchDeviceActivation(supabase, license.id, req.device_id);
        } else {
            activation = await fetchDeviceActivationByUser(supabase, userId, req.device_id);
        }

        if (!activation) {
            return NextResponse.json(
                {
                    error: "This device has been deactivated. Please re-activate.",
                    code: "DEVICE_DEACTIVATED",
                },
                { status: 409 }
            );
        }

        // The license_id on the activation row is the real FK (personal license row)
        const activationLicenseId: string = activation.license_id || activation.licenseId;

        // ── Step 6: Update last_seen_at and app_version ──
        await (supabase.from("license_activations") as any)
            .update({
                last_seen_at: new Date().toISOString(),
                app_version: req.app_version,
            })
            .eq("id", activation.id);

        // ── Step 7: Record usage summary ──
        if (req.usage_summary) {
            const summary = req.usage_summary;

            // Update license usage counters
            if (summary.ai_calls && summary.ai_calls > 0) {
                await supabase.from("user_licenses")
                    .update({
                        ai_calls_used: license.aiCallsUsed + summary.ai_calls,
                        tokens_used: license.tokensUsed + (summary.tokens_used || 0),
                    })
                    .eq("id", activationLicenseId);

                // Update local license reference for token claims
                license.aiCallsUsed += summary.ai_calls;
                license.tokensUsed += (summary.tokens_used || 0);
            }

            // Record usage event (uses activation's real license_id)
            await supabase.from("license_usage_events")
                .insert({
                    license_id: activationLicenseId,
                    device_id: req.device_id,
                    event_type: "refresh_usage_report",
                    usage_count: summary.ai_calls || 0,
                    metadata: {
                        agent_runs: summary.agent_runs || 0,
                        ai_calls: summary.ai_calls || 0,
                        tokens_used: summary.tokens_used || 0,
                        search_queries: summary.search_queries || 0,
                        active_hours: summary.active_hours || 0,
                        period_start: summary.period_start,
                        period_end: summary.period_end,
                    },
                });

            // Check if usage limit reached
            if (license.aiCallsUsed >= license.plan.maxAiCallsPerMonth && license.plan.maxAiCallsPerMonth > 0) {
                await supabase.from("user_licenses")
                    .update({ usage_limit_reached: true })
                    .eq("id", activationLicenseId);
            }
        }

        // ── Step 8: Build managed AI claims ──
        let managedAi: ManagedAiClaims | undefined;
        const hasManaged = license.plan.features.includes("managed_ai") || license.plan.features.includes("everything");
        if (hasManaged) {
            managedAi = await buildManagedAiClaims(supabase, userId, license);
        }

        // ── Step 8b: Resolve effective limits (org overrides plan) ──
        let effectiveMaxAgents = license.plan.maxAgents;
        let effectiveMaxDevices = license.plan.maxDevices;
        if (team?.teamId) {
            const { data: teamRow } = await (supabase.from("teams") as any)
                .select("max_agents")
                .eq("id", team.teamId)
                .single();
            if (teamRow?.max_agents != null && teamRow.max_agents > 0) {
                effectiveMaxAgents = teamRow.max_agents;
            }
        }

        // ── Step 8c: Fetch ORA Key from profile ──
        const { data: profileRow } = await (supabase.from("user_profiles") as any)
            .select("ora_key")
            .eq("id", userId)
            .single();

        // ── Step 9: Sign fresh license token ──
        const licenseToken = await createLicenseToken({
            userId,
            email,
            orgId: team?.teamId,

            licenseId: activationLicenseId,
            oraKey: profileRow?.ora_key || "",
            planId: license.planId,
            planName: license.plan.name,
            planFeatures: license.plan.features,

            maxAgents: effectiveMaxAgents,
            maxDevices: effectiveMaxDevices,
            maxAiCalls: license.plan.maxAiCallsPerMonth,
            maxTokens: license.plan.maxTokenUsagePerMonth,

            deviceId: req.device_id,
            deviceName: activation.device_name,
            devicePlatform: activation.platform,
            activationId: activation.id,

            managedAi,

            planExpiresAt: license.currentPeriodEnd
                ? new Date(license.currentPeriodEnd)
                : undefined,
        });

        // ── Step 10: Record token ──
        const jti = extractJtiFromToken(licenseToken);
        const exp = extractExpFromToken(licenseToken);
        await recordTokenIssuance(supabase, {
            licenseId: activationLicenseId,
            deviceId: req.device_id,
            activationId: activation.id,
            tokenJti: jti,
            issuedAt: new Date(),
            expiresAt: new Date(exp * 1000),
            ipAddress,
            userAgent,
        });

        // ── Step 11: Build response ──
        return NextResponse.json({
            license_token: licenseToken,
            announcements: [],
            config,
        });
    } catch (error) {
        logger.error("Refresh failed", error, { endpoint: "refresh" });
        return NextResponse.json(
            { error: "Internal server error", code: "INTERNAL_ERROR" },
            { status: 500 }
        );
    }
}
