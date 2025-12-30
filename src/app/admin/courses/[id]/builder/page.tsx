import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCourseForBuilder, createBlankCourse } from '@/app/actions/course-builder';
import { getAuthorCredentialsAction } from '@/app/actions/courses';
import AdminCourseBuilderClient from './AdminCourseBuilderClient';

interface CourseBuilderPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function CourseBuilderPage({ params }: CourseBuilderPageProps) {
    const { id } = await params;
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

    // Handle 'new' course creation
    if (id === 'new') {
        const result = await createBlankCourse();
        if (result.success && result.courseId) {
            redirect(`/admin/courses/${result.courseId}/builder`);
        } else {
            // Redirect back to courses list with error
            redirect('/admin/courses');
        }
    }

    // Fetch course data
    const courseId = parseInt(id, 10);
    if (isNaN(courseId)) {
        notFound();
    }

    const result = await getCourseForBuilder(courseId);
    if (result.error || !result.course) {
        console.error('Error fetching course for builder:', result.error);
        notFound();
    }

    // Fetch author credentials if course has an author
    let authorCredentials: any[] = [];
    if (result.course.authorDetails?.id) {
        authorCredentials = await getAuthorCredentialsAction(result.course.authorDetails.id);
    }

    return (
        <AdminCourseBuilderClient
            course={result.course}
            syllabus={result.syllabus}
            resources={result.resources}
            authorCredentials={authorCredentials}
        />
    );
}
