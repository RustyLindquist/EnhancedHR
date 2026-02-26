import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';
import type { MembershipStatus } from '@/lib/membership';
import { sendPaymentFailedEmail, sendPaymentActionRequiredEmail } from '@/lib/email';

/**
 * Check if a webhook event has already been processed (idempotency).
 */
export async function isEventProcessed(eventId: string): Promise<boolean> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('webhook_events')
        .select('id')
        .eq('id', eventId)
        .single();

    if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is expected for new events
        console.error('[webhook] Error checking event idempotency:', error);
        throw error;
    }

    return !!data;
}

/**
 * Record a webhook event as processed. Upsert-safe (ignores conflicts).
 */
export async function recordEvent(eventId: string, eventType: string): Promise<void> {
    const supabase = createAdminClient();
    const { error } = await supabase
        .from('webhook_events')
        .upsert(
            { id: eventId, event_type: eventType },
            { onConflict: 'id', ignoreDuplicates: true }
        );

    if (error) {
        console.error('[webhook] Error recording event:', error);
        // Non-fatal: event processing succeeded even if recording fails
    }
}

/**
 * Extract org vs individual context from subscription metadata.
 */
export function getSubscriptionContext(subscription: Stripe.Subscription): {
    isOrg: boolean;
    orgId: string | null;
    userId: string | null;
} {
    const orgId = subscription.metadata?.orgId || null;
    const userId = subscription.metadata?.user_id || null;

    return {
        isOrg: !!orgId,
        orgId,
        userId,
    };
}

/**
 * Map Stripe subscription status to internal MembershipStatus.
 */
export function mapStripeStatus(stripeStatus: string): MembershipStatus {
    switch (stripeStatus) {
        case 'active':
        case 'trialing':
            return 'active';
        case 'past_due':
            return 'past_due';
        default:
            // canceled, unpaid, incomplete, incomplete_expired, paused
            return 'inactive';
    }
}

/**
 * Update an individual user's subscription data in the profiles table.
 */
export async function updateIndividualSubscription(
    stripeCustomerId: string,
    subscription: Stripe.Subscription
): Promise<void> {
    const supabase = createAdminClient();

    // Check if billing is admin-disabled for this user
    const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('billing_disabled')
        .eq('stripe_customer_id', stripeCustomerId)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('[webhook] Error fetching profile for billing check:', fetchError);
        throw fetchError;
    }

    if (profile?.billing_disabled === true) {
        console.log(`[webhook] Skipping update for customer ${stripeCustomerId} — billing is admin-disabled`);
        return;
    }

    const status = mapStripeStatus(subscription.status);

    // Stripe v20 removed current_period_end from TS types, but the API still returns it.
    // Use type assertion to access it safely with a fallback.
    const periodEnd = (subscription as any).current_period_end as number | undefined;

    const updateData: Record<string, any> = {
        membership_status: status,
        stripe_subscription_id: subscription.id,
    };

    if (periodEnd) {
        updateData.billing_period_end = new Date(periodEnd * 1000).toISOString();
    }

    // Set price ID from first subscription item if available
    if (subscription.items?.data?.length > 0) {
        updateData.stripe_price_id = subscription.items.data[0].price.id;
    }

    // Grace period: if past_due, extend billing_period_end by 7 days from now
    if (status === 'past_due') {
        const gracePeriodEnd = new Date();
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);
        updateData.billing_period_end = gracePeriodEnd.toISOString();
    }

    const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('stripe_customer_id', stripeCustomerId);

    if (error) {
        console.error('[webhook] Error updating individual subscription:', error);
        throw error;
    }
}

/**
 * Update an organization's subscription data.
 */
export async function updateOrgSubscription(
    orgId: string,
    subscription: Stripe.Subscription
): Promise<void> {
    const supabase = createAdminClient();

    const accountType =
        subscription.status === 'active' || subscription.status === 'trialing'
            ? 'paid'
            : 'trial';

    const { error } = await supabase
        .from('organizations')
        .update({
            stripe_subscription_id: subscription.id,
            account_type: accountType,
        })
        .eq('id', orgId);

    if (error) {
        console.error('[webhook] Error updating org subscription:', error);
        throw error;
    }
}

