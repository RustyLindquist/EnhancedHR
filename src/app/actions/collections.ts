'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function renameCollection(collectionId: string, newName: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
        .from('user_collections')
        .update({ label: newName }) // 'label' is the column name based on lib/collections.ts
        .eq('id', collectionId)
        .eq('user_id', user.id); // Security: ensure ownership

    if (error) {
        console.error('Error renaming collection:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
}

export async function deleteCollection(collectionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    // Deleting the collection row should cascade delete items if FK is set up correctly.
    // If not, we might need manual cleanup, but usually FKs handle this in Supabase.
    // Assuming 'collection_items' and 'user_context_items' have ON DELETE CASCADE.
    
    // Safety check: Don't delete system collections via this action if they are protected by ID logic, 
    // but here we rely on the UI to only allow calling this for custom ones.
    // We can double check 'is_custom' column if we want to be paranoid.

    const { error } = await supabase
        .from('user_collections')
        .delete()
        .eq('id', collectionId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deleting collection:', error);
        return { success: false, error: error.message };
    }
    
    console.log('Successfully deleted collection:', collectionId);

    revalidatePath('/dashboard');
    return { success: true };
}

export async function getCollectionCountsAction(userId: string): Promise<Record<string, number>> {
    const admin = createAdminClient();
    const counts: Record<string, number> = {};

    console.log('[getCollectionCountsAction] Starting count for user:', userId);

    // Fetch User Collections for Alias Mapping
    const { data: userCollections, error: userCollError } = await admin
        .from('user_collections')
        .select('id, label, is_custom')
        .eq('user_id', userId);

    if (userCollError) {
        console.error('[getCollectionCountsAction] Error fetching user collections:', userCollError);
    }

    // Build UUID -> Alias map for system collections (based on label)
    const uuidToAlias: Record<string, string> = {};
    const labelToAlias: Record<string, string> = {
        'favorites': 'favorites',
        'workspace': 'research',
        'watchlist': 'to_learn',
        'personal context': 'personal-context'
    };

    let personalContextId: string | null = null;

    if (userCollections) {
        userCollections.forEach((c: any) => {
            const lowerLabel = c.label?.toLowerCase().trim();
            if (lowerLabel === 'personal context') personalContextId = c.id;

            // Map UUID to alias if it's a system collection (by label)
            if (lowerLabel && labelToAlias[lowerLabel]) {
                uuidToAlias[c.id] = labelToAlias[lowerLabel];
            }
        });
    }

    // 1. Count items from collection_items table (courses, modules, lessons, conversations)
    const { data: collectionItems, error: itemsError } = await admin
        .from('collection_items')
        .select('collection_id, item_type, item_id')
        .in('collection_id', userCollections?.map(c => c.id) || []);

    if (itemsError) {
        console.error('[getCollectionCountsAction] Error fetching collection items:', itemsError);
    }

    // Count items by collection UUID only
    if (collectionItems) {
        collectionItems.forEach((item: any) => {
            const id = item.collection_id;
            counts[id] = (counts[id] || 0) + 1;
        });
    }

    // 2. Count Context Items (user_context_items)
    const { data: contextItems, error: contextError } = await admin
        .from('user_context_items')
        .select('collection_id, type')
        .eq('user_id', userId)
        .not('collection_id', 'is', null);

    if (contextError) {
        console.error('[getCollectionCountsAction] Error fetching context items:', contextError);
    }

    if (contextItems) {
        contextItems.forEach((item: any) => {
            const id = item.collection_id;
            if (id) {
                counts[id] = (counts[id] || 0) + 1;
            }
        });
    }

    // 3. Fetch ALL conversations for global count
    const { data: conversations, error: conversationsError } = await admin
        .from('conversations')
        .select('id, metadata')
        .eq('user_id', userId);

    if (conversationsError) {
        console.error('[getCollectionCountsAction] Error fetching conversations:', conversationsError);
    }

    // Global conversations count
    if (conversations) {
        counts['conversations'] = conversations.length;

        // Build set of conversations already counted via collection_items
        const linkedConversationIds = new Set<string>();
        if (collectionItems) {
            collectionItems
                .filter((item: any) => item.item_type === 'CONVERSATION')
                .forEach((item: any) => {
                    linkedConversationIds.add(`${item.collection_id}:${item.item_id}`);
                });
        }

        // Count conversations from metadata.collection_ids (legacy) - only if NOT already in collection_items
        conversations.forEach((conv: any) => {
            const metadataCollections = conv.metadata?.collection_ids || conv.metadata?.collections;
            if (Array.isArray(metadataCollections)) {
                metadataCollections.forEach((cId: string) => {
                    // Only count if not already linked via collection_items
                    if (!linkedConversationIds.has(`${cId}:${conv.id}`)) {
                        counts[cId] = (counts[cId] || 0) + 1;
                    }
                });
            }
        });
    }

    // 4. Count Certifications (courses with badges)
    const { count: certificationCount, error: certError } = await admin
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .not('badges', 'is', null)
        .neq('badges', '{}');

    if (!certError && certificationCount !== null) {
        counts['certifications'] = certificationCount;
    }

    // 5. Virtual Profile Count Logic for Personal Context
    if (personalContextId) {
        const hasProfileItem = contextItems?.some((i: any) => i.collection_id === personalContextId && i.type === 'PROFILE');
        if (!hasProfileItem) {
            counts[personalContextId] = (counts[personalContextId] || 0) + 1;
        }
    }

    // 6. Map UUID counts to system aliases AT THE END (not during iteration to avoid double counting)
    // This creates alias keys that the UI expects (e.g., 'favorites', 'research', 'to_learn', 'personal-context')
    userCollections?.forEach((col: any) => {
        const alias = uuidToAlias[col.id];
        if (alias && counts[col.id] !== undefined) {
            counts[alias] = counts[col.id];
        }
    });

    return counts;
}

// Helper to resolve collection aliases (similar to context.ts but using Admin Client if needed, 
// though here we pass supabase client to reuse connection if possible, or just use admin for everything to be safe)
async function resolveCollectionId(supabase: any, collectionId: string, userId: string): Promise<string | null> {
    const labelMap: Record<string, string> = {
        'favorites': 'Favorites',
        'research': 'Workspace',
        'to_learn': 'Watchlist',
        'personal-context': 'Personal Context'
    };

    const targetLabel = labelMap[collectionId];
    if (!targetLabel) return collectionId; // Already a UUID

    // Use Admin Client to ensure we can find/create system collections even if RLS blocks 'select'
    // Actually, if we are inside a Server Action, we can use the passed 'supabase' if it's admin, or create one.
    // To be safe and reuse code style, let's assume 'supabase' passed here is capable.
    // BUT for system collections, we often need to CREATE them, which requires permissions.
    // Let's use createAdminClient inside here if we suspect RLS issues. 
    // However, the caller will likely use Admin Client.

    const { data } = await supabase
        .from('user_collections')
        .select('id')
        .eq('user_id', userId)
        .eq('label', targetLabel)
        .maybeSingle();

    if (data) return data.id;

    // Auto-create
    let defaultColor = '#64748B';
    if (targetLabel === 'Favorites') defaultColor = '#EAB308';
    if (targetLabel === 'Workspace') defaultColor = '#3B82F6';
    if (targetLabel === 'Watchlist') defaultColor = '#A855F7';

    const { data: newData, error } = await supabase
        .from('user_collections')
        .insert({ user_id: userId, label: targetLabel, color: defaultColor })
        .select('id')
        .single();
    
    if (error) {
        console.error('Error auto-creating collection:', error);
        return null;
    }
    return newData.id;
}

export async function addToCollectionAction(itemId: string, itemType: string, collectionIdOrAlias: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    const admin = createAdminClient();
    const resolvedId = await resolveCollectionId(admin, collectionIdOrAlias, user.id);

    if (!resolvedId) return { success: false, error: 'Collection not found' };

    const { error } = await admin
        .from('collection_items')
        .insert({
            item_id: itemId,
            item_type: itemType,
            course_id: itemType === 'COURSE' ? parseInt(itemId, 10) : null,
            collection_id: resolvedId
        });

    if (error) {
        if (error.code === '23505') return { success: true }; // Ignore duplicate
        console.error('Error adding to collection:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
}

export async function removeFromCollectionAction(itemId: string, collectionIdOrAlias: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    const admin = createAdminClient();
    const resolvedId = await resolveCollectionId(admin, collectionIdOrAlias, user.id);

    if (!resolvedId) return { success: false, error: 'Collection not found' };

    const { error } = await admin
        .from('collection_items')
        .delete()
        .eq('collection_id', resolvedId)
        .or(`course_id.eq.${parseInt(itemId, 10)},item_id.eq.${itemId}`);

    if (error) {
        console.error('Error removing from collection:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
}

export async function syncCourseCollectionsAction(userId: string, courseId: string | number, targetIds: string[]) {
    const admin = createAdminClient();
    
    // 1. Resolve Targets
    const resolvedTargetIds: string[] = [];
    for (const id of targetIds) {
        if (id === 'new') continue;
        const resolved = await resolveCollectionId(admin, id, userId);
        if (resolved) resolvedTargetIds.push(resolved);
    }
    
    const cid = typeof courseId === 'string' ? parseInt(courseId, 10) : courseId;
    if (isNaN(cid)) return { success: false, error: 'Invalid course ID' };

    // 2. Fetch Existing
    const { data: existing } = await admin
        .from('collection_items')
        .select('collection_id')
        .eq('course_id', cid)
        .eq('item_type', 'COURSE'); 
        
    const existingSet = new Set(existing?.map((i:any) => i.collection_id) || []);
    const targetSet = new Set(resolvedTargetIds);
    
    // 3. Diff
    const toAdd = resolvedTargetIds.filter(id => !existingSet.has(id));
    const toRemove = [...existingSet].filter(id => !targetSet.has(id as string));
    
    // 4. Execute
    if (toAdd.length > 0) {
        const rows = toAdd.map(rid => ({
            collection_id: rid,
            item_type: 'COURSE',
            item_id: courseId,
            course_id: cid
        }));
        await admin.from('collection_items').insert(rows);
    }
    
    if (toRemove.length > 0) {
         await admin
            .from('collection_items')
            .delete()
            .eq('course_id', cid)
            .eq('item_type', 'COURSE')
            .in('collection_id', toRemove);
    }
    
    revalidatePath('/dashboard');
    return { success: true };
}

export async function syncConversationCollectionsAction(userId: string, conversationId: string, targetIds: string[]) {
    const admin = createAdminClient();

    // 1. Resolve Targets
    const resolvedTargetIds: string[] = [];
    for (const id of targetIds) {
        if (id === 'new') continue;
        const resolved = await resolveCollectionId(admin, id, userId);
        if (resolved) resolvedTargetIds.push(resolved);
    }
    
    // 2. Update Metadata (Legacy + Hybrid)
    const { data: conv } = await admin.from('conversations').select('metadata').eq('id', conversationId).single();
    const newMetadata = {
        ...(conv?.metadata || {}),
        collection_ids: resolvedTargetIds,
        collections: resolvedTargetIds
    };
    
    await admin.from('conversations').update({ 
        metadata: newMetadata,
        updated_at: new Date().toISOString() 
    }).eq('id', conversationId);
    
    // 3. Update collection_items (Standard)
    const { data: existing } = await admin
        .from('collection_items')
        .select('collection_id')
        .eq('item_id', conversationId)
        .eq('item_type', 'CONVERSATION');

    const existingSet = new Set(existing?.map((i:any) => i.collection_id) || []);
    const targetSet = new Set(resolvedTargetIds);
    
    const toAdd = resolvedTargetIds.filter(id => !existingSet.has(id));
    const toRemove = [...existingSet].filter(id => !targetSet.has(id as string));
    
    if (toAdd.length > 0) {
        const rows = toAdd.map(rid => ({
            collection_id: rid,
            item_type: 'CONVERSATION',
            item_id: conversationId
        }));
        await admin.from('collection_items').insert(rows);
    }
    
    if (toRemove.length > 0) {
         await admin
            .from('collection_items')
            .delete()
            .eq('item_id', conversationId)
            .eq('item_type', 'CONVERSATION')
            .in('collection_id', toRemove);
    }
    
    revalidatePath('/dashboard');
    return { success: true };
}
