'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ContextItemType } from '@/types';

interface CreateContextItemDTO {
    collection_id?: string | null; // null for Global
    type: ContextItemType;
    title: string;
    content: any;
}

export async function createContextItem(data: CreateContextItemDTO) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    const { error } = await supabase
        .from('user_context_items')
        .insert({
            user_id: user.id,
            collection_id: await resolveCollectionId(supabase, data.collection_id, user.id),
            type: data.type,
            title: data.title,
            content: data.content
        });

    if (error) {
        console.error('Error creating context item:', error);
        throw new Error('Failed to create context item');
    }

    revalidatePath('/dashboard');
    revalidatePath('/academy'); // Revalidate broadly as context might appear in multiple places
    return { success: true };
}

export async function updateContextItem(id: string, updates: { title?: string; content?: any }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    const { error } = await supabase
        .from('user_context_items')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error updating context item:', error);
        throw new Error('Failed to update context item');
    }

    revalidatePath('/dashboard');
    return { success: true };
}

export async function deleteContextItem(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    const { error } = await supabase
        .from('user_context_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deleting context item:', error);
        throw new Error('Failed to delete context item');
    }

    revalidatePath('/dashboard');
    return { success: true };
}

export async function getContextItems(collectionId?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    let query = supabase
        .from('user_context_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    // Filter by collection ID
    const targetId = await resolveCollectionId(supabase, collectionId, user.id);
    
    if (targetId) {
        query = query.eq('collection_id', targetId);
    } else {
        // Only if truly meant to be global/null (which we aren't using for Personal Context anymore technically, 
        // but let's keep it robust)
        query = query.is('collection_id', null);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching context items:', error);
        return [];
    }

    return data;
}

// Fetch GLOBAL items specifically (for AI injection)
export async function getGlobalContextItems() {
    return getContextItems('personal-context');
}
// Helper to resolve "personal-context" and other default IDs to real DB ID
async function resolveCollectionId(supabase: any, collectionId: string | undefined | null, userId: string): Promise<string | null> {
    if (!collectionId) return null;

    const labelMap: Record<string, string> = {
        'personal-context': 'Personal Context',
        'favorites': 'Favorites',
        'research': 'Workspace',
        'to_learn': 'Watchlist'
    };

    const targetLabel = labelMap[collectionId];

    if (targetLabel) {
        const { data } = await supabase
            .from('user_collections')
            .select('id')
            .eq('user_id', userId)
            .eq('label', targetLabel)
            .maybeSingle();
        return data?.id || null;
    }

    return collectionId;
}
