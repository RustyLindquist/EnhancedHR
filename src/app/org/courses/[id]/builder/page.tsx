import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getOrgContext } from '@/lib/org-context';
import { getCourseForBuilder } from '@/app/actions/course-builder';
import { getAuthorCredentialsAction } from '@/app/actions/courses';
import OrgCourseBuilderClient from './OrgCourseBuilderClient';

interface OrgCourseBuilderPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function OrgCourseBuilderPage({ params }: OrgCourseBuilderPageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    // Get org context
    const orgContext = await getOrgContext();

    if (!orgContext) {
        redirect('/');
    }

    // Only org admins and platform admins can access the builder
    if (!orgContext.isOrgAdmin && !orgContext.isPlatformAdmin) {
        redirect('/org/courses');
    }

    // Parse course ID
    const courseId = parseInt(id, 10);
    if (isNaN(courseId)) {
        notFound();
    }

    // Fetch course data using the shared getCourseForBuilder
    const result = await getCourseForBuilder(courseId);
    if (result.error || !result.course) {
        console.error('Error fetching course for org builder:', result.error);
        notFound();
    }

    // Verify this is an org course that belongs to the user's org
    // First, get the full course record to check org_id
    const { data: courseRecord } = await supabase
        .from('courses')
        .select('org_id')
        .eq('id', courseId)
        .single();

    if (!courseRecord) {
        notFound();
    }

    // Verify the course belongs to the current org (unless platform admin)
    if (!orgContext.isPlatformAdmin && courseRecord.org_id !== orgContext.orgId) {
        redirect('/org/courses');
    }

    // Verify this is actually an org course (has org_id)
    if (!courseRecord.org_id) {
        redirect('/org/courses');
    }

    // Fetch author credentials if course has an author
    let authorCredentials: any[] = [];
    if (result.course.authorDetails?.id) {
        authorCredentials = await getAuthorCredentialsAction(result.course.authorDetails.id);
    }

    return (
        <OrgCourseBuilderClient
            course={result.course}
            syllabus={result.syllabus}
            resources={result.resources}
            authorCredentials={authorCredentials}
            orgId={orgContext.orgId}
        />
    );
}
