'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface EmployeeGroup {
  id: string;
  org_id: string;
  name: string;
  created_at: string;
  member_count?: number;
  members?: GroupMember[];
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

    // Fetch members with profiles using admin client
    const { data: members } = await supabaseAdmin
        .from('employee_group_members')
        .select(`
            user_id,
            profile:profiles(full_name, avatar_url, headline, role)
        `)
        .eq('group_id', groupId);

    const formattedMembers = members?.map(m => ({
        user_id: m.user_id,
        full_name: (m.profile as any)?.full_name || 'Unknown',
        profile_image_url: (m.profile as any)?.avatar_url,
        headline: (m.profile as any)?.headline,
        role: (m.profile as any)?.role
    })) || [];

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
