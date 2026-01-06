'use server';

/**
 * Organization Dashboard Server Actions
 *
 * Provides comprehensive analytics for org admins including:
 * - User engagement metrics
 * - Learning progress and time tracking
 * - AI interaction analytics
 * - Credit/certification tracking
 * - Skills aggregation from completed courses
 * - Trend data for visualizations
 */

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getOrgContext } from '@/lib/org-context';

// ============================================================================
// Types
// ============================================================================

export interface DashboardFilters {
  startDate: Date;
  endDate: Date;
  groupId?: string;
  userId?: string;
}

export interface DashboardMetrics {
  // Engagement
  activeUsers: number;
  totalUsers: number;
  engagementRate: number;

  // Learning
  totalLearningMinutes: number;
  avgLearningMinutes: number;
  coursesCompleted: number;
  lessonsCompleted: number;

  // AI
  totalConversations: number;
  totalInteractions: number;
  avgConversationsPerUser: number;

  // Credits
  shrmiCredits: number;
  hrciCredits: number;

  // Skills (aggregated from completed courses)
  topSkills: { skill: string; count: number }[];

  // Trends (for charts)
  dailyLearning: { date: string; minutes: number }[];
  dailyEngagement: { date: string; activeUsers: number }[];

  // Multi-line engagement chart data
  dailyEngagementTrends: {
    date: string;
    logins: number;
    aiConversations: number;
    collectionActivity: number;
  }[];
}

