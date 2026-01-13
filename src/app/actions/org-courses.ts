'use server';

import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getOrgContext } from '@/lib/org-context';
import { Course } from '@/types';
import { revalidatePath } from 'next/cache';
import { generateOrgCourseEmbeddings, deleteOrgCourseEmbeddings } from '@/lib/ai/org-course-embeddings';

// ============================================
// Org Course Fetching
// ============================================

/**
 * Fetch org courses filtered by status.
 * - If user is employee: ONLY return published courses (ignore status param)
 * - If user is org admin or platform admin: return courses matching status filter
 */
export async function fetchOrgCoursesAction(
    orgId: string,
    status?: 'published' | 'draft'
): Promise<{ courses: Course[]; error?: string }> {
    noStore();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { courses: [], error: 'Not authenticated' };
    }

    // Get org context to determine user permissions
    const orgContext = await getOrgContext();

    if (!orgContext) {
        return { courses: [], error: 'No organization context' };
    }

    // Verify user has access to this org
    if (!orgContext.isPlatformAdmin && orgContext.orgId !== orgId) {
        return { courses: [], error: 'Access denied to this organization' };
    }

    // Determine effective status filter
    // Employees can only see published courses
    const canViewDrafts = orgContext.isPlatformAdmin || orgContext.isOrgAdmin;
    const effectiveStatus = canViewDrafts ? status : 'published';

    // Build query for org courses with author profile data
    let query = supabase
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
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

    // Apply status filter if specified
    if (effectiveStatus) {
        query = query.eq('status', effectiveStatus);
    }

    const { data: coursesData, error } = await query;

    if (error) {
        console.error('[fetchOrgCoursesAction] Error fetching org courses:', error);
        return { courses: [], error: error.message };
    }

    // Fetch user's collection items for the isSaved/collections fields
    const collectionMap: Record<string, string[]> = {};
    const uuidToSystemMap: Record<string, string> = {};

    // Fetch User Collections (to map UUID -> system key)
    const { data: userCollections } = await supabase
        .from('user_collections')
        .select('id, label')
        .eq('user_id', user.id);

    const labelToKeyMap: Record<string, string> = {
        'Favorites': 'favorites',
        'Workspace': 'research',
        'Watchlist': 'to_learn',
        'Personal Context': 'personal-context'
    };

    userCollections?.forEach((col: { id: string; label: string }) => {
        if (labelToKeyMap[col.label]) {
            uuidToSystemMap[col.id] = labelToKeyMap[col.label];
        }
    });

    // Fetch Collection Items
    const { data: items } = await supabase
        .from('collection_items')
        .select('collection_id, course_id, user_collections!inner(user_id)')
        .eq('user_collections.user_id', user.id);

    items?.forEach((item: { collection_id: string; course_id: number | null }) => {
        const colId = item.collection_id;
        if (item.course_id != null) {
            const cId = item.course_id.toString();
            if (!collectionMap[colId]) collectionMap[colId] = [];
            collectionMap[colId].push(cId);
        }
    });

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

    // Map to Course type
    const mappedCourses: Course[] = (coursesData || []).map((course: any) => {
        const userCollections = getCollectionsForCourse(course.id);
        const authorProfile = course.author_profile;

        return {
            type: 'COURSE' as const,
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
            category: course.category,
            image: course.image_url,
            description: course.description || '',
            duration: course.duration || '0m',
            rating: Number(course.rating) || 0,
            badges: course.badges || [],
            isSaved: userCollections.length > 0,
            collections: userCollections,
            dateAdded: course.created_at,
            status: course.status
        };
    });

    console.log(`[fetchOrgCoursesAction] Returning ${mappedCourses.length} org courses for org ${orgId}`);

    return { courses: mappedCourses };
}

// ============================================
// Org Course Counts
// ============================================

/**
 * Get course counts for the status toggle.
 * - Only org admins and platform admins should get accurate counts
 * - Employees should get { published: X, draft: 0 }
 */
