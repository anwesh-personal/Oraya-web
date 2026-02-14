import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/client";
import { getStripeWebhookSecret } from "@/lib/stripe/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any, any, any>;

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// POST /api/stripe/webhooks
// Handles ALL incoming Stripe webhook events.
//
// CRITICAL: This endpoint uses the Supabase SERVICE ROLE key
// because webhook requests are unauthenticated (no user session).
// Stripe signs the payload with the webhook secret for verification.
//
// Events handled:
//   - checkout.session.completed   → Provision subscription or credit tokens
//   - customer.subscription.created → Create/update license
//   - customer.subscription.updated → Update plan/billing cycle
//   - customer.subscription.deleted → Cancel license
//   - invoice.paid                  → Record successful payment
//   - invoice.payment_failed       → Flag payment failure
//   - charge.refunded               → Process refund
//   - customer.subscription.trial_will_end → Alert trial expiry
// ─────────────────────────────────────────────────────────────

// We need raw body for signature verification — disable body parsing
export async function POST(request: Request) {
    try {
        const body = await request.text();
        const headersList = await headers();
        const signature = headersList.get("stripe-signature");

        if (!signature) {
            return NextResponse.json(
                { error: "Missing Stripe signature" },
                { status: 400 }
            );
        }

        const webhookSecret = await getStripeWebhookSecret();
        if (!webhookSecret) {
            console.error("Stripe webhook secret is not configured");
            return NextResponse.json(
                { error: "Webhook secret not configured" },
                { status: 500 }
            );
        }

        // 1. Verify webhook signature
        const stripe = await getStripeClient();
        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                webhookSecret
            );
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Unknown error";
            console.error("Webhook signature verification failed:", message);
            return NextResponse.json(
                { error: `Invalid signature: ${message}` },
                { status: 400 }
            );
        }

        // 2. Use service role client (no user session in webhooks)
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        );

        // 3. Log the event for audit trail
        await supabase.from("billing_events").insert({
            event_type: event.type,
            event_source: "stripe",
            stripe_event_id: event.id,
            stripe_event_type: event.type,
            event_data: event.data.object as unknown as Record<string, unknown>,
            is_processed: false,
        });

        // 4. Handle event by type
        switch (event.type) {
            case "checkout.session.completed":
                await handleCheckoutCompleted(supabase, event.data.object as Stripe.Checkout.Session);
                break;

            case "customer.subscription.created":
            case "customer.subscription.updated":
                await handleSubscriptionUpdate(supabase, event.data.object as Stripe.Subscription);
                break;

            case "customer.subscription.deleted":
                await handleSubscriptionCancelled(supabase, event.data.object as Stripe.Subscription);
                break;

            case "invoice.paid":
                await handleInvoicePaid(supabase, event.data.object as Stripe.Invoice);
                break;

            case "invoice.payment_failed":
                await handleInvoicePaymentFailed(supabase, event.data.object as Stripe.Invoice);
                break;

            case "charge.refunded":
                await handleChargeRefunded(supabase, event.data.object as Stripe.Charge);
                break;

            case "customer.subscription.trial_will_end":
                await handleTrialWillEnd(supabase, event.data.object as Stripe.Subscription);
                break;

            default:
                console.log(`Unhandled Stripe event: ${event.type}`);
        }

        // 5. Mark event as processed
        await supabase
            .from("billing_events")
            .update({ is_processed: true, processed_at: new Date().toISOString() })
            .eq("stripe_event_id", event.id);

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Webhook processing error:", error);
        return NextResponse.json(
            { error: "Webhook processing failed" },
            { status: 500 }
        );
    }
}

