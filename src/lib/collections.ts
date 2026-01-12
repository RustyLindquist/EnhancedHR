
import { createClient } from '@/lib/supabase/client';
import { Collection } from '@/types';

// Fetch all personal collections for a user (excludes org collections)
export async function fetchUserCollections(userId: string): Promise<Collection[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('user_collections')
    .select('*')
    .eq('user_id', userId)
    .or('is_org_collection.is.null,is_org_collection.eq.false') // Exclude org collections
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching user collections:', error);
    return [];
  }

  return data.map((col: any) => ({
    id: col.id,
    label: col.label,
    color: col.color,
    isCustom: col.is_custom
  }));
}

// Fetch all bookmarked items (course IDs) mapped by collection ID
// Returns a map: { collectionId: [courseId1, courseId2, ...] }
export async function fetchCollectionItems(userId: string): Promise<Record<string, string[]>> {
  const supabase = createClient();

  // We need to join user_collections to filter by user_id
  const { data, error } = await supabase
    .from('collection_items')
    .select(`
      collection_id,
      course_id,
      user_collections!inner(user_id)
    `)
    .eq('user_collections.user_id', userId);

  if (error) {
    console.error('Error fetching collection items:', error);
    return {};
  }

  const map: Record<string, string[]> = {};
  
  data.forEach((item: any) => {
    const colId = item.collection_id;
    if (!map[colId]) map[colId] = [];
    map[colId].push(item.course_id.toString());
  });

  return map;
}

// Create a new custom collection
export async function createCollection(userId: string, label: string, color: string): Promise<Collection | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('user_collections')
    .insert({
      user_id: userId,
      label,
      color,
      is_custom: true
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating collection:', error);
    return null;
  }

  return {
    id: data.id,
    label: data.label,
    color: data.color,
    isCustom: data.is_custom
  };
}

// Add an item to a collection
export async function addToCollection(collectionId: string, courseId: number) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('collection_items')
    .insert({
      collection_id: collectionId,
      course_id: courseId
    });

  if (error) {
    // Ignore duplicate key errors (already in collection)
    if (error.code !== '23505') {
      console.error('Error adding to collection:', error);
      throw error;
    }
  }
}

// Remove an item from a collection
export async function removeFromCollection(collectionId: string, courseId: number) {
  const supabase = createClient();

  const { error } = await supabase
    .from('collection_items')
    .delete()
    .eq('collection_id', collectionId)
    .eq('course_id', courseId);

  if (error) {
    console.error('Error removing from collection:', error);
    throw error;
  }
}

// Sync logic: Update a course's membership in collections
// Logic:
// 1. Get current collections for this course.
// 2. Determine additions and removals.
// 3. Execute.
// Note: This is client-side heavy. Ideally a stored procedure handles sync, but this is acceptable for MVP.
export async function syncCourseCollections(userId: string, courseId: number, targetCollectionIds: string[]) {
    // We assume the frontend state 'targetCollectionIds' is the Source of Truth for "what should be".
    // However, to do this efficiently without a complex merge, we can just:
    // DELETE all for this course? No, that deletes for ALL users if we don't filter by user.
    // BUT collection_items is tied to collection_id.
    // We first need to know which collections belong to THIS user.
    
    // Safety check: Ensure all targetCollectionIds belong to the user? 
    // RLS handles this (cannot insert into collection you don't own).
    
    const supabase = createClient();

    // Strategy:
    // 1. Get all collections this course is currently in FOR THIS USER.
    // 2. Diff.
    // 3. Add/Remove.
    
    // 1. Get current
    const { data: currentItems } = await supabase
        .from('collection_items')
        .select('collection_id, user_collections!inner(user_id)')
        .eq('course_id', courseId)
        .eq('user_collections.user_id', userId);
        
    const currentIds = (currentItems || []).map((i: any) => i.collection_id);
    
    const toAdd = targetCollectionIds.filter(id => !currentIds.includes(id));
    const toRemove = currentIds.filter((id: any) => !targetCollectionIds.includes(id));
    
    // Execute removals
    if (toRemove.length > 0) {
        await supabase
            .from('collection_items')
            .delete()
            .eq('course_id', courseId)
            .in('collection_id', toRemove);
    }
    
    // Execute additions
    if (toAdd.length > 0) {
        const rows = toAdd.map(id => ({
            collection_id: id,
            course_id: courseId
        }));
        
        const { error } = await supabase
            .from('collection_items')
            .insert(rows);
            
        if (error && error.code !== '23505') {
            console.error("Error adding items:", error);
        }
    }
}


// System Collection Mapping Management
// Ensures "Favorites" ("favorites"), "Workspace" ("research"), and "Watchlist" ("to_learn") exist.
// Returns map of { [frontend_id]: uuid }

export const SYSTEM_COLLECTION_IDS = {
    favorites: 'Favorites',
    research: 'Workspace', 
    to_learn: 'Watchlist',
    'personal-context': 'Personal Context'
};

