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

    // Fetch User Collections for Alias Mapping (ordered by created_at for consistent resolution)
    const { data: userCollections, error: userCollError } = await admin
        .from('user_collections')
        .select('id, label, is_custom, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (userCollError) {
        console.error('[getCollectionCountsAction] Error fetching user collections:', userCollError);
    }

    // DIAGNOSTIC: Log all collections to identify duplicates
    console.log('[getCollectionCountsAction] All collections:', userCollections?.map(c => ({
        id: c.id,
        label: c.label,
        is_custom: c.is_custom,
        created_at: c.created_at
    })));

    // Build UUID -> Alias map for system collections (based on label)
    // Only map the FIRST (oldest) collection for each label to ensure consistent counts
    const uuidToAlias: Record<string, string> = {};
    const aliasToUuid: Record<string, string> = {}; // Track which alias already has a UUID assigned
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

            // Only set personalContextId once (first/oldest)
            if (lowerLabel === 'personal context' && !personalContextId) {
                personalContextId = c.id;
            }

            // Map UUID to alias only if this alias hasn't been assigned yet (first wins)
            if (lowerLabel && labelToAlias[lowerLabel]) {
                const alias = labelToAlias[lowerLabel];
                if (!aliasToUuid[alias]) {
                    uuidToAlias[c.id] = alias;
                    aliasToUuid[alias] = c.id;
                }
            }
        });
    }

    // DIAGNOSTIC: Log primary collection mapping
    console.log('[getCollectionCountsAction] Primary collections (aliasToUuid):', aliasToUuid);

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

    // 4b. Count Notes
    const { count: notesCount, error: notesError } = await admin
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (!notesError && notesCount !== null) {
        counts['notes'] = notesCount;
    }

    // 5. Virtual Profile Count Logic for Personal Context
    if (personalContextId) {
        const hasProfileItem = contextItems?.some((i: any) => i.collection_id === personalContextId && i.type === 'PROFILE');
        if (!hasProfileItem) {
            counts[personalContextId] = (counts[personalContextId] || 0) + 1;
        }
    }

    // DIAGNOSTIC: Log counts by UUID before alias mapping
    console.log('[getCollectionCountsAction] Counts by UUID (before alias mapping):',
        Object.entries(counts)
            .filter(([key]) => key.includes('-')) // Only UUIDs
            .map(([uuid, count]) => {
                const col = userCollections?.find(c => c.id === uuid);
                return { uuid, label: col?.label, count, isPrimary: !!uuidToAlias[uuid] };
            })
    );

    // 6. Map UUID counts to system aliases AT THE END (not during iteration to avoid double counting)
    // This creates alias keys that the UI expects (e.g., 'favorites', 'research', 'to_learn', 'personal-context')
    userCollections?.forEach((col: any) => {
        const alias = uuidToAlias[col.id];
        if (alias && counts[col.id] !== undefined) {
            counts[alias] = counts[col.id];
        }
    });

    // DIAGNOSTIC: Log final counts
    console.log('[getCollectionCountsAction] Final counts:', counts);

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

    // Use consistent ordering to ensure we always get the same collection
    // when there are duplicates (matches context.ts resolution)
    const { data } = await supabase
        .from('user_collections')
        .select('id')
        .eq('user_id', userId)
        .eq('label', targetLabel)
        .order('created_at', { ascending: true })
        .limit(1)
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
    console.log('[syncCourseCollectionsAction] Called with:', { userId, courseId, targetIds });
    const admin = createAdminClient();

    // 1. Resolve Targets
    const resolvedTargetIds: string[] = [];
    for (const id of targetIds) {
        if (id === 'new') continue;
        const resolved = await resolveCollectionId(admin, id, userId);
        console.log('[syncCourseCollectionsAction] Resolved', id, '→', resolved);
        if (resolved) resolvedTargetIds.push(resolved);
    }
    console.log('[syncCourseCollectionsAction] Resolved target IDs:', resolvedTargetIds);

    const cid = typeof courseId === 'string' ? parseInt(courseId, 10) : courseId;
    if (isNaN(cid)) return { success: false, error: 'Invalid course ID' };

    // 2. Fetch Existing (only for this user's collections)
    // First get user's collection IDs
    const { data: userCollections } = await admin
        .from('user_collections')
        .select('id')
        .eq('user_id', userId);
    const userCollectionIds = userCollections?.map(c => c.id) || [];
    console.log('[syncCourseCollectionsAction] User collection IDs:', userCollectionIds);

    const { data: existing } = await admin
        .from('collection_items')
        .select('collection_id')
        .eq('course_id', cid)
        .eq('item_type', 'COURSE')
        .in('collection_id', userCollectionIds.length > 0 ? userCollectionIds : ['__none__']);
    console.log('[syncCourseCollectionsAction] Existing items (filtered by user):', existing);

    const existingSet = new Set(existing?.map((i:any) => i.collection_id) || []);
    const targetSet = new Set(resolvedTargetIds);

    // 3. Diff
    const toAdd = resolvedTargetIds.filter(id => !existingSet.has(id));
    const toRemove = [...existingSet].filter(id => !targetSet.has(id as string));
    console.log('[syncCourseCollectionsAction] Diff:', { toAdd, toRemove });

    // 4. Execute
    if (toAdd.length > 0) {
        const rows = toAdd.map(rid => ({
            collection_id: rid,
            item_type: 'COURSE',
            item_id: courseId,
            course_id: cid
        }));
        console.log('[syncCourseCollectionsAction] Inserting rows:', rows);
        const { error: insertError } = await admin.from('collection_items').insert(rows);
        if (insertError) console.error('[syncCourseCollectionsAction] Insert error:', insertError);
    }

    if (toRemove.length > 0) {
        console.log('[syncCourseCollectionsAction] Removing from collections:', toRemove);
         await admin
            .from('collection_items')
            .delete()
            .eq('course_id', cid)
            .eq('item_type', 'COURSE')
            .in('collection_id', toRemove);
    }

    revalidatePath('/dashboard');
    console.log('[syncCourseCollectionsAction] Done');
    return { success: true };
}