// ─────────────────────────────────────────────────────────────
// Handler: checkout.session.completed
// ─────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(
    supabase: DbClient,
    session: Stripe.Checkout.Session
) {
    const metadata = session.metadata || {};
    const userId = metadata.supabase_user_id;

    if (!userId) {
        console.error("Checkout completed but no supabase_user_id in metadata");
        return;
    }

    if (metadata.type === "token_purchase") {
        // Token purchase completed — mark the pending purchase as completed
        const purchaseId = metadata.purchase_id;
        if (purchaseId) {
            await supabase
                .from("token_purchases")
                .update({
                    payment_status: "completed",
                    payment_id: typeof session.payment_intent === "string"
                        ? session.payment_intent
                        : session.payment_intent?.id || null,
                    completed_at: new Date().toISOString(),
                })
                .eq("id", purchaseId);
            // The DB trigger `credit_tokens_trigger` will auto-credit the wallet
        }

        // Record the transaction
        await supabase.from("payment_transactions").insert({
            user_id: userId,
            transaction_type: "token_purchase",
            description: `Token purchase: ${metadata.package_id}`,
            amount: (session.amount_total || 0) / 100,
            currency: session.currency?.toUpperCase() || "USD",
            payment_provider: "stripe",
            stripe_payment_intent_id: typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent?.id || null,
            status: "succeeded",
            token_purchase_id: metadata.purchase_id || null,
            succeeded_at: new Date().toISOString(),
        });
    }
    // Subscription checkout is handled by customer.subscription.created
}

// ─────────────────────────────────────────────────────────────
// Handler: customer.subscription.created / updated
// ─────────────────────────────────────────────────────────────

async function handleSubscriptionUpdate(
    supabase: DbClient,
    subscription: Stripe.Subscription
) {
    const metadata = subscription.metadata || {};
    const userId = metadata.supabase_user_id;
    const planId = metadata.plan_id;
    const billingCycle = metadata.billing_cycle;

    if (!userId) {
        // Try to find user by stripe customer ID
        const { data: customer } = await supabase
            .from("stripe_customers")
            .select("user_id")
            .eq("stripe_customer_id", subscription.customer as string)
            .single();

        if (!customer) {
            console.error("Subscription event but cannot identify user");
            return;
        }

        await processSubscriptionUpdate(
            supabase,
            customer.user_id,
            planId || "pro",
            billingCycle || "monthly",
            subscription
        );
    } else {
        await processSubscriptionUpdate(
            supabase,
            userId,
            planId || "pro",
            billingCycle || "monthly",
            subscription
        );
    }
}

async function processSubscriptionUpdate(
    supabase: DbClient,
    userId: string,
    planId: string,
    billingCycle: string,
    subscription: Stripe.Subscription
) {
    const status = mapStripeStatus(subscription.status);

    // Stripe SDK v20+: period dates are on subscription items
    const firstItem = subscription.items.data[0];
    const periodEnd = firstItem?.current_period_end || Math.floor(Date.now() / 1000);
    const periodStart = firstItem?.current_period_start || Math.floor(Date.now() / 1000);

    const currentPeriodEnd = new Date(periodEnd * 1000)
        .toISOString()
        .split("T")[0];
    const currentPeriodStart = new Date(periodStart * 1000)
        .toISOString()
        .split("T")[0];

    // Check for existing license
    const { data: existingLicense } = await supabase
        .from("user_licenses")
        .select("id")
        .eq("user_id", userId)
        .in("status", ["active", "payment_failed"])
        .single();

    if (existingLicense) {
        // Update existing license
        await supabase
            .from("user_licenses")
            .update({
                plan_id: planId,
                status: status,
                billing_cycle: billingCycle as "monthly" | "yearly",
                stripe_subscription_id: subscription.id,
                current_period_end: currentPeriodEnd,
                next_billing_date: currentPeriodEnd,
                is_trial: subscription.status === "trialing",
                trial_ends_at: subscription.trial_end
                    ? new Date(subscription.trial_end * 1000).toISOString()
                    : null,
            })
            .eq("id", existingLicense.id);
    } else {
        // Create new license
        await supabase.from("user_licenses").insert({
            user_id: userId,
            plan_id: planId,
            status: status,
            billing_cycle: billingCycle,
            stripe_subscription_id: subscription.id,
            current_period_start: currentPeriodStart,
            current_period_end: currentPeriodEnd,
            next_billing_date: currentPeriodEnd,
            activated_at: new Date().toISOString(),
            is_trial: subscription.status === "trialing",
            trial_ends_at: subscription.trial_end
                ? new Date(subscription.trial_end * 1000).toISOString()
                : null,
            amount_paid: (firstItem?.price?.unit_amount || 0) / 100,
        });
    }
}

