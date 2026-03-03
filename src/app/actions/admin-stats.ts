'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { parseDurationToSeconds } from '@/lib/duration';

// ============================================================================
// Types
// ============================================================================

export interface AdminDashboardStats {
  courses: {
    published: number;
    pendingReview: number;
    draft: number;
    archived: number;
    totalHours: number;
    totalWatchTimeHours: number;
    aiCitations: number;
    modules: number;
    lessons: number;
    resources: number;
    quizzes: number;
  };
  experts: {
    approved: number;
    pending: number;
    rejected: number;
    standalone: number;
  };
  leads: {
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
    closed_won: number;
    closed_lost: number;
  };
  accounts: {
    active: number;
    trials: number;
    individualPaid: number;
    orgs: number;
    employees: number;
  };
}

// ============================================================================
// Main Server Action
// ============================================================================

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = createAdminClient();

  const [
    // COURSES
    publishedResult,
    pendingReviewResult,
    draftResult,
    archivedResult,
    lessonsResult,
    modulesResult,
    resourcesResult,
    watchTimeResult,
    citationsResult,

    // EXPERTS
    approvedExpertsResult,
    pendingExpertsResult,
    rejectedExpertsResult,
    standaloneResult,

    // LEADS
    leadsResult,

    // ACCOUNTS
    profilesResult,
    orgsResult,

    // For expert "approved" admin check
    publishedCoursesResult,
  ] = await Promise.all([
    // Courses by status
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('status', 'archived'),

    // Lessons (need duration + type for Hours and Quizzes stats)
    supabase.from('lessons').select('duration, type'),

    // Modules count
    supabase.from('modules').select('*', { count: 'exact', head: true }),

    // Resources count (all — inline + course-level)
    supabase.from('resources').select('*', { count: 'exact', head: true }),

    // Watch time
    supabase.from('user_progress').select('view_time_seconds'),

    // AI Citations count
    supabase.from('ai_content_citations').select('*', { count: 'exact', head: true }),

    // Experts by status
    supabase.from('profiles').select('id, role, author_status').eq('author_status', 'approved'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('author_status', 'pending'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('author_status', 'rejected'),
    supabase.from('standalone_experts').select('*', { count: 'exact', head: true }),

    // Leads
    supabase.from('demo_leads').select('status'),

    // Accounts (need membership_status, org_id, author_status for categorization)
    supabase.from('profiles').select('id, membership_status, org_id, author_status, role'),

    // Orgs count
    supabase.from('organizations').select('*', { count: 'exact', head: true }),

    // Published courses for admin-author check
    supabase.from('courses').select('author_id').eq('status', 'published'),
  ]);

  // --- COURSES ---
  const lessons = lessonsResult.data || [];
  const totalSeconds = lessons.reduce((sum, l) => sum + parseDurationToSeconds(l.duration), 0);
  const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;

  const totalWatchSeconds = (watchTimeResult.data || []).reduce(
    (sum, r) => sum + (r.view_time_seconds || 0), 0
  );
  const totalWatchTimeHours = Math.round((totalWatchSeconds / 3600) * 10) / 10;

  const quizzes = lessons.filter(l => l.type === 'quiz').length;

  // --- EXPERTS ---
  const publishedAuthorIds = new Set(
    (publishedCoursesResult.data || []).map(c => c.author_id).filter(Boolean)
  );

  let approvedCount = (approvedExpertsResult.data || []).length;
  // Add admins who have published courses but aren't already author_status='approved'
  const profiles = profilesResult.data || [];
  const adminAuthors = profiles.filter(
    p => p.role === 'admin' && p.author_status !== 'approved' && publishedAuthorIds.has(p.id)
  );
  approvedCount += adminAuthors.length;

  // --- LEADS ---
  const leadsByStatus: Record<string, number> = { new: 0, contacted: 0, qualified: 0, converted: 0, closed_won: 0, closed_lost: 0 };
  (leadsResult.data || []).forEach(lead => {
    if (lead.status in leadsByStatus) leadsByStatus[lead.status]++;
  });

  // --- ACCOUNTS ---
  const activeStatuses = ['active', 'employee', 'org_admin'];
  const activeCount = profiles.filter(
    p => activeStatuses.includes(p.membership_status) && p.author_status !== 'approved'
  ).length;

  const trialsCount = profiles.filter(p => p.membership_status === 'trial').length;

  const individualPaid = profiles.filter(
    p => p.membership_status === 'active' && !p.org_id
  ).length;

  const employees = profiles.filter(p => !!p.org_id).length;

  return {
    courses: {
      published: publishedResult.count || 0,
      pendingReview: pendingReviewResult.count || 0,
      draft: draftResult.count || 0,
      archived: archivedResult.count || 0,
      totalHours,
      totalWatchTimeHours,
      aiCitations: citationsResult.count || 0,
      modules: modulesResult.count || 0,
      lessons: lessons.length,
      resources: resourcesResult.count || 0,
      quizzes,
    },
    experts: {
      approved: approvedCount,
      pending: pendingExpertsResult.count || 0,
      rejected: rejectedExpertsResult.count || 0,
      standalone: standaloneResult.count || 0,
    },
    leads: {
      new: leadsByStatus.new,
      contacted: leadsByStatus.contacted,
      qualified: leadsByStatus.qualified,
      converted: leadsByStatus.converted,
      closed_won: leadsByStatus.closed_won,
      closed_lost: leadsByStatus.closed_lost,
    },
    accounts: {
      active: activeCount,
      trials: trialsCount,
      individualPaid,
      orgs: orgsResult.count || 0,
      employees,
    },
  };
}
