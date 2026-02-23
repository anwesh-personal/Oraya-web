/**
 * POST /api/license/login-with-key
 *
 * Complete ORA Key authentication flow.
 * Unlike /api/license/activate-device (which only registers the device),
 * this endpoint does the FULL login:
 *   1. Validate ORA Key → get user_id
 *   2. Create a Supabase session via service role (no password needed)
 *   3. Resolve license + activate device
 *   4. Sign and return a full Oraya License Token (OLT)
 *
 * The desktop app can use only the ORA key to get a complete session.
 * No email/password required.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { applyRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import {
    ensureStandardLicense,
    countActiveDevices,
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

export async function POST(request: NextRequest) {
    try {
        // ── Rate limit ──
        const rateLimited = applyRateLimit(request, "login-with-key");
        if (rateLimited) return rateLimited;

        const body = await request.json().catch(() => null);
        if (!body) {
            return NextResponse.json(
                { error: "Invalid JSON body", code: "INVALID_BODY" },
                { status: 400 }
            );
        }

        const {
            ora_key,
            device_id,
            device_name,
            device_platform,
            device_platform_version,
            app_version,
            device_type,
        } = body;

        if (!ora_key || !device_id) {
            return NextResponse.json(
                { error: "ora_key and device_id are required", code: "MISSING_PARAMS" },
                { status: 400 }
            );
        }

        const supabase = createServiceRoleClient();
        const config = getServerConfig();

        // ── Step 1: Validate app version ──
        if (app_version && isVersionTooOld(app_version, config.min_app_version)) {
            return NextResponse.json(
                {
                    error: `App version ${app_version} is too old. Minimum: ${config.min_app_version}`,
                    code: "APP_VERSION_TOO_OLD",
                    update_url: config.update_url,
                },
                { status: 406 }
            );
        }

        // ── Step 2: Look up user by ORA key ──
        // Try the RPC first, fall back to direct query if the function isn't deployed yet.
        let userId: string;
        let email: string;
        let accountStatus: string;

        const { data: rpcUser, error: rpcError } = await (
            supabase.rpc("get_user_by_ora_key", { p_ora_key: ora_key }) as any
        ).single();

        if (!rpcError && rpcUser) {
            userId = rpcUser.user_id;
            email = rpcUser.email;
            accountStatus = rpcUser.account_status || "active";
        } else {
            // Fallback: direct query (works even if RPC doesn't exist yet)
            const { data: profileRow, error: profileError } = await (supabase
                .from("user_profiles")
                .select("id, ora_key, account_status")
                .eq("ora_key", ora_key)
                .maybeSingle() as any);

            if (profileError || !profileRow) {
                logger.warn("ORA Key login failed — key not found", { ora_key, rpcError: rpcError?.message });
                return NextResponse.json(
                    { error: "Invalid ORA Key. Please check the key and try again.", code: "INVALID_KEY" },
                    { status: 401 }
                );
            }

            // Get email from auth.users via service role
            const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profileRow.id);
            if (authError || !authUser?.user) {
                return NextResponse.json(
                    { error: "Invalid ORA Key. Please check the key and try again.", code: "INVALID_KEY" },
                    { status: 401 }
                );
            }

            userId = profileRow.id;
            email = authUser.user.email || "";
            accountStatus = profileRow.account_status || "active";
        }

        // ── Step 3: Check account status ──
        if (accountStatus === "suspended" || accountStatus === "deleted") {
            return NextResponse.json(
                { error: "This account is no longer active.", code: "ACCOUNT_INACTIVE" },
                { status: 403 }
            );
        }

        // ── Step 4: Create a Supabase sign-in link / magic session via admin API ──
        // We use generateLink to create a secure sign-in token for this user,
        // then exchange it for a real access_token and refresh_token.
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: "magiclink",
            email,
            options: { redirectTo: "oraya://auth/callback" },
        });

        if (linkError || !linkData?.properties?.hashed_token) {
            logger.error("Failed to generate magic link for ORA Key login", linkError, { userId });
            return NextResponse.json(
                { error: "Failed to create session. Please try again.", code: "SESSION_CREATE_FAILED" },
                { status: 500 }
            );
        }

        // Exchange the hashed token for a real session
        const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
            token_hash: linkData.properties.hashed_token,
            type: "magiclink",
        });

        if (sessionError || !sessionData?.session) {
            logger.error("Failed to exchange magic link for session", sessionError, { userId });
            return NextResponse.json(
                { error: "Failed to create session. Please try again.", code: "SESSION_EXCHANGE_FAILED" },
                { status: 500 }
            );
        }

        const { access_token, refresh_token } = sessionData.session;

        // ── Step 5: Fetch team context ──
        const { data: memberships } = await (supabase
            .from("team_members")
            .select("team_id, role, status, teams!inner(id, name, slug, plan_id, is_active)")
            .eq("user_id", userId)
            .eq("status", "active") as any);

        let team = null;
        if (memberships && memberships.length > 0) {
            const best = memberships[0] as any;
            const t = best.teams;
            team = {
                teamId: t.id,
                teamName: t.name,
                teamSlug: t.slug,
                role: best.role,
                licenseInheritedFromTeam: false,
            };
        }

        // ── Step 6: Resolve license ──
        let license = null;

        // Try personal license
        const { data: personalLicenseRow } = await (supabase.from("user_licenses") as any)
            .select("*, plans(*)")
            .eq("user_id", userId)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (personalLicenseRow?.plans) {
            const plan = personalLicenseRow.plans;
            license = {
                id: personalLicenseRow.id,
                userId,
                planId: personalLicenseRow.plan_id,
                status: personalLicenseRow.status,
                billingCycle: personalLicenseRow.billing_cycle,
                currentPeriodEnd: personalLicenseRow.current_period_end,
                aiCallsUsed: personalLicenseRow.ai_calls_used || 0,
                tokensUsed: personalLicenseRow.tokens_used || 0,
                teamId: team?.teamId || null,
                source: "personal" as const,
                isByok: !!personalLicenseRow.is_byok,
                licenseKey: personalLicenseRow.license_key,
                currentPeriodStart: personalLicenseRow.current_period_start,
                plan: {
                    id: plan.id,
                    name: plan.name,
                    features: plan.features || [],
                    maxAgents: plan.max_agents || 1,
                    maxDevices: plan.max_devices || 1,
                    maxAiCallsPerMonth: plan.max_ai_calls_per_month || 0,
                    maxTokenUsagePerMonth: plan.max_token_usage_per_month || 0,
                    maxConversationsPerMonth: plan.max_conversations_per_month || 0,
                },
            };
        }

        // Auto-create free license if none found
        if (!license) {
            license = await ensureStandardLicense(supabase, userId);
            if (!license) {
                return NextResponse.json(
                    { error: "Unable to create license. Please contact support.", code: "LICENSE_CREATION_FAILED" },
                    { status: 500 }
                );
            }
        }

        if (license.status === "suspended") {
            return NextResponse.json(
                { error: "Your account has been suspended.", code: "ACCOUNT_SUSPENDED" },
                { status: 403 }
            );
        }

        // ── Step 7: Register device activation (with plan limit check) ──
        const ipAddress =
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            request.headers.get("x-real-ip") ||
            "unknown";
        const userAgent = request.headers.get("user-agent") || "unknown";

        // Check if this device is already activated (returning device = always allowed)
        const { data: existingDevice } = await (supabase
            .from("device_activations")
            .select("id, is_active")
            .eq("user_id", userId)
            .eq("device_id", device_id)
            .maybeSingle() as any);

        if (!existingDevice) {
            // New device — enforce plan limit (-1 = unlimited)
            const maxDevices = license.plan.maxDevices;
            if (maxDevices !== -1) {
                const { count } = await (supabase
                    .from("device_activations")
                    .select("id", { count: "exact", head: true })
                    .eq("user_id", userId)
                    .eq("is_active", true) as any);

                if ((count || 0) >= maxDevices) {
                    const { data: activeDevices } = await (supabase
                        .from("device_activations")
                        .select("device_name, device_platform, last_seen_at")
                        .eq("user_id", userId)
                        .eq("is_active", true)
                        .order("last_seen_at", { ascending: false }) as any);

                    return NextResponse.json(
                        {
                            error: `Your plan allows ${maxDevices} device${maxDevices !== 1 ? "s" : ""}. Please deactivate a device first.`,
                            code: "MAX_DEVICES_REACHED",
                            max_devices: maxDevices,
                            active_devices: (activeDevices || []).map((d: any) => ({
                                device_name: d.device_name,
                                platform: d.device_platform,
                                last_seen: d.last_seen_at,
                            })),
                        },
                        { status: 409 }
                    );
                }
            }
        }

        const { data: activation, error: activationError } = await (supabase.from("device_activations") as any)
            .upsert(
                {
                    user_id: userId,
                    ora_key,
                    device_id,
                    device_name: device_name || "Unknown Device",
                    device_platform: device_platform || "macos",
                    device_platform_version: device_platform_version || "unknown",
                    app_version: app_version || "0.0.0",
                    is_active: true,
                    last_seen_at: new Date().toISOString(),
                    activated_at: new Date().toISOString(),
                    ip_address: ipAddress,
                    user_agent: userAgent,
                },
                { onConflict: "user_id,device_id" }
            )
            .select()
            .single();

        if (activationError) {
            logger.error("Device activation failed", activationError, { userId });
            return NextResponse.json(
                { error: "Failed to activate device.", code: "ACTIVATION_FAILED" },
                { status: 500 }
            );
        }

        // ── Step 8: Fetch user profile (for ora_key, avatar, name) ──
        const { data: profile } = await (supabase.from("user_profiles") as any)
            .select("full_name, avatar_url, ora_key")
            .eq("id", userId)
            .single();

        // ── Step 9: Build managed AI claims ──
        let managedAi: ManagedAiClaims | undefined;
        const hasManaged = license.plan.features.includes("managed_ai") || license.plan.features.includes("everything");
        if (hasManaged) {
            managedAi = await buildManagedAiClaims(supabase, userId, license as any);
        }

        // ── Step 10: Sign license token ──
        const licenseToken = await createLicenseToken({
            userId,
            email,
            orgId: team?.teamId,
            licenseId: license.id,
            oraKey: profile?.ora_key || ora_key,
            planId: license.planId,
            planName: license.plan.name,
            planFeatures: license.plan.features,
            maxAgents: license.plan.maxAgents,
            maxDevices: license.plan.maxDevices,
            maxAiCalls: license.plan.maxAiCallsPerMonth,
            maxTokens: license.plan.maxTokenUsagePerMonth,
            deviceId: device_id,
            deviceName: device_name || "Unknown Device",
            devicePlatform: device_platform || "macos",
            activationId: activation.id,
            managedAi,
            planExpiresAt: license.currentPeriodEnd
                ? new Date(license.currentPeriodEnd)
                : undefined,
        });

        // ── Step 11: Record token issuance ──
        const jti = extractJtiFromToken(licenseToken);
        const exp = extractExpFromToken(licenseToken);
        await recordTokenIssuance(supabase, {
            licenseId: license.id,
            deviceId: device_id,
            activationId: activation.id,
            tokenJti: jti,
            issuedAt: new Date(),
            expiresAt: new Date(exp * 1000),
            ipAddress,
            userAgent,
        });

        logger.info("ORA Key full login succeeded", { userId, deviceId: device_id });

        // ── Step 12: Return full response (same shape as /api/desktop/activate) ──
        return NextResponse.json({
            license_token: licenseToken,
            // Also return the Supabase tokens so the desktop can make
            // subsequent API calls on behalf of the user (profile fetch, etc.)
            supabase_access_token: access_token,
            supabase_refresh_token: refresh_token,
            user: {
                id: userId,
                email,
                name: profile?.full_name || email.split("@")[0],
                avatar_url: profile?.avatar_url || null,
                organization: team?.teamName || null,
                ora_key: profile?.ora_key || ora_key,
            },
            license: {
                plan_id: license.planId,
                plan_name: license.plan.name,
                status: license.status,
                ora_key: profile?.ora_key || ora_key,
                features: license.plan.features,
                limits: {
                    max_agents: license.plan.maxAgents,
                    max_devices: license.plan.maxDevices,
                    max_ai_calls: license.plan.maxAiCallsPerMonth,
                    max_tokens: license.plan.maxTokenUsagePerMonth,
                },
                expires_at: license.currentPeriodEnd,
                is_trial: license.billingCycle === "trial",
                devices_active: 1,
                devices_max: license.plan.maxDevices,
                team_inherited: false,
            },
            config,
        });
    } catch (error) {
        logger.error("ORA Key login failed unexpectedly", error);
        return NextResponse.json(
            { error: "Internal server error", code: "INTERNAL_ERROR" },
            { status: 500 }
        );
    }
}
