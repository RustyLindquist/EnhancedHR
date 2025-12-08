import { NextRequest, NextResponse } from 'next/server';
import { stripe, createCheckoutSession } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !user.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        const { priceId } = body;

        if (!priceId) {
            return new NextResponse('Price ID is required', { status: 400 });
        }

        // Check if user already has a Stripe Customer ID in profiles
        // (Optional optimization: Fetch it and pass to createCheckoutSession if we want to reuse customers)
        // For now, let's just rely on email matching or let Stripe create a new one which we'll link via webhook.
        // Better practice: Fetch profile, get stripe_customer_id.
        
        let stripeCustomerId: string | undefined;
        // In a real implementation, we'd fetch the profile here.
        // Leaving simple for MVP speed, relies on Webhook to link based on email or future session lookup.
        
        const returnUrl = `${req.headers.get('origin')}/settings/billing`;

        const session = await createCheckoutSession(
            user.id,
            user.email,
            priceId,
            returnUrl
        );

        return NextResponse.json({ sessionId: session.id, url: session.url });

    } catch (error: any) {
        console.error('Stripe Checkout Error:', error);
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 });
    }
}
