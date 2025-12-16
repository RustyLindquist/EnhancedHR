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

    // 1. Count Courses (collection_items)
    const { data: courseItems, error: courseError } = await admin
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
    const { data: contextItems, error: contextError } = await admin
        .from('user_context_items')
        .select('collection_id, type')
        .eq('user_id', userId)
        .not('collection_id', 'is', null);

    // Get Personal Context ID to check for Profile
    const { data: pcCollection } = await admin
        .from('user_collections')
        .select('id')
        .eq('user_id', userId)
        .eq('label', 'Personal Context')
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

    // Virtual Profile Logic
    if (personalContextId && !hasProfile) {
        counts[personalContextId] = (counts[personalContextId] || 0) + 1;
    }

    // 3. Count Conversations
    const { data: conversations, error: conversationError } = await admin
        .from('conversations')
        .select('id, user_id, metadata')
        .eq('user_id', userId);

    if (!conversationError && conversations) {
        counts['conversations'] = conversations.length;
        counts['prometheus'] = conversations.length; // Map provided for Prometheus view too
        
        // Count conversations in specific collections (from metadata)
        conversations.forEach((conv: any) => {
            const meta = conv.metadata || {};
            const collectionIds = meta.collection_ids || [];
            
            if (Array.isArray(collectionIds)) {
                collectionIds.forEach((colId: string) => {
                    counts[colId] = (counts[colId] || 0) + 1;
                });
            }
        });
    }

    // 4. Count Certifications
    const { count: certificationCount, error: certError } = await admin
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .not('badges', 'is', null)
        .neq('badges', '{}');

    if (!certError && certificationCount !== null) {
        counts['certifications'] = certificationCount;
    }

    // MAP UUIDs to System Keys (favorites, research, etc.)
    // We do this server-side to avoid client-side RLS on user_collections table
    const { data: userCollections } = await admin
        .from('user_collections')
        .select('id, label')
        .eq('user_id', userId);

    const mappedCounts: Record<string, number> = {};
    const uuidToSystemMap: Record<string, string> = {};

    // System labels map to specific keys in frontend
    const labelToKeyMap: Record<string, string> = {
        'Favorites': 'favorites',
        'Workspace': 'research',
        'Watchlist': 'to_learn',
        'Personal Context': 'personal-context'
    };

    userCollections?.forEach((col: any) => {
        if (labelToKeyMap[col.label]) {
            uuidToSystemMap[col.id] = labelToKeyMap[col.label];
        }
    });

    Object.entries(counts).forEach(([key, val]) => {
        const systemKey = uuidToSystemMap[key];
        if (systemKey) {
            mappedCounts[systemKey] = val;
        } else {
            mappedCounts[key] = val;
        }
    });

    // Ensure conversations count matches 'prometheus' if needed, or keep as is.
    // Preserving special keys that are not UUIDs
    if (counts['conversations']) mappedCounts['conversations'] = counts['conversations'];
    if (counts['prometheus']) mappedCounts['prometheus'] = counts['prometheus'];
    if (counts['certifications']) mappedCounts['certifications'] = counts['certifications'];

    return mappedCounts;
}

