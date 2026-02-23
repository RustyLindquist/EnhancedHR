import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getMyProposals } from '@/app/actions/proposals';
import CourseProposalsPage from './CourseProposalsPage';

export const dynamic = 'force-dynamic';

export default async function AuthorProposalsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { proposals } = await getMyProposals();

    return <CourseProposalsPage proposals={proposals} />;
}