export async function syncConversationCollectionsAction(userId: string, conversationId: string, targetIds: string[]) {
    const admin = createAdminClient();

    // Nav filter IDs that are not real collections - filter these out
    const NAV_FILTER_IDS = ['conversations', 'prometheus', 'dashboard', 'academy', 'certifications', 'instructors'];

    // 1. Resolve Targets (filter out nav-filter IDs)
    const resolvedTargetIds: string[] = [];
    for (const id of targetIds) {
        if (id === 'new' || NAV_FILTER_IDS.includes(id)) continue;
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

/**
 * Add a tool conversation to a collection
 */
export async function addToolConversationToCollectionAction(conversationId: string, collectionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    const admin = createAdminClient();
    const resolvedId = await resolveCollectionId(admin, collectionId, user.id);

    if (!resolvedId) return { success: false, error: 'Collection not found' };

    // 1. Update conversation metadata
    const { data: conv } = await admin
        .from('conversations')
        .select('metadata')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();

    if (!conv) return { success: false, error: 'Conversation not found' };

    const currentCollections = conv.metadata?.collection_ids || [];
    if (!currentCollections.includes(resolvedId)) {
        const newMetadata = {
            ...conv.metadata,
            collection_ids: [...currentCollections, resolvedId],
            collections: [...currentCollections, resolvedId]
        };

        await admin
            .from('conversations')
            .update({ metadata: newMetadata, updated_at: new Date().toISOString() })
            .eq('id', conversationId);
    }

    // 2. Add to collection_items
    const { error } = await admin
        .from('collection_items')
        .insert({
            item_id: conversationId,
            item_type: 'TOOL_CONVERSATION',
            collection_id: resolvedId
        });

    if (error && error.code !== '23505') { // Ignore duplicate
        console.error('Error adding tool conversation to collection:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
}

/**
 * Remove a tool conversation from a collection
 */
export async function removeToolConversationFromCollectionAction(conversationId: string, collectionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    const admin = createAdminClient();
    const resolvedId = await resolveCollectionId(admin, collectionId, user.id);

    if (!resolvedId) return { success: false, error: 'Collection not found' };

    // 1. Update conversation metadata
    const { data: conv } = await admin
        .from('conversations')
        .select('metadata')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();

    if (conv) {
        const currentCollections = conv.metadata?.collection_ids || [];
        const newCollections = currentCollections.filter((id: string) => id !== resolvedId);
        const newMetadata = {
            ...conv.metadata,
            collection_ids: newCollections,
            collections: newCollections
        };

        await admin
            .from('conversations')
            .update({ metadata: newMetadata, updated_at: new Date().toISOString() })
            .eq('id', conversationId);
    }

    // 2. Remove from collection_items
    const { error } = await admin
        .from('collection_items')
        .delete()
        .eq('item_id', conversationId)
        .eq('item_type', 'TOOL_CONVERSATION')
        .eq('collection_id', resolvedId);

    if (error) {
        console.error('Error removing tool conversation from collection:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
}

/**
 * Get the collection IDs that an item belongs to.
 * Used by AddCollectionModal to show correct checkbox state.
 */
export async function getCollectionsForItemAction(itemId: string, itemType: string): Promise<{ success: boolean; collectionIds: string[]; error?: string }> {
    console.log('[getCollectionsForItemAction] Called with:', { itemId, itemType });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    console.log('[getCollectionsForItemAction] User:', user?.id);

    if (!user) return { success: false, collectionIds: [], error: 'Unauthorized' };

    const admin = createAdminClient();

    // Get all user collections to filter results
    const { data: userCollections } = await admin
        .from('user_collections')
        .select('id')
        .eq('user_id', user.id);

    const userCollectionIds = new Set(userCollections?.map(c => c.id) || []);
    console.log('[getCollectionsForItemAction] User collections:', Array.from(userCollectionIds));

    // Get collection memberships from collection_items table
    let collectionIds: string[] = [];

    if (itemType === 'COURSE') {
        // For courses, we need to check both by item_id and course_id
        const courseIdNum = parseInt(itemId, 10);
        const { data: items } = await admin
            .from('collection_items')
            .select('collection_id')
            .eq('item_type', 'COURSE')
            .or(`item_id.eq.${itemId},course_id.eq.${isNaN(courseIdNum) ? -1 : courseIdNum}`);

        console.log('[getCollectionsForItemAction] Raw collection_items for course:', items);
        const allCollectionIds = items?.map(i => i.collection_id) || [];
        console.log('[getCollectionsForItemAction] All collection IDs before filter:', allCollectionIds);
        collectionIds = allCollectionIds.filter(id => userCollectionIds.has(id));
        console.log('[getCollectionsForItemAction] Filtered collection IDs:', collectionIds);
    } else if (itemType === 'CONVERSATION' || itemType === 'TOOL_CONVERSATION') {
        // For conversations, also check metadata for legacy data
        const { data: items } = await admin
            .from('collection_items')
            .select('collection_id')
            .eq('item_id', itemId)
            .in('item_type', ['CONVERSATION', 'TOOL_CONVERSATION']);

        const fromCollectionItems = items?.map(i => i.collection_id).filter(id => userCollectionIds.has(id)) || [];

        // Also check conversation metadata for legacy collection_ids
        const { data: conv } = await admin
            .from('conversations')
            .select('metadata')
            .eq('id', itemId)
            .eq('user_id', user.id)
            .single();

        const fromMetadata = (conv?.metadata?.collection_ids || []).filter((id: string) => userCollectionIds.has(id));

        // Combine and dedupe
        collectionIds = [...new Set([...fromCollectionItems, ...fromMetadata])];
    } else {
        // Generic lookup for other item types (MODULE, LESSON, etc.)
        const { data: items } = await admin
            .from('collection_items')
            .select('collection_id')
            .eq('item_id', itemId)
            .eq('item_type', itemType);

        collectionIds = items?.map(i => i.collection_id).filter(id => userCollectionIds.has(id)) || [];
    }

    console.log('[getCollectionsForItemAction] Final result:', { success: true, collectionIds });
    return { success: true, collectionIds };
}

/**
 * Cleanup duplicate collections for the current user.
 * - Moves items from duplicate collections to the primary (oldest) collection
 * - Deletes duplicate collections
 * - Returns a summary of what was cleaned up
 */
export async function cleanupDuplicateCollectionsAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    const admin = createAdminClient();

    // System collection labels to clean up
    const systemLabels = ['Favorites', 'Workspace', 'Watchlist', 'Personal Context'];

    const results: {
        label: string;
        primaryId: string;
        duplicatesRemoved: number;
        itemsMoved: number;
    }[] = [];

    for (const label of systemLabels) {
        // Find all collections with this label, ordered by created_at
        const { data: collections } = await admin
            .from('user_collections')
            .select('id, label, created_at')
            .eq('user_id', user.id)
            .ilike('label', label)
            .order('created_at', { ascending: true });

        if (!collections || collections.length <= 1) {
            // No duplicates for this label
            continue;
        }

        const primaryCollection = collections[0];
        const duplicates = collections.slice(1);
        const duplicateIds = duplicates.map(d => d.id);

        console.log(`[cleanupDuplicateCollections] ${label}: Primary=${primaryCollection.id}, Duplicates=${duplicateIds.length}`);

        // 1. Move collection_items from duplicates to primary
        const { data: itemsToMove } = await admin
            .from('collection_items')
            .select('*')
            .in('collection_id', duplicateIds);

        let itemsMoved = 0;
        if (itemsToMove && itemsToMove.length > 0) {
            for (const item of itemsToMove) {
                // Check if this item already exists in primary
                const { data: existing } = await admin
                    .from('collection_items')
                    .select('collection_id')
                    .eq('collection_id', primaryCollection.id)
                    .eq('item_id', item.item_id)
                    .eq('item_type', item.item_type)
                    .maybeSingle();

                if (!existing) {
                    // Move item to primary collection
                    await admin
                        .from('collection_items')
                        .update({ collection_id: primaryCollection.id })
                        .eq('collection_id', item.collection_id)
                        .eq('item_id', item.item_id)
                        .eq('item_type', item.item_type);
                    itemsMoved++;
                } else {
                    // Delete duplicate item
                    await admin
                        .from('collection_items')
                        .delete()
                        .eq('collection_id', item.collection_id)
                        .eq('item_id', item.item_id)
                        .eq('item_type', item.item_type);
                }
            }
        }

        // 2. Move user_context_items from duplicates to primary
        const { data: contextToMove } = await admin
            .from('user_context_items')
            .select('*')
            .in('collection_id', duplicateIds);

        if (contextToMove && contextToMove.length > 0) {
            for (const item of contextToMove) {
                // Check if this item already exists in primary
                const { data: existing } = await admin
                    .from('user_context_items')
                    .select('id')
                    .eq('collection_id', primaryCollection.id)
                    .eq('id', item.id)
                    .maybeSingle();

                if (!existing) {
                    await admin
                        .from('user_context_items')
                        .update({ collection_id: primaryCollection.id })
                        .eq('id', item.id);
                    itemsMoved++;
                }
            }
        }

        // 3. Delete duplicate collections
        const { error: deleteError } = await admin
            .from('user_collections')
            .delete()
            .in('id', duplicateIds);

        if (deleteError) {
            console.error(`[cleanupDuplicateCollections] Error deleting duplicates for ${label}:`, deleteError);
        }

        results.push({
            label,
            primaryId: primaryCollection.id,
            duplicatesRemoved: duplicates.length,
            itemsMoved
        });
    }

    console.log('[cleanupDuplicateCollections] Results:', results);

    revalidatePath('/dashboard');
    return {
        success: true,
        results,
        summary: `Cleaned up ${results.reduce((sum, r) => sum + r.duplicatesRemoved, 0)} duplicate collections, moved ${results.reduce((sum, r) => sum + r.itemsMoved, 0)} items`
    };
}
