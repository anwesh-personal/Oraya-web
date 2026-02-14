import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
        const { data: wallet, error: walletError } = await supabase
            .from("token_wallets")
            .select(`
                id,
                token_balance,
                total_purchased,
                total_used,
                total_refunded,
                auto_refill_enabled,
                auto_refill_threshold,
                refill_amount,
                low_balance_threshold,
                is_frozen,
                frozen_reason,
                last_purchase_at,
                last_usage_at,
                created_at
            `)
            .eq("user_id", user.id)
            .maybeSingle();

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
        const { data: purchases } = await supabase
            .from("token_purchases")
            .select(`
                id,
                tokens_purchased,
                bonus_tokens,
                total_tokens,
                amount_paid,
                currency,
                payment_status,
                purchased_at,
                completed_at
            `)
            .eq("user_id", user.id)
            .order("purchased_at", { ascending: false })
            .limit(20);

        // Fetch recent usage (last 50 entries)
        const { data: recentUsage } = await supabase
            .from("token_usage_logs")
            .select(`
                id,
                tokens_used,
                service,
                operation,
                balance_before,
                balance_after,
                agent_id,
                used_at
            `)
            .eq("user_id", user.id)
            .order("used_at", { ascending: false })
            .limit(50);

        // Fetch available token packages
        const { data: packages } = await supabase
            .from("token_packages")
            .select(`
                id,
                name,
                description,
                token_amount,
                bonus_percentage,
                total_tokens,
                price,
                currency,
                price_per_1k_tokens,
                is_popular,
                is_best_value,
                badge
            `)
            .eq("is_active", true)
            .order("display_order", { ascending: true });

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
