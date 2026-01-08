import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getExpertCourseForBuilder, createExpertCourse } from '@/app/actions/expert-course-builder';
import ExpertCourseBuilderClient from './ExpertCourseBuilderClient';

interface ExpertCourseBuilderPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ExpertCourseBuilderPage({ params }: ExpertCourseBuilderPageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    // Check expert status (must be approved or admin)
    const { data: profile } = await supabase
        .from('profiles')
        .select('author_status, role')
        .eq('id', user.id)
        .single();

    if (profile?.author_status !== 'approved' && profile?.role !== 'admin') {
        // Not an approved expert - redirect to teach page to apply
        redirect('/teach');
    }

    // Handle 'new' course creation
    if (id === 'new') {
        const result = await createExpertCourse();
        if (result.success && result.courseId) {
            redirect(`/author/courses/${result.courseId}/builder`);
        } else {
            // Redirect back to courses list
            redirect('/author/courses');
        }
    }

    // Fetch course data
    const courseId = parseInt(id, 10);
    if (isNaN(courseId)) {
        notFound();
    }

    const result = await getExpertCourseForBuilder(courseId);
    if (result.error || !result.course) {
        console.error('Error fetching course for expert builder:', result.error);
        notFound();
    }

    // If course is not draft, redirect - experts can't edit non-draft courses
    if (!result.canEdit) {
        redirect('/author/courses');
    }

    return (
        <ExpertCourseBuilderClient
            course={result.course}
            syllabus={result.syllabus}
            resources={result.resources}
        />
    );
}
