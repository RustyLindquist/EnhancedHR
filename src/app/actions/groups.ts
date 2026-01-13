'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { computeDynamicGroupMembers, checkUserInDynamicGroup } from './dynamic-groups';

export interface EmployeeGroup {
  id: string;
  org_id: string;
  name: string;
  created_at: string;
  member_count?: number;
  members?: GroupMember[];
  is_dynamic?: boolean;
  dynamic_type?: 'recent_logins' | 'no_logins' | 'most_active' | 'top_learners' | 'most_talkative';
  criteria?: any; // JSONB field - structure varies by dynamic_type
}

export interface GroupMember {
    user_id: string;
    full_name: string;
    profile_image_url?: string;
    headline?: string;
    role?: string;
}

export async function createGroup(name: string, memberIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Get User's Org ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, role, membership_status')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'org_admin' || profile?.membership_status === 'org_admin';
  if (!profile || !profile.org_id || !isAdmin) {
      return { success: false, error: 'Permission denied' };
  }

  const supabaseAdmin = await createAdminClient();

  // 1. Create Group
  const { data: group, error: groupError } = await supabaseAdmin
    .from('employee_groups')
    .insert({
        org_id: profile.org_id,
        name
    })
    .select()
    .single();

  if (groupError) {
      console.error('Error creating group:', groupError);
      return { success: false, error: groupError.message };
  }

  // 2. Add Members
  if (memberIds.length > 0) {
      const membersPayload = memberIds.map(uid => ({
          group_id: group.id,
          user_id: uid
      }));

      const { error: membersError } = await supabaseAdmin
        .from('employee_group_members')
        .insert(membersPayload);
      
      if (membersError) {
          console.error('Error adding members to group:', membersError);
          // Don't fail the whole operation, but report it? 
          // Or delete the group? existing successful group creation is better than nothing?
          return { success: true, warning: 'Group created but failed to add some members', group };
      }
  }

  revalidatePath('/org/team');
  return { success: true, group };
}

export async function updateGroup(groupId: string, name: string, memberIds: string[]) {
    const supabase = await createClient();
    const supabaseAdmin = await createAdminClient();
    
    // Auth Check? We should probably add one here too formally, but RLS on group update handles it?
    // Wait, if I switch to Admin client, I MUST checking auth manually.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Verify Org Admin
    const { data: profile } = await supabase.from('profiles').select('role, membership_status').eq('id', user.id).single();
    const isAdmin = profile?.role === 'admin' || profile?.role === 'org_admin' || profile?.membership_status === 'org_admin';
    if (!isAdmin) return { success: false, error: 'Permission denied' };

    // 1. Update Name
    const { error: updateError } = await supabaseAdmin
        .from('employee_groups')
        .update({ name })
        .eq('id', groupId);

    if (updateError) return { success: false, error: updateError.message };

    // 2. Sync Members
    
    // Delete existing
    const { error: deleteError } = await supabaseAdmin
        .from('employee_group_members')
        .delete()
        .eq('group_id', groupId);
    
    if (deleteError) return { success: false, error: deleteError.message };

    // Insert new
    if (memberIds.length > 0) {
        const membersPayload = memberIds.map(uid => ({
            group_id: groupId,
            user_id: uid
        }));

        const { error: insertError } = await supabaseAdmin
            .from('employee_group_members')
            .insert(membersPayload);

        if (insertError) return { success: false, error: insertError.message };
    }

    revalidatePath('/org/team');
    return { success: true };
}

export async function deleteGroup(groupId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Check Role
    const { data: profile } = await supabase.from('profiles').select('role, membership_status').eq('id', user.id).single();
    const isAdmin = profile?.role === 'admin' || profile?.role === 'org_admin' || profile?.membership_status === 'org_admin';
    if (!isAdmin) return { success: false, error: 'Permission denied' };

    const supabaseAdmin = await createAdminClient();
    const { error } = await supabaseAdmin.from('employee_groups').delete().eq('id', groupId);
    
    if (error) return { success: false, error: error.message };

    revalidatePath('/org/team');
    return { success: true };
}

export async function getOrgGroups() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase.from('profiles').select('org_id, role, membership_status').eq('id', user.id).single();
    if (!profile?.org_id) return [];

    // Check if user is admin
    const isAdmin = profile?.role === 'admin' || profile?.role === 'org_admin' || profile?.membership_status === 'org_admin';
    if (!isAdmin) return [];

    // Use admin client to bypass RLS since the RLS policies may not include membership_status
    const supabaseAdmin = await createAdminClient();

    const { data: groups, error } = await supabaseAdmin
        .from('employee_groups')
        .select(`
            *,
            members:employee_group_members(user_id)
        `)
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching groups:', error);
        return [];
    }

    // Map to include member count
    return groups.map(g => ({
        ...g,
        member_count: g.members ? g.members.length : 0
    }));
}

