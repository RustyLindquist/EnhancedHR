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

export async function getUsers(): Promise<AdminUser[]> {
  const supabase = createAdminClient();
  
  // Fetch Auth Users
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }

  // Fetch Profiles
  const { data: profiles } = await supabase.from('profiles').select('id, full_name, role');
  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  return users.map(user => {
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
