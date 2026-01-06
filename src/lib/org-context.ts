import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const PLATFORM_ADMIN_ORG_COOKIE = 'platform_admin_selected_org';

/**
 * Creates a personal organization for a platform admin who doesn't have one.
 * This is called automatically by getOrgContext when needed.
 * Uses admin client to bypass RLS since organizations table has no INSERT policy.
 */
async function createPlatformAdminOrg(
  userId: string,
  fullName: string | null,
  email: string | null
): Promise<{ orgId: string; orgName: string } | null> {
  try {
    // Use admin client to bypass RLS (organizations table has no INSERT policy for regular users)
    const adminClient = createAdminClient();

    const baseName = fullName || email?.split('@')[0] || 'Admin';
    const orgName = `${baseName}'s Organization`;
    const slug = baseName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const uniqueSlug = `${slug}-${Date.now().toString(36)}`;
    const inviteHash = Math.random().toString(36).substring(2, 18);

    const { data: newOrg, error: orgError } = await adminClient
      .from('organizations')
      .insert({
        name: orgName,
        slug: uniqueSlug,
        invite_hash: inviteHash,
        owner_id: userId,
      })
      .select()
      .single();

    if (orgError) {
      console.error('[createPlatformAdminOrg] Error creating organization:', orgError);
      return null;
    }

    // Update profile with the new org_id
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ org_id: newOrg.id, membership_status: 'org_admin' })
      .eq('id', userId);

    if (updateError) {
      console.error('[createPlatformAdminOrg] Error linking profile to organization:', updateError);
      return null;
    }

    console.log(`[createPlatformAdminOrg] Created personal org for platform admin: ${newOrg.name}`);

    revalidatePath('/dashboard');
    revalidatePath('/org');

    return { orgId: newOrg.id, orgName: newOrg.name };
  } catch (error) {
    console.error('[createPlatformAdminOrg] Exception:', error);
    return null;
  }
}

export interface OrgContext {
  orgId: string;
  orgName: string;
  isPlatformAdmin: boolean;
  isOrgAdmin: boolean;
  isOrgOwner: boolean;
  userRole: string;
  membershipStatus: string;
}

/**
 * Gets the effective organization context for the current user.
 * - For regular users: Returns their org_id from their profile
 * - For platform admins: Returns a selected org (from cookie) or defaults to first available org
 *
 * This allows platform admins to seamlessly test and manage any organization.
 */
export async function getOrgContext(): Promise<OrgContext | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, role, membership_status, full_name, organizations(id, name)')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return null;
  }

  const isPlatformAdmin = profile.role === 'admin';

  // For regular users, use their org_id
  if (!isPlatformAdmin) {
    if (!profile.org_id) {
      return null;
    }

    const orgData = Array.isArray(profile.organizations) ? profile.organizations[0] : profile.organizations;

    return {
      orgId: profile.org_id,
      orgName: orgData?.name || 'Organization',
      isPlatformAdmin: false,
      isOrgAdmin: profile.membership_status === 'org_admin' || profile.role === 'org_admin',
      isOrgOwner: false, // Would need separate lookup if needed
      userRole: profile.role || 'user',
      membershipStatus: profile.membership_status || 'active',
    };
  }

  // For platform admins, check for selected org in cookie or use their org_id or default to first org
  const cookieStore = await cookies();
  const selectedOrgId = cookieStore.get(PLATFORM_ADMIN_ORG_COOKIE)?.value;

  console.log('[getOrgContext] Platform admin flow - selectedOrgId:', selectedOrgId, 'profile.org_id:', profile.org_id);

  let effectiveOrgId: string | null = null;
  let orgData: { id: string; name: string } | null = null;

  // Priority 1: Check cookie for selected org
  if (selectedOrgId) {
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', selectedOrgId)
      .single();

    console.log('[getOrgContext] Cookie org lookup result:', org, 'error:', orgError);

    if (org) {
      effectiveOrgId = org.id;
      orgData = org;
    }
  }

  // Priority 2: Check profile.org_id or auto-create personal org
  if (!effectiveOrgId) {
    if (profile.org_id) {
      // Platform admin has an org_id, use it
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('id', profile.org_id)
        .single();

      console.log('[getOrgContext] Profile org lookup result:', org, 'error:', orgError);

      if (org) {
        effectiveOrgId = org.id;
        orgData = org;
      }
    } else {
      // Platform admin has no org_id - auto-create a personal organization
      console.log('[getOrgContext] Platform admin has no org, auto-creating personal organization...');
      const newOrg = await createPlatformAdminOrg(user.id, profile.full_name, user.email || null);

      if (newOrg) {
        effectiveOrgId = newOrg.orgId;
        orgData = { id: newOrg.orgId, name: newOrg.orgName };
        console.log('[getOrgContext] Auto-created org:', newOrg.orgName);
      }
    }
  }

  // Priority 3: Default to first org in the system (fallback if auto-create failed)
  if (!effectiveOrgId) {
    console.log('[getOrgContext] No effective org from cookie, profile, or auto-create, fetching first org...');
    const { data: firstOrg, error: firstOrgError } = await supabase
      .from('organizations')
      .select('id, name')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    console.log('[getOrgContext] First org result:', firstOrg, 'error:', firstOrgError);

    if (firstOrg) {
      effectiveOrgId = firstOrg.id;
      orgData = firstOrg;
    }
  }

  if (!effectiveOrgId || !orgData) {
    // No orgs exist in the system
    console.log('[getOrgContext] No org found anywhere, returning null');
    return null;
  }

  console.log('[getOrgContext] Success - returning org:', effectiveOrgId, orgData.name);

  return {
    orgId: effectiveOrgId,
    orgName: orgData.name,
    isPlatformAdmin: true,
    isOrgAdmin: true, // Platform admins have org_admin privileges
    isOrgOwner: true, // Platform admins have owner privileges
    userRole: 'admin',
    membershipStatus: 'org_admin',
  };
}

/**
 * Gets all organizations (for platform admin org selector)
 */
export async function getAllOrganizations(): Promise<{ id: string; name: string; slug: string; memberCount: number }[]> {
  const supabase = await createClient();

  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .order('name', { ascending: true });

  if (!orgs) {
    return [];
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

  return orgsWithCounts;
}
