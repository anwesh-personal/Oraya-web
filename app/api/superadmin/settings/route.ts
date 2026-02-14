import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifySuperadminToken } from "@/lib/superadmin-middleware";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// GET /api/superadmin/settings?category=billing
// Returns platform_settings rows filtered by category.
// Sensitive values are masked (e.g. "sk_live_...abc")
// ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
    const authResult = await verifySuperadminToken(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    try {
        let query = (supabase
            .from("platform_settings") as any)
            .select("key, value, category, description, is_sensitive, updated_at")
            .order("key", { ascending: true });

        if (category) {
            query = query.eq("category", category);
        }

        const { data: settings, error } = await query;
        if (error) throw error;

        // Mask sensitive values — show only last 4 chars
        const masked = (settings || []).map((s: any) => {
            if (s.is_sensitive && s.value) {
                const raw = typeof s.value === "string" ? s.value.replace(/^"|"$/g, "") : String(s.value);
                if (raw.length > 8) {
                    return {
                        ...s,
                        value: JSON.stringify(raw.substring(0, 7) + "..." + raw.slice(-4)),
                        has_value: true,
                    };
                }
                return { ...s, value: JSON.stringify("***"), has_value: raw.length > 0 };
            }
            return { ...s, has_value: s.value !== null && s.value !== '""' && s.value !== "" };
        });

        return NextResponse.json({ settings: masked });
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json(
            { error: "Failed to fetch settings" },
            { status: 500 }
        );
    }
}

// ─────────────────────────────────────────────────────────────
// PUT /api/superadmin/settings
// Upsert multiple settings at once.
//
// Body: {
//   settings: [
//     { key: "stripe.secret_key", value: "sk_live_xxx", category: "billing", is_sensitive: true },
//     { key: "billing.trial_days", value: 14, category: "billing" },
//   ]
// }
// ─────────────────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
    const authResult = await verifySuperadminToken(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    try {
        const body = await request.json();
        const { settings } = body;

        if (!Array.isArray(settings) || settings.length === 0) {
            return NextResponse.json(
                { error: "settings array is required" },
                { status: 400 }
            );
        }

        const results: { key: string; status: string }[] = [];

        for (const setting of settings) {
            if (!setting.key || setting.value === undefined) {
                results.push({ key: setting.key || "unknown", status: "skipped — missing key or value" });
                continue;
            }

            // Skip if the value is a masked placeholder (user didn't change it)
            const val = typeof setting.value === "string" ? setting.value : JSON.stringify(setting.value);
            if (val === "***" || (val.includes("...") && val.length < 20)) {
                results.push({ key: setting.key, status: "unchanged (masked)" });
                continue;
            }

            // Wrap non-JSON values in quotes
            const jsonValue = typeof setting.value === "string"
                ? JSON.stringify(setting.value)
                : JSON.stringify(setting.value);

            const { error } = await (supabase
                .from("platform_settings") as any)
                .upsert(
                    {
                        key: setting.key,
                        value: jsonValue,
                        category: setting.category || "general",
                        description: setting.description || null,
                        is_sensitive: setting.is_sensitive || false,
                        updated_by: authResult.session?.adminId || null,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "key" }
                );

            if (error) {
                console.error(`Error saving setting ${setting.key}:`, error);
                results.push({ key: setting.key, status: `error: ${error.message}` });
            } else {
                results.push({ key: setting.key, status: "saved" });
            }
        }

        return NextResponse.json({ results, saved: results.filter(r => r.status === "saved").length });
    } catch (error) {
        console.error("Error saving settings:", error);
        return NextResponse.json(
            { error: "Failed to save settings" },
            { status: 500 }
        );
    }
}
