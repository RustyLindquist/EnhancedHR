import React from 'react';
import { createClient } from '@/lib/supabase/server';
import PayoutReportDashboard from '@/components/admin/PayoutReportDashboard';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface MonthlyPayoutData {
    authorId: string;
    authorName: string;
    email: string;
    courses: {
        courseId: number;
        courseTitle: string;
        watchTimeMinutes: number;
        citations: number;
    }[];
    totalWatchTime: number;
    totalCitations: number;
}

export default async function AdminPayoutsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    // Verify Admin
    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (adminProfile?.role !== 'admin') {
        return <div>Access Denied</div>;
    }

    // Get current and previous months for selection
    const now = new Date();
    const months: { label: string; startDate: string; endDate: string }[] = [];

    for (let i = 0; i < 6; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
        months.push({
            label: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
            startDate: date.toISOString(),
            endDate: endDate.toISOString()
        });
    }

    // Default to current month
    const selectedMonth = months[0];

    // Fetch approved experts AND platform admins
    const { data: experts } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .or('author_status.eq.approved,role.eq.admin');

    // Fetch courses with author_id
    const { data: courses } = await supabase
        .from('courses')
        .select('id, title, author_id')
        .not('author_id', 'is', null);

    // Fetch watch time for the selected month
    const { data: watchTimeData } = await supabase
        .from('user_progress')
        .select('course_id, view_time_seconds, last_accessed')
        .gte('last_accessed', selectedMonth.startDate)
        .lte('last_accessed', selectedMonth.endDate);

    // Fetch citations for the selected month (for analytics, not compensation)
    const { data: citationsData } = await supabase
        .from('ai_content_citations')
        .select('author_id, course_id, created_at')
        .gte('created_at', selectedMonth.startDate)
        .lte('created_at', selectedMonth.endDate);

    // Build course lookup
    const courseLookup: Record<number, { title: string; authorId: string }> = {};
    courses?.forEach(course => {
        if (course.author_id) {
            courseLookup[course.id] = { title: course.title, authorId: course.author_id };
        }
    });

    // Aggregate data by author and course
    const authorData: Record<string, {
        authorId: string;
        authorName: string;
        email: string;
        courseStats: Record<number, { watchTimeMinutes: number; citations: number; title: string }>;
    }> = {};

    // Initialize expert data
    experts?.forEach(expert => {
        authorData[expert.id] = {
            authorId: expert.id,
            authorName: expert.full_name || 'Unknown',
            email: expert.email,
            courseStats: {}
        };
    });

    // Process watch time
    watchTimeData?.forEach(progress => {
        const courseInfo = courseLookup[progress.course_id];
        if (courseInfo && authorData[courseInfo.authorId]) {
            if (!authorData[courseInfo.authorId].courseStats[progress.course_id]) {
                authorData[courseInfo.authorId].courseStats[progress.course_id] = {
                    watchTimeMinutes: 0,
                    citations: 0,
                    title: courseInfo.title
                };
            }
            authorData[courseInfo.authorId].courseStats[progress.course_id].watchTimeMinutes +=
                (progress.view_time_seconds || 0) / 60;
        }
    });

    // Process citations (for analytics only)
    citationsData?.forEach(citation => {
        if (citation.author_id && authorData[citation.author_id]) {
            if (citation.course_id) {
                const courseInfo = courseLookup[citation.course_id];
                if (courseInfo) {
                    if (!authorData[citation.author_id].courseStats[citation.course_id]) {
                        authorData[citation.author_id].courseStats[citation.course_id] = {
                            watchTimeMinutes: 0,
                            citations: 0,
                            title: courseInfo.title
                        };
                    }
                    authorData[citation.author_id].courseStats[citation.course_id].citations += 1;
                }
            }
        }
    });

    // Transform to final format (without earnings - those are calculated client-side based on profit input)
    const payoutData: MonthlyPayoutData[] = Object.values(authorData)
        .map(author => {
            const courses = Object.entries(author.courseStats).map(([courseId, stats]) => ({
                courseId: parseInt(courseId),
                courseTitle: stats.title,
                watchTimeMinutes: Math.round(stats.watchTimeMinutes * 100) / 100,
                citations: stats.citations
            }));

            const totalWatchTime = courses.reduce((sum, c) => sum + c.watchTimeMinutes, 0);
            const totalCitations = courses.reduce((sum, c) => sum + c.citations, 0);

            return {
                authorId: author.authorId,
                authorName: author.authorName,
                email: author.email,
                courses,
                totalWatchTime: Math.round(totalWatchTime * 100) / 100,
                totalCitations
            };
        })
        .filter(author => author.totalWatchTime > 0 || author.totalCitations > 0)
        .sort((a, b) => b.totalWatchTime - a.totalWatchTime);

    // Calculate totals
    const grandTotals = {
        watchTime: payoutData.reduce((sum, a) => sum + a.totalWatchTime, 0),
        citations: payoutData.reduce((sum, a) => sum + a.totalCitations, 0)
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Expert Payouts</h1>
                <p className="text-slate-400">Monthly profit-share reports for expert compensation based on watch time.</p>
            </div>

            <PayoutReportDashboard
                payoutData={payoutData}
                grandTotals={grandTotals}
                months={months}
                selectedMonth={selectedMonth.label}
            />
        </div>
    );
}
