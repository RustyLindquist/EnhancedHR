'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { generateQuickAIResponse } from '@/lib/ai/quick-ai';
import { parseFileContent } from '@/lib/file-parser';
import { deleteMuxAssetByPlaybackId } from '@/app/actions/mux';

// ============================================
// Permission Check Helper
// ============================================

async function checkExpertCourseAccess(courseId: number): Promise<{
    allowed: boolean;
    error?: string;
    userId?: string;
    course?: { author_id: string; status: string };
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { allowed: false, error: 'Not authenticated' };
    }

    // Check user is approved expert OR admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('author_status, role')
        .eq('id', user.id)
        .single();

    // Allow pending, approved, or rejected experts (anyone who clicked "Become Expert")
    const hasExpertAccess = profile?.author_status && profile.author_status !== 'none';
    const isAdmin = profile?.role === 'admin';

    if (!hasExpertAccess && !isAdmin) {
        return { allowed: false, error: 'Not an expert' };
    }

    // Check course ownership and draft status
    const { data: course } = await supabase
        .from('courses')
        .select('author_id, status')
        .eq('id', courseId)
        .single();

    if (!course) {
        return { allowed: false, error: 'Course not found' };
    }

    if (course.author_id !== user.id) {
        return { allowed: false, error: 'Not authorized to edit this course' };
    }

    if (course.status !== 'draft') {
        return { allowed: false, error: 'Can only edit draft courses' };
    }

    return { allowed: true, userId: user.id, course };
}

// ============================================
// Course Actions
// ============================================

export async function createExpertCourse() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Check expert status OR admin role
    const { data: profile } = await supabase
        .from('profiles')
        .select('author_status, role, full_name')
        .eq('id', user.id)
        .single();

    // Allow pending, approved, or rejected experts (anyone who clicked "Become Expert")
    const hasExpertAccess = profile?.author_status && profile.author_status !== 'none';
    const isAdmin = profile?.role === 'admin';

    if (!hasExpertAccess && !isAdmin) {
        return { success: false, error: 'Not an expert' };
    }

    // Create course (RLS will enforce author_id = user.id and status = draft)
    const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
            title: 'Untitled Course',
            description: '',
            category: 'General', // @deprecated - use categories instead
            categories: ['General'],
            status: 'draft',
            duration: '0m',
            rating: 0,
            badges: [],
            author: profile.full_name || 'Unknown Author',
            author_id: user.id
        })
        .select()
        .single();

    if (courseError) {
        console.error('Error creating expert course:', courseError);
        return { success: false, error: courseError.message };
    }

    // Create default module
    const { error: moduleError } = await supabase
        .from('modules')
        .insert({
            course_id: course.id,
            title: 'Module 1',
            order: 0,
            duration: '0m'
        });

    if (moduleError) {
        console.error('Error creating default module:', moduleError);
        // Course was created, continue anyway
    }

    // Note: Don't call revalidatePath here - this function is called during render
    // The redirect in page.tsx will cause the courses list to refresh
    return { success: true, courseId: course.id };
}

export async function getExpertCourseForBuilder(courseId: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Not authenticated' };
    }

    // Fetch course with ownership check
    const { data: course, error: courseError } = await supabase
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
        .eq('id', courseId)
        .eq('author_id', user.id)
        .single();

    if (courseError || !course) {
        return { error: 'Course not found or access denied' };
    }

    // Fetch modules
    const { data: modules } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order', { ascending: true });

    // Fetch lessons for all modules
    const moduleIds = modules?.map(m => m.id) || [];
    const { data: lessons } = await supabase
        .from('lessons')
        .select('*')
        .in('module_id', moduleIds.length > 0 ? moduleIds : ['__none__'])
        .order('order', { ascending: true });

    // Fetch resources
    const { data: resources } = await supabase
        .from('resources')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: true });

    // Build syllabus structure
    const syllabus = (modules || []).map(module => ({
        id: module.id,
        title: module.title,
        order: module.order,
        duration: module.duration,
        description: module.description,
        lessons: (lessons || [])
            .filter(l => l.module_id === module.id)
            .map(lesson => ({
                id: lesson.id,
                title: lesson.title,
                type: lesson.type,
                order: lesson.order,
                duration: lesson.duration || '0m',
                video_url: lesson.video_url,
                content: lesson.content,
                quiz_data: lesson.quiz_data,
                isCompleted: false // Default for builder view
            }))
    }));

    // Map author profile
    const authorProfile = course.author_profile as any;

    return {
        course: {
            type: 'COURSE' as const,
            id: course.id,
            title: course.title,
            author: course.author,
            authorDetails: authorProfile ? {
                id: authorProfile.id,
                name: authorProfile.full_name,
                title: authorProfile.expert_title,
                bio: authorProfile.author_bio,
                avatar: authorProfile.avatar_url,
                credentials: authorProfile.credentials
            } : undefined,
            progress: 0,
            category: course.category, // @deprecated - use categories instead
            categories: course.categories || (course.category ? [course.category] : ['General']),
            image: course.image_url,
            description: course.description || '',
            duration: course.duration || '0m',
            rating: course.rating || 0,
            badges: course.badges || [],
            isSaved: false,
            collections: [],
            dateAdded: course.created_at,
            status: course.status as 'draft' | 'pending_review' | 'published' | 'archived',
            skills: course.skills || []
        },
        syllabus,
        resources: (resources || []).map(r => ({
            id: r.id,
            title: r.title,
            type: r.type,
            url: r.url,
            size: r.size
        })),
        canEdit: course.status === 'draft'
    };
}