export async function ensureSystemCollections(userId: string): Promise<Record<string, string>> {
    const supabase = createClient();
    
    // 1. Fetch existing system collections
    const { data: existing } = await supabase
        .from('user_collections')
        .select('id, label')
        .eq('user_id', userId)
        .in('label', [
            SYSTEM_COLLECTION_IDS.favorites, 
            SYSTEM_COLLECTION_IDS.research,
            SYSTEM_COLLECTION_IDS.to_learn,
            SYSTEM_COLLECTION_IDS['personal-context']
        ]);
        
    const map: Record<string, string> = {}; // { research: uuid, ... }
    const existingLabels = (existing || []).map((c: any) => c.label);
    
    // Map found ones
    existing?.forEach((c: any) => {
        if (c.label === SYSTEM_COLLECTION_IDS.favorites) map['favorites'] = c.id;
        if (c.label === SYSTEM_COLLECTION_IDS.research) map['research'] = c.id;
        if (c.label === SYSTEM_COLLECTION_IDS.to_learn) map['to_learn'] = c.id;
        if (c.label === SYSTEM_COLLECTION_IDS['personal-context']) map['personal-context'] = c.id;
    });
    
    // 2. Create missing ones
    const toCreate = Object.entries(SYSTEM_COLLECTION_IDS).filter(([, label]) => !existingLabels.includes(label));
    
    for (const [key, label] of toCreate) {
        // Default colors based on constants.ts
        let color = '#3b82f6';
        if (key === 'favorites') color = '#FF2600';
        if (key === 'research') color = '#FF9300';
        if (key === 'to_learn') color = '#78C0F0';
        if (key === 'personal-context') color = '#64748B';
        
        const { data } = await supabase
            .from('user_collections')
            .insert({
                user_id: userId,
                label,
                color,
                is_custom: false
            })
            .select()
            .single();
            
        if (data) {
            map[key] = data.id;
        }
    }
    
    return map;
}

// Fetch total counts for all collections (Courses + Context Items)
export async function fetchCollectionCounts(userId: string): Promise<Record<string, number>> {
    const supabase = createClient();
    const counts: Record<string, number> = {};

    // 1. Count Courses (collection_items)
    // We can use a raw count query or fetch all and count.
    // For MVP, fetching 'collection_id' is cheap enough.
    const { data: courseItems, error: courseError } = await supabase
        .from('collection_items')
        .select('collection_id, user_collections!inner(user_id)')
        .eq('user_collections.user_id', userId);

    if (!courseError && courseItems) {
        courseItems.forEach((item: any) => {
            const id = item.collection_id;
            counts[id] = (counts[id] || 0) + 1;
        });
    }

    // 2. Count Context Items (user_context_items)
    // Table: user_context_items(id, collection_id, user_id, ...)
    const { data: contextItems, error: contextError } = await supabase
        .from('user_context_items')
        .select('collection_id, type')
        .eq('user_id', userId)
        .not('collection_id', 'is', null);

    const { data: pcCollection } = await supabase
        .from('user_collections')
        .select('id')
        .eq('user_id', userId)
        .eq('label', SYSTEM_COLLECTION_IDS['personal-context'])
        .maybeSingle();

    const personalContextId = pcCollection?.id;
    let hasProfile = false;

    if (!contextError && contextItems) {
        contextItems.forEach((item: any) => {
            const id = item.collection_id;
            if (id) {
                counts[id] = (counts[id] || 0) + 1;
                if (id === personalContextId && item.type === 'PROFILE') {
                    hasProfile = true;
                }
            }
        });
    }

    // Virtual Profile Logic: If Personal Context exists but has no PROFILE item, add 1 for virtual card
    if (personalContextId && !hasProfile) {
        counts[personalContextId] = (counts[personalContextId] || 0) + 1;
    }

    // 3. Count Conversations (from conversations table)
    const { data: conversations, error: conversationError } = await supabase
        .from('conversations')
        .select('metadata')
        .eq('user_id', userId);

    if (!conversationError && conversations) {
        counts['conversations'] = conversations.length;
        counts['prometheus'] = conversations.length; // Map provided for Prometheus view too
    }

    // 4. Count Certifications (Courses with badges)
    // We assume 'Certifications' collection shows all courses that have at least one badge (SHRM/HRCI)
    // badges is a text[] or jsonb column. If text[], checks likely need overlapping.
    // If we assume any badge counts:
    const { count: certificationCount, error: certError } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .not('badges', 'is', null) 
        .neq('badges', '{}'); // Assuming it's an array and empty means no badges

    if (!certError && certificationCount !== null) {
        counts['certifications'] = certificationCount;
    }


    // 5. Map UUIDs to System Aliases
    const { data: userCols } = await supabase
        .from('user_collections')
        .select('id, label')
        .eq('user_id', userId);

    const LABEL_TO_ALIAS: Record<string, string> = {
        'Favorites': 'favorites',
        'Workspace': 'research',
        'Watchlist': 'to_learn',
        'Personal Context': 'personal-context'
    };

    userCols?.forEach((col: any) => {
        const alias = LABEL_TO_ALIAS[col.label];
        if (alias && counts[col.id]) {
            counts[alias] = counts[col.id];
        }
    });

    return counts;
}

// Sync logic for Conversations: Update metadata with collection IDs
export async function syncConversationCollections(userId: string, conversationId: string, targetCollectionIds: string[]) {
    const supabase = createClient();
    
    // 1. Fetch current metadata
    const { data: conv, error: fetchError } = await supabase
        .from('conversations')
        .select('metadata')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();
        
    if (fetchError || !conv) {
        console.error("Error fetching conversation for sync:", fetchError);
        return;
    }
    
    // 2. Update metadata
    // We strictly set the collection_ids to the target list (Source of Truth from frontend)
    const currentMeta = conv.metadata || {};
    const newMeta = {
        ...currentMeta,
        collection_ids: targetCollectionIds
    };
    
    const { error: updateError } = await supabase
        .from('conversations')
        .update({ 
            metadata: newMeta,
            is_saved: targetCollectionIds.length > 0
        })
        .eq('id', conversationId)
        .eq('user_id', userId);
        
    if (updateError) {
        console.error("Error updating conversation collections:", updateError);
    }
}
