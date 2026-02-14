import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe/client";
import { getTokenPackagePriceIds, getStripeRedirectUrls } from "@/lib/stripe/config";
import { Tables } from "@/lib/database.types";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// POST /api/stripe/buy-tokens
// Creates a Stripe Checkout session for one-time token purchases.
//
// Body: { package_id: string }
//
// Flow:
//   1. Validate the token package exists
//   2. Find or create a Stripe Customer
//   3. Create a Checkout Session in payment mode (one-time)
//   4. Create a pending token_purchase record in DB
//   5. Return checkout URL
// ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
    try {
        const supabase = await createServerSupabaseClient();

        // 1. Auth check
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // 2. Parse body
        const body = await request.json();
        const { package_id } = body;

        if (!package_id) {
            return NextResponse.json(
                { error: "package_id is required" },
                { status: 400 }
            );
        }

        // 3. Validate token package exists
        const { data: tokenPackage, error: pkgError } = await supabase
            .from("token_packages")
            .select("*")
            .eq("id", package_id)
            .eq("is_active", true)
            .single() as { data: Tables<"token_packages"> | null; error: any };

        if (!tokenPackage || pkgError) {
            return NextResponse.json(
                { error: "Token package not found or inactive" },
                { status: 404 }
            );
        }

        // 4. Check wallet isn't frozen
        const { data: wallet } = await supabase
            .from("token_wallets")
            .select("id, is_frozen")
            .eq("user_id", user.id)
            .single() as { data: Pick<Tables<"token_wallets">, "id" | "is_frozen"> | null };

        if (wallet?.is_frozen) {
            return NextResponse.json(
                { error: "Your token wallet is frozen. Contact support." },
                { status: 403 }
            );
        }

        // 5. Get or create Stripe Price ID
        const tokenPriceIds = await getTokenPackagePriceIds();
        const priceId = tokenPriceIds[package_id];
        if (!priceId) {
            return NextResponse.json(
                { error: `Stripe price not configured for package: ${package_id}` },
                { status: 400 }
            );
        }

        // 6. Find or create Stripe Customer
        let stripeCustomerId: string;

        const { data: existingCustomer } = await (supabase
            .from("stripe_customers") as any)
            .select("stripe_customer_id")
            .eq("user_id", user.id)
            .single() as { data: Pick<Tables<"stripe_customers">, "stripe_customer_id"> | null };

        if (existingCustomer?.stripe_customer_id) {
            stripeCustomerId = existingCustomer.stripe_customer_id;
        } else {
            const stripeClient = await getStripeClient();
            const customer = await stripeClient.customers.create({
                email: user.email,
                metadata: {
                    supabase_user_id: user.id,
                },
            });

            stripeCustomerId = customer.id;

            await (supabase.from("stripe_customers") as any).insert({
                user_id: user.id,
                stripe_customer_id: customer.id,
                email: user.email,
            });
        }

        // 7. Create pending purchase record
        const { data: purchase, error: purchaseError } = await supabase
            .from("token_purchases")
            .insert({
                user_id: user.id,
                wallet_id: wallet?.id || "",
                tokens_purchased: tokenPackage.token_amount,
                bonus_tokens: tokenPackage.token_amount * tokenPackage.bonus_percentage / 100,
                amount_paid: tokenPackage.price,
                currency: tokenPackage.currency,
                price_per_1k_tokens: tokenPackage.price / (tokenPackage.token_amount / 1000),
                payment_provider: "stripe",
                payment_status: "pending",
            })
            .select("id")
            .single() as { data: Pick<Tables<"token_purchases">, "id"> | null; error: any };

        if (purchaseError) {
            console.error("Failed to create purchase record:", purchaseError);
            return NextResponse.json(
                { error: "Failed to initiate purchase" },
                { status: 500 }
            );
        }

        // 8. Create Checkout Session
        const stripe = await getStripeClient();
        const urls = await getStripeRedirectUrls();
        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            mode: "payment",
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            metadata: {
                supabase_user_id: user.id,
                package_id: package_id,
                purchase_id: purchase.id,
                wallet_id: wallet?.id || "",
                type: "token_purchase",
            },
            success_url: urls.tokenSuccessUrl + "&session_id={CHECKOUT_SESSION_ID}",
            cancel_url: urls.tokenCancelUrl,
            allow_promotion_codes: true,
        });

        // 9. Update purchase with Stripe payment ID
        await (supabase
            .from("token_purchases") as any)
            .update({ payment_id: session.payment_intent as string })
            .eq("id", purchase.id);

        return NextResponse.json({ checkout_url: session.url });
    } catch (error) {
        console.error("Stripe token purchase error:", error);
        return NextResponse.json(
            { error: "Failed to create token purchase session" },
            { status: 500 }
        );
    }
}
