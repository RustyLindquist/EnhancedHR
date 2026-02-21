'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { embedCourseResource, deleteCourseResourceEmbeddings, embedPlatformLessonContent } from '@/lib/context-embeddings';
import { fetchYouTubeMetadata, fetchYouTubeTranscript, isYouTubeUrl } from '@/lib/youtube';
import { generateTranscriptFromYouTubeAudio } from '@/lib/audio-transcription';
import {
    getAssetIdFromPlaybackId,
    requestMuxAutoCaption,
    waitForMuxCaptionReady,
    fetchMuxVTT,
    deleteMuxAssetByPlaybackId
} from '@/app/actions/mux';
import { parseVTTToTranscript } from '@/lib/vtt-parser';
import { transcribeWithWhisper, isWhisperAvailable } from '@/lib/whisper-transcription';
import { uploadCourseResourceToStorage, parseFileContent, chunkText, deleteFileFromStorage } from '@/lib/file-parser';
import { generateQuickAIResponse } from '@/lib/ai/quick-ai';

// ============================================
// Course Metadata Actions
// ============================================

/**
 * Get distinct categories from published courses
 * Used to populate the category dropdown dynamically
 * Now supports multi-category courses - collects all unique categories from arrays
 */
export async function getPublishedCategories(): Promise<{
    success: boolean;
    categories?: string[];
    error?: string;
}> {
    const admin = await createAdminClient();

    // Fetch both old category field and new categories array
    const { data, error } = await admin
        .from('courses')
        .select('category, categories')
        .eq('status', 'published');

    if (error) {
        console.error('[getPublishedCategories] Error:', error);
        return { success: false, error: error.message };
    }

    // Collect unique categories from both old and new fields
    const allCategories = new Set<string>();

    data.forEach(course => {
        // Add from new categories array
        if (course.categories && Array.isArray(course.categories)) {
            course.categories.forEach((cat: string) => {
                if (cat) allCategories.add(cat);
            });
        }
        // Also check legacy category field for backwards compat
        else if (course.category) {
            allCategories.add(course.category);
        }
    });

    // Convert to sorted array
    const categories = [...allCategories].sort();

    // Always include 'General' as a fallback option
    if (!categories.includes('General')) {
        categories.unshift('General');
    }

    return { success: true, categories };
}

