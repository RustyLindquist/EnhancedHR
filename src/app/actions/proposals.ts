'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface CourseProposal {
    id: string;
    expert_id: string;
    title: string;
    description: string | null;
    status: 'pending' | 'approved' | 'rejected' | 'converted';
    admin_notes: string | null;
    created_at: string;
    updated_at: string;
    reviewed_at: string | null;
    reviewed_by: string | null;
}

// Interface for proposal with expert info
export interface ProposalWithExpert extends CourseProposal {
    expert: {
        id: string;
        full_name: string | null;
        email: string | null;
        avatar_url: string | null;
    };
}

// Get all proposals across all experts (admin use)
export async function getAllProposals(filters?: {
    status?: 'pending' | 'approved' | 'rejected' | 'converted';
}): Promise<{
    proposals: ProposalWithExpert[];
    error?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { proposals: [], error: 'Not authenticated' };
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { proposals: [], error: 'Unauthorized' };
    }

    const admin = await createAdminClient();

    let query = admin
        .from('course_proposals')
        .select(`
            *,
            expert:profiles!course_proposals_expert_id_fkey(id, full_name, email, avatar_url)
        `)
        .order('created_at', { ascending: false });

    if (filters?.status) {
        query = query.eq('status', filters.status);
    }

    const { data: proposals, error } = await query;

    if (error) {
        if (error.message?.includes('course_proposals') || error.code === 'PGRST205') {
            console.log('Note: course_proposals table not found.');
            return { proposals: [] };
        }
        console.error('Error fetching all proposals:', error);
        return { proposals: [], error: error.message };
    }

    return { proposals: proposals || [] };
}

// Get all proposals for an expert (admin use)
export async function getExpertProposals(expertId: string): Promise<{
    proposals: CourseProposal[];
    error?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { proposals: [], error: 'Not authenticated' };
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { proposals: [], error: 'Unauthorized' };
    }

    const admin = await createAdminClient();
    const { data: proposals, error } = await admin
        .from('course_proposals')
        .select('*')
        .eq('expert_id', expertId)
        .order('created_at', { ascending: false });

    // If table doesn't exist yet, return empty array gracefully
    if (error) {
        if (error.message?.includes('course_proposals') || error.code === 'PGRST205') {
            console.log('Note: course_proposals table not found. Run migration to enable proposals.');
            return { proposals: [] };
        }
        console.error('Error fetching proposals:', error);
        return { proposals: [], error: error.message };
    }

    return { proposals: proposals || [] };
}

// Get my proposals (for experts)
export async function getMyProposals(): Promise<{
    proposals: CourseProposal[];
    error?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { proposals: [], error: 'Not authenticated' };
    }

    const { data: proposals, error } = await supabase
        .from('course_proposals')
        .select('*')
        .eq('expert_id', user.id)
        .order('created_at', { ascending: false });

    // If table doesn't exist yet, return empty array gracefully
    if (error) {
        if (error.message?.includes('course_proposals') || error.code === 'PGRST205') {
            return { proposals: [] };
        }
        console.error('Error fetching my proposals:', error);
        return { proposals: [], error: error.message };
    }

    return { proposals: proposals || [] };
}

// Create a new proposal (for approved experts)
export async function createProposal(data: {
    title: string;
    description?: string;
}): Promise<{
    success: boolean;
    proposal?: CourseProposal;
    error?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Check if user has expert access (pending, approved, or rejected)
    const { data: profile } = await supabase
        .from('profiles')
        .select('author_status')
        .eq('id', user.id)
        .single();

    const hasExpertAccess = profile?.author_status && profile.author_status !== 'none';
    if (!hasExpertAccess) {
        return { success: false, error: 'Only experts can submit proposals' };
    }

    const { data: proposal, error } = await supabase
        .from('course_proposals')
        .insert({
            expert_id: user.id,
            title: data.title,
            description: data.description || null,
            status: 'pending'
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating proposal:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/author');
    return { success: true, proposal };
}

// Update proposal status (admin only)
export async function updateProposalStatus(
    proposalId: string,
    status: 'pending' | 'approved' | 'rejected' | 'converted',
    adminNotes?: string
): Promise<{
    success: boolean;
    error?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { success: false, error: 'Unauthorized' };
    }

    const admin = await createAdminClient();
    const { error } = await admin
        .from('course_proposals')
        .update({
            status,
            admin_notes: adminNotes || null,
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id
        })
        .eq('id', proposalId);

    if (error) {
        console.error('Error updating proposal status:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/experts');
    return { success: true };
}

// Delete a proposal (admin only)
export async function deleteProposal(proposalId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { success: false, error: 'Unauthorized' };
    }

    const admin = await createAdminClient();
    const { error } = await admin
        .from('course_proposals')
        .delete()
        .eq('id', proposalId);

    if (error) {
        console.error('Error deleting proposal:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/experts');
    return { success: true };
}

// Update proposal (expert can update their own pending proposals)
export async function updateProposal(
    proposalId: string,
    data: {
        title?: string;
        description?: string;
    }
): Promise<{
    success: boolean;
    error?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Verify ownership and pending status
    const { data: proposal } = await supabase
        .from('course_proposals')
        .select('expert_id, status')
        .eq('id', proposalId)
        .single();

    if (!proposal) {
        return { success: false, error: 'Proposal not found' };
    }

    if (proposal.expert_id !== user.id) {
        return { success: false, error: 'Unauthorized' };
    }

    if (proposal.status !== 'pending') {
        return { success: false, error: 'Can only edit pending proposals' };
    }

    const updateData: Record<string, string> = {};
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;

    const { error } = await supabase
        .from('course_proposals')
        .update(updateData)
        .eq('id', proposalId);

    if (error) {
        console.error('Error updating proposal:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/author');
    return { success: true };
}
