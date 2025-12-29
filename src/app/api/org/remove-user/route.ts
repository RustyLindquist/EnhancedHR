import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // 1. Verify Requestor is Org Admin or Platform Admin
        const { data: adminProfile } = await supabase
            .from('profiles')
            .select('org_id, membership_status, role')
            .eq('id', user.id)
            .single();

        const isPlatformAdmin = adminProfile?.role === 'admin';
        if (!isPlatformAdmin && (!adminProfile?.org_id || adminProfile.membership_status !== 'org_admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Verify Target User belongs to same Org (skip for platform admins)
        const { data: targetProfile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', userId)
            .single();

        if (!isPlatformAdmin && targetProfile?.org_id !== adminProfile?.org_id) {
            return NextResponse.json({ error: 'User not in your organization' }, { status: 404 });
        }

        // 3. Remove User from Org (DB)
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                org_id: null,
                membership_status: 'free' // Revert to free/trial
            })
            .eq('id', userId);

        if (updateError) {
            console.error('Error removing user from DB:', updateError);
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }

        // 4. Decrement Stripe Subscription
        // Fetch Org's Stripe Subscription ID - use target user's org_id for platform admins
        const orgIdToQuery = isPlatformAdmin ? targetProfile?.org_id : adminProfile?.org_id;

        if (orgIdToQuery) {
            const { data: org } = await supabase
                .from('organizations')
                .select('stripe_subscription_id')
                .eq('id', orgIdToQuery)
                .single();

            if (org?.stripe_subscription_id) {
                try {
                    const subscription = await stripe.subscriptions.retrieve(org.stripe_subscription_id);
                    const subscriptionItem = subscription.items.data[0]; // Assuming single item subscription

                    if (subscriptionItem) {
                        const currentQuantity = subscriptionItem.quantity || 1;
                        const newQuantity = Math.max(1, currentQuantity - 1); // Don't go below 1 (Admin seat)

                        if (currentQuantity > 1) {
                            await stripe.subscriptions.update(org.stripe_subscription_id, {
                                items: [{
                                    id: subscriptionItem.id,
                                    quantity: newQuantity,
                                }],
                                proration_behavior: 'always_invoice', // or 'create_prorations'
                            });
                            console.log(`Decremented subscription ${org.stripe_subscription_id} to ${newQuantity}`);
                        } else {
                            console.log('Subscription quantity is 1, not decrementing further (Admin seat).');
                        }
                    }
                } catch (stripeError) {
                    console.error('Stripe update failed:', stripeError);
                    // We don't fail the request if Stripe fails, but we log it.
                    // In a production app, we might want to queue this or alert admin.
                }
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error in remove-user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