// ─────────────────────────────────────────────────────────────
// Handler: customer.subscription.deleted
// ─────────────────────────────────────────────────────────────

async function handleSubscriptionCancelled(
    supabase: DbClient,
    subscription: Stripe.Subscription
) {
    // Find and cancel the license
    const { data: license } = await supabase
        .from("user_licenses")
        .select("id")
        .eq("stripe_subscription_id", subscription.id)
        .single();

    if (license) {
        await supabase
            .from("user_licenses")
            .update({
                status: "cancelled",
                cancelled_at: new Date().toISOString(),
            })
            .eq("id", license.id);
    }

    // Downgrade to free plan — create a new free license
    const metadata = subscription.metadata || {};
    const userId = metadata.supabase_user_id;

    if (userId) {
        // Check if they already have a free license
        const { data: freeLicense } = await supabase
            .from("user_licenses")
            .select("id")
            .eq("user_id", userId)
            .eq("plan_id", "free")
            .eq("status", "active")
            .single();

        if (!freeLicense) {
            await supabase.from("user_licenses").insert({
                user_id: userId,
                plan_id: "free",
                status: "active",
                billing_cycle: "lifetime",
                activated_at: new Date().toISOString(),
            });
        }
    }
}

// ─────────────────────────────────────────────────────────────
// Handler: invoice.paid
// ─────────────────────────────────────────────────────────────

async function handleInvoicePaid(
    supabase: DbClient,
    invoice: Stripe.Invoice
) {
    if (!invoice.customer) return;

    // Stripe v20: some fields moved/removed from Invoice type but still in event payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoiceAny = invoice as any;
    const paymentIntentId: string | null = typeof invoiceAny.payment_intent === 'string'
        ? invoiceAny.payment_intent
        : invoiceAny.payment_intent?.id || null;

    const { data: customer } = await supabase
        .from("stripe_customers")
        .select("user_id")
        .eq("stripe_customer_id", invoice.customer as string)
        .single();

    if (!customer) return;

    // Record invoice
    await supabase.from("invoices").upsert(
        {
            user_id: customer.user_id,
            invoice_number: invoice.number || `INV-${Date.now()}`,
            stripe_invoice_id: invoice.id,
            period_start: new Date((invoice.period_start || 0) * 1000).toISOString().split("T")[0],
            period_end: new Date((invoice.period_end || 0) * 1000).toISOString().split("T")[0],
            subtotal: (invoice.subtotal || 0) / 100,
            tax: 0, // Stripe v20: tax computed from line items, not top-level
            total: (invoice.total || 0) / 100,
            currency: invoice.currency?.toUpperCase() || "USD",
            status: "paid",
            paid_at: new Date().toISOString(),
            pdf_url: invoice.invoice_pdf || null,
            hosted_invoice_url: invoice.hosted_invoice_url || null,
        },
        { onConflict: "stripe_invoice_id" }
    );

    // Record payment transaction
    await supabase.from("payment_transactions").insert({
        user_id: customer.user_id,
        transaction_type: "subscription",
        description: `Invoice ${invoice.number}`,
        amount: (invoice.total || 0) / 100,
        currency: invoice.currency?.toUpperCase() || "USD",
        payment_provider: "stripe",
        stripe_payment_intent_id: paymentIntentId,
        stripe_invoice_id: invoice.id,
        status: "succeeded",
        succeeded_at: new Date().toISOString(),
    });

    // Clear delinquent flag
    await supabase
        .from("stripe_customers")
        .update({ is_delinquent: false, delinquent_since: null })
        .eq("stripe_customer_id", invoice.customer as string);
}

// ─────────────────────────────────────────────────────────────
// Handler: invoice.payment_failed
// ─────────────────────────────────────────────────────────────

