/**
 * ORAYA DESKTOP AUTH MIDDLEWARE
 *
 * Shared authentication and authorization utilities for the /api/desktop/* endpoints.
 * Handles Supabase JWT verification, license lookup, and device validation.
 *
 * All desktop API endpoints use Bearer token auth (not cookies) because
 * the desktop app can't use browser cookies.
 *
 * @module lib/desktop-auth
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";
import type { ManagedAiClaims } from "@/lib/license-signing";

// =============================================================================
// TYPES
// =============================================================================

/** How a license was resolved */
export type LicenseSource = "personal" | "team_inherited";

/** Authenticated desktop user context */
export interface DesktopAuthContext {
    /** Supabase user ID */
    userId: string;
    /** User email */
    email: string;
    /** The raw Supabase access token (for forwarding if needed) */
    accessToken: string;
    /** User's active license (null if no license / free plan) */
    license: DesktopLicense | null;
    /** Team/org context (null if solo user) */
    team: TeamContext | null;
    /** Request IP address */
    ipAddress: string;
    /** User-Agent string */
    userAgent: string;
}

/** Team/organization membership context */
export interface TeamContext {
    /** teams.id — used as org_id in license token claims */
    teamId: string;
    /** Team display name */
    teamName: string;
    /** Team slug */
    teamSlug: string;
    /** User's role within the team */
    role: "owner" | "admin" | "member" | "guest";
    /** Whether the user's license is inherited from the team */
    licenseInheritedFromTeam: boolean;
}

/** License info fetched from database */
export interface DesktopLicense {
    id: string;
    userId: string;
    planId: string;
    licenseKey: string | null;
    status: string;
    billingCycle: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    aiCallsUsed: number;
    tokensUsed: number;
    /** If this license came from a team membership, the team ID */
    teamId: string | null;
    /** How this license was resolved — "personal" (direct user_licenses row)
     *  or "team_inherited" (derived from team_members → teams → plans) */
    source: LicenseSource;
    plan: {
        id: string;
        name: string;
        features: string[];
        maxAgents: number;
        maxDevices: number;
        maxAiCallsPerMonth: number;
        maxTokenUsagePerMonth: number;
        maxConversationsPerMonth: number;
    };
}

/** Device activation record */
export interface DeviceActivation {
    id: string;
    licenseId: string;
    deviceId: string;
    deviceName: string;
    deviceType: string;
    platform: string;
    platformVersion: string;
    appVersion: string;
    isActive: boolean;
    lastSeenAt: string;
    createdAt: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Features available in degraded / offline grace mode.
 *  Embedded in every signed OLT so the desktop knows what to allow offline. */
export const GRACE_MODE_FEATURES = [
    "local_llm",
    "local_agents",
    "local_memory",
    "terminal_access",
] as const;

// =============================================================================
// AUTHENTICATION
// =============================================================================

/**
 * Authenticate a desktop API request.
 *
 * Extracts the Bearer token from the Authorization header,
 * verifies it with Supabase, and fetches the user's license.
 *
 * @param request - The incoming Next.js request
 * @returns The authenticated context, or a NextResponse error
 */
export async function authenticateDesktopRequest(
    request: NextRequest
): Promise<DesktopAuthContext | NextResponse> {
    // ── Extract Bearer token ──
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
            {
                error: "Missing or invalid Authorization header",
                code: "AUTH_MISSING",
            },
            { status: 401 }
        );
    }

    const accessToken = authHeader.slice(7); // Remove "Bearer "
    if (!accessToken || accessToken.length < 10) {
        return NextResponse.json(
            {
                error: "Invalid access token",
                code: "AUTH_INVALID_TOKEN",
            },
            { status: 401 }
        );
    }

    // ── Verify with Supabase ──
    const supabase = createServiceRoleClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
        return NextResponse.json(
            {
                error: "Invalid or expired access token. Please re-authenticate.",
                code: "AUTH_EXPIRED",
            },
            { status: 401 }
        );
    }

    // ── Fetch team membership ──
    const team = await fetchTeamContext(supabase, user.id);

    // ── Fetch license (checks personal license first, falls back to team plan) ──
    const license = await fetchUserLicense(supabase, user.id, team);

    // ── Build context ──
    const ipAddress =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";

    const userAgent = request.headers.get("user-agent") || "unknown";

    return {
        userId: user.id,
        email: user.email || "",
        accessToken,
        license,
        team,
        ipAddress,
        userAgent,
    };
}