// Sync course collections (handling aliases and RLS)
export async function syncCourseCollectionsAction(userId: string, courseId: number, collectionIds: string[]) {
    const admin = createAdminClient();

    // 1. Resolve all Collection IDs (handling aliases like 'favorites')
    const resolvedIds: string[] = [];
    
    for (const id of collectionIds) {
        // Check if it's a known alias
        const aliasMap: Record<string, string> = {
            'favorites': 'Favorites',
            'research': 'Workspace',
            'to_learn': 'Watchlist',
            'personal-context': 'Personal Context'
        };

        const label = aliasMap[id];
        
        if (label) {
            // It's an alias, verify/create
            const { data: existing } = await admin
                .from('user_collections')
                .select('id')
                .eq('user_id', userId)
                .eq('label', label)
                .maybeSingle();
                
            if (existing) {
                resolvedIds.push(existing.id);
            } else {
                // Create it
                // Determine color
                let color = '#3b82f6';
                if (id === 'favorites') color = '#FF2600';
                if (id === 'research') color = '#FF9300';
                if (id === 'to_learn') color = '#78C0F0';
                if (id === 'personal-context') color = '#64748B';

                const { data: newCol } = await admin
                    .from('user_collections')
                    .insert({ user_id: userId, label, color, is_custom: false })
                    .select()
                    .single();
                    
                if (newCol) resolvedIds.push(newCol.id);
            }
        } else {
            // Assume it's already a UUID
            resolvedIds.push(id);
        }
    }

    // 2. Get current items for this course/user
    const { data: currentItems } = await admin
        .from('collection_items')
        .select('collection_id, user_collections!inner(user_id)')
        .eq('course_id', courseId)
        .eq('user_collections.user_id', userId);

    const currentIds = (currentItems || []).map((i: any) => i.collection_id);

    const toAdd = resolvedIds.filter(id => !currentIds.includes(id));
    const toRemove = currentIds.filter((id: any) => !resolvedIds.includes(id));

    // 3. Execute Sync
    if (toRemove.length > 0) {
        await admin
            .from('collection_items')
            .delete()
            .eq('course_id', courseId)
            .in('collection_id', toRemove);
    }

    if (toAdd.length > 0) {
        const rows = toAdd.map(id => ({
            collection_id: id,
            course_id: courseId,
            item_id: courseId.toString(), // Ensure item_id is set for polymorphic consistency
            item_type: 'COURSE'
        }));

        const { error } = await admin
            .from('collection_items')
            .insert(rows);
            
        if (error && error.code !== '23505') {
            console.error('Error adding items:', error);
            return { success: false, error: error.message };
        }
    }

    revalidatePath('/dashboard');
    return { success: true };
}

// Sync conversation collections (metadata update)
export async function syncConversationCollectionsAction(userId: string, conversationId: string, collectionIds: string[]) {
    const admin = createAdminClient();

    // 1. Resolve all Collection IDs (handling aliases like 'favorites')
    const resolvedIds: string[] = [];
    
    for (const id of collectionIds) {
        // Check if it's a known alias
        const aliasMap: Record<string, string> = {
            'favorites': 'Favorites',
            'research': 'Workspace',
            'to_learn': 'Watchlist',
            'personal-context': 'Personal Context'
        };

        const label = aliasMap[id];
        
        if (label) {
            // It's an alias, verify/create
            const { data: existing } = await admin
                .from('user_collections')
                .select('id')
                .eq('user_id', userId)
                .eq('label', label)
                .maybeSingle();
                
            if (existing) {
                resolvedIds.push(existing.id);
            } else {
                // Create it
                // Determine color
                let color = '#3b82f6';
                if (id === 'favorites') color = '#FF2600';
                if (id === 'research') color = '#FF9300';
                if (id === 'to_learn') color = '#78C0F0';
                if (id === 'personal-context') color = '#64748B';

                const { data: newCol } = await admin
                    .from('user_collections')
                    .insert({ user_id: userId, label, color, is_custom: false })
                    .select()
                    .single();
                    
                if (newCol) resolvedIds.push(newCol.id);
            }
        } else {
            // Assume it's already a UUID
            resolvedIds.push(id);
        }
    }

    // 2. Update metadata
    // We fetch the conversation first to preserve other metadata properties if necessary, 
    // though typically we just patch. Supabase 'update' patches the row, but replacing 'metadata' JSONB 
    // replaces the whole object unless we use jsonb_set etc. 
    // Safest is to fetch and merge.
    
    const { data: conv, error: fetchError } = await admin
        .from('conversations')
        .select('metadata')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();
        
    if (fetchError || !conv) {
        console.error("Error fetching conversation for sync:", fetchError);
        return { success: false, error: 'Conversation not found' };
    }
    
    const currentMeta = conv.metadata || {};
    const newMeta = {
        ...currentMeta,
        collection_ids: resolvedIds
    };
    
    const { error: updateError } = await admin
        .from('conversations')
        .update({ 
            metadata: newMeta,
            is_saved: resolvedIds.length > 0
        })
        .eq('id', conversationId)
        .eq('user_id', userId);
        
    if (updateError) {
        console.error("Error updating conversation collections:", updateError);
        return { success: false, error: updateError.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
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
