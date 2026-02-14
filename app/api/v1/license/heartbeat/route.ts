import { NextResponse } from "next/server";
import { authenticateBridge, hasScope, scopeError } from "@/lib/bridge/auth";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// POST /api/v1/license/heartbeat
// Desktop app sends periodic heartbeats to keep device activation alive.
// Devices that miss heartbeats can be auto-deactivated.
//
// Headers:
//   Standard bridge auth (API Key, License Key, or JWT)
//   X-Device-ID: device-uuid
//
// Body (optional): {
//   app_version?: string,
//   platform_version?: string,
//   uptime_seconds?: number,
//   memory_usage_mb?: number
// }
//
// Returns: {
//   acknowledged: true,
//   next_heartbeat_in: number (seconds),
//   messages: string[] (any pending notifications)
// }
// ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
    try {
        const { auth, error } = await authenticateBridge(request);
        if (error) return error;

        if (!hasScope(auth, "read")) return scopeError("read");

        const deviceId = auth.device_id;
        if (!deviceId) {
            return NextResponse.json(
                { error: "X-Device-ID header is required" },
                { status: 400 }
            );
        }

        // Parse optional body
        let telemetry: Record<string, unknown> = {};
        try {
            telemetry = await request.json();
        } catch {
            // Body is optional
        }

        // Find activation for this device
        const { data: activation } = await auth.supabase
            .from("license_activations")
            .select("id, license_id, heartbeat_interval")
            .eq("device_id", deviceId)
            .eq("is_active", true)
            .single();

        if (!activation) {
            return NextResponse.json(
                {
                    error: "Device not registered",
                    hint: "Call POST /api/v1/license/validate first to register this device",
                },
                { status: 404 }
            );
        }

        // Update heartbeat
        await auth.supabase
            .from("license_activations")
            .update({
                last_seen_at: new Date().toISOString(),
                app_version: telemetry.app_version || undefined,
                platform_version: telemetry.platform_version || undefined,
                ip_address: request.headers.get("x-forwarded-for")?.split(",")[0] || null,
            })
            .eq("id", activation.id);

        // Check for any pending messages/notifications for this user
        const messages: string[] = [];

        // Check wallet balance
        const { data: wallet } = await auth.supabase
            .from("token_wallets")
            .select("token_balance, low_balance_threshold, is_frozen")
            .eq("user_id", auth.user_id)
            .single();

        if (wallet?.is_frozen) {
            messages.push("Your token wallet has been frozen. Contact support.");
        } else if (wallet && wallet.token_balance <= wallet.low_balance_threshold) {
            messages.push(`Low token balance: ${wallet.token_balance} tokens remaining`);
        }

        // Check license status
        const { data: license } = await auth.supabase
            .from("user_licenses")
            .select("status, is_trial, trial_ends_at, usage_limit_reached")
            .eq("id", activation.license_id)
            .single();

        if (license?.usage_limit_reached) {
            messages.push("You've reached your usage limit for this billing period.");
        }

        if (license?.is_trial && license?.trial_ends_at) {
            const daysLeft = Math.ceil(
                (new Date(license.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            if (daysLeft <= 3 && daysLeft > 0) {
                messages.push(`Your trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`);
            }
        }

        return NextResponse.json({
            acknowledged: true,
            next_heartbeat_in: activation.heartbeat_interval || 3600,
            messages,
            server_time: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Heartbeat error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
