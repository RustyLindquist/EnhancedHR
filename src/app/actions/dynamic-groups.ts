'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import type {
  RecentLoginsCriteria,
  NoLoginsCriteria,
  MostActiveCriteria,
  TopLearnersCriteria,
  MostTalkativeCriteria,
  DynamicGroupCriteria,
} from './dynamic-groups-types';

/**
 * Query users with recent login activity
 */
async function queryRecentLogins(
  supabaseAdmin: any,
  orgId: string,
  criteria: RecentLoginsCriteria
): Promise<string[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - criteria.days);
  const cutoffIso = cutoffDate.toISOString();

  // Get all org users
  const { data: orgUsers } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('org_id', orgId);

  if (!orgUsers || orgUsers.length === 0) return [];

  const userIds = orgUsers.map((u: any) => u.id);
  const activeUserIds = new Set<string>();

  // Check user_progress.last_accessed
  const { data: progressData } = await supabaseAdmin
    .from('user_progress')
    .select('user_id')
    .in('user_id', userIds)
    .gte('last_accessed', cutoffIso);

  progressData?.forEach((p: any) => activeUserIds.add(p.user_id));

  // Check conversations.updated_at
  const { data: conversationData } = await supabaseAdmin
    .from('conversations')
    .select('user_id')
    .in('user_id', userIds)
    .gte('updated_at', cutoffIso);

  conversationData?.forEach((c: any) => activeUserIds.add(c.user_id));

  // Check user_streaks.activity_date
  const { data: streakData } = await supabaseAdmin
    .from('user_streaks')
    .select('user_id')
    .in('user_id', userIds)
    .gte('activity_date', cutoffIso);

  streakData?.forEach((s: any) => activeUserIds.add(s.user_id));

  return Array.from(activeUserIds);
}

/**
 * Query users WITHOUT recent login activity
 */
async function queryNoLogins(
  supabaseAdmin: any,
  orgId: string,
  criteria: NoLoginsCriteria
): Promise<string[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - criteria.days);
  const cutoffIso = cutoffDate.toISOString();

  // Get all org users
  const { data: orgUsers } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('org_id', orgId);

  if (!orgUsers || orgUsers.length === 0) return [];

  const userIds = orgUsers.map((u: any) => u.id);
  const activeUserIds = new Set<string>();

  // Check user_progress.last_accessed
  const { data: progressData } = await supabaseAdmin
    .from('user_progress')
    .select('user_id')
    .in('user_id', userIds)
    .gte('last_accessed', cutoffIso);

  progressData?.forEach((p: any) => activeUserIds.add(p.user_id));

  // Check conversations.updated_at
  const { data: conversationData } = await supabaseAdmin
    .from('conversations')
    .select('user_id')
    .in('user_id', userIds)
    .gte('updated_at', cutoffIso);

  conversationData?.forEach((c: any) => activeUserIds.add(c.user_id));

  // Check user_streaks.activity_date
  const { data: streakData } = await supabaseAdmin
    .from('user_streaks')
    .select('user_id')
    .in('user_id', userIds)
    .gte('activity_date', cutoffIso);

  streakData?.forEach((s: any) => activeUserIds.add(s.user_id));

  // Return users who are NOT in the active set
  return userIds.filter((id: string) => !activeUserIds.has(id));
}

/**
 * Query most active users based on threshold scoring
 */
