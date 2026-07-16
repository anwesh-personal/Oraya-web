// ============================================================================
// ORAK Key Validation — Gateway endpoint for Oraya desktop app + SaaS self-validation
// Called by:
//   1. Tauri app → https://myoraya.space/api/v1/keys/validate (Bearer ORAK key)
//   2. SaaS ProviderHub → internal validation when adding Oraya as a provider
//
// Returns: { valid, engine, models[] }
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Default ORAK model manifest — these are the models routed through the gateway
const ORAK_MODELS = [
    { name: "oraya-spark", category: "llm", is_enabled: true },
    { name: "oraya-core", category: "llm", is_enabled: true },
    { name: "oraya-rune", category: "llm", is_enabled: true },
    { name: "oraya-rune-flash", category: "llm", is_enabled: true },
    { name: "oraya-iris", category: "vision", is_enabled: true },
    { name: "oraya-prism", category: "image", is_enabled: true },
    { name: "oraya-voice", category: "tts", is_enabled: true },
];

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { valid: false, error: "Missing or invalid Authorization header" },
                { status: 401 }
            );
        }

        const orakKey = authHeader.replace("Bearer ", "").trim();
        if (!orakKey) {
            return NextResponse.json(
                { valid: false, error: "Empty ORAK key" },
                { status: 401 }
            );
        }

        // Look up the ORAK key in api_keys table
        const supabase = createServiceRoleClient();
        const { data: keyRecord, error: keyError } = await (supabase
            .from("api_keys") as any)
            .select("id, user_id, key_name, scopes, is_active, expires_at")
            .eq("api_key", orakKey)
            .eq("is_active", true)
            .single();

        if (keyError || !keyRecord) {
            return NextResponse.json(
                { valid: false, error: "Invalid or revoked ORAK key" },
                { status: 401 }
            );
        }

        // Check expiry
        if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
            return NextResponse.json(
                { valid: false, error: "ORAK key has expired" },
                { status: 401 }
            );
        }

        // Update last_used_at
        await (supabase.from("api_keys") as any)
            .update({
                last_used_at: new Date().toISOString(),
                total_requests: (keyRecord.total_requests || 0) + 1,
            })
            .eq("id", keyRecord.id);

        // Fetch user profile for engine name
        const { data: profile } = await (supabase
            .from("user_profiles") as any)
            .select("full_name, company_name")
            .eq("user_id", keyRecord.user_id)
            .single();

        const engineName = profile?.company_name
            ? `${profile.company_name} Engine`
            : profile?.full_name
                ? `${profile.full_name}'s Engine`
                : "Oraya Sovereign Engine";

        return NextResponse.json({
            valid: true,
            engine: {
                name: engineName,
                user_id: keyRecord.user_id,
            },
            models: ORAK_MODELS,
            key: {
                id: keyRecord.id,
                name: keyRecord.key_name,
                scopes: keyRecord.scopes,
            },
        });
    } catch (err: any) {
        console.error("[v1/keys/validate] Error:", err);
        return NextResponse.json(
            { valid: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
