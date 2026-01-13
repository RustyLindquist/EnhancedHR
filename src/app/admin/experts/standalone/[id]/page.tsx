import React from 'react';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import AdminPageLayout from '@/components/AdminPageLayout';
import StandaloneExpertDetailsDashboard from '@/components/admin/StandaloneExpertDetailsDashboard';
import { StandaloneExpert, StandaloneExpertCredential } from '@/types';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function StandaloneExpertDetailPage({ params }: PageProps) {
    const { id } = await params;
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

    const adminSupabase = await createAdminClient();

    // Fetch standalone expert
    const { data: expert, error: expertError } = await adminSupabase
        .from('standalone_experts')
        .select('*')
        .eq('id', id)
        .single();

    if (expertError || !expert) {
        notFound();
    }

    // Fetch credentials
    const { data: credentials } = await adminSupabase
        .from('standalone_expert_credentials')
        .select('*')
        .eq('standalone_expert_id', id)
        .order('display_order', { ascending: true });

    // Fetch courses assigned to this expert
    const { data: courses } = await adminSupabase
        .from('courses')
        .select('id, title, status, category, image_url, created_at')
        .eq('standalone_expert_id', id)
        .order('created_at', { ascending: false });

    return (
        <AdminPageLayout activeNavId="admin/experts">
            <StandaloneExpertDetailsDashboard
                expert={expert as StandaloneExpert}
                credentials={(credentials || []) as StandaloneExpertCredential[]}
                courses={courses || []}
            />
        </AdminPageLayout>
    );
}
