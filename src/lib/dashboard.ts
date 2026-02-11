import { createClient } from '@/lib/supabase/client';
import { Course } from '@/types';

export interface DashboardStats {
    totalTime: string;
    coursesCompleted: number;
    creditsEarned: number;
    streak: number;
    longestStreak: number;
    conversationCount: number;
    notesCount: number;
    insightsCount: number;
}

export interface DashboardData {
    stats: DashboardStats;
    userProgress: Record<number, { progress: number, lastAccessed: string }>;
    inProgressCourses: Course[];
    completedCourses: Course[];
    recentCertificates: any[]; // Type this properly if certificates table is known
    trendingCourseIds: number[];
}

export async function fetchUserStreak(userId: string): Promise<number> {
    const supabase = createClient();
    try {
        const { data, error } = await supabase.rpc('get_user_streak', { p_user_id: userId });
        if (error) {
            console.error('Error getting streak:', error);
            return 0;
        }
        return data || 0;
    } catch (e) {
        console.error('Streak calculation failed:', e);
        return 0;
    }
}

export async function fetchDashboardData(userId: string): Promise<DashboardData> {
    const supabase = createClient();

    // Streak RPC - kept in try-catch as RPC can fail differently
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

    // Run all independent queries in parallel
    const [
        progressResult,
        creditsResult,
        trendingResult,
        certsResult,
        conversationsResult,
        notesResult,
        insightsResult,
        longestStreakResult,
    ] = await Promise.all([
        // User progress
        supabase
            .from('user_progress')
            .select('view_time_seconds, is_completed, course_id, last_accessed')
            .eq('user_id', userId),
        // Credits ledger
        supabase
            .from('user_credits_ledger')
            .select('amount')
            .eq('user_id', userId),
        // Trending courses
        supabase
            .from('courses')
            .select('id')
            .order('rating', { ascending: false })
            .limit(4),
        // Certificates
        supabase
            .from('certificates')
            .select('*')
            .eq('user_id', userId)
            .order('issued_at', { ascending: false })
            .limit(5),
        // Conversation count
        supabase
            .from('conversations')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId),
        // Notes count
        supabase
            .from('notes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId),
        // Insights count
        supabase
            .from('user_context_items')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('type', 'AI_INSIGHT'),
        // Longest streak
        supabase
            .from('user_streaks')
            .select('longest_streak')
            .eq('user_id', userId)
            .order('longest_streak', { ascending: false })
            .limit(1),
    ]);

    // Destructure results
    const { data: progressData, error: progressError } = progressResult;
    const { data: creditsData } = creditsResult;
    const { data: trendingData } = trendingResult;
    const { data: certsData } = certsResult;
    const { count: conversationCount } = conversationsResult;
    const { count: notesCount } = notesResult;
    const { count: insightsCount } = insightsResult;
    const { data: longestStreakData } = longestStreakResult;

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

    const creditsEarned = creditsData?.reduce((sum, c) => sum + (Number(c.amount) || 0), 0) || 0;

    const trendingCourseIds = trendingData?.map(c => c.id) || [];

    // Map progress data for easy lookup
    const userProgress: Record<number, { progress: number, lastAccessed: string }> = {};
    progressData?.forEach(p => {
        if (!p.is_completed) {
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
            streak,
            longestStreak: longestStreakData?.[0]?.longest_streak || 0,
            conversationCount: conversationCount || 0,
            notesCount: notesCount || 0,
            insightsCount: insightsCount || 0,
        },
        userProgress,
        inProgressCourses: [],
        completedCourses: [],
        recentCertificates: certsData || [],
        trendingCourseIds,
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
