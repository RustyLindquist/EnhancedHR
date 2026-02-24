'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

// --- Types ---

export interface OrgListItem {
  id: string;
  name: string;
  slug: string;
  account_type: string;
  owner_id: string | null;
  owner_name: string | null;
  admin_count: number;
  employee_count: number;
  created_at: string;
}

// --- Helpers ---

async function requirePlatformAdmin(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    throw new Error('Unauthorized: Platform admin required');
  }
  return user.id;
}

// --- Actions ---

export async function fetchAllOrgs(): Promise<OrgListItem[]> {
  await requirePlatformAdmin();
  const admin = createAdminClient();

  // Fetch all organizations
  const { data: orgs, error } = await admin
    .from('organizations')
    .select('id, name, slug, account_type, owner_id, created_at')
    .order('created_at', { ascending: false });

  if (error || !orgs) {
    console.error('[fetchAllOrgs] Error:', error);
    return [];
  }

  // Fetch member counts grouped by org + status
  const { data: members } = await admin
    .from('profiles')
    .select('org_id, membership_status')
    .not('org_id', 'is', null);

  // Fetch owner profiles for display names
  const ownerIds = orgs.map(o => o.owner_id).filter(Boolean) as string[];
  const { data: ownerProfiles } = ownerIds.length > 0
    ? await admin
        .from('profiles')
        .select('id, full_name')
        .in('id', ownerIds)
    : { data: [] };

  // Build count maps
  const adminCounts: Record<string, number> = {};
  const employeeCounts: Record<string, number> = {};
  members?.forEach((m: any) => {
    if (!m.org_id) return;
    if (m.membership_status === 'org_admin') {
      adminCounts[m.org_id] = (adminCounts[m.org_id] || 0) + 1;
    } else if (m.membership_status === 'employee') {
      employeeCounts[m.org_id] = (employeeCounts[m.org_id] || 0) + 1;
    }
  });

  // Build owner lookup
  const ownerMap: Record<string, { name: string | null }> = {};
  ownerProfiles?.forEach((p: any) => {
    ownerMap[p.id] = { name: p.full_name };
  });

  return orgs.map(org => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    account_type: org.account_type,
    owner_id: org.owner_id,
    owner_name: org.owner_id ? (ownerMap[org.owner_id]?.name || null) : null,
    admin_count: adminCounts[org.id] || 0,
    employee_count: employeeCounts[org.id] || 0,
    created_at: org.created_at,
  }));
}

export interface OrgDetail {
  id: string;
  name: string;
  slug: string;
  invite_hash: string;
  account_type: string;
  owner_id: string | null;
  created_at: string;
}