export interface GroupFilterOption {
  id: string;
  name: string;
  memberCount: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all user IDs for the given filter criteria
 */
async function getUserIds(
  supabaseAdmin: any,
  orgId: string,
  filters: DashboardFilters
): Promise<string[]> {
  // If specific user requested
  if (filters.userId) {
    return [filters.userId];
  }

  // If specific group requested
  if (filters.groupId) {
    // Check if it's a dynamic group
    const { data: group } = await supabaseAdmin
      .from('employee_groups')
      .select('is_dynamic')
      .eq('id', filters.groupId)
      .single();

    if (group?.is_dynamic) {
      // For dynamic groups, we'd need to compute membership
      // For now, fallback to static members
      const { data: members } = await supabaseAdmin
        .from('employee_group_members')
        .select('user_id')
        .eq('group_id', filters.groupId);
      return members?.map((m: any) => m.user_id) || [];
    } else {
      // Get static members
      const { data: members } = await supabaseAdmin
        .from('employee_group_members')
        .select('user_id')
        .eq('group_id', filters.groupId);
      return members?.map((m: any) => m.user_id) || [];
    }
  }

  // Otherwise, get all users in the org
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('org_id', orgId);

  return profiles?.map((p: any) => p.id) || [];
}

/**
 * Get daily aggregated learning data for chart
 */
async function getDailyLearning(
  supabaseAdmin: any,
  userIds: string[],
  filters: DashboardFilters
): Promise<{ date: string; minutes: number }[]> {
  if (userIds.length === 0) return [];

  // Query user_progress with date filtering
  const { data: progressData } = await supabaseAdmin
    .from('user_progress')
    .select('last_accessed, view_time_seconds')
    .in('user_id', userIds)
    .gte('last_accessed', filters.startDate.toISOString())
    .lte('last_accessed', filters.endDate.toISOString());

  if (!progressData || progressData.length === 0) return [];

  // Aggregate by day
  const dailyMap = new Map<string, number>();

  progressData.forEach((p: any) => {
    if (p.last_accessed) {
      const date = new Date(p.last_accessed).toISOString().split('T')[0];
      const minutes = Math.round((p.view_time_seconds || 0) / 60);
      dailyMap.set(date, (dailyMap.get(date) || 0) + minutes);
    }
  });

  // Convert to array and sort
  return Array.from(dailyMap.entries())
    .map(([date, minutes]) => ({ date, minutes }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get daily engagement data (unique active users per day)
 */
async function getDailyEngagement(
  supabaseAdmin: any,
  userIds: string[],
  filters: DashboardFilters
): Promise<{ date: string; activeUsers: number }[]> {
  if (userIds.length === 0) return [];

  // Query user_progress with date filtering
  const { data: progressData } = await supabaseAdmin
    .from('user_progress')
    .select('user_id, last_accessed')
    .in('user_id', userIds)
    .gte('last_accessed', filters.startDate.toISOString())
    .lte('last_accessed', filters.endDate.toISOString());

  if (!progressData || progressData.length === 0) return [];

  // Aggregate unique users by day
  const dailyMap = new Map<string, Set<string>>();

  progressData.forEach((p: any) => {
    if (p.last_accessed) {
      const date = new Date(p.last_accessed).toISOString().split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, new Set());
      }
      dailyMap.get(date)!.add(p.user_id);
    }
  });

  // Convert to array and sort
  return Array.from(dailyMap.entries())
    .map(([date, userSet]) => ({ date, activeUsers: userSet.size }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get daily engagement trends for multi-line chart
 * Tracks: Logins, AI Conversations, Collection Activity
 */
async function getDailyEngagementTrends(
  supabaseAdmin: any,
  userIds: string[],
  orgId: string,
  filters: DashboardFilters
): Promise<{ date: string; logins: number; aiConversations: number; collectionActivity: number }[]> {
  if (userIds.length === 0) return [];

  const startDateStr = filters.startDate.toISOString();
  const endDateStr = filters.endDate.toISOString();

  // 1. Get login events
  const { data: loginData } = await supabaseAdmin
    .from('login_events')
    .select('created_at')
    .eq('org_id', orgId)
    .in('user_id', userIds)
    .gte('created_at', startDateStr)
    .lte('created_at', endDateStr);

  // 2. Get AI conversation activity (new + resumed = updated_at within range)
  const { data: conversationData } = await supabaseAdmin
    .from('conversations')
    .select('updated_at')
    .in('user_id', userIds)
    .gte('updated_at', startDateStr)
    .lte('updated_at', endDateStr);

  // 3. Get collection activity (collections created + items added)
  const { data: collectionsCreated } = await supabaseAdmin
    .from('user_collections')
    .select('created_at')
    .in('user_id', userIds)
    .gte('created_at', startDateStr)
    .lte('created_at', endDateStr);

  // Get collection IDs for the users to query collection_items
  const { data: userCollections } = await supabaseAdmin
    .from('user_collections')
    .select('id')
    .in('user_id', userIds);

  const collectionIds = userCollections?.map((c: any) => c.id) || [];

  const { data: itemsAdded } = collectionIds.length > 0
    ? await supabaseAdmin
        .from('collection_items')
        .select('added_at')
        .in('collection_id', collectionIds)
        .gte('added_at', startDateStr)
        .lte('added_at', endDateStr)
    : { data: [] };

  // Build date map with all metrics
  const dateMap = new Map<string, { logins: number; aiConversations: number; collectionActivity: number }>();

  // Helper to ensure date exists in map
  const ensureDate = (dateStr: string) => {
    if (!dateMap.has(dateStr)) {
      dateMap.set(dateStr, { logins: 0, aiConversations: 0, collectionActivity: 0 });
    }
  };

  // Aggregate logins
  (loginData || []).forEach((l: any) => {
    const date = new Date(l.created_at).toISOString().split('T')[0];
    ensureDate(date);
    dateMap.get(date)!.logins += 1;
  });

  // Aggregate AI conversations
  (conversationData || []).forEach((c: any) => {
    const date = new Date(c.updated_at).toISOString().split('T')[0];
    ensureDate(date);
    dateMap.get(date)!.aiConversations += 1;
  });

  // Aggregate collection activity (creates + adds)
  (collectionsCreated || []).forEach((c: any) => {
    const date = new Date(c.created_at).toISOString().split('T')[0];
    ensureDate(date);
    dateMap.get(date)!.collectionActivity += 1;
  });

  (itemsAdded || []).forEach((i: any) => {
    const date = new Date(i.added_at).toISOString().split('T')[0];
    ensureDate(date);
    dateMap.get(date)!.collectionActivity += 1;
  });

  // Fill in missing dates in the range
  const current = new Date(filters.startDate);
  const end = new Date(filters.endDate);
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    ensureDate(dateStr);
    current.setDate(current.getDate() + 1);
  }

  // Convert to array and sort
  return Array.from(dateMap.entries())
    .map(([date, metrics]) => ({ date, ...metrics }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get top skills from completed courses
 */
async function getTopSkills(
  supabaseAdmin: any,
  userIds: string[],
  filters: DashboardFilters
): Promise<{ skill: string; count: number }[]> {
  if (userIds.length === 0) return [];

  // Get completed courses within date range
  const { data: completedProgress } = await supabaseAdmin
    .from('user_progress')
    .select('course_id, courses!inner(skills)')
    .in('user_id', userIds)
    .eq('is_completed', true)
    .gte('last_accessed', filters.startDate.toISOString())
    .lte('last_accessed', filters.endDate.toISOString());

  if (!completedProgress || completedProgress.length === 0) return [];

  // Aggregate skills
  const skillMap = new Map<string, number>();

  completedProgress.forEach((p: any) => {
    const skills = p.courses?.skills || [];
    skills.forEach((skill: string) => {
      skillMap.set(skill, (skillMap.get(skill) || 0) + 1);
    });
  });

  // Convert to array, sort by count, and return top 10
  return Array.from(skillMap.entries())
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Get comprehensive org dashboard metrics
 */
export async function getOrgDashboardMetrics(
  filters: DashboardFilters
): Promise<DashboardMetrics | null> {
  // Verify org admin access
  const orgContext = await getOrgContext();
  if (!orgContext || !orgContext.isOrgAdmin) {
    console.error('[getOrgDashboardMetrics] Unauthorized: User is not an org admin');
    return null;
  }

  const supabaseAdmin = await createAdminClient();
  const orgId = orgContext.orgId;

  // Get user IDs based on filters
  const userIds = await getUserIds(supabaseAdmin, orgId, filters);

  if (userIds.length === 0) {
    // Return empty metrics
    return {
      activeUsers: 0,
      totalUsers: 0,
      engagementRate: 0,
      totalLearningMinutes: 0,
      avgLearningMinutes: 0,
      coursesCompleted: 0,
      lessonsCompleted: 0,
      totalConversations: 0,
      totalInteractions: 0,
      avgConversationsPerUser: 0,
      shrmiCredits: 0,
      hrciCredits: 0,
      topSkills: [],
      dailyLearning: [],
      dailyEngagement: [],
      dailyEngagementTrends: [],
    };
  }

  const totalUsers = userIds.length;

  // Fetch user_progress data
  const { data: progressData } = await supabaseAdmin
    .from('user_progress')
    .select('user_id, view_time_seconds, is_completed, lesson_id, last_accessed')
    .in('user_id', userIds)
    .gte('last_accessed', filters.startDate.toISOString())
    .lte('last_accessed', filters.endDate.toISOString());

  // Fetch conversations data
  const { data: conversationData } = await supabaseAdmin
    .from('conversations')
    .select('user_id, id')
    .in('user_id', userIds)
    .gte('created_at', filters.startDate.toISOString())
    .lte('created_at', filters.endDate.toISOString());

  // Fetch AI interaction data (from ai_logs)
  const { data: aiInteractionData } = await supabaseAdmin
    .from('ai_logs')
    .select('user_id')
    .in('user_id', userIds)
    .gte('created_at', filters.startDate.toISOString())
    .lte('created_at', filters.endDate.toISOString());

  // Fetch credits data
  const { data: creditsData } = await supabaseAdmin
    .from('user_credits_ledger')
    .select('user_id, credit_type, amount')
    .in('user_id', userIds)
    .gte('awarded_at', filters.startDate.toISOString())
    .lte('awarded_at', filters.endDate.toISOString());

  // Calculate engagement metrics
  let totalViewTimeSeconds = 0;
  let coursesCompleted = 0;
  let lessonsCompleted = 0;
  const activeUserIds = new Set<string>();

  progressData?.forEach((p: any) => {
    totalViewTimeSeconds += p.view_time_seconds || 0;
    if (p.is_completed && !p.lesson_id) {
      // Course completion (no lesson_id means it's a course-level progress record)
      coursesCompleted += 1;
    }
    if (p.is_completed && p.lesson_id) {
      // Lesson completion
      lessonsCompleted += 1;
    }
    if (p.last_accessed) {
      activeUserIds.add(p.user_id);
    }
  });

  const totalLearningMinutes = Math.round(totalViewTimeSeconds / 60);
  const avgLearningMinutes = totalUsers > 0 ? Math.round(totalLearningMinutes / totalUsers) : 0;
  const activeUsers = activeUserIds.size;
  const engagementRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

  // Calculate conversation metrics
  const totalConversations = conversationData?.length || 0;
  const totalInteractions = aiInteractionData?.length || 0;
  const avgConversationsPerUser = totalUsers > 0 ?
    Math.round((totalConversations / totalUsers) * 10) / 10 : 0;

  // Calculate credits
  let shrmiCredits = 0;
  let hrciCredits = 0;

  creditsData?.forEach((c: any) => {
    if (c.credit_type === 'SHRM') {
      shrmiCredits += Number(c.amount);
    } else if (c.credit_type === 'HRCI') {
      hrciCredits += Number(c.amount);
    }
  });

  // Get top skills
  const topSkills = await getTopSkills(supabaseAdmin, userIds, filters);

  // Get trend data
  const dailyLearning = await getDailyLearning(supabaseAdmin, userIds, filters);
  const dailyEngagement = await getDailyEngagement(supabaseAdmin, userIds, filters);
  const dailyEngagementTrends = await getDailyEngagementTrends(supabaseAdmin, userIds, orgId, filters);

  return {
    activeUsers,
    totalUsers,
    engagementRate,
    totalLearningMinutes,
    avgLearningMinutes,
    coursesCompleted,
    lessonsCompleted,
    totalConversations,
    totalInteractions,
    avgConversationsPerUser,
    shrmiCredits,
    hrciCredits,
    topSkills,
    dailyLearning,
    dailyEngagement,
    dailyEngagementTrends,
  };
}

/**
 * Get all groups for filter dropdown
 */
export async function getGroupsForFilter(): Promise<GroupFilterOption[]> {
  // Verify org admin access
  const orgContext = await getOrgContext();
  if (!orgContext || !orgContext.isOrgAdmin) {
    console.error('[getGroupsForFilter] Unauthorized: User is not an org admin');
    return [];
  }

  const supabaseAdmin = await createAdminClient();
  const orgId = orgContext.orgId;

  // Get all groups for the org
  const { data: groups } = await supabaseAdmin
    .from('employee_groups')
    .select('id, name, is_dynamic')
    .eq('org_id', orgId)
    .order('name', { ascending: true });

  if (!groups || groups.length === 0) {
    return [];
  }

  // Get member counts for each group
  const groupsWithCounts = await Promise.all(
    groups.map(async (group) => {
      let memberCount = 0;

      if (group.is_dynamic) {
        // For dynamic groups, we'd need to compute membership
        // For now, return 0 or implement dynamic computation
        memberCount = 0;
      } else {
        // For static groups, count members
        const { count } = await supabaseAdmin
          .from('employee_group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);
        memberCount = count || 0;
      }

      return {
        id: group.id,
        name: group.name,
        memberCount,
      };
    })
  );

  return groupsWithCounts;
}

/**
 * Generate AI context string for dashboard insights
 */
export async function getDashboardContextForAI(
  filters: DashboardFilters
): Promise<string> {
  // Fetch metrics
  const metrics = await getOrgDashboardMetrics(filters);
  if (!metrics) return '';

  // Format as markdown context
  return `
## Organization Learning Analytics
**Date Range:** ${filters.startDate.toLocaleDateString()} to ${filters.endDate.toLocaleDateString()}
${filters.groupId ? `**Group Filter:** ${filters.groupId}` : '**Scope:** All Employees'}

### Engagement Metrics
- Active Users: ${metrics.activeUsers} of ${metrics.totalUsers} (${metrics.engagementRate}% engagement rate)

### Learning Metrics
- Total Learning Time: ${Math.round(metrics.totalLearningMinutes / 60)} hours
- Average per User: ${Math.round(metrics.avgLearningMinutes)} minutes
- Courses Completed: ${metrics.coursesCompleted}
- Lessons Completed: ${metrics.lessonsCompleted}

### AI Usage
- Total Conversations: ${metrics.totalConversations}
- Total Interactions: ${metrics.totalInteractions}
- Avg Conversations per User: ${metrics.avgConversationsPerUser.toFixed(1)}

### Certifications
- SHRM Credits Earned: ${metrics.shrmiCredits}
- HRCI Credits Earned: ${metrics.hrciCredits}

### Top Skills Developed
${metrics.topSkills.map((s, i) => `${i + 1}. ${s.skill} (${s.count} completions)`).join('\n')}

### Daily Trends (Last 7 Days)
Learning: ${metrics.dailyLearning.slice(-7).map(d => `${d.date}: ${d.minutes}min`).join(', ')}
Active Users: ${metrics.dailyEngagement.slice(-7).map(d => `${d.date}: ${d.activeUsers}`).join(', ')}
  `.trim();
}

/**
 * Track a login event for analytics
 * Should be called after successful authentication
 */
export async function trackLoginEvent(userAgent?: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    // Get user's org_id from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single();

    const supabaseAdmin = await createAdminClient();

    await supabaseAdmin
      .from('login_events')
      .insert({
        user_id: user.id,
        org_id: profile?.org_id || null,
        user_agent: userAgent || null,
      });
  } catch (error) {
    // Don't throw - login tracking is not critical
    console.error('[trackLoginEvent] Error:', error);
  }
}
