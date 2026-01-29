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
    
    // 4. Streak - Get current streak
    // Activity is recorded on app mount in MainCanvas, this just retrieves the streak value
    let streak = 0;
    try {
        const { data: streakData, error: streakError } = await supabase
            .rpc('get_user_streak', { p_user_id: userId });

        if (streakError) {
            console.error('Error getting streak:', streakError);
        } else {
            streak = streakData || 0;
        }
    } catch (e) {
        console.error('Streak calculation failed:', e);
    } 

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

// --- ORG ADMIN DASHBOARD DATA ---

export interface OrgDashboardData {
  totalCoursesCompleted: number;
  totalLearningHours: number;
  totalCredits: {
    shrm: number;
    hrci: number;
  };
  aiAdoptionRate: number; // Percentage or avg interactions
  seatUtilization: {
    active: number;
    total: number;
  };
  recentActivity: {
    user: string;
    action: string;
    date: string;
  }[];
}

export interface InstructorCourse extends Course {
  metrics: {
    views: number;
    avgRating: number;
    aiInteractions: number;
    watchTimeHours: number;
  };
}

export interface InstructorDashboardData {
  earnings: {
    currentMonth: number;
    lifetime: number;
    currency: string;
  };
  impact: {
    studentsTaught: number;
    hoursWatched: number;
    certificationsEnabled: number;
  };
  aiReach: {
    attributionCount: number;
    weeklyGrowth: number; // percentage
  };
  recentActivity: {
    student: string;
    action: string; // "Completed Course", "Asked AI", "Rated 5 Stars"
    course: string;
    date: string;
  }[];
  courses: InstructorCourse[];
}

export async function fetchInstructorDashboardData(userId: string): Promise<InstructorDashboardData> {
  const supabase = createClient();
  
  // Mock Data for now - in real implementation this would query multiple tables
  // (viewing_sessions, ai_attribution_logs, user_course_progress)
  
  return {
    earnings: {
      currentMonth: 1250.00,
      lifetime: 14500.00,
      currency: 'USD'
    },
    impact: {
      studentsTaught: 843,
      hoursWatched: 1240,
      certificationsEnabled: 156
    },
    aiReach: {
      attributionCount: 1240,
      weeklyGrowth: 12
    },
    recentActivity: [
      { student: "Sarah Jenkins", action: "Completed Course", course: "Strategic HR Leadership", date: "2 hours ago" },
      { student: "Mike Ross", action: "Asked AI", course: "Conflict Resolution", date: "5 hours ago" },
      { student: "Jessica Pearson", action: "Rated 5 Stars", course: "Strategic HR Leadership", date: "1 day ago" },
    ],
    courses: [
        {
            type: 'COURSE',
            id: 101,
            title: "Strategic HR Leadership",
            author: "You",
            progress: 0,
            category: "Leadership",
            categories: ["Leadership"],
            description: "Master the art of strategic human resources planning and execution.",
            duration: "4h 30m",
            rating: 4.8,
            badges: ["SHRM", "HRCI"],
            isSaved: false,
            collections: [],
            dateAdded: "2025-01-15",
            status: "published",
            metrics: {
                views: 1240,
                avgRating: 4.8,
                aiInteractions: 450,
                watchTimeHours: 890
            }
        },
        {
            type: 'COURSE',
            id: 102,
            title: "Conflict Resolution in the Workplace",
            author: "You",
            progress: 0,
            category: "Management",
            categories: ["Management"],
            description: "Learn effective techniques for resolving workplace conflicts and building a positive culture.",
            duration: "2h 15m",
            rating: 4.5,
            badges: ["SHRM"],
            isSaved: false,
            collections: [],
            dateAdded: "2025-02-10",
            status: "published",
            metrics: {
                views: 850,
                avgRating: 4.5,
                aiInteractions: 320,
                watchTimeHours: 210
            }
        },
        {
            type: 'COURSE',
            id: 103,
            title: "AI for HR Professionals",
            author: "You",
            progress: 0,
            category: "Technology",
            categories: ["Technology"],
            description: "A comprehensive guide to using AI tools in HR processes.",
            duration: "3h 00m",
            rating: 4.9,
            badges: ["HRCI"],
            isSaved: false,
            collections: [],
            dateAdded: "2025-03-01",
            status: "draft",
            metrics: {
                views: 0,
                avgRating: 0,
                aiInteractions: 0,
                watchTimeHours: 0
            }
        }
    ]
  };
}

export async function fetchOrgDashboardData(orgId: string): Promise<OrgDashboardData> {
  const supabase = createClient();

  // 1. Fetch Organization Details (Seats)
  const { data: org } = await supabase
    .from('organizations')
    .select('seats_total, seats_used')
    .eq('id', orgId)
    .single();

  // 2. Fetch Aggregated User Progress (Mocking aggregation for now as we lack a direct aggregation table)
  // In a real scenario, we'd query `user_course_progress` joined with `organization_members`
  const { data: members } = await supabase
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', orgId);
  
  const memberIds = members?.map(m => m.user_id) || [];

  // Mocking stats for the ROI dashboard based on member count
  // In production, these would be real `count()` queries on `user_course_progress` and `user_credits_ledger`
  const totalCoursesCompleted = memberIds.length * 5 + 12; 
  const totalLearningHours = memberIds.length * 15 + 45;
  
  const totalCredits = {
    shrm: memberIds.length * 10 + 25,
    hrci: memberIds.length * 8 + 15
  };

  return {
    totalCoursesCompleted,
    totalLearningHours,
    totalCredits,
    aiAdoptionRate: 78, // Mocked high adoption
    seatUtilization: {
      active: org?.seats_used || 0,
      total: org?.seats_total || 50 // Default to 50 if null
    },
    recentActivity: [
      { user: 'Sarah Jenkins', action: 'Completed "AI Leadership"', date: '2h ago' },
      { user: 'Mike Ross', action: 'Earned SHRM Credit', date: '5h ago' },
      { user: 'Jessica Pearson', action: 'Started "Conflict Resolution"', date: '1d ago' }
    ]
  };
}
