import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AuthorCoursesContent from './AuthorCoursesContent';

export const dynamic = 'force-dynamic';

export default async function AuthorCoursesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    // Get author's courses
    const { data: courses } = await supabase
        .from('courses')
        .select(`
            id,
            title,
            description,
            status,
            created_at,
            image_url
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

    // Get watch time stats for each course
    const courseIds = courses?.map(c => c.id) || [];
    const { data: watchStats } = await supabase
        .from('user_progress')
        .select('course_id, view_time_seconds, user_id')
        .in('course_id', courseIds.length > 0 ? courseIds : [-1]);

    // Aggregate stats per course (convert Set to count for serialization)
    const courseStats: Record<number, { totalMinutes: number; studentCount: number }> = {};
    const tempStats: Record<number, { totalMinutes: number; uniqueStudents: Set<string> }> = {};
    watchStats?.forEach(stat => {
        if (!tempStats[stat.course_id]) {
            tempStats[stat.course_id] = { totalMinutes: 0, uniqueStudents: new Set() };
        }
        tempStats[stat.course_id].totalMinutes += (stat.view_time_seconds || 0) / 60;
        tempStats[stat.course_id].uniqueStudents.add(stat.user_id);
    });

    // Convert Sets to counts for serialization to client component
    Object.entries(tempStats).forEach(([id, stats]) => {
        courseStats[Number(id)] = {
            totalMinutes: stats.totalMinutes,
            studentCount: stats.uniqueStudents.size
        };
    });

    return (
        <AuthorCoursesContent
            courses={courses || []}
            courseStats={courseStats}
        />
    );
}
