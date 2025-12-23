import React from 'react';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import ExpertManagementDashboard from '@/components/admin/ExpertManagementDashboard';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminExpertsPage() {
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

    // Use admin client to bypass RLS for fetching all experts
    const adminSupabase = await createAdminClient();

    // Fetch all experts (pending, approved, rejected)
    const { data: experts, error: expertsError } = await adminSupabase
        .from('profiles')
        .select(`
            id,
            full_name,
            author_bio,
            linkedin_url,
            author_status,
            created_at,
            avatar_url,
            credentials,
            course_proposal_title,
            course_proposal_description,
            application_status,
            application_submitted_at,
            phone_number
        `)
        .in('author_status', ['pending', 'approved', 'rejected'])
        .order('created_at', { ascending: false });

    if (expertsError) {
        console.error('Error fetching experts:', expertsError);
    }

    // Fetch emails from auth.users using admin client
    const expertIds = (experts || []).map(e => e.id);
    const emailMap: Record<string, string> = {};

    if (expertIds.length > 0) {
        const { data: authUsers } = await adminSupabase.auth.admin.listUsers();
        if (authUsers?.users) {
            authUsers.users.forEach(user => {
                if (expertIds.includes(user.id)) {
                    emailMap[user.id] = user.email || '';
                }
            });
        }
    }

    // Add email from auth.users to each expert
    const expertsWithEmail = (experts || []).map(expert => ({
        ...expert,
        email: emailMap[expert.id] || ''
    }));

    // Get current month date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // Fetch watch time stats for approved experts (this month)
    const { data: watchTimeStats } = await supabase
        .from('user_progress')
        .select(`
            course_id,
            view_time_seconds,
            courses!inner(author_id)
        `)
        .gte('last_accessed', startOfMonth)
        .lte('last_accessed', endOfMonth);

    // Fetch AI citation stats (this month)
    const { data: citationStats } = await supabase
        .from('ai_content_citations')
        .select('author_id, course_id')
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth);

    // Aggregate stats by author
    const authorStats: Record<string, { watchTimeMinutes: number; citations: number; courses: Set<number> }> = {};

    // Process watch time
    watchTimeStats?.forEach((progress: any) => {
        const authorId = progress.courses?.author_id;
        if (authorId) {
            if (!authorStats[authorId]) {
                authorStats[authorId] = { watchTimeMinutes: 0, citations: 0, courses: new Set() };
            }
            authorStats[authorId].watchTimeMinutes += (progress.view_time_seconds || 0) / 60;
            authorStats[authorId].courses.add(progress.course_id);
        }
    });

    // Process citations
    citationStats?.forEach((citation: any) => {
        const authorId = citation.author_id;
        if (authorId) {
            if (!authorStats[authorId]) {
                authorStats[authorId] = { watchTimeMinutes: 0, citations: 0, courses: new Set() };
            }
            authorStats[authorId].citations += 1;
        }
    });

    // Convert Set to count
    const processedStats: Record<string, { watchTimeMinutes: number; citations: number; courseCount: number }> = {};
    Object.entries(authorStats).forEach(([authorId, stats]) => {
        processedStats[authorId] = {
            watchTimeMinutes: Math.round(stats.watchTimeMinutes * 10) / 10,
            citations: stats.citations,
            courseCount: stats.courses.size
        };
    });

    // Count courses per expert
    const { data: courseCounts } = await supabase
        .from('courses')
        .select('author_id')
        .not('author_id', 'is', null);

    const courseCountByAuthor: Record<string, number> = {};
    courseCounts?.forEach((course: any) => {
        if (course.author_id) {
            courseCountByAuthor[course.author_id] = (courseCountByAuthor[course.author_id] || 0) + 1;
        }
    });

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Expert Management</h1>
                <p className="text-slate-400">Manage expert accounts, review applications, and track compensation metrics.</p>
            </div>

            <ExpertManagementDashboard
                experts={expertsWithEmail}
                monthlyStats={processedStats}
                courseCountByAuthor={courseCountByAuthor}
                currentMonth={now.toLocaleString('default', { month: 'long', year: 'numeric' })}
            />
        </div>
    );
}