async function queryMostActive(
  supabaseAdmin: any,
  orgId: string,
  criteria: MostActiveCriteria
): Promise<string[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - criteria.period_days);
  const cutoffIso = cutoffDate.toISOString();

  // Get all org users
  const { data: orgUsers } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('org_id', orgId);

  if (!orgUsers || orgUsers.length === 0) return [];

  const userIds = orgUsers.map((u: any) => u.id);
  const userScores = new Map<string, { scores: number[]; total: number }>();

  // Initialize scores for all users
  userIds.forEach((id: string) => {
    userScores.set(id, { scores: [], total: 0 });
  });

  // Calculate streaks metric
  if (criteria.metrics.includes('streaks')) {
    const { data: streakData } = await supabaseAdmin
      .from('user_streaks')
      .select('user_id, current_streak')
      .in('user_id', userIds)
      .gte('activity_date', cutoffIso);

    const streakMap = new Map<string, number>();
    streakData?.forEach((s: any) => {
      const current = streakMap.get(s.user_id) || 0;
      streakMap.set(s.user_id, Math.max(current, s.current_streak || 0));
    });

    const maxStreak = Math.max(...Array.from(streakMap.values()), 1);
    userIds.forEach((id: string) => {
      const streak = streakMap.get(id) || 0;
      const score = (streak / maxStreak) * 100;
      const userScore = userScores.get(id)!;
      userScore.scores.push(score);
    });
  }

  // Calculate time_in_course metric
  if (criteria.metrics.includes('time_in_course')) {
    const { data: progressData } = await supabaseAdmin
      .from('user_progress')
      .select('user_id, view_time_seconds, last_accessed')
      .in('user_id', userIds)
      .gte('last_accessed', cutoffIso);

    const timeMap = new Map<string, number>();
    progressData?.forEach((p: any) => {
      const current = timeMap.get(p.user_id) || 0;
      timeMap.set(p.user_id, current + (p.view_time_seconds || 0));
    });

    const maxTime = Math.max(...Array.from(timeMap.values()), 1);
    userIds.forEach((id: string) => {
      const time = timeMap.get(id) || 0;
      const score = (time / maxTime) * 100;
      const userScore = userScores.get(id)!;
      userScore.scores.push(score);
    });
  }

  // Calculate courses_completed metric
  if (criteria.metrics.includes('courses_completed')) {
    const { data: progressData } = await supabaseAdmin
      .from('user_progress')
      .select('user_id, is_completed, last_accessed')
      .in('user_id', userIds)
      .gte('last_accessed', cutoffIso)
      .eq('is_completed', true);

    const completedMap = new Map<string, number>();
    progressData?.forEach((p: any) => {
      const current = completedMap.get(p.user_id) || 0;
      completedMap.set(p.user_id, current + 1);
    });

    const maxCompleted = Math.max(...Array.from(completedMap.values()), 1);
    userIds.forEach((id: string) => {
      const completed = completedMap.get(id) || 0;
      const score = (completed / maxCompleted) * 100;
      const userScore = userScores.get(id)!;
      userScore.scores.push(score);
    });
  }

  // Calculate collection_utilization metric
  if (criteria.metrics.includes('collection_utilization')) {
    // Query collection items for users via user_collections
    const { data: collectionData } = await supabaseAdmin
      .from('user_collections')
      .select(`
        id,
        user_id,
        collection_items:collection_items(count)
      `)
      .in('user_id', userIds);

    const collectionMap = new Map<string, number>();
    collectionData?.forEach((c: any) => {
      const current = collectionMap.get(c.user_id) || 0;
      const itemCount = c.collection_items?.length || 0;
      collectionMap.set(c.user_id, current + itemCount);
    });

    const maxCollectionItems = Math.max(...Array.from(collectionMap.values()), 1);
    userIds.forEach((id: string) => {
      const items = collectionMap.get(id) || 0;
      const score = (items / maxCollectionItems) * 100;
      const userScore = userScores.get(id)!;
      userScore.scores.push(score);
    });
  }

  // Calculate average scores
  userScores.forEach((value, key) => {
    if (value.scores.length > 0) {
      value.total = value.scores.reduce((sum, s) => sum + s, 0) / value.scores.length;
    }
  });

  // Filter users above threshold
  return userIds.filter((id: string) => {
    const score = userScores.get(id)?.total || 0;
    return score >= criteria.threshold;
  });
}

/**
 * Query top learners based on threshold scoring
 */
async function queryTopLearners(
  supabaseAdmin: any,
  orgId: string,
  criteria: TopLearnersCriteria
): Promise<string[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - criteria.period_days);
  const cutoffIso = cutoffDate.toISOString();

  // Get all org users
  const { data: orgUsers } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('org_id', orgId);

  if (!orgUsers || orgUsers.length === 0) return [];

  const userIds = orgUsers.map((u: any) => u.id);
  const userScores = new Map<string, { scores: number[]; total: number }>();

  // Initialize scores for all users
  userIds.forEach((id: string) => {
    userScores.set(id, { scores: [], total: 0 });
  });

  // Calculate time_spent metric
  if (criteria.metrics.includes('time_spent')) {
    const { data: progressData } = await supabaseAdmin
      .from('user_progress')
      .select('user_id, view_time_seconds, last_accessed')
      .in('user_id', userIds)
      .gte('last_accessed', cutoffIso);

    const timeMap = new Map<string, number>();
    progressData?.forEach((p: any) => {
      const current = timeMap.get(p.user_id) || 0;
      timeMap.set(p.user_id, current + (p.view_time_seconds || 0));
    });

    const maxTime = Math.max(...Array.from(timeMap.values()), 1);
    userIds.forEach((id: string) => {
      const time = timeMap.get(id) || 0;
      const score = (time / maxTime) * 100;
      const userScore = userScores.get(id)!;
      userScore.scores.push(score);
    });
  }

  // Calculate courses_completed metric
  if (criteria.metrics.includes('courses_completed')) {
    const { data: progressData } = await supabaseAdmin
      .from('user_progress')
      .select('user_id, is_completed, last_accessed')
      .in('user_id', userIds)
      .gte('last_accessed', cutoffIso)
      .eq('is_completed', true);

    const completedMap = new Map<string, number>();
    progressData?.forEach((p: any) => {
      const current = completedMap.get(p.user_id) || 0;
      completedMap.set(p.user_id, current + 1);
    });

    const maxCompleted = Math.max(...Array.from(completedMap.values()), 1);
    userIds.forEach((id: string) => {
      const completed = completedMap.get(id) || 0;
      const score = (completed / maxCompleted) * 100;
      const userScore = userScores.get(id)!;
      userScore.scores.push(score);
    });
  }

  // Calculate credits_earned metric
  if (criteria.metrics.includes('credits_earned')) {
    const { data: creditsData } = await supabaseAdmin
      .from('user_credits_ledger')
      .select('user_id, amount, awarded_at')
      .in('user_id', userIds)
      .gte('awarded_at', cutoffIso);

    const creditsMap = new Map<string, number>();
    creditsData?.forEach((c: any) => {
      const current = creditsMap.get(c.user_id) || 0;
      creditsMap.set(c.user_id, current + (c.amount || 0));
    });

    const maxCredits = Math.max(...Array.from(creditsMap.values()), 1);
    userIds.forEach((id: string) => {
      const credits = creditsMap.get(id) || 0;
      const score = (credits / maxCredits) * 100;
      const userScore = userScores.get(id)!;
      userScore.scores.push(score);
    });
  }

  // Calculate average scores
  userScores.forEach((value, key) => {
    if (value.scores.length > 0) {
      value.total = value.scores.reduce((sum, s) => sum + s, 0) / value.scores.length;
    }
  });

  // Filter users above threshold
  return userIds.filter((id: string) => {
    const score = userScores.get(id)?.total || 0;
    return score >= criteria.threshold;
  });
}

