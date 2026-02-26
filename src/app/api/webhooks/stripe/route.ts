import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { linkStripeCustomer } from '@/lib/membership';
import {
    isEventProcessed,
    recordEvent,
    getSubscriptionContext,
    updateIndividualSubscription,
    updateOrgSubscription,
    handleOrgCheckoutCompleted,
    handleIndividualSubscriptionCanceled,
    handleOrgSubscriptionCanceled,
    sendPaymentFailedNotification,
    sendPaymentActionNotification,
} from '@/lib/stripe-webhooks';
import Stripe from 'stripe';

/**
 * Extract subscription ID from an invoice.
 * Stripe v20 moved subscription from invoice.subscription to
 * invoice.parent.subscription_details.subscription.
 */
function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
    const sub = invoice.parent?.subscription_details?.subscription;
    if (!sub) return null;
    return typeof sub === 'string' ? sub : sub.id;
}

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('Stripe-Signature') as string;

    let event: Stripe.Event;

    // 1. Verify signature
    try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            console.error('Missing STRIPE_WEBHOOK_SECRET');
            return new NextResponse('Webhook Secret Missing', { status: 500 });
        }
        event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (error: any) {
        console.error(`Webhook Signature Verification Failed: ${error.message}`);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    // 2. Idempotency check
    try {
        if (await isEventProcessed(event.id)) {
            console.log(`[webhook] Skipping already-processed event ${event.id}`);
            return new NextResponse(null, { status: 200 });
        }
    } catch (error) {
        // If idempotency check fails, continue processing (safe to reprocess)
        console.warn(`[webhook] Idempotency check failed, processing anyway:`, error);
    }

    // 3. Handle events
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;

                if (session.metadata?.type === 'org_subscription' && session.metadata?.orgId) {
                    // Org checkout
                    await handleOrgCheckoutCompleted(session);
                } else if (session.metadata?.user_id && session.customer) {
                    // Individual checkout
                    await linkStripeCustomer(session.metadata.user_id, session.customer as string);

                    if (session.subscription) {
                        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
                        await updateIndividualSubscription(session.customer as string, subscription);
                    }
                }
                break;
            }

            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const context = getSubscriptionContext(subscription);

                if (context.isOrg && context.orgId) {
                    await updateOrgSubscription(context.orgId, subscription);
                } else {
                    await updateIndividualSubscription(subscription.customer as string, subscription);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const context = getSubscriptionContext(subscription);

                if (context.isOrg && context.orgId) {
                    await handleOrgSubscriptionCanceled(context.orgId);
                } else {
                    await handleIndividualSubscriptionCanceled(subscription.customer as string);
                }
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                const failedSubId = getInvoiceSubscriptionId(invoice);
                if (failedSubId) {
                    const subscription = await stripe.subscriptions.retrieve(failedSubId);
                    const context = getSubscriptionContext(subscription);

                    if (!context.isOrg) {
                        await updateIndividualSubscription(subscription.customer as string, subscription);
                    }
                    await sendPaymentFailedNotification(invoice);
                }
                break;
            }

            case 'invoice.paid': {
                const invoice = event.data.object as Stripe.Invoice;
                const paidSubId = getInvoiceSubscriptionId(invoice);
                if (paidSubId) {
                    const subscription = await stripe.subscriptions.retrieve(paidSubId);
                    const context = getSubscriptionContext(subscription);

                    if (context.isOrg && context.orgId) {
                        await updateOrgSubscription(context.orgId, subscription);
                    } else {
                        await updateIndividualSubscription(subscription.customer as string, subscription);
                    }
                }
                break;
            }

            case 'invoice.payment_action_required': {
                const invoice = event.data.object as Stripe.Invoice;
                console.log(`[webhook] Payment action required for invoice ${invoice.id}`);
                await sendPaymentActionNotification(invoice);
                break;
            }

            case 'charge.refunded': {
                const charge = event.data.object as Stripe.Charge;
                console.log(`[webhook] Refund processed for charge ${charge.id}, amount: ${charge.amount_refunded}`);
                break;
            }
        }

        // Record event as processed
        await recordEvent(event.id, event.type);

    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[webhook] Handler error:`, { eventType: event.type, eventId: event.id, error: errorMessage });

        // Return 200 for business logic errors to prevent infinite Stripe retries
        // Return 500 only for infrastructure failures
        if (errorMessage.includes('connection') || errorMessage.includes('ECONNREFUSED')) {
            return new NextResponse(`Infrastructure Error: ${errorMessage}`, { status: 500 });
        }

        return new NextResponse(null, { status: 200 });
    }

    return new NextResponse(null, { status: 200 });
}
