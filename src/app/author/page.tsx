import React from 'react';
import { Users, DollarSign, Star, TrendingUp, Clock, Sparkles, BookOpen, Calendar } from 'lucide-react';
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

    // Get AI citations (all time)
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

    // Calculate earnings
    const monthlyWatchEarnings = monthlyWatchTimeMinutes * 0.10;
    const monthlyCitationEarnings = monthCitationCount * 0.50;
    const monthlyTotalEarnings = monthlyWatchEarnings + monthlyCitationEarnings;

    const allTimeWatchEarnings = totalWatchTimeMinutes * 0.10;
    const allTimeCitationEarnings = totalCitations * 0.50;
    const lifetimeEarnings = allTimeWatchEarnings + allTimeCitationEarnings;

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
            const earnings = (watchMinutes * 0.10) + (citations * 0.50);

            return {
                ...course,
                watchMinutes,
                citations,
                students,
                earnings
            };
        })
    );

    // Sort by earnings
    const topCourses = coursePerformance.sort((a, b) => b.earnings - a.earnings).slice(0, 5);

    const formatMinutes = (minutes: number) => {
        if (minutes < 60) return `${Math.round(minutes)}m`;
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return `${hours}h ${mins}m`;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {profile?.full_name?.split(' ')[0] || 'Expert'}</h1>
                <p className="text-slate-400">Track your course performance and earnings.</p>
            </div>

            {/* Current Month Highlight */}
            <div className="bg-gradient-to-r from-brand-blue-light/10 to-purple-500/10 border border-white/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Calendar size={18} className="text-brand-blue-light" />
                    <h2 className="text-lg font-bold text-white">{currentMonthLabel} Earnings</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <p className="text-3xl font-bold text-white">{formatMinutes(monthlyWatchTimeMinutes)}</p>
                        <p className="text-xs text-slate-500">Watch Time</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-white">{monthCitationCount}</p>
                        <p className="text-xs text-slate-500">AI Citations</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-green-400">{formatCurrency(monthlyWatchEarnings)}</p>
                        <p className="text-xs text-slate-500">Watch Earnings ($0.10/min)</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-purple-400">{formatCurrency(monthlyCitationEarnings)}</p>
                        <p className="text-xs text-slate-500">Citation Earnings ($0.50/ea)</p>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-slate-400">Estimated Payout This Month</span>
                    <span className="text-2xl font-bold text-brand-blue-light">{formatCurrency(monthlyTotalEarnings)}</span>
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
                            <DollarSign size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-500 bg-white/5 px-2 py-1 rounded-full">Lifetime</span>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-white">{formatCurrency(lifetimeEarnings)}</p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Total Earnings</p>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:bg-white/10 transition-colors h-32">
                    <div className="flex justify-between items-start">
                        <div className="p-2 rounded-lg bg-white/5 text-purple-400">
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
                                    <p className="font-bold text-brand-blue-light">{formatCurrency(course.earnings)}</p>
                                    <p className="text-xs text-slate-500">Lifetime earnings</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Earnings Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Clock size={18} className="text-green-400" />
                        Watch Time Earnings
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-slate-400">Rate per minute</span>
                            <span className="text-white font-medium">$0.10</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-slate-400">Total minutes watched</span>
                            <span className="text-white font-medium">{Math.round(totalWatchTimeMinutes).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-slate-400 font-bold">Lifetime Watch Earnings</span>
                            <span className="text-green-400 font-bold text-lg">{formatCurrency(allTimeWatchEarnings)}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Sparkles size={18} className="text-purple-400" />
                        AI Citation Earnings
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-slate-400">Rate per citation</span>
                            <span className="text-white font-medium">$0.50</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-slate-400">Total AI citations</span>
                            <span className="text-white font-medium">{totalCitations.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-slate-400 font-bold">Lifetime Citation Earnings</span>
                            <span className="text-purple-400 font-bold text-lg">{formatCurrency(allTimeCitationEarnings)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
