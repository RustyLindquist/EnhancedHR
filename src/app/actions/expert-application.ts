'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Instantly makes the current user an expert (approved status).
 * No form or admin approval required - user can immediately access Expert Console.
 */
export async function becomeExpert(): Promise<{
    success: boolean;
    error?: string;
}> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Check if user is already an expert
    const { data: profile } = await supabase
        .from('profiles')
        .select('author_status')
        .eq('id', user.id)
        .single();

    if (profile?.author_status === 'approved') {
        return { success: true }; // Already an expert, nothing to do
    }

    // Update profile to approved expert status
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            author_status: 'approved',
        })
        .eq('id', user.id);

    if (profileError) {
        console.error('Error updating profile to expert:', profileError);
        return { success: false, error: 'Failed to become an expert. Please try again.' };
    }

    revalidatePath('/settings/account');
    revalidatePath('/author');
    return { success: true };
}

interface SubmitExpertProposalData {
    full_name: string;
    expert_title?: string;
    phone_number?: string;
    linkedin_url?: string;
    author_bio?: string;
    course_proposal_title: string;
    course_proposal_description: string;
}

export async function submitExpertProposal(data: SubmitExpertProposalData): Promise<{
    success: boolean;
    error?: string;
}> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Validate required fields
    if (!data.course_proposal_title?.trim()) {
        return { success: false, error: 'Course proposal title is required' };
    }
    if (data.course_proposal_title.length > 150) {
        return { success: false, error: 'Course title must be 150 characters or less' };
    }
    if (!data.course_proposal_description?.trim()) {
        return { success: false, error: 'Course proposal description is required' };
    }
    if (data.course_proposal_description.length > 2000) {
        return { success: false, error: 'Course description must be 2000 characters or less' };
    }

    // Build update object for profiles table
    const profileUpdate: Record<string, string | null> = {
        author_status: 'pending',
        application_status: 'submitted',
        application_submitted_at: new Date().toISOString(),
        course_proposal_title: data.course_proposal_title.trim(),
        course_proposal_description: data.course_proposal_description.trim(),
    };

    // Add optional fields if provided
    if (data.full_name?.trim()) {
        profileUpdate.full_name = data.full_name.trim();
    }
    if (data.expert_title?.trim()) {
        profileUpdate.expert_title = data.expert_title.trim();
    }
    if (data.phone_number?.trim()) {
        profileUpdate.phone_number = data.phone_number.trim();
    }
    if (data.linkedin_url?.trim()) {
        profileUpdate.linkedin_url = data.linkedin_url.trim();
    }
    if (data.author_bio?.trim()) {
        profileUpdate.author_bio = data.author_bio.trim();
    }

    // Update profile
    const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', user.id);

    if (profileError) {
        console.error('Error updating profile:', profileError);
        return { success: false, error: 'Failed to submit application. Please try again.' };
    }

    // Insert into course_proposals table
    const { error: proposalError } = await supabase
        .from('course_proposals')
        .insert({
            expert_id: user.id,
            title: data.course_proposal_title.trim(),
            description: data.course_proposal_description.trim(),
            status: 'pending',
        });

    if (proposalError) {
        console.error('Error creating course proposal:', proposalError);
        // Don't fail the whole operation if this fails, as the profile is already updated
        // The admin can still see the application via the profile
    }

    // Also update auth metadata for full_name
    if (data.full_name?.trim()) {
        await supabase.auth.updateUser({
            data: { full_name: data.full_name.trim() }
        });
    }

    revalidatePath('/settings/account');
    revalidatePath('/expert-application');
    return { success: true };
}
