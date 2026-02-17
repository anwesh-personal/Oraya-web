/**
 * POST /api/desktop/activate
 *
 * First-time device activation. Called after successful Supabase login
 * on the desktop app. Creates a device activation record and returns
 * a signed Oraya License Token (OLT).
 *
 * Auth: Bearer <supabase_access_token>
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { applyRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import {
    authenticateDesktopRequest,
    isAuthError,
    ensureFreeLicense,
    countActiveDevices,
    fetchDeviceActivation,
    recordTokenIssuance,
    getServerConfig,
    isVersionTooOld,
    buildManagedAiClaims,
    type DesktopLicense,
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

interface ActivateRequestBody {
    device_id: string;
    device_name: string;
    device_type: string;
    platform: string;
    platform_version: string;
    app_version: string;
}

function validateRequest(body: unknown): ActivateRequestBody | string {
    if (!body || typeof body !== "object") {
        return "Request body is required";
    }

    const b = body as Record<string, unknown>;

    if (!b.device_id || typeof b.device_id !== "string" || b.device_id.length < 8) {
        return "device_id is required and must be at least 8 characters (SHA-256 hash)";
    }
    if (!b.device_name || typeof b.device_name !== "string") {
        return "device_name is required";
    }
    if (!b.platform || typeof b.platform !== "string") {
        return "platform is required";
    }
    if (!b.app_version || typeof b.app_version !== "string") {
        return "app_version is required";
    }

    return {
        device_id: b.device_id as string,
        device_name: (b.device_name as string).slice(0, 100),
        device_type: (b.device_type as string) || "desktop",
        platform: (b.platform as string).slice(0, 20),
        platform_version: ((b.platform_version as string) || "").slice(0, 30),
        app_version: (b.app_version as string).slice(0, 20),
    };
}

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        // ── Step 0: Rate limit ──
        const rateLimited = applyRateLimit(request, "activate");
        if (rateLimited) return rateLimited;

        // ── Step 1: Authenticate ──
        const authResult = await authenticateDesktopRequest(request);
        if (isAuthError(authResult)) return authResult;

        const { userId, email, ipAddress, userAgent, team } = authResult;

        // ── Step 2: Validate request body ──
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
                    error: `App version ${req.app_version} is too old. Minimum required: ${config.min_app_version}`,
                    code: "APP_VERSION_TOO_OLD",
                    update_url: config.update_url,
                    min_version: config.min_app_version,
                    latest_version: config.latest_app_version,
                },
                { status: 406 }
            );
        }

        // ── Step 4: Resolve license ──
        const supabase = createServiceRoleClient();
        let license = authResult.license;
        const isTeamInherited = license?.source === "team_inherited";

        // If no license found (not personal, not team-inherited), auto-create free
        if (!license) {
            license = await ensureFreeLicense(supabase, userId);
            if (!license) {
                return NextResponse.json(
                    {
                        error: "Unable to create license. Please contact support.",
                        code: "LICENSE_CREATION_FAILED",
                    },
                    { status: 500 }
                );
            }
        }

        // ── Step 5: Check license status ──
        if (license.status === "suspended") {
            return NextResponse.json(
                {
                    error: "Your account has been suspended. Please contact support.",
                    code: "ACCOUNT_SUSPENDED",
                },
                { status: 403 }
            );
        }

        if (license.status === "cancelled" || license.status === "expired") {
            return NextResponse.json(
                {
                    error: "Your license has expired. Please renew your subscription.",
                    code: "LICENSE_EXPIRED",
                },
                { status: 410 }
            );
        }

        // ── Step 6: Resolve personal license for device activation ──
        // Device activations always attach to a real user_licenses row (UUID FK).
        // For team-inherited users, we ensure a personal license row exists.
        let licenseIdForActivation: string;

        if (isTeamInherited) {
            const personalLicense = await ensureFreeLicense(supabase, userId);
            if (!personalLicense) {
                return NextResponse.json(
                    { error: "Unable to create device license. Please contact support.", code: "LICENSE_CREATION_FAILED" },
                    { status: 500 }
                );
            }
            licenseIdForActivation = personalLicense.id;
            // Keep team plan features — they're better than free
        } else {
            licenseIdForActivation = license.id;
        }

        // ── Step 7: Check device limits ──
        const existingActivation = await fetchDeviceActivation(
            supabase,
            licenseIdForActivation,
            req.device_id
        );

        if (!existingActivation) {
            // New device — check max_devices limit
            const activeCount = await countActiveDevices(supabase, licenseIdForActivation);
            if (activeCount >= license.plan.maxDevices) {
                const { data: activeDevices } = await (
                    supabase.from("license_activations") as any
                )
                    .select("device_id, device_name, platform, last_seen_at")
                    .eq("license_id", licenseIdForActivation)
                    .eq("is_active", true)
                    .order("last_seen_at", { ascending: false });

                return NextResponse.json(
                    {
                        error: `Maximum devices reached (${license.plan.maxDevices}). Please deactivate a device first.`,
                        code: "MAX_DEVICES_REACHED",
                        max_devices: license.plan.maxDevices,
                        active_devices: (activeDevices || []).map((d: any) => ({
                            device_id: d.device_id,
                            device_name: d.device_name,
                            platform: d.platform,
                            last_seen: d.last_seen_at,
                        })),
                    },
                    { status: 409 }
                );
            }
        }

        // ── Step 8: UPSERT device activation ──
        const { data: activation, error: activationError } = await (
            supabase.from("license_activations") as any
        )
            .upsert(
                {
                    license_id: licenseIdForActivation,
                    device_id: req.device_id,
                    device_name: req.device_name,
                    device_type: req.device_type,
                    platform: req.platform,
                    platform_version: req.platform_version,
                    app_version: req.app_version,
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    is_active: true,
                    last_seen_at: new Date().toISOString(),
                    activated_at: new Date().toISOString(),
                    deactivated_at: null,
                    deactivated_reason: null,
                },
                { onConflict: "license_id,device_id" }
            )
            .select()
            .single();

        if (activationError || !activation) {
            console.error("[desktop/activate] Activation upsert failed:", activationError);
            return NextResponse.json(
                { error: "Failed to activate device", code: "ACTIVATION_FAILED" },
                { status: 500 }
            );
        }

        // ── Step 9: Update user profile ──
        await supabase.from("user_profiles")
            .upsert(
                {
                    id: userId,
                    desktop_app_version: req.app_version,
                    last_seen_at: new Date().toISOString(),
                },
                { onConflict: "id" }
            );

        // ── Step 10: Fetch managed AI claims (if applicable) ──
        let managedAi: ManagedAiClaims | undefined;
        if (license.plan.features.includes("managed_ai")) {
            managedAi = await buildManagedAiClaims(supabase, userId, license);
        }

        // ── Step 11: Sign license token ──
        const activeDeviceCount = await countActiveDevices(supabase, licenseIdForActivation);

        const licenseToken = await createLicenseToken({
            userId,
            email,
            orgId: team?.teamId,

            licenseId: licenseIdForActivation,
            licenseKey: license.licenseKey || "",
            planId: license.planId,
            planName: license.plan.name,
            planFeatures: license.plan.features,

            maxAgents: license.plan.maxAgents,
            maxDevices: license.plan.maxDevices,
            maxAiCalls: license.plan.maxAiCallsPerMonth,
            maxTokens: license.plan.maxTokenUsagePerMonth,

            deviceId: req.device_id,
            deviceName: req.device_name,
            devicePlatform: req.platform,
            activationId: activation.id,

            managedAi,

            planExpiresAt: license.currentPeriodEnd
                ? new Date(license.currentPeriodEnd)
                : undefined,
        });

        // ── Step 12: Record token issuance for audit trail ──
        const jti = extractJtiFromToken(licenseToken);
        const exp = extractExpFromToken(licenseToken);
        await recordTokenIssuance(supabase, {
            licenseId: licenseIdForActivation,
            deviceId: req.device_id,
            activationId: activation.id,
            tokenJti: jti,
            issuedAt: new Date(),
            expiresAt: new Date(exp * 1000),
            ipAddress,
            userAgent,
        });

        // ── Step 13: Fetch user profile for response ──
        const { data: profile } = await supabase.from("user_profiles")
            .select("full_name, avatar_url")
            .eq("id", userId)
            .single();

        // ── Step 14: Build response ──
        return NextResponse.json({
            license_token: licenseToken,
            user: {
                id: userId,
                email,
                name: profile?.full_name || email.split("@")[0],
                avatar_url: profile?.avatar_url || null,
                organization: team?.teamName || null,
            },
            license: {
                plan_id: license.planId,
                plan_name: license.plan.name,
                status: license.status,
                license_key: license.licenseKey,
                features: license.plan.features,
                limits: {
                    max_agents: license.plan.maxAgents,
                    max_devices: license.plan.maxDevices,
                    max_ai_calls: license.plan.maxAiCallsPerMonth,
                    max_tokens: license.plan.maxTokenUsagePerMonth,
                },
                expires_at: license.currentPeriodEnd,
                is_trial: license.billingCycle === "trial",
                devices_active: activeDeviceCount,
                devices_max: license.plan.maxDevices,
                team_inherited: isTeamInherited,
            },
            config,
        });
    } catch (error) {
        logger.error("Activation failed", error, { endpoint: "activate" });
        return NextResponse.json(
            { error: "Internal server error", code: "INTERNAL_ERROR" },
            { status: 500 }
        );
    }
}
