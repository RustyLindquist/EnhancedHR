'use server';

import { unstable_noStore as noStore } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { Course, LessonSearchResult } from '@/types';
import { ExpertCredential } from './credentials';

export async function fetchCoursesAction(): Promise<{ courses: Course[], debug?: any }> {
    // Opt out of caching for this server action
    noStore();
    const admin = createAdminClient();
    const supabase = await createClient();
    
    // Check for user
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // 1. Fetch raw courses with author profile data (only published courses)
    const { data: coursesData, error } = await supabase
        .from('courses')
        .select(`
            *,
            author_profile:author_id (
                id,
                full_name,
                expert_title,
                author_bio,
                avatar_url,
                credentials
            )
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching courses:', error);
        console.error('Error fetching courses:', error);
        return { courses: [], debug: { error } };
    }

    // 2. Fetch User Collections/Items (Securely via RLS)
    let collectionMap: Record<string, string[]> = {};
    let uuidToSystemMap: Record<string, string> = {}; 

    if (userId) {
        // Fetch User Collections (to map UUID -> 'favorites')
        const { data: userCollections } = await supabase
            .from('user_collections')
            .select('id, label')
            .eq('user_id', userId);

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

        // Fetch Collection Items
        // Using RLS, we can only see items in our collections, which requires a join or just knowing the collection owns them.
        // collection_items links collection_id -> user_collections.
        // The query "user_collections!inner(user_id)" filters ensuring we own the collection.
        const { data: items } = await supabase
            .from('collection_items')
            .select('collection_id, course_id, user_collections!inner(user_id)')
            .eq('user_collections.user_id', userId);

        items?.forEach((item: any) => {
            const colId = item.collection_id;
            // Defensive check for course_id
            if (item.course_id != null) {
                const cId = item.course_id.toString();
                if (!collectionMap[colId]) collectionMap[colId] = [];
                collectionMap[colId].push(cId);
            }
        });
    }

    // Helper to find which collections a course belongs to
    const getCollectionsForCourse = (courseId: number): string[] => {
        const result: string[] = [];
        for (const [colId, courseIds] of Object.entries(collectionMap)) {
            if (courseIds.includes(courseId.toString())) {
                const systemKey = uuidToSystemMap[colId];
                if (systemKey) {
                    result.push(systemKey);
                } else {
                    result.push(colId);
                }
            }
        }
        return result;
    };

    const mappedCourses = coursesData.map((course: any) => {
        const userCollections = getCollectionsForCourse(course.id);
        const authorProfile = course.author_profile;

        return {
            type: 'COURSE' as const, // Explicit cast
            id: course.id,
            title: course.title,
            author: course.author,
            authorDetails: authorProfile ? {
                id: authorProfile.id,
                name: authorProfile.full_name || course.author,
                title: authorProfile.expert_title,
                bio: authorProfile.author_bio,
                avatar: authorProfile.avatar_url,
                credentials: authorProfile.credentials
            } : undefined,
            progress: 0,
            category: course.category, // @deprecated - use categories instead
            categories: course.categories || (course.category ? [course.category] : ['General']),
            image: course.image_url,
            description: course.description,
            duration: course.duration,
            rating: Number(course.rating),
            badges: course.badges || [],
            isSaved: userCollections.length > 0,
            collections: userCollections,
            dateAdded: course.created_at
        };
    });

    // Debug log for troubleshooting
    console.log(`[fetchCoursesAction] Returning ${mappedCourses.length} courses. IDs: ${mappedCourses.slice(0, 5).map((c: any) => c.id).join(', ')}...`);

    return {
        courses: mappedCourses,
        debug: {
            success: true,
            rawCount: coursesData?.length,
            userId,
            error: error ? JSON.stringify(error) : null,
            collectionCount: Object.keys(collectionMap).length,
            courseIds: coursesData?.map((c: any) => c.id).slice(0, 10)
        }
    };
}

/**
 * Search lessons by title with course context.
 * Returns lessons matching the query along with their parent course info.
 */
export async function searchLessonsAction(query: string): Promise<LessonSearchResult[]> {
    noStore();

    if (!query || query.trim().length < 2) {
        return [];
    }

    const supabase = await createClient();

    // Search lessons with course info via nested join through modules (only from published courses)
    const { data, error } = await supabase
        .from('lessons')
        .select(`
            id,
            title,
            duration,
            type,
            module_id,
            modules!inner (
                id,
                course_id,
                courses!inner (
                    id,
                    title,
                    image_url,
                    author,
                    status
                )
            )
        `)
        .ilike('title', `%${query.trim()}%`)
        .eq('modules.courses.status', 'published')
        .limit(50);

    if (error) {
        console.error('[searchLessonsAction] Error searching lessons:', error);
        return [];
    }

    if (!data || data.length === 0) {
        return [];
    }

    // Transform the nested data structure into flat LessonSearchResult
    // Filter out lessons that don't have valid module/course data
    return data
        .filter((lesson: any) => lesson.modules && lesson.modules.courses)
        .map((lesson: any) => ({
            id: lesson.id,
            title: lesson.title,
            duration: lesson.duration || '',
            type: lesson.type || 'video',
            module_id: lesson.module_id,
            course_id: lesson.modules.courses.id,
            course_title: lesson.modules.courses.title,
            course_image: lesson.modules.courses.image_url,
            course_author: lesson.modules.courses.author || ''
        }));
}

/**
 * Fetch expert credentials for a specific author
 * Used on course detail pages to display itemized credentials
 */
export async function getAuthorCredentialsAction(authorId: string): Promise<ExpertCredential[]> {
    noStore();

    if (!authorId) {
        return [];
    }

    const supabase = await createClient();

    const { data, error } = await supabase
        .from('expert_credentials')
        .select('*')
        .eq('expert_id', authorId)
        .order('display_order', { ascending: true });

    if (error) {
        console.error('[getAuthorCredentialsAction] Error:', error);
        return [];
    }

    return data || [];
}
