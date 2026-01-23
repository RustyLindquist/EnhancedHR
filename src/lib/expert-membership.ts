/**
 * Expert Membership Management
 *
 * Handles automatic membership upgrades when an expert's first course is published,
 * and downgrades when their last published course is unpublished.
 *
 * Business Rules:
 *
 * UPGRADE (First Course Published):
 * - Trial accounts: membership_status = 'active', billing_disabled = true
 * - Paid Individual: billing_disabled = true (stop billing)
 * - Org Owner/Employee: No change (skip)
 *
 * DOWNGRADE (Last Published Course Removed):
 * - Has active Stripe subscription: billing_disabled = false (resume billing)
 * - No Stripe subscription: membership_status = 'trial', billing_disabled = false
 * - Org member: No change (skip)
 *
 * Key invariant: author_status stays 'approved' - only membership benefits change.
 */

import { createAdminClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

// ============================================
// Types
// ============================================

export interface ExpertMembershipContext {
    userId: string;
    membershipStatus: string | null;
    billingDisabled: boolean | null;
    authorStatus: string | null;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    orgId: string | null;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Fetch profile fields needed for membership decisions.
 */
export async function getExpertMembershipContext(userId: string): Promise<ExpertMembershipContext | null> {
    const admin = await createAdminClient();

    const { data: profile, error } = await admin
        .from('profiles')
        .select('id, membership_status, billing_disabled, author_status, stripe_customer_id, stripe_subscription_id, org_id')
        .eq('id', userId)
        .single();

    if (error || !profile) {
        console.error('[getExpertMembershipContext] Error fetching profile:', error);
        return null;
    }

    return {
        userId: profile.id,
        membershipStatus: profile.membership_status,
        billingDisabled: profile.billing_disabled,
        authorStatus: profile.author_status,
        stripeCustomerId: profile.stripe_customer_id,
        stripeSubscriptionId: profile.stripe_subscription_id,
        orgId: profile.org_id,
    };
}

/**
 * Check if user is an org member (owner or employee).
 * Org members should not have their membership changed.
 */
export function isOrgMember(context: ExpertMembershipContext): boolean {
    return context.orgId !== null;
}

/**
 * Count published courses for an author.
 * @param authorId The author's user ID
 * @param excludeCourseId Optional course ID to exclude (for race condition handling)
 */
export async function countPublishedCourses(authorId: string, excludeCourseId?: number): Promise<number> {
    const admin = await createAdminClient();

    let query = admin
        .from('courses')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', authorId)
        .eq('status', 'published');

    if (excludeCourseId) {
        query = query.neq('id', excludeCourseId);
    }

    const { count, error } = await query;

    if (error) {
        console.error('[countPublishedCourses] Error:', error);
        return 0;
    }

    return count || 0;
}

/**
 * Check if user has an active Stripe subscription.
 * Uses Stripe API to verify the subscription status.
 *
 * @returns true if user has an active subscription, false otherwise
 */
export async function hasActiveStripeSubscription(stripeCustomerId: string | null): Promise<boolean> {
    if (!stripeCustomerId) {
        return false;
    }

    try {
        // List subscriptions for this customer
        const subscriptions = await stripe.subscriptions.list({
            customer: stripeCustomerId,
            status: 'active',
            limit: 1,
        });

        return subscriptions.data.length > 0;
    } catch (error) {
        console.error('[hasActiveStripeSubscription] Stripe API error:', error);
        // Conservative fallback: assume no subscription on error
        return false;
    }
}

// ============================================
// Core Membership Operations
// ============================================

/**
 * Upgrade expert membership when their first course is published.
 *
 * Business rules:
 * - Trial accounts: Set membership_status='active', billing_disabled=true
 * - Paid Individual: Set billing_disabled=true (stop billing, keep active status)
 * - Org members: Skip (no change)
 *
 * This is a non-blocking operation - errors are logged but don't fail the parent operation.
 */
export async function upgradeExpertMembership(userId: string): Promise<void> {
    try {
        const context = await getExpertMembershipContext(userId);

        if (!context) {
            console.error('[upgradeExpertMembership] Could not fetch context for user:', userId);
            return;
        }

        // Skip org members - their membership is managed by the org
        if (isOrgMember(context)) {
            console.log(`[upgradeExpertMembership] Skipping org member ${userId}`);
            return;
        }

        const admin = await createAdminClient();

        // Determine the update based on current membership status
        const updateData: Record<string, any> = {
            billing_disabled: true,
        };

        // If user is on trial, upgrade to active
        if (context.membershipStatus === 'trial' || !context.membershipStatus) {
            updateData.membership_status = 'active';
        }
        // If already active (paid), just disable billing

        const { error } = await admin
            .from('profiles')
            .update(updateData)
            .eq('id', userId);

        if (error) {
            console.error('[upgradeExpertMembership] Error updating profile:', error);
            return;
        }

        console.log(`[upgradeExpertMembership] Upgraded expert membership for user ${userId}:`, {
            previousStatus: context.membershipStatus,
            newStatus: updateData.membership_status || context.membershipStatus,
            billingDisabled: true,
        });

    } catch (error) {
        // Non-blocking: log error but don't throw
        console.error('[upgradeExpertMembership] Unexpected error:', error);
    }
}

/**
 * Downgrade expert membership when their last published course is removed.
 *
 * Business rules:
 * - Has active Stripe subscription: Set billing_disabled=false (resume billing)
 * - No Stripe subscription: Set membership_status='trial', billing_disabled=false
 * - Org members: Skip (no change)
 *
 * Key invariant: author_status stays 'approved' - only membership benefits change.
 *
 * This is a non-blocking operation - errors are logged but don't fail the parent operation.
 */
export async function downgradeExpertMembership(userId: string): Promise<void> {
    try {
        const context = await getExpertMembershipContext(userId);

        if (!context) {
            console.error('[downgradeExpertMembership] Could not fetch context for user:', userId);
            return;
        }

        // Skip org members - their membership is managed by the org
        if (isOrgMember(context)) {
            console.log(`[downgradeExpertMembership] Skipping org member ${userId}`);
            return;
        }

        // Only downgrade if user is currently an approved expert with billing disabled
        // This prevents downgrading users who weren't actually getting expert benefits
        if (context.authorStatus !== 'approved') {
            console.log(`[downgradeExpertMembership] User ${userId} is not an approved expert, skipping`);
            return;
        }

        const admin = await createAdminClient();

        // Check if user has an active Stripe subscription
        const hasSubscription = await hasActiveStripeSubscription(context.stripeCustomerId);

        const updateData: Record<string, any> = {
            billing_disabled: false,
        };

        if (hasSubscription) {
            // User has a subscription - just re-enable billing
            // Their membership_status stays 'active'
            console.log(`[downgradeExpertMembership] User ${userId} has active subscription, resuming billing`);
        } else {
            // No subscription - revert to trial
            updateData.membership_status = 'trial';
            console.log(`[downgradeExpertMembership] User ${userId} has no subscription, reverting to trial`);
        }

        const { error } = await admin
            .from('profiles')
            .update(updateData)
            .eq('id', userId);

        if (error) {
            console.error('[downgradeExpertMembership] Error updating profile:', error);
            return;
        }

        console.log(`[downgradeExpertMembership] Downgraded expert membership for user ${userId}:`, {
            hadSubscription: hasSubscription,
            newStatus: updateData.membership_status || 'active',
            billingDisabled: false,
        });

    } catch (error) {
        // Non-blocking: log error but don't throw
        console.error('[downgradeExpertMembership] Unexpected error:', error);
    }
}
