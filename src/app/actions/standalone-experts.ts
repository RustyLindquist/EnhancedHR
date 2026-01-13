'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { StandaloneExpert, StandaloneExpertCredential } from '@/types';

export interface StandaloneExpertInput {
    full_name: string;
    email?: string;
    avatar_url?: string;
    expert_title?: string;
    author_bio?: string;
    phone_number?: string;
    linkedin_url?: string;
    twitter_url?: string;
    website_url?: string;
    is_active?: boolean;
}

export interface StandaloneExpertCredentialInput {
    title: string;
    type: 'certification' | 'degree' | 'experience' | 'expertise' | 'publication' | 'achievement';
    display_order?: number;
}

// Create a new standalone expert
export async function createStandaloneExpert(
    data: StandaloneExpertInput
): Promise<{
    expert: StandaloneExpert | null;
    error?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { expert: null, error: 'Not authenticated' };
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { expert: null, error: 'Unauthorized' };
    }

    const admin = await createAdminClient();

    const { data: newExpert, error } = await admin
        .from('standalone_experts')
        .insert({
            full_name: data.full_name,
            email: data.email || null,
            avatar_url: data.avatar_url || null,
            expert_title: data.expert_title || null,
            author_bio: data.author_bio || null,
            phone_number: data.phone_number || null,
            linkedin_url: data.linkedin_url || null,
            twitter_url: data.twitter_url || null,
            website_url: data.website_url || null,
            is_active: data.is_active !== false,
            created_by: user.id
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating standalone expert:', error);
        return { expert: null, error: error.message };
    }

    // Log the admin action
    await admin.from('admin_audit_log').insert({
        admin_id: user.id,
        action: 'standalone_expert_created',
        target_type: 'standalone_expert',
        target_id: newExpert.id,
        details: { full_name: data.full_name }
    });

    revalidatePath('/admin/experts');

    return { expert: newExpert as StandaloneExpert };
}

// Get a standalone expert by ID
export async function getStandaloneExpertById(
    expertId: string
): Promise<{
    expert: StandaloneExpert | null;
    credentials: StandaloneExpertCredential[];
    error?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { expert: null, credentials: [], error: 'Not authenticated' };
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { expert: null, credentials: [], error: 'Unauthorized' };
    }

    const admin = await createAdminClient();

    // Get expert
    const { data: expert, error: expertError } = await admin
        .from('standalone_experts')
        .select('*')
        .eq('id', expertId)
        .single();

    if (expertError) {
        console.error('Error fetching standalone expert:', expertError);
        return { expert: null, credentials: [], error: expertError.message };
    }

    // Get credentials
    const { data: credentials, error: credentialsError } = await admin
        .from('standalone_expert_credentials')
        .select('*')
        .eq('standalone_expert_id', expertId)
        .order('display_order', { ascending: true });

    if (credentialsError) {
        console.error('Error fetching credentials:', credentialsError);
    }

    return {
        expert: expert as StandaloneExpert,
        credentials: (credentials || []) as StandaloneExpertCredential[]
    };
}

// Get all standalone experts
export async function getStandaloneExperts(): Promise<{
    experts: StandaloneExpert[];
    error?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { experts: [], error: 'Not authenticated' };
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { experts: [], error: 'Unauthorized' };
    }

    const admin = await createAdminClient();

    const { data: experts, error } = await admin
        .from('standalone_experts')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching standalone experts:', error);
        return { experts: [], error: error.message };
    }

    return { experts: (experts || []) as StandaloneExpert[] };
}

