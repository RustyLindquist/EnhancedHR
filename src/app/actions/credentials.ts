'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export type CredentialType = 'certification' | 'degree' | 'experience' | 'expertise' | 'publication' | 'achievement';

export interface ExpertCredential {
    id: string;
    expert_id: string;
    title: string;
    type: CredentialType;
    display_order: number;
    created_at: string;
    updated_at: string;
}

export interface CreateCredentialData {
    title: string;
    type: CredentialType;
    display_order?: number;
}

/**
 * Get all credentials for a specific expert
 */
export async function getExpertCredentials(expertId: string): Promise<ExpertCredential[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('expert_credentials')
        .select('*')
        .eq('expert_id', expertId)
        .order('display_order', { ascending: true });

    if (error) {
        console.error('[getExpertCredentials] Error:', error);
        return [];
    }

    return data || [];
}

/**
 * Get credentials for the currently logged in user
 */
export async function getMyCredentials(): Promise<ExpertCredential[]> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error('[getMyCredentials] No authenticated user');
        return [];
    }

    return getExpertCredentials(user.id);
}

/**
 * Create a new credential for the current user
 */
export async function createCredential(data: CreateCredentialData): Promise<{ success: boolean; credential?: ExpertCredential; error?: string }> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Get max display_order for this user
    const { data: existing } = await supabase
        .from('expert_credentials')
        .select('display_order')
        .eq('expert_id', user.id)
        .order('display_order', { ascending: false })
        .limit(1);

    const nextOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 0;

    const { data: credential, error } = await supabase
        .from('expert_credentials')
        .insert({
            expert_id: user.id,
            title: data.title,
            type: data.type,
            display_order: data.display_order ?? nextOrder
        })
        .select()
        .single();

    if (error) {
        console.error('[createCredential] Error:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/settings/account');
    revalidatePath('/expert-application');

    return { success: true, credential };
}

/**
 * Update an existing credential
 */
export async function updateCredential(
    credentialId: string,
    data: Partial<CreateCredentialData>
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('expert_credentials')
        .update(data)
        .eq('id', credentialId);

    if (error) {
        console.error('[updateCredential] Error:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/settings/account');
    revalidatePath('/expert-application');

    return { success: true };
}

/**
 * Delete a credential
 */
export async function deleteCredential(credentialId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('expert_credentials')
        .delete()
        .eq('id', credentialId);

    if (error) {
        console.error('[deleteCredential] Error:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/settings/account');
    revalidatePath('/expert-application');

    return { success: true };
}

/**
 * Reorder credentials by updating display_order
 */
export async function reorderCredentials(
    credentialIds: string[]
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    // Update each credential with its new order
    for (let i = 0; i < credentialIds.length; i++) {
        const { error } = await supabase
            .from('expert_credentials')
            .update({ display_order: i })
            .eq('id', credentialIds[i]);

        if (error) {
            console.error('[reorderCredentials] Error:', error);
            return { success: false, error: error.message };
        }
    }

    revalidatePath('/settings/account');
    revalidatePath('/expert-application');

    return { success: true };
}

// ==================== Admin Actions ====================

/**
 * Admin: Create a credential for any expert
 */
export async function adminCreateCredential(
    expertId: string,
    data: CreateCredentialData
): Promise<{ success: boolean; credential?: ExpertCredential; error?: string }> {
    const admin = createAdminClient();

    // Get max display_order for this expert
    const { data: existing } = await admin
        .from('expert_credentials')
        .select('display_order')
        .eq('expert_id', expertId)
        .order('display_order', { ascending: false })
        .limit(1);

    const nextOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 0;

    const { data: credential, error } = await admin
        .from('expert_credentials')
        .insert({
            expert_id: expertId,
            title: data.title,
            type: data.type,
            display_order: data.display_order ?? nextOrder
        })
        .select()
        .single();

    if (error) {
        console.error('[adminCreateCredential] Error:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/admin/experts/${expertId}`);

    return { success: true, credential };
}

/**
 * Admin: Update a credential for any expert
 */
export async function adminUpdateCredential(
    credentialId: string,
    data: Partial<CreateCredentialData>
): Promise<{ success: boolean; error?: string }> {
    const admin = createAdminClient();

    const { error } = await admin
        .from('expert_credentials')
        .update(data)
        .eq('id', credentialId);

    if (error) {
        console.error('[adminUpdateCredential] Error:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Admin: Delete a credential for any expert
 */
export async function adminDeleteCredential(credentialId: string): Promise<{ success: boolean; error?: string }> {
    const admin = createAdminClient();

    const { error } = await admin
        .from('expert_credentials')
        .delete()
        .eq('id', credentialId);

    if (error) {
        console.error('[adminDeleteCredential] Error:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Admin: Get credentials for any expert
 */
export async function adminGetExpertCredentials(expertId: string): Promise<ExpertCredential[]> {
    const admin = createAdminClient();

    const { data, error } = await admin
        .from('expert_credentials')
        .select('*')
        .eq('expert_id', expertId)
        .order('display_order', { ascending: true });

    if (error) {
        console.error('[adminGetExpertCredentials] Error:', error);
        return [];
    }

    return data || [];
}
