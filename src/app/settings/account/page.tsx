import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { UpgradeButton, ManageSubscriptionButton } from '@/components/settings/BillingButtons';
import { CheckCircle, Shield, Clock, User, CreditCard, Building2, Key, Mail } from 'lucide-react';
import StandardPageLayout from '@/components/StandardPageLayout';
import CanvasHeader from '@/components/CanvasHeader';

export default async function AccountPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Please log in.</div>;

    const { data: profile } = await supabase
        .from('profiles')
        .select('membership_status, trial_minutes_used, billing_period_end, full_name, org_id, organizations(name)')
        .eq('id', user.id)
        .single();

    const isPro = profile?.membership_status === 'active' || profile?.membership_status === 'org_admin' || profile?.membership_status === 'employee';
    const isTrial = profile?.membership_status === 'trial';
    const isOrgMember = profile?.membership_status === 'employee' || profile?.membership_status === 'org_admin';
    const orgName = (profile?.organizations as any)?.name;

    return (
        <StandardPageLayout activeNavId="settings">
            <CanvasHeader context="Settings" title="My Account" />

            {/* Content Area */}
            <div className="flex-1 w-full max-w-7xl mx-auto overflow-y-auto pl-10 pr-6 pb-48 mt-[60px] relative z-10 custom-scrollbar">

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

                            <div className="pt-6 border-t border-white/10">
                                <button className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">
                                    <Key size={16} />
                                    Reset Password
                                </button>
                            </div>
                        </div>
                    </section>

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
                                    <h3 className="text-3xl font-bold text-white mb-2">
                                        {isOrgMember ? `${orgName} Membership` : isPro ? 'Pro Membership' : 'Free Trial'}
                                    </h3>

                                    {isOrgMember && (
                                        <p className="text-slate-400 flex items-center gap-2">
                                            <Building2 size={16} className="text-purple-400" />
                                            Provided by your organization
                                        </p>
                                    )}

                                    {isTrial && (
                                        <p className="text-slate-400 flex items-center gap-2">
                                            <Clock size={16} className="text-brand-orange" />
                                            {60 - (profile?.trial_minutes_used || 0)} minutes remaining
                                        </p>
                                    )}

                                    {isPro && !isOrgMember && profile?.billing_period_end && (
                                        <p className="text-slate-400">
                                            Renews on {new Date(profile.billing_period_end).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                                <div className={`p-3 rounded-xl ${isPro ? 'bg-green-500/20 text-green-400' : 'bg-brand-orange/20 text-brand-orange'}`}>
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
                            {isOrgMember ? (
                                <div>
                                    <p className="text-slate-300 mb-4">
                                        Your billing is managed by <b>{orgName}</b>. You do not need to add a payment method.
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        If you leave this organization, you will need to set up your own billing to maintain access.
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-slate-300 mb-6">
                                        {isPro
                                            ? "Manage your subscription, payment methods, and billing history securely via Stripe."
                                            : "Upgrade to a Pro Membership to unlock unlimited access, certificates, and AI tutoring."}
                                    </p>

                                    <div className="flex gap-4">
                                        {isPro ? <ManageSubscriptionButton /> : <UpgradeButton />}
                                    </div>

                                    {!isPro && (
                                        <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                'Unlimited Course Access',
                                                'SHRM & HRCI Credits',
                                                'AI Course Tutor',
                                                'Completion Certificates'
                                            ].map((feature, i) => (
                                                <div key={i} className="flex items-center gap-3 text-slate-400 text-sm">
                                                    <CheckCircle size={16} className="text-brand-blue-light" />
                                                    {feature}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

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
