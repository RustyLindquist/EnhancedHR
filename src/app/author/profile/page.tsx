import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getMyCredentials } from '@/app/actions/credentials';
import ExpertProfileEditor from './ExpertProfileEditor';

export const dynamic = 'force-dynamic';

export default async function ExpertProfilePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    // Fetch profile data
    const { data: profile } = await supabase
        .from('profiles')
        .select('phone_number, linkedin_url, twitter_url, website_url, author_bio, expert_title, avatar_url, full_name')
        .eq('id', user.id)
        .single();

    // Fetch credentials
    const credentials = await getMyCredentials();

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Expert Profile</h1>
                <p className="text-slate-400">
                    Manage your expert profile information. This will be displayed on your course pages and expert profile.
                </p>
            </div>

            {/* Profile Editor */}
            <ExpertProfileEditor
                userId={user.id}
                fullName={profile?.full_name || user.user_metadata?.full_name || ''}
                avatarUrl={profile?.avatar_url || null}
                phoneNumber={profile?.phone_number || null}
                linkedinUrl={profile?.linkedin_url || null}
                twitterUrl={profile?.twitter_url || null}
                websiteUrl={profile?.website_url || null}
                credentials={credentials}
                authorBio={profile?.author_bio || null}
                expertTitle={profile?.expert_title || null}
            />
        </div>
    );
}
