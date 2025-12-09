import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Course } from '@/types';

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

    // Fetch collections on mount
    useEffect(() => {
        const fetchCollections = async () => {
             const { data: { user } } = await supabase.auth.getUser();
             if (!user) return;

             setLoading(true);
             const { data, error } = await supabase
                .from('user_collections')
                .select('item_id, item_type, collection_id')
                .eq('user_id', user.id);

             if (error) {
                 console.error('Failed to fetch user collections:', error);
             } else if (data) {
                 const ids = new Set(data.map(item => item.item_id));
                 setSavedItemIds(ids);
             }
             setLoading(false);
        };

        fetchCollections();
    }, []);

    const addToCollection = async (itemId: string, itemType: string, collectionId: string) => {
        // Optimistic update
        setSavedItemIds(prev => new Set(prev).add(itemId));

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('user_collections')
            .insert({
                user_id: user.id,
                item_id: itemId,
                item_type: itemType,
                collection_id: collectionId
            });

        if (error) {
            console.error('Failed to add to collection:', error);
            // Revert optimistic update
            setSavedItemIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(itemId);
                return newSet;
            });
        }
    };

    const removeFromCollection = async (itemId: string, collectionId: string) => {
        // Optimistic update
        setSavedItemIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(itemId);
            return newSet;
        });

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('user_collections')
            .delete()
            .eq('user_id', user.id)
            .eq('item_id', itemId)
            .eq('collection_id', collectionId);
            
         if (error) {
             console.error('Failed to remove from collection:', error);
             // Revert
             setSavedItemIds(prev => new Set(prev).add(itemId));
         }
    };

    // Fetches full details for items in a specific collection
    const fetchCollectionItems = async (collectionId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        // 1. Get raw items
        const { data: rawItems, error } = await supabase
            .from('user_collections')
            .select('*')
            .eq('user_id', user.id)
            .eq('collection_id', collectionId);

        if (error || !rawItems) {
            console.error('Error fetching collection items:', error);
            return [];
        }

        // 2. Group by type
        const courseIds = rawItems.filter(i => i.item_type === 'COURSE').map(i => i.item_id); // Course ID is number in DB? mixed
        const conversationIds = rawItems.filter(i => i.item_type === 'CONVERSATION').map(i => i.item_id);
        const moduleIds = rawItems.filter(i => i.item_type === 'MODULE').map(i => i.item_id);
        const lessonIds = rawItems.filter(i => i.item_type === 'LESSON').map(i => i.item_id);
        const resourceIds = rawItems.filter(i => i.item_type === 'RESOURCE').map(i => i.item_id);

        // 3. Parallel Fetch Details
        const promises = [];

        // Courses
        if (courseIds.length > 0) {
            promises.push(
                supabase.from('courses').select('*').in('id', courseIds)
                .then(({ data }) => data?.map((c: any) => ({
                    ...c, 
                    type: 'COURSE', 
                    itemType: 'COURSE',
                    // Map generic fields if needed
                    progress: 0, rating: Number(c.rating), badges: c.badges || []
                })) || [])
            );
        } else promises.push(Promise.resolve([]));

        // Conversations
        if (conversationIds.length > 0) {
             promises.push(
                supabase.from('conversations').select('*').in('id', conversationIds)
                .then(({ data }) => data?.map((c: any) => ({
                    ...c, 
                    type: 'CONVERSATION', 
                    itemType: 'CONVERSATION'
                })) || [])
            );
        } else promises.push(Promise.resolve([]));

        // Modules
         if (moduleIds.length > 0) {
             promises.push(
                supabase.from('modules').select('*, course:courses(title)').in('id', moduleIds)
                .then(({ data }) => data?.map((m: any) => ({
                    ...m, 
                    type: 'MODULE', // To match drag types
                    itemType: 'MODULE',
                    courseTitle: m.course?.title
                })) || [])
            );
        } else promises.push(Promise.resolve([]));

        // Lessons
         if (lessonIds.length > 0) {
             promises.push(
                supabase.from('lessons').select('*, module:modules(title, course:courses(title))').in('id', lessonIds)
                .then(({ data }) => data?.map((l: any) => ({
                    ...l, 
                    type: l.type, // video/quiz etc
                    itemType: 'LESSON',
                    moduleTitle: l.module?.title,
                    courseTitle: l.module?.course?.title
                })) || [])
            );
        } else promises.push(Promise.resolve([]));
        
        // Resources (Assuming 'resources' table exists, if not strictly need to check)
        if (resourceIds.length > 0) {
            promises.push(
                supabase.from('resources').select('*, course:courses(title)').in('id', resourceIds)
                .then(({ data }) => data?.map((r: any) => ({
                    ...r,
                    itemType: 'RESOURCE',
                    courseTitle: r.course?.title
                })) || [])
            );
        } else promises.push(Promise.resolve([]));


        const [courses, conversations, modules, lessons, resources] = await Promise.all(promises);

        return [
            ...courses,
            ...conversations,
            ...modules,
            ...lessons,
            ...resources
        ];
    };

    return {
        savedItemIds,
        loading,
        addToCollection,
        removeFromCollection,
        fetchCollectionItems
    };
}
