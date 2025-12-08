import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is missing. Please set it in your .env.local file.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-11-17.clover' as any,
    typescript: true,
});

export async function createCheckoutSession(userId: string, email: string, priceId: string, returnUrl: string) {
    if (!priceId) throw new Error('Price ID is required');

    const session = await stripe.checkout.sessions.create({
        customer_email: email,
        metadata: {
            user_id: userId,
        },
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: 'subscription',
        success_url: `${returnUrl}?success=true`,
        cancel_url: `${returnUrl}?canceled=true`,
        allow_promotion_codes: true,
        subscription_data: {
            metadata: {
                user_id: userId,
            },
        },
    });

    return session;
}

export async function createCustomerPortalSession(customerId: string, returnUrl: string) {
    const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    });

    return session;
}

