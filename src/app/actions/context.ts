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
export async function resolveCollectionId(supabase: any, collectionId: string | undefined | null, userId: string): Promise<string | null> {
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

    const admin = createAdminClient(); // Service Role client

    // Resolve ID using admin client (safe) to ensure we can find/create system collections ignoring RLS
    // The internal resolve function in context.ts might be using 'supabase' passed in, 
    // so we should pass 'admin' if the types align, or update resolveCollectionId to not rely on auth.getUser() if using admin
    // Actually, resolveCollectionId takes 'supabase' client. As long as we pass a client, it works.
    // BUT resolveCollectionId ALSO takes userId. Admin client doesn't have session.
    // The userId is passed explicitly.
    const resolvedId = await resolveCollectionId(admin, collectionIdOrAlias, user.id);
    if (!resolvedId) return { courses: [], contextItems: [] };

    // 1. Fetch Context Items
    const { data: contextItems } = await admin
        .from('user_context_items')
        .select('*')
        .eq('collection_id', resolvedId)
        .order('created_at', { ascending: false });

    // 2. Fetch Collection Courses (via linking table)
    // Use User Client (supabase) instead of Admin to rely on RLS and active session
    // This avoids issues if Service Role Key is missing in environment
    const { data: rawCollectionItems, error: rawError } = await supabase
        .from('collection_items')
        .select('course_id, item_type, item_id')
        .eq('collection_id', resolvedId);

    console.log('[getCollectionDetailsAction] ResolvedID:', resolvedId);
    console.log('[getCollectionDetailsAction] Raw Items:', rawCollectionItems?.length);
    if (rawError) console.error('[getCollectionDetailsAction] Raw Error:', rawError);

    const courseIds = new Set(
        rawCollectionItems
            ?.filter((i: any) => i.course_id)
            .map((i: any) => i.course_id) || []
    );

    // 2b. Extract Course IDs from Context Items (Modules/Lessons)
    contextItems?.forEach((item: any) => {
        // Only if we actually start supporting MODULE in context items
        if ((item.type === 'MODULE' || item.type === 'LESSON') && item.content?.courseId) {
            courseIds.add(item.content.courseId);
        }
    });

    const uniqueCourseIds = Array.from(courseIds);
    
    console.log('[getCollectionDetailsAction] Extracted IDs:', uniqueCourseIds);

    let courseMap: Record<string, any> = {};
    if (uniqueCourseIds.length > 0) {
        const { data: coursesData, error: courseError } = await supabase
            .from('courses')
            .select('*')
            .in('id', uniqueCourseIds);

        console.log('[getCollectionDetailsAction] Fetched Courses:', coursesData?.length);
        if (courseError) console.error('[getCollectionDetailsAction] Course Fetch Error:', courseError);
        
        coursesData?.forEach((c: any) => {
            courseMap[String(c.id)] = c;
        });
    }

    // Map courses and legacy items
    const courses = rawCollectionItems?.map((item: any) => {
        const course = courseMap[String(item.course_id)];
        if (course) {
            return {
                ...course,
                type: 'COURSE' as const, 
                itemType: 'COURSE', 
                image: course.image_url, // Map DB column to Type property
                dateAdded: course.created_at, // Map DB column to Type property
                rating: Number(course.rating),
                badges: course.badges || [],
                isSaved: true
            };
        }
        if (item.item_type && item.item_type !== 'COURSE') {
            // Legacy / Generic Item stored in collection_items
            // We map it to a generic structure so it appears.
            const parentCourse = courseMap[String(item.course_id)];
            
            return {
                id: item.item_id || `legacy-${Math.random()}`,
                type: item.item_type,
                itemType: item.item_type,
                title: 'Saved Item', // Fallback as title isn't stored in collection_items link
                subtitle: 'Legacy Item',
                content: {
                    image: parentCourse?.image_url,
                    courseTitle: parentCourse?.title,
                },
                created_at: item.created_at || new Date().toISOString(),
                isSaved: true
            };
        }
        return null;
    }).filter(Boolean) || [];

    // Enrich Context Items with Course Images (Keep this for robustness if needed later)
    const enrichedContextItems = contextItems?.map((item: any) => {
        if ((item.type === 'MODULE' || item.type === 'LESSON') && item.content?.courseId) {
            const course = courseMap[String(item.content.courseId)];
            if (course) {
                return {
                    ...item,
                    content: {
                        ...item.content,
                        image: course.image_url,
                        courseTitle: course.title // Optional: could be useful
                    }
                };
            }
        }
        return item;
    });

    return {
        courses: courses?.filter(Boolean) || [], // Filter out undefineds!
        contextItems: enrichedContextItems || [],
        debug: {
            userId: user?.id,
            resolvedId: resolvedId,
            rawCount: rawCollectionItems?.length,
            extractedIds: courseIds,
            fetchedCourseCount: courses?.length,
            courseMapKeys: Object.keys(courseMap),
            rawError: rawError ? JSON.stringify(rawError) : null,
            envKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
    };
}
