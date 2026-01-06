'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function getExpertApplication() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Get profile with application data (credentials are now in separate table)
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, expert_title, phone_number, linkedin_url, author_bio, course_proposal_title, course_proposal_description, application_status, application_submitted_at, avatar_url, rejection_notes')
        .eq('id', user.id)
        .single()

    if (error) {
        console.error('Error fetching application:', error)
        return { error: error.message }
    }

    return {
        data: {
            user_id: user.id,
            full_name: profile?.full_name || user.user_metadata?.full_name || '',
            expert_title: profile?.expert_title || '',
            phone_number: profile?.phone_number || '',
            linkedin_url: profile?.linkedin_url || '',
            author_bio: profile?.author_bio || '',
            course_proposal_title: profile?.course_proposal_title || '',
            course_proposal_description: profile?.course_proposal_description || '',
            application_status: profile?.application_status || 'draft',
            submitted_at: profile?.application_submitted_at || null,
            avatar_url: profile?.avatar_url || null,
            rejection_notes: profile?.rejection_notes || null
        }
    }
}

export async function saveExpertApplication(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const fullName = formData.get('full_name') as string
    const expertTitle = formData.get('expert_title') as string
    const phoneNumber = formData.get('phone_number') as string
    const linkedinUrl = formData.get('linkedin_url') as string
    const authorBio = formData.get('author_bio') as string
    const courseProposalTitle = formData.get('course_proposal_title') as string
    const courseProposalDescription = formData.get('course_proposal_description') as string
    const isSubmitting = formData.get('submit') === 'true'

    // Validate required fields if submitting
    if (isSubmitting) {
        if (!fullName?.trim()) {
            return { error: 'Full name is required' }
        }
        if (!courseProposalTitle?.trim()) {
            return { error: 'Course proposal title is required' }
        }
        if (!courseProposalDescription?.trim()) {
            return { error: 'Course proposal description is required' }
        }
    }

    // Build update object (credentials are now stored in separate expert_credentials table)
    const updateData: Record<string, any> = {
        full_name: fullName,
        expert_title: expertTitle,
        phone_number: phoneNumber,
        linkedin_url: linkedinUrl,
        author_bio: authorBio,
        course_proposal_title: courseProposalTitle,
        course_proposal_description: courseProposalDescription,
    }

    if (isSubmitting) {
        updateData.application_status = 'submitted'
        updateData.application_submitted_at = new Date().toISOString()
        updateData.author_status = 'pending' // This makes the application visible in admin console
    }

    // Update profile
    const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

    if (error) {
        console.error('Error saving application:', error)
        return { error: 'Failed to save application. Please try again.' }
    }

    // Also sync initial proposal to course_proposals table when submitting
    if (isSubmitting && courseProposalTitle?.trim() && courseProposalDescription?.trim()) {
        // Check if an initial proposal already exists for this expert
        const { data: existingProposal } = await supabase
            .from('course_proposals')
            .select('id')
            .eq('expert_id', user.id)
            .eq('title', courseProposalTitle.trim())
            .single()

        if (!existingProposal) {
            // Create new proposal entry
            const { error: proposalError } = await supabase
                .from('course_proposals')
                .insert({
                    expert_id: user.id,
                    title: courseProposalTitle.trim(),
                    description: courseProposalDescription.trim(),
                    status: 'pending'
                })

            if (proposalError) {
                console.error('Error creating course proposal:', proposalError)
                // Don't fail the main operation, just log the error
            }
        }
    }

    // Also update auth metadata for full_name
    if (fullName) {
        await supabase.auth.updateUser({
            data: { full_name: fullName }
        })
    }

    revalidatePath('/expert-application')
    return { success: true }
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}