export async function fetchOrgById(orgId: string): Promise<OrgDetail | null> {
  await requirePlatformAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('organizations')
    .select('id, name, slug, invite_hash, account_type, owner_id, created_at')
    .eq('id', orgId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function updateOrgAccountType(orgId: string, accountType: string): Promise<void> {
  await requirePlatformAdmin();

  if (!['trial', 'paid'].includes(accountType)) {
    throw new Error('Invalid account type');
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from('organizations')
    .update({ account_type: accountType })
    .eq('id', orgId);

  if (error) {
    throw new Error(`Failed to update account type: ${error.message}`);
  }
}

export async function deleteOrganization(orgId: string): Promise<void> {
  await requirePlatformAdmin();
  const admin = createAdminClient();

  // Reset all member profiles
  const { error: profileError } = await admin
    .from('profiles')
    .update({ org_id: null, membership_status: 'trial' })
    .eq('org_id', orgId);

  if (profileError) {
    throw new Error(`Failed to reset member profiles: ${profileError.message}`);
  }

  // Delete the organization
  const { error: deleteError } = await admin
    .from('organizations')
    .delete()
    .eq('id', orgId);

  if (deleteError) {
    throw new Error(`Failed to delete organization: ${deleteError.message}`);
  }
}

export async function fetchUsersWithoutOrg(): Promise<{ id: string; full_name: string | null; email: string }[]> {
  await requirePlatformAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('profiles')
    .select('id, full_name')
    .is('org_id', null)
    .neq('role', 'admin')
    .order('full_name', { ascending: true });

  if (error || !data) return [];

  // Get emails from auth.users
  const { data: authData } = await admin.auth.admin.listUsers();
  const emailMap: Record<string, string> = {};
  authData?.users?.forEach((u: any) => {
    emailMap[u.id] = u.email || '';
  });

  return data.map(p => ({
    id: p.id,
    full_name: p.full_name,
    email: emailMap[p.id] || '',
  }));
}

export async function createOrganization(input: {
  name: string;
  account_type: string;
  owner_id: string;
}): Promise<{ success: boolean; orgId?: string; error?: string }> {
  await requirePlatformAdmin();

  if (!['trial', 'paid'].includes(input.account_type)) {
    return { success: false, error: 'Invalid account type' };
  }

  const admin = createAdminClient();

  // Validate owner has no existing org
  const { data: ownerProfile } = await admin
    .from('profiles')
    .select('org_id')
    .eq('id', input.owner_id)
    .single();

  if (ownerProfile?.org_id) {
    return { success: false, error: 'Selected user already belongs to an organization' };
  }

  // Generate slug and invite hash
  const slug = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
  const inviteHash = crypto.randomUUID().replace(/-/g, '').substring(0, 16);

  // Create org
  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({
      name: input.name,
      slug,
      invite_hash: inviteHash,
      account_type: input.account_type,
      owner_id: input.owner_id,
    })
    .select('id')
    .single();

  if (orgError || !org) {
    return { success: false, error: orgError?.message || 'Failed to create organization' };
  }

  // Update owner profile
  const { error: profileError } = await admin
    .from('profiles')
    .update({ org_id: org.id, membership_status: 'org_admin' })
    .eq('id', input.owner_id);

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  return { success: true, orgId: org.id };
}

export async function transferOrgOwnership(orgId: string, newOwnerId: string): Promise<void> {
  await requirePlatformAdmin();
  const admin = createAdminClient();

  // Get current owner
  const { data: org } = await admin
    .from('organizations')
    .select('owner_id')
    .eq('id', orgId)
    .single();

  // Validate new owner is a member of this org
  const { data: newOwnerProfile } = await admin
    .from('profiles')
    .select('org_id')
    .eq('id', newOwnerId)
    .single();

  if (newOwnerProfile?.org_id !== orgId) {
    throw new Error('New owner must be a member of the organization');
  }

  // Update org owner
  const { error: ownerError } = await admin
    .from('organizations')
    .update({ owner_id: newOwnerId })
    .eq('id', orgId);

  if (ownerError) {
    throw new Error(`Failed to transfer ownership: ${ownerError.message}`);
  }

  // Set new owner as org_admin
  await admin
    .from('profiles')
    .update({ membership_status: 'org_admin' })
    .eq('id', newOwnerId);

  // Demote old owner to org_admin (they keep access but lose ownership)
  if (org?.owner_id && org.owner_id !== newOwnerId) {
    await admin
      .from('profiles')
      .update({ membership_status: 'org_admin' })
      .eq('id', org.owner_id);
  }
}

export async function fetchOrgMembers(orgId: string): Promise<{ id: string; full_name: string | null; email: string }[]> {
  await requirePlatformAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('profiles')
    .select('id, full_name')
    .eq('org_id', orgId)
    .order('full_name', { ascending: true });

  if (error || !data) return [];

  // Get emails from auth.users
  const { data: authData } = await admin.auth.admin.listUsers();
  const emailMap: Record<string, string> = {};
  authData?.users?.forEach((u: any) => {
    emailMap[u.id] = u.email || '';
  });

  return data.map(p => ({
    id: p.id,
    full_name: p.full_name,
    email: emailMap[p.id] || '',
  }));
}