export async function getOrgCourseCounts(
    orgId: string
): Promise<{ published: number; draft: number; error?: string }> {
    noStore();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { published: 0, draft: 0, error: 'Not authenticated' };
    }

    // Get org context to determine user permissions
    const orgContext = await getOrgContext();

    if (!orgContext) {
        return { published: 0, draft: 0, error: 'No organization context' };
    }

    // Verify user has access to this org
    if (!orgContext.isPlatformAdmin && orgContext.orgId !== orgId) {
        return { published: 0, draft: 0, error: 'Access denied to this organization' };
    }

    // Get published count
    const { count: publishedCount, error: publishedError } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'published');

    if (publishedError) {
        console.error('[getOrgCourseCounts] Error fetching published count:', publishedError);
        return { published: 0, draft: 0, error: publishedError.message };
    }

    // Employees should only see published count, not draft count
    const canViewDrafts = orgContext.isPlatformAdmin || orgContext.isOrgAdmin;

    if (!canViewDrafts) {
        return { published: publishedCount || 0, draft: 0 };
    }

    // Get draft count for admins
    const { count: draftCount, error: draftError } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'draft');

    if (draftError) {
        console.error('[getOrgCourseCounts] Error fetching draft count:', draftError);
        return { published: publishedCount || 0, draft: 0, error: draftError.message };
    }

    return { published: publishedCount || 0, draft: draftCount || 0 };
}

// ============================================
// Create Org Course
// ============================================

/**
 * Create a new blank org course.
 * - Set org_id to the provided orgId
 * - Set status to 'draft'
 * - Set author_id to current user
 * - Create default Module 1
 */
export async function createOrgCourse(
    orgId: string
): Promise<{ success: boolean; courseId?: number; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Get org context to verify permissions
    const orgContext = await getOrgContext();

    if (!orgContext) {
        return { success: false, error: 'No organization context' };
    }

    // Verify user can create courses in this org (must be org admin or platform admin)
    if (!orgContext.isPlatformAdmin && !orgContext.isOrgAdmin) {
        return { success: false, error: 'Only org admins can create courses' };
    }

    if (!orgContext.isPlatformAdmin && orgContext.orgId !== orgId) {
        return { success: false, error: 'Cannot create courses in another organization' };
    }

    const admin = createAdminClient();

    // Get the user's profile to use their name as the author
    const { data: profile } = await admin
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

    const authorName = profile?.full_name || 'Unknown Author';

    // Create the course with org_id
    const { data: course, error: courseError } = await admin
        .from('courses')
        .insert({
            title: 'Untitled Course',
            description: '',
            category: 'General',
            status: 'draft',
            duration: '0m',
            rating: 0,
            badges: [],
            author: authorName,
            author_id: user.id,
            org_id: orgId
        })
        .select()
        .single();

    if (courseError) {
        console.error('[createOrgCourse] Error creating course:', courseError);
        return { success: false, error: courseError.message };
    }

    // Create a default module
    const { error: moduleError } = await admin
        .from('modules')
        .insert({
            course_id: course.id,
            title: 'Module 1',
            order: 0,
            duration: '0m'
        });

    if (moduleError) {
        console.error('[createOrgCourse] Error creating default module:', moduleError);
        // Course was created, so return success with warning
    }

    // Note: Don't call revalidatePath here since this is called during page render
    // The course list will get fresh data when navigated to

    return { success: true, courseId: course.id };
}

// ============================================
// Delete Org Course
// ============================================

/**
 * Delete an org course and all related data.
 * - Verify user is org admin for this org or platform admin
 * - Delete related records: user_progress, modules/lessons (cascade should handle), collection_items
 * - Delete the course
 */