/**
 * Handle checkout.session.completed for org subscriptions.
 */
export async function handleOrgCheckoutCompleted(
    session: Stripe.Checkout.Session
): Promise<void> {
    const orgId = session.metadata?.orgId;
    if (!orgId) {
        console.warn('[webhook] Org checkout session missing orgId in metadata');
        return;
    }

    const supabase = createAdminClient();

    const updateData: Record<string, any> = {
        account_type: 'paid',
    };

    if (session.customer) {
        updateData.stripe_customer_id = session.customer as string;
    }

    if (session.subscription) {
        updateData.stripe_subscription_id = session.subscription as string;
    }

    const { error } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', orgId);

    if (error) {
        console.error('[webhook] Error handling org checkout completed:', error);
        throw error;
    }
}

/**
 * Handle subscription cancellation for an individual user.
 */
export async function handleIndividualSubscriptionCanceled(
    stripeCustomerId: string
): Promise<void> {
    const supabase = createAdminClient();

    // Check if billing is admin-disabled
    const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('billing_disabled')
        .eq('stripe_customer_id', stripeCustomerId)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('[webhook] Error fetching profile for cancellation check:', fetchError);
        throw fetchError;
    }

    if (profile?.billing_disabled === true) {
        console.log(`[webhook] Skipping cancellation for customer ${stripeCustomerId} — billing is admin-disabled`);
        return;
    }

    const { error } = await supabase
        .from('profiles')
        .update({
            membership_status: 'inactive' as MembershipStatus,
            stripe_subscription_id: null,
            stripe_price_id: null,
        })
        .eq('stripe_customer_id', stripeCustomerId);

    if (error) {
        console.error('[webhook] Error handling individual subscription cancellation:', error);
        throw error;
    }
}

/**
 * Handle subscription cancellation for an organization.
 */
export async function handleOrgSubscriptionCanceled(orgId: string): Promise<void> {
    const supabase = createAdminClient();

    const { error } = await supabase
        .from('organizations')
        .update({
            account_type: 'trial',
            stripe_subscription_id: null,
        })
        .eq('id', orgId);

    if (error) {
        console.error('[webhook] Error handling org subscription cancellation:', error);
        throw error;
    }
}

/**
 * Send a payment failed notification email to the user associated with the invoice.
 * Non-blocking: logs errors but does not throw.
 */
export async function sendPaymentFailedNotification(invoice: Stripe.Invoice): Promise<void> {
    try {
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        if (!customerId) {
            console.warn('[webhook] No customer ID on invoice for payment failed notification');
            return;
        }

        const supabase = createAdminClient();
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('stripe_customer_id', customerId)
            .single();

        if (profileError || !profile) {
            console.warn('[webhook] Could not find profile for customer', customerId, profileError);
            return;
        }

        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(profile.id);
        if (userError || !user?.email) {
            console.warn('[webhook] Could not get user email for notification', profile.id, userError);
            return;
        }

        await sendPaymentFailedEmail(user.email, profile.full_name || 'there', invoice.hosted_invoice_url);
    } catch (error) {
        console.error('[webhook] Error sending payment failed notification:', error);
    }
}

/**
 * Send a payment action required notification email to the user associated with the invoice.
 * Non-blocking: logs errors but does not throw.
 */
export async function sendPaymentActionNotification(invoice: Stripe.Invoice): Promise<void> {
    try {
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        if (!customerId) {
            console.warn('[webhook] No customer ID on invoice for payment action notification');
            return;
        }

        const supabase = createAdminClient();
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('stripe_customer_id', customerId)
            .single();

        if (profileError || !profile) {
            console.warn('[webhook] Could not find profile for customer', customerId, profileError);
            return;
        }

        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(profile.id);
        if (userError || !user?.email) {
            console.warn('[webhook] Could not get user email for notification', profile.id, userError);
            return;
        }

        await sendPaymentActionRequiredEmail(user.email, profile.full_name || 'there', invoice.hosted_invoice_url);
    } catch (error) {
        console.error('[webhook] Error sending payment action required notification:', error);
    }
}
