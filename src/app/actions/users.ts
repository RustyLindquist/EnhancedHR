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

  // Fetch Profiles
  const { data: profiles } = await supabase.from('profiles').select('id, full_name, role');
  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  return data.users.map(user => {
    const profile = profileMap.get(user.id);
    return {
      id: user.id,
      email: user.email || '',
      fullName: profile?.full_name || user.user_metadata?.full_name || 'N/A',
      role: profile?.role || user.user_metadata?.role || 'user',
      lastSignIn: user.last_sign_in_at || null,
      createdAt: user.created_at
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
        // Join auth.users with profiles to get complete data
        const query = `
            SELECT 
                au.id, 
                au.email, 
                au.created_at, 
                au.last_sign_in_at,
                au.raw_user_meta_data,
                p.full_name as profile_name,
                p.role as profile_role
            FROM auth.users au
            LEFT JOIN public.profiles p ON au.id = p.id
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
            createdAt: new Date(row.created_at).toISOString()
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

  revalidatePath('/admin/users');
  return { success: true };
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
