import React from 'react';
import { Users, TrendingUp, Clock, Sparkles, BookOpen, Calendar, Percent } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AuthorDashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    // Get author profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, author_status')
        .eq('id', user.id)
        .single();

    if (profile?.author_status !== 'approved') {
        redirect('/teach');
    }

    // Get current month date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const currentMonthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Get author's courses
    const { data: courses } = await supabase
        .from('courses')
        .select('id, title, created_at, status')
        .eq('author_id', user.id);

    const courseIds = courses?.map(c => c.id) || [];

    // Get unique students who have viewed author's courses
    const { data: studentProgress } = await supabase
        .from('user_progress')
        .select('user_id, course_id')
        .in('course_id', courseIds.length > 0 ? courseIds : [-1]);

    const uniqueStudents = new Set(studentProgress?.map(p => p.user_id) || []);

    // Get total watch time (all time)
    const { data: allTimeWatchTime } = await supabase
        .from('user_progress')
        .select('view_time_seconds')
        .in('course_id', courseIds.length > 0 ? courseIds : [-1]);

    const totalWatchTimeMinutes = (allTimeWatchTime?.reduce((sum, p) => sum + (p.view_time_seconds || 0), 0) || 0) / 60;

    // Get this month's watch time
    const { data: monthlyWatchTime } = await supabase
        .from('user_progress')
        .select('view_time_seconds')
        .in('course_id', courseIds.length > 0 ? courseIds : [-1])
        .gte('last_accessed', startOfMonth)
        .lte('last_accessed', endOfMonth);

    const monthlyWatchTimeMinutes = (monthlyWatchTime?.reduce((sum, p) => sum + (p.view_time_seconds || 0), 0) || 0) / 60;

    // Get platform-wide monthly watch time for share calculation
    const { data: platformMonthlyWatchTime } = await supabase
        .from('user_progress')
        .select('view_time_seconds')
        .gte('last_accessed', startOfMonth)
        .lte('last_accessed', endOfMonth);

    const platformTotalMinutes = (platformMonthlyWatchTime?.reduce((sum, p) => sum + (p.view_time_seconds || 0), 0) || 0) / 60;
    const monthlySharePercent = platformTotalMinutes > 0 ? (monthlyWatchTimeMinutes / platformTotalMinutes) * 100 : 0;

    // Get AI citations (all time) - for analytics only
    const { data: allTimeCitations } = await supabase
        .from('ai_content_citations')
        .select('id')
        .eq('author_id', user.id);

    const totalCitations = allTimeCitations?.length || 0;

    // Get this month's citations
    const { data: monthlyCitations } = await supabase
        .from('ai_content_citations')
        .select('id')
        .eq('author_id', user.id)
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth);

    const monthCitationCount = monthlyCitations?.length || 0;

    // Get course performance data
    const coursePerformance = await Promise.all(
        (courses || []).map(async (course) => {
            const { data: courseWatchTime } = await supabase
                .from('user_progress')
                .select('view_time_seconds, user_id')
                .eq('course_id', course.id);

            const { data: courseCitations } = await supabase
                .from('ai_content_citations')
                .select('id')
                .eq('course_id', course.id);

            const watchMinutes = (courseWatchTime?.reduce((sum, p) => sum + (p.view_time_seconds || 0), 0) || 0) / 60;
            const citations = courseCitations?.length || 0;
            const students = new Set(courseWatchTime?.map(p => p.user_id) || []).size;

            return {
                ...course,
                watchMinutes,
                citations,
                students
            };
        })
    );

    // Sort by watch time (most engagement first)
    const topCourses = coursePerformance.sort((a, b) => b.watchMinutes - a.watchMinutes).slice(0, 5);

    const formatMinutes = (minutes: number) => {
        if (minutes < 60) return `${Math.round(minutes)}m`;
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return `${hours}h ${mins}m`;
    };

    const formatPercent = (percent: number) => {
        return `${percent.toFixed(2)}%`;
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {profile?.full_name?.split(' ')[0] || 'Expert'}</h1>
                <p className="text-slate-400">Track your course performance and profit share.</p>
            </div>

            {/* Current Month Highlight */}
            <div className="bg-gradient-to-r from-brand-blue-light/10 to-green-500/10 border border-white/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Calendar size={18} className="text-brand-blue-light" />
                    <h2 className="text-lg font-bold text-white">{currentMonthLabel} Performance</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <p className="text-3xl font-bold text-white">{formatMinutes(monthlyWatchTimeMinutes)}</p>
                        <p className="text-xs text-slate-500">Your Watch Time</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-brand-blue-light">{formatPercent(monthlySharePercent)}</p>
                        <p className="text-xs text-slate-500">Profit Share</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-purple-400">{monthCitationCount}</p>
                        <p className="text-xs text-slate-500">AI Citations</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-white">{formatMinutes(platformTotalMinutes)}</p>
                        <p className="text-xs text-slate-500">Platform Total</p>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-sm text-slate-400">
                        Your profit share is based on your proportion of total platform watch time.
                        <span className="text-slate-500 ml-1">
                            ({formatMinutes(monthlyWatchTimeMinutes)} ÷ {formatMinutes(platformTotalMinutes)} = {formatPercent(monthlySharePercent)})
                        </span>
                    </p>
                </div>
            </div>

            {/* Lifetime Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:bg-white/10 transition-colors h-32">
                    <div className="flex justify-between items-start">
                        <div className="p-2 rounded-lg bg-white/5 text-brand-blue-light">
                            <Users size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-500 bg-white/5 px-2 py-1 rounded-full">Lifetime</span>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-white">{uniqueStudents.size.toLocaleString()}</p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Total Students</p>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:bg-white/10 transition-colors h-32">
                    <div className="flex justify-between items-start">
                        <div className="p-2 rounded-lg bg-white/5 text-green-400">
                            <Clock size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-500 bg-white/5 px-2 py-1 rounded-full">Lifetime</span>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-white">{formatMinutes(totalWatchTimeMinutes)}</p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Watch Time</p>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:bg-white/10 transition-colors h-32">
                    <div className="flex justify-between items-start">
                        <div className="p-2 rounded-lg bg-white/5 text-purple-400">
                            <Sparkles size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-500 bg-white/5 px-2 py-1 rounded-full">Lifetime</span>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-white">{totalCitations}</p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">AI Citations</p>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:bg-white/10 transition-colors h-32">
                    <div className="flex justify-between items-start">
                        <div className="p-2 rounded-lg bg-white/5 text-yellow-400">
                            <BookOpen size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-500 bg-white/5 px-2 py-1 rounded-full">Published</span>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-white">{courses?.filter(c => c.status === 'published').length || 0}</p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Active Courses</p>
                    </div>
                </div>
            </div>

            {/* Course Performance */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <TrendingUp size={20} className="text-brand-blue-light" />
                    Course Performance
                </h3>
                {topCourses.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        No courses yet. Create your first course to start earning!
                    </div>
                ) : (
                    <div className="space-y-4">
                        {topCourses.map((course, index) => (
                            <div key={course.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-brand-blue-light/20 flex items-center justify-center text-brand-blue-light font-bold">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{course.title}</p>
                                        <p className="text-xs text-slate-400">
                                            {course.students} students • {formatMinutes(course.watchMinutes)} watched • {course.citations} citations
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-brand-blue-light">{formatMinutes(course.watchMinutes)}</p>
                                    <p className="text-xs text-slate-500">Watch time</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* How Profit Share Works */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Percent size={18} className="text-green-400" />
                    How Profit Share Works
                </h3>
                <div className="space-y-4 text-sm text-slate-400">
                    <p>
                        As an expert, you earn a share of the platform's monthly profit based on how much of the total
                        platform watch time your content generates.
                    </p>
                    <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                        <p className="font-mono text-slate-300">
                            Your Payout = (Your Watch Time ÷ Total Platform Watch Time) × Monthly Profit
                        </p>
                    </div>
                    <p>
                        The more engaging your content, the more watch time you'll accumulate, and the larger your
                        share of the monthly profit pool. Focus on creating valuable, in-depth content that keeps
                        learners engaged.
                    </p>
                    <p className="text-slate-500">
                        AI citations are tracked as a quality indicator but do not directly factor into compensation.
                    </p>
                </div>
            </div>
        </div>
    );
}