export async function getGroupDetails(groupId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Verify the user is an admin (role or membership_status)
    const { data: profile } = await supabase
        .from('profiles')
        .select('org_id, role, membership_status')
        .eq('id', user.id)
        .single();

    const isAdmin = profile?.role === 'admin' || profile?.role === 'org_admin' || profile?.membership_status === 'org_admin';
    if (!profile || !isAdmin) return null;

    // Use admin client to bypass RLS since the RLS policies may not include membership_status
    const supabaseAdmin = await createAdminClient();

    const { data: group, error } = await supabaseAdmin
        .from('employee_groups')
        .select(`
            *,
            org_id
        `)
        .eq('id', groupId)
        .single();

    if (error || !group) return null;

    // Verify the group belongs to the user's org
    if (group.org_id !== profile.org_id) return null;

    let memberIds: string[] = [];

    // For dynamic groups, compute members
    if (group.is_dynamic) {
        memberIds = await computeDynamicGroupMembers(groupId);
    } else {
        // Fetch static members from employee_group_members
        const { data: members } = await supabaseAdmin
            .from('employee_group_members')
            .select('user_id')
            .eq('group_id', groupId);
        memberIds = members?.map(m => m.user_id) || [];
    }

    // Fetch profiles for all members
    let formattedMembers: GroupMember[] = [];
    if (memberIds.length > 0) {
        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, avatar_url, headline, role')
            .in('id', memberIds);

        formattedMembers = profiles?.map(p => ({
            user_id: p.id,
            full_name: p.full_name || 'Unknown',
            profile_image_url: p.avatar_url,
            headline: p.headline,
            role: p.role
        })) || [];
    }

    return {
        ...group,
        members: formattedMembers,
        member_count: formattedMembers.length
    };
}

/**
 * Get which groups a specific member belongs to
 */
export async function getMemberGroups(memberId: string): Promise<string[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: memberships } = await supabase
        .from('employee_group_members')
        .select('group_id')
        .eq('user_id', memberId);

    return memberships?.map(m => m.group_id) || [];
}

/**
 * Update which groups a member belongs to
 */
export async function updateMemberGroups(
    memberId: string,
    groupIds: string[],
    newGroup?: { name: string }
): Promise<{ success: boolean; error?: string; newGroupId?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Verify admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('org_id, role, membership_status')
        .eq('id', user.id)
        .single();

    const isAdmin = profile?.role === 'admin' || profile?.role === 'org_admin' || profile?.membership_status === 'org_admin';
    if (!profile || !profile.org_id || !isAdmin) {
        return { success: false, error: 'Permission denied' };
    }

    const supabaseAdmin = await createAdminClient();
    let newGroupId: string | undefined;

    // Create new group if requested
    if (newGroup?.name) {
        const { data: createdGroup, error: createError } = await supabaseAdmin
            .from('employee_groups')
            .insert({ org_id: profile.org_id, name: newGroup.name })
            .select()
            .single();

        if (createError) {
            console.error('Error creating group:', createError);
            return { success: false, error: createError.message };
        }
        newGroupId = createdGroup.id;
        groupIds = [...groupIds, createdGroup.id];
    }

    // Get current memberships for this member
    const { data: currentMemberships } = await supabaseAdmin
        .from('employee_group_members')
        .select('group_id')
        .eq('user_id', memberId);

    const currentGroupIds = new Set(currentMemberships?.map(m => m.group_id) || []);
    const targetGroupIds = new Set(groupIds);

    // Groups to add
    const toAdd = groupIds.filter(id => !currentGroupIds.has(id));
    // Groups to remove
    const toRemove = [...currentGroupIds].filter(id => !targetGroupIds.has(id));

    // Remove from groups
    if (toRemove.length > 0) {
        const { error: removeError } = await supabaseAdmin
            .from('employee_group_members')
            .delete()
            .eq('user_id', memberId)
            .in('group_id', toRemove);

        if (removeError) {
            console.error('Error removing from groups:', removeError);
            return { success: false, error: removeError.message };
        }
    }

    // Add to groups
    if (toAdd.length > 0) {
        const { error: addError } = await supabaseAdmin
            .from('employee_group_members')
            .insert(toAdd.map(gid => ({ user_id: memberId, group_id: gid })));

        if (addError) {
            console.error('Error adding to groups:', addError);
            return { success: false, error: addError.message };
        }
    }

    revalidatePath('/org/team');
    revalidatePath('/org/users');
    return { success: true, newGroupId };
}

