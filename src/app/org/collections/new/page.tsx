import React from 'react';
import { createClient } from '@/lib/supabase/server';
import OrgCollectionEditor from '@/components/org/OrgCollectionEditor';

export default async function NewOrgCollectionPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user?.id)
        .single();

    if (!profile?.org_id) return <div>Access Denied</div>;

    return <OrgCollectionEditor collectionId="new" orgId={profile.org_id} />;
}