/**
 * Check if the result of authenticateDesktopRequest is an error response.
 */
export function isAuthError(
    result: DesktopAuthContext | NextResponse
): result is NextResponse {
    return result instanceof NextResponse;
}

// =============================================================================
// TEAM LOOKUP
// =============================================================================

/**
 * Fetch the user's team membership context.
 *
 * A user may belong to multiple teams — we pick the one with the
 * best plan (by priority: owner > admin > member, then by plan tier).
 *
 * If `preferredTeamId` is provided (e.g. from the activation request),
 * that team is used as long as the user is an active member of it.
 *
 * @param supabase - Service role Supabase client
 * @param userId - Supabase user ID
 * @param preferredTeamId - Optional team ID to prefer
 * @returns Team context or null if user is not in any team
 */
async function fetchTeamContext(
    supabase: ReturnType<typeof createServiceRoleClient>,
    userId: string,
    preferredTeamId?: string
): Promise<TeamContext | null> {
    // Find user's active team memberships — order by role weight
    // so owners/admins are preferred over members
    // Supabase's type inference goes infinitely deep on !inner joins
    // combined with cross-table .eq() filters. We type the result manually.
    const { data: memberships, error: memberError } = await (supabase
        .from("team_members")
        .select("team_id, role, status, teams!inner(id, name, slug, plan_id, is_active)")
        .eq("user_id", userId)
        .eq("status", "active") as any);

    if (memberError || !memberships || memberships.length === 0) {
        return null;
    }

    // If a preferred team was specified, try to use it
    if (preferredTeamId) {
        const preferred = memberships.find(
            (m: any) => m.teams?.id === preferredTeamId || m.team_id === preferredTeamId
        );
        if (preferred) {
            const team = preferred.teams as any;
            return {
                teamId: team.id,
                teamName: team.name,
                teamSlug: team.slug,
                role: preferred.role,
                licenseInheritedFromTeam: false,
            };
        }
        // Preferred team not found — fall through to auto-selection
    }

    // Role priority: owner > admin > member > guest
    const rolePriority: Record<string, number> = {
        owner: 4,
        admin: 3,
        member: 2,
        guest: 1,
    };

    // Plan priority: enterprise > team > pro > free
    const planPriority: Record<string, number> = {
        enterprise: 4,
        team: 3,
        pro: 2,
        free: 1,
    };

    // Sort by plan tier (best first), then role (highest first)
    const sorted = memberships.sort((a: any, b: any) => {
        const planA = planPriority[a.teams?.plan_id] ?? 0;
        const planB = planPriority[b.teams?.plan_id] ?? 0;
        if (planB !== planA) return planB - planA;
        return (rolePriority[b.role] ?? 0) - (rolePriority[a.role] ?? 0);
    });

    const best = sorted[0];
    const team = (best as any).teams;

    return {
        teamId: team.id,
        teamName: team.name,
        teamSlug: team.slug,
        role: best.role,
        // Will be set to true later if the user has no personal license
        // and inherits from the team plan
        licenseInheritedFromTeam: false,
    };
}

// =============================================================================
// LICENSE LOOKUP
// =============================================================================

/**
 * Fetch the user's active license with plan details.
 *
 * Resolution order:
 *   1. Personal `user_licenses` row (direct license — solo or assigned by admin)
 *   2. Team-inherited: `team_members` → `teams.plan_id` → `plans`
 *      (the user has no personal license row, but belongs to a team with a paid plan)
 *   3. null (no license at all — will trigger free plan auto-creation in activate endpoint)
 *
 * @param supabase - Service role Supabase client
 * @param userId - Supabase user ID
 * @param team - Pre-fetched team context (or null if solo)
 * @returns The user's resolved license or null
 */
