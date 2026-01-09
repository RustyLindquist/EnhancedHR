'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  lastSignIn: string | null;
  createdAt: string;
  // Extended fields for edit panel
  authorStatus: 'none' | 'pending' | 'approved' | 'rejected';
  membershipStatus: string;
  orgId: string | null;
  orgName: string | null;
  isOrgOwner: boolean;
  billingDisabled: boolean;
}

import { Pool } from 'pg';

export async function getUsers(): Promise<AdminUser[]> {
  const supabase = createAdminClient();
  
  // Fetch Auth Users
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.warn('Supabase Admin API failed, attempting direct DB fallback...', error);
    try {
        return await getUsersDirect();
    } catch (dbError) {
         console.error('Error fetching users (API + DB):', dbError);
         throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  // Fetch Profiles with organization info
  const { data: profiles } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      role,
      author_status,
      membership_status,
      org_id,
      billing_disabled,
      organizations:org_id (
        id,
        name,
        owner_id
      )
    `);

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  return data.users.map(user => {
    const profile = profileMap.get(user.id);
    // Handle Supabase join which can return array or single object
    const orgData = profile?.organizations;
    const org = (Array.isArray(orgData) ? orgData[0] : orgData) as { id: string; name: string; owner_id: string | null } | null | undefined;

    return {
      id: user.id,
      email: user.email || '',
      fullName: profile?.full_name || user.user_metadata?.full_name || 'N/A',
      role: profile?.role || user.user_metadata?.role || 'user',
      lastSignIn: user.last_sign_in_at || null,
      createdAt: user.created_at,
      // Extended fields
      authorStatus: (profile?.author_status as AdminUser['authorStatus']) || 'none',
      membershipStatus: profile?.membership_status || 'trial',
      orgId: profile?.org_id || null,
      orgName: org?.name || null,
      isOrgOwner: org?.owner_id === user.id,
      billingDisabled: profile?.billing_disabled || false
    };
  });
}

async function getUsersDirect(): Promise<AdminUser[]> {
    // Fallback connection string for local dev if env var missing
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

    // Create a new pool for this request (safe for server actions, though caching pool globally is better for high load)
    const pool = new Pool({ connectionString, connectionTimeoutMillis: 5000 }); // 5s timeout

    try {
        const client = await pool.connect();
        // Join auth.users with profiles and organizations to get complete data
        const query = `
            SELECT
                au.id,
                au.email,
                au.created_at,
                au.last_sign_in_at,
                au.raw_user_meta_data,
                p.full_name as profile_name,
                p.role as profile_role,
                p.author_status,
                p.membership_status,
                p.org_id,
                p.billing_disabled,
                o.name as org_name,
                o.owner_id as org_owner_id
            FROM auth.users au
            LEFT JOIN public.profiles p ON au.id = p.id
            LEFT JOIN public.organizations o ON p.org_id = o.id
            ORDER BY au.created_at DESC
        `;
        const res = await client.query(query);
        client.release();
        await pool.end();

        return res.rows.map(row => ({
            id: row.id,
            email: row.email,
            // Prioritize Profile name/role, fallback to metadata or defaults
            fullName: row.profile_name || row.raw_user_meta_data?.full_name || 'N/A',
            role: row.profile_role || row.raw_user_meta_data?.role || 'user',
            lastSignIn: row.last_sign_in_at ? new Date(row.last_sign_in_at).toISOString() : null,
            createdAt: new Date(row.created_at).toISOString(),
            // Extended fields
            authorStatus: (row.author_status as AdminUser['authorStatus']) || 'none',
            membershipStatus: row.membership_status || 'trial',
            orgId: row.org_id || null,
            orgName: row.org_name || null,
            isOrgOwner: row.org_owner_id === row.id,
            billingDisabled: row.billing_disabled || false
        }));
    } catch (e) {
        await pool.end(); // Ensure pool is closed
        console.error('Direct DB fallback failed:', e);
        throw e;
    }
}

export async function promoteUser(userId: string, role: string) {
  const supabase = createAdminClient();

  // 1. Update Auth Metadata
  const { error: authError } = await supabase.auth.admin.updateUserById(
    userId,
    { user_metadata: { role } }
  );

  if (authError) {
    throw new Error(`Failed to update auth metadata: ${authError.message}`);
  }

  // 2. Update Profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);

  if (profileError) {
    throw new Error(`Failed to update profile: ${profileError.message}`);
  }

  // 3. If promoting to platform admin, ensure they have an org for testing
  if (role === 'admin') {
    await ensurePlatformAdminOrgForUser(userId);
  }

  revalidatePath('/admin/users');
  return { success: true };
}

/**
 * Creates a personal organization for a platform admin (admin client version).
 * Used when promoting a user to platform admin.
 */
async function ensurePlatformAdminOrgForUser(userId: string): Promise<void> {
  const supabase = createAdminClient();

  // Get user info
  const { data: { user } } = await supabase.auth.admin.getUserById(userId);
  if (!user) {
    console.error('[ensurePlatformAdminOrgForUser] User not found:', userId);
    return;
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, full_name')
    .eq('id', userId)
    .single();

  if (!profile) {
    console.error('[ensurePlatformAdminOrgForUser] Profile not found:', userId);
    return;
  }

  // If they already have an org, nothing to do
  if (profile.org_id) {
    console.log('[ensurePlatformAdminOrgForUser] User already has org:', profile.org_id);
    return;
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
    console.error('[ensurePlatformAdminOrgForUser] Error creating org:', orgError);
    return;
  }

  // Update profile with the new org_id
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ org_id: newOrg.id, membership_status: 'org_admin' })
    .eq('id', userId);

  if (updateError) {
    console.error('[ensurePlatformAdminOrgForUser] Error linking profile:', updateError);
    return;
  }

  console.log(`[ensurePlatformAdminOrgForUser] Created org "${newOrg.name}" for user ${userId}`);
}

export async function createUser(prevState: any, formData: FormData) {
  const supabase = createAdminClient();
  
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const role = formData.get('role') as string || 'user';

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  // 1. Create Auth User
  const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role }
  });

  if (createError) {
    return { error: createError.message };
  }

  if (!user) {
    return { error: 'Failed to create user' };
  }

  // 2. Create Profile (if not triggered by database trigger)
  // Check if profile exists first (trigger might have created it)
  const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', user.id).single();

  if (!existingProfile) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        email,
        full_name: fullName,
        role,
        avatar_url: ''
      });

      if (profileError) {
        // Cleanup auth user if profile creation fails? 
        // Or just log error. Better to keep auth user and try to fix profile.
        console.error('Error creating profile:', profileError);
        return { error: 'User created but profile creation failed: ' + profileError.message };
      }
  } else {
      // Update the profile if it was created by trigger with defaults
      await supabase.from('profiles').update({ full_name: fullName, role }).eq('id', user.id);
  }

  revalidatePath('/admin/users');
  return { success: true };
}

export async function deleteUser(userId: string) {
    const supabase = createAdminClient();

    // 1. Delete from Auth (This usually cascades to public.users/profiles if set up, but we'll try straight auth delete first)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
        console.error('Error deleting auth user:', authError);
        return { error: `Failed to delete user: ${authError.message}` };
    }

    // 2. Explicitly delete profile if cascade didn't happen (or to be sure)
    const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId);

    if (profileError) {
         console.error('Error deleting profile:', profileError);
    }

    revalidatePath('/admin/users');
    return { success: true };
}

export async function resetUserPassword(userId: string, newPassword: string) {
    const supabase = createAdminClient();

    if (!newPassword || newPassword.length < 6) {
        return { error: 'Password must be at least 6 characters' };
    }

    const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
    });

    if (error) {
        console.error('Error resetting password:', error);
        return { error: `Failed to reset password: ${error.message}` };
    }

    return { success: true };
}

// =============================================================================
// Admin Edit Panel Server Actions
// =============================================================================

import { sendTemporaryPasswordEmail } from '@/lib/email';

/**
 * Update a user's author status
 */
export async function updateAuthorStatus(
  userId: string,
  status: 'none' | 'pending' | 'approved' | 'rejected'
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('profiles')
    .update({ author_status: status })
    .eq('id', userId);

  if (error) {
    console.error('Error updating author status:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/users');
  return { success: true };
}

/**
 * Update a user's org admin status
 * Only works if user has org_id
 */
export async function updateOrgAdmin(
  userId: string,
  isOrgAdmin: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // First verify user has an org
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', userId)
    .single();

  if (!profile?.org_id) {
    return { success: false, error: 'User must be in an organization to update org admin status' };
  }

  const newStatus = isOrgAdmin ? 'org_admin' : 'employee';

  const { error } = await supabase
    .from('profiles')
    .update({ membership_status: newStatus })
    .eq('id', userId);

  if (error) {
    console.error('Error updating org admin status:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/users');
  return { success: true };
}

/**
 * Add a user to an organization
 */
export async function addUserToOrg(
  userId: string,
  orgId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('profiles')
    .update({
      org_id: orgId,
      membership_status: 'employee'
    })
    .eq('id', userId);

  if (error) {
    console.error('Error adding user to org:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/users');
  return { success: true };
}

/**
 * Remove a user from their organization
 */
export async function removeUserFromOrg(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Check if user has an active subscription to determine fallback status
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('id', userId)
    .single();

  const newStatus = profile?.stripe_subscription_id ? 'active' : 'trial';

  const { error } = await supabase
    .from('profiles')
    .update({
      org_id: null,
      membership_status: newStatus
    })
    .eq('id', userId);

  if (error) {
    console.error('Error removing user from org:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/users');
  return { success: true };
}

/**
 * Change a user's organization
 */
export async function changeUserOrg(
  userId: string,
  newOrgId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('profiles')
    .update({
      org_id: newOrgId,
      membership_status: 'employee'
    })
    .eq('id', userId);

  if (error) {
    console.error('Error changing user org:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/users');
  return { success: true };
}

/**
 * Transfer organization ownership to a new user
 * New owner must already be in the org
 */
export async function transferOrgOwnership(
  orgId: string,
  newOwnerId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Verify new owner is in the org
  const { data: newOwnerProfile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', newOwnerId)
    .single();

  if (newOwnerProfile?.org_id !== orgId) {
    return { success: false, error: 'New owner must be a member of the organization' };
  }

  // Update organization owner
  const { error: orgError } = await supabase
    .from('organizations')
    .update({ owner_id: newOwnerId })
    .eq('id', orgId);

  if (orgError) {
    console.error('Error transferring org ownership:', orgError);
    return { success: false, error: orgError.message };
  }

  // Set new owner's membership_status to org_admin
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ membership_status: 'org_admin' })
    .eq('id', newOwnerId);

  if (profileError) {
    console.error('Error updating new owner status:', profileError);
    // Don't return error - ownership was transferred, status update is secondary
  }

  revalidatePath('/admin/users');
  return { success: true };
}

/**
 * Update a user's billing disabled status
 */
export async function updateBillingDisabled(
  userId: string,
  disabled: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('profiles')
    .update({ billing_disabled: disabled })
    .eq('id', userId);

  if (error) {
    console.error('Error updating billing disabled:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/users');
  return { success: true };
}

/**
 * Generate a temporary password, update the user's password, and send email
 */
export async function emailTemporaryPassword(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Generate random secure password (12 chars, mixed case + numbers)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let tempPassword = '';
  for (let i = 0; i < 12; i++) {
    tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Get user info
  const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);

  if (userError || !user) {
    return { success: false, error: 'User not found' };
  }

  // Get profile for full name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single();

  const fullName = profile?.full_name || user.user_metadata?.full_name || 'User';

  // Update user's password
  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
    password: tempPassword
  });

  if (updateError) {
    console.error('Error setting temporary password:', updateError);
    return { success: false, error: updateError.message };
  }

  // Send email
  const emailResult = await sendTemporaryPasswordEmail(
    user.email!,
    tempPassword,
    fullName
  );

  if (!emailResult.success) {
    // Password was changed but email failed - log but still return success
    // Admin can manually communicate the password if needed
    console.error('Password updated but email failed:', emailResult.error);
    return { success: true, error: 'Password updated but email failed to send' };
  }

  return { success: true };
}

/**
 * Get all organizations for selector dropdowns
 */
export async function getAllOrganizations(): Promise<{
  data: { id: string; name: string; slug: string }[];
  error?: string;
}> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .order('name');

  if (error) {
    console.error('Error fetching organizations:', error);
    return { data: [], error: error.message };
  }

  return { data: data || [] };
}

/**
 * Get org members eligible for ownership transfer (excludes current owner)
 */
export async function getOrgMembersForTransfer(
  orgId: string
): Promise<{
  data: { id: string; fullName: string; email: string }[];
  error?: string;
}> {
  const supabase = createAdminClient();

  // Get current owner
  const { data: org } = await supabase
    .from('organizations')
    .select('owner_id')
    .eq('id', orgId)
    .single();

  // Get all members of the org
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('org_id', orgId);

  if (error) {
    console.error('Error fetching org members:', error);
    return { data: [], error: error.message };
  }

  // Get emails from auth for these users
  const result: { id: string; fullName: string; email: string }[] = [];

  for (const profile of profiles || []) {
    // Skip current owner
    if (org?.owner_id === profile.id) continue;

    const { data: { user } } = await supabase.auth.admin.getUserById(profile.id);
    if (user) {
      result.push({
        id: profile.id,
        fullName: profile.full_name || 'Unknown',
        email: user.email || ''
      });
    }
  }

  return { data: result };
}
