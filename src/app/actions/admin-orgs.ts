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
  owner_email: string | null;
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
    owner_email: null,
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
  const admin = createAdminClient();

  await admin
    .from('organizations')
    .update({ account_type: accountType })
    .eq('id', orgId);
}

export async function deleteOrganization(orgId: string): Promise<void> {
  await requirePlatformAdmin();
  const admin = createAdminClient();

  // Reset all member profiles
  await admin
    .from('profiles')
    .update({ org_id: null, membership_status: 'trial' })
    .eq('org_id', orgId);

  // Delete the organization
  await admin
    .from('organizations')
    .delete()
    .eq('id', orgId);
}