async function fetchUserLicense(
    supabase: ReturnType<typeof createServiceRoleClient>,
    userId: string,
    team: TeamContext | null
): Promise<DesktopLicense | null> {
    // ── Step 1: Try personal user_licenses row ──
    const { data: license, error: licenseError } = await (
        supabase.from("user_licenses") as any
    )
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (!licenseError && license) {
        // User has a personal license — fetch its plan
        const plan = await fetchPlanById(supabase, license.plan_id);
        if (!plan) return null;

        return {
            id: license.id,
            userId: license.user_id,
            planId: license.plan_id,
            licenseKey: license.license_key,
            status: license.status,
            billingCycle: license.billing_cycle,
            currentPeriodStart: license.current_period_start,
            currentPeriodEnd: license.current_period_end,
            aiCallsUsed: license.ai_calls_used || 0,
            tokensUsed: license.tokens_used || 0,
            teamId: team?.teamId || null,
            source: "personal",
            plan: normalizePlan(plan),
        };
    }

    // ── Step 2: Try team-inherited license ──
    if (team) {
        // Fetch the team's plan
        const { data: teamRow, error: teamError } = await (
            supabase.from("teams") as any
        )
            .select("plan_id")
            .eq("id", team.teamId)
            .single();

        if (!teamError && teamRow?.plan_id) {
            const plan = await fetchPlanById(supabase, teamRow.plan_id);
            if (plan) {
                // Mark that this license is inherited from team
                team.licenseInheritedFromTeam = true;

                return {
                    // Synthesized — no personal user_licenses row exists yet.
                    // The activate endpoint will create one when needed.
                    id: team.teamId,
                    userId: userId,
                    planId: teamRow.plan_id,
                    licenseKey: null, // Team-inherited, no personal key yet
                    status: "active",
                    billingCycle: null,
                    currentPeriodStart: null,
                    currentPeriodEnd: null,
                    aiCallsUsed: 0,
                    tokensUsed: 0,
                    teamId: team.teamId,
                    source: "team_inherited",
                    plan: normalizePlan(plan),
                };
            }
        }
    }

    // ── Step 3: No license found ──
    return null;
}

/**
 * Fetch a plan by ID.
 */
async function fetchPlanById(
    supabase: ReturnType<typeof createServiceRoleClient>,
    planId: string
): Promise<Record<string, any> | null> {
    const { data: plan, error: planError } = await (
        supabase.from("plans") as any
    )
        .select("*")
        .eq("id", planId)
        .single();

    if (planError || !plan) return null;
    return plan;
}

/**
 * Normalize a raw plan row into the typed plan shape.
 */
function normalizePlan(plan: Record<string, any>): DesktopLicense["plan"] {
    return {
        id: plan.id,
        name: plan.name,
        features: plan.features || [],
        maxAgents: plan.max_agents || 1,
        maxDevices: plan.max_devices || 1,
        maxAiCallsPerMonth: plan.max_ai_calls_per_month || 0,
        maxTokenUsagePerMonth: plan.max_token_usage_per_month || 0,
        maxConversationsPerMonth: plan.max_conversations_per_month || 0,
    };
}

// =============================================================================
// DEVICE OPERATIONS
// =============================================================================

/**
 * Fetch a specific device activation.
 */
export async function fetchDeviceActivation(
    supabase: ReturnType<typeof createServiceRoleClient>,
    licenseId: string,
    deviceId: string
): Promise<DeviceActivation | null> {
    const { data, error } = await (
        supabase.from("license_activations") as any
    )
        .select("*")
        .eq("license_id", licenseId)
        .eq("device_id", deviceId)
        .eq("is_active", true)
        .maybeSingle();

    if (error || !data) return null;

    return {
        id: data.id,
        licenseId: data.license_id,
        deviceId: data.device_id,
        deviceName: data.device_name,
        deviceType: data.device_type,
        platform: data.platform,
        platformVersion: data.platform_version,
        appVersion: data.app_version,
        isActive: data.is_active,
        lastSeenAt: data.last_seen_at,
        createdAt: data.created_at,
    };
}

/**
 * Find a device activation by device_id across ALL of a user's licenses.
 * Used for team-inherited scenarios where the activation is on a personal
 * free-tier license row, not the team's plan.
 */
export async function fetchDeviceActivationByUser(
    supabase: ReturnType<typeof createServiceRoleClient>,
    userId: string,
    deviceId: string
): Promise<any | null> {
    const { data } = await supabase.from("license_activations")
        .select("*, user_licenses!inner(user_id)")
        .eq("device_id", deviceId)
        .eq("is_active", true)
        .eq("user_licenses.user_id", userId)
        .maybeSingle();

    return data || null;
}

/**
 * Count active devices for a license.
 */