/**
 * Query most talkative users based on threshold scoring
 */
async function queryMostTalkative(
  supabaseAdmin: any,
  orgId: string,
  criteria: MostTalkativeCriteria
): Promise<string[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - criteria.period_days);
  const cutoffIso = cutoffDate.toISOString();

  // Get all org users
  const { data: orgUsers } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('org_id', orgId);

  if (!orgUsers || orgUsers.length === 0) return [];

  const userIds = orgUsers.map((u: any) => u.id);
  const userScores = new Map<string, { scores: number[]; total: number }>();

  // Initialize scores for all users
  userIds.forEach((id: string) => {
    userScores.set(id, { scores: [], total: 0 });
  });

  // Calculate conversation_count metric
  if (criteria.metrics.includes('conversation_count')) {
    const { data: conversationData } = await supabaseAdmin
      .from('conversations')
      .select('user_id')
      .in('user_id', userIds)
      .gte('created_at', cutoffIso);

    const conversationMap = new Map<string, number>();
    conversationData?.forEach((c: any) => {
      const current = conversationMap.get(c.user_id) || 0;
      conversationMap.set(c.user_id, current + 1);
    });

    const maxConversations = Math.max(...Array.from(conversationMap.values()), 1);
    userIds.forEach((id: string) => {
      const count = conversationMap.get(id) || 0;
      const score = (count / maxConversations) * 100;
      const userScore = userScores.get(id)!;
      userScore.scores.push(score);
    });
  }

  // Calculate message_count metric
  if (criteria.metrics.includes('message_count')) {
    // Get conversations for these users first
    const { data: conversationData } = await supabaseAdmin
      .from('conversations')
      .select('id, user_id')
      .in('user_id', userIds)
      .gte('created_at', cutoffIso);

    if (conversationData && conversationData.length > 0) {
      const conversationIds = conversationData.map((c: any) => c.id);

      // Get messages for these conversations (only user messages)
      const { data: messageData } = await supabaseAdmin
        .from('conversation_messages')
        .select('conversation_id')
        .in('conversation_id', conversationIds)
        .eq('role', 'user')
        .gte('created_at', cutoffIso);

      // Map messages back to users
      const conversationToUser = new Map<string, string>(
        conversationData.map((c: any) => [c.id, c.user_id])
      );

      const messageMap = new Map<string, number>();
      messageData?.forEach((m: any) => {
        const userId = conversationToUser.get(m.conversation_id);
        if (userId) {
          const current = messageMap.get(userId) || 0;
          messageMap.set(userId, current + 1);
        }
      });

      const maxMessages = Math.max(...Array.from(messageMap.values()), 1);
      userIds.forEach((id: string) => {
        const count = messageMap.get(id) || 0;
        const score = (count / maxMessages) * 100;
        const userScore = userScores.get(id)!;
        userScore.scores.push(score);
      });
    }
  }

  // Calculate average scores
  userScores.forEach((value, key) => {
    if (value.scores.length > 0) {
      value.total = value.scores.reduce((sum, s) => sum + s, 0) / value.scores.length;
    }
  });

  // Filter users above threshold
  return userIds.filter((id: string) => {
    const score = userScores.get(id)?.total || 0;
    return score >= criteria.threshold;
  });
}

