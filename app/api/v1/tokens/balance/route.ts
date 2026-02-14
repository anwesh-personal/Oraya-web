import { NextResponse } from "next/server";
import { authenticateBridge, hasScope, scopeError } from "@/lib/bridge/auth";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// GET /api/v1/tokens/balance
// Returns the authenticated user's token wallet balance.
//
// Auth: API Key, License Key, or JWT
//
// Returns: {
//   balance, total_purchased, total_used, is_frozen,
//   auto_refill_enabled, low_balance (bool)
// }
// ─────────────────────────────────────────────────────────────

export async function GET(request: Request) {
    try {
        const { auth, error } = await authenticateBridge(request);
        if (error) return error;

        if (!hasScope(auth, "read")) return scopeError("read");

        const { data: wallet, error: walletError } = await (auth.supabase
            .from("token_wallets") as any)
            .select("*")
            .eq("user_id", auth.user_id)
            .single();

        if (walletError || !wallet) {
            return NextResponse.json(
                { error: "Token wallet not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            balance: wallet.token_balance,
            total_purchased: wallet.total_purchased,
            total_used: wallet.total_used,
            total_refunded: wallet.total_refunded,
            is_frozen: wallet.is_frozen,
            frozen_reason: wallet.frozen_reason,
            auto_refill_enabled: wallet.auto_refill_enabled,
            auto_refill_threshold: wallet.auto_refill_threshold,
            low_balance: wallet.token_balance <= wallet.low_balance_threshold,
            last_purchase_at: wallet.last_purchase_at,
            last_usage_at: wallet.last_usage_at,
            server_time: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Token balance error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
