import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifySuperadminToken } from "@/lib/superadmin-middleware";

export const dynamic = "force-dynamic";

// GET - Fetch all managed AI keys with stats
export async function GET(request: NextRequest) {
    const authResult = await verifySuperadminToken(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider");

    try {
        let query = (supabase
            .from("managed_ai_keys") as any)
            .select("*")
            .order("provider", { ascending: true })
            .order("priority", { ascending: false });

        if (provider) {
            query = query.eq("provider", provider);
        }

        const { data: keys, error } = await query;

        if (error) throw error;

        // Get aggregate stats
        const stats = {
            total: keys?.length || 0,
            healthy: keys?.filter((k: any) => k.is_healthy && k.is_active).length || 0,
            unhealthy: keys?.filter((k: any) => !k.is_healthy && k.is_active).length || 0,
            inactive: keys?.filter((k: any) => !k.is_active).length || 0,
            dailySpend: keys?.reduce((sum: number, k: any) => sum + (k.current_daily_spend_usd || 0), 0) || 0,
            monthlySpend: keys?.reduce((sum: number, k: any) => sum + (k.current_monthly_spend_usd || 0), 0) || 0,
            byProvider: {} as Record<string, number>,
        };

        // Count by provider
        keys?.forEach((key: any) => {
            stats.byProvider[key.provider] = (stats.byProvider[key.provider] || 0) + 1;
        });

        return NextResponse.json({
            keys: keys || [],
            stats,
        });
    } catch (error) {
        console.error("Error fetching AI keys:", error);
        return NextResponse.json(
            { error: "Failed to fetch AI keys" },
            { status: 500 }
        );
    }
}

// POST - Add a new managed AI key
export async function POST(request: NextRequest) {
    const authResult = await verifySuperadminToken(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    try {
        const body = await request.json();
        const {
            provider,
            key_name,
            api_key,
            daily_budget_usd,
            monthly_budget_usd,
            max_requests_per_minute,
            max_concurrent_requests,
            weight,
            priority,
            notes,
            tags,
        } = body;

        // Validate required fields
        if (!provider || !key_name || !api_key) {
            return NextResponse.json(
                { error: "Provider, key name, and API key are required" },
                { status: 400 }
            );
        }

        // Validate provider
        const validProviders = ['openai', 'anthropic', 'google', 'mistral', 'perplexity', 'groq', 'cohere', 'deepseek'];
        if (!validProviders.includes(provider)) {
            return NextResponse.json(
                { error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` },
                { status: 400 }
            );
        }

        // Insert the new key
        const { data, error } = await (supabase
            .from("managed_ai_keys") as any)
            .insert({
                provider,
                key_name,
                api_key,
                daily_budget_usd: daily_budget_usd || null,
                monthly_budget_usd: monthly_budget_usd || null,
                max_requests_per_minute: max_requests_per_minute || 60,
                max_concurrent_requests: max_concurrent_requests || 10,
                weight: weight || 1,
                priority: priority || 0,
                notes: notes || null,
                tags: tags || [],
                is_active: true,
                is_healthy: true,
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json(
                    { error: "A key with this name already exists for this provider" },
                    { status: 409 }
                );
            }
            throw error;
        }

        return NextResponse.json({ key: data }, { status: 201 });
    } catch (error) {
        console.error("Error adding AI key:", error);
        return NextResponse.json(
            { error: "Failed to add AI key" },
            { status: 500 }
        );
    }
}

// PATCH - Update an existing key
export async function PATCH(request: NextRequest) {
    const authResult = await verifySuperadminToken(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: "Key ID is required" }, { status: 400 });
        }

        // Don't allow updating certain fields
        delete updates.created_at;
        delete updates.current_daily_spend_usd;
        delete updates.current_monthly_spend_usd;
        delete updates.error_count;

        const { data, error } = await (supabase
            .from("managed_ai_keys") as any)
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ key: data });
    } catch (error) {
        console.error("Error updating AI key:", error);
        return NextResponse.json(
            { error: "Failed to update AI key" },
            { status: 500 }
        );
    }
}

// DELETE - Remove a key
export async function DELETE(request: NextRequest) {
    const authResult = await verifySuperadminToken(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "Key ID is required" }, { status: 400 });
    }

    try {
        const { error } = await (supabase
            .from("managed_ai_keys") as any)
            .delete()
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting AI key:", error);
        return NextResponse.json(
            { error: "Failed to delete AI key" },
            { status: 500 }
        );
    }
}
