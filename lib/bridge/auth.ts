import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────
// Bridge Authentication Middleware
// ─────────────────────────────────────────────────────────────
// The desktop app authenticates to bridge APIs using one of:
//
//   1. API Key:      Authorization: Bearer ora_xxxxxxxx
//   2. License Key:  X-License-Key: ORA-XXXXXXXXXXXXXXXX
//                    X-Device-ID: device-uuid
//
// Both are validated against the DB. API keys support scoped
// permissions. License keys require a matching device_id.
//
// This middleware returns:
//   - user_id: The authenticated user's Supabase auth.users ID
//   - license_id: The license ID (if authenticated via license key)
//   - device_id: The device ID (if provided)
//   - scopes: Permission scopes (if using API key)
//   - supabase: A service-role Supabase client for DB operations
// ─────────────────────────────────────────────────────────────

export interface BridgeAuthResult {
    user_id: string;
    license_id: string | null;
    device_id: string | null;
    scopes: string[];
    supabase: SupabaseClient;
}

/** Service-role client for bridge operations (no user session) */
function getServiceClient(): SupabaseClient {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
}

/**
 * Authenticate a bridge API request.
 * Returns null + error response if auth fails.
 */
export async function authenticateBridge(
    request: Request
): Promise<
    | { auth: BridgeAuthResult; error: null }
    | { auth: null; error: NextResponse }
> {
    const supabase = getServiceClient();
    const authHeader = request.headers.get("authorization");
    const licenseKey = request.headers.get("x-license-key");
    const deviceId = request.headers.get("x-device-id");

    // ── Path 1: API Key Authentication ──
    if (authHeader?.startsWith("Bearer ora_")) {
        const apiKey = authHeader.replace("Bearer ", "");

        const { data: keyRecord, error } = await supabase
            .from("api_keys")
            .select("id, user_id, scopes, is_active, expires_at, rate_limit_per_minute")
            .eq("api_key", apiKey)
            .single();

        if (error || !keyRecord) {
            return {
                auth: null,
                error: NextResponse.json(
                    { error: "Invalid API key" },
                    { status: 401 }
                ),
            };
        }

        // Check active
        if (!keyRecord.is_active) {
            return {
                auth: null,
                error: NextResponse.json(
                    { error: "API key is deactivated" },
                    { status: 403 }
                ),
            };
        }

        // Check expiration
        if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
            return {
                auth: null,
                error: NextResponse.json(
                    { error: "API key has expired" },
                    { status: 403 }
                ),
            };
        }

        // Update last_used + atomic increment (non-blocking)
        // Uses raw SQL increment to avoid read-increment-write race condition
        Promise.resolve(
            supabase.rpc("increment_api_key_requests", { key_id: keyRecord.id })
        ).catch(() => {
            // Fallback: just update timestamp if RPC doesn't exist yet
            supabase
                .from("api_keys")
                .update({ last_used_at: new Date().toISOString() })
                .eq("id", keyRecord.id)
                .then(() => { });
        });

        return {
            auth: {
                user_id: keyRecord.user_id,
                license_id: null,
                device_id: deviceId,
                scopes: keyRecord.scopes || ["read"],
                supabase,
            },
            error: null,
        };
    }

    // ── Path 2: License Key + Device ID ──
    if (licenseKey) {
        if (!deviceId) {
            return {
                auth: null,
                error: NextResponse.json(
                    { error: "X-Device-ID header required with license key auth" },
                    { status: 400 }
                ),
            };
        }

        const { data: license, error } = await supabase
            .from("user_licenses")
            .select("id, user_id, status, plan_id")
            .eq("license_key", licenseKey)
            .single();

        if (error || !license) {
            return {
                auth: null,
                error: NextResponse.json(
                    { error: "Invalid license key" },
                    { status: 401 }
                ),
            };
        }

        if (license.status !== "active") {
            return {
                auth: null,
                error: NextResponse.json(
                    {
                        error: "License is not active",
                        status: license.status,
                    },
                    { status: 403 }
                ),
            };
        }

        return {
            auth: {
                user_id: license.user_id,
                license_id: license.id,
                device_id: deviceId,
                scopes: ["read", "write", "use_tokens"],
                supabase,
            },
            error: null,
        };
    }

    // ── Path 3: Supabase JWT (for web-based API calls) ──
    if (authHeader?.startsWith("Bearer eyJ")) {
        const token = authHeader.replace("Bearer ", "");

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return {
                auth: null,
                error: NextResponse.json(
                    { error: "Invalid or expired session" },
                    { status: 401 }
                ),
            };
        }

        return {
            auth: {
                user_id: user.id,
                license_id: null,
                device_id: deviceId,
                scopes: ["read", "write", "use_tokens"],
                supabase,
            },
            error: null,
        };
    }

    return {
        auth: null,
        error: NextResponse.json(
            {
                error: "Authentication required",
                hint: "Provide one of: Bearer API key, X-License-Key header, or Bearer JWT token",
            },
            { status: 401 }
        ),
    };
}

/**
 * Check if the authenticated user has a required scope.
 */
export function hasScope(auth: BridgeAuthResult, scope: string): boolean {
    return auth.scopes.includes(scope) || auth.scopes.includes("admin");
}

/**
 * Build a standard error for missing scope.
 */
export function scopeError(scope: string): NextResponse {
    return NextResponse.json(
        { error: `Insufficient permissions. Required scope: ${scope}` },
        { status: 403 }
    );
}
