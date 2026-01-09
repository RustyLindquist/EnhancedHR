'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { getOrgContext } from '@/lib/org-context';
import { getBaseUrl } from '@/lib/url';

const PLATFORM_ADMIN_ORG_COOKIE = 'platform_admin_selected_org';

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

/**
 * Creates a personal organization for a platform admin who doesn't have one.
 * This ensures platform admins can always test org functionality.
 */
export async function ensurePlatformAdminOrg(): Promise<{ success: boolean; orgId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, org_id, full_name')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Only platform admins can use this function' };
    }

    // If they already have an org, just return it
    if (profile.org_id) {
      return { success: true, orgId: profile.org_id };
    }

    // Create a personal organization for this platform admin
    const baseName = profile.full_name || user.email?.split('@')[0] || 'Admin';
    const orgName = `${baseName}'s Organization`;
    const slug = baseName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const uniqueSlug = `${slug}-${Date.now().toString(36)}`;
    const inviteHash = Math.random().toString(36).substring(2, 18);

    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: orgName,
        slug: uniqueSlug,
        invite_hash: inviteHash,
      })
      .select()
      .single();

    if (orgError) {
      console.error('Error creating organization:', orgError);
      return { success: false, error: 'Failed to create organization' };
    }

    // Update profile with the new org_id
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ org_id: newOrg.id, membership_status: 'org_admin' })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error linking profile to organization:', updateError);
      return { success: false, error: 'Failed to link profile to organization' };
    }

    console.log(`Created personal org for platform admin: ${newOrg.name}`);

    revalidatePath('/dashboard');
    revalidatePath('/org');

    return { success: true, orgId: newOrg.id };

  } catch (error: any) {
    console.error('ensurePlatformAdminOrg error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Platform admin action to switch the organization they're viewing/managing.
 * This sets a cookie that persists the selection across page loads.
 */
export async function switchPlatformAdminOrg(orgId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify user is a platform admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return { success: false, error: 'Only platform admins can switch organizations' };
    }

    // Verify the org exists
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', orgId)
      .single();

    if (!org) {
      return { success: false, error: 'Organization not found' };
    }

    // Set the cookie
    const cookieStore = await cookies();
    cookieStore.set(PLATFORM_ADMIN_ORG_COOKIE, orgId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    revalidatePath('/org');
    revalidatePath('/dashboard');
    return { success: true };

  } catch (error: any) {
    console.error('switchPlatformAdminOrg error:', error);
    return { success: false, error: error.message };
  }
}

export async function getOrgMembers(): Promise<{ members: OrgMember[], inviteInfo: InviteInfo | null, error?: string }> {
  try {
    console.log('[getOrgMembers] Starting...');
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    console.log('[getOrgMembers] User:', user?.id, 'error:', userError?.message);

    if (!user) {
        console.log('[getOrgMembers] No user, returning Unauthorized');
        return { members: [], inviteInfo: null, error: 'Unauthorized' };
    }

    // Use org context to get the effective org ID (handles platform admin org selection)
    console.log('[getOrgMembers] Calling getOrgContext...');
    const orgContext = await getOrgContext();

    console.log('[getOrgMembers] OrgContext result:', orgContext);

    if (!orgContext) {
        console.log('[getOrgMembers] No org context, returning error');
        return { members: [], inviteInfo: null, error: 'No Organization Found' };
    }

    const effectiveOrgId = orgContext.orgId;

    // Get organization details
    const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', effectiveOrgId)
        .single();

    const ownerId = orgData?.owner_id;

    // 2. Fetch Members (use admin client to bypass RLS - profiles table only allows users to see their own profile)
    // Auth is already verified above via getOrgContext which checks isPlatformAdmin or isOrgAdmin
    const adminClient = createAdminClient();
    const { data: members, error: membersError } = await adminClient
        .from('profiles')
        .select('*')
        .eq('org_id', effectiveOrgId)
        .order('created_at', { ascending: false });

    if (membersError) {
        console.error('Error fetching org members:', membersError);
        return { members: [], inviteInfo: null, error: 'Failed to fetch members' };
    }

    // 3. Fetch Metrics for these members (use admin client to bypass RLS for org-wide analytics)
    const memberIds = members.map(m => m.id);

    // 3a. User Progress (Time Spent & Completed)
    // Note: This is an approximation. Ideally we'd group by user_id in SQL, but for now we fetch raw or use RPC.
    // Fetching raw for small orgs is fine.
    const { data: progressData } = await adminClient
        .from('user_progress')
        .select('user_id, view_time_seconds, is_completed, last_accessed')
        .in('user_id', memberIds);

    // 3b. Conversations Count
    const { data: conversationData } = await adminClient
        .from('conversations')
        .select('user_id')
        .in('user_id', memberIds);

    // 3c. Credits Ledger
    const { data: creditsData } = await adminClient
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
    let inviteInfo: InviteInfo | null = null;

    if (orgData && orgData.slug && orgData.invite_hash) {
        const baseUrl = await getBaseUrl();
        inviteInfo = {
            inviteUrl: `${baseUrl}/${orgData.slug}/${orgData.invite_hash}`,
            orgSlug: orgData.slug
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Use org context to get the effective org ID (handles platform admin org selection)
    const orgContext = await getOrgContext();

    if (!orgContext) {
      return { success: false, error: 'You must be a member of an organization' };
    }

    if (!orgContext.isPlatformAdmin && !orgContext.isOrgAdmin) {
      return { success: false, error: 'Only admins can manage members' };
    }

    // Verify target user is in the selected org
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', userId)
      .single();

    if (targetProfile?.org_id !== orgContext.orgId) {
      return { success: false, error: 'User not in this organization' };
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

    // Use org context to get the effective org ID (handles platform admin org selection)
    const orgContext = await getOrgContext();

    if (!orgContext) {
      return { success: false, error: 'You must be a member of an organization to manage invite settings' };
    }

    if (!orgContext.isPlatformAdmin && !orgContext.isOrgAdmin) {
      return { success: false, error: 'Only admins can manage invite settings' };
    }

    // 2. Validate Hash (Basic alphanumeric check)
    if (!/^[a-zA-Z0-9-_]+$/.test(newHash)) {
        return { success: false, error: 'Invalid link code. Use letters, numbers, hyphens, or underscores.' };
    }

    // 3. Update Organization (use admin client to bypass RLS - auth already verified above)
    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from('organizations')
      .update({ invite_hash: newHash })
      .eq('id', orgContext.orgId);

    if (error) throw error;

    revalidatePath('/org/team');
    return { success: true };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Gets org context and all organizations for the org selector UI.
 * Returns data needed for platform admins to switch between orgs.
 */
export async function getOrgSelectorData(): Promise<{
  isPlatformAdmin: boolean;
  currentOrgId: string | null;
  currentOrgName: string | null;
  organizations: { id: string; name: string; slug: string; memberCount: number }[];
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { isPlatformAdmin: false, currentOrgId: null, currentOrgName: null, organizations: [] };
    }

    // Get user's profile to check if they're a platform admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isPlatformAdmin = profile?.role === 'admin';

    if (!isPlatformAdmin) {
      return { isPlatformAdmin: false, currentOrgId: null, currentOrgName: null, organizations: [] };
    }

    // Get org context for current selection
    const orgContext = await getOrgContext();

    // Get all organizations for the selector
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .order('name', { ascending: true });

    if (!orgs) {
      return {
        isPlatformAdmin: true,
        currentOrgId: orgContext?.orgId || null,
        currentOrgName: orgContext?.orgName || null,
        organizations: []
      };
    }

    // Get member counts for each org
    const orgsWithCounts = await Promise.all(
      orgs.map(async (org) => {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', org.id);

        return {
          ...org,
          memberCount: count || 0,
        };
      })
    );

    return {
      isPlatformAdmin: true,
      currentOrgId: orgContext?.orgId || null,
      currentOrgName: orgContext?.orgName || null,
      organizations: orgsWithCounts
    };

  } catch (error: any) {
    console.error('getOrgSelectorData error:', error);
    return { isPlatformAdmin: false, currentOrgId: null, currentOrgName: null, organizations: [] };
  }
}

/**
 * Check if the current user is an org admin or platform admin.
 * Used for determining UI permissions.
 */
export async function checkIsOrgAdmin(): Promise<boolean> {
  'use server';
  try {
    const orgContext = await getOrgContext();
    return orgContext?.isOrgAdmin || orgContext?.isPlatformAdmin || false;
  } catch (error) {
    console.error('checkIsOrgAdmin error:', error);
    return false;
  }
}

/**
 * Gets the count of members in the current user's organization.
 * Used for displaying the count badge in the navigation panel.
 */
export async function getOrgMemberCount(): Promise<number> {
  try {
    const orgContext = await getOrgContext();

    if (!orgContext?.orgId) {
      return 0;
    }

    const adminClient = createAdminClient();
    const { count, error } = await adminClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgContext.orgId);

    if (error) {
      console.error('getOrgMemberCount error:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('getOrgMemberCount exception:', error);
    return 0;
  }
}

/**
 * Fetch org collections for the current user's organization.
 * Returns collections visible to the user based on their role:
 * - Org admins can see all org collections
 * - Employees can see org collections they're assigned to or that are public
 */
export interface OrgCollection {
  id: string;
  label: string;
  color: string;
  is_required: boolean;
  due_date: string | null;
  item_count: number;
}

export async function getOrgCollections(): Promise<OrgCollection[]> {
  try {
    console.log('[getOrgCollections] Starting');
    const orgContext = await getOrgContext();
    console.log('[getOrgCollections] orgContext:', orgContext);

    if (!orgContext?.orgId) {
      console.log('[getOrgCollections] No orgId, returning empty');
      return [];
    }

    const adminClient = createAdminClient();

    // Fetch org collections with item counts
    console.log('[getOrgCollections] Querying for org:', orgContext.orgId);
    const { data: collections, error } = await adminClient
      .from('user_collections')
      .select(`
        id,
        label,
        color,
        collection_items(count)
      `)
      .eq('org_id', orgContext.orgId)
      .eq('is_org_collection', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getOrgCollections] Query error:', error);
      return [];
    }

    console.log('[getOrgCollections] Found collections:', collections);

    return (collections || []).map(col => ({
      id: col.id,
      label: col.label,
      color: col.color || '#64748B',
      is_required: false,
      due_date: null,
      item_count: (col.collection_items as any)?.[0]?.count || 0
    }));
  } catch (error) {
    console.error('[getOrgCollections] Exception:', error);
    return [];
  }
}

/**
 * Fetch items in an org collection.
 * Returns the collection items that can be displayed in the UI.
 */
export async function getOrgCollectionItems(collectionId: string): Promise<{
  items: any[];
  collectionName: string;
  isOrgAdmin: boolean;
  orgId: string | null;
}> {
  try {
    const orgContext = await getOrgContext();

    if (!orgContext?.orgId) {
      return { items: [], collectionName: '', isOrgAdmin: false, orgId: null };
    }

    const adminClient = createAdminClient();

    // First verify this collection belongs to the user's org
    const { data: collection, error: colError } = await adminClient
      .from('user_collections')
      .select('id, label, org_id, is_org_collection')
      .eq('id', collectionId)
      .eq('org_id', orgContext.orgId)
      .eq('is_org_collection', true)
      .single();

    if (colError || !collection) {
      console.error('Collection not found or not in org:', colError);
      return { items: [], collectionName: '', isOrgAdmin: false, orgId: null };
    }

    // Fetch collection items (courses)
    const { data: courseItems, error: courseError } = await adminClient
      .from('collection_items')
      .select(`
        id,
        collection_id,
        course_id,
        item_id,
        item_type,
        created_at
      `)
      .eq('collection_id', collectionId);

    if (courseError) {
      console.error('Error fetching collection items:', courseError);
      return { items: [], collectionName: collection.label, isOrgAdmin: orgContext.isOrgAdmin || false, orgId: orgContext.orgId };
    }

    // Fetch course details for items
    const courseIds = (courseItems || [])
      .filter(item => item.course_id)
      .map(item => item.course_id);

    let courses: any[] = [];
    if (courseIds.length > 0) {
      const { data: courseData } = await adminClient
        .from('courses')
        .select('*')
        .in('id', courseIds);
      courses = courseData || [];
    }

    // Fetch context items if any (exclude notes - handled separately)
    const contextItemIds = (courseItems || [])
      .filter(item => item.item_type && item.item_id && !item.course_id && item.item_type !== 'NOTE')
      .map(item => item.item_id);

    let contextItems: any[] = [];
    if (contextItemIds.length > 0) {
      const { data: contextData } = await adminClient
        .from('user_context_items')
        .select('*')
        .in('id', contextItemIds);
      contextItems = contextData || [];
    }

    // Fetch notes if any
    const noteItemIds = (courseItems || [])
      .filter(item => item.item_type === 'NOTE' && item.item_id)
      .map(item => item.item_id);

    let noteItems: any[] = [];
    if (noteItemIds.length > 0) {
      const { data: noteData } = await adminClient
        .from('notes')
        .select('*')
        .in('id', noteItemIds);
      noteItems = noteData || [];
    }

    // Map to display format
    const mappedItems = (courseItems || []).map(item => {
      if (item.course_id) {
        const course = courses.find(c => c.id === item.course_id);
        if (course) {
          return {
            id: course.id,
            itemType: 'COURSE',
            title: course.title,
            description: course.description,
            image: course.image,
            author: course.author,
            duration: course.duration,
            rating: course.rating,
            category: course.category,
            badges: course.badges,
            ...course
          };
        }
      } else if (item.item_type === 'NOTE' && item.item_id) {
        // Handle NOTE items
        const noteItem = noteItems.find(n => n.id === item.item_id);
        if (noteItem) {
          return {
            id: noteItem.id,
            itemType: 'NOTE',
            title: noteItem.title,
            content: noteItem.content,
            created_at: noteItem.created_at,
            updated_at: noteItem.updated_at
          };
        }
      } else if (item.item_type && item.item_id) {
        // Handle other context items
        const contextItem = contextItems.find(c => c.id === item.item_id);
        if (contextItem) {
          return {
            id: contextItem.id,
            itemType: contextItem.type,
            title: contextItem.title,
            content: contextItem.content,
            ...contextItem
          };
        }
      }
      return null;
    }).filter(Boolean);

    return {
      items: mappedItems,
      collectionName: collection.label,
      isOrgAdmin: orgContext.isOrgAdmin || orgContext.isPlatformAdmin || false,
      orgId: orgContext.orgId
    };
  } catch (error) {
    console.error('getOrgCollectionItems exception:', error);
    return { items: [], collectionName: '', isOrgAdmin: false, orgId: null };
  }
}

/**
 * Create a new org collection.
 * Only org admins can create org collections.
 */
export async function createOrgCollection(name: string, color: string): Promise<{ success: boolean; collectionId?: string; error?: string }> {
  try {
    console.log('[createOrgCollection] Starting with name:', name, 'color:', color);
    const orgContext = await getOrgContext();
    console.log('[createOrgCollection] orgContext:', orgContext);

    if (!orgContext?.orgId) {
      console.log('[createOrgCollection] No orgId found');
      return { success: false, error: 'You must be part of an organization' };
    }

    if (!orgContext.isOrgAdmin && !orgContext.isPlatformAdmin) {
      console.log('[createOrgCollection] User is not org admin');
      return { success: false, error: 'Only org admins can create company collections' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('[createOrgCollection] No user found');
      return { success: false, error: 'Unauthorized' };
    }

    console.log('[createOrgCollection] Creating collection for user:', user.id, 'org:', orgContext.orgId);

    // Create the org collection
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('user_collections')
      .insert({
        user_id: user.id, // Creator (for tracking)
        org_id: orgContext.orgId,
        label: name,
        color: color,
        is_custom: true,
        is_org_collection: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[createOrgCollection] Insert error:', error);
      return { success: false, error: 'Failed to create collection' };
    }

    console.log('[createOrgCollection] Created collection:', data);
    revalidatePath('/dashboard');
    return { success: true, collectionId: data.id };
  } catch (error: any) {
    console.error('[createOrgCollection] Exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Rename an org collection.
 * Only org admins can rename org collections.
 */
export async function renameOrgCollection(collectionId: string, newName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const orgContext = await getOrgContext();

    if (!orgContext?.orgId) {
      return { success: false, error: 'You must be part of an organization' };
    }

    if (!orgContext.isOrgAdmin && !orgContext.isPlatformAdmin) {
      return { success: false, error: 'Only org admins can rename company collections' };
    }

    const adminClient = createAdminClient();

    // Verify the collection belongs to this org
    const { data: collection, error: fetchError } = await adminClient
      .from('user_collections')
      .select('id, org_id, is_org_collection')
      .eq('id', collectionId)
      .single();

    if (fetchError || !collection) {
      return { success: false, error: 'Collection not found' };
    }

    if (collection.org_id !== orgContext.orgId || !collection.is_org_collection) {
      return { success: false, error: 'Cannot rename this collection' };
    }

    // Update the name
    const { error: updateError } = await adminClient
      .from('user_collections')
      .update({ label: newName })
      .eq('id', collectionId);

    if (updateError) {
      console.error('renameOrgCollection error:', updateError);
      return { success: false, error: 'Failed to rename collection' };
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('renameOrgCollection exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete an org collection.
 * Only org admins can delete org collections.
 * This will also delete all items in the collection.
 */
export async function deleteOrgCollection(collectionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const orgContext = await getOrgContext();

    if (!orgContext?.orgId) {
      return { success: false, error: 'You must be part of an organization' };
    }

    if (!orgContext.isOrgAdmin && !orgContext.isPlatformAdmin) {
      return { success: false, error: 'Only org admins can delete company collections' };
    }

    const adminClient = createAdminClient();

    // Verify the collection belongs to this org
    const { data: collection, error: fetchError } = await adminClient
      .from('user_collections')
      .select('id, org_id, is_org_collection')
      .eq('id', collectionId)
      .single();

    if (fetchError || !collection) {
      return { success: false, error: 'Collection not found' };
    }

    if (collection.org_id !== orgContext.orgId || !collection.is_org_collection) {
      return { success: false, error: 'Cannot delete this collection' };
    }

    // Delete collection items first
    const { error: itemsError } = await adminClient
      .from('collection_items')
      .delete()
      .eq('collection_id', collectionId);

    if (itemsError) {
      console.error('deleteOrgCollection items error:', itemsError);
      return { success: false, error: 'Failed to delete collection items' };
    }

    // Delete the collection
    const { error: deleteError } = await adminClient
      .from('user_collections')
      .delete()
      .eq('id', collectionId);

    if (deleteError) {
      console.error('deleteOrgCollection error:', deleteError);
      return { success: false, error: 'Failed to delete collection' };
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('deleteOrgCollection exception:', error);
    return { success: false, error: error.message };
  }
}

export async function updateUserRole(userId: string, newRole: 'org_admin' | 'user'): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Use org context to get the effective org ID (handles platform admin org selection)
    const orgContext = await getOrgContext();

    if (!orgContext) {
      return { success: false, error: 'You must be a member of an organization' };
    }

    if (!orgContext.isPlatformAdmin && !orgContext.isOrgAdmin) {
      return { success: false, error: 'Only admins can manage user roles' };
    }

    // Verify target user is in the selected org
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', userId)
      .single();

    if (targetProfile?.org_id !== orgContext.orgId) {
      return { success: false, error: 'User not in this organization' };
    }

    // Update Role - for org_admin, we update membership_status, not role
    // (role field is for platform-wide roles like 'admin', membership_status is for org roles)
    const { error } = await supabase
      .from('profiles')
      .update({ membership_status: newRole })
      .eq('id', userId);

    if (error) throw error;

    revalidatePath('/org/team');
    return { success: true };

  } catch (error: any) {
    console.error('updateUserRole error:', error);
    return { success: false, error: error.message };
  }
}
