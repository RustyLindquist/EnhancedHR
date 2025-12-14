'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface OrgMember {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  role: string;
  role_title: string;
  membership_status: string;
  created_at: string;
  is_owner: boolean;
  // Metrics
  courses_completed: number;
  total_time_spent_minutes: number;
  credits_earned: number;
  last_login: string;
  conversations_count: number;
}

export interface InviteInfo {
    inviteUrl: string;
    orgSlug: string;
}

export async function getOrgMembers(): Promise<{ members: OrgMember[], inviteInfo: InviteInfo | null, error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { members: [], inviteInfo: null, error: 'Unauthorized' };
    }

    // 1. Get User's Org ID and Organization Details (to find owner)
    const { data: profile } = await supabase
        .from('profiles')
        .select('org_id, role, organizations(*)')
        .eq('id', user.id)
        .single();

    if (!profile?.org_id) {
        return { members: [], inviteInfo: null, error: 'No Organization Found' };
    }

    // Safely access owner_id from the joined organization data
    // The type returned by 'organizations(*)' might be an array or object depending on generated types, 
    // but typically explicit join via 'org_id' is 1:1. Supabase JS returns single object if relationship is 1:1, else array.
    // We treat it safely.
    // @ts-ignore - Supabase type inference can be tricky with complex joins without strict schema generation
    const orgData = Array.isArray(profile.organizations) ? profile.organizations[0] : profile.organizations;
    const ownerId = orgData?.owner_id;


    // 2. Fetch Members
    const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false });

    if (membersError) {
        console.error('Error fetching org members:', membersError);
        return { members: [], inviteInfo: null, error: 'Failed to fetch members' };
    }

    // 3. Fetch Metrics for these members
    const memberIds = members.map(m => m.id);

    // 3a. User Progress (Time Spent & Completed)
    // Note: This is an approximation. Ideally we'd group by user_id in SQL, but for now we fetch raw or use RPC.
    // Fetching raw for small orgs is fine.
    const { data: progressData } = await supabase
        .from('user_progress')
        .select('user_id, view_time_seconds, is_completed, last_accessed')
        .in('user_id', memberIds);

    // 3b. Conversations Count
    const { data: conversationData } = await supabase
        .from('conversations')
        .select('user_id')
        .in('user_id', memberIds);

    // 3c. Credits Ledger
    const { data: creditsData } = await supabase
        .from('user_credits_ledger')
        .select('user_id, amount')
        .in('user_id', memberIds);


    // 4. Aggregate Metrics
    const metricsMap = new Map<string, {
        timeSeconds: number;
        completed: number;
        conversations: number;
        credits: number;
        lastAccess: string | null;
    }>();

    // Initialize map
    memberIds.forEach(id => {
        metricsMap.set(id, { timeSeconds: 0, completed: 0, conversations: 0, credits: 0, lastAccess: null });
    });

    // Aggregates
    progressData?.forEach(p => {
        const m = metricsMap.get(p.user_id);
        if (m) {
            m.timeSeconds += (p.view_time_seconds || 0);
            if (p.is_completed) m.completed += 1;
            // Update last access if newer
            if (p.last_accessed && (!m.lastAccess || new Date(p.last_accessed) > new Date(m.lastAccess))) {
                m.lastAccess = p.last_accessed;
            }
        }
    });

    conversationData?.forEach(c => {
         const m = metricsMap.get(c.user_id);
         if (m) m.conversations += 1;
    });

    creditsData?.forEach(c => {
        const m = metricsMap.get(c.user_id);
        if (m) m.credits += (c.amount || 0); // Assuming amount is always positive for earned? Or need to sum net?
        // Usually credits earned is sum of positive entries.
    });


    // 5. Prepare Invite Info
    const org = profile.organizations as any;
    let inviteInfo: InviteInfo | null = null;
    
    if (org && org.slug && org.invite_hash) {
        inviteInfo = {
            inviteUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/${org.slug}/${org.invite_hash}`,
            orgSlug: org.slug
        };
    }

    // 6. Map to clean interface
    const mappedMembers: OrgMember[] = members.map(m => {
        const metrics = metricsMap.get(m.id)!;
        // Fallback for last login if not in progress (e.g. from auth/profile if available, but for now use created_at or null)
        // Ideally we fetch last_sign_in_at from auth.users but we can't easily join that here without admin.
        // We'll use the latest progress access as a proxy for "Learning Activity".

        return {
            id: m.id,
            email: m.email || '', // Ensure this column is selected in step 2 (select *)
            full_name: m.full_name || 'Unknown',
            avatar_url: m.avatar_url || '',
            role: m.role || 'user',
            role_title: (m.data as any)?.job_title || 'Team Member', // Assuming job_title might be in metadata column in profile if migration added it, or we default.
            membership_status: m.membership_status || 'active',
            created_at: m.created_at,
            courses_completed: metrics?.completed || 0,
            total_time_spent_minutes: Math.round((metrics?.timeSeconds || 0) / 60),
            credits_earned: metrics?.credits || 0,
            conversations_count: metrics?.conversations || 0,
            last_login: metrics?.lastAccess || m.created_at, // Proxy
            is_owner: m.id === ownerId
        };
    });

    return { members: mappedMembers, inviteInfo };

  } catch (error: any) {
      console.error('getOrgMembers Exception:', error);
      return { members: [], inviteInfo: null, error: error.message };
  }
}

export async function toggleOrgMemberStatus(userId: string, currentStatus: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    // Verify requester is org admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('org_id, role')
      .eq('id', user.id)
      .single();

    if (requesterProfile?.role !== 'org_admin') {
      return { success: false, error: 'Only admins can manage members' };
    }

    // Verify target user is in same org
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', userId)
      .single();

    if (targetProfile?.org_id !== requesterProfile.org_id) {
      return { success: false, error: 'User not in your organization' };
    }

    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ membership_status: newStatus })
      .eq('id', userId);

    if (updateError) throw updateError;

    revalidatePath('/org/team');
    return { success: true };

  } catch (error: any) {
    console.error('toggleOrgMemberStatus error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateOrgInviteHash(newHash: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    
    // 1. Auth & Admin Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('org_id, role')
      .eq('id', user.id)
      .single();

    if (requesterProfile?.role !== 'org_admin' || !requesterProfile?.org_id) {
      return { success: false, error: 'Only admins can manage invite settings' };
    }

    // 2. Validate Hash (Basic alphanumeric check)
    if (!/^[a-zA-Z0-9-_]+$/.test(newHash)) {
        return { success: false, error: 'Invalid link code. Use letters, numbers, hyphens, or underscores.' };
    }

    // 3. Update Organization
    const { error } = await supabase
      .from('organizations')
      .update({ invite_hash: newHash })
      .eq('id', requesterProfile.org_id);

    if (error) throw error;

    revalidatePath('/org/team');
    return { success: true };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateUserRole(userId: string, newRole: 'org_admin' | 'user'): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    
    // 1. Auth & Admin Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('org_id, role')
      .eq('id', user.id)
      .single();

    if (requesterProfile?.role !== 'org_admin') {
      return { success: false, error: 'Only admins can manage user roles' };
    }

    // 2. Verify target user is in same org
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', userId)
      .single();

    if (targetProfile?.org_id !== requesterProfile.org_id) {
        return { success: false, error: 'User not in your organization' };
    }

    // 3. Update Role
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) throw error;

    revalidatePath('/org/team');
    return { success: true };

  } catch (error: any) {
    console.error('updateUserRole error:', error);
    return { success: false, error: error.message };
  }
}
