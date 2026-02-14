import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Tables } from "@/lib/database.types";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// GET /api/members/tokens
// Returns the authenticated user's token wallet, including
// balance, purchase history, and recent usage.
// ─────────────────────────────────────────────────────────────

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();

        // Verify authentication
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Fetch token wallet
        const { data: wallet, error: walletError } = await (supabase
            .from("token_wallets") as any)
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle() as { data: Tables<"token_wallets"> | null; error: any };

        if (walletError) {
            console.error("Wallet fetch error:", walletError);
            return NextResponse.json(
                { error: "Failed to fetch wallet information" },
                { status: 500 }
            );
        }

        // If no wallet exists yet, return zeroed wallet
        if (!wallet) {
            return NextResponse.json({
                wallet: {
                    balance: 0,
                    currency: "USD",
                    total_purchased: 0,
                    total_used: 0,
                    total_refunded: 0,
                    auto_refill_enabled: false,
                    is_frozen: false,
                },
                purchases: [],
                recent_usage: [],
                packages: [],
            });
        }

        // Fetch purchase history (last 20)
        const { data: purchases } = await (supabase
            .from("token_purchases") as any)
            .select("*")
            .eq("user_id", user.id)
            .order("purchased_at", { ascending: false })
            .limit(20) as { data: Tables<"token_purchases">[] | null };

        // Fetch recent usage (last 50 entries)
        const { data: recentUsage } = await (supabase
            .from("token_usage_logs") as any)
            .select("*")
            .eq("user_id", user.id)
            .order("used_at", { ascending: false })
            .limit(50) as { data: Tables<"token_usage_logs">[] | null };

        // Fetch available token packages
        const { data: packages } = await (supabase
            .from("token_packages") as any)
            .select("*")
            .eq("is_active", true)
            .order("display_order", { ascending: true }) as { data: Tables<"token_packages">[] | null };

        return NextResponse.json({
            wallet: {
                balance: wallet.token_balance,
                currency: "USD",
                total_purchased: wallet.total_purchased,
                total_used: wallet.total_used,
                total_refunded: wallet.total_refunded,
                auto_refill_enabled: wallet.auto_refill_enabled,
                auto_refill_threshold: wallet.auto_refill_threshold,
                refill_amount: wallet.refill_amount,
                low_balance_threshold: wallet.low_balance_threshold,
                is_frozen: wallet.is_frozen,
                frozen_reason: wallet.frozen_reason,
                last_purchase_at: wallet.last_purchase_at,
                last_usage_at: wallet.last_usage_at,
            },
            purchases: purchases || [],
            recent_usage: recentUsage || [],
            packages: packages || [],
        });
    } catch (error) {
        console.error("Tokens API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