async function handleInvoicePaymentFailed(
    supabase: DbClient,
    invoice: Stripe.Invoice
) {
    if (!invoice.customer) return;

    // Stripe v20: some fields moved/removed from Invoice type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoiceAny = invoice as any;
    const paymentIntentId: string | null = typeof invoiceAny.payment_intent === 'string'
        ? invoiceAny.payment_intent
        : invoiceAny.payment_intent?.id || null;
    const subscriptionId: string | null = typeof invoiceAny.subscription === 'string'
        ? invoiceAny.subscription
        : invoiceAny.subscription?.id || null;

    const { data: customer } = await supabase
        .from("stripe_customers")
        .select("user_id")
        .eq("stripe_customer_id", invoice.customer as string)
        .single();

    if (!customer) return;

    // Mark customer as delinquent
    await supabase
        .from("stripe_customers")
        .update({
            is_delinquent: true,
            delinquent_since: new Date().toISOString(),
        })
        .eq("stripe_customer_id", invoice.customer as string);

    // Update license status
    if (subscriptionId) {
        await supabase
            .from("user_licenses")
            .update({ status: "payment_failed" })
            .eq("stripe_subscription_id", subscriptionId);
    }

    // Record failed transaction
    await supabase.from("payment_transactions").insert({
        user_id: customer.user_id,
        transaction_type: "subscription",
        description: `Failed payment for invoice ${invoice.number}`,
        amount: (invoice.total || 0) / 100,
        currency: invoice.currency?.toUpperCase() || "USD",
        payment_provider: "stripe",
        stripe_payment_intent_id: paymentIntentId,
        stripe_invoice_id: invoice.id,
        status: "failed",
        failure_message: "Payment failed — please update your payment method.",
        failed_at: new Date().toISOString(),
    });
}

// ─────────────────────────────────────────────────────────────
// Handler: charge.refunded
// ─────────────────────────────────────────────────────────────

async function handleChargeRefunded(
    supabase: DbClient,
    charge: Stripe.Charge
) {
    if (!charge.customer) return;

    const { data: customer } = await supabase
        .from("stripe_customers")
        .select("user_id")
        .eq("stripe_customer_id", charge.customer as string)
        .single();

    if (!customer) return;

    // Find original transaction
    const { data: transaction } = await supabase
        .from("payment_transactions")
        .select("id")
        .eq("stripe_charge_id", charge.id)
        .single();

    if (transaction) {
        await supabase.from("refunds").insert({
            user_id: customer.user_id,
            transaction_id: transaction.id,
            refund_amount: (charge.amount_refunded || 0) / 100,
            currency: charge.currency.toUpperCase(),
            reason: "requested_by_customer",
            status: "succeeded",
            processed_at: new Date().toISOString(),
        });
    }
}

// ─────────────────────────────────────────────────────────────
// Handler: customer.subscription.trial_will_end
// ─────────────────────────────────────────────────────────────

async function handleTrialWillEnd(
    supabase: DbClient,
    subscription: Stripe.Subscription
) {
    // Find user and update trial_ends_at metadata
    const { data: customer } = await supabase
        .from("stripe_customers")
        .select("user_id")
        .eq("stripe_customer_id", subscription.customer as string)
        .single();

    if (!customer) return;

    // Update license with trial end date
    await supabase
        .from("user_licenses")
        .update({
            trial_ends_at: subscription.trial_end
                ? new Date(subscription.trial_end * 1000).toISOString()
                : null,
        })
        .eq("stripe_subscription_id", subscription.id);

    // TODO: Send trial ending notification email
    console.log(
        `Trial ending soon for user ${customer.user_id}, subscription ${subscription.id}`
    );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): string {
    switch (stripeStatus) {
        case "active":
            return "active";
        case "trialing":
            return "active";
        case "past_due":
            return "payment_failed";
        case "canceled":
            return "cancelled";
        case "unpaid":
            return "payment_failed";
        case "incomplete":
            return "payment_failed";
        case "incomplete_expired":
            return "expired";
        case "paused":
            return "suspended";
        default:
            return "active";
    }
}
