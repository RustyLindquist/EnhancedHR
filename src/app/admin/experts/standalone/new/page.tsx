import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StandaloneExpertDetailsDashboard from '@/components/admin/StandaloneExpertDetailsDashboard';

export const dynamic = 'force-dynamic';

export default async function NewStandaloneExpertPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    // Verify Admin
    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (adminProfile?.role !== 'admin') {
        return <div>Access Denied</div>;
    }

    return <StandaloneExpertDetailsDashboard isNew={true} />;
}
