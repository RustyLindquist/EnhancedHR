import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BookOpen, Video, Users, Clock, Plus, Edit3 } from 'lucide-react';
import Link from 'next/link';

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

    // Aggregate stats per course
    const courseStats: Record<number, { totalMinutes: number; uniqueStudents: Set<string> }> = {};
    watchStats?.forEach(stat => {
        if (!courseStats[stat.course_id]) {
            courseStats[stat.course_id] = { totalMinutes: 0, uniqueStudents: new Set() };
        }
        courseStats[stat.course_id].totalMinutes += (stat.view_time_seconds || 0) / 60;
        courseStats[stat.course_id].uniqueStudents.add(stat.user_id);
    });

    const formatMinutes = (minutes: number) => {
        if (minutes < 60) return `${Math.round(minutes)}m`;
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">My Courses</h1>
                    <p className="text-slate-400">
                        Create, edit, and track your courses.
                    </p>
                </div>
                <Link
                    href="/author/courses/new/builder"
                    className="flex items-center gap-2 px-5 py-3 rounded-full bg-brand-blue-light text-brand-black font-bold hover:bg-brand-blue-light/90 transition-colors"
                >
                    <Plus size={18} />
                    Add Course
                </Link>
            </div>

            {/* Courses Grid */}
            {courses && courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => {
                        const stats = courseStats[course.id] || { totalMinutes: 0, uniqueStudents: new Set() };
                        const isDraft = course.status === 'draft';
                        const isPendingReview = course.status === 'pending_review';
                        const isPublished = course.status === 'published';

                        return (
                            <div
                                key={course.id}
                                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-colors group relative"
                            >
                                {/* Thumbnail - Link to course view */}
                                <Link href={`/courses/${course.id}`} className="block">
                                    <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 relative">
                                        {course.image_url ? (
                                            <img
                                                src={course.image_url}
                                                alt={course.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Video size={48} className="text-slate-600" />
                                            </div>
                                        )}
                                        {/* Status Badge */}
                                        <div className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-bold ${
                                            isPublished
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                : isPendingReview
                                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                        }`}>
                                            {isPublished ? 'Published' : isPendingReview ? 'Pending Review' : 'Draft'}
                                        </div>
                                    </div>
                                </Link>

                                {/* Content */}
                                <div className="p-5">
                                    <Link href={`/courses/${course.id}`}>
                                        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-brand-blue-light transition-colors">
                                            {course.title}
                                        </h3>
                                    </Link>
                                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                                        {course.description || 'No description'}
                                    </p>

                                    {/* Stats & Edit Button Row */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <Clock size={12} />
                                                <span>{formatMinutes(stats.totalMinutes)} watched</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users size={12} />
                                                <span>{stats.uniqueStudents.size} students</span>
                                            </div>
                                        </div>

                                        {/* Edit Button - Only for draft courses */}
                                        {isDraft && (
                                            <Link
                                                href={`/author/courses/${course.id}/builder`}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-blue-light/10 border border-brand-blue-light/30 text-brand-blue-light text-xs font-bold hover:bg-brand-blue-light/20 transition-colors"
                                            >
                                                <Edit3 size={12} />
                                                Edit
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                    <BookOpen size={64} className="mx-auto text-slate-600 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No courses yet</h3>
                    <p className="text-slate-400 mb-6">
                        Create your first course and share your expertise with learners.
                    </p>
                    <Link
                        href="/author/courses/new/builder"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-blue-light text-brand-black font-bold hover:bg-brand-blue-light/90 transition-colors"
                    >
                        <Plus size={18} />
                        Create Your First Course
                    </Link>
                </div>
            )}
        </div>
    );
}