export async function deleteOrgCourse(
    courseId: number,
    orgId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Get org context to verify permissions
    const orgContext = await getOrgContext();

    if (!orgContext) {
        return { success: false, error: 'No organization context' };
    }

    // Verify user can delete courses in this org (must be org admin or platform admin)
    if (!orgContext.isPlatformAdmin && !orgContext.isOrgAdmin) {
        return { success: false, error: 'Only org admins can delete courses' };
    }

    if (!orgContext.isPlatformAdmin && orgContext.orgId !== orgId) {
        return { success: false, error: 'Cannot delete courses in another organization' };
    }

    const admin = createAdminClient();

    // Verify the course belongs to this org
    const { data: course, error: courseCheckError } = await admin
        .from('courses')
        .select('id, org_id')
        .eq('id', courseId)
        .single();

    if (courseCheckError || !course) {
        return { success: false, error: 'Course not found' };
    }

    if (course.org_id !== orgId) {
        return { success: false, error: 'Course does not belong to this organization' };
    }

    // Delete user_progress records for this course
    const { error: progressError } = await admin
        .from('user_progress')
        .delete()
        .eq('course_id', courseId);

    if (progressError) {
        console.error('[deleteOrgCourse] Error deleting user_progress:', progressError);
        // Continue anyway - not critical
    }

    // Delete collection_items referencing this course
    const { error: collectionError } = await admin
        .from('collection_items')
        .delete()
        .eq('course_id', courseId);

    if (collectionError) {
        console.error('[deleteOrgCourse] Error deleting collection_items:', collectionError);
        // Continue anyway - not critical
    }

    // Get all modules for this course to delete lessons
    const { data: modules } = await admin
        .from('modules')
        .select('id')
        .eq('course_id', courseId);

    if (modules && modules.length > 0) {
        const moduleIds = modules.map(m => m.id);

        // Delete lessons in these modules
        const { error: lessonsError } = await admin
            .from('lessons')
            .delete()
            .in('module_id', moduleIds);

        if (lessonsError) {
            console.error('[deleteOrgCourse] Error deleting lessons:', lessonsError);
        }
    }

    // Delete modules
    const { error: modulesError } = await admin
        .from('modules')
        .delete()
        .eq('course_id', courseId);

    if (modulesError) {
        console.error('[deleteOrgCourse] Error deleting modules:', modulesError);
    }

    // Delete course resources
    const { error: resourcesError } = await admin
        .from('course_resources')
        .delete()
        .eq('course_id', courseId);

    if (resourcesError) {
        console.error('[deleteOrgCourse] Error deleting course_resources:', resourcesError);
    }

    // Delete embeddings for this course (RAG cleanup)
    const embeddingResult = await deleteOrgCourseEmbeddings(courseId);
    if (!embeddingResult.success) {
        console.error('[deleteOrgCourse] Error deleting embeddings:', embeddingResult.error);
        // Continue anyway - course deletion is more important
    } else {
        console.log(`[deleteOrgCourse] Deleted ${embeddingResult.deletedCount} embeddings`);
    }

    // Finally, delete the course
    const { error: deleteError } = await admin
        .from('courses')
        .delete()
        .eq('id', courseId);

    if (deleteError) {
        console.error('[deleteOrgCourse] Error deleting course:', deleteError);
        return { success: false, error: deleteError.message };
    }

    revalidatePath('/org-courses');

    return { success: true };
}

// ============================================
// Check Published Org Courses
// ============================================

/**
 * Check if org has any published courses.
 * Used for nav visibility check for employees.
 */
export async function hasPublishedOrgCourses(
    orgId: string
): Promise<{ hasPublished: boolean; error?: string }> {
    noStore();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { hasPublished: false, error: 'Not authenticated' };
    }

    // Get org context to verify access
    const orgContext = await getOrgContext();

    if (!orgContext) {
        return { hasPublished: false, error: 'No organization context' };
    }

    // Verify user has access to this org
    if (!orgContext.isPlatformAdmin && orgContext.orgId !== orgId) {
        return { hasPublished: false, error: 'Access denied to this organization' };
    }

    // Check for at least one published course
    const { count, error } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'published')
        .limit(1);

    if (error) {
        console.error('[hasPublishedOrgCourses] Error:', error);
        return { hasPublished: false, error: error.message };
    }

    return { hasPublished: (count || 0) > 0 };
}

// ============================================
// Publish Org Course
// ============================================

