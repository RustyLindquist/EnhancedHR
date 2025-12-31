'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Upload avatar to storage and update profile
export async function uploadAvatarAction(formData: FormData): Promise<{
    success: boolean;
    url?: string;
    error?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    const file = formData.get('avatar') as File;
    if (!file) {
        return { success: false, error: 'No file provided' };
    }

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        return { success: false, error: 'Invalid file type. Please use JPEG, PNG, GIF, or WebP.' };
    }
    if (file.size > 5 * 1024 * 1024) {
        return { success: false, error: 'File too large. Maximum size is 5MB.' };
    }

    const admin = await createAdminClient();
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/${timestamp}.${ext}`;

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to storage
    const { error: uploadError } = await admin.storage
        .from('avatars')
        .upload(path, buffer, {
            contentType: file.type,
            upsert: true
        });

    if (uploadError) {
        console.error('Avatar upload error:', uploadError);
        return { success: false, error: uploadError.message };
    }

    // Get public URL
    const { data: urlData } = admin.storage
        .from('avatars')
        .getPublicUrl(path);

    // Update profile
    const { error: updateError } = await admin
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id);

    if (updateError) {
        console.error('Profile update error:', updateError);
        return { success: false, error: updateError.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/settings/account');

    return { success: true, url: urlData.publicUrl };
}

// Mark onboarding as completed
export async function completeOnboardingAction(): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    const admin = await createAdminClient();
    const { error } = await admin
        .from('profiles')
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq('id', user.id);

    if (error) {
        console.error('Complete onboarding error:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
}

// Mark onboarding as skipped (user dismissed without completing)
export async function skipOnboardingAction(): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    const admin = await createAdminClient();
    const { error } = await admin
        .from('profiles')
        .update({ onboarding_skipped_at: new Date().toISOString() })
        .eq('id', user.id);

    if (error) {
        console.error('Skip onboarding error:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
}

// Update expert profile fields (phone, linkedin, credentials, author_bio, expert_title)
export async function updateExpertProfileAction(data: {
    phone_number?: string;
    linkedin_url?: string;
    credentials?: string;
    author_bio?: string;
    expert_title?: string;
}): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Verify user is an expert or admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('author_status, role')
        .eq('id', user.id)
        .single();

    const isExpertOrAdmin = profile?.role === 'admin' ||
                            profile?.author_status === 'approved' ||
                            profile?.author_status === 'pending';

    if (!profile || !isExpertOrAdmin) {
        return { success: false, error: 'Only experts or admins can update these fields' };
    }

    const admin = await createAdminClient();
    const { error } = await admin
        .from('profiles')
        .update({
            phone_number: data.phone_number,
            linkedin_url: data.linkedin_url,
            credentials: data.credentials,
            author_bio: data.author_bio,
            expert_title: data.expert_title,
        })
        .eq('id', user.id);

    if (error) {
        console.error('Update expert profile error:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/settings/account');
    return { success: true };
}

// Get profile for onboarding status check
export async function getProfileForOnboardingAction(): Promise<{
    profile: {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
        onboarding_completed_at: string | null;
        onboarding_skipped_at: string | null;
    } | null;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { profile: null };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, onboarding_completed_at, onboarding_skipped_at')
        .eq('id', user.id)
        .single();

    return { profile };
}