export interface GroupStats {
    totalLearningMinutes: number;
    avgLearningMinutes: number;
    coursesCompleted: number;
    totalConversations: number;
    activeMembers: number;
    totalMembers: number;
}

/**
 * Get aggregated platform usage statistics for a group
 */
export async function getGroupStats(groupId: string): Promise<GroupStats | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Verify admin access
    const { data: profile } = await supabase
        .from('profiles')
        .select('org_id, role, membership_status')
        .eq('id', user.id)
        .single();

    const isAdmin = profile?.role === 'admin' || profile?.role === 'org_admin' || profile?.membership_status === 'org_admin';
    if (!profile || !isAdmin) return null;

    const supabaseAdmin = await createAdminClient();

    // Check if it's a dynamic group
    const { data: group } = await supabaseAdmin
        .from('employee_groups')
        .select('is_dynamic')
        .eq('id', groupId)
        .single();

    let memberIds: string[] = [];

    if (group?.is_dynamic) {
        // Compute dynamic members
        memberIds = await computeDynamicGroupMembers(groupId);
    } else {
        // Get static members
        const { data: members } = await supabaseAdmin
            .from('employee_group_members')
            .select('user_id')
            .eq('group_id', groupId);
        memberIds = members?.map(m => m.user_id) || [];
    }

    if (!memberIds || memberIds.length === 0) {
        return {
            totalLearningMinutes: 0,
            avgLearningMinutes: 0,
            coursesCompleted: 0,
            totalConversations: 0,
            activeMembers: 0,
            totalMembers: 0
        };
    }

    const totalMembers = memberIds.length;

    // Fetch user_progress for these members
    const { data: progressData } = await supabaseAdmin
        .from('user_progress')
        .select('user_id, view_time_seconds, is_completed, last_accessed')
        .in('user_id', memberIds);

    // Fetch conversations count
    const { data: conversationData } = await supabaseAdmin
        .from('conversations')
        .select('user_id')
        .in('user_id', memberIds);

    // Aggregate stats
    let totalViewTimeSeconds = 0;
    let coursesCompleted = 0;
    const activeUserIds = new Set<string>();

    progressData?.forEach(p => {
        totalViewTimeSeconds += p.view_time_seconds || 0;
        if (p.is_completed) coursesCompleted += 1;
        // Consider "active" if they have any progress in the last 30 days
        if (p.last_accessed) {
            const lastAccess = new Date(p.last_accessed);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            if (lastAccess >= thirtyDaysAgo) {
                activeUserIds.add(p.user_id);
            }
        }
    });

    const totalLearningMinutes = Math.round(totalViewTimeSeconds / 60);
    const avgLearningMinutes = totalMembers > 0 ? Math.round(totalLearningMinutes / totalMembers) : 0;
    const totalConversations = conversationData?.length || 0;

    return {
        totalLearningMinutes,
        avgLearningMinutes,
        coursesCompleted,
        totalConversations,
        activeMembers: activeUserIds.size,
        totalMembers
    };
}

export interface GroupMemberWithStats {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
    role: string;
    membership_status: string;
    courses_completed: number;
    total_time_spent_minutes: number;
    credits_earned: number;
    conversations_count: number;
}

/**
 * Get group members with their individual stats (for UserCard display)
 * @param groupId - The group ID
 * @param memberIds - Optional pre-computed member IDs (for dynamic groups)
 */
