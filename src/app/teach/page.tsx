import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AuthorApplicationForm from '@/components/author/AuthorApplicationForm';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

export default async function TeachPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login?next=/teach');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('author_status')
        .eq('id', user.id)
        .single();

    const status = profile?.author_status || 'none';

    if (status === 'approved') {
        redirect('/author');
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-6">
            <div className="max-w-4xl mx-auto text-center space-y-8">

                {status === 'none' && (
                    <>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                Teach on <span className="text-brand-blue-light">EnhancedHR</span>
                            </h1>
                            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                                Share your expertise with thousands of HR professionals. Earn money and build your brand as a thought leader.
                            </p>
                        </div>
                        <AuthorApplicationForm />
                    </>
                )}

                {status === 'pending' && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-12 max-w-2xl mx-auto">
                        <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Clock className="text-yellow-400" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">Application Under Review</h2>
                        <p className="text-slate-400">
                            Thanks for applying! Our team is currently reviewing your application. We'll be in touch shortly via email.
                        </p>
                    </div>
                )}

                {status === 'rejected' && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-12 max-w-2xl mx-auto">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="text-red-400" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">Application Status</h2>
                        <p className="text-slate-400">
                            Unfortunately, we are not able to move forward with your application at this time.
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}
