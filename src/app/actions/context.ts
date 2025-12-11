'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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
        console.error('[createContextItem] Unauthorized: No user found');
        return { success: false, error: 'Unauthorized: No user found' };
    }

    const resolvedCollectionId = await resolveCollectionId(supabase, data.collection_id, user.id);
    
    console.log('[createContextItem] Request:', {
        userId: user.id,
        inputCollectionId: data.collection_id,
        resolvedCollectionId: resolvedCollectionId,
        type: data.type,
        title: data.title
    });

    const { data: inserted, error } = await supabase
        .from('user_context_items')
        .insert({
            user_id: user.id,
            collection_id: resolvedCollectionId,
            type: data.type,
            title: data.title,
            content: data.content
        })
        .select() // Select to confirm insert
        .single();

    if (error) {
        console.error('[createContextItem] DB Error:', error);
        return { success: false, error: `Failed to create: ${error.message} (${error.code})` };
    }

    console.log('[createContextItem] Success! Inserted:', inserted);

    revalidatePath('/dashboard');
    revalidatePath('/academy'); 
    return { success: true };
}

export async function updateContextItem(id: string, updates: { title?: string; content?: any }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
        .from('user_context_items')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error updating context item:', error);
        return { success: false, error: `Failed to update: ${error.message}` };
    }

    revalidatePath('/dashboard');
    return { success: true };
}

export async function deleteContextItem(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
        .from('user_context_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deleting context item:', error);
        return { success: false, error: 'Failed to delete context item' };
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
        console.log(`[resolveCollectionId] Resolving target: ${targetLabel} for user: ${userId}`);
        const { data, error } = await supabase
            .from('user_collections')
            .select('id')
            .eq('user_id', userId)
            .eq('user_id', userId)
            .eq('label', targetLabel)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (data?.id) {
            return data.id;
        }

        // Auto-create if missing (to match client behavior and ensure per-collection persistence)
        console.log(`[resolveCollectionId] Collection '${targetLabel}' missing. Auto-creating.`);
        
        let defaultColor = '#64748B'; // Slate
        if (targetLabel === 'Favorites') defaultColor = '#EAB308'; // Yellow
        else if (targetLabel === 'Workspace') defaultColor = '#3B82F6'; // Blue
        else if (targetLabel === 'Watchlist') defaultColor = '#A855F7'; // Purple

        const { data: newData, error: createError } = await supabase
            .from('user_collections')
            .insert({
                user_id: userId,
                label: targetLabel,
                color: defaultColor
            })
            .select('id')
            .single();
        
        if (createError) {
            console.error(`[resolveCollectionId] Failed to auto-create '${targetLabel}':`, createError);
            // Fallback to null (global) if create fails, or throw? 
            // Better to return null than crash, but items will be orphaned from collection view.
            return null;
        }

        return newData.id;
    }

    // Is it a UUID? (Custom Collection)
    return collectionId;
}

export async function getCollectionDetailsAction(collectionIdOrAlias: string) {
    const supabase = await createClient(); // Auth client for user verification
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { courses: [], contextItems: [] };

    // Resolve ID using standard client (safe)
    const resolvedId = await resolveCollectionId(supabase, collectionIdOrAlias, user.id);
    if (!resolvedId) return { courses: [], contextItems: [] };

    const admin = createAdminClient(); // Service Role client

    // 1. Fetch Context Items
    const { data: contextItems } = await admin
        .from('user_context_items')
        .select('*')
        .eq('collection_id', resolvedId)
        .order('created_at', { ascending: false });

    // 2. Fetch Collection Courses (via linking table)
    // We join 'courses' table using the FK.
    // Note: collection_items has course_id, which references courses(id).
    // Ensure Schema matches. collection_items(course_id -> courses(id))
    const { data: rawCollectionItems } = await admin
        .from('collection_items')
        .select(`
            course_id,
            courses (*)
        `)
        .eq('collection_id', resolvedId);

    // Map courses
    const courses = rawCollectionItems?.map((item: any) => {
        if (!item.courses) return null;
        return {
            ...item.courses,
            // Ensure types match front-end expectation
            type: 'COURSE', 
            itemType: 'COURSE', 
            isSaved: true
        };
    }).filter(Boolean) || [];

    return {
        courses,
        contextItems: contextItems || []
    };
}
