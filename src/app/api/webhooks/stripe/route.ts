import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { linkStripeCustomer, updateSubscriptionStatus } from '@/lib/membership';
import Stripe from 'stripe';

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('Stripe-Signature') as string;

    let event: Stripe.Event;

    try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
             console.error('Missing STRIPE_WEBHOOK_SECRET');
             return new NextResponse('Webhook Secret Missing', { status: 500 });
        }
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error: any) {
        console.error(`Webhook Signature Verification Failed: ${error.message}`);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                if (session.metadata?.user_id && session.customer) {
                    await linkStripeCustomer(session.metadata.user_id, session.customer as string);
                    // Also set status to active initially if needed, though subscription.updated usually follows
                     await updateSubscriptionStatus(session.customer as string, 'active');
                }
                break;
            }
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                await updateSubscriptionStatus(subscription.customer as string, subscription.status);
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await updateSubscriptionStatus(subscription.customer as string, 'canceled');
                break;
            }
        }
    } catch (error: any) {
        console.error(`Webhook Handler Error: ${error.message}`);
        return new NextResponse(`Handler Error: ${error.message}`, { status: 500 });
    }

    return new NextResponse(null, { status: 200 });
}