/**
 * Compute members for a dynamic group
 */
export async function computeDynamicGroupMembers(groupId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Verify admin access
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, role, membership_status')
    .eq('id', user.id)
    .single();

  const isAdmin =
    profile?.role === 'admin' ||
    profile?.role === 'org_admin' ||
    profile?.membership_status === 'org_admin';
  if (!profile || !isAdmin) return [];

  const supabaseAdmin = await createAdminClient();

  // Get the group details
  const { data: group, error } = await supabaseAdmin
    .from('employee_groups')
    .select('org_id, is_dynamic, dynamic_type, criteria')
    .eq('id', groupId)
    .single();

  if (error || !group || !group.is_dynamic) {
    console.error('Error fetching dynamic group:', error);
    return [];
  }

  // Verify group belongs to user's org
  if (group.org_id !== profile.org_id) return [];

  const criteria = group.criteria as DynamicGroupCriteria;

  // Dispatch to appropriate query builder
  let memberIds: string[] = [];

  switch (group.dynamic_type) {
    case 'recent_logins':
      memberIds = await queryRecentLogins(
        supabaseAdmin,
        group.org_id,
        criteria as RecentLoginsCriteria
      );
      break;
    case 'no_logins':
      memberIds = await queryNoLogins(
        supabaseAdmin,
        group.org_id,
        criteria as NoLoginsCriteria
      );
      break;
    case 'most_active':
      memberIds = await queryMostActive(
        supabaseAdmin,
        group.org_id,
        criteria as MostActiveCriteria
      );
      break;
    case 'top_learners':
      memberIds = await queryTopLearners(
        supabaseAdmin,
        group.org_id,
        criteria as TopLearnersCriteria
      );
      break;
    case 'most_talkative':
      memberIds = await queryMostTalkative(
        supabaseAdmin,
        group.org_id,
        criteria as MostTalkativeCriteria
      );
      break;
    default:
      console.error('Unknown dynamic group type:', group.dynamic_type);
      return [];
  }

  // Update last_computed_at
  await supabaseAdmin
    .from('employee_groups')
    .update({ last_computed_at: new Date().toISOString() })
    .eq('id', groupId);

  return memberIds;
}

/**
 * Update criteria for a dynamic group
 */
export async function updateDynamicGroupCriteria(
  groupId: string,
  criteria: DynamicGroupCriteria
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  // Verify admin access
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, role, membership_status')
    .eq('id', user.id)
    .single();

  const isAdmin =
    profile?.role === 'admin' ||
    profile?.role === 'org_admin' ||
    profile?.membership_status === 'org_admin';
  if (!profile || !isAdmin) {
    return { success: false, error: 'Permission denied' };
  }

  const supabaseAdmin = await createAdminClient();

  // Update criteria
  const { error } = await supabaseAdmin
    .from('employee_groups')
    .update({ criteria })
    .eq('id', groupId)
    .eq('org_id', profile.org_id);

  if (error) {
    console.error('Error updating dynamic group criteria:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get all dynamic groups for an organization
 */
export async function getDynamicGroupsForOrg(
  orgId: string
): Promise<{ id: string; name: string; dynamic_type: string; criteria: any }[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Verify admin access
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, role, membership_status')
    .eq('id', user.id)
    .single();

  const isAdmin =
    profile?.role === 'admin' ||
    profile?.role === 'org_admin' ||
    profile?.membership_status === 'org_admin';
  if (!profile || !isAdmin || profile.org_id !== orgId) return [];

  const supabaseAdmin = await createAdminClient();

  const { data, error } = await supabaseAdmin
    .from('employee_groups')
    .select('id, name, dynamic_type, criteria')
    .eq('org_id', orgId)
    .eq('is_dynamic', true);

  if (error) {
    console.error('Error fetching dynamic groups:', error);
    return [];
  }

  return data || [];
}

/**
 * Seed default dynamic groups for an organization
 */
export async function seedDynamicGroupsForOrg(
  orgId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  // Verify admin access
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, role, membership_status')
    .eq('id', user.id)
    .single();

  const isAdmin =
    profile?.role === 'admin' ||
    profile?.role === 'org_admin' ||
    profile?.membership_status === 'org_admin';
  if (!profile || !isAdmin) {
    return { success: false, error: 'Permission denied' };
  }

  const supabaseAdmin = await createAdminClient();

  try {
    // Call the SQL function
    const { error } = await supabaseAdmin.rpc('seed_dynamic_groups_for_org', {
      p_org_id: orgId,
    });

    if (error) {
      console.error('Error seeding dynamic groups:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error calling seed function:', err);
    return { success: false, error: err.message };
  }
}
