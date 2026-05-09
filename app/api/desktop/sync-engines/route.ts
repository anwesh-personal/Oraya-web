import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
    authenticateDesktopRequest,
    isAuthError,
} from "@/lib/desktop-auth";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

/**
 * GET /api/desktop/sync-engines
 *
 * Same pattern as sync-agents: returns engine bundles assigned to the
 * authenticated user so the desktop app can auto-provision them.
 *
 * The desktop app calls this during its agent sync cycle. If an engine
 * is assigned, it auto-installs as a sovereign private node — no manual
 * ORAK key entry required.
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticateDesktopRequest(request);
        if (isAuthError(authResult)) {
            return authResult;
        }

        const userId = authResult.userId;
        const supabase = createServiceRoleClient();

        // Find active engine deployments for this user
        const { data: deployments, error: depError } = await supabase
            .from("engine_deployments")
            .select(`
                id,
                master_engine_id,
                status,
                master_engines (
                    id,
                    name,
                    description,
                    status
                )
            `)
            .eq("target_type", "user")
            .eq("target_id", userId)
            .eq("status", "active");

        if (depError) {
            throw depError;
        }

        if (!deployments || deployments.length === 0) {
            return NextResponse.json({ ok: true, engines: [] });
        }

        const engines = [];

        for (const dep of deployments) {
            const engine = dep.master_engines as any;
            if (!engine || engine.status !== "active") continue;

            // Fetch all provider slots for this engine
            const { data: slots, error: slotError } = await supabase
                .from("engine_provider_slots")
                .select(`
                    category,
                    selected_model,
                    is_enabled,
                    priority,
                    managed_ai_keys (
                        key_name,
                        provider
                    )
                `)
                .eq("engine_id", engine.id)
                .order("priority", { ascending: true });

            if (slotError) {
                logger.error("Failed to fetch engine slots", slotError, {
                    engine_id: engine.id,
                });
                continue;
            }

            // Build the model list from slots
            const models = (slots || []).map((slot: any) => ({
                name: slot.managed_ai_keys?.key_name || "Unknown",
                category: slot.category,
                selected_model: slot.selected_model || "",
                priority: slot.priority,
                is_enabled: slot.is_enabled,
            }));

            // Get or create an ORAK key for this user's engine access
            let orakKey = "";

            // Check if user already has an API key
            const { data: existingKey } = await supabase
                .from("api_keys")
                .select("api_key")
                .eq("user_id", userId)
                .eq("is_active", true)
                .limit(1)
                .single();

            if (existingKey?.api_key) {
                orakKey = existingKey.api_key;
            } else {
                // Create a new ORAK key for this user
                const { data: newKey, error: keyError } = await supabase
                    .from("api_keys")
                    .insert({
                        user_id: userId,
                        key_name: `${engine.name} Access Key`,
                        is_active: true,
                    })
                    .select("api_key")
                    .single();

                if (keyError) {
                    logger.error("Failed to create ORAK key", keyError, {
                        user_id: userId,
                    });
                    continue;
                }
                orakKey = newKey?.api_key || "";
            }

            // Determine gateway URL from engine description or use default
            // The gateway_url is typically the GB10 inference gateway
            const gatewayUrl =
                engine.description?.match(
                    /https?:\/\/[^\s,]+/
                )?.[0] || "http://192.168.1.127:3000";

            engines.push({
                engine_name: engine.name,
                gateway_url: gatewayUrl,
                orak_key: orakKey,
                models,
                rate_limits: null,
                wallet: null,
            });
        }

        return NextResponse.json({ ok: true, engines });
    } catch (error) {
        logger.error("Sync engines failed", error, {
            endpoint: "sync-engines",
        });
        return NextResponse.json(
            { error: "Internal server error", code: "INTERNAL_ERROR" },
            { status: 500 }
        );
    }
}
