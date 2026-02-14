import { NextResponse } from "next/server";
import { authenticateBridge, hasScope, scopeError } from "@/lib/bridge/auth";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// POST /api/v1/tokens/deduct
// Deducts tokens from the user's wallet for AI usage.
//
// Auth: API Key (with 'use_tokens' scope) or License Key
//
// Body: {
//   tokens: number,        (required) — how many tokens to deduct
//   service: string,       (required) — "openai" | "anthropic" | "research" | etc.
//   operation?: string,    — "chat" | "completion" | "embedding" | etc.
//   device_id?: string,    — which device made the call
//   agent_id?: string,     — which agent was used
//   conversation_id?: string — which conversation context
// }
//
// Returns: {
//   success: true, balance_before, balance_after, tokens_deducted
// }
//
// The actual deduction is handled by the Postgres trigger
// `deduct_tokens_trigger` on `token_usage_logs` INSERT.
// It uses SELECT ... FOR UPDATE to prevent race conditions.
// ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
    try {
        const { auth, error } = await authenticateBridge(request);
        if (error) return error;

        if (!hasScope(auth, "use_tokens")) return scopeError("use_tokens");

        // 1. Parse body
        const body = await request.json();
        const { tokens, service, operation, device_id, agent_id, conversation_id } = body;

        // 2. Validate
        if (!tokens || typeof tokens !== "number" || tokens <= 0) {
            return NextResponse.json(
                { error: "tokens must be a positive number" },
                { status: 400 }
            );
        }

        if (!service || typeof service !== "string") {
            return NextResponse.json(
                { error: "service is required (e.g. 'openai', 'anthropic', 'research')" },
                { status: 400 }
            );
        }

        // 3. Get wallet
        const { data: wallet, error: walletError } = await auth.supabase
            .from("token_wallets")
            .select("id, token_balance, is_frozen")
            .eq("user_id", auth.user_id)
            .single();

        if (walletError || !wallet) {
            return NextResponse.json(
                { error: "Token wallet not found" },
                { status: 404 }
            );
        }

        // 4. Check frozen
        if (wallet.is_frozen) {
            return NextResponse.json(
                {
                    error: "Token wallet is frozen",
                    reason: "Your wallet has been frozen. Contact support.",
                    balance: wallet.token_balance,
                },
                { status: 403 }
            );
        }

        // 5. Check sufficient balance
        if (wallet.token_balance < tokens) {
            return NextResponse.json(
                {
                    error: "Insufficient token balance",
                    balance: wallet.token_balance,
                    requested: tokens,
                    shortfall: tokens - wallet.token_balance,
                },
                { status: 402 } // Payment Required
            );
        }

        // 6. Insert usage log (trigger handles deduction + balance snapshot)
        const { data: usageLog, error: usageError } = await auth.supabase
            .from("token_usage_logs")
            .insert({
                user_id: auth.user_id,
                wallet_id: wallet.id,
                tokens_used: tokens,
                service: service,
                operation: operation || null,
                device_id: device_id || auth.device_id || null,
                agent_id: agent_id || null,
                conversation_id: conversation_id || null,
                balance_before: wallet.token_balance,            // Will be overwritten by trigger
                balance_after: wallet.token_balance - tokens,    // Will be overwritten by trigger
            })
            .select("id, balance_before, balance_after, tokens_used, used_at")
            .single();

        if (usageError) {
            // The trigger raises an exception if insufficient balance (race condition protection)
            if (usageError.message?.includes("Insufficient token balance")) {
                return NextResponse.json(
                    {
                        error: "Insufficient token balance (concurrent deduction)",
                        balance: wallet.token_balance,
                    },
                    { status: 402 }
                );
            }

            console.error("Token deduction error:", usageError);
            return NextResponse.json(
                { error: "Failed to deduct tokens" },
                { status: 500 }
            );
        }

        // 7. Also update license usage counter
        if (auth.license_id) {
            // Increment ai_calls_used atomically
            const { error: rpcError } = await auth.supabase.rpc(
                "increment_license_ai_calls",
                { license_id_param: auth.license_id }
            );
            if (rpcError) {
                console.warn(
                    "Failed to increment license AI calls (non-critical):",
                    rpcError.message
                );
            }
        }

        return NextResponse.json({
            success: true,
            usage_id: usageLog.id,
            tokens_deducted: usageLog.tokens_used,
            balance_before: usageLog.balance_before,
            balance_after: usageLog.balance_after,
            used_at: usageLog.used_at,
            server_time: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Token deduction error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
