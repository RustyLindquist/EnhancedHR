import React from 'react';
import {
    Users, TrendingUp, Clock, Sparkles, BookOpen, Calendar, Percent,
    Award, Play, BarChart3, ArrowUpRight, ArrowDownRight, Target,
    Eye, MessageSquare, Zap
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getMyProposals } from '@/app/actions/proposals';
import NewProposalForm from '@/components/author/NewProposalForm';

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

    // Get expert's course proposals
    const { proposals: existingProposals } = await getMyProposals();

    // Get current and previous month date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const currentMonthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Previous month for comparison
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    // Get author's courses
    const { data: courses } = await supabase
        .from('courses')
        .select('id, title, created_at, status, description')
        .eq('author_id', user.id);

    const courseIds = courses?.map(c => c.id) || [];
    const publishedCourses = courses?.filter(c => c.status === 'published') || [];

    // ========== ALL-TIME METRICS ==========

    // All-time: Unique students
    const { data: allStudentProgress } = await supabase
        .from('user_progress')
        .select('user_id')
        .in('course_id', courseIds.length > 0 ? courseIds : [-1]);
    const allTimeStudents = new Set(allStudentProgress?.map(p => p.user_id) || []).size;

    // All-time: Total watch time
    const { data: allTimeWatchData } = await supabase
        .from('user_progress')
        .select('view_time_seconds')
        .in('course_id', courseIds.length > 0 ? courseIds : [-1]);
    const allTimeWatchMinutes = (allTimeWatchData?.reduce((sum, p) => sum + (p.view_time_seconds || 0), 0) || 0) / 60;

    // All-time: Citations
    const { data: allTimeCitationsData } = await supabase
        .from('ai_content_citations')
        .select('id')
        .eq('author_id', user.id);
    const allTimeCitations = allTimeCitationsData?.length || 0;

    // All-time: Course completions (unique user-course pairs where is_completed = true)
    const { data: allCompletions } = await supabase
        .from('user_progress')
        .select('user_id, course_id, is_completed')
        .in('course_id', courseIds.length > 0 ? courseIds : [-1])
        .eq('is_completed', true);

    const completedCoursePairs = new Set(
        allCompletions?.map(c => `${c.user_id}-${c.course_id}`) || []
    );
    const allTimeCompletions = completedCoursePairs.size;

    // ========== CURRENT MONTH METRICS ==========

    // Current month: Watch time
    const { data: monthlyWatchData } = await supabase
        .from('user_progress')
        .select('view_time_seconds')
        .in('course_id', courseIds.length > 0 ? courseIds : [-1])
        .gte('last_accessed', startOfMonth)
        .lte('last_accessed', endOfMonth);
    const monthlyWatchMinutes = (monthlyWatchData?.reduce((sum, p) => sum + (p.view_time_seconds || 0), 0) || 0) / 60;

    // Previous month: Watch time (for comparison)
    const { data: prevMonthWatchData } = await supabase
        .from('user_progress')
        .select('view_time_seconds')
        .in('course_id', courseIds.length > 0 ? courseIds : [-1])
        .gte('last_accessed', startOfPrevMonth)
        .lte('last_accessed', endOfPrevMonth);
    const prevMonthWatchMinutes = (prevMonthWatchData?.reduce((sum, p) => sum + (p.view_time_seconds || 0), 0) || 0) / 60;

    // Current month: Citations
    const { data: monthlyCitationsData } = await supabase
        .from('ai_content_citations')
        .select('id')
        .eq('author_id', user.id)
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth);
    const monthlyCitations = monthlyCitationsData?.length || 0;

    // Previous month: Citations
    const { data: prevMonthlyCitationsData } = await supabase
        .from('ai_content_citations')
        .select('id')
        .eq('author_id', user.id)
        .gte('created_at', startOfPrevMonth)
        .lte('created_at', endOfPrevMonth);
    const prevMonthlyCitations = prevMonthlyCitationsData?.length || 0;

    // Current month: Active learners (unique users with activity)
    const { data: monthlyActiveUsers } = await supabase
        .from('user_progress')
        .select('user_id')
        .in('course_id', courseIds.length > 0 ? courseIds : [-1])
        .gte('last_accessed', startOfMonth)
        .lte('last_accessed', endOfMonth);
    const monthlyActiveLearners = new Set(monthlyActiveUsers?.map(p => p.user_id) || []).size;

    // Current month: In-progress learners (started but not completed this month)
    const { data: monthlyProgress } = await supabase
        .from('user_progress')
        .select('user_id, course_id, is_completed')
        .in('course_id', courseIds.length > 0 ? courseIds : [-1])
        .gte('last_accessed', startOfMonth)
        .lte('last_accessed', endOfMonth);

    // Group by user-course and check if any lesson is incomplete
    const userCourseProgress: Record<string, { hasCompleted: boolean; hasIncomplete: boolean }> = {};
    monthlyProgress?.forEach(p => {
        const key = `${p.user_id}-${p.course_id}`;
        if (!userCourseProgress[key]) {
            userCourseProgress[key] = { hasCompleted: false, hasIncomplete: false };
        }
        if (p.is_completed) {
            userCourseProgress[key].hasCompleted = true;
        } else {
            userCourseProgress[key].hasIncomplete = true;
        }
    });
    const inProgressThisMonth = Object.values(userCourseProgress).filter(p => p.hasIncomplete && !p.hasCompleted).length;

    // Current month: Completions
    const monthlyCompletions = Object.values(userCourseProgress).filter(p => p.hasCompleted).length;

    // Platform-wide monthly watch time for share calculation
    const { data: platformMonthlyWatchTime } = await supabase
        .from('user_progress')
        .select('view_time_seconds')
        .gte('last_accessed', startOfMonth)
        .lte('last_accessed', endOfMonth);
    const platformTotalMinutes = (platformMonthlyWatchTime?.reduce((sum, p) => sum + (p.view_time_seconds || 0), 0) || 0) / 60;
    const monthlySharePercent = platformTotalMinutes > 0 ? (monthlyWatchMinutes / platformTotalMinutes) * 100 : 0;

    // ========== COURSE-LEVEL ANALYTICS ==========
    const courseAnalytics = await Promise.all(
        (courses || []).map(async (course) => {
            // Watch time
            const { data: courseWatchTime } = await supabase
                .from('user_progress')
                .select('view_time_seconds, user_id, is_completed, last_accessed')
                .eq('course_id', course.id);

            // Citations
            const { data: courseCitations } = await supabase
                .from('ai_content_citations')
                .select('id')
                .eq('course_id', course.id);

            // This month's watch time
            const { data: courseMonthlyWatch } = await supabase
                .from('user_progress')
                .select('view_time_seconds')
                .eq('course_id', course.id)
                .gte('last_accessed', startOfMonth)
                .lte('last_accessed', endOfMonth);

            const totalWatchMinutes = (courseWatchTime?.reduce((sum, p) => sum + (p.view_time_seconds || 0), 0) || 0) / 60;
            const monthlyWatchMins = (courseMonthlyWatch?.reduce((sum, p) => sum + (p.view_time_seconds || 0), 0) || 0) / 60;
            const citations = courseCitations?.length || 0;
            const uniqueStudents = new Set(courseWatchTime?.map(p => p.user_id) || []).size;
            const completions = new Set(
                courseWatchTime?.filter(p => p.is_completed).map(p => p.user_id) || []
            ).size;

            // Engagement score: weighted combination of watch time, citations, and completions
            const engagementScore = (totalWatchMinutes * 1) + (citations * 5) + (completions * 10);

            // Average watch time per student
            const avgWatchPerStudent = uniqueStudents > 0 ? totalWatchMinutes / uniqueStudents : 0;

            return {
                ...course,
                totalWatchMinutes,
                monthlyWatchMinutes: monthlyWatchMins,
                citations,
                uniqueStudents,
                completions,
                engagementScore,
                avgWatchPerStudent
            };
        })
    );

    // Sort by engagement score for top performers
    const topCourses = [...courseAnalytics].sort((a, b) => b.engagementScore - a.engagementScore).slice(0, 5);

    // Calculate trends
    const watchTimeTrend = prevMonthWatchMinutes > 0
        ? ((monthlyWatchMinutes - prevMonthWatchMinutes) / prevMonthWatchMinutes) * 100
        : monthlyWatchMinutes > 0 ? 100 : 0;
    const citationTrend = prevMonthlyCitations > 0
        ? ((monthlyCitations - prevMonthlyCitations) / prevMonthlyCitations) * 100
        : monthlyCitations > 0 ? 100 : 0;

    // Helper functions
    const formatMinutes = (minutes: number) => {
        if (minutes < 60) return `${Math.round(minutes)}m`;
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    const formatPercent = (percent: number) => `${percent.toFixed(1)}%`;

    const formatTrend = (trend: number) => {
        if (Math.abs(trend) < 0.1) return null;
        return {
            value: `${Math.abs(trend).toFixed(0)}%`,
            isUp: trend > 0
        };
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                    Welcome back, {profile?.full_name?.split(' ')[0] || 'Expert'}
                </h1>
                <p className="text-slate-400">
                    Here's how your content is performing. Your expertise is making a difference.
                </p>
            </div>

            {/* ========== COURSE PROPOSALS ========== */}
            <NewProposalForm existingProposals={existingProposals} />

            {/* ========== PROFIT SHARE HIGHLIGHT ========== */}
            <div className="bg-gradient-to-r from-brand-blue-light/10 via-green-500/10 to-purple-500/10 border border-white/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-brand-blue-light" />
                        <h2 className="text-lg font-bold text-white">{currentMonthLabel}</h2>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full">
                        <Percent size={14} className="text-green-400" />
                        <span className="text-sm font-bold text-green-400">{formatPercent(monthlySharePercent)} Profit Share</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-1">
                            <Clock size={16} className="text-brand-blue-light" />
                            {formatTrend(watchTimeTrend) && (
                                <span className={`text-xs font-bold flex items-center gap-0.5 ${formatTrend(watchTimeTrend)?.isUp ? 'text-green-400' : 'text-red-400'}`}>
                                    {formatTrend(watchTimeTrend)?.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                    {formatTrend(watchTimeTrend)?.value}
                                </span>
                            )}
                        </div>
                        <p className="text-2xl font-bold text-white">{formatMinutes(monthlyWatchMinutes)}</p>
                        <p className="text-xs text-slate-500">Watch Time</p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-1">
                            <Sparkles size={16} className="text-purple-400" />
                            {formatTrend(citationTrend) && (
                                <span className={`text-xs font-bold flex items-center gap-0.5 ${formatTrend(citationTrend)?.isUp ? 'text-green-400' : 'text-red-400'}`}>
                                    {formatTrend(citationTrend)?.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                    {formatTrend(citationTrend)?.value}
                                </span>
                            )}
                        </div>
                        <p className="text-2xl font-bold text-white">{monthlyCitations}</p>
                        <p className="text-xs text-slate-500">AI Citations</p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4">
                        <Users size={16} className="text-green-400 mb-1" />
                        <p className="text-2xl font-bold text-white">{monthlyActiveLearners}</p>
                        <p className="text-xs text-slate-500">Active Learners</p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4">
                        <Play size={16} className="text-yellow-400 mb-1" />
                        <p className="text-2xl font-bold text-white">{inProgressThisMonth}</p>
                        <p className="text-xs text-slate-500">In Progress</p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4">
                        <Award size={16} className="text-brand-orange mb-1" />
                        <p className="text-2xl font-bold text-white">{monthlyCompletions}</p>
                        <p className="text-xs text-slate-500">Completions</p>
                    </div>
                </div>
            </div>

            {/* ========== ALL-TIME STATS ========== */}
            <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">All-Time Performance</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <Clock size={20} className="text-brand-blue-light" />
                        </div>
                        <p className="text-2xl font-bold text-white">{formatMinutes(allTimeWatchMinutes)}</p>
                        <p className="text-xs text-slate-500 mt-1">Total Watch Time</p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <Sparkles size={20} className="text-purple-400" />
                        </div>
                        <p className="text-2xl font-bold text-white">{allTimeCitations}</p>
                        <p className="text-xs text-slate-500 mt-1">AI Citations</p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <Users size={20} className="text-green-400" />
                        </div>
                        <p className="text-2xl font-bold text-white">{allTimeStudents.toLocaleString()}</p>
                        <p className="text-xs text-slate-500 mt-1">Total Students</p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <Award size={20} className="text-brand-orange" />
                        </div>
                        <p className="text-2xl font-bold text-white">{allTimeCompletions}</p>
                        <p className="text-xs text-slate-500 mt-1">Course Completions</p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <BookOpen size={20} className="text-yellow-400" />
                        </div>
                        <p className="text-2xl font-bold text-white">{publishedCourses.length}</p>
                        <p className="text-xs text-slate-500 mt-1">Published Courses</p>
                    </div>
                </div>
            </div>

            {/* ========== COURSE PERFORMANCE TABLE ========== */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <BarChart3 size={20} className="text-brand-blue-light" />
                            Course Performance
                        </h3>
                        <span className="text-xs text-slate-500">Sorted by engagement score</span>
                    </div>
                </div>

                {topCourses.length === 0 ? (
                    <div className="p-12 text-center">
                        <BookOpen size={48} className="mx-auto text-slate-600 mb-4" />
                        <p className="text-slate-500 mb-2">No courses yet</p>
                        <p className="text-sm text-slate-600">Create your first course to start tracking engagement.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-white/5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <div className="col-span-4">Course</div>
                            <div className="col-span-2 text-right">Watch Time</div>
                            <div className="col-span-1 text-right">Students</div>
                            <div className="col-span-1 text-right">Citations</div>
                            <div className="col-span-2 text-right">Completions</div>
                            <div className="col-span-2 text-right">Engagement</div>
                        </div>

                        {topCourses.map((course, index) => (
                            <div
                                key={course.id}
                                className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/5 transition-colors"
                            >
                                <div className="col-span-4 flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                                        index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                        index === 1 ? 'bg-slate-400/20 text-slate-300' :
                                        index === 2 ? 'bg-amber-700/20 text-amber-600' :
                                        'bg-white/5 text-slate-500'
                                    }`}>
                                        {index + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-white truncate">{course.title}</p>
                                        <p className="text-xs text-slate-500">
                                            {course.status === 'published' ? 'Published' : 'Draft'}
                                        </p>
                                    </div>
                                </div>
                                <div className="col-span-2 text-right">
                                    <p className="font-bold text-white">{formatMinutes(course.totalWatchMinutes)}</p>
                                    <p className="text-xs text-slate-500">{formatMinutes(course.monthlyWatchMinutes)} this month</p>
                                </div>
                                <div className="col-span-1 text-right">
                                    <p className="font-bold text-white">{course.uniqueStudents}</p>
                                </div>
                                <div className="col-span-1 text-right">
                                    <p className="font-bold text-purple-400">{course.citations}</p>
                                </div>
                                <div className="col-span-2 text-right">
                                    <p className="font-bold text-brand-orange">{course.completions}</p>
                                    <p className="text-xs text-slate-500">
                                        {course.uniqueStudents > 0 ? `${((course.completions / course.uniqueStudents) * 100).toFixed(0)}% rate` : '--'}
                                    </p>
                                </div>
                                <div className="col-span-2 text-right">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-blue-light/10 rounded-full">
                                        <Zap size={12} className="text-brand-blue-light" />
                                        <span className="text-sm font-bold text-brand-blue-light">
                                            {Math.round(course.engagementScore)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ========== CONTENT INSIGHTS ========== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* What's Working */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Target size={20} className="text-green-400" />
                        What's Working Well
                    </h3>
                    <div className="space-y-4">
                        {topCourses.length > 0 && topCourses[0].engagementScore > 0 ? (
                            <>
                                <div className="flex items-start gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                                    <div className="p-1.5 bg-green-500/20 rounded">
                                        <Award size={14} className="text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Top Performer</p>
                                        <p className="text-xs text-slate-400">
                                            "{topCourses[0].title}" has the highest engagement with {formatMinutes(topCourses[0].totalWatchMinutes)} watch time
                                        </p>
                                    </div>
                                </div>
                                {topCourses.find(c => c.avgWatchPerStudent > 10) && (
                                    <div className="flex items-start gap-3 p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                                        <div className="p-1.5 bg-purple-500/20 rounded">
                                            <Eye size={14} className="text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">High Retention</p>
                                            <p className="text-xs text-slate-400">
                                                Students spend {formatMinutes(topCourses.find(c => c.avgWatchPerStudent > 10)?.avgWatchPerStudent || 0)} on average per course
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {allTimeCitations > 0 && (
                                    <div className="flex items-start gap-3 p-3 bg-brand-blue-light/5 border border-brand-blue-light/20 rounded-lg">
                                        <div className="p-1.5 bg-brand-blue-light/20 rounded">
                                            <MessageSquare size={14} className="text-brand-blue-light" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">AI Recognizes Your Expertise</p>
                                            <p className="text-xs text-slate-400">
                                                Your content has been cited {allTimeCitations} times by the platform AI
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-slate-500">Create courses to see engagement insights</p>
                        )}
                    </div>
                </div>

                {/* How Profit Share Works */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Percent size={20} className="text-green-400" />
                        How You Earn
                    </h3>
                    <div className="space-y-4 text-sm text-slate-400">
                        <p>
                            Your earnings are based on your share of total platform watch time each month.
                        </p>
                        <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                            <p className="font-mono text-slate-300 text-center">
                                Your Payout = {formatPercent(monthlySharePercent)} × Monthly Profit
                            </p>
                        </div>
                        <div className="pt-2 space-y-2 text-xs text-slate-500">
                            <div className="flex justify-between">
                                <span>Your watch time this month:</span>
                                <span className="text-white font-bold">{formatMinutes(monthlyWatchMinutes)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Platform total this month:</span>
                                <span className="text-white font-bold">{formatMinutes(platformTotalMinutes)}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-white/5">
                                <span>Your profit share:</span>
                                <span className="text-green-400 font-bold">{formatPercent(monthlySharePercent)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========== TIPS FOR SUCCESS ========== */}
            <div className="bg-gradient-to-r from-yellow-500/5 to-brand-orange/5 border border-yellow-500/20 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
                    <Zap size={20} />
                    Tips to Increase Engagement
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold text-xs">1</div>
                        <div>
                            <p className="text-sm font-bold text-white">Create In-Depth Content</p>
                            <p className="text-xs text-slate-400">Longer, comprehensive courses drive more watch time</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold text-xs">2</div>
                        <div>
                            <p className="text-sm font-bold text-white">Add Practical Examples</p>
                            <p className="text-xs text-slate-400">Real-world scenarios keep learners engaged</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold text-xs">3</div>
                        <div>
                            <p className="text-sm font-bold text-white">Update Regularly</p>
                            <p className="text-xs text-slate-400">Fresh content brings students back for more</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