// Update a standalone expert
export async function updateStandaloneExpert(
    expertId: string,
    data: Partial<StandaloneExpertInput>
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

    const updateData: Record<string, string | boolean | null | undefined> = {
        updated_at: new Date().toISOString()
    };

    if (data.full_name !== undefined) updateData.full_name = data.full_name;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url || null;
    if (data.expert_title !== undefined) updateData.expert_title = data.expert_title || null;
    if (data.author_bio !== undefined) updateData.author_bio = data.author_bio || null;
    if (data.phone_number !== undefined) updateData.phone_number = data.phone_number || null;
    if (data.linkedin_url !== undefined) updateData.linkedin_url = data.linkedin_url || null;
    if (data.twitter_url !== undefined) updateData.twitter_url = data.twitter_url || null;
    if (data.website_url !== undefined) updateData.website_url = data.website_url || null;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    const { error } = await admin
        .from('standalone_experts')
        .update(updateData)
        .eq('id', expertId);

    if (error) {
        console.error('Error updating standalone expert:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/experts');
    revalidatePath(`/admin/experts/standalone/${expertId}`);

    return { success: true };
}

// Delete a standalone expert (soft delete by setting is_active to false)
export async function deleteStandaloneExpert(
    expertId: string
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

    // Soft delete by setting is_active to false
    const { error } = await admin
        .from('standalone_experts')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', expertId);

    if (error) {
        console.error('Error deleting standalone expert:', error);
        return { success: false, error: error.message };
    }

    // Log the admin action
    await admin.from('admin_audit_log').insert({
        admin_id: user.id,
        action: 'standalone_expert_deleted',
        target_type: 'standalone_expert',
        target_id: expertId
    });

    revalidatePath('/admin/experts');

    return { success: true };
}

// === Credential Management ===

// Add credential to standalone expert
export async function addStandaloneExpertCredential(
    expertId: string,
    data: StandaloneExpertCredentialInput
): Promise<{
    credential: StandaloneExpertCredential | null;
    error?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { credential: null, error: 'Not authenticated' };
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { credential: null, error: 'Unauthorized' };
    }

    const admin = await createAdminClient();

    // Get max display order
    const { data: existingCredentials } = await admin
        .from('standalone_expert_credentials')
        .select('display_order')
        .eq('standalone_expert_id', expertId)
        .order('display_order', { ascending: false })
        .limit(1);

    const maxOrder = existingCredentials?.[0]?.display_order || 0;

    const { data: credential, error } = await admin
        .from('standalone_expert_credentials')
        .insert({
            standalone_expert_id: expertId,
            title: data.title,
            type: data.type,
            display_order: data.display_order ?? maxOrder + 1
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding credential:', error);
        return { credential: null, error: error.message };
    }

    revalidatePath(`/admin/experts/standalone/${expertId}`);

    return { credential: credential as StandaloneExpertCredential };
}

// Update credential
export async function updateStandaloneExpertCredential(
    credentialId: string,
    data: Partial<StandaloneExpertCredentialInput>
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

    const updateData: Record<string, string | number | undefined> = {
        updated_at: new Date().toISOString()
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.display_order !== undefined) updateData.display_order = data.display_order;

    const { error } = await admin
        .from('standalone_expert_credentials')
        .update(updateData)
        .eq('id', credentialId);

    if (error) {
        console.error('Error updating credential:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// Delete credential
export async function deleteStandaloneExpertCredential(
    credentialId: string
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
        .from('standalone_expert_credentials')
        .delete()
        .eq('id', credentialId);

    if (error) {
        console.error('Error deleting credential:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// Get courses by standalone expert
export async function getStandaloneExpertCourses(
    expertId: string
): Promise<{
    courses: Array<{
        id: number;
        title: string;
        description: string | null;
        status: string;
        category: string | null;
        image_url: string | null;
        created_at: string;
    }>;
    error?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { courses: [], error: 'Not authenticated' };
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { courses: [], error: 'Unauthorized' };
    }

    const admin = await createAdminClient();

    const { data: courses, error } = await admin
        .from('courses')
        .select('id, title, description, status, category, image_url, created_at')
        .eq('standalone_expert_id', expertId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching standalone expert courses:', error);
        return { courses: [], error: error.message };
    }

    return { courses: courses || [] };
}

// === Public-facing functions for Academy view ===

// Get standalone experts with published courses for Academy > Experts view
export async function getStandaloneExpertsWithPublishedCourses(): Promise<{
    experts: Array<{
        id: string;
        name: string;
        role: string;
        bio: string;
        avatar: string | null;
        credentials: string[];
        publishedCourseCount: number;
        isStandalone: true;
    }>;
    error?: string;
}> {
    const supabase = await createClient();

    // Fetch active standalone experts
    const { data: expertsData, error: expertsError } = await supabase
        .from('standalone_experts')
        .select('*')
        .eq('is_active', true);

    if (expertsError) {
        console.error('Error fetching standalone experts:', expertsError);
        return { experts: [], error: expertsError.message };
    }

    // Get expert IDs
    const expertIds = expertsData?.map(e => e.id) || [];

    if (expertIds.length === 0) {
        return { experts: [] };
    }

    // Fetch published courses grouped by standalone expert
    const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('standalone_expert_id')
        .eq('status', 'published')
        .in('standalone_expert_id', expertIds);

    if (coursesError) {
        console.error('Error fetching courses:', coursesError);
        return { experts: [], error: coursesError.message };
    }

    // Count published courses per expert
    const courseCountByExpert: Record<string, number> = {};
    coursesData?.forEach(course => {
        if (course.standalone_expert_id) {
            courseCountByExpert[course.standalone_expert_id] = (courseCountByExpert[course.standalone_expert_id] || 0) + 1;
        }
    });

    // Fetch credentials for all experts
    const { data: allCredentials } = await supabase
        .from('standalone_expert_credentials')
        .select('*')
        .in('standalone_expert_id', expertIds)
        .order('display_order', { ascending: true });

    // Group credentials by expert
    const credentialsByExpert: Record<string, string[]> = {};
    allCredentials?.forEach(cred => {
        if (!credentialsByExpert[cred.standalone_expert_id]) {
            credentialsByExpert[cred.standalone_expert_id] = [];
        }
        credentialsByExpert[cred.standalone_expert_id].push(cred.title);
    });

    // Filter to only experts with published courses and transform data
    const expertsWithPublishedCourses = (expertsData || [])
        .filter(expert => courseCountByExpert[expert.id] > 0)
        .map(expert => ({
            id: expert.id,
            name: expert.full_name,
            role: expert.expert_title || '',
            bio: expert.author_bio || '',
            avatar: expert.avatar_url,
            credentials: credentialsByExpert[expert.id] || [],
            publishedCourseCount: courseCountByExpert[expert.id],
            isStandalone: true as const
        }))
        .sort((a, b) => b.publishedCourseCount - a.publishedCourseCount);

    return { experts: expertsWithPublishedCourses };
}
