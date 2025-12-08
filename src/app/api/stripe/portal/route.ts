import { NextRequest, NextResponse } from 'next/server';
import { createCustomerPortalSession } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Fetch user profile to get Stripe Customer ID
        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single();

        if (!profile?.stripe_customer_id) {
            return new NextResponse('No billing account found', { status: 400 });
        }

        const returnUrl = `${req.headers.get('origin')}/settings/billing`;

        const session = await createCustomerPortalSession(
            profile.stripe_customer_id,
            returnUrl
        );

        return NextResponse.json({ url: session.url });

    } catch (error: any) {
        console.error('Stripe Portal Error:', error);
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 });
    }
}