/**
 * Publish an org course (change status from draft to published).
 * - Verify user is org admin or platform admin
 * - Update status to 'published'
 */
export async function publishOrgCourse(
    courseId: number
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Get org context to verify permissions
    const orgContext = await getOrgContext();

    if (!orgContext) {
        return { success: false, error: 'No organization context' };
    }

    // Verify user can publish courses (must be org admin or platform admin)
    if (!orgContext.isPlatformAdmin && !orgContext.isOrgAdmin) {
        return { success: false, error: 'Only org admins can publish courses' };
    }

    const admin = createAdminClient();

    // Verify the course exists and get its org_id
    const { data: course, error: courseCheckError } = await admin
        .from('courses')
        .select('id, org_id, status')
        .eq('id', courseId)
        .single();

    if (courseCheckError || !course) {
        return { success: false, error: 'Course not found' };
    }

    // Verify org admin can only publish courses in their own org
    if (!orgContext.isPlatformAdmin && course.org_id !== orgContext.orgId) {
        return { success: false, error: 'Cannot publish courses in another organization' };
    }

    // Verify this is an org course (has org_id)
    if (!course.org_id) {
        return { success: false, error: 'This is not an organization course' };
    }

    // Update status to published
    const { error: updateError } = await admin
        .from('courses')
        .update({ status: 'published' })
        .eq('id', courseId);

    if (updateError) {
        console.error('[publishOrgCourse] Error publishing course:', updateError);
        return { success: false, error: updateError.message };
    }

    // Generate embeddings for the published course (for org-scoped RAG)
    // This runs async - don't block the publish operation
    generateOrgCourseEmbeddings(courseId, course.org_id).then(result => {
        if (result.success) {
            console.log(`[publishOrgCourse] Generated ${result.embeddingCount} embeddings for course ${courseId}`);
        } else {
            console.error(`[publishOrgCourse] Failed to generate embeddings:`, result.error);
        }
    }).catch(err => {
        console.error('[publishOrgCourse] Error generating embeddings:', err);
    });

    revalidatePath('/org-courses');
    revalidatePath(`/org-courses/${courseId}`);

    return { success: true };
}

// ============================================
// Unpublish Org Course (Bonus utility)
// ============================================

/**
 * Unpublish an org course (change status from published back to draft).
 * - Verify user is org admin or platform admin
 * - Update status to 'draft'
 */
export async function unpublishOrgCourse(
    courseId: number
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Get org context to verify permissions
    const orgContext = await getOrgContext();

    if (!orgContext) {
        return { success: false, error: 'No organization context' };
    }

    // Verify user can unpublish courses (must be org admin or platform admin)
    if (!orgContext.isPlatformAdmin && !orgContext.isOrgAdmin) {
        return { success: false, error: 'Only org admins can unpublish courses' };
    }

    const admin = createAdminClient();

    // Verify the course exists and get its org_id
    const { data: course, error: courseCheckError } = await admin
        .from('courses')
        .select('id, org_id, status')
        .eq('id', courseId)
        .single();

    if (courseCheckError || !course) {
        return { success: false, error: 'Course not found' };
    }

    // Verify org admin can only unpublish courses in their own org
    if (!orgContext.isPlatformAdmin && course.org_id !== orgContext.orgId) {
        return { success: false, error: 'Cannot unpublish courses in another organization' };
    }

    // Verify this is an org course (has org_id)
    if (!course.org_id) {
        return { success: false, error: 'This is not an organization course' };
    }

    // Update status to draft
    const { error: updateError } = await admin
        .from('courses')
        .update({ status: 'draft' })
        .eq('id', courseId);

    if (updateError) {
        console.error('[unpublishOrgCourse] Error unpublishing course:', updateError);
        return { success: false, error: updateError.message };
    }

    // Delete embeddings for the unpublished course (removes from RAG)
    // This runs async - don't block the unpublish operation
    deleteOrgCourseEmbeddings(courseId).then(result => {
        if (result.success) {
            console.log(`[unpublishOrgCourse] Deleted ${result.deletedCount} embeddings for course ${courseId}`);
        } else {
            console.error(`[unpublishOrgCourse] Failed to delete embeddings:`, result.error);
        }
    }).catch(err => {
        console.error('[unpublishOrgCourse] Error deleting embeddings:', err);
    });

    revalidatePath('/org-courses');
    revalidatePath(`/org-courses/${courseId}`);

    return { success: true };
}

