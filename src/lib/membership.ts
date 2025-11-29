import { createClient } from '@/lib/supabase/client';

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
