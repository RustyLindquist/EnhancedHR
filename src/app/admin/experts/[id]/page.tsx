import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getExpertDetails, getExpertCourses, getExpertPerformance } from '@/app/actions/experts';
import { getExpertProposals } from '@/app/actions/proposals';
import { adminGetExpertCredentials } from '@/app/actions/credentials';
import ExpertDetailsDashboard from '@/components/admin/ExpertDetailsDashboard';

export const dynamic = 'force-dynamic';

interface ExpertDetailsPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ExpertDetailsPage({ params }: ExpertDetailsPageProps) {
    const { id: expertId } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        redirect('/dashboard');
    }

    // Fetch all expert data in parallel
    const [expertResult, proposalsResult, coursesResult, performanceResult, credentials] = await Promise.all([
        getExpertDetails(expertId),
        getExpertProposals(expertId),
        getExpertCourses(expertId),
        getExpertPerformance(expertId),
        adminGetExpertCredentials(expertId)
    ]);

    // Handle errors
    if (expertResult.error || !expertResult.expert) {
        console.error('Error fetching expert:', expertResult.error);
        notFound();
    }

    return (
        <ExpertDetailsDashboard
            expert={expertResult.expert}
            proposals={proposalsResult.proposals}
            courses={coursesResult.courses}
            performance={performanceResult.performance}
            credentials={credentials}
        />
    );
}
