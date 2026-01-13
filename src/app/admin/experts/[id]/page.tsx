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
    console.log('[ExpertDetailsPage] Route matched, starting render');
    const { id: expertId } = await params;
    console.log('[ExpertDetailsPage] Expert ID from params:', expertId);

    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    console.log('[ExpertDetailsPage] Auth check - user:', user?.id || 'null');
    if (!user) {
        console.log('[ExpertDetailsPage] No user, redirecting to login');
        redirect('/login');
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    console.log('[ExpertDetailsPage] User role:', profile?.role || 'null');
    if (profile?.role !== 'admin') {
        console.log('[ExpertDetailsPage] Not admin, redirecting to dashboard');
        redirect('/dashboard');
    }

    // Fetch all expert data in parallel
    console.log('[ExpertDetailsPage] Fetching expert data...');
    const [expertResult, proposalsResult, coursesResult, performanceResult, credentials] = await Promise.all([
        getExpertDetails(expertId),
        getExpertProposals(expertId),
        getExpertCourses(expertId),
        getExpertPerformance(expertId),
        adminGetExpertCredentials(expertId)
    ]);

    console.log('[ExpertDetailsPage] Expert result:', {
        hasExpert: !!expertResult.expert,
        error: expertResult.error || 'none'
    });

    // Handle errors
    if (expertResult.error || !expertResult.expert) {
        console.error('[ExpertDetailsPage] Error fetching expert, calling notFound(). Error:', expertResult.error);
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
