import { NextResponse } from "next/server";
import { authenticateBridge, hasScope, scopeError } from "@/lib/bridge/auth";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// API Key Management
// Let users create, list, and revoke their API keys.
// These keys are how the desktop app (and future integrations
// like Cursor, Windsurf, Notion) authenticate to the bridge.
//
// GET    /api/v1/keys        → List all keys (masked)
// POST   /api/v1/keys        → Create a new key
// DELETE /api/v1/keys        → Revoke a key by ID
// ─────────────────────────────────────────────────────────────

export async function GET(request: Request) {
    try {
        const { auth, error } = await authenticateBridge(request);
        if (error) return error;

        if (!hasScope(auth, "read")) return scopeError("read");

        const { data: keys } = await (auth.supabase
            .from("api_keys") as any)
            .select(
                "id, key_name, api_key_prefix, scopes, is_active, last_used_at, total_requests, expires_at, created_at"
            )
            .eq("user_id", auth.user_id)
            .order("created_at", { ascending: false });

        return NextResponse.json({
            keys: (keys || []).map((k: Record<string, unknown>) => ({
                ...k,
                // Never expose full key — only prefix
                api_key: `${k.api_key_prefix}...`,
            })),
            total: keys?.length || 0,
        });
    } catch (error) {
        console.error("API key list error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const { auth, error } = await authenticateBridge(request);
        if (error) return error;

        if (!hasScope(auth, "write")) return scopeError("write");

        const body = await request.json();
        const { key_name, scopes, expires_in_days } = body;

        if (!key_name || typeof key_name !== "string" || key_name.length < 2) {
            return NextResponse.json(
                { error: "key_name is required (min 2 characters)" },
                { status: 400 }
            );
        }

        // Validate scopes
        const validScopes = ["read", "write", "use_tokens", "admin"];
        const requestedScopes = scopes || ["read", "write", "use_tokens"];
        const invalidScopes = requestedScopes.filter(
            (s: string) => !validScopes.includes(s)
        );
        if (invalidScopes.length > 0) {
            return NextResponse.json(
                {
                    error: `Invalid scopes: ${invalidScopes.join(", ")}`,
                    valid_scopes: validScopes,
                },
                { status: 400 }
            );
        }

        // Calculate expiry
        let expiresAt: string | null = null;
        if (expires_in_days && typeof expires_in_days === "number") {
            expiresAt = new Date(
                Date.now() + expires_in_days * 24 * 60 * 60 * 1000
            ).toISOString();
        }

        // Check key name uniqueness for this user
        const { data: existing } = await (auth.supabase
            .from("api_keys") as any)
            .select("id")
            .eq("user_id", auth.user_id)
            .eq("key_name", key_name)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: "You already have a key with this name" },
                { status: 409 }
            );
        }

        // Create the key — the DB trigger auto-generates the actual key value
        const { data: newKey, error: createError } = await (auth.supabase
            .from("api_keys") as any)
            .insert({
                user_id: auth.user_id,
                key_name,
                scopes: requestedScopes,
                expires_at: expiresAt,
                is_active: true,
            })
            .select("id, key_name, api_key, api_key_prefix, scopes, expires_at, created_at")
            .single();

        if (createError) {
            console.error("API key creation error:", createError);
            return NextResponse.json(
                { error: "Failed to create API key" },
                { status: 500 }
            );
        }

        // IMPORTANT: This is the ONLY time the full key is returned.
        // After this, only the prefix is available.
        return NextResponse.json(
            {
                key: newKey,
                warning: "Save this API key now — it won't be shown again.",
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("API key creation error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { auth, error } = await authenticateBridge(request);
        if (error) return error;

        if (!hasScope(auth, "write")) return scopeError("write");

        const { searchParams } = new URL(request.url);
        const keyId = searchParams.get("key_id");

        if (!keyId) {
            return NextResponse.json(
                { error: "key_id query parameter is required" },
                { status: 400 }
            );
        }

        // Soft-delete: deactivate rather than delete
        const { error: updateError } = await (auth.supabase
            .from("api_keys") as any)
            .update({ is_active: false })
            .eq("id", keyId)
            .eq("user_id", auth.user_id);

        if (updateError) {
            return NextResponse.json(
                { error: "Failed to revoke key" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, revoked: true });
    } catch (error) {
        console.error("API key revocation error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
