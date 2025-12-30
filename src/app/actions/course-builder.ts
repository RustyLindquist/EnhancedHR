'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ============================================
// Course Metadata Actions
// ============================================

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
    status?: 'draft' | 'published' | 'archived';
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

    revalidatePath(`/admin/courses/${courseId}/builder`);
    revalidatePath('/admin/courses');
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

export async function assignCourseExpert(courseId: number, expertId: string | null) {
    const admin = await createAdminClient();

    // If expertId provided, get the expert's name
    let authorName = null;
    if (expertId) {
        const { data: profile } = await admin
            .from('profiles')
            .select('full_name')
            .eq('id', expertId)
            .single();
        authorName = profile?.full_name;
    }

    const { error } = await admin
        .from('courses')
        .update({
            author_id: expertId,
            author: authorName
        })
        .eq('id', courseId);

    if (error) {
        console.error('Error assigning course expert:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/admin/courses/${courseId}/builder`);
    return { success: true };
}

export async function getApprovedExperts() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, expert_title, avatar_url')
        .eq('author_status', 'approved')
        .order('full_name');

    if (error) {
        console.error('Error fetching approved experts:', error);
        return [];
    }

    return data || [];
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

// ============================================
// Lesson Actions
// ============================================

export async function createLesson(moduleId: string, data: {
    title: string;
    type: 'video' | 'quiz' | 'article';
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
            duration: '0m'
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

export async function updateLesson(lessonId: string, data: {
    title?: string;
    video_url?: string;
    content?: string;
    duration?: string;
    order?: number;
    quiz_data?: any;
}) {
    const admin = await createAdminClient();

    // Get module to find course_id
    const { data: lesson } = await admin
        .from('lessons')
        .select('module_id, modules(course_id)')
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

    if (lesson?.modules) {
        revalidatePath(`/admin/courses/${(lesson.modules as any).course_id}/builder`);
    }
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
        .from('course_resources')
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

    revalidatePath(`/admin/courses/${courseId}/builder`);
    return { success: true, resource };
}

export async function deleteCourseResource(resourceId: string, courseId: number) {
    const admin = await createAdminClient();

    const { error } = await admin
        .from('course_resources')
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
            badges: []
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
        .from('course_resources')
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
