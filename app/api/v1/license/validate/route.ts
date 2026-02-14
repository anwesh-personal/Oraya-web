import { NextResponse } from "next/server";
import { authenticateBridge } from "@/lib/bridge/auth";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// POST /api/v1/license/validate
// Desktop app calls this on startup to verify license + register device.
//
// Headers:
//   X-License-Key: ORA-XXXXXXXXXXXXXXXXXX
//   X-Device-ID: device-uuid
//
// Body: {
//   device_name: "MacBook Pro",
//   device_type: "desktop",
//   platform: "macos",
//   platform_version: "14.2",
//   app_version: "1.0.0"
// }
//
// Returns:
//   - License status (active/expired/cancelled/etc.)
//   - Plan details (name, limits, features)
//   - Device activation status (activated/denied/over limit)
//   - Server time for clock sync
// ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
    try {
        // 1. Authenticate
        const { auth, error } = await authenticateBridge(request);
        if (error) return error;

        const { supabase, user_id, license_id, device_id } = auth;

        if (!license_id) {
            return NextResponse.json(
                { error: "License key authentication required for this endpoint" },
                { status: 400 }
            );
        }

        if (!device_id) {
            return NextResponse.json(
                { error: "X-Device-ID header is required" },
                { status: 400 }
            );
        }

        // 2. Get license + plan details
        const { data: license, error: licenseError } = await supabase
            .from("user_licenses")
            .select(`
                id,
                plan_id,
                status,
                billing_cycle,
                is_trial,
                trial_ends_at,
                current_period_start,
                current_period_end,
                ai_calls_used,
                tokens_used,
                usage_limit_reached,
                expires_at,
                plans (
                    id,
                    name,
                    max_agents,
                    max_conversations_per_month,
                    max_ai_calls_per_month,
                    max_token_usage_per_month,
                    max_devices,
                    features
                )
            `)
            .eq("id", license_id)
            .single();

        if (licenseError || !license) {
            return NextResponse.json(
                { error: "License not found" },
                { status: 404 }
            );
        }

        // 3. Check license status
        if (license.status !== "active") {
            return NextResponse.json({
                valid: false,
                license_status: license.status,
                reason: `License is ${license.status}`,
                plan: license.plans,
                server_time: new Date().toISOString(),
            });
        }

        // 4. Check trial expiration
        if (license.is_trial && license.trial_ends_at) {
            const trialEnd = new Date(license.trial_ends_at);
            if (trialEnd < new Date()) {
                // Expire the trial
                await supabase
                    .from("user_licenses")
                    .update({ status: "expired" })
                    .eq("id", license_id);

                return NextResponse.json({
                    valid: false,
                    license_status: "expired",
                    reason: "Trial period has ended",
                    trial_ended_at: license.trial_ends_at,
                    plan: license.plans,
                    server_time: new Date().toISOString(),
                });
            }
        }

        // 5. Parse body for device info
        let deviceInfo = {
            device_name: "Unknown Device",
            device_type: "desktop",
            platform: "unknown",
            platform_version: "",
            app_version: "",
        };
        try {
            const body = await request.json();
            deviceInfo = { ...deviceInfo, ...body };
        } catch {
            // Body is optional for validation-only checks
        }

        // 6. Handle device activation
        // Supabase joins return arrays; plans is a foreign key so take first
        const planData = license.plans;
        const plan = (Array.isArray(planData) ? planData[0] : planData) as Record<string, unknown> | null;
        const maxDevices = (plan?.max_devices as number) || 1;

        // Check existing activation for this device
        const { data: existingActivation } = await supabase
            .from("license_activations")
            .select("id, is_active, last_seen_at")
            .eq("license_id", license_id)
            .eq("device_id", device_id)
            .single();

        if (existingActivation) {
            // Device already registered — update heartbeat
            await supabase
                .from("license_activations")
                .update({
                    is_active: true,
                    last_seen_at: new Date().toISOString(),
                    device_name: deviceInfo.device_name,
                    app_version: deviceInfo.app_version,
                    platform_version: deviceInfo.platform_version,
                    ip_address: request.headers.get("x-forwarded-for")?.split(",")[0] || null,
                })
                .eq("id", existingActivation.id);
        } else {
            // New device — check device limit
            const { count: activeDeviceCount } = await supabase
                .from("license_activations")
                .select("id", { count: "exact", head: true })
                .eq("license_id", license_id)
                .eq("is_active", true);

            if (maxDevices !== -1 && (activeDeviceCount || 0) >= maxDevices) {
                return NextResponse.json({
                    valid: false,
                    license_status: "active",
                    reason: "Device limit reached",
                    max_devices: maxDevices,
                    active_devices: activeDeviceCount,
                    plan: plan,
                    server_time: new Date().toISOString(),
                });
            }

            // Register the device
            await supabase.from("license_activations").insert({
                license_id: license_id,
                device_id: device_id,
                device_name: deviceInfo.device_name,
                device_type: deviceInfo.device_type,
                platform: deviceInfo.platform,
                platform_version: deviceInfo.platform_version,
                app_version: deviceInfo.app_version,
                ip_address: request.headers.get("x-forwarded-for")?.split(",")[0] || null,
                user_agent: request.headers.get("user-agent"),
                is_active: true,
            });
        }

        // 7. Get token balance
        const { data: wallet } = await supabase
            .from("token_wallets")
            .select("token_balance, is_frozen")
            .eq("user_id", user_id)
            .single();

        // 8. Return full validation result
        return NextResponse.json({
            valid: true,
            license_status: "active",
            plan: {
                id: plan?.id,
                name: plan?.name,
                max_agents: plan?.max_agents,
                max_conversations_per_month: plan?.max_conversations_per_month,
                max_ai_calls_per_month: plan?.max_ai_calls_per_month,
                max_token_usage_per_month: plan?.max_token_usage_per_month,
                max_devices: plan?.max_devices,
                features: plan?.features,
            },
            billing: {
                cycle: license.billing_cycle,
                is_trial: license.is_trial,
                trial_ends_at: license.trial_ends_at,
                current_period_end: license.current_period_end,
            },
            usage: {
                ai_calls_used: license.ai_calls_used,
                tokens_used: license.tokens_used,
                usage_limit_reached: license.usage_limit_reached,
            },
            wallet: {
                token_balance: wallet?.token_balance || 0,
                is_frozen: wallet?.is_frozen || false,
            },
            device: {
                device_id: device_id,
                status: existingActivation ? "known" : "newly_registered",
            },
            server_time: new Date().toISOString(),
        });
    } catch (error) {
        console.error("License validation error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