export async function countActiveDevices(
    supabase: ReturnType<typeof createServiceRoleClient>,
    licenseId: string
): Promise<number> {
    const { count, error } = await (
        supabase.from("license_activations") as any
    )
        .select("*", { count: "exact", head: true })
        .eq("license_id", licenseId)
        .eq("is_active", true);

    if (error) return 0;
    return count || 0;
}

/**
 * Check if a specific token JTI has been revoked.
 */
export async function isTokenRevoked(
    supabase: ReturnType<typeof createServiceRoleClient>,
    jti: string
): Promise<boolean> {
    const { data, error } = await (
        supabase.from("desktop_license_tokens") as any
    )
        .select("is_revoked")
        .eq("token_jti", jti)
        .maybeSingle();

    if (error || !data) return false;
    return data.is_revoked === true;
}

/**
 * Record a new token issuance in the audit trail.
 */
export async function recordTokenIssuance(
    supabase: ReturnType<typeof createServiceRoleClient>,
    params: {
        licenseId: string;
        deviceId: string;
        activationId: string;
        tokenJti: string;
        issuedAt: Date;
        expiresAt: Date;
        ipAddress: string;
        userAgent: string;
    }
): Promise<void> {
    const { error } = await (
        supabase.from("desktop_license_tokens") as any
    ).insert({
        license_id: params.licenseId,
        device_id: params.deviceId,
        activation_id: params.activationId,
        token_jti: params.tokenJti,
        issued_at: params.issuedAt.toISOString(),
        expires_at: params.expiresAt.toISOString(),
        ip_address: params.ipAddress,
        user_agent: params.userAgent,
    });

    if (error) {
        console.error("[desktop-auth] Failed to record token issuance:", error);
        // Non-fatal — don't block the request
    }
}

/**
 * Get all license IDs belonging to a user.
 * Used for fallback device lookups and token revocation.
 */
export async function getUserLicenseIds(
    supabase: ReturnType<typeof createServiceRoleClient>,
    userId: string
): Promise<string[]> {
    const { data } = await supabase.from("user_licenses")
        .select("id")
        .eq("user_id", userId);

    if (!data || data.length === 0) return [];
    return data.map((l: any) => l.id);
}

// =============================================================================
// MANAGED AI CLAIMS (shared across activate + refresh)
// =============================================================================

/**
 * Build managed AI claims for inclusion in the signed OLT.
 * Extracted here so activate and refresh don't duplicate this logic.
 */
