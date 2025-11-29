import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Building2, ArrowRight } from 'lucide-react';

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
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#051114] text-white p-4">
                <div className="bg-brand-red/10 border border-brand-red/20 p-8 rounded-2xl max-w-md text-center">
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
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#051114] text-white relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-blue-light/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-brand-orange/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative z-10 max-w-lg w-full p-8">
                <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-10 shadow-2xl">
                    <div className="flex justify-center mb-8">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-blue-light to-brand-blue-dark flex items-center justify-center shadow-lg">
                            <Building2 size={40} className="text-white" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-center text-white mb-2">
                        Join {org.name}
                    </h1>
                    <p className="text-center text-slate-400 mb-8">
                        You've been invited to join the <b>{org.name}</b> learning workspace on EnhancedHR.
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

                    <div className="mt-10 space-y-4">
                        {user ? (
                            <form action={`/auth/join-org`} method="POST">
                                <input type="hidden" name="orgId" value={org.id} />
                                <button type="submit" className="w-full py-4 rounded-xl bg-brand-blue-light text-brand-black font-bold uppercase tracking-wider hover:bg-white transition-all shadow-lg flex items-center justify-center gap-2">
                                    Join as {user.email} <ArrowRight size={18} />
                                </button>
                                <p className="text-center text-xs text-slate-500 mt-4">
                                    Not you? <Link href="/auth/signout" className="text-white hover:underline">Sign out</Link>
                                </p>
                            </form>
                        ) : (
                            <>
                                <Link
                                    href={`/login?next=/join/${slug}/${hash}`}
                                    className="block w-full py-4 rounded-xl bg-brand-blue-light text-brand-black font-bold uppercase tracking-wider text-center hover:bg-white transition-all shadow-lg"
                                >
                                    Log In to Join
                                </Link>
                                <Link
                                    href={`/signup?next=/join/${slug}/${hash}`}
                                    className="block w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold uppercase tracking-wider text-center hover:bg-white/10 transition-all"
                                >
                                    Create Account
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
