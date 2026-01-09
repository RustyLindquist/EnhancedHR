import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { UpgradeButton, ManageSubscriptionButton, OrgSubscriptionButton } from '@/components/settings/BillingButtons';
import SeatManager from '@/components/settings/SeatManager';
import { stripe } from '@/lib/stripe';
import { CheckCircle, Shield, Clock } from 'lucide-react';
import StandardPageLayout from '@/components/StandardPageLayout';
import BillingHeader from '@/components/settings/BillingHeader';

export default async function BillingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('membership_status, trial_minutes_used, billing_period_end, stripe_customer_id, org_id, role')
        .eq('id', user.id)
        .single();

    const isPlatformAdmin = profile?.role === 'admin';

    let activeMembers = 0;
    let stripeQuantity = 0;

    if (profile?.org_id) {
        // Get Active Member Count
        const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', profile.org_id)
            .neq('membership_status', 'inactive')
        activeMembers = count || 0

        // Get Stripe Quantity
        // Optimization: We could store this in DB, but Stripe is source of truth.
        // We need customer ID from Org table first.
        const { data: org } = await supabase
            .from('organizations')
            .select('stripe_customer_id')
            .eq('id', profile.org_id)
            .single()

        if (org?.stripe_customer_id) {
            const subs = await stripe.subscriptions.list({
                customer: org.stripe_customer_id,
                status: 'active',
                limit: 1
            })
            if (subs.data.length > 0) {
                stripeQuantity = subs.data[0].items.data[0].quantity || 0
            }
        }
    }

    const isPro = profile?.membership_status === 'active' || profile?.membership_status === 'org_admin' || profile?.membership_status === 'employee';
    const isTrial = profile?.membership_status === 'trial';

    return (
        <StandardPageLayout activeNavId="settings">
            <BillingHeader />

            {/* Content Area - Matches MainCanvas content area styles */}
            <div className="flex-1 w-full max-w-7xl mx-auto overflow-y-auto pl-10 pr-6 pb-48 mt-[60px] relative z-10 custom-scrollbar">

                <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">

                    {/* Current Plan Card */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Current Plan</p>
                                <h2 className="text-4xl font-bold text-white mb-2">
                                    {isPro ? 'Pro Membership' : 'Free Trial'}
                                </h2>
                                {isTrial && (
                                    <p className="text-slate-400 flex items-center gap-2">
                                        <Clock size={16} className="text-brand-orange" />
                                        {60 - (profile?.trial_minutes_used || 0)} minutes remaining
                                    </p>
                                )}
                                {isPro && profile?.billing_period_end && (
                                    <p className="text-slate-400">
                                        Renews on {new Date(profile.billing_period_end).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                            <div className={`p-3 rounded-xl ${isPro ? 'bg-green-500/20 text-green-400' : 'bg-brand-orange/20 text-brand-orange'}`}>
                                <Shield size={32} />
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/10 flex gap-4">
                            {isPro ? <ManageSubscriptionButton /> : <UpgradeButton />}
                        </div>
                    </div>


                    {/* Org Seat Management - Show for org_admin or platform admin with org_id */}
                    {(profile?.membership_status === 'org_admin' || isPlatformAdmin) && profile?.org_id && stripeQuantity > 0 && (
                        <SeatManager
                            orgId={profile.org_id!}
                            currentSeats={stripeQuantity}
                            activeMembers={activeMembers}
                        />
                    )}

                    {/* Features List */}
                    {!isPro && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-blue-light/10 to-transparent border border-brand-blue-light/20">
                                <h3 className="text-xl font-bold text-white mb-4">Why Upgrade?</h3>
                                <ul className="space-y-3">
                                    {[
                                        'Unlimited Course Access',
                                        'SHRM & HRCI Credits',
                                        'AI Course Tutor',
                                        'Completion Certificates'
                                    ].map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-slate-300">
                                            <CheckCircle size={18} className="text-brand-blue-light" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </StandardPageLayout>
    );
}
