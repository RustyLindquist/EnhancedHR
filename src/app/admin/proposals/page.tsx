import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getAllProposals } from '@/app/actions/proposals';
import ProposalsDashboard from '@/components/admin/ProposalsDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminProposalsPage() {
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

    const { proposals, error } = await getAllProposals();

    if (error) {
        console.error('Error fetching proposals:', error);
    }

    return <ProposalsDashboard proposals={proposals || []} />;
}
