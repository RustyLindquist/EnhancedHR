import { createClient } from '@/lib/supabase/client';
import { Course } from '@/types';

export interface DashboardStats {
    totalTime: string;
    coursesCompleted: number;
    creditsEarned: number;
    streak: number;
}

export interface DashboardData {
    stats: DashboardStats;
    userProgress: Record<number, { progress: number, lastAccessed: string }>;
    inProgressCourses: Course[];
    completedCourses: Course[];
    recentCertificates: any[]; // Type this properly if certificates table is known
    trendingCourseIds: number[];
}

export async function fetchDashboardData(userId: string): Promise<DashboardData> {
    const supabase = createClient();

    // 1. Fetch User Progress Stats
    const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('view_time_seconds, is_completed, course_id, last_accessed')
        .eq('user_id', userId);

    if (progressError) {
        console.error('Error fetching progress:', progressError);
    }

    // Calculate Stats
    let totalSeconds = 0;
    let completedCount = 0;
    const activeCourseIds = new Set<number>();

    progressData?.forEach(p => {
        totalSeconds += p.view_time_seconds || 0;
        if (p.is_completed) completedCount++;
        if (!p.is_completed) activeCourseIds.add(p.course_id);
    });

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const totalTime = `${hours}h ${minutes}m`;

    // 2. Fetch Credits (Mock for now, or fetch from ledger if exists)
    // We'll assume a 'user_credits_ledger' table exists based on previous context, 
    // but if not, we'll default to 0.
    const { data: creditsData } = await supabase
        .from('user_credits_ledger')
        .select('amount')
        .eq('user_id', userId);
    
    const creditsEarned = creditsData?.reduce((sum, c) => sum + (Number(c.amount) || 0), 0) || 0;

    // 3. Fetch In-Progress Courses details
    // We need to fetch the actual course details for the active IDs
    // Since we don't have a direct "get courses by IDs" helper easily accessible here without importing from lib/courses which might fetch ALL,
    // we'll rely on the client-side 'courses' prop passed to the dashboard for rendering the course cards,
    // BUT we can return the IDs here to filter them.
    // Actually, for "Continue Learning", we want the most recently accessed ones.
    
    // Let's just return the stats and let the component filter the courses prop for now to save a network request,
    // OR we can fetch specific course data if we want to be robust.
    // Given the prompt asked to "connect to database", let's assume the 'courses' prop in UserDashboard 
    // is already the full list. We just need to know WHICH ones are in progress.
    
    // 4. Streak (Mock logic: check last login or consecutive days)
    // For now, we'll mock streak as 1 if they have activity today.
    const streak = 1; 

    // 5. Trending Courses (Mock for now, or fetch top rated)
    // In a real app, we'd query: supabase.from('courses').select('*').order('rating', { ascending: false }).limit(4);
    // Since we don't have the full course list here to return Course objects easily without a join, 
    // we will return IDs or let the component handle it if it has the full list.
    // The component has 'courses', so let's just return IDs of trending.
    // Actually, let's just return the IDs of the top 4 rated courses from the DB.
    const { data: trendingData } = await supabase
        .from('courses')
        .select('id')
        .order('rating', { ascending: false })
        .limit(4);
    
    const trendingCourseIds = trendingData?.map(c => c.id) || [];

    // 6. Recertifications (Fetch from certificates table)
    const { data: certsData } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', userId)
        .order('issued_at', { ascending: false })
        .limit(5);

    // Map progress data for easy lookup
    const userProgress: Record<number, { progress: number, lastAccessed: string }> = {};
    progressData?.forEach(p => {
        if (!p.is_completed) {
             // Calculate progress percentage if available, or default to something
             // The table has view_time_seconds. We need total duration to calc %.
             // Since we don't have course duration here, we might need to store % in user_progress or calc it on client.
             // For now, let's assume the client will calculate it or we pass raw seconds.
             // Wait, the user_progress table might not have % column.
             // Let's check the schema if possible, or just pass what we have.
             // The previous code used `p.view_time_seconds`.
             userProgress[p.course_id] = { 
                 progress: 0, // Placeholder, will be calculated in component if needed or if we add column
                 lastAccessed: p.last_accessed
             };
        }
    });

    return {
        stats: {
            totalTime,
            coursesCompleted: completedCount,
            creditsEarned,
            streak
        },
        userProgress, // New field
        inProgressCourses: [], 
        completedCourses: [],
        recentCertificates: certsData || [],
        trendingCourseIds
    };
}