export async function updateExpertCourseImage(courseId: number, imageUrl: string | null) {
    const accessCheck = await checkExpertCourseAccess(courseId);
    if (!accessCheck.allowed) {
        return { success: false, error: accessCheck.error };
    }

    const supabase = await createClient();

    const { error } = await supabase
        .from('courses')
        .update({ image_url: imageUrl })
        .eq('id', courseId);

    if (error) {
        console.error('Error updating course image:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/author/courses/${courseId}/builder`);
    return { success: true };
}

export async function updateExpertCourseDetails(courseId: number, data: {
    title?: string;
    description?: string;
    category?: string; // @deprecated - use categories instead
    categories?: string[];
    duration?: string;
}) {
    const accessCheck = await checkExpertCourseAccess(courseId);
    if (!accessCheck.allowed) {
        return { success: false, error: accessCheck.error };
    }

    const supabase = await createClient();

    // Build update object, handling both old category and new categories fields
    const updateData: Record<string, unknown> = { ...data };

    // If categories array provided, use it and keep legacy category field in sync
    if (data.categories && data.categories.length > 0) {
        updateData.categories = data.categories;
        updateData.category = data.categories[0]; // Keep legacy field in sync
    }
    // If only old category field provided, also populate categories array
    else if (data.category && !data.categories) {
        updateData.categories = [data.category];
    }

    // Expert cannot change status via this action (use submitCourseForReview instead)
    const { error } = await supabase
        .from('courses')
        .update(updateData)
        .eq('id', courseId);

    if (error) {
        console.error('Error updating course details:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/author/courses/${courseId}/builder`);
    revalidatePath('/author/courses');
    return { success: true };
}

export async function updateExpertCourseSkills(courseId: number, skills: string[]) {
    const accessCheck = await checkExpertCourseAccess(courseId);
    if (!accessCheck.allowed) {
        return { success: false, error: accessCheck.error };
    }

    const supabase = await createClient();

    const { error } = await supabase
        .from('courses')
        .update({ skills })
        .eq('id', courseId);

    if (error) {
        console.error('Error updating course skills:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/author/courses/${courseId}/builder`);
    return { success: true };
}

export async function submitCourseForReview(courseId: number) {
    const accessCheck = await checkExpertCourseAccess(courseId);
    if (!accessCheck.allowed) {
        return { success: false, error: accessCheck.error };
    }

    const supabase = await createClient();

    // Validate course has content
    const { data: modules } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', courseId);

    if (!modules || modules.length === 0) {
        return { success: false, error: 'Course must have at least one module' };
    }

    const moduleIds = modules.map(m => m.id);
    const { data: lessons } = await supabase
        .from('lessons')
        .select('id')
        .in('module_id', moduleIds);

    if (!lessons || lessons.length === 0) {
        return { success: false, error: 'Course must have at least one lesson' };
    }

    // Check course has a title
    const { data: course } = await supabase
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .single();

    if (!course?.title || course.title === 'Untitled Course') {
        return { success: false, error: 'Please give your course a title before submitting' };
    }

    // Update status to pending_review
    const { error } = await supabase
        .from('courses')
        .update({ status: 'pending_review' })
        .eq('id', courseId);

    if (error) {
        console.error('Error submitting for review:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/author/courses/${courseId}/builder`);
    revalidatePath('/author/courses');
    return { success: true };
}

// ============================================
// Module Actions
// ============================================

export async function createExpertModule(courseId: number, title: string) {
    const accessCheck = await checkExpertCourseAccess(courseId);
    if (!accessCheck.allowed) {
        return { success: false, error: accessCheck.error };
    }

    const supabase = await createClient();

    // Get next order
    const { data: existingModules } = await supabase
        .from('modules')
        .select('order')
        .eq('course_id', courseId)
        .order('order', { ascending: false })
        .limit(1);

    const nextOrder = existingModules && existingModules.length > 0
        ? (existingModules[0].order || 0) + 1
        : 0;

    const { data, error } = await supabase
        .from('modules')
        .insert({
            course_id: courseId,
            title,
            order: nextOrder,
            duration: '0m'
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating module:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/author/courses/${courseId}/builder`);
    return { success: true, module: data };
}

export async function updateExpertModule(moduleId: string, courseId: number, data: {
    title?: string;
    order?: number;
    duration?: string;
    description?: string;
}) {
    const accessCheck = await checkExpertCourseAccess(courseId);
    if (!accessCheck.allowed) {
        return { success: false, error: accessCheck.error };
    }

    const supabase = await createClient();

    const { error } = await supabase
        .from('modules')
        .update(data)
        .eq('id', moduleId);

    if (error) {
        console.error('Error updating module:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/author/courses/${courseId}/builder`);
    return { success: true };
}

export async function deleteExpertModule(moduleId: string, courseId: number) {
    const accessCheck = await checkExpertCourseAccess(courseId);
    if (!accessCheck.allowed) {
        return { success: false, error: accessCheck.error };
    }

    const supabase = await createClient();

    // Fetch all lessons with video URLs to delete from Mux
    const { data: lessons } = await supabase
        .from('lessons')
        .select('id, video_url')
        .eq('module_id', moduleId);

    // Delete Mux videos for all lessons in this module
    if (lessons && lessons.length > 0) {
        for (const lesson of lessons) {
            if (lesson.video_url) {
                const videoUrl = lesson.video_url;
                // Check if it's a Mux playback ID (alphanumeric, 10+ chars, no dots)
                const isMuxId = /^[a-zA-Z0-9]{10,}$/.test(videoUrl) && !videoUrl.includes('.');
                if (isMuxId) {
                    console.log(`[deleteExpertModule] Deleting Mux video for lesson ${lesson.id}: ${videoUrl}`);
                    const muxResult = await deleteMuxAssetByPlaybackId(videoUrl);
                    if (!muxResult.success) {
                        console.error(`[deleteExpertModule] Failed to delete Mux video: ${muxResult.error}`);
                    }
                }
            }
        }
    }

    // Delete all lessons in this module
    await supabase
        .from('lessons')
        .delete()
        .eq('module_id', moduleId);

    const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId);

    if (error) {
        console.error('Error deleting module:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/author/courses/${courseId}/builder`);
    return { success: true };
}

// ============================================
// Lesson Actions
// ============================================

export async function createExpertLesson(moduleId: string, courseId: number, data: {
    title: string;
    type: 'video' | 'quiz' | 'article';
    video_url?: string;
    content?: string;
    duration?: string;
    quiz_data?: any;
}) {
    const accessCheck = await checkExpertCourseAccess(courseId);
    if (!accessCheck.allowed) {
        return { success: false, error: accessCheck.error };
    }

    const supabase = await createClient();

    const { data: existingLessons } = await supabase
        .from('lessons')
        .select('order')
        .eq('module_id', moduleId)
        .order('order', { ascending: false })
        .limit(1);

    const nextOrder = existingLessons && existingLessons.length > 0
        ? (existingLessons[0].order || 0) + 1
        : 0;

    const { data: lesson, error } = await supabase
        .from('lessons')
        .insert({
            module_id: moduleId,
            title: data.title,
            type: data.type,
            order: nextOrder,
            video_url: data.type === 'video' ? data.video_url : undefined,
            content: data.content || undefined,
            duration: data.duration || '0m',
            quiz_data: data.type === 'quiz' ? data.quiz_data : undefined
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating lesson:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/author/courses/${courseId}/builder`);
    return { success: true, lesson };
}

export async function updateExpertLesson(lessonId: string, courseId: number, data: {
    title?: string;
    video_url?: string;
    content?: string;
    duration?: string;
    order?: number;
    quiz_data?: any;
}) {
    const accessCheck = await checkExpertCourseAccess(courseId);
    if (!accessCheck.allowed) {
        return { success: false, error: accessCheck.error };
    }

    const supabase = await createClient();

    const { error } = await supabase
        .from('lessons')
        .update(data)
        .eq('id', lessonId);

    if (error) {
        console.error('Error updating lesson:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/author/courses/${courseId}/builder`);
    return { success: true };
}

export async function deleteExpertLesson(lessonId: string, courseId: number) {
    const accessCheck = await checkExpertCourseAccess(courseId);
    if (!accessCheck.allowed) {
        return { success: false, error: accessCheck.error };
    }

    const supabase = await createClient();

    // Get lesson info before deleting (including video_url for Mux cleanup)
    const { data: lesson } = await supabase
        .from('lessons')
        .select('video_url')
        .eq('id', lessonId)
        .single();

    // Delete the Mux video if it exists and is a Mux playback ID
    if (lesson?.video_url) {
        const videoUrl = lesson.video_url;
        // Check if it's a Mux playback ID (alphanumeric, 10+ chars, no dots)
        const isMuxId = /^[a-zA-Z0-9]{10,}$/.test(videoUrl) && !videoUrl.includes('.');
        if (isMuxId) {
            console.log(`[deleteExpertLesson] Deleting Mux video: ${videoUrl}`);
            const muxResult = await deleteMuxAssetByPlaybackId(videoUrl);
            if (!muxResult.success) {
                console.error(`[deleteExpertLesson] Failed to delete Mux video: ${muxResult.error}`);
                // Continue with lesson deletion even if Mux deletion fails
            }
        }
    }

    const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

    if (error) {
        console.error('Error deleting lesson:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/author/courses/${courseId}/builder`);
    return { success: true };
}

// ============================================
// Resource Actions
// ============================================

export async function addExpertCourseResource(courseId: number, data: {
    title: string;
    type: 'PDF' | 'DOC' | 'XLS' | 'IMG' | 'LINK';
    url: string;
    size?: string;
}) {
    const accessCheck = await checkExpertCourseAccess(courseId);
    if (!accessCheck.allowed) {
        return { success: false, error: accessCheck.error };
    }

    const supabase = await createClient();

    const { data: resource, error } = await supabase
        .from('resources')
        .insert({
            course_id: courseId,
            title: data.title,
            type: data.type,
            url: data.url,
            size: data.size
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding resource:', error);
        return { success: false, error: error.message };
    }

    // Generate AI summary for file-based resources (not LINKs or images)
    if (resource && ['PDF', 'DOC', 'XLS'].includes(data.type) && data.url) {
        generateResourceSummary(resource.id, data.url, data.type, supabase).catch(err => {
            console.error('Error generating resource summary:', err);
        });
    }

    revalidatePath(`/author/courses/${courseId}/builder`);
    return { success: true, resource };
}

/**
 * Generate AI summary for a resource file (runs in background)
 */
async function generateResourceSummary(
    resourceId: string,
    url: string,
    type: string,
    supabase: Awaited<ReturnType<typeof createClient>>
) {
    try {
        // Fetch the file content
        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`[ResourceSummary] Failed to fetch resource: ${response.status}`);
            return;
        }

        const buffer = await response.arrayBuffer();

        // Map resource type to MIME type
        const mimeTypeMap: Record<string, string> = {
            'PDF': 'application/pdf',
            'DOC': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'XLS': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };

        const mimeType = mimeTypeMap[type] || 'application/octet-stream';

        // Parse the file content
        const parseResult = await parseFileContent(buffer, mimeType);

        if (!parseResult.success || !parseResult.text || parseResult.text.length < 50) {
            console.warn(`[ResourceSummary] Could not parse content for resource ${resourceId}`);
            return;
        }

        // Truncate text for summary generation (keep costs low)
        const truncatedText = parseResult.text.substring(0, 2500);

        // Generate summary
        const summaryPrompt = `Summarize the following document in 2-3 concise sentences for a preview card. Focus on the main topic and key takeaways:\n\n${truncatedText}`;

        const summary = await generateQuickAIResponse(summaryPrompt, 150);

        if (summary && summary.length > 10) {
            // Update the resource with the summary
            const { error: updateError } = await supabase
                .from('resources')
                .update({ summary })
                .eq('id', resourceId);

            if (updateError) {
                console.error(`[ResourceSummary] Failed to update resource: ${updateError.message}`);
            } else {
                console.log(`[ResourceSummary] Generated summary for resource ${resourceId}: ${summary.substring(0, 100)}...`);
            }
        }
    } catch (error) {
        console.error(`[ResourceSummary] Error generating summary for resource ${resourceId}:`, error);
    }
}

// ============================================
// Lesson Reordering Actions
// ============================================

/**
 * Reorder lessons within a module (batch update)
 * @param lessonIds - Array of lesson IDs in the new order
 * @param courseId - Course ID for permission check
 */
export async function reorderExpertLessons(
    lessonIds: string[],
    courseId: number
): Promise<{
    success: boolean;
    error?: string;
}> {
    const accessCheck = await checkExpertCourseAccess(courseId);
    if (!accessCheck.allowed) {
        return { success: false, error: accessCheck.error };
    }

    const supabase = await createClient();

    try {
        // Update each lesson's order based on position in array
        const updates = lessonIds.map((lessonId, index) =>
            supabase
                .from('lessons')
                .update({ order: index })
                .eq('id', lessonId)
        );

        await Promise.all(updates);

        revalidatePath(`/author/courses/${courseId}/builder`);
        return { success: true };
    } catch (error: any) {
        console.error('Error reordering lessons:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Move a lesson to a different module
 * @param lessonId - The lesson to move
 * @param targetModuleId - The module to move it to
 * @param courseId - Course ID for permission check
 * @param newOrder - The position in the target module (optional, defaults to end)
 */
export async function moveExpertLessonToModule(
    lessonId: string,
    targetModuleId: string,
    courseId: number,
    newOrder?: number
): Promise<{
    success: boolean;
    error?: string;
}> {
    const accessCheck = await checkExpertCourseAccess(courseId);
    if (!accessCheck.allowed) {
        return { success: false, error: accessCheck.error };
    }

    const supabase = await createClient();

    try {
        // If no order specified, put it at the end
        if (newOrder === undefined) {
            const { data: existingLessons } = await supabase
                .from('lessons')
                .select('order')
                .eq('module_id', targetModuleId)
                .order('order', { ascending: false })
                .limit(1);

            newOrder = existingLessons && existingLessons.length > 0
                ? (existingLessons[0].order || 0) + 1
                : 0;
        }

        // Update the lesson's module and order
        const { error } = await supabase
            .from('lessons')
            .update({
                module_id: targetModuleId,
                order: newOrder
            })
            .eq('id', lessonId);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath(`/author/courses/${courseId}/builder`);
        return { success: true };
    } catch (error: any) {
        console.error('Error moving lesson to module:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Reorder modules within a course (batch update)
 * @param moduleIds - Array of module IDs in the new order
 * @param courseId - Course ID for permission check
 */
export async function reorderExpertModules(
    moduleIds: string[],
    courseId: number
): Promise<{
    success: boolean;
    error?: string;
}> {
    const accessCheck = await checkExpertCourseAccess(courseId);
    if (!accessCheck.allowed) {
        return { success: false, error: accessCheck.error };
    }

    const supabase = await createClient();

    try {
        // Update each module's order based on position in array
        const updates = moduleIds.map((moduleId, index) =>
            supabase
                .from('modules')
                .update({ order: index })
                .eq('id', moduleId)
        );

        await Promise.all(updates);

        revalidatePath(`/author/courses/${courseId}/builder`);
        return { success: true };
    } catch (error: any) {
        console.error('Error reordering modules:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// Resource Actions (continued)
// ============================================

export async function deleteExpertCourseResource(resourceId: string, courseId: number) {
    const accessCheck = await checkExpertCourseAccess(courseId);
    if (!accessCheck.allowed) {
        return { success: false, error: accessCheck.error };
    }

    const supabase = await createClient();

    const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceId);

    if (error) {
        console.error('Error deleting resource:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/author/courses/${courseId}/builder`);
    return { success: true };
}
