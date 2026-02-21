import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { applyRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

/**
 * POST /api/license/activate-device
 * 
 * Step 1 of the new ORA Key unified auth flow.
 * Validates an ORA Key and registers the device.
 * Does NOT require Supabase auth (the ORA Key is the credential).
 */
export async function POST(request: NextRequest) {
    try {
        // Step 0: Rate limit
        const rateLimited = applyRateLimit(request, "activate-device");
        if (rateLimited) return rateLimited;

        // Step 1: Parse body
        const body = await request.json();
        const {
            ora_key,
            device_id,
            device_name,
            device_platform,
            device_platform_version,
            app_version
        } = body;

        if (!ora_key || !device_id) {
            return NextResponse.json(
                { error: "ora_key and device_id are required", code: "MISSING_PARAMS" },
                { status: 400 }
            );
        }

        const supabase = createServiceRoleClient();

        // Step 2: Validate ORA Key and get user info
        // We use the RPC helper defined in 019_ora_key.sql
        const { data: user, error: userError } = await (supabase
            .rpc("get_user_by_ora_key", { p_ora_key: ora_key }) as any)
            .single();

        if (userError || !user) {
            logger.warn("Invalid ORA Key activation attempt", { ora_key });
            return NextResponse.json(
                { error: "Invalid ORA Key. Please check the key and try again.", code: "INVALID_KEY" },
                { status: 401 }
            );
        }

        // Step 3: check if user is active
        if (user.account_status === 'suspended' || user.account_status === 'deleted') {
            return NextResponse.json(
                { error: "This account is no longer active.", code: "ACCOUNT_INACTIVE" },
                { status: 403 }
            );
        }

        // Step 4: Create or Update device activation
        // capturing IP and UA for security audit
        const ip_address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            request.headers.get("x-real-ip") ||
            "unknown";
        const user_agent = request.headers.get("user-agent") || "unknown";

        const { data: activation, error: activationError } = await (supabase
            .from("device_activations") as any)
            .upsert({
                user_id: user.user_id,
                ora_key: ora_key,
                device_id: device_id,
                device_name: device_name || "Unknown Device",
                device_platform: device_platform || "macos",
                device_platform_version: device_platform_version || "unknown",
                app_version: app_version || "0.0.0",
                is_active: true,
                last_seen_at: new Date().toISOString(),
                activated_at: new Date().toISOString(),
                ip_address: ip_address,
                user_agent: user_agent
            }, {
                onConflict: "user_id,device_id"
            })
            .select()
            .single();

        if (activationError) {
            logger.error("Failed to create device activation", activationError, { userId: user.user_id });
            return NextResponse.json(
                { error: "Failed to activate device. Please try again later.", code: "ACTIVATION_FAILED" },
                { status: 500 }
            );
        }

        logger.info("Device activated with ORA Key", {
            userId: user.user_id,
            deviceId: device_id,
            plan: user.plan_id
        });

        // Step 5: Return success with user mail (to pre-fill login screen)
        return NextResponse.json({
            success: true,
            user: {
                id: user.user_id,
                email: user.email,
                name: user.full_name,
                ora_key: ora_key,
            },
            plan_id: user.plan_id,
            license_status: user.license_status,
            activation_id: activation.id,
        });

    } catch (error) {
        logger.error("Unexpected error in device activation", error);
        return NextResponse.json(
            { error: "Internal server error", code: "INTERNAL_ERROR" },
            { status: 500 }
        );
    }
}
