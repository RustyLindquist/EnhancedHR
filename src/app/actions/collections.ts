'use server';

import { createClient } from '@/lib/supabase/server';
import { resolveCollectionId } from './context';
import { revalidatePath } from 'next/cache';

export async function getCollectionCountsAction(): Promise<Record<string, number>> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return {};

    // 1. Count items in collection_items (Courses & Legacy items)
    // Group by collection_id
    const { data: collectionItems, error: collectionError } = await supabase
        .from('collection_items')
        .select('collection_id')
        .eq('user_id', user.id); // Assuming user_id exists on collection_items or we filter by collection ownership? 
        // Wait, collection_items is a link table. It might not have user_id if shared? 
        // But for "User Collections", we should join user_collections?
        // Actually, checking schema_dump or previous queries, we usually query by collection_id.
        // But we want ALL counts.
        // Better: Fetch all user_collections, then count items? 
        // OR: select collection_id, count(*) from collection_items where collection_id IN (user_collections)
        
    // Let's rely on RLS. If we select *, we get what we see.
    // Ideally we'd use .rpc() for performance but let's do a raw select for now as simpler.
    
    // We need to know WHICH collections belong to the user first? 
    // Actually, let's just count everything we can see in collection_items and user_context_items
    
    // Fetch user collections to map IDs to Labels if needed, but here we just need ID -> Count
    
    const { data: userCollections } = await supabase
        .from('user_collections')
        .select('id, label')
        .eq('user_id', user.id);
        
    const collectionIds = userCollections?.map(c => c.id) || [];
    
    const counts: Record<string, number> = {};
    
    // Initialize with 0
    collectionIds.forEach(id => counts[id] = 0);
    
    // Map system collection IDs
    // We need to resolve 'favorites', 'watchlist', etc. to their UUIDs to aggregate?
    // The previous logic in context.ts resolves 'favorites' -> specific UUID.
    // So 'favorites' count needs to key off 'favorites' string OR the metrics need to be intelligent.
    // For the UI, it expects keys like 'favorites', 'research' etc if that's what the nav ID is.
    // OR the nav uses the UUID? NavigationPanel uses 'favorites' string ID.
    
    const systemMap: Record<string, string> = {};
    userCollections?.forEach(c => {
        if (c.label === 'Favorites') systemMap[c.id] = 'favorites';
        if (c.label === 'Workspace') systemMap[c.id] = 'research';
        if (c.label === 'Watchlist') systemMap[c.id] = 'to_learn';
    });

    // Initialize system keys
    Object.values(systemMap).forEach(sysId => counts[sysId] = 0);

    if (collectionIds.length > 0) {
        // 1. Fetch Collection Items (Courses)
        const { data: cItems } = await supabase
            .from('collection_items')
            .select('collection_id')
            .in('collection_id', collectionIds);
            
        cItems?.forEach((item: any) => {
            // Count for UUID
            counts[item.collection_id] = (counts[item.collection_id] || 0) + 1;
            
            // Also count for System ID alias if exists
            const systemId = systemMap[item.collection_id];
            if (systemId) {
                counts[systemId] = (counts[systemId] || 0) + 1;
            }
        });

        // 2. Fetch User Context Items
        const { data: uItems } = await supabase
            .from('user_context_items')
            .select('collection_id')
            .in('collection_id', collectionIds);
            
        uItems?.forEach((item: any) => {
             // Context items might have collection_id
             if (item.collection_id) {
                 counts[item.collection_id] = (counts[item.collection_id] || 0) + 1;
                 
                 const systemId = systemMap[item.collection_id];
                 if (systemId) {
                     counts[systemId] = (counts[systemId] || 0) + 1;
                 }
             }
        });
        // 3. Fetch Conversations
        const { data: conversations } = await supabase
            .from('conversations')
            .select('metadata, is_saved')
            .eq('user_id', user.id);

        const favoritesId = systemMap['favorites'] || Object.keys(systemMap).find(key => systemMap[key] === 'favorites');
        // Actually systemMap is ID -> "favorites". So find key where value is 'favorites'.
        const favUUID = Object.keys(systemMap).find(key => systemMap[key] === 'favorites');

        conversations?.forEach((conv: any) => {
            // Check metadata.collection_ids
            const collectionIds = conv.metadata?.collection_ids || [];
            
            if (Array.isArray(collectionIds)) {
                // Deduplicate keys to increment for this specific item
                const keysToIncrement = new Set<string>();
                
                collectionIds.forEach((colId: string) => {
                    // Check direct ID (UUID or Alias)
                    if (counts[colId] !== undefined) {
                        keysToIncrement.add(colId);
                    }
                    
                    // Check mapped System ID
                    const systemId = systemMap[colId];
                    if (systemId) {
                        keysToIncrement.add(systemId);
                    }
                });

                keysToIncrement.forEach(key => {
                    counts[key] = (counts[key] || 0) + 1;
                });
            }
        });
    }

    return counts;
}

