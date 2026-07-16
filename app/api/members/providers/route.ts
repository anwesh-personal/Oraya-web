// ============================================================================
// AI Provider CRUD — Manage user's own AI provider API keys
// Keys are encrypted with AES-256-CBC before storage.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// ─── Encryption helpers ─────────────────────────────────────────────────────

const ENCRYPTION_KEY = process.env.AI_PROVIDER_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || "oraya-default-key-change-in-production-32c";

function getKey(): Buffer {
    // Ensure 32 bytes for AES-256
    return crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
}

function encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", getKey(), iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
}

function decrypt(encrypted: string): string {
    const [ivHex, data] = encrypted.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", getKey(), iv);
    let decrypted = decipher.update(data, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}

function getKeyHint(key: string): string {
    if (key.length <= 4) return "••••";
    return "•••" + key.slice(-4);
}

// ─── GET: List user's providers ─────────────────────────────────────────────

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await (supabase as any)
            .from("user_ai_providers")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("[providers] GET error:", error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Never return encrypted keys — only hints
        const safe = (data || []).map((row: any) => ({
            ...row,
            api_key_encrypted: undefined,
            api_key_display: row.api_key_hint,
        }));

        return NextResponse.json({ providers: safe });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── POST: Add a new provider key ──────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { provider, label, api_key, base_url, available_models, is_valid } = body;

        if (!provider || !label || !api_key) {
            return NextResponse.json(
                { error: "provider, label, and api_key are required" },
                { status: 400 }
            );
        }

        const validProviders = ["openai", "anthropic", "google", "mistral", "xai", "custom"];
        if (!validProviders.includes(provider)) {
            return NextResponse.json(
                { error: `Invalid provider. Must be one of: ${validProviders.join(", ")}` },
                { status: 400 }
            );
        }

        if (provider === "custom" && !base_url) {
            return NextResponse.json(
                { error: "base_url is required for custom providers" },
                { status: 400 }
            );
        }

        const insertData: Record<string, any> = {
            user_id: user.id,
            provider,
            label: label.trim(),
            api_key_encrypted: encrypt(api_key),
            api_key_hint: getKeyHint(api_key),
            base_url: base_url || null,
            is_valid: is_valid === true,
            validated_at: is_valid ? new Date().toISOString() : null,
            available_models: available_models || [],
            models_fetched_at: available_models?.length ? new Date().toISOString() : null,
        };

        const { data, error } = await (supabase as any)
            .from("user_ai_providers")
            .insert(insertData)
            .select("*")
            .single();

        if (error) {
            console.error("[providers] POST error:", error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Strip encrypted key from response
        return NextResponse.json({
            provider: {
                ...data,
                api_key_encrypted: undefined,
                api_key_display: data.api_key_hint,
            },
        }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── PATCH: Update a provider ───────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: "Provider id is required" }, { status: 400 });
        }

        const safeUpdates: Record<string, any> = {};

        // Allowed fields
        if (updates.label !== undefined) safeUpdates.label = updates.label.trim();
        if (updates.is_active !== undefined) safeUpdates.is_active = updates.is_active;
        if (updates.base_url !== undefined) safeUpdates.base_url = updates.base_url;
        if (updates.available_models !== undefined) {
            safeUpdates.available_models = updates.available_models;
            safeUpdates.models_fetched_at = new Date().toISOString();
        }
        if (updates.is_valid !== undefined) {
            safeUpdates.is_valid = updates.is_valid;
            safeUpdates.validated_at = updates.is_valid ? new Date().toISOString() : null;
            safeUpdates.validation_error = updates.validation_error || null;
        }

        // If updating API key, re-encrypt
        if (updates.api_key) {
            safeUpdates.api_key_encrypted = encrypt(updates.api_key);
            safeUpdates.api_key_hint = getKeyHint(updates.api_key);
        }

        if (Object.keys(safeUpdates).length === 0) {
            return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
        }

        const { data, error } = await (supabase as any)
            .from("user_ai_providers")
            .update(safeUpdates)
            .eq("id", id)
            .eq("user_id", user.id)
            .select("*")
            .single();

        if (error) {
            console.error("[providers] PATCH error:", error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            provider: {
                ...data,
                api_key_encrypted: undefined,
                api_key_display: data.api_key_hint,
            },
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── DELETE: Remove a provider key ──────────────────────────────────────────

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Provider id is required" }, { status: 400 });
        }

        const { error } = await (supabase as any)
            .from("user_ai_providers")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) {
            console.error("[providers] DELETE error:", error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ deleted: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