export async function buildManagedAiClaims(
    supabase: ReturnType<typeof createServiceRoleClient>,
    userId: string,
    license: DesktopLicense
): Promise<ManagedAiClaims | undefined> {
    try {
        // Fetch user's AI preferences
        const { data: prefs } = await supabase.from("user_ai_preferences")
            .select("daily_spend_limit, monthly_spend_limit")
            .eq("user_id", userId)
            .maybeSingle();

        // Fetch active managed AI keys
        const { data: aiKeys } = await supabase.from("managed_ai_keys")
            .select("provider, model_ids")
            .eq("is_active", true);

        if (!aiKeys || aiKeys.length === 0) {
            return undefined;
        }

        const allowedProviders = [...new Set(aiKeys.map((k: any) => k.provider))] as string[];
        const allowedModels = aiKeys.flatMap((k: any) => k.model_ids || []) as string[];

        // Calculate remaining quotas
        const remainingAiCalls = Math.max(
            0,
            license.plan.maxAiCallsPerMonth - (license.aiCallsUsed || 0)
        );
        const remainingTokens = Math.max(
            0,
            license.plan.maxTokenUsagePerMonth - (license.tokensUsed || 0)
        );

        return {
            enabled: true,
            allowed_providers: allowedProviders,
            allowed_models: allowedModels,
            max_ai_calls_remaining: remainingAiCalls,
            max_tokens_remaining: remainingTokens,
            // Use ?? (nullish coalescing) so explicit $0 limits are respected
            daily_limit_usd: prefs?.daily_spend_limit ?? 10.0,
            monthly_limit_usd: prefs?.monthly_spend_limit ?? 100.0,
        };
    } catch (error) {
        console.error("[desktop-auth] Failed to build managed AI claims:", error);
        return undefined;
    }
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get server config values for the desktop client.
 */
export function getServerConfig() {
    return {
        refresh_interval_hours: parseInt(
            process.env.LICENSE_REFRESH_INTERVAL_HOURS || "24",
            10
        ),
        offline_grace_days: parseInt(
            process.env.LICENSE_OFFLINE_GRACE_DAYS || "30",
            10
        ),
        heartbeat_interval_seconds: parseInt(
            process.env.LICENSE_HEARTBEAT_INTERVAL_SECONDS || "3600",
            10
        ),
        min_app_version: process.env.DESKTOP_API_MIN_APP_VERSION || "1.0.0",
        latest_app_version:
            process.env.DESKTOP_API_LATEST_APP_VERSION || "1.0.0",
        update_url:
            process.env.DESKTOP_API_UPDATE_URL || "https://oraya.app/download",
        update_required: false,
    };
}

/**
 * Semantic version comparison.
 * Returns true if `current` is older than `minimum`.
 */
export function isVersionTooOld(
    current: string,
    minimum: string
): boolean {
    const parseSemver = (v: string) => {
        const parts = v.replace(/^v/, "").split(".");
        return {
            major: parseInt(parts[0] || "0", 10),
            minor: parseInt(parts[1] || "0", 10),
            patch: parseInt(parts[2] || "0", 10),
        };
    };

    const cur = parseSemver(current);
    const min = parseSemver(minimum);

    if (cur.major !== min.major) return cur.major < min.major;
    if (cur.minor !== min.minor) return cur.minor < min.minor;
    return cur.patch < min.patch;
}

/**
 * Ensure a free license exists for a user.
 * Called during activation when the user has no license at all,
 * or when a team-inherited user needs a personal license row
 * to anchor device activations.
 */
export async function ensureFreeLicense(
    supabase: ReturnType<typeof createServiceRoleClient>,
    userId: string
): Promise<DesktopLicense | null> {
    // Check if user already has ANY personal license
    const { data: existing } = await supabase.from("user_licenses")
        .select("*, plans!inner(*)")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (existing) {
        return {
            id: existing.id,
            userId: existing.user_id,
            planId: existing.plan_id,
            licenseKey: existing.license_key,
            status: existing.status,
            billingCycle: existing.billing_cycle,
            currentPeriodStart: existing.current_period_start,
            currentPeriodEnd: existing.current_period_end,
            aiCallsUsed: existing.ai_calls_used || 0,
            tokensUsed: existing.tokens_used || 0,
            teamId: null,
            source: "personal",
            plan: normalizePlan(existing.plans),
        };
    }

    // Check if "free" plan exists
    const { data: freePlan, error: planError } = await (
        supabase.from("plans") as any
    )
        .select("*")
        .eq("id", "free")
        .single();

    if (planError || !freePlan) {
        console.error(
            "[desktop-auth] Free plan not found in database. Cannot auto-create license."
        );
        return null;
    }

    // Generate a cryptographically secure license key
    const licenseKey = generateLicenseKey();

    // Create the license — billing_cycle matches the DB constraint
    const { data: newLicense, error: insertError } = await (
        supabase.from("user_licenses") as any
    ).insert({
        user_id: userId,
        plan_id: "free",
        license_key: licenseKey,
        status: "active",
        billing_cycle: "lifetime", // Free plan = lifetime (valid DB enum value)
        ai_calls_used: 0,
        tokens_used: 0,
    }).select().single();

    if (insertError || !newLicense) {
        console.error(
            "[desktop-auth] Failed to create free license:",
            insertError
        );
        return null;
    }

    return {
        id: newLicense.id,
        userId: newLicense.user_id,
        planId: "free",
        licenseKey: newLicense.license_key,
        status: "active",
        billingCycle: "lifetime",
        currentPeriodStart: null,
        currentPeriodEnd: null,
        aiCallsUsed: 0,
        tokensUsed: 0,
        teamId: null,
        source: "personal",
        plan: normalizePlan(freePlan),
    };
}

/**
 * Generate a license key in the format: ORA-XXXX-XXXX-XXXX-XXXX
 * Uses crypto.randomBytes() for cryptographic security.
 */
function generateLicenseKey(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I, O, 0, 1 to avoid confusion
    const bytes = randomBytes(16); // 16 random bytes
    const segments: string[] = [];
    for (let s = 0; s < 4; s++) {
        let segment = "";
        for (let i = 0; i < 4; i++) {
            const idx = s * 4 + i;
            segment += chars[bytes[idx] % chars.length];
        }
        segments.push(segment);
    }
    return `ORA-${segments.join("-")}`;
}
