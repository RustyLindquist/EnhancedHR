import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return new NextResponse('Unauthorized', { status: 401 });

        const { immediate = false } = await req.json();

        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_subscription_id')
            .eq('id', user.id)
            .single();

        if (!profile?.stripe_subscription_id) {
            return new NextResponse('No active subscription', { status: 400 });
        }

        if (immediate) {
            await stripe.subscriptions.cancel(profile.stripe_subscription_id);
        } else {
            await stripe.subscriptions.update(profile.stripe_subscription_id, {
                cancel_at_period_end: true,
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Cancel subscription error:', error);
        return new NextResponse(error.message || 'Internal Error', { status: 500 });
    }
}