export async function getGroupMembersWithStats(
    groupId: string,
    memberIds?: string[]
): Promise<GroupMemberWithStats[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Verify admin access
    const { data: profile } = await supabase
        .from('profiles')
        .select('org_id, role, membership_status')
        .eq('id', user.id)
        .single();

    const isAdmin = profile?.role === 'admin' || profile?.role === 'org_admin' || profile?.membership_status === 'org_admin';
    if (!profile || !isAdmin) return [];

    const supabaseAdmin = await createAdminClient();

    // Get member IDs for this group if not provided
    if (!memberIds) {
        // Check if it's a dynamic group
        const { data: group } = await supabaseAdmin
            .from('employee_groups')
            .select('is_dynamic')
            .eq('id', groupId)
            .single();

        if (group?.is_dynamic) {
            // Compute dynamic members
            memberIds = await computeDynamicGroupMembers(groupId);
        } else {
            // Get static members
            const { data: groupMembers } = await supabaseAdmin
                .from('employee_group_members')
                .select('user_id')
                .eq('group_id', groupId);
            memberIds = groupMembers?.map(m => m.user_id) || [];
        }
    }

    if (!memberIds || memberIds.length === 0) return [];

    // Fetch full profile data for members (including any email if stored in profiles)
    const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, avatar_url, role, membership_status')
        .in('id', memberIds);

    // Note: We don't query auth.users directly as it requires special access
    // Email could be fetched via auth.admin.listUsers but for now we skip it

    // Fetch progress data
    const { data: progressData } = await supabaseAdmin
        .from('user_progress')
        .select('user_id, view_time_seconds, is_completed')
        .in('user_id', memberIds);

    // Fetch conversations
    const { data: conversationData } = await supabaseAdmin
        .from('conversations')
        .select('user_id')
        .in('user_id', memberIds);

    // Fetch credits
    const { data: creditsData } = await supabaseAdmin
        .from('user_credits_ledger')
        .select('user_id, amount')
        .in('user_id', memberIds);

    // Aggregate metrics per user
    const metricsMap = new Map<string, {
        timeSeconds: number;
        completed: number;
        conversations: number;
        credits: number;
    }>();

    memberIds.forEach(id => {
        metricsMap.set(id, { timeSeconds: 0, completed: 0, conversations: 0, credits: 0 });
    });

    progressData?.forEach(p => {
        const m = metricsMap.get(p.user_id);
        if (m) {
            m.timeSeconds += p.view_time_seconds || 0;
            if (p.is_completed) m.completed += 1;
        }
    });

    conversationData?.forEach(c => {
        const m = metricsMap.get(c.user_id);
        if (m) m.conversations += 1;
    });

    creditsData?.forEach(c => {
        const m = metricsMap.get(c.user_id);
        if (m) m.credits += c.amount || 0;
    });

    // Build final array
    return (profiles || []).map(p => {
        const metrics = metricsMap.get(p.id) || { timeSeconds: 0, completed: 0, conversations: 0, credits: 0 };
        return {
            id: p.id,
            email: '', // Email not available without auth.users access
            full_name: p.full_name || 'Unknown',
            avatar_url: p.avatar_url || '',
            role: p.role || 'user',
            membership_status: p.membership_status || 'employee',
            courses_completed: metrics.completed,
            total_time_spent_minutes: Math.round(metrics.timeSeconds / 60),
            credits_earned: metrics.credits,
            conversations_count: metrics.conversations
        };
    });
}

export interface UserGroupMemberships {
    customGroups: EmployeeGroup[];
    dynamicGroups: EmployeeGroup[];
}

/**
 * Get groups that the current user belongs to (for non-admin members)
 * Returns both custom groups (via employee_group_members) and dynamic groups (computed)
 */
export async function getUserGroupMemberships(): Promise<UserGroupMemberships> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { customGroups: [], dynamicGroups: [] };

    // Get user's org
    const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

    if (!profile?.org_id) return { customGroups: [], dynamicGroups: [] };

    const supabaseAdmin = await createAdminClient();

    // Get custom groups the user belongs to
    const { data: memberships } = await supabaseAdmin
        .from('employee_group_members')
        .select('group_id')
        .eq('user_id', user.id);

    const customGroupIds = memberships?.map(m => m.group_id) || [];

    // Fetch custom group details
    let customGroups: EmployeeGroup[] = [];
    if (customGroupIds.length > 0) {
        const { data: groups } = await supabaseAdmin
            .from('employee_groups')
            .select(`
                id,
                org_id,
                name,
                created_at,
                is_dynamic,
                dynamic_type,
                criteria
            `)
            .in('id', customGroupIds)
            .eq('is_dynamic', false);

        // Fetch member counts separately
        const groupsWithCounts: EmployeeGroup[] = [];
        for (const g of groups || []) {
            const { count } = await supabaseAdmin
                .from('employee_group_members')
                .select('*', { count: 'exact', head: true })
                .eq('group_id', g.id);
            groupsWithCounts.push({
                ...g,
                member_count: count || 0
            });
        }
        customGroups = groupsWithCounts;
    }

    // Get all dynamic groups for the org
    const { data: allDynamicGroups } = await supabaseAdmin
        .from('employee_groups')
        .select('id, org_id, name, created_at, is_dynamic, dynamic_type, criteria')
        .eq('org_id', profile.org_id)
        .eq('is_dynamic', true);

    // Check which dynamic groups the user belongs to
    const dynamicGroups: EmployeeGroup[] = [];
    if (allDynamicGroups) {
        for (const group of allDynamicGroups) {
            const isInGroup = await checkUserInDynamicGroup(group.id, user.id);
            if (isInGroup) {
                dynamicGroups.push(group);
            }
        }
    }

    return { customGroups, dynamicGroups };
}
