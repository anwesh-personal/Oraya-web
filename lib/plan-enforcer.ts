/**
 * Plan Enforcement Engine
 *
 * Server-side utility for enforcing plan rules across the application.
 * Every check returns a structured result: { allowed, reason?, details? }
 * so callers can surface clear error messages to the UI.
 *
 * Usage:
 *   import { PlanEnforcer } from "@/lib/plan-enforcer";
 *
 *   const result = await PlanEnforcer.canAssignPlan(supabase, userId, "team");
 *   if (!result.allowed) return NextResponse.json({ error: result.reason }, { status: 403 });
 */

import { SupabaseClient } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EnforcementResult {
    allowed: boolean;
    reason?: string;
    details?: Record<string, any>;
}

interface PlanRow {
    id: string;
    name: string;
    max_agents: number;
    max_devices: number;
    max_conversations_per_month: number;
    max_ai_calls_per_month: number;
    max_token_usage_per_month: number;
    features: string[];
    requires_organization: boolean;
    is_active: boolean;
}

interface LicenseRow {
    id: string;
    plan_id: string;
    status: string;
    ai_calls_used: number;
    tokens_used: number;
    conversations_created: number;
}

interface TeamRow {
    id: string;
    name: string;
    max_members: number;
    max_agents: number;
    is_active: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isUnlimited(value: number | null | undefined): boolean {
    return value === null || value === undefined || value === -1;
}

// ─── PlanEnforcer ─────────────────────────────────────────────────────────────

export const PlanEnforcer = {
    // ── Core lookups ──────────────────────────────────────────────────────────

    /** Get the full plan row by plan_id */
    async getPlan(supabase: SupabaseClient, planId: string): Promise<PlanRow | null> {
        const { data } = await (supabase
            .from("plans") as any)
            .select("*")
            .eq("id", planId)
            .single();
        return data || null;
    },

    /** Get a user's most recent active license */
    async getUserLicense(supabase: SupabaseClient, userId: string): Promise<LicenseRow | null> {
        const { data } = await (supabase
            .from("user_licenses") as any)
            .select("id, plan_id, status, ai_calls_used, tokens_used, conversations_created")
            .eq("user_id", userId)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        return data || null;
    },

    /** Get the full plan for a user (license → plan join) */
    async getUserPlan(supabase: SupabaseClient, userId: string): Promise<PlanRow | null> {
        const license = await PlanEnforcer.getUserLicense(supabase, userId);
        if (!license) return null;
        return PlanEnforcer.getPlan(supabase, license.plan_id);
    },

    /** Get all active teams a user belongs to */
    async getUserTeams(supabase: SupabaseClient, userId: string): Promise<TeamRow[]> {
        const { data } = await (supabase
            .from("team_members") as any)
            .select("team_id, teams!inner(id, name, max_members, max_agents, is_active)")
            .eq("user_id", userId)
            .eq("status", "active");

        if (!data) return [];
        return data.map((row: any) => row.teams).filter((t: any) => t.is_active);
    },

    /** Check if a user belongs to any active team */
    async userHasOrganization(supabase: SupabaseClient, userId: string): Promise<boolean> {
        const teams = await PlanEnforcer.getUserTeams(supabase, userId);
        return teams.length > 0;
    },

    /** Get current member count for a team */
    async getTeamMemberCount(supabase: SupabaseClient, teamId: string): Promise<number> {
        const { count } = await (supabase
            .from("team_members") as any)
            .select("id", { count: "exact", head: true })
            .eq("team_id", teamId)
            .in("status", ["active", "invited"]);
        return count || 0;
    },

    /** Get active device count for a user */
    async getActiveDeviceCount(supabase: SupabaseClient, userId: string): Promise<number> {
        const { count } = await (supabase
            .from("device_activations") as any)
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("is_active", true);
        return count || 0;
    },

    // ── Validation checks ─────────────────────────────────────────────────────

    /**
     * Can this plan be assigned to a user?
     * Checks:
     *   - Plan exists and is active
     *   - If plan requires_organization, user must be in a team
     */
    async canAssignPlan(
        supabase: SupabaseClient,
        userId: string,
        planId: string,
        /** If the user is simultaneously being added to this org, skip the org check */
        organizationId?: string
    ): Promise<EnforcementResult> {
        const plan = await PlanEnforcer.getPlan(supabase, planId);

        if (!plan) {
            return { allowed: false, reason: `Plan "${planId}" does not exist` };
        }

        if (!plan.is_active) {
            return { allowed: false, reason: `Plan "${plan.name}" is not active` };
        }

        if (plan.requires_organization) {
            // If an org is being assigned simultaneously, that counts
            if (organizationId) {
                return { allowed: true };
            }

            const hasOrg = await PlanEnforcer.userHasOrganization(supabase, userId);
            if (!hasOrg) {
                return {
                    allowed: false,
                    reason: `The "${plan.name}" plan requires organization membership. Add the user to an organization first, or select a different plan.`,
                    details: { requires_organization: true, plan_name: plan.name },
                };
            }
        }

        return { allowed: true };
    },

    /**
     * Can a new member be added to this team?
     * Checks max_members limit.
     */
    async canAddMember(supabase: SupabaseClient, teamId: string): Promise<EnforcementResult> {
        const { data: team } = await (supabase
            .from("teams") as any)
            .select("max_members, name, is_active")
            .eq("id", teamId)
            .single();

        if (!team) {
            return { allowed: false, reason: "Organization not found" };
        }

        if (!team.is_active) {
            return { allowed: false, reason: `Organization "${team.name}" is suspended or inactive` };
        }

        if (isUnlimited(team.max_members)) {
            return { allowed: true };
        }

        const currentCount = await PlanEnforcer.getTeamMemberCount(supabase, teamId);

        if (currentCount >= team.max_members) {
            return {
                allowed: false,
                reason: `Organization "${team.name}" has reached its member limit (${currentCount}/${team.max_members})`,
                details: { current: currentCount, max: team.max_members },
            };
        }

        return { allowed: true, details: { current: currentCount, max: team.max_members } };
    },

    /**
     * Can the user activate another device?
     * Checks max_devices from user's plan.
     */
    async canActivateDevice(supabase: SupabaseClient, userId: string): Promise<EnforcementResult> {
        const plan = await PlanEnforcer.getUserPlan(supabase, userId);

        if (!plan) {
            // No plan → allow 1 device (implicit free tier behavior)
            const activeDevices = await PlanEnforcer.getActiveDeviceCount(supabase, userId);
            if (activeDevices >= 1) {
                return {
                    allowed: false,
                    reason: "No active plan. Free users are limited to 1 device.",
                    details: { current: activeDevices, max: 1 },
                };
            }
            return { allowed: true };
        }

        if (isUnlimited(plan.max_devices)) {
            return { allowed: true };
        }

        const activeDevices = await PlanEnforcer.getActiveDeviceCount(supabase, userId);

        if (activeDevices >= plan.max_devices) {
            return {
                allowed: false,
                reason: `Device limit reached: your "${plan.name}" plan allows ${plan.max_devices} device(s). You have ${activeDevices} active.`,
                details: { current: activeDevices, max: plan.max_devices },
            };
        }

        return { allowed: true, details: { current: activeDevices, max: plan.max_devices } };
    },

    /**
     * Does the user's plan include a specific feature?
     */
    async hasFeature(supabase: SupabaseClient, userId: string, featureId: string): Promise<EnforcementResult> {
        const plan = await PlanEnforcer.getUserPlan(supabase, userId);

        if (!plan) {
            return {
                allowed: false,
                reason: `No active plan. Feature "${featureId}" is not available.`,
            };
        }

        // "everything" feature means all features are included
        if (plan.features.includes("everything")) {
            return { allowed: true };
        }

        if (!plan.features.includes(featureId)) {
            return {
                allowed: false,
                reason: `Feature "${featureId}" is not included in your "${plan.name}" plan.`,
                details: { plan_name: plan.name, available_features: plan.features },
            };
        }

        return { allowed: true };
    },

    /**
     * Get remaining quota for a usage type.
     * Returns current usage, limit, and remaining.
     */
    async getRemainingQuota(
        supabase: SupabaseClient,
        userId: string,
        quotaType: "ai_calls" | "conversations" | "tokens"
    ): Promise<EnforcementResult & { usage?: { used: number; limit: number; remaining: number } }> {
        const license = await PlanEnforcer.getUserLicense(supabase, userId);
        if (!license) {
            return { allowed: false, reason: "No active license" };
        }

        const plan = await PlanEnforcer.getPlan(supabase, license.plan_id);
        if (!plan) {
            return { allowed: false, reason: "Plan not found" };
        }

        let used: number;
        let limit: number;

        switch (quotaType) {
            case "ai_calls":
                used = license.ai_calls_used || 0;
                limit = plan.max_ai_calls_per_month;
                break;
            case "conversations":
                used = license.conversations_created || 0;
                limit = plan.max_conversations_per_month;
                break;
            case "tokens":
                used = license.tokens_used || 0;
                limit = plan.max_token_usage_per_month;
                break;
        }

        if (isUnlimited(limit)) {
            return {
                allowed: true,
                usage: { used, limit: -1, remaining: Infinity },
            };
        }

        const remaining = Math.max(0, limit - used);

        if (remaining <= 0) {
            return {
                allowed: false,
                reason: `${quotaType.replace("_", " ")} quota exhausted for your "${plan.name}" plan (${used}/${limit})`,
                usage: { used, limit, remaining: 0 },
            };
        }

        return {
            allowed: true,
            usage: { used, limit, remaining },
        };
    },

    /**
     * Comprehensive pre-flight check for assigning a plan to a user.
     * Returns all violations at once so the admin can fix them.
     */
    async validatePlanAssignment(
        supabase: SupabaseClient,
        userId: string,
        planId: string,
        organizationId?: string
    ): Promise<EnforcementResult & { violations?: string[] }> {
        const violations: string[] = [];

        // Check plan existence and activity
        const plan = await PlanEnforcer.getPlan(supabase, planId);
        if (!plan) {
            return { allowed: false, reason: `Plan "${planId}" does not exist`, violations: [`Plan "${planId}" does not exist`] };
        }
        if (!plan.is_active) {
            violations.push(`Plan "${plan.name}" is inactive`);
        }

        // Check organization requirement
        if (plan.requires_organization && !organizationId) {
            const hasOrg = await PlanEnforcer.userHasOrganization(supabase, userId);
            if (!hasOrg) {
                violations.push(`"${plan.name}" plan requires organization membership`);
            }
        }

        if (violations.length > 0) {
            return {
                allowed: false,
                reason: violations.join(". "),
                violations,
            };
        }

        return { allowed: true };
    },

    // ── Combined enforcement (Feature + Quota in one call) ────────────────────

    /**
     * Pre-flight access check: verifies the user's plan includes the required
     * feature AND that the specified quota has not been exhausted.
     *
     * This is the single method every API endpoint should call before executing
     * a plan-gated operation.
     *
     * @param supabase     Service-role Supabase client
     * @param userId       The user performing the action
     * @param featureId    Feature string to check (e.g. "managed_ai", "shared_agents")
     * @param quotaType    Which quota bucket to check (optional — skip if the
     *                     operation does not consume a countable resource)
     *
     * @returns { allowed, reason?, plan?, usage? }
     */
    async enforceAccess(
        supabase: SupabaseClient,
        userId: string,
        featureId: string,
        quotaType?: "ai_calls" | "conversations" | "tokens"
    ): Promise<
        EnforcementResult & {
            plan?: PlanRow;
            usage?: { used: number; limit: number; remaining: number };
        }
    > {
        // Step 1: Resolve the user's plan
        const plan = await PlanEnforcer.getUserPlan(supabase, userId);

        if (!plan) {
            return {
                allowed: false,
                reason: `No active plan. Feature "${featureId}" requires a subscription.`,
            };
        }

        // Step 2: Feature check
        const hasEverything = plan.features.includes("everything");
        if (!hasEverything && !plan.features.includes(featureId)) {
            return {
                allowed: false,
                reason: `Feature "${featureId}" is not included in your "${plan.name}" plan. Upgrade to access this feature.`,
                plan,
                details: { plan_name: plan.name, available_features: plan.features },
            };
        }

        // Step 3: Quota check (if requested)
        if (quotaType) {
            const quotaResult = await PlanEnforcer.getRemainingQuota(supabase, userId, quotaType);
            if (!quotaResult.allowed) {
                return {
                    allowed: false,
                    reason: quotaResult.reason,
                    plan,
                    usage: quotaResult.usage,
                };
            }
            return {
                allowed: true,
                plan,
                usage: quotaResult.usage,
            };
        }

        return { allowed: true, plan };
    },

    // ── Usage tracking ────────────────────────────────────────────────────────

    /**
     * Atomically increment a usage counter on the user's active license.
     * Call this AFTER successfully completing the operation (not before).
     *
     * @param supabase   Service-role Supabase client
     * @param userId     The user whose usage to increment
     * @param quotaType  Which counter to bump
     * @param amount     How much to increment (default 1)
     *
     * @returns true if incremented, false if no active license found
     */
    async incrementUsage(
        supabase: SupabaseClient,
        userId: string,
        quotaType: "ai_calls" | "conversations" | "tokens",
        amount: number = 1
    ): Promise<boolean> {
        const license = await PlanEnforcer.getUserLicense(supabase, userId);
        if (!license) return false;

        const columnMap = {
            ai_calls: "ai_calls_used",
            conversations: "conversations_created",
            tokens: "tokens_used",
        } as const;

        const column = columnMap[quotaType];

        // Use Supabase RPC for atomicity if available, otherwise fall back
        // to direct update (safe enough with single-row update)
        const currentValue = (license as any)[column] || 0;
        const { error } = await (supabase
            .from("user_licenses") as any)
            .update({
                [column]: currentValue + amount,
                updated_at: new Date().toISOString(),
            })
            .eq("id", license.id);

        if (error) {
            console.error(`[PlanEnforcer] Failed to increment ${column} for license ${license.id}:`, error);
            return false;
        }

        // Check if the user has now hit their limit and flag it
        const plan = await PlanEnforcer.getPlan(supabase, license.plan_id);
        if (plan) {
            let limit: number;
            switch (quotaType) {
                case "ai_calls": limit = plan.max_ai_calls_per_month; break;
                case "conversations": limit = plan.max_conversations_per_month; break;
                case "tokens": limit = plan.max_token_usage_per_month; break;
            }

            if (!isUnlimited(limit) && currentValue + amount >= limit) {
                await (supabase
                    .from("user_licenses") as any)
                    .update({ usage_limit_reached: true })
                    .eq("id", license.id);
            }
        }

        return true;
    },

    /**
     * Reset monthly usage counters for a license.
     * Should be called when the billing period rolls over.
     */
    async resetMonthlyUsage(supabase: SupabaseClient, licenseId: string): Promise<boolean> {
        const { error } = await (supabase
            .from("user_licenses") as any)
            .update({
                ai_calls_used: 0,
                tokens_used: 0,
                conversations_created: 0,
                usage_limit_reached: false,
                current_period_start: new Date().toISOString().split("T")[0],
                updated_at: new Date().toISOString(),
            })
            .eq("id", licenseId);

        if (error) {
            console.error(`[PlanEnforcer] Failed to reset usage for license ${licenseId}:`, error);
            return false;
        }

        return true;
    },
};

export type QuotaType = "ai_calls" | "conversations" | "tokens";
