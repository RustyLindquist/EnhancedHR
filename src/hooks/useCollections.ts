import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Course } from '@/types';
import { getCollectionDetailsAction } from '@/app/actions/context';

export interface UserCollectionItem {
    id: string;
    item_id: string;
    item_type: string;
    collection_id: string;
}

export function useCollections(initialCourses: Course[]) {
    const [savedItemIds, setSavedItemIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    
    // Map of internal collection ID to item IDs
    // For now we primarily use this to track 'isSaved' state for courses
    
    const supabase = createClient();

    // Helper to resolve collection aliases (favorites, research, etc.) to actual UUIDs
    const resolveCollectionId = async (userId: string, alias: string): Promise<string | null> => {
        const labelMap: Record<string, string> = {
            'favorites': 'Favorites',
            'research': 'Workspace',
            'to_learn': 'Watchlist',
            'personal-context': 'Personal Context'
        };
        
        const targetLabel = labelMap[alias];
        if (!targetLabel) return alias; // Already a UUID, return as-is
        
        const { data, error } = await supabase
            .from('user_collections')
            .select('id')
            .eq('user_id', userId)
            .eq('label', targetLabel)
            .eq('user_id', userId)
            .eq('label', targetLabel)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();
        
        if (error) {
            console.error('[resolveCollectionId] Error:', error);
            return null;
        }
        
        if (!data) {
            // Auto-create the collection if it doesn't exist
            console.log(`[resolveCollectionId] Creating missing collection: ${targetLabel}`);
            const { data: newData, error: createError } = await supabase
                .from('user_collections')
                .insert({ user_id: userId, label: targetLabel })
                .select('id')
                .single();
            
            if (createError) {
                console.error('[resolveCollectionId] Failed to create:', createError);
                return null;
            }
            return newData.id;
        }
        
        return data.id;
    };

    // Fetch collections on mount
    useEffect(() => {
        const fetchCollections = async () => {
             const { data: { user } } = await supabase.auth.getUser();
             if (!user) return;

             setLoading(true);
             // TODO: This logic was trying to get ALL saved items. 
             // Without user_id in collection_items, we'd need to fetch user_collections then join.
             // For now, let's just fetch user_collections to ensure connection.
             // Real implementation skipped to focus on Personal Context fix.
             const { data, error } = await supabase
                .from('user_collections')
                .select('id, label')
                .eq('user_id', user.id);

             if (error) {
                 console.error('Failed to fetch user collections:', error);
             } else if (data) {
                 // TODO: Restore savedItemIds logic by fetching items for these collections
                 // const ids = new Set(data.map(item => item.item_id));
                 setSavedItemIds(new Set());
             }
             setLoading(false);
        };

        fetchCollections();
    }, []);

    const addToCollection = useCallback(async (itemId: string, itemType: string, collectionId: string) => {
        // Optimistic update
        setSavedItemIds(prev => new Set(prev).add(itemId));

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Resolve alias to actual UUID
        const resolvedId = await resolveCollectionId(user.id, collectionId);
        if (!resolvedId) {
            console.error('[addToCollection] Failed to resolve collection:', collectionId);
            setSavedItemIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(itemId);
                return newSet;
            });
            return;
        }

        // Insert using correct column name (course_id, not item_id)
        const { error } = await supabase
            .from('collection_items')
            .insert({
                item_id: itemId,
                item_type: itemType,
                course_id: parseInt(itemId, 10),
                collection_id: resolvedId
            });

        if (error) {
            console.error('[addToCollection] Failed:', error);
            // Revert optimistic update
            setSavedItemIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(itemId);
                return newSet;
            });
        } else {
            console.log('[addToCollection] Success! Course', itemId, 'added to', resolvedId);
        }
    }, [supabase]);

    const removeFromCollection = useCallback(async (itemId: string, collectionId: string) => {
        // Optimistic update
        setSavedItemIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(itemId);
            return newSet;
        });

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Resolve alias to actual UUID
        const resolvedId = await resolveCollectionId(user.id, collectionId);
        if (!resolvedId) {
            console.error('[removeFromCollection] Failed to resolve collection:', collectionId);
            setSavedItemIds(prev => new Set(prev).add(itemId));
            return;
        }

        const { error } = await supabase
            .from('collection_items')
            .delete()
            .match({ collection_id: resolvedId })
            .or(`course_id.eq.${parseInt(itemId, 10)},item_id.eq.${itemId}`);
            
         if (error) {
             console.error('[removeFromCollection] Failed:', error);
             // Revert
             setSavedItemIds(prev => new Set(prev).add(itemId));
         }
    }, [supabase]);

    // Fetches full details for items in a specific collection
    const fetchCollectionItems = useCallback(async (collectionId: string) => {
        try {
            console.log(`[fetchCollectionItems] Fetching for: ${collectionId}`);
            
            // Use Server Action to bypass RLS and get consistent resolution
            const { courses, contextItems } = await getCollectionDetailsAction(collectionId);
            
            console.log(`[fetchCollectionItems] Received: ${courses.length} courses, ${contextItems.length} context items`);

            // Map Context Items for Display
            const mappedContext = contextItems.map(item => ({
                ...item,
                itemType: (() => {
                    if (item.type === 'AI_INSIGHT') return 'AI_INSIGHT';
                    if (item.type === 'PROFILE') return 'PROFILE';
                    if (item.type === 'FILE') return 'FILE';
                    return 'CUSTOM_CONTEXT';
                })()
            }));

            // Combine and Return
            return [...courses, ...mappedContext];

        } catch (error) {
            console.error('Error in fetchCollectionItems:', error);
            return [];
        }
    }, []);

    return {
        savedItemIds,
        loading,
        addToCollection,
        removeFromCollection,
        fetchCollectionItems
    };
}
