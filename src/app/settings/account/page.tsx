import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { UpgradeButton, ManageSubscriptionButton } from '@/components/settings/BillingButtons';
import ChangePasswordPanel from '@/components/settings/ChangePasswordPanel';
import AvatarSection from '@/components/settings/AvatarSection';
import BecomeExpertSection from '@/components/settings/BecomeExpertSection';
import { Shield, Clock, User, CreditCard, Mail } from 'lucide-react';
import StandardPageLayout from '@/components/StandardPageLayout';

export default async function AccountPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('membership_status, role, author_status, trial_minutes_used, billing_period_end, full_name, avatar_url, org_id, billing_disabled, is_sales, organizations!profiles_org_id_fkey(name)')
        .eq('id', user.id)
        .single();

    // Determine if user can see "Become an Expert" section
    // Show for users who are NOT admins and NOT already experts (pending, approved, or rejected)
    const hasExpertStatus = profile?.author_status && profile.author_status !== 'none';
    const canBecomeExpert = profile?.role !== 'admin' && !hasExpertStatus;



    return (
        <StandardPageLayout activeNavId="settings">
            {/* Header - positioned absolutely with original transparency to show content scrolling underneath */}
            <div className="absolute top-0 left-0 right-0 h-24 flex-shrink-0 border-b border-white/10 bg-white/5 backdrop-blur-xl z-30 shadow-[0_4px_30px_rgba(0,0,0,0.1)] flex items-center justify-between px-10">
                <div>
                    <div className="flex items-center space-x-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue-light drop-shadow-[0_0_5px_rgba(120,192,240,0.5)]">
                            Settings
                        </span>
                    </div>
                    <h1 className="text-3xl font-light text-white tracking-tight drop-shadow-lg">
                        My <span className="font-bold text-white">Account</span>
                    </h1>
                </div>
            </div>

            {/* Content Area - uses flex-1 to take remaining space, scrolls under header */}
            {/* pt-[150px] = header height (96px) + 54px spacing for visual start position */}
            <div className="flex-1 w-full max-w-7xl mx-auto overflow-y-auto pl-10 pr-6 pb-48 pt-[150px] relative z-10 custom-scrollbar">

                <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">

                    {/* 1. Account Information */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-brand-blue-light/10 text-brand-blue-light">
                                <User size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Account Information</h2>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm space-y-6">
                            {/* Profile Photo */}
                            <AvatarSection userId={user.id} currentAvatarUrl={profile?.avatar_url} />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 text-white">
                                        <span>{profile?.full_name || user.user_metadata?.full_name || 'Not set'}</span>
                                        <button className="text-xs font-bold text-brand-blue-light hover:text-white transition-colors">EDIT</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 text-white">
                                        <div className="flex items-center gap-3">
                                            <Mail size={16} className="text-slate-400" />
                                            <span>{user.email}</span>
                                        </div>
                                        <button className="text-xs font-bold text-brand-blue-light hover:text-white transition-colors">CHANGE</button>
                                    </div>
                                </div>
                            </div>

                            <ChangePasswordPanel />
                        </div>
                    </section>

                    {/* Membership Logic Calculation */}
                    {(() => {
                        const role = profile?.role;
                        const mStatus = profile?.membership_status;
                        const aStatus = profile?.author_status;
                        const orgName = (profile?.organizations as any)?.name || 'Organization';

                        let membershipTitle = 'Free Trial';
                        let BillingComponent = null;

                        // Hierarchy of Roles
                        if (role === 'admin') {
                            membershipTitle = 'Platform Administrator';
                            BillingComponent = (
                                <div>
                                    <p className="text-slate-300">Your membership is free as a Platform Administrator.</p>
                                </div>
                            );
                        } else if (role === 'org_owner') {
                            membershipTitle = 'Organizational Account Owner & Administrator';
                            BillingComponent = (
                                <div>
                                    <p className="text-slate-300 mb-4">You have access to manage the billing for <b>{orgName}</b>.</p>
                                    <ManageSubscriptionButton />
                                </div>
                            );
                        } else if (mStatus === 'org_admin') {
                            membershipTitle = 'Organizational Administrator';
                            BillingComponent = (
                                <div>
                                    <p className="text-slate-300 mb-4">Your membership is provided by your organization (<b>{orgName}</b>).</p>
                                </div>
                            );
                        } else if (mStatus === 'employee') {
                            membershipTitle = 'Employee Membership';
                            BillingComponent = (
                                <div>
                                    <p className="text-slate-300 mb-4">Your membership is provided by your organization (<b>{orgName}</b>).</p>
                                </div>
                            );
                        } else if (aStatus === 'approved' && profile?.billing_disabled) {
                            // Active expert with free membership (has published course)
                            membershipTitle = 'Expert Membership';
                            BillingComponent = (
                                <div>
                                    <p className="text-slate-300">As an approved platform expert with a published course, your membership is provided free of charge.</p>
                                </div>
                            );
                        } else if (aStatus === 'approved' && mStatus === 'active') {
                            // Approved expert who also has a paid subscription (billing resumed after downgrade, then kept paying)
                            membershipTitle = 'Expert Membership + Pro';
                            BillingComponent = (
                                <div>
                                    <p className="text-slate-300 mb-4">You are an approved platform expert. You also have an active Pro subscription.</p>
                                    <ManageSubscriptionButton />
                                </div>
                            );
                        } else if (aStatus === 'approved') {
                            // Approved expert without published courses (downgraded to trial or no subscription)
                            membershipTitle = 'Expert Account (No Published Courses)';
                            BillingComponent = (
                                <div>
                                    <p className="text-slate-300 mb-6">You are an approved platform expert, but you currently have no published courses. Publish a course to restore your free Expert Membership, or upgrade to Pro.</p>
                                    <div className="flex gap-4">
                                        <UpgradeButton />
                                    </div>
                                </div>
                            );
                        } else if (aStatus === 'pending') {
                            membershipTitle = 'Expert Account (Pending Approval)';
                            BillingComponent = (
                                <div>
                                    <p className="text-slate-300">You have access to the Expert Console where you can build and submit courses. Once your first course is approved and published, you&apos;ll become a fully approved expert with free membership.</p>
                                </div>
                            );
                        } else if (aStatus === 'rejected') {
                            membershipTitle = 'Expert Account';
                            BillingComponent = (
                                <div>
                                    <p className="text-slate-300">You have access to the Expert Console where you can build and submit courses. Once your first course is approved and published, you&apos;ll become a fully approved expert.</p>
                                </div>
                            );
                        } else if (mStatus === 'active') {
                            membershipTitle = 'Personal Membership';
                            BillingComponent = (
                                <div>
                                    <p className="text-slate-300 mb-6">Manage your subscription, payment methods, and billing history securely via Stripe.</p>
                                    <div className="flex gap-4">
                                        <ManageSubscriptionButton />
                                    </div>
                                </div>
                            );
                        } else {
                            // Default / Trial
                            membershipTitle = 'Free Trial';
                            BillingComponent = (
                                <div>
                                    <p className="text-slate-300 mb-6">Upgrade to a Pro Membership to unlock unlimited access, certificates, and AI tutoring.</p>
                                    <div className="flex gap-4">
                                        <UpgradeButton />
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <>
                                {/* 2. Membership Information */}
                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                                            <Shield size={24} />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white">Membership Information</h2>
                                    </div>

                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Current Status</p>
                                                <h3 className="text-3xl font-bold text-white mb-2">{membershipTitle}</h3>

                                                {mStatus === 'trial' && role !== 'admin' && aStatus !== 'approved' && aStatus !== 'pending' && (
                                                    <p className="text-slate-400 flex items-center gap-2">
                                                        <Clock size={16} className="text-brand-orange" />
                                                        {60 - (profile?.trial_minutes_used || 0)} minutes remaining
                                                    </p>
                                                )}

                                                {mStatus === 'active' && profile?.billing_period_end && (
                                                    <p className="text-slate-400">
                                                        Renews on {new Date(profile.billing_period_end).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                            <div className={`p-3 rounded-xl ${mStatus === 'active' || role === 'admin' || aStatus === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-brand-orange/20 text-brand-orange'}`}>
                                                <Shield size={32} />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* 3. Billing Information */}
                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                                            <CreditCard size={24} />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white">Billing Information</h2>
                                    </div>

                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                                        {BillingComponent}
                                    </div>
                                </section>
                            </>
                        );
                    })()}

                    {/* Become an Expert Section - For non-admins who aren't already approved experts */}
                    {canBecomeExpert && (
                        <BecomeExpertSection
                            userId={user.id}
                            fullName={profile?.full_name || user.user_metadata?.full_name || ''}
                            authorStatus={profile?.author_status || null}
                        />
                    )}

                </div>

                <div className="mt-16 pt-8 border-t border-white/5 text-center">
                    <p className="text-xs text-slate-600">
                        <a href="/terms" className="hover:text-slate-400 transition-colors mr-4">Terms of Service</a>
                        <a href="/privacy" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
                    </p>
                </div>
            </div>
        </StandardPageLayout>
    );
}
