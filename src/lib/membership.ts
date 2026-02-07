import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';

export async function linkStripeCustomer(userId: string, stripeCustomerId: string) {
    const supabase = createAdminClient();
    const { error } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', userId);

    if (error) {
        console.error('Error linking Stripe customer:', error);
        throw error;
    }
}

export async function updateSubscriptionStatus(stripeCustomerId: string, status: string) {
    const supabase = createAdminClient();

    // Check if billing is admin-disabled for this user
    const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('billing_disabled')
        .eq('stripe_customer_id', stripeCustomerId)
        .single();

    if (fetchError) {
        console.error('Error fetching profile for billing check:', fetchError);
        throw fetchError;
    }

    if (profile?.billing_disabled === true) {
        console.log(`[updateSubscriptionStatus] Skipping status update for customer ${stripeCustomerId} — billing is admin-disabled`);
        return;
    }

    // Map Stripe status to our internal status
    let membershipStatus: MembershipStatus = 'inactive';
    if (status === 'active' || status === 'trialing') {
        membershipStatus = 'active';
    }

    const { error } = await supabase
        .from('profiles')
        .update({ membership_status: membershipStatus })
        .eq('stripe_customer_id', stripeCustomerId);

    if (error) {
        console.error('Error updating subscription status:', error);
        throw error;
    }
}

export type MembershipStatus = 'trial' | 'active' | 'inactive' | 'employee' | 'org_admin';

export interface UserMembership {
    userId: string;
    membershipStatus: MembershipStatus;
    trialMinutesUsed: number;
    orgId?: string;
}

/**
 * Fetches the current user's membership status and trial usage.
 */
export async function getMembershipStatus(): Promise<UserMembership | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('membership_status, trial_minutes_used, org_id')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Error fetching membership status:', error);
        return null;
    }

    return {
        userId: user.id,
        membershipStatus: profile.membership_status as MembershipStatus,
        trialMinutesUsed: profile.trial_minutes_used || 0,
        orgId: profile.org_id
    };
}

/**
 * Increments the trial minutes used for the current user.
 * Uses the Supabase RPC function 'increment_trial_minutes'.
 */
export async function incrementTrialUsage(minutes: number) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.rpc('increment_trial_minutes', {
        p_user_id: user.id,
        p_minutes: minutes
    });

    if (error) {
        console.error('Error incrementing trial usage:', error);
    }
}
