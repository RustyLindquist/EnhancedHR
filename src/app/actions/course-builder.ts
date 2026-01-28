'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { embedCourseResource, deleteCourseResourceEmbeddings } from '@/lib/context-embeddings';
import { fetchYouTubeMetadata, fetchYouTubeTranscript, isYouTubeUrl } from '@/lib/youtube';
import { generateTranscriptFromYouTubeAudio } from '@/lib/audio-transcription';

// ============================================
// Course Metadata Actions
// ============================================

/**
 * Get distinct categories from published courses
 * Used to populate the category dropdown dynamically
 */
export async function getPublishedCategories(): Promise<{
    success: boolean;
    categories?: string[];
    error?: string;
}> {
    const admin = await createAdminClient();

    const { data, error } = await admin
        .from('courses')
        .select('category')
        .eq('status', 'published')
        .not('category', 'is', null);

    if (error) {
        console.error('[getPublishedCategories] Error:', error);
        return { success: false, error: error.message };
    }

    // Get unique categories, sorted alphabetically
    const categories = [...new Set(data.map(c => c.category).filter(Boolean))].sort();

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

export async function updateCourseDetails(courseId: number, data: {
    title?: string;
    description?: string;
    category?: string;
    status?: 'draft' | 'pending_review' | 'published' | 'archived';
    duration?: string;
}) {
    const admin = await createAdminClient();

    const { error } = await admin
        .from('courses')
        .update(data)
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

    // Delete all lessons in this module first
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

    const nextOrder = existingLessons && existingLessons.length > 0
        ? (existingLessons[0].order || 0) + 1
        : 0;

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

    // Get module/course info before deleting
    const { data: lesson } = await admin
        .from('lessons')
        .select('module_id, modules(course_id)')
        .eq('id', lessonId)
        .single();

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
}) {
    const admin = await createAdminClient();

    const { data: resource, error } = await admin
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

export async function deleteCourseResource(resourceId: string, courseId: number) {
    const admin = await createAdminClient();

    // Delete embeddings first (before the resource record)
    deleteCourseResourceEmbeddings(resourceId).catch(err => {
        console.error('[deleteCourseResource] Failed to delete embeddings:', err);
    });

    const { error } = await admin
        .from('resources')
        .delete()
        .eq('id', resourceId);

    if (error) {
        console.error('Error deleting resource:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/admin/courses/${courseId}/builder`);
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
            category: 'General',
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
        category: course.category,
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
                isCompleted: false
            }))
    }));

    const mappedResources = (resources || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        url: r.url,
        size: r.size
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

export async function generateTranscriptFromVideo(videoUrl: string): Promise<{
    success: boolean;
    transcript?: string;
    error?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Check if this is a YouTube URL and try to get transcript directly
    if (await isYouTubeUrl(videoUrl)) {
        console.log('[Transcript] Detected YouTube URL, attempting direct transcript fetch');
        const ytResult = await fetchYouTubeTranscript(videoUrl);
        if (ytResult.success && ytResult.transcript) {
            console.log('[Transcript] Successfully fetched YouTube transcript');
            return { success: true, transcript: ytResult.transcript };
        }
        console.log('[Transcript] YouTube transcript not available:', ytResult.error);

        // Try audio extraction fallback for YouTube videos
        console.log('[Transcript] Attempting audio extraction fallback for YouTube video...');
        const audioResult = await generateTranscriptFromYouTubeAudio(videoUrl);
        if (audioResult.success && audioResult.transcript) {
            console.log('[Transcript] Successfully generated transcript via audio extraction');
            return { success: true, transcript: audioResult.transcript };
        }
        console.log('[Transcript] Transcription service failed:', audioResult.error);
        // For YouTube URLs, don't fall through to OpenRouter - it can't access YouTube videos
        // Return the actual error from the transcription service
        return {
            success: false,
            error: audioResult.error || 'Unable to generate transcript for this video. Please try again or manually enter the transcript.'
        };
    }

    // Check if this is a Mux playback ID (short alphanumeric string)
    const isMuxId = /^[a-zA-Z0-9]{10,}$/.test(videoUrl) && !videoUrl.includes('.');

    let processableUrl = videoUrl;
    if (isMuxId) {
        // For Mux videos, use the MP4 rendition URL
        // Mux provides static MP4 renditions at this URL pattern
        processableUrl = `https://stream.mux.com/${videoUrl}/high.mp4`;
    }

    try {
        // Fetch the prompt and model from ai_prompt_library
        const { data: promptConfig } = await supabase
            .from('ai_prompt_library')
            .select('prompt_text, model')
            .eq('key', 'generate_transcript')
            .single();

        const prompt = promptConfig?.prompt_text || `You are a professional transcription assistant. Watch this video carefully and produce a detailed, accurate transcript.

Guidelines:
- Transcribe all spoken words exactly as said
- Include speaker labels if there are multiple speakers (e.g., "Speaker 1:", "Speaker 2:")
- Note any significant non-verbal sounds in brackets [applause], [music], [silence]
- Break the transcript into logical paragraphs
- Use proper punctuation and formatting
- If there are slides or on-screen text that's important, note them in brackets
- Maintain the natural flow and timing of speech

Produce the full transcript now:`;

        const model = promptConfig?.model || 'google/gemini-2.0-flash-001';

        // Use OpenRouter to call the model with video content
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';

        if (!OPENROUTER_API_KEY) {
            return { success: false, error: 'OpenRouter API key not configured' };
        }

        // For video processing, we'll use the model's multimodal capabilities
        // OpenRouter supports passing video URLs to compatible models
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
                        content: [
                            {
                                type: 'text',
                                text: prompt
                            },
                            {
                                type: 'video_url',
                                video_url: {
                                    url: processableUrl
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 8000
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('OpenRouter API error:', errorData);

            // If video_url isn't supported, try with just text and URL reference
            const fallbackResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
                            content: `${prompt}\n\nVideo URL: ${processableUrl}\n\nNote: Please analyze this video and provide a transcript. If you cannot access the video directly, please indicate that and I will provide an alternative method.`
                        }
                    ],
                    max_tokens: 8000
                })
            });

            if (!fallbackResponse.ok) {
                return { success: false, error: 'Failed to process video with AI' };
            }

            const fallbackData = await fallbackResponse.json();
            const transcript = fallbackData.choices?.[0]?.message?.content || '';

            // If the model says it can't access the video, return helpful error
            if (transcript.toLowerCase().includes("cannot access") ||
                transcript.toLowerCase().includes("unable to access") ||
                transcript.toLowerCase().includes("don't have access")) {
                return {
                    success: false,
                    error: 'The AI model cannot directly access video content. Please ensure the video URL is publicly accessible or try uploading to a supported video host.'
                };
            }

            return { success: true, transcript };
        }

        const data = await response.json();
        const transcript = data.choices?.[0]?.message?.content || '';

        // Log the AI usage
        const admin = await createAdminClient();
        await admin.from('ai_logs').insert({
            user_id: user.id,
            agent_type: 'generate_transcript',
            page_context: 'course_builder',
            prompt: prompt.substring(0, 500),
            response: transcript.substring(0, 1000),
            metadata: {
                video_url: videoUrl,
                model: model
            }
        });

        return { success: true, transcript };

    } catch (error: any) {
        console.error('Error generating transcript:', error);
        return { success: false, error: error.message || 'Failed to generate transcript' };
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
        prompt = prompt.replace(/\{transcripts\}/g, transcriptText);

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
                skills_count: skills.length
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
