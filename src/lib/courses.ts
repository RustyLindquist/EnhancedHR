import { createClient } from '@/lib/supabase/client';
import { Course, Module } from '@/types';

export async function fetchCourses(): Promise<Course[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching courses:', error);
        return [];
    }

    return data.map((course: any) => ({
        id: course.id,
        title: course.title,
        author: course.author,
        progress: 0, // Default for now, will integrate user_progress later
        category: course.category,
        image: course.image_url,
        description: course.description,
        duration: course.duration,
        rating: Number(course.rating),
        badges: course.badges || [],
        isSaved: false, // Default, will integrate user_collections later
        collections: [],
        dateAdded: course.created_at
    }));
}

export async function fetchCourseModules(courseId: number): Promise<Module[]> {
    const supabase = createClient();

    // Fetch modules
    const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order', { ascending: true });

    if (modulesError) {
        console.error('Error fetching modules:', modulesError);
        return [];
    }

    // Fetch lessons for all modules in this course
    // Optimization: Fetch all lessons for the course in one go instead of N+1 queries
    const moduleIds = modules.map(m => m.id);
    const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .in('module_id', moduleIds)
        .order('order', { ascending: true });

    if (lessonsError) {
        console.error('Error fetching lessons:', lessonsError);
        return [];
    }

    // Map lessons to their modules
    return modules.map((module: any) => ({
        id: module.id,
        title: module.title,
        duration: module.duration,
        lessons: lessons
            .filter((l: any) => l.module_id === module.id)
            .map((l: any) => ({
                id: l.id,
                title: l.title,
                duration: l.duration,
                isCompleted: false, // TODO: Integrate with user_progress
                type: l.type,
                video_url: l.video_url,
                content: l.content,
                quiz_data: l.quiz_data
            }))
    }));
}

export async function fetchUserCourseProgress(userId: string, courseId: number): Promise<{ lastViewedLessonId: string | null, completedLessonIds: string[] }> {
    const supabase = createClient();

    // 1. Fetch all progress records for this user/course
    const { data, error } = await supabase
        .from('user_progress')
        .select('lesson_id, is_completed, last_accessed')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .order('last_accessed', { ascending: false });

    if (error) {
        console.error('Error fetching user progress:', error);
        return { lastViewedLessonId: null, completedLessonIds: [] };
    }

    // 2. Determine last viewed lesson (first record due to sort)
    const lastViewedLessonId = data.length > 0 ? data[0].lesson_id : null;

    // 3. Get list of completed lessons
    const completedLessonIds = data
        .filter((record: any) => record.is_completed)
        .map((record: any) => record.lesson_id);

    return { lastViewedLessonId, completedLessonIds };
}
