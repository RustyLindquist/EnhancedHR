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
            collection_id: data.collection_id || null, // Ensure null if undefined/empty for global
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
    if (collectionId === 'personal-context' || !collectionId) {
        // Fetch Global items (null collection_id)
        query = query.is('collection_id', null);
    } else {
        // Fetch Local items
        query = query.eq('collection_id', collectionId);
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
