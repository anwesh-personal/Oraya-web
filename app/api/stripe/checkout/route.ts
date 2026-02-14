import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe/client";
import { getPlanPriceIds, getStripeRedirectUrls } from "@/lib/stripe/config";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// POST /api/stripe/checkout
// Creates a Stripe Checkout session for plan subscriptions.
//
// Body: { plan_id: string, billing_cycle: "monthly" | "yearly" }
//
// Flow:
//   1. Validate the plan exists and is subscribable
//   2. Find or create a Stripe Customer for the user
//   3. Create a Checkout Session in subscription mode
//   4. Return the checkout URL for client redirect
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
        const { plan_id, billing_cycle } = body;

        if (!plan_id || !["monthly", "yearly"].includes(billing_cycle)) {
            return NextResponse.json(
                { error: "Invalid plan_id or billing_cycle" },
                { status: 400 }
            );
        }

        // 3. Validate plan exists and is purchasable
        if (plan_id === "free" || plan_id === "enterprise") {
            return NextResponse.json(
                { error: `Cannot checkout for ${plan_id} plan` },
                { status: 400 }
            );
        }

        const planPriceIds = await getPlanPriceIds();
        const priceMapping = planPriceIds[plan_id];
        if (!priceMapping) {
            return NextResponse.json(
                { error: "Unknown plan" },
                { status: 400 }
            );
        }

        const priceId = priceMapping[billing_cycle as "monthly" | "yearly"];
        if (!priceId) {
            return NextResponse.json(
                { error: `Stripe price not configured for ${plan_id} ${billing_cycle}` },
                { status: 400 }
            );
        }

        // 4. Find or create Stripe Customer
        let stripeCustomerId: string;

        const { data: existingCustomer } = await supabase
            .from("stripe_customers")
            .select("stripe_customer_id")
            .eq("user_id", user.id)
            .single();

        if (existingCustomer?.stripe_customer_id) {
            stripeCustomerId = existingCustomer.stripe_customer_id;
        } else {
            // Fetch user profile for metadata
            const { data: profile } = await supabase
                .from("user_profiles")
                .select("full_name, display_name")
                .eq("user_id", user.id)
                .single();

            const stripeClient = await getStripeClient();
            const customer = await stripeClient.customers.create({
                email: user.email,
                name: profile?.full_name || profile?.display_name || undefined,
                metadata: {
                    supabase_user_id: user.id,
                    plan_id: plan_id,
                },
            });

            stripeCustomerId = customer.id;

            // Persist in DB
            await supabase.from("stripe_customers").insert({
                user_id: user.id,
                stripe_customer_id: customer.id,
                email: user.email,
                name: profile?.full_name || profile?.display_name,
            });
        }

        const stripe = await getStripeClient();
        const urls = await getStripeRedirectUrls();

        // 5. Check if user already has an active subscription
        const { data: existingLicense } = await supabase
            .from("user_licenses")
            .select("id, stripe_subscription_id, status")
            .eq("user_id", user.id)
            .eq("status", "active")
            .single();

        // If they already have a Stripe subscription, redirect to portal for upgrades
        if (existingLicense?.stripe_subscription_id) {
            const portalSession = await stripe.billingPortal.sessions.create({
                customer: stripeCustomerId,
                return_url: urls.successUrl,
                flow_data: {
                    type: "subscription_update_confirm",
                    subscription_update_confirm: {
                        subscription: existingLicense.stripe_subscription_id,
                        items: [
                            {
                                id: (await stripe.subscriptions.retrieve(existingLicense.stripe_subscription_id)).items.data[0].id,
                                price: priceId,
                            },
                        ],
                    },
                },
            });

            return NextResponse.json({ checkout_url: portalSession.url });
        }

        // 6. Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            subscription_data: {
                metadata: {
                    supabase_user_id: user.id,
                    plan_id: plan_id,
                    billing_cycle: billing_cycle,
                },
            },
            metadata: {
                supabase_user_id: user.id,
                plan_id: plan_id,
                billing_cycle: billing_cycle,
                type: "subscription",
            },
            success_url: urls.successUrl + "&session_id={CHECKOUT_SESSION_ID}",
            cancel_url: urls.cancelUrl,
            allow_promotion_codes: true,
            billing_address_collection: "auto",
            tax_id_collection: { enabled: true },
        });

        return NextResponse.json({ checkout_url: session.url });
    } catch (error) {
        console.error("Stripe checkout error:", error);
        return NextResponse.json(
            { error: "Failed to create checkout session" },
            { status: 500 }
        );
    }
}
