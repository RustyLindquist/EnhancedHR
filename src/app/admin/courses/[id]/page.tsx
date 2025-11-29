import React from 'react';
import { createClient } from '@/lib/supabase/server';
import CourseEditor from '@/components/admin/CourseEditor';
import { notFound } from 'next/navigation';

interface EditCoursePageProps {
    params: {
        id: string;
    };
}

export default async function EditCoursePage({ params }: EditCoursePageProps) {
    const { id } = params;
    const supabase = await createClient();

    const { data: course, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !course) {
        notFound();
    }

    return <CourseEditor courseId={id} initialData={course} />;
}
