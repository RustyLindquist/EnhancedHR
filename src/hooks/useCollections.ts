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

    const addToCollection = useCallback(async (itemId: string, itemType: string, collectionId: string) => {
        // Optimistic update
        setSavedItemIds(prev => new Set(prev).add(itemId));

        const { addToCollectionAction } = await import('@/app/actions/collections');
        const res = await addToCollectionAction(itemId, itemType, collectionId);

        if (!res.success) {
            console.error('[addToCollection] Failed:', res.error);
            // Revert optimistic update
            setSavedItemIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(itemId);
                return newSet;
            });
        } else {
            console.log('[addToCollection] Success! Item', itemId, 'added to', collectionId);
        }
    }, []);

    const removeFromCollection = useCallback(async (itemId: string, collectionId: string) => {
        // Optimistic update
        setSavedItemIds(prev => {
             const newSet = new Set(prev);
             newSet.delete(itemId);
             return newSet;
        });

        const { removeFromCollectionAction } = await import('@/app/actions/collections');
        const res = await removeFromCollectionAction(itemId, collectionId);

         if (!res.success) {
             console.error('[removeFromCollection] Failed:', res.error);
             // Revert
             setSavedItemIds(prev => new Set(prev).add(itemId));
         }
    }, []);

    // Fetches full details for items in a specific collection
    const fetchCollectionItems = useCallback(async (collectionId: string) => {
        try {
            console.log(`[fetchCollectionItems] Fetching for: ${collectionId}`);
            
            // Use Server Action to bypass RLS and get consistent resolution
            const { courses, contextItems, debug } = await getCollectionDetailsAction(collectionId);
            
            if (debug) console.log('[fetchCollectionItems] SERVER ACTION DEBUG:', debug);

            console.log(`[fetchCollectionItems] Received: ${courses.length} courses, ${contextItems.length} context items`);

            // Map Context Items for Display
            const mappedContext = contextItems.map(item => ({
                ...item,
                itemType: (() => {
                    if (item.type === 'AI_INSIGHT') return 'AI_INSIGHT';
                    if (item.type === 'PROFILE') return 'PROFILE';
                    if (item.type === 'FILE') return 'FILE';
                    if (item.type === 'VIDEO') return 'VIDEO';
                    return 'CUSTOM_CONTEXT';
                })()
            }));

            // Combine and Return
            return {
                items: [...courses, ...mappedContext],
                debug: debug
            };

        } catch (error) {
            console.error('Error in fetchCollectionItems:', error);
            return { items: [], debug: { error } };
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