// ============================================
// Org Member Types for Author Selection
// ============================================

export interface OrgMemberOption {
    id: string;
    full_name: string | null;
    expert_title: string | null;
    avatar_url: string | null;
    role: string;
}

// ============================================
// Fetch Org Members for Author Assignment
// ============================================

/**
 * Fetch org members that can be assigned as course authors.
 * Returns all members of the organization (admins and employees).
 */
export async function getOrgMembersForAuthor(
    orgId: string
): Promise<OrgMemberOption[]> {
    noStore();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    // Get org context to verify permissions
    const orgContext = await getOrgContext();

    if (!orgContext) {
        return [];
    }

    // Verify user can access this org
    if (!orgContext.isPlatformAdmin && orgContext.orgId !== orgId) {
        return [];
    }

    // Fetch all profiles that belong to this org
    const { data: members, error } = await supabase
        .from('profiles')
        .select('id, full_name, expert_title, avatar_url, role')
        .eq('org_id', orgId)
        .order('full_name', { ascending: true });

    if (error) {
        console.error('[getOrgMembersForAuthor] Error fetching org members:', error);
        return [];
    }

    return (members || []).map(member => ({
        id: member.id,
        full_name: member.full_name,
        expert_title: member.expert_title,
        avatar_url: member.avatar_url,
        role: member.role || 'employee'
    }));
}

// ============================================
// Assign Org Course Author
// ============================================

/**
 * Assign an org member as the author of an org course.
 * The author_id can be null to unassign the author.
 * The course remains owned by the org, not the author.
 */
export async function assignOrgCourseAuthor(
    courseId: number,
    authorId: string | null
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Get org context to verify permissions
    const orgContext = await getOrgContext();

    if (!orgContext) {
        return { success: false, error: 'No organization context' };
    }

    // Only org admins and platform admins can assign authors
    if (!orgContext.isPlatformAdmin && !orgContext.isOrgAdmin) {
        return { success: false, error: 'Only org admins can assign course authors' };
    }

    const admin = createAdminClient();

    // Verify the course exists and belongs to this org
    const { data: course, error: courseError } = await admin
        .from('courses')
        .select('id, org_id')
        .eq('id', courseId)
        .single();

    if (courseError || !course) {
        return { success: false, error: 'Course not found' };
    }

    // Verify the course belongs to the user's org (unless platform admin)
    if (!orgContext.isPlatformAdmin && course.org_id !== orgContext.orgId) {
        return { success: false, error: 'Cannot modify courses in another organization' };
    }

    // If assigning an author, get their name for the denormalized author field
    let authorName = null;
    if (authorId) {
        const { data: authorProfile } = await admin
            .from('profiles')
            .select('full_name')
            .eq('id', authorId)
            .single();

        authorName = authorProfile?.full_name || 'Unknown Author';

        // Optionally verify the author belongs to the same org
        const { data: authorOrg } = await admin
            .from('profiles')
            .select('org_id')
            .eq('id', authorId)
            .single();

        if (!orgContext.isPlatformAdmin && authorOrg?.org_id !== orgContext.orgId) {
            return { success: false, error: 'Author must belong to the same organization' };
        }
    }

    // Update the course with the new author
    const { error: updateError } = await admin
        .from('courses')
        .update({
            author_id: authorId,
            author: authorName
        })
        .eq('id', courseId);

    if (updateError) {
        console.error('[assignOrgCourseAuthor] Error updating course:', updateError);
        return { success: false, error: updateError.message };
    }

    revalidatePath('/org-courses');
    revalidatePath(`/org-courses/${courseId}`);
    revalidatePath(`/org-courses/${courseId}/builder`);

    return { success: true };
}
