import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe/client";
import { getStripeRedirectUrls } from "@/lib/stripe/config";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// POST /api/stripe/portal
// Creates a Stripe Billing Portal session for existing subscribers.
//
// The portal lets customers:
//   - Update their plan (upgrade/downgrade)
//   - Update payment methods
//   - Cancel subscriptions
//   - View invoice history
//   - Download invoices
// ─────────────────────────────────────────────────────────────

export async function POST() {
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

        // 2. Get Stripe customer
        const { data: customer } = await (supabase
            .from("stripe_customers") as any)
            .select("stripe_customer_id")
            .eq("user_id", user.id)
            .single();

        if (!customer?.stripe_customer_id) {
            return NextResponse.json(
                { error: "No billing account found. Start a subscription first." },
                { status: 404 }
            );
        }

        // 3. Create portal session
        const stripe = await getStripeClient();
        const urls = await getStripeRedirectUrls();
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customer.stripe_customer_id,
            return_url: urls.portalReturnUrl,
        });

        return NextResponse.json({ portal_url: portalSession.url });
    } catch (error) {
        console.error("Stripe portal error:", error);
        return NextResponse.json(
            { error: "Failed to create billing portal session" },
            { status: 500 }
        );
    }
}