export async function updateCourseImage(courseId: number, imageUrl: string | null) {
    const admin = await createAdminClient();

    const { error } = await admin
        .from('courses')
        .update({ image_url: imageUrl })
        .eq('id', courseId);

    if (error) {
        console.error('Error updating course image:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/admin/courses/${courseId}/builder`);
    return { success: true };
}

/**
 * Upload course image to storage and update the course record
 */
export async function uploadCourseImageAction(
    courseId: number,
    formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    const file = formData.get('image') as File;
    if (!file) {
        return { success: false, error: 'No file provided' };
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        return { success: false, error: 'Invalid file type. Please use JPEG, PNG, or WebP.' };
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        return { success: false, error: 'File too large. Maximum size is 5MB.' };
    }

    const admin = await createAdminClient();

    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `course-${courseId}/${timestamp}.${ext}`;

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to storage (course-images bucket)
    const { error: uploadError } = await admin.storage
        .from('course-images')
        .upload(path, buffer, {
            contentType: file.type,
            upsert: true
        });

    if (uploadError) {
        console.error('[uploadCourseImageAction] Upload error:', uploadError);
        return { success: false, error: uploadError.message };
    }

    // Get public URL
    const { data: urlData } = admin.storage
        .from('course-images')
        .getPublicUrl(path);

    // Update course with new image URL
    const { error: updateError } = await admin
        .from('courses')
        .update({ image_url: urlData.publicUrl })
        .eq('id', courseId);

    if (updateError) {
        console.error('[uploadCourseImageAction] Update error:', updateError);
        return { success: false, error: updateError.message };
    }

    revalidatePath(`/admin/courses/${courseId}/builder`);
    revalidatePath(`/author/courses/${courseId}/builder`);
    revalidatePath(`/courses/${courseId}`);

    return { success: true, url: urlData.publicUrl };
}

export async function updateCourseDetails(courseId: number, data: {
    title?: string;
    description?: string;
    category?: string; // @deprecated - use categories instead
    categories?: string[];
    status?: 'draft' | 'pending_review' | 'published' | 'archived';
    duration?: string;
}) {
    const admin = await createAdminClient();

    // Build update object, handling both old category and new categories fields
    const updateData: Record<string, unknown> = { ...data };

    // Validate categories if explicitly provided
    if (data.categories !== undefined) {
        if (data.categories.length === 0) {
            return { success: false, error: 'At least one category is required' };
        }
        // If categories array is provided with values, use it; also update legacy category field for backwards compat
        updateData.categories = data.categories;
        updateData.category = data.categories[0]; // Keep legacy field in sync
    }
    // If only old category field is provided (backwards compat), also update categories array
    else if (data.category) {
        updateData.categories = [data.category];
    }

    const { error } = await admin
        .from('courses')
        .update(updateData)
        .eq('id', courseId);

    if (error) {
        console.error('Error updating course details:', error);
        return { success: false, error: error.message };
    }

    // Auto-approve expert when their first course is published
    if (data.status === 'published') {
        try {
            // Get the course author
            const { data: course } = await admin
                .from('courses')
                .select('author_id')
                .eq('id', courseId)
                .single();

            if (course?.author_id) {
                // Check if author is pending
                const { data: author } = await admin
                    .from('profiles')
                    .select('author_status')
                    .eq('id', course.author_id)
                    .single();

                if (author?.author_status === 'pending') {
                    // Check if this is their first published course (excluding current one which was just updated)
                    const { data: publishedCourses } = await admin
                        .from('courses')
                        .select('id')
                        .eq('author_id', course.author_id)
                        .eq('status', 'published')
                        .neq('id', courseId);

                    // If no other published courses, this is their first - auto-approve them
                    if (!publishedCourses || publishedCourses.length === 0) {
                        await admin
                            .from('profiles')
                            .update({
                                author_status: 'approved',
                                approved_at: new Date().toISOString()
                            })
                            .eq('id', course.author_id);

                        console.log(`Auto-approved expert ${course.author_id} on first course publish`);

                        // Upgrade their membership (non-blocking)
                        const { upgradeExpertMembership } = await import('@/lib/expert-membership');
                        await upgradeExpertMembership(course.author_id);
                    }
                } else if (author?.author_status === 'approved') {
                    // Already approved expert - check if this is their first published course
                    // (handles case where admin manually approved before first course publish)
                    const { countPublishedCourses, upgradeExpertMembership } = await import('@/lib/expert-membership');
                    const count = await countPublishedCourses(course.author_id, courseId);
                    if (count === 0) {
                        await upgradeExpertMembership(course.author_id);
                    }
                }
            }
        } catch (autoApproveError) {
            // Don't fail the course update if auto-approval or membership upgrade fails
            console.error('Error auto-approving expert or upgrading membership:', autoApproveError);
        }
    }

    // Detect unpublish: status changing FROM published to something else
    // We need to check the current status BEFORE the update was applied
    if (data.status && data.status !== 'published') {
        try {
            // Get the course's current status (before this update) and author
            const { data: currentCourse } = await admin
                .from('courses')
                .select('author_id, status')
                .eq('id', courseId)
                .single();

            // Note: The update already happened, so we check if the status WAS published
            // by looking at what we're changing FROM. Since we already updated,
            // we need to check via a different approach - check if they now have zero courses
            if (currentCourse?.author_id) {
                const { countPublishedCourses, downgradeExpertMembership } = await import('@/lib/expert-membership');
                const remaining = await countPublishedCourses(currentCourse.author_id);
                if (remaining === 0) {
                    await downgradeExpertMembership(currentCourse.author_id);
                }
            }
        } catch (membershipError) {
            // Non-blocking: don't fail the course update if membership downgrade fails
            console.error('[updateCourseDetails] Membership downgrade error:', membershipError);
        }
    }

    revalidatePath(`/admin/courses/${courseId}/builder`);
    revalidatePath('/admin/courses');
    revalidatePath('/author');
    return { success: true };
}

export async function updateCourseSkills(courseId: number, skills: string[]) {
    const admin = await createAdminClient();

    const { error } = await admin
        .from('courses')
        .update({ skills: skills })
        .eq('id', courseId);

    if (error) {
        console.error('Error updating course skills:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/admin/courses/${courseId}/builder`);
    return { success: true };
}

export async function updateCourseCredits(courseId: number, credits: {
    shrm_eligible?: boolean;
    shrm_activity_id?: string;
    shrm_pdcs?: number;
    hrci_eligible?: boolean;
    hrci_program_id?: string;
    hrci_credits?: number;
}) {
    const admin = await createAdminClient();

    // Update badges array based on eligibility
    const { data: course } = await admin
        .from('courses')
        .select('badges')
        .eq('id', courseId)
        .single();

    let badges = (course?.badges || []) as string[];

    // Handle SHRM badge
    if (credits.shrm_eligible) {
        if (!badges.includes('SHRM')) badges.push('SHRM');
    } else {
        badges = badges.filter((b: string) => b !== 'SHRM');
    }

    // Handle HRCI badge
    if (credits.hrci_eligible) {
        if (!badges.includes('HRCI')) badges.push('HRCI');
    } else {
        badges = badges.filter((b: string) => b !== 'HRCI');
    }

    const { error } = await admin
        .from('courses')
        .update({
            badges,
            shrm_activity_id: credits.shrm_activity_id,
            shrm_pdcs: credits.shrm_pdcs,
            hrci_program_id: credits.hrci_program_id,
            hrci_credits: credits.hrci_credits
        })
        .eq('id', courseId);

    if (error) {
        console.error('Error updating course credits:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/admin/courses/${courseId}/builder`);
    return { success: true };
}

export async function assignCourseExpert(
    courseId: number,
    expertId: string | null,
    isStandalone: boolean = false
) {
    const admin = await createAdminClient();

    // If expertId provided, get the expert's name from the appropriate table
    let authorName = null;
    if (expertId) {
        if (isStandalone) {
            const { data: standaloneExpert } = await admin
                .from('standalone_experts')
                .select('full_name')
                .eq('id', expertId)
                .single();
            authorName = standaloneExpert?.full_name;
        } else {
            const { data: profile } = await admin
                .from('profiles')
                .select('full_name')
                .eq('id', expertId)
                .single();
            authorName = profile?.full_name;
        }
    }

    // Update the course with either author_id OR standalone_expert_id
    const updateData: Record<string, string | null> = {
        author: authorName
    };

    if (isStandalone) {
        updateData.author_id = null;
        updateData.standalone_expert_id = expertId;
    } else {
        updateData.author_id = expertId;
        updateData.standalone_expert_id = null;
    }

    const { error } = await admin
        .from('courses')
        .update(updateData)
        .eq('id', courseId);

    if (error) {
        console.error('Error assigning course expert:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/admin/courses/${courseId}/builder`);
    return { success: true };
}

export interface ExpertOption {
    id: string;
    full_name: string | null;
    expert_title: string | null;
    avatar_url: string | null;
    role?: string;
    isStandalone: boolean;
}

export async function getApprovedExperts(): Promise<ExpertOption[]> {
    const supabase = await createClient();

    // Include both approved experts AND platform admins
    const { data: profileExperts, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, expert_title, avatar_url, role')
        .or('author_status.eq.approved,role.eq.admin')
        .order('full_name');

    if (profileError) {
        console.error('Error fetching approved experts:', profileError);
    }

    // Also fetch standalone experts
    const { data: standaloneExperts, error: standaloneError } = await supabase
        .from('standalone_experts')
        .select('id, full_name, expert_title, avatar_url')
        .eq('is_active', true)
        .order('full_name');

    if (standaloneError) {
        console.error('Error fetching standalone experts:', standaloneError);
    }

    // Combine both lists with isStandalone flag
    const regularExperts: ExpertOption[] = (profileExperts || []).map(e => ({
        ...e,
        isStandalone: false
    }));

    const standalone: ExpertOption[] = (standaloneExperts || []).map(e => ({
        ...e,
        isStandalone: true
    }));

    // Return combined list, sorted by name
    return [...regularExperts, ...standalone].sort((a, b) =>
        (a.full_name || '').localeCompare(b.full_name || '')
    );
}

// ============================================
// Module Actions
// ============================================

export async function createModule(courseId: number, title: string) {
    const admin = await createAdminClient();

    // Get the highest order value
    const { data: existingModules } = await admin
        .from('modules')
        .select('order')
        .eq('course_id', courseId)
        .order('order', { ascending: false })
        .limit(1);

    const nextOrder = existingModules && existingModules.length > 0
        ? (existingModules[0].order || 0) + 1
        : 0;

    const { data, error } = await admin
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

    revalidatePath(`/admin/courses/${courseId}/builder`);
    return { success: true, module: data };
}

export async function updateModule(moduleId: string, data: {
    title?: string;
    order?: number;
    duration?: string;
    description?: string;
}) {
    const admin = await createAdminClient();

    const { data: module, error } = await admin
        .from('modules')
        .update(data)
        .eq('id', moduleId)
        .select('course_id')
        .single();

    if (error) {
        console.error('Error updating module:', error);
        return { success: false, error: error.message };
    }

    if (module) {
        revalidatePath(`/admin/courses/${module.course_id}/builder`);
    }
    return { success: true };
}

export async function deleteModule(moduleId: string) {
    const admin = await createAdminClient();

    // Get course_id before deleting
    const { data: module } = await admin
        .from('modules')
        .select('course_id')
        .eq('id', moduleId)
        .single();

    // Fetch all lessons with video URLs to delete from Mux
    const { data: lessons } = await admin
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
                    console.log(`[deleteModule] Deleting Mux video for lesson ${lesson.id}: ${videoUrl}`);
                    const muxResult = await deleteMuxAssetByPlaybackId(videoUrl);
                    if (!muxResult.success) {
                        console.error(`[deleteModule] Failed to delete Mux video: ${muxResult.error}`);
                    }
                }
            }
        }
    }

    // Delete all lessons in this module
    await admin
        .from('lessons')
        .delete()
        .eq('module_id', moduleId);

    const { error } = await admin
        .from('modules')
        .delete()
        .eq('id', moduleId);

    if (error) {
        console.error('Error deleting module:', error);
        return { success: false, error: error.message };
    }

    if (module) {
        revalidatePath(`/admin/courses/${module.course_id}/builder`);
    }
    return { success: true };
}

export async function deleteCourse(courseId: string) {
    const admin = await createAdminClient();

    // Check if course was published (for membership downgrade)
    const { data: course } = await admin
        .from('courses')
        .select('author_id, status')
        .eq('id', courseId)
        .single();

    // Fetch all modules for this course
    const { data: modules } = await admin
        .from('modules')
        .select('id')
        .eq('course_id', courseId);

    // Delete Mux videos for all lessons in all modules of this course
    if (modules && modules.length > 0) {
        const moduleIds = modules.map(m => m.id);
        const { data: lessons } = await admin
            .from('lessons')
            .select('id, video_url')
            .in('module_id', moduleIds);

        if (lessons && lessons.length > 0) {
            for (const lesson of lessons) {
                if (lesson.video_url) {
                    const videoUrl = lesson.video_url;
                    // Check if it's a Mux playback ID (alphanumeric, 10+ chars, no dots)
                    const isMuxId = /^[a-zA-Z0-9]{10,}$/.test(videoUrl) && !videoUrl.includes('.');
                    if (isMuxId) {
                        console.log(`[deleteCourse] Deleting Mux video for lesson ${lesson.id}: ${videoUrl}`);
                        const muxResult = await deleteMuxAssetByPlaybackId(videoUrl);
                        if (!muxResult.success) {
                            console.error(`[deleteCourse] Failed to delete Mux video: ${muxResult.error}`);
                        }
                    }
                }
            }
        }
    }

    // Due to cascade deletes in the database, we just need to delete the course
    // Related modules, lessons, resources, user_progress will cascade delete
    const { error } = await admin
        .from('courses')
        .delete()
        .eq('id', courseId);

    if (error) {
        console.error('Error deleting course:', error);
        return { success: false, error: error.message };
    }

    // Handle membership downgrade if the deleted course was published
    if (course?.author_id && course?.status === 'published') {
        try {
            const { countPublishedCourses, downgradeExpertMembership } = await import('@/lib/expert-membership');
            const remaining = await countPublishedCourses(course.author_id);
            if (remaining === 0) {
                await downgradeExpertMembership(course.author_id);
            }
        } catch (membershipError) {
            // Non-blocking: don't fail the course delete if membership downgrade fails
            console.error('[deleteCourse] Membership downgrade error:', membershipError);
        }
    }

    revalidatePath('/admin/courses');
    return { success: true };
}

// ============================================
// Lesson Actions
// ============================================

export async function createLesson(moduleId: string, data: {
    title: string;
    type: 'video' | 'quiz' | 'article';
    video_url?: string;
    content?: string;
    duration?: string;
    quiz_data?: any;
}) {
    const admin = await createAdminClient();

    // Get module to find course_id and highest lesson order
    const { data: module } = await admin
        .from('modules')
        .select('course_id')
        .eq('id', moduleId)
        .single();

    const { data: existingLessons } = await admin
        .from('lessons')
        .select('order')
        .eq('module_id', moduleId)
        .order('order', { ascending: false })
        .limit(1);

    const lessonMax = existingLessons && existingLessons.length > 0
        ? (existingLessons[0].order || 0)
        : -1;

    // Check module resources for shared ordering
    const { data: existingModuleResources } = await admin
        .from('resources')
        .select('order')
        .eq('module_id', moduleId)
        .order('order', { ascending: false })
        .limit(1);

    const resourceMax = existingModuleResources && existingModuleResources.length > 0
        ? (existingModuleResources[0].order || 0)
        : -1;

    const nextOrder = Math.max(lessonMax, resourceMax) + 1;

    const { data: lesson, error } = await admin
        .from('lessons')
        .insert({
            module_id: moduleId,
            title: data.title,
            type: data.type,
            order: nextOrder,
            duration: data.duration || '0m',
            video_url: data.video_url,
            content: data.content,
            quiz_data: data.quiz_data
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating lesson:', error);
        return { success: false, error: error.message };
    }

    if (module) {
        revalidatePath(`/admin/courses/${module.course_id}/builder`);
    }
    return { success: true, lesson };
}

/**
 * Auto-generate transcript for a lesson video (fire-and-forget)
 * Called when a new video_url is added to a lesson
 */
async function generateLessonTranscript(lessonId: string, videoUrl: string): Promise<void> {
    console.log('[generateLessonTranscript] Starting for lesson:', lessonId);

    try {
        const result = await generateTranscriptFromVideo(videoUrl);

        if (result.success && result.transcript) {
            const admin = await createAdminClient();
            await admin
                .from('lessons')
                .update({ content: result.transcript })
                .eq('id', lessonId);

            console.log('[generateLessonTranscript] Transcript saved, length:', result.transcript.length);
        } else {
            console.error('[generateLessonTranscript] Failed:', result.error);
        }
    } catch (err) {
        console.error('[generateLessonTranscript] Error:', err);
    }
}

export async function updateLesson(lessonId: string, data: {
    title?: string;
    video_url?: string;
    content?: string;
    duration?: string;
    order?: number;
    quiz_data?: any;
}) {
    const admin = await createAdminClient();

    // Get current lesson to check if video_url changed
    const { data: currentLesson } = await admin
        .from('lessons')
        .select('video_url, module_id, modules(course_id)')
        .eq('id', lessonId)
        .single();

    const { error } = await admin
        .from('lessons')
        .update(data)
        .eq('id', lessonId);

    if (error) {
        console.error('Error updating lesson:', error);
        return { success: false, error: error.message };
    }

    if (currentLesson?.modules) {
        revalidatePath(`/admin/courses/${(currentLesson.modules as any).course_id}/builder`);
    }

    // NOTE: Auto-transcript generation removed - users now control when transcripts are generated
    // via the TranscriptRequiredModal which prompts them to enter manually or generate with AI

    return { success: true };
}

export async function deleteLesson(lessonId: string) {
    const admin = await createAdminClient();

    // Get lesson info before deleting (including video_url for Mux cleanup)
    const { data: lesson } = await admin
        .from('lessons')
        .select('module_id, video_url, modules(course_id)')
        .eq('id', lessonId)
        .single();

    // Delete the Mux video if it exists and is a Mux playback ID
    if (lesson?.video_url) {
        const videoUrl = lesson.video_url;
        // Check if it's a Mux playback ID (alphanumeric, 10+ chars, no dots)
        const isMuxId = /^[a-zA-Z0-9]{10,}$/.test(videoUrl) && !videoUrl.includes('.');
        if (isMuxId) {
            console.log(`[deleteLesson] Deleting Mux video: ${videoUrl}`);
            const muxResult = await deleteMuxAssetByPlaybackId(videoUrl);
            if (!muxResult.success) {
                console.error(`[deleteLesson] Failed to delete Mux video: ${muxResult.error}`);
                // Continue with lesson deletion even if Mux deletion fails
            }
        }
    }

    const { error } = await admin
        .from('lessons')
        .delete()
        .eq('id', lessonId);

    if (error) {
        console.error('Error deleting lesson:', error);
        return { success: false, error: error.message };
    }

    if (lesson?.modules) {
        revalidatePath(`/admin/courses/${(lesson.modules as any).course_id}/builder`);
    }
    return { success: true };
}

// ============================================
// Resource Actions
// ============================================

export async function addCourseResource(courseId: number, data: {
    title: string;
    type: 'PDF' | 'DOC' | 'XLS' | 'IMG' | 'LINK';
    url: string;
    size?: string;
    description?: string;
}) {
    const admin = await createAdminClient();

    const { data: resource, error } = await admin
        .from('resources')
        .insert({
            course_id: courseId,
            title: data.title,
            type: data.type,
            url: data.url,
            size: data.size,
            description: data.description || null
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding resource:', error);
        return { success: false, error: error.message };
    }

    // Generate embeddings for the resource (for RAG)
    // This runs async but we don't block on it
    embedCourseResource(
        resource.id,
        courseId,
        data.title,
        data.type,
        data.url
    ).then(result => {
        if (result.success) {
            console.log(`[addCourseResource] Created ${result.embeddingCount} embeddings for resource "${data.title}"`);
        } else {
            console.error(`[addCourseResource] Failed to embed resource: ${result.error}`);
        }
    }).catch(err => {
        console.error('[addCourseResource] Embedding error:', err);
    });

    revalidatePath(`/admin/courses/${courseId}/builder`);
    return { success: true, resource };
}

/**
 * Update a course-level resource (title, description)
 */
export async function updateCourseResource(
    resourceId: string,
    courseId: number,
    data: { title?: string; description?: string }
) {
    const admin = await createAdminClient();

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.description !== undefined) updateData.description = data.description || null;

    if (Object.keys(updateData).length === 0) {
        return { success: true };
    }

    const { error } = await admin
        .from('resources')
        .update(updateData)
        .eq('id', resourceId);

    if (error) {
        console.error('[updateCourseResource] Error:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/admin/courses/${courseId}/builder`);
    revalidatePath(`/author/courses/${courseId}/builder`);
    return { success: true };
}

/**
 * Upload a file as a course resource
 * Handles: file upload to storage, text parsing, AI summary, and embedding generation
 */
export async function uploadCourseResourceFile(
    courseId: number,
    fileName: string,
    fileType: string,
    fileBuffer: ArrayBuffer
): Promise<{ success: boolean; resource?: { id: string; title: string; type: string; url: string }; error?: string }> {
    const admin = await createAdminClient();

    try {
        // 1. Create File object for upload
        const file = new File([fileBuffer], fileName, { type: fileType });

        // 2. Upload to Supabase Storage
        const uploadResult = await uploadCourseResourceToStorage(file, courseId);
        if (!uploadResult.success) {
            return { success: false, error: uploadResult.error || 'Failed to upload file' };
        }

        // 3. Parse file content for RAG
        const parseResult = await parseFileContent(fileBuffer, fileType, fileName);
        const textContent = parseResult.success ? parseResult.text : '';

        // 4. Generate AI summary if we have text content
        let summary: string | null = null;
        if (textContent && textContent.length > 50) {
            try {
                const truncatedText = textContent.substring(0, 2500);
                const summaryPrompt = `Summarize the following document in 2-3 sentences, focusing on its main topic and key points:\n\n${truncatedText}`;
                summary = await generateQuickAIResponse(summaryPrompt, 150);
            } catch (err) {
                console.warn('[uploadCourseResourceFile] Summary generation failed:', err);
            }
        }

        // 5. Determine resource type from file extension/mime type
        const resourceType = detectResourceType(fileName, fileType);

        // 6. Format file size
        const fileSizeFormatted = formatFileSize(fileBuffer.byteLength);

        // 7. Insert resource record with all metadata
        const { data: resource, error: insertError } = await admin
            .from('resources')
            .insert({
                course_id: courseId,
                title: fileName,
                type: resourceType,
                url: uploadResult.url,
                size: fileSizeFormatted,
                storage_path: uploadResult.path,
                file_size_bytes: fileBuffer.byteLength,
                mime_type: fileType,
                parsed_text_length: textContent.length,
                parse_error: parseResult.success ? null : parseResult.error,
                summary
            })
            .select()
            .single();

        if (insertError) {
            console.error('[uploadCourseResourceFile] Insert error:', insertError);
            // Try to clean up uploaded file
            await deleteFileFromStorage(uploadResult.path);
            return { success: false, error: insertError.message };
        }

        // 8. Generate embeddings for RAG (async, don't block)
        if (textContent && textContent.length > 0) {
            embedCourseResource(
                resource.id,
                courseId,
                fileName,
                resourceType,
                uploadResult.url,
                textContent // Pass full text for embedding
            ).then(result => {
                if (result.success) {
                    console.log(`[uploadCourseResourceFile] Created ${result.embeddingCount} embeddings for "${fileName}"`);
                } else {
                    console.error(`[uploadCourseResourceFile] Embedding failed: ${result.error}`);
                }
            }).catch(err => {
                console.error('[uploadCourseResourceFile] Embedding error:', err);
            });
        }

        revalidatePath(`/admin/courses/${courseId}/builder`);
        revalidatePath(`/author/courses/${courseId}/builder`);

        return {
            success: true,
            resource: {
                id: resource.id,
                title: resource.title,
                type: resource.type,
                url: resource.url
            }
        };

    } catch (error) {
        console.error('[uploadCourseResourceFile] Unexpected error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to upload resource'
        };
    }
}

/**
 * Upload a file as a module-level resource (inline within a module alongside lessons)
 * Reuses the same upload/parse/embed logic as course-level resources
 */
export async function uploadModuleResourceFile(
    courseId: number,
    moduleId: string,
    fileName: string,
    fileType: string,
    fileBuffer: ArrayBuffer,
    estimatedDuration?: string,
    description?: string
): Promise<{ success: boolean; resource?: { id: string; title: string; type: string; url: string; size?: string; module_id: string; order: number }; error?: string }> {
    const admin = await createAdminClient();

    try {
        // 1. Create File object for upload
        const file = new File([fileBuffer], fileName, { type: fileType });

        // 2. Upload to Supabase Storage
        const uploadResult = await uploadCourseResourceToStorage(file, courseId);
        if (!uploadResult.success) {
            return { success: false, error: uploadResult.error || 'Failed to upload file' };
        }

        // 3. Parse file content for RAG
        const parseResult = await parseFileContent(fileBuffer, fileType, fileName);
        const textContent = parseResult.success ? parseResult.text : '';

        // 4. Generate AI summary if we have text content
        let summary: string | null = null;
        if (textContent && textContent.length > 50) {
            try {
                const truncatedText = textContent.substring(0, 2500);
                const summaryPrompt = `Summarize the following document in 2-3 sentences, focusing on its main topic and key points:\n\n${truncatedText}`;
                summary = await generateQuickAIResponse(summaryPrompt, 150);
            } catch (err) {
                console.warn('[uploadModuleResourceFile] Summary generation failed:', err);
            }
        }

        // 5. Determine resource type and file size
        const resourceType = detectResourceType(fileName, fileType);
        const fileSizeFormatted = formatFileSize(fileBuffer.byteLength);

        // 6. Compute shared order (max of lessons + resources in this module)
        const { data: existingLessons } = await admin
            .from('lessons')
            .select('order')
            .eq('module_id', moduleId)
            .order('order', { ascending: false })
            .limit(1);

        const { data: existingResources } = await admin
            .from('resources')
            .select('order')
            .eq('module_id', moduleId)
            .order('order', { ascending: false })
            .limit(1);

        const lessonMax = existingLessons?.[0]?.order ?? -1;
        const resourceMax = existingResources?.[0]?.order ?? -1;
        const nextOrder = Math.max(lessonMax, resourceMax) + 1;

        // 7. Insert resource record with module_id and order
        const { data: resource, error: insertError } = await admin
            .from('resources')
            .insert({
                course_id: courseId,
                module_id: moduleId,
                title: fileName,
                type: resourceType,
                url: uploadResult.url,
                size: fileSizeFormatted,
                order: nextOrder,
                storage_path: uploadResult.path,
                file_size_bytes: fileBuffer.byteLength,
                mime_type: fileType,
                parsed_text_length: textContent.length,
                parse_error: parseResult.success ? null : parseResult.error,
                summary,
                estimated_duration: estimatedDuration || '0m',
                description: description || null
            })
            .select()
            .single();

        if (insertError) {
            console.error('[uploadModuleResourceFile] Insert error:', insertError);
            await deleteFileFromStorage(uploadResult.path);
            return { success: false, error: insertError.message };
        }

        // 8. Generate embeddings for RAG (async, don't block)
        if (textContent && textContent.length > 0) {
            embedCourseResource(
                resource.id,
                courseId,
                fileName,
                resourceType,
                uploadResult.url,
                textContent
            ).then(result => {
                if (result.success) {
                    console.log(`[uploadModuleResourceFile] Created ${result.embeddingCount} embeddings for "${fileName}"`);
                } else {
                    console.error(`[uploadModuleResourceFile] Embedding failed: ${result.error}`);
                }
            }).catch(err => {
                console.error('[uploadModuleResourceFile] Embedding error:', err);
            });
        }

        revalidatePath(`/admin/courses/${courseId}/builder`);
        revalidatePath(`/author/courses/${courseId}/builder`);

        return {
            success: true,
            resource: {
                id: resource.id,
                title: resource.title,
                type: resource.type,
                url: resource.url,
                size: resource.size,
                module_id: moduleId,
                order: nextOrder
            }
        };

    } catch (error) {
        console.error('[uploadModuleResourceFile] Unexpected error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to upload module resource'
        };
    }
}

/**
 * Update a module-level resource (title, etc.)
 */
export async function updateModuleResource(
    resourceId: string,
    courseId: number,
    data: { title?: string; estimated_duration?: string; description?: string }
) {
    const admin = await createAdminClient();

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.estimated_duration !== undefined) updateData.estimated_duration = data.estimated_duration;
    if (data.description !== undefined) updateData.description = data.description || null;

    if (Object.keys(updateData).length === 0) {
        return { success: true };
    }

    const { error } = await admin
        .from('resources')
        .update(updateData)
        .eq('id', resourceId);

    if (error) {
        console.error('[updateModuleResource] Error:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/admin/courses/${courseId}/builder`);
    revalidatePath(`/author/courses/${courseId}/builder`);

    return { success: true };
}

/**
 * Delete a module-level resource
 * Cleans up storage file and embeddings before removing the record
 */
export async function deleteModuleResource(
    resourceId: string,
    courseId: number
) {
    const admin = await createAdminClient();

    // Get resource to check for storage_path
    const { data: resource } = await admin
        .from('resources')
        .select('storage_path')
        .eq('id', resourceId)
        .single();

    // Delete embeddings first (before the resource record)
    deleteCourseResourceEmbeddings(resourceId).catch(err => {
        console.error('[deleteModuleResource] Failed to delete embeddings:', err);
    });

    // Delete file from storage if it exists
    if (resource?.storage_path) {
        deleteFileFromStorage(resource.storage_path).catch(err => {
            console.error('[deleteModuleResource] Failed to delete file from storage:', err);
        });
    }

    const { error } = await admin
        .from('resources')
        .delete()
        .eq('id', resourceId);

    if (error) {
        console.error('[deleteModuleResource] Error:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/admin/courses/${courseId}/builder`);
    revalidatePath(`/author/courses/${courseId}/builder`);

    return { success: true };
}

/**
 * Reorder items (lessons + resources) within a module
 * Updates the order column on both lessons and resources tables
 */
export async function reorderModuleItems(
    moduleId: string,
    courseId: number,
    orderedItems: { id: string; type: 'lesson' | 'resource' }[]
) {
    const admin = await createAdminClient();

    const updates = orderedItems.map((item, index) => {
        const table = item.type === 'lesson' ? 'lessons' : 'resources';
        return admin
            .from(table)
            .update({ order: index })
            .eq('id', item.id);
    });

    const results = await Promise.all(updates);
    const failed = results.find(r => r.error);

    if (failed?.error) {
        console.error('[reorderModuleItems] Error:', failed.error);
        return { success: false, error: failed.error.message };
    }

    revalidatePath(`/admin/courses/${courseId}/builder`);
    revalidatePath(`/author/courses/${courseId}/builder`);
    return { success: true };
}

/**
 * Detect resource type from filename and mime type
 */
function detectResourceType(fileName: string, mimeType: string): 'PDF' | 'DOC' | 'XLS' | 'IMG' | 'LINK' {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.pdf') || mimeType === 'application/pdf') return 'PDF';
    if (lower.endsWith('.doc') || lower.endsWith('.docx') || mimeType.includes('word')) return 'DOC';
    if (lower.endsWith('.xls') || lower.endsWith('.xlsx') || mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'XLS';
    if (mimeType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(lower)) return 'IMG';
    return 'LINK'; // Default for unknown types
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function deleteCourseResource(resourceId: string, courseId: number) {
    const admin = await createAdminClient();

    // Get resource to check for storage_path
    const { data: resource } = await admin
        .from('resources')
        .select('storage_path')
        .eq('id', resourceId)
        .single();

    // Delete embeddings first (before the resource record)
    deleteCourseResourceEmbeddings(resourceId).catch(err => {
        console.error('[deleteCourseResource] Failed to delete embeddings:', err);
    });

    // Delete file from storage if it exists
    if (resource?.storage_path) {
        deleteFileFromStorage(resource.storage_path).catch(err => {
            console.error('[deleteCourseResource] Failed to delete file from storage:', err);
        });
    }

    const { error } = await admin
        .from('resources')
        .delete()
        .eq('id', resourceId);

    if (error) {
        console.error('Error deleting resource:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/admin/courses/${courseId}/builder`);
    revalidatePath(`/author/courses/${courseId}/builder`);
    return { success: true };
}

// ============================================
// New Course Creation
// ============================================

export async function createBlankCourse() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    const admin = await createAdminClient();

    // Get the user's profile to use their name as the author
    const { data: profile } = await admin
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

    const authorName = profile?.full_name || 'Unknown Author';

    // Create the course
    const { data: course, error: courseError } = await admin
        .from('courses')
        .insert({
            title: 'Untitled Course',
            description: '',
            category: 'General', // Legacy field for backwards compat
            categories: ['General'], // New multi-category field
            status: 'draft',
            duration: '0m',
            rating: 0,
            badges: [],
            author: authorName,
            author_id: user.id
        })
        .select()
        .single();

    if (courseError) {
        console.error('Error creating course:', courseError);
        return { success: false, error: courseError.message };
    }

    // Create a default module
    await admin
        .from('modules')
        .insert({
            course_id: course.id,
            title: 'Module 1',
            order: 0,
            duration: '0m'
        });

    revalidatePath('/admin/courses');
    return { success: true, courseId: course.id };
}

// ============================================
// Fetch Course for Builder
// ============================================

export async function getCourseForBuilder(courseId: number) {
    const supabase = await createClient();

    // Fetch course with author details
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
        .single();

    if (courseError || !course) {
        return { error: courseError?.message || 'Course not found' };
    }

    // Fetch modules with lessons
    const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order', { ascending: true });

    if (modulesError) {
        return { error: modulesError.message };
    }

    // Fetch lessons for all modules
    const moduleIds = modules?.map(m => m.id) || [];
    const { data: lessons } = await supabase
        .from('lessons')
        .select('*')
        .in('module_id', moduleIds)
        .order('order', { ascending: true });

    // Fetch resources
    const { data: resources } = await supabase
        .from('resources')
        .select('*')
        .eq('course_id', courseId);

    // Map to typed structures
    const authorProfile = course.author_profile as any;
    const mappedCourse = {
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
        category: course.category, // @deprecated - use categories instead
        categories: course.categories || (course.category ? [course.category] : ['General']),
        image: course.image_url,
        description: course.description || '',
        duration: course.duration || '0m',
        rating: Number(course.rating) || 0,
        badges: course.badges || [],
        isSaved: false,
        collections: [],
        dateAdded: course.created_at,
        status: course.status,
        skills: course.skills || []
    };

    const mappedModules = (modules || []).map((module: any) => ({
        id: module.id,
        title: module.title,
        duration: module.duration || '0m',
        lessons: (lessons || [])
            .filter((l: any) => l.module_id === module.id)
            .map((l: any) => ({
                id: l.id,
                title: l.title,
                duration: l.duration || '0m',
                type: l.type || 'video',
                video_url: l.video_url,
                content: l.content,
                quiz_data: l.quiz_data,
                isCompleted: false,
                order: l.order ?? 0,
                // Transcript fields
                ai_transcript: l.ai_transcript,
                user_transcript: l.user_transcript,
                transcript_status: l.transcript_status,
                transcript_source: l.transcript_source
            }))
    }));

    const mappedResources = (resources || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        url: r.url,
        size: r.size,
        module_id: r.module_id || null,
        order: r.order ?? 0,
        description: r.description || null
    }));

    return {
        course: mappedCourse,
        syllabus: mappedModules,
        resources: mappedResources
    };
}

// ============================================
// YouTube Metadata Action
// ============================================

export async function fetchYouTubeMetadataAction(videoUrl: string) {
    return await fetchYouTubeMetadata(videoUrl);
}

// ============================================
// AI Transcript Generation
// ============================================

/**
 * Check if a string is a Mux playback ID
 * Playback IDs are 10+ character alphanumeric strings without dots or slashes
 */
function isMuxPlaybackId(str: string): boolean {
    return /^[a-zA-Z0-9]{10,}$/.test(str) && !str.includes('.');
}

export async function generateTranscriptFromVideo(videoUrl: string): Promise<{
    success: boolean;
    transcript?: string;
    source?: 'youtube' | 'mux-caption' | 'whisper' | 'manual';
    error?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Strategy 1: YouTube - Use existing working pipeline
    if (await isYouTubeUrl(videoUrl)) {
        console.log('[Transcript] Detected YouTube URL, attempting transcript extraction');

        // Try Innertube first (native captions)
        const ytResult = await fetchYouTubeTranscript(videoUrl);
        if (ytResult.success && ytResult.transcript) {
            console.log('[Transcript] Successfully fetched YouTube transcript via Innertube');
            return { success: true, transcript: ytResult.transcript, source: 'youtube' };
        }

        console.log('[Transcript] Innertube failed, trying Supadata fallback');

        // Try audio extraction via Supadata
        const audioResult = await generateTranscriptFromYouTubeAudio(videoUrl);
        if (audioResult.success && audioResult.transcript) {
            console.log('[Transcript] Successfully generated transcript via Supadata');
            return { success: true, transcript: audioResult.transcript, source: 'youtube' };
        }

        console.log('[Transcript] All YouTube methods failed:', audioResult.error);
        return {
            success: false,
            error: audioResult.error || 'Unable to generate transcript for this YouTube video. Please try again or enter manually.'
        };
    }

    // Strategy 2: Mux playback ID - Try Mux captions, then Whisper
    if (isMuxPlaybackId(videoUrl)) {
        console.log('[Transcript] Detected Mux playback ID:', videoUrl);

        // Try Mux auto-caption first
        const muxResult = await generateMuxCaptionTranscript(videoUrl);
        if (muxResult.success && muxResult.transcript) {
            console.log('[Transcript] Successfully generated transcript via Mux captions');
            return { success: true, transcript: muxResult.transcript, source: 'mux-caption' };
        }

        console.log('[Transcript] Mux caption failed:', muxResult.error);

        // Fallback to Whisper
        if (await isWhisperAvailable()) {
            console.log('[Transcript] Trying Whisper fallback');
            const whisperResult = await transcribeWithWhisper(videoUrl);
            if (whisperResult.success && whisperResult.transcript) {
                console.log('[Transcript] Successfully generated transcript via Whisper');
                return { success: true, transcript: whisperResult.transcript, source: 'whisper' };
            }
            console.log('[Transcript] Whisper failed:', whisperResult.error);
        } else {
            console.log('[Transcript] Whisper not available (OPENAI_API_KEY not set)');
        }

        return {
            success: false,
            error: 'Transcript generation failed. Please enter the transcript manually or try again later.'
        };
    }

    // Strategy 3: External URL - Not supported for auto-transcription
    console.log('[Transcript] External URL detected, not supported for auto-transcription:', videoUrl);
    return {
        success: false,
        error: 'Automatic transcription is not available for external video URLs. Please upload the video or enter the transcript manually.'
    };
}

/**
 * Admin version of generateTranscriptFromVideo that doesn't require user authentication.
 * Used by API endpoints for bulk operations like course migration.
 */
export async function generateTranscriptFromVideoAdmin(videoUrl: string): Promise<{
    success: boolean;
    transcript?: string;
    source?: 'youtube' | 'mux-caption' | 'whisper' | 'manual';
    error?: string;
}> {
    // Strategy 1: YouTube - Use existing working pipeline
    if (await isYouTubeUrl(videoUrl)) {
        console.log('[Transcript Admin] Detected YouTube URL, attempting transcript extraction');

        // Try Innertube first (native captions)
        const ytResult = await fetchYouTubeTranscript(videoUrl);
        if (ytResult.success && ytResult.transcript) {
            console.log('[Transcript Admin] Successfully fetched YouTube transcript via Innertube');
            return { success: true, transcript: ytResult.transcript, source: 'youtube' };
        }

        console.log('[Transcript Admin] Innertube failed, trying Supadata fallback');

        // Try audio extraction via Supadata
        const audioResult = await generateTranscriptFromYouTubeAudio(videoUrl);
        if (audioResult.success && audioResult.transcript) {
            console.log('[Transcript Admin] Successfully generated transcript via Supadata');
            return { success: true, transcript: audioResult.transcript, source: 'youtube' };
        }

        console.log('[Transcript Admin] All YouTube methods failed:', audioResult.error);
        return {
            success: false,
            error: audioResult.error || 'Unable to generate transcript for this YouTube video.'
        };
    }

    // Strategy 2: Mux playback ID - Try Mux captions, then Whisper
    if (isMuxPlaybackId(videoUrl)) {
        console.log('[Transcript Admin] Detected Mux playback ID:', videoUrl);

        // Try Mux auto-caption first
        const muxResult = await generateMuxCaptionTranscript(videoUrl);
        if (muxResult.success && muxResult.transcript) {
            console.log('[Transcript Admin] Successfully generated transcript via Mux captions');
            return { success: true, transcript: muxResult.transcript, source: 'mux-caption' };
        }

        console.log('[Transcript Admin] Mux caption failed:', muxResult.error);

        // Fallback to Whisper
        if (await isWhisperAvailable()) {
            console.log('[Transcript Admin] Trying Whisper fallback');
            const whisperResult = await transcribeWithWhisper(videoUrl);
            if (whisperResult.success && whisperResult.transcript) {
                console.log('[Transcript Admin] Successfully generated transcript via Whisper');
                return { success: true, transcript: whisperResult.transcript, source: 'whisper' };
            }
            console.log('[Transcript Admin] Whisper failed:', whisperResult.error);
        } else {
            console.log('[Transcript Admin] Whisper not available (OPENAI_API_KEY not set)');
        }

        return {
            success: false,
            error: 'Transcript generation failed. Please enter the transcript manually or try again later.'
        };
    }

    // Strategy 3: External URL - Not supported for auto-transcription
    console.log('[Transcript Admin] External URL detected, not supported for auto-transcription:', videoUrl);
    return {
        success: false,
        error: 'Automatic transcription is not available for external video URLs.'
    };
}

/**
 * Generate transcript from Mux using auto-generated captions
 */
async function generateMuxCaptionTranscript(playbackId: string): Promise<{
    success: boolean;
    transcript?: string;
    error?: string;
}> {
    try {
        // Step 1: Get asset ID from playback ID
        console.log('[Mux Caption] Looking up asset ID for playback ID:', playbackId);
        const assetId = await getAssetIdFromPlaybackId(playbackId);

        if (!assetId) {
            return { success: false, error: 'Could not find Mux asset for this video' };
        }

        console.log('[Mux Caption] Found asset ID:', assetId);

        // Step 2: Request auto-caption generation
        console.log('[Mux Caption] Requesting auto-caption generation');
        const captionResult = await requestMuxAutoCaption(assetId);

        if (!captionResult.success || !captionResult.trackIds?.length) {
            return {
                success: false,
                error: captionResult.error || 'Failed to request caption generation'
            };
        }

        console.log('[Mux Caption] Caption requested, track IDs:', captionResult.trackIds);

        // Step 3: Poll for caption completion
        console.log('[Mux Caption] Polling for caption completion (this may take 30-120 seconds)');
        const readyResult = await waitForMuxCaptionReady(assetId, captionResult.trackIds);

        if (!readyResult.ready || !readyResult.vttUrl) {
            return {
                success: false,
                error: readyResult.error || 'Caption generation timed out'
            };
        }

        console.log('[Mux Caption] Caption ready, VTT URL:', readyResult.vttUrl);

        // Step 4: Fetch and parse VTT
        console.log('[Mux Caption] Fetching VTT content');
        const vttResult = await fetchMuxVTT(readyResult.vttUrl);

        if (!vttResult.success || !vttResult.content) {
            return {
                success: false,
                error: vttResult.error || 'Failed to fetch caption content'
            };
        }

        // Step 5: Parse VTT to plain text
        console.log('[Mux Caption] Parsing VTT to transcript');
        const transcript = parseVTTToTranscript(vttResult.content);

        if (!transcript || transcript.trim().length === 0) {
            return { success: false, error: 'Caption content is empty' };
        }

        console.log('[Mux Caption] Transcript generated, length:', transcript.length);
        return { success: true, transcript };

    } catch (error: any) {
        console.error('[Mux Caption] Error:', error);
        return {
            success: false,
            error: error.message || 'Mux caption generation failed'
        };
    }
}

// ============================================
// AI Skills Generation from Transcripts
// ============================================

export async function generateSkillsFromTranscript(courseId: number): Promise<{
    success: boolean;
    skills?: string[];
    error?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    try {
        // Fetch course title
        const { data: course } = await supabase
            .from('courses')
            .select('title')
            .eq('id', courseId)
            .single();

        if (!course) {
            return { success: false, error: 'Course not found' };
        }

let courseContext = '';

        // Strategy 1: Try to use Course RAG (embeddings) for comprehensive content
        try {
            const { generateQueryEmbedding } = await import('@/lib/ai/embedding');
            const skillsQuery = `What are all the main topics, concepts, and skills taught in this course? What will learners be able to do after completing the course?`;
            const queryEmbedding = await generateQueryEmbedding(skillsQuery);

            if (queryEmbedding && queryEmbedding.length > 0) {
                const { data: contextItems, error: ragError } = await supabase.rpc('match_unified_embeddings', {
                    query_embedding: queryEmbedding,
                    match_threshold: 0.3,
                    match_count: 15,
                    filter_scope: {
                        allowedCourseIds: [courseId],
                        includePersonalContext: false
                    }
                });

                if (!ragError && contextItems && contextItems.length > 0) {
                    console.log(`[generateSkills] Using RAG context: ${contextItems.length} chunks`);
                    courseContext = contextItems.map((item: any) => {
                        const lessonTitle = item.metadata?.lesson_title || '';
                        const moduleTitle = item.metadata?.module_title || '';
                        const prefix = moduleTitle && lessonTitle
                            ? `[${moduleTitle} > ${lessonTitle}]`
                            : lessonTitle
                                ? `[${lessonTitle}]`
                                : '';
                        return `${prefix}\n${item.content}`;
                    }).join('\n\n---\n\n');
                }
            }
        } catch (ragErr) {
            console.warn('[generateSkills] RAG failed, falling back to direct query:', ragErr);
        }

        // Strategy 2: Fallback to direct lesson content query if RAG failed
        if (!courseContext) {
            console.log('[generateSkills] Falling back to direct lesson content query');

            // Get modules for this course
            const { data: modules } = await supabase
                .from('modules')
                .select('id, title')
                .eq('course_id', courseId)
                .order('order');

            if (!modules || modules.length === 0) {
                return { success: false, error: 'No modules found for this course' };
            }

            // Get lessons with content
            const { data: lessons } = await supabase
                .from('lessons')
                .select('id, title, content, module_id')
                .in('module_id', modules.map(m => m.id))
                .order('order');

            const lessonsWithContent = (lessons || []).filter(l => l.content && l.content.trim().length > 0);

            if (lessonsWithContent.length === 0) {
                return { success: false, error: 'No lesson content found. Please ensure the course has transcripts.' };
            }

            courseContext = lessonsWithContent.map(lesson => {
                const module = modules.find(m => m.id === lesson.module_id);
                return `[${module?.title || 'Module'} > ${lesson.title}]\n${lesson.content}`;
            }).join('\n\n---\n\n');

            // Truncate if too long (keep first ~30k chars to stay within token limits)
            if (courseContext.length > 30000) {
                courseContext = courseContext.substring(0, 30000) + '\n\n[... truncated for length ...]';
            }
        }

        if (!courseContext) {
            return { success: false, error: 'No course content found. Please ensure the course has lesson transcripts.' };
        }

        // Fetch the prompt and model from ai_prompt_library
        const { data: promptConfig } = await supabase
            .from('ai_prompt_library')
            .select('prompt_text, model')
            .eq('key', 'generate_skills')
            .single();

        const defaultPrompt = `You are an expert instructional designer specializing in HR professional development. Your task is to analyze course content and extract the key skills learners will gain.

Analyze the provided course transcript(s) and generate a list of 4-8 specific, actionable skills.

Guidelines for generating skills:
1. Use action verbs that indicate measurable outcomes (Apply, Analyze, Create, Evaluate, Implement, Design, Develop, etc.)
2. Be specific and concrete - avoid vague skills like "understand HR better" or "learn about compliance"
3. Focus on practical, workplace-applicable skills that professionals can immediately use
4. Each skill should be completable in one clear sentence (10-20 words ideal)
5. Skills should directly relate to content covered in the transcripts
6. Consider both technical/hard skills and strategic/soft skills where applicable
7. Frame skills from the learner's perspective using active voice
8. Ensure skills are differentiated - each should cover a distinct competency

Format your response as a JSON array of strings only, with no additional text or explanation.

Example format:
["Apply data-driven approaches to measure employee engagement effectiveness", "Design compensation structures that balance internal equity with market competitiveness", "Analyze turnover patterns to identify root causes and develop retention strategies"]

Course Title: {course_title}

Transcripts:
{transcripts}

Generate the skills list now (JSON array only):`;

        let prompt = promptConfig?.prompt_text || defaultPrompt;

        // Interpolate variables
        prompt = prompt.replace(/\{course_title\}/g, course.title);
        prompt = prompt.replace(/\{transcripts\}/g, courseContext);

        const model = promptConfig?.model || 'google/gemini-2.0-flash-001';

        // Use OpenRouter to call the model
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';

        if (!OPENROUTER_API_KEY) {
            return { success: false, error: 'OpenRouter API key not configured' };
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                'X-Title': 'EnhancedHR'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('OpenRouter API error:', errorData);
            return { success: false, error: 'Failed to generate skills with AI' };
        }

        const data = await response.json();
        const responseText = data.choices?.[0]?.message?.content || '';

        // Parse the JSON array from the response
        let skills: string[] = [];
        try {
            // Try to extract JSON array from the response
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                skills = JSON.parse(jsonMatch[0]);
            } else {
                // Fallback: try parsing the whole response
                skills = JSON.parse(responseText);
            }

            // Validate it's an array of strings
            if (!Array.isArray(skills) || !skills.every(s => typeof s === 'string')) {
                throw new Error('Invalid response format');
            }
        } catch (parseError) {
            console.error('Error parsing skills response:', parseError, responseText);
            return { success: false, error: 'AI generated an invalid response format. Please try again.' };
        }

        // Log the AI usage
        const admin = await createAdminClient();
        await admin.from('ai_logs').insert({
            user_id: user.id,
            agent_type: 'generate_skills',
            page_context: 'course_builder',
            prompt: prompt.substring(0, 500),
            response: responseText.substring(0, 1000),
            metadata: {
                course_id: courseId,
                model: model,
                skills_count: skills.length,
                context_length: courseContext.length
            }
        });

        return { success: true, skills };

    } catch (error: any) {
        console.error('Error generating skills:', error);
        return { success: false, error: error.message || 'Failed to generate skills' };
    }
}

// ============================================
// AI Course Description Generation
// ============================================

export async function generateCourseDescription(courseId: number): Promise<{
    success: boolean;
    description?: string;
    error?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    try {
        // Fetch course title
        const { data: course } = await supabase
            .from('courses')
            .select('title')
            .eq('id', courseId)
            .single();

        if (!course) {
            return { success: false, error: 'Course not found' };
        }

        // Fetch all modules for this course
        const { data: modules } = await supabase
            .from('modules')
            .select('id, title')
            .eq('course_id', courseId)
            .order('order');

        if (!modules || modules.length === 0) {
            return { success: false, error: 'No modules found for this course' };
        }

        // Fetch all lessons with content
        const { data: lessons } = await supabase
            .from('lessons')
            .select('id, title, content, module_id')
            .in('module_id', modules.map(m => m.id))
            .order('order');

        // Compile transcripts
        const transcriptsWithContent = (lessons || []).filter(l => l.content && l.content.trim().length > 0);

        if (transcriptsWithContent.length === 0) {
            return { success: false, error: 'No lesson transcripts found. Please add transcripts to lessons first.' };
        }

        // Build the transcript compilation
        const transcriptText = transcriptsWithContent.map(lesson => {
            const module = modules.find(m => m.id === lesson.module_id);
            return `## ${module?.title || 'Module'} - ${lesson.title}\n\n${lesson.content}`;
        }).join('\n\n---\n\n');

        // Fetch the prompt and model from ai_prompt_library
        const { data: promptConfig } = await supabase
            .from('ai_prompt_library')
            .select('prompt_text, model')
            .eq('key', 'generate_course_description')
            .single();

        const defaultPrompt = `You are an expert course marketing copywriter specializing in professional development and HR education. Your task is to write a compelling course description that will attract and inform potential learners.

Analyze the provided course transcript(s) and generate an engaging course description.

Guidelines:
1. Start with a strong hook that captures attention and highlights the value proposition
2. Clearly explain what learners will gain from this course
3. Highlight the practical, real-world applications of the content
4. Use professional but accessible language appropriate for HR professionals
5. Keep the description between 150-250 words - concise but comprehensive
6. Structure with a brief intro paragraph, key takeaways, and who should take this course
7. Avoid generic phrases like "this comprehensive course" - be specific about the content
8. End with a motivating call-to-action or benefit statement

Format: Return ONLY the description text, no JSON formatting or additional commentary.

Course Title: {course_title}

Course Content (transcripts from all lessons):
{transcripts}

Write the course description now:`;

        let prompt = promptConfig?.prompt_text || defaultPrompt;

        // Interpolate variables
        prompt = prompt.replace(/\{course_title\}/g, course.title);
        prompt = prompt.replace(/\{transcripts\}/g, transcriptText.substring(0, 30000)); // Limit transcript length

        const model = promptConfig?.model || 'google/gemini-2.0-flash-001';

        // Use OpenRouter to call the model
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';

        if (!OPENROUTER_API_KEY) {
            return { success: false, error: 'OpenRouter API key not configured' };
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                'X-Title': 'EnhancedHR'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('OpenRouter API error:', errorData);
            return { success: false, error: 'Failed to generate description with AI' };
        }

        const data = await response.json();
        const description = data.choices?.[0]?.message?.content?.trim() || '';

        // Log the AI usage
        const admin = await createAdminClient();
        await admin.from('ai_logs').insert({
            user_id: user.id,
            agent_type: 'generate_course_description',
            page_context: 'course_builder',
            prompt: prompt.substring(0, 500),
            response: description.substring(0, 1000),
            metadata: {
                course_id: courseId,
                model: model
            }
        });

        return { success: true, description };

    } catch (error: any) {
        console.error('Error generating course description:', error);
        return { success: false, error: error.message || 'Failed to generate description' };
    }
}

// ============================================
// Module Description Actions
// ============================================

// ============================================
// Lesson Reordering Actions
// ============================================

/**
 * Reorder lessons within a module (batch update)
 * @param lessonIds - Array of lesson IDs in the new order
 */
export async function reorderLessons(lessonIds: string[]): Promise<{
    success: boolean;
    error?: string;
}> {
    const admin = await createAdminClient();

    try {
        // Update each lesson's order based on position in array
        const updates = lessonIds.map((lessonId, index) =>
            admin
                .from('lessons')
                .update({ order: index })
                .eq('id', lessonId)
        );

        await Promise.all(updates);

        // Get any lesson to find course_id for revalidation
        if (lessonIds.length > 0) {
            const { data: lesson } = await admin
                .from('lessons')
                .select('module_id, modules(course_id)')
                .eq('id', lessonIds[0])
                .single();

            if (lesson?.modules) {
                revalidatePath(`/admin/courses/${(lesson.modules as any).course_id}/builder`);
            }
        }

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
 * @param newOrder - The position in the target module (optional, defaults to end)
 */
export async function moveLessonToModule(
    lessonId: string,
    targetModuleId: string,
    newOrder?: number
): Promise<{
    success: boolean;
    error?: string;
}> {
    const admin = await createAdminClient();

    try {
        // If no order specified, put it at the end
        if (newOrder === undefined) {
            const { data: existingLessons } = await admin
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
        const { error } = await admin
            .from('lessons')
            .update({
                module_id: targetModuleId,
                order: newOrder
            })
            .eq('id', lessonId);

        if (error) {
            return { success: false, error: error.message };
        }

        // Get course_id for revalidation
        const { data: module } = await admin
            .from('modules')
            .select('course_id')
            .eq('id', targetModuleId)
            .single();

        if (module) {
            revalidatePath(`/admin/courses/${module.course_id}/builder`);
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error moving lesson to module:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Reorder modules within a course (batch update)
 * @param moduleIds - Array of module IDs in the new order
 */
export async function reorderModules(moduleIds: string[]): Promise<{
    success: boolean;
    error?: string;
}> {
    const admin = await createAdminClient();

    try {
        // Update each module's order based on position in array
        const updates = moduleIds.map((moduleId, index) =>
            admin
                .from('modules')
                .update({ order: index })
                .eq('id', moduleId)
        );

        await Promise.all(updates);

        // Get any module to find course_id for revalidation
        if (moduleIds.length > 0) {
            const { data: module } = await admin
                .from('modules')
                .select('course_id')
                .eq('id', moduleIds[0])
                .single();

            if (module) {
                revalidatePath(`/admin/courses/${module.course_id}/builder`);
            }
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error reordering modules:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// Module Description Actions
// ============================================

export async function updateModuleDescription(moduleId: string, description: string) {
    const admin = await createAdminClient();

    const { error } = await admin
        .from('modules')
        .update({ description })
        .eq('id', moduleId);

    if (error) {
        console.error('Error updating module description:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function generateModuleDescription(moduleId: string): Promise<{
    success: boolean;
    description?: string;
    error?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    try {
        // Fetch module details
        const { data: module } = await supabase
            .from('modules')
            .select('id, title, course_id')
            .eq('id', moduleId)
            .single();

        if (!module) {
            return { success: false, error: 'Module not found' };
        }

        // Fetch all lessons in this module with content
        const { data: lessons } = await supabase
            .from('lessons')
            .select('id, title, content')
            .eq('module_id', moduleId)
            .order('order');

        const lessonsWithContent = (lessons || []).filter(l => l.content && l.content.trim().length > 0);

        if (lessonsWithContent.length === 0) {
            return { success: false, error: 'No lesson transcripts found in this module. Please add transcripts to lessons first.' };
        }

        // Build the transcript compilation
        const transcriptText = lessonsWithContent.map(lesson => {
            return `### ${lesson.title}\n\n${lesson.content}`;
        }).join('\n\n---\n\n');

        // Fetch the prompt and model from ai_prompt_library
        const { data: promptConfig } = await supabase
            .from('ai_prompt_library')
            .select('prompt_text, model')
            .eq('key', 'generate_module_description')
            .single();

        const defaultPrompt = `You are an expert instructional designer creating module summaries for professional development courses.

Analyze the lesson transcripts from this module and generate a concise, informative module description.

Guidelines:
1. Summarize the key topics and concepts covered in this module
2. Keep it brief - 2-4 sentences, approximately 50-100 words
3. Focus on what learners will learn and be able to do after completing this module
4. Use clear, professional language
5. Make it scannable - learners should quickly understand what this module covers
6. Avoid repeating the module title - add new information

Format: Return ONLY the description text, no JSON formatting or additional commentary.

Module Title: {module_title}

Lesson Transcripts:
{transcripts}

Write the module description now:`;

        let prompt = promptConfig?.prompt_text || defaultPrompt;

        // Interpolate variables
        prompt = prompt.replace(/\{module_title\}/g, module.title);
        prompt = prompt.replace(/\{transcripts\}/g, transcriptText.substring(0, 15000)); // Limit transcript length

        const model = promptConfig?.model || 'google/gemini-2.0-flash-001';

        // Use OpenRouter to call the model
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';

        if (!OPENROUTER_API_KEY) {
            return { success: false, error: 'OpenRouter API key not configured' };
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                'X-Title': 'EnhancedHR'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('OpenRouter API error:', errorData);
            return { success: false, error: 'Failed to generate description with AI' };
        }

        const data = await response.json();
        const description = data.choices?.[0]?.message?.content?.trim() || '';

        // Log the AI usage
        const admin = await createAdminClient();
        await admin.from('ai_logs').insert({
            user_id: user.id,
            agent_type: 'generate_module_description',
            page_context: 'course_builder',
            prompt: prompt.substring(0, 500),
            response: description.substring(0, 500),
            metadata: {
                module_id: moduleId,
                model: model
            }
        });

        return { success: true, description };

    } catch (error: any) {
        console.error('Error generating module description:', error);
        return { success: false, error: error.message || 'Failed to generate description' };
    }
}

// ============================================
// Course Duration Reset Action
// ============================================

import { getDurationFromPlaybackId } from './mux';
import { detectVideoPlatform, fetchVimeoMetadata, fetchWistiaMetadata, extractMuxPlaybackId } from './video-metadata';

/**
 * Format duration in seconds to a human-readable string
 * Examples: 120 -> "2m", 90 -> "1m 30s", 3730 -> "1h 2m"
 */
function formatDurationForCourse(seconds: number): string {
    if (seconds < 0 || !isFinite(seconds)) return '0m';

    const totalSeconds = Math.round(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
        if (mins > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${hours}h`;
    }

    if (mins > 0) {
        if (secs > 0 && mins < 10) {
            return `${mins}m ${secs}s`;
        }
        return `${mins}m`;
    }

    return secs > 0 ? `${secs}s` : '0m';
}

/**
 * Parse a duration string back to seconds
 * Supports formats: "2m", "1m 30s", "1h 2m", "45s"
 */
function parseDurationToSeconds(duration: string | null | undefined): number {
    if (!duration) return 0;

    let totalSeconds = 0;

    // Match hours
    const hoursMatch = duration.match(/(\d+)\s*h/i);
    if (hoursMatch) {
        totalSeconds += parseInt(hoursMatch[1], 10) * 3600;
    }

    // Match minutes
    const minsMatch = duration.match(/(\d+)\s*m(?!s)/i);
    if (minsMatch) {
        totalSeconds += parseInt(minsMatch[1], 10) * 60;
    }

    // Match seconds
    const secsMatch = duration.match(/(\d+)\s*s/i);
    if (secsMatch) {
        totalSeconds += parseInt(secsMatch[1], 10);
    }

    return totalSeconds;
}

export interface LessonDurationDetail {
    lessonId: string;
    lessonTitle: string;
    status: 'updated' | 'skipped' | 'failed';
    oldDuration?: string;
    newDuration?: string;
    error?: string;
}

export interface ResetDurationsResult {
    success: boolean;
    results?: {
        lessonsUpdated: number;
        lessonsSkipped: number;
        lessonsFailed: number;
        totalDuration: string;
        details: LessonDurationDetail[];
    };
    error?: string;
}

/**
 * Reset all course durations by fetching video metadata from their respective platforms.
 * Updates lesson durations, aggregates to modules, and updates the total course duration.
 *
 * @param courseId - The course ID to reset durations for
 * @returns Results with details about each lesson processed
 */
export async function resetCourseDurations(courseId: number): Promise<ResetDurationsResult> {
    const admin = await createAdminClient();

    try {
        console.log(`[resetCourseDurations] Starting duration reset for course ${courseId}`);

        // Fetch all modules with their lessons
        const { data: modules, error: modulesError } = await admin
            .from('modules')
            .select('id, title, lessons(id, title, video_url, duration, type)')
            .eq('course_id', courseId)
            .order('order');

        if (modulesError) {
            console.error('[resetCourseDurations] Error fetching modules:', modulesError);
            return { success: false, error: modulesError.message };
        }

        if (!modules || modules.length === 0) {
            return { success: false, error: 'No modules found for this course' };
        }

        const details: LessonDurationDetail[] = [];
        let lessonsUpdated = 0;
        let lessonsSkipped = 0;
        let lessonsFailed = 0;
        let totalCourseDurationSeconds = 0;

        // Process each module
        for (const courseModule of modules) {
            const lessons = courseModule.lessons as Array<{
                id: string;
                title: string;
                video_url: string | null;
                duration: string | null;
                type: string | null;
            }> || [];

            // Process each lesson
            for (const lesson of lessons) {
                // Skip non-video lessons or lessons without video_url
                if (lesson.type !== 'video' || !lesson.video_url) {
                    details.push({
                        lessonId: lesson.id,
                        lessonTitle: lesson.title,
                        status: 'skipped',
                        oldDuration: lesson.duration || undefined,
                        error: !lesson.video_url ? 'No video URL' : `Lesson type is "${lesson.type || 'unknown'}"`
                    });
                    lessonsSkipped++;

                    // Still count existing duration for non-video lessons
                    totalCourseDurationSeconds += parseDurationToSeconds(lesson.duration);
                    continue;
                }

                try {
                    // Detect the video platform
                    const platform = await detectVideoPlatform(lesson.video_url);
                    console.log(`[resetCourseDurations] Lesson "${lesson.title}" - Platform: ${platform}`);

                    let durationSeconds: number | undefined;
                    let fetchError: string | undefined;

                    switch (platform) {
                        case 'mux': {
                            // Extract playback ID from URL if needed
                            const playbackId = await extractMuxPlaybackId(lesson.video_url);
                            if (!playbackId) {
                                fetchError = 'Could not extract Mux playback ID from URL';
                                break;
                            }
                            const muxResult = await getDurationFromPlaybackId(playbackId);
                            if (muxResult.success && muxResult.duration !== undefined) {
                                durationSeconds = muxResult.duration;
                            } else {
                                fetchError = muxResult.error || 'Failed to get Mux duration';
                            }
                            break;
                        }
                        case 'youtube': {
                            const ytResult = await fetchYouTubeMetadata(lesson.video_url);
                            if (ytResult.success && ytResult.metadata?.duration !== undefined) {
                                durationSeconds = ytResult.metadata.duration;
                            } else {
                                fetchError = ytResult.error || 'Failed to get YouTube duration';
                            }
                            break;
                        }
                        case 'vimeo': {
                            const vimeoResult = await fetchVimeoMetadata(lesson.video_url);
                            if (vimeoResult.success && vimeoResult.duration !== undefined) {
                                durationSeconds = vimeoResult.duration;
                            } else {
                                fetchError = vimeoResult.error || 'Failed to get Vimeo duration';
                            }
                            break;
                        }
                        case 'wistia': {
                            const wistiaResult = await fetchWistiaMetadata(lesson.video_url);
                            if (wistiaResult.success && wistiaResult.duration !== undefined) {
                                durationSeconds = wistiaResult.duration;
                            } else {
                                fetchError = wistiaResult.error || 'Failed to get Wistia duration';
                            }
                            break;
                        }
                        case 'google_drive': {
                            // Google Drive videos don't have a duration API
                            // They need to be re-uploaded via Mux or have duration set manually
                            fetchError = 'Google Drive videos must be re-uploaded via Mux to get duration';
                            break;
                        }
                        default: {
                            fetchError = `Unsupported video platform: ${platform}`;
                        }
                    }

                    if (durationSeconds !== undefined) {
                        const newDuration = formatDurationForCourse(durationSeconds);

                        // Update the lesson duration
                        const { error: updateError } = await admin
                            .from('lessons')
                            .update({ duration: newDuration })
                            .eq('id', lesson.id);

                        if (updateError) {
                            details.push({
                                lessonId: lesson.id,
                                lessonTitle: lesson.title,
                                status: 'failed',
                                oldDuration: lesson.duration || undefined,
                                error: `Database update failed: ${updateError.message}`
                            });
                            lessonsFailed++;
                        } else {
                            details.push({
                                lessonId: lesson.id,
                                lessonTitle: lesson.title,
                                status: 'updated',
                                oldDuration: lesson.duration || undefined,
                                newDuration: newDuration
                            });
                            lessonsUpdated++;
                            totalCourseDurationSeconds += durationSeconds;
                        }
                    } else {
                        details.push({
                            lessonId: lesson.id,
                            lessonTitle: lesson.title,
                            status: 'failed',
                            oldDuration: lesson.duration || undefined,
                            error: fetchError || 'Could not determine duration'
                        });
                        lessonsFailed++;

                        // Still count existing duration if fetch failed
                        totalCourseDurationSeconds += parseDurationToSeconds(lesson.duration);
                    }
                } catch (err: any) {
                    console.error(`[resetCourseDurations] Error processing lesson "${lesson.title}":`, err);
                    details.push({
                        lessonId: lesson.id,
                        lessonTitle: lesson.title,
                        status: 'failed',
                        oldDuration: lesson.duration || undefined,
                        error: err.message || 'Unknown error'
                    });
                    lessonsFailed++;

                    // Still count existing duration if processing failed
                    totalCourseDurationSeconds += parseDurationToSeconds(lesson.duration);
                }
            }
        }

        // Also include estimated durations from module resources (files)
        const { data: allResources, error: resourcesError } = await admin
            .from('resources')
            .select('estimated_duration, module_id')
            .eq('course_id', courseId);

        if (!resourcesError && allResources) {
            for (const resource of allResources) {
                totalCourseDurationSeconds += parseDurationToSeconds(resource.estimated_duration);
            }
        }

        // Calculate and update total course duration
        const totalDuration = formatDurationForCourse(totalCourseDurationSeconds);

        console.log(`[resetCourseDurations] Updating course duration to: ${totalDuration}`);

        const { error: courseUpdateError } = await admin
            .from('courses')
            .update({ duration: totalDuration })
            .eq('id', courseId);

        if (courseUpdateError) {
            console.error('[resetCourseDurations] Error updating course duration:', courseUpdateError);
            // Don't fail the whole operation, just log the error
        }

        // Revalidate paths
        revalidatePath(`/admin/courses/${courseId}/builder`);
        revalidatePath(`/author/courses/${courseId}/builder`);
        revalidatePath(`/courses/${courseId}`);

        console.log(`[resetCourseDurations] Complete - Updated: ${lessonsUpdated}, Skipped: ${lessonsSkipped}, Failed: ${lessonsFailed}`);

        return {
            success: true,
            results: {
                lessonsUpdated,
                lessonsSkipped,
                lessonsFailed,
                totalDuration,
                details
            }
        };

    } catch (error: any) {
        console.error('[resetCourseDurations] Unexpected error:', error);
        return {
            success: false,
            error: error.message || 'An unexpected error occurred'
        };
    }
}

// ============================================
// Transcript Regeneration
// ============================================

export interface LessonTranscriptDetail {
    lessonId: string;
    lessonTitle: string;
    status: 'generated' | 'skipped' | 'failed';
    source?: string;
    error?: string;
}

export interface RegenerateTranscriptsResult {
    success: boolean;
    results?: {
        lessonsGenerated: number;
        lessonsSkipped: number;
        lessonsFailed: number;
        embeddingsCreated?: number;
        details: LessonTranscriptDetail[];
    };
    error?: string;
}

/**
 * Regenerate transcripts for all video lessons in a course.
 * Skips lessons that already have a user-entered transcript.
 *
 * @param courseId - The course ID to regenerate transcripts for
 * @returns Results with details about each lesson processed
 */
export async function regenerateCourseTranscripts(courseId: number): Promise<RegenerateTranscriptsResult> {
    const admin = await createAdminClient();

    try {
        console.log(`[regenerateCourseTranscripts] Starting transcript regeneration for course ${courseId}`);

        // Fetch all modules with their lessons
        const { data: modules, error: modulesError } = await admin
            .from('modules')
            .select('id, title, lessons(id, title, description, video_url, type, user_transcript, ai_transcript, transcript_source)')
            .eq('course_id', courseId)
            .order('order');

        if (modulesError) {
            console.error('[regenerateCourseTranscripts] Error fetching modules:', modulesError);
            return { success: false, error: modulesError.message };
        }

        if (!modules || modules.length === 0) {
            return { success: false, error: 'No modules found for this course' };
        }

        const details: LessonTranscriptDetail[] = [];
        let lessonsGenerated = 0;
        let lessonsSkipped = 0;
        let lessonsFailed = 0;
        let embeddingsCreated = 0;

        // Process each module
        for (const courseModule of modules) {
            const lessons = courseModule.lessons as Array<{
                id: string;
                title: string;
                description: string | null;
                video_url: string | null;
                type: string | null;
                user_transcript: string | null;
                ai_transcript: string | null;
                transcript_source: string | null;
            }> || [];

            // Process each lesson
            for (const lesson of lessons) {
                // Skip non-video lessons or lessons without video_url
                if (lesson.type !== 'video' || !lesson.video_url) {
                    details.push({
                        lessonId: lesson.id,
                        lessonTitle: lesson.title,
                        status: 'skipped',
                        error: !lesson.video_url ? 'No video URL' : `Lesson type is "${lesson.type || 'unknown'}"`
                    });
                    lessonsSkipped++;
                    continue;
                }

                // Skip lessons with user-entered transcripts (don't overwrite user content)
                if (lesson.user_transcript && lesson.user_transcript.trim().length > 0) {
                    details.push({
                        lessonId: lesson.id,
                        lessonTitle: lesson.title,
                        status: 'skipped',
                        error: 'Has user-entered transcript'
                    });
                    lessonsSkipped++;
                    continue;
                }

                try {
                    console.log(`[regenerateCourseTranscripts] Generating transcript for "${lesson.title}"`);

                    // Generate transcript
                    const result = await generateTranscriptFromVideo(lesson.video_url);

                    if (result.success && result.transcript) {
                        // Update the lesson with the new transcript
                        const { error: updateError } = await admin
                            .from('lessons')
                            .update({
                                ai_transcript: result.transcript,
                                transcript_source: result.source || 'ai',
                                transcript_status: 'ready'
                            })
                            .eq('id', lesson.id);

                        if (updateError) {
                            details.push({
                                lessonId: lesson.id,
                                lessonTitle: lesson.title,
                                status: 'failed',
                                error: `Database update failed: ${updateError.message}`
                            });
                            lessonsFailed++;
                        } else {
                            // Generate embeddings for RAG (cleans up stale embeddings automatically)
                            try {
                                const embedResult = await embedPlatformLessonContent(
                                    lesson.id,
                                    courseId,
                                    lesson.title,
                                    lesson.description || undefined,
                                    result.transcript,
                                    courseModule.title
                                );
                                if (embedResult.success) {
                                    embeddingsCreated += embedResult.embeddingCount;
                                    console.log(`[regenerateCourseTranscripts] Created ${embedResult.embeddingCount} embeddings for "${lesson.title}"`);
                                } else {
                                    console.warn(`[regenerateCourseTranscripts] Embedding failed for "${lesson.title}": ${embedResult.error}`);
                                }
                            } catch (embedErr) {
                                console.warn(`[regenerateCourseTranscripts] Embedding error for "${lesson.title}":`, embedErr);
                            }

                            details.push({
                                lessonId: lesson.id,
                                lessonTitle: lesson.title,
                                status: 'generated',
                                source: result.source
                            });
                            lessonsGenerated++;
                        }
                    } else {
                        details.push({
                            lessonId: lesson.id,
                            lessonTitle: lesson.title,
                            status: 'failed',
                            error: result.error || 'Could not generate transcript'
                        });
                        lessonsFailed++;
                    }
                    // Rate limiting: Wait 15 seconds between transcript requests
                    // Supadata free plan allows 1 req/sec, but we use 15s to be safe
                    await new Promise(resolve => setTimeout(resolve, 15000));
                } catch (err: any) {
                    console.error(`[regenerateCourseTranscripts] Error processing lesson "${lesson.title}":`, err);
                    details.push({
                        lessonId: lesson.id,
                        lessonTitle: lesson.title,
                        status: 'failed',
                        error: err.message || 'Unknown error'
                    });
                    lessonsFailed++;

                    // Rate limiting: Wait 15 seconds even after errors
                    await new Promise(resolve => setTimeout(resolve, 15000));
                }
            }
        }

        // Revalidate paths
        revalidatePath(`/admin/courses/${courseId}/builder`);
        revalidatePath(`/author/courses/${courseId}/builder`);
        revalidatePath(`/courses/${courseId}`);

        console.log(`[regenerateCourseTranscripts] Complete - Generated: ${lessonsGenerated}, Skipped: ${lessonsSkipped}, Failed: ${lessonsFailed}, Embeddings: ${embeddingsCreated}`);

        return {
            success: true,
            results: {
                lessonsGenerated,
                lessonsSkipped,
                lessonsFailed,
                embeddingsCreated,
                details
            }
        };

    } catch (error: any) {
        console.error('[regenerateCourseTranscripts] Unexpected error:', error);
        return {
            success: false,
            error: error.message || 'An unexpected error occurred'
        };
    }
}
