import React from 'react';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Building2, ArrowRight } from 'lucide-react';
import BackgroundSystem from '@/components/BackgroundSystem';
import { BACKGROUND_THEMES } from '@/constants';
import JoinPageActions from './JoinPageActions';

/**
 * Extract a clean display name from the org name
 * Handles cases like "Rusty Lindquist's Organization" -> "Rusty Lindquist's Organization" (keep as is for title)
 * But for organizations with actual company names, use them directly
 */
function getDisplayName(orgName: string): string {
    // If it ends with "'s Organization", it's likely a platform admin auto-created org
    // In this case, we want to show just the person/company name part for the title
    const suffixMatch = orgName.match(/^(.+)'s Organization$/i);
    if (suffixMatch) {
        return suffixMatch[1]; // Return just "Rusty Lindquist" without "'s Organization"
    }
    return orgName;
}

export default async function JoinPage({ params }: { params: Promise<{ slug: string; hash: string }> }) {
    const { slug, hash } = await params;
    const supabase = await createClient();

    // 1. Validate Invite Link
    const { data: org, error } = await supabase
        .from('organizations')
        .select('id, name, invite_hash')
        .eq('slug', slug)
        .single();

    if (error || !org || org.invite_hash !== hash) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0D12] text-white p-4 relative overflow-hidden">
                <BackgroundSystem theme={BACKGROUND_THEMES[0]} />

                {/* Site Navigation Header */}
                <nav className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2 group">
                            <Image
                                src="/images/logos/EnhancedHR-logo.png"
                                alt="EnhancedHR"
                                width={180}
                                height={40}
                                className="w-[180px] h-auto"
                            />
                        </Link>
                    </div>
                </nav>

                <div className="relative z-10 bg-brand-red/10 border border-brand-red/20 p-8 rounded-2xl max-w-md text-center">
                    <h1 className="text-2xl font-bold text-brand-red mb-4">Invalid Invite Link</h1>
                    <p className="text-slate-400 mb-6">
                        This invite link is either expired or incorrect. Please contact your administrator for a new link.
                    </p>
                    <Link href="/" className="text-brand-blue-light hover:underline">
                        Return to Home
                    </Link>
                </div>
            </div>
        );
    }

    // 2. Check if user is already logged in
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0D12] text-white relative overflow-hidden">
            {/* Background System */}
            <BackgroundSystem theme={BACKGROUND_THEMES[0]} />

            {/* Site Navigation Header */}
            <nav className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <Image
                            src="/images/logos/EnhancedHR-logo.png"
                            alt="EnhancedHR"
                            width={180}
                            height={40}
                            className="w-[180px] h-auto"
                        />
                    </Link>
                </div>
            </nav>

            <div className="relative z-10 max-w-lg w-full p-8 pt-24">
                <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-10 shadow-2xl">
                    <div className="flex justify-center mb-8">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-blue-light to-brand-blue-dark flex items-center justify-center shadow-lg">
                            <Building2 size={40} className="text-white" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-center text-white mb-2">
                        Join {getDisplayName(org.name)}
                    </h1>
                    <p className="text-center text-slate-400 mb-8">
                        You've been invited to create an account on EnhancedHR as a member of <b className="text-white">{getDisplayName(org.name)}</b>
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                            <CheckCircle size={20} className="text-green-400 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-white text-sm">Full Access</h3>
                                <p className="text-xs text-slate-400">Unlock all courses and certifications.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                            <CheckCircle size={20} className="text-green-400 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-white text-sm">Company Paid</h3>
                                <p className="text-xs text-slate-400">No credit card required. Your organization pays.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10">
                        {user ? (
                            <div className="space-y-6">
                                {/* Signed in status */}
                                <p className="text-center text-slate-300">
                                    You're signed in as <span className="text-white font-medium">{user.email}</span>
                                </p>

                                {/* Primary action: Join with current account */}
                                <form action={`/auth/join-org`} method="POST">
                                    <input type="hidden" name="orgId" value={org.id} />
                                    <button type="submit" className="w-full py-4 rounded-xl bg-brand-blue-light text-brand-black font-bold uppercase tracking-wider hover:bg-white transition-all shadow-lg shadow-brand-blue-light/20 hover:shadow-white/30 flex items-center justify-center gap-2">
                                        Join with This Account <ArrowRight size={18} />
                                    </button>
                                </form>

                                {/* Divider */}
                                <div className="border-t border-white/10" />

                                {/* Secondary option: Create new account */}
                                <div className="text-center space-y-3">
                                    <p className="text-sm text-slate-400">Want to keep your accounts separate?</p>
                                    <Link
                                        href={`/login?view=signup&next=/${slug}/${hash}`}
                                        className="block w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold uppercase tracking-wider text-center hover:bg-white/10 hover:border-white/20 transition-all text-sm"
                                    >
                                        Create New Account
                                    </Link>
                                    <p className="text-xs text-slate-500">You'll need a different email address</p>
                                </div>

                                {/* Sign out option */}
                                <p className="text-center text-xs text-slate-500 pt-2">
                                    Not you? <Link href="/auth/signout" className="text-white hover:underline">Sign out</Link>
                                </p>
                            </div>
                        ) : (
                            <JoinPageActions slug={slug} hash={hash} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
