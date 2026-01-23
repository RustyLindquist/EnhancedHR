import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ExpertResourcesCanvas from './ExpertResourcesCanvas';
import { getExpertResources } from '@/app/actions/expertResources';

export const dynamic = 'force-dynamic';

// The collection ID for expert resources - this is a platform-wide collection
const EXPERT_RESOURCES_COLLECTION_ID = 'expert-resources';

export default async function ExpertResourcesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    // Get user profile to check permissions
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, author_status, role')
        .eq('id', user.id)
        .single();

    // Experts (pending, approved, rejected) and platform admins can access Expert Console
    const hasExpertAccess = profile?.role === 'admin' ||
        (profile?.author_status && profile.author_status !== 'none');

    if (!hasExpertAccess) {
        redirect('/teach');
    }

    // Check if user is a platform admin (can add resources)
    const isPlatformAdmin = profile?.role === 'admin';

    // Fetch resources using admin client to bypass RLS
    const resources = await getExpertResources();

    return (
        <ExpertResourcesCanvas
            resources={resources || []}
            isPlatformAdmin={isPlatformAdmin}
            collectionId={EXPERT_RESOURCES_COLLECTION_ID}
            userId={user.id}
        />
    );
}