export async function deleteCollection(collectionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    // Delete the collection
    const { error } = await supabase
        .from('user_collections')
        .delete()
        .eq('id', collectionId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deleting collection:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function renameCollection(collectionId: string, newLabel: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    const { error } = await supabase
        .from('user_collections')
        .update({ label: newLabel })
        .eq('id', collectionId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error renaming collection:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}


export async function addToCollectionAction(itemId: string, itemType: string, collectionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    try {
        const targetCollectionId = await resolveCollectionId(supabase, collectionId, user.id);

        if (!targetCollectionId) {
            return { success: false, error: 'Invalid Collection ID' };
        }

        // --- ENRICHMENT LOGIC ---
        let courseId: number | null = null;
        
        if (itemType === 'COURSE') {
            courseId = parseInt(itemId);
        } else if (itemType === 'MODULE') {
            // Fetch Course ID from Module
            const { data: mod } = await supabase
                .from('modules')
                .select('course_id')
                .eq('id', itemId)
                .single();
            if (mod) courseId = mod.course_id;
        } else if (itemType === 'LESSON') {
             // Fetch Course ID from Lesson -> Module
             const { data: lesson } = await supabase
                .from('lessons')
                .select('module:modules(course_id)')
                .eq('id', itemId)
                .single();
            
            if (lesson && lesson.module) {
                // Supabase joins return object or array depending on relation, usually object for single
                courseId = (lesson.module as any).course_id;
            }
        }

        const { error } = await supabase
            .from('collection_items')
            .upsert({
                collection_id: targetCollectionId,
                item_id: itemId,
                item_type: itemType,
                course_id: courseId, // CRITICAL: Store this for image lookup
                added_at: new Date().toISOString()
            }, { onConflict: 'collection_id, item_id, item_type' });

        if (error) throw error;

        revalidatePath('/dashboard');
        revalidatePath('/academy'); 
        
        return { success: true };

    } catch (error: any) {
        console.error('Error adding to collection:', error);
        return { success: false, error: error.message };
    }
}

export async function removeFromCollectionAction(itemId: string, collectionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    try {
        const targetCollectionId = await resolveCollectionId(supabase, collectionId, user.id);

        if (!targetCollectionId) return { success: false, error: 'Invalid Collection' };

        const { error } = await supabase
            .from('collection_items')
            .delete()
            .eq('collection_id', targetCollectionId)
            .eq('item_id', itemId);

        if (error) throw error;

        revalidatePath('/dashboard');
        return { success: true };

    } catch (error: any) {
        console.error('Error removing from collection:', error);
        return { success: false, error: error.message };
    }
}

export async function syncCourseCollectionsAction(userId: string, courseId: string | number, collectionIds: string[]) {
    const supabase = await createClient(); // Auth client
    
    // Resolve all target collection IDs first
    const resolvedIds: string[] = [];
    for (const id of collectionIds) {
        const rid = await resolveCollectionId(supabase, id, userId);
        if (rid) resolvedIds.push(rid);
    }

    // Get current associations
    const { data: currentLinks } = await supabase
        .from('collection_items')
        .select('collection_id')
        .eq('item_id', String(courseId))
        .eq('item_type', 'COURSE');

    const currentIds = currentLinks?.map(l => l.collection_id) || [];

    // Determine Add/Remove
    const toAdd = resolvedIds.filter(id => !currentIds.includes(id));
    const toRemove = currentIds.filter(id => !resolvedIds.includes(id));

    // Execute
    if (toAdd.length > 0) {
        const start = Date.now();
        const records = toAdd.map(cid => ({
            collection_id: cid,
            item_id: String(courseId),
            item_type: 'COURSE',
            course_id: typeof courseId === 'string' ? parseInt(courseId) : courseId,
            added_at: new Date().toISOString()
        }));
        await supabase.from('collection_items').upsert(records, { onConflict: 'collection_id, item_id, item_type' });
    }

    if (toRemove.length > 0) {
        await supabase.from('collection_items')
            .delete()
            .eq('item_id', String(courseId))
            .eq('item_type', 'COURSE')
            .in('collection_id', toRemove);
    }

    revalidatePath('/dashboard');
    return { success: true };
}

export async function syncConversationCollectionsAction(userId: string, conversationId: string, collectionIds: string[]) {
    const supabase = await createClient();

    // 1. Update Metadata (Legacy/Compat)
    const { data: conv } = await supabase.from('conversations').select('metadata').eq('id', conversationId).single();
    const metadata = conv?.metadata || {};
    metadata.collection_ids = collectionIds; // Store aliases or IDs? Storing whatever passed. 
    // UserDashboard passes Aliases + UUIDs.
    
    await supabase.from('conversations').update({ metadata }).eq('id', conversationId);


    // 2. Sync to collection_items (Unified View)
    // Resolve IDs
    const resolvedIds: string[] = [];
    for (const id of collectionIds) {
        const rid = await resolveCollectionId(supabase, id, userId);
        if (rid) resolvedIds.push(rid);
    }

    // Get current associations
    const { data: currentLinks } = await supabase
        .from('collection_items')
        .select('collection_id')
        .eq('item_id', conversationId)
        .eq('item_type', 'CONVERSATION');

    const currentIds = currentLinks?.map(l => l.collection_id) || [];

    const toAdd = resolvedIds.filter(id => !currentIds.includes(id));
    const toRemove = currentIds.filter(id => !resolvedIds.includes(id));

     if (toAdd.length > 0) {
        const records = toAdd.map(cid => ({
            collection_id: cid,
            item_id: conversationId,
            item_type: 'CONVERSATION',
            // No course_id for conversation
            added_at: new Date().toISOString()
        }));
        await supabase.from('collection_items').upsert(records, { onConflict: 'collection_id, item_id, item_type' });
    }

    if (toRemove.length > 0) {
        await supabase.from('collection_items')
            .delete()
            .eq('item_id', conversationId)
            .eq('item_type', 'CONVERSATION')
            .in('collection_id', toRemove);
    }

    revalidatePath('/dashboard');
    return { success: true };
}
