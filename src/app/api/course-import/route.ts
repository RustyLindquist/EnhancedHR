/**
 * Course Import API Endpoint
 *
 * Receives course data from local development and creates it on production.
 * Part of the course promotion feature for migrating courses between environments.
 *
 * POST /api/course-import
 * Body: { course, modules, lessons, resources, secretKey }
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface CourseData {
    title: string;
    subtitle?: string;
    description?: string;
    thumbnail_url?: string;
    image_url?: string;
    price?: number;
    author_id?: string;
    author?: string;
    difficulty_level?: string;
    estimated_duration?: string;
    duration?: string;
    category?: string;
    tags?: string[];
    skills?: string[];
    badges?: string[];
}

interface ModuleData {
    id: string;
    title: string;
    description?: string;
    order_index?: number;
    order?: number;
}

interface LessonData {
    module_id: string;
    title: string;
    type?: string;
    content?: string;
    video_url?: string;
    duration?: string;
    order_index?: number;
    order?: number;
    quiz_data?: any;
}

interface ResourceData {
    title: string;
    type: string;
    url: string;
    description?: string;
    summary?: string;
    size?: string;
}

interface ImportRequestBody {
    course: CourseData;
    modules: ModuleData[];
    lessons: LessonData[];
    resources?: ResourceData[];
    secretKey: string;
}

export async function POST(request: Request) {
    try {
        const body: ImportRequestBody = await request.json();
        const { course, modules, lessons, resources, secretKey } = body;

        // 1. Validate secret key
        if (secretKey !== process.env.COURSE_IMPORT_SECRET) {
            console.error('[Course Import] Invalid secret key');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!course || !modules || !lessons) {
            return NextResponse.json(
                { error: 'Missing required fields: course, modules, lessons' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // 2. Create course record (without id, let DB generate it)
        const courseData = {
            title: course.title,
            description: course.description || course.subtitle || null,
            image_url: course.thumbnail_url || course.image_url || null,
            status: 'draft', // Always start as draft on production
            author_id: course.author_id || null,
            author: course.author || 'Unknown',
            duration: course.estimated_duration || course.duration || null,
            category: course.category || 'General',
            badges: course.badges || [],
            skills: course.skills || [],
            // Note: price, difficulty_level, tags may not exist in schema
        };

        console.log('[Course Import] Creating course:', courseData.title);

        const { data: newCourse, error: courseError } = await supabase
            .from('courses')
            .insert(courseData)
            .select()
            .single();

        if (courseError) {
            console.error('[Course Import] Course creation error:', courseError);
            throw new Error(`Failed to create course: ${courseError.message}`);
        }

        console.log('[Course Import] Course created with ID:', newCourse.id);

        // 3. Create modules with new course_id
        // Map old module IDs to new module IDs
        const moduleIdMap = new Map<string, string>();

        for (const module of modules) {
            const moduleData = {
                course_id: newCourse.id,
                title: module.title,
                description: module.description || null,
                order: module.order_index ?? module.order ?? 0,
            };

            const { data: newModule, error: moduleError } = await supabase
                .from('modules')
                .insert(moduleData)
                .select()
                .single();

            if (moduleError) {
                console.error('[Course Import] Module creation error:', moduleError);
                throw new Error(`Failed to create module "${module.title}": ${moduleError.message}`);
            }

            moduleIdMap.set(module.id, newModule.id);
            console.log(`[Course Import] Module created: ${module.title} (${module.id} -> ${newModule.id})`);
        }

        // 4. Create lessons with new module_ids
        let videoLessonCount = 0;

        for (const lesson of lessons) {
            const newModuleId = moduleIdMap.get(lesson.module_id);
            if (!newModuleId) {
                console.warn(`[Course Import] Skipping lesson "${lesson.title}" - module_id ${lesson.module_id} not found`);
                continue;
            }

            const lessonData = {
                module_id: newModuleId,
                title: lesson.title,
                type: lesson.type || 'video',
                content: lesson.content || null,
                video_url: lesson.video_url || null,
                duration: lesson.duration || null,
                order: lesson.order_index ?? lesson.order ?? 0,
                quiz_data: lesson.quiz_data || null,
            };

            const { data: newLesson, error: lessonError } = await supabase
                .from('lessons')
                .insert(lessonData)
                .select()
                .single();

            if (lessonError) {
                console.error('[Course Import] Lesson creation error:', lessonError);
                throw new Error(`Failed to create lesson "${lesson.title}": ${lessonError.message}`);
            }

            if (lesson.type === 'video' && lesson.video_url) {
                videoLessonCount++;
            }

            console.log(`[Course Import] Lesson created: ${lesson.title}`);
        }

        // 5. Create resources with new course_id
        if (resources && resources.length > 0) {
            for (const resource of resources) {
                const resourceData = {
                    course_id: newCourse.id,
                    title: resource.title,
                    type: resource.type,
                    url: resource.url,
                    size: resource.size || null,
                    summary: resource.summary || resource.description || null,
                };

                const { error: resourceError } = await supabase
                    .from('resources')
                    .insert(resourceData);

                if (resourceError) {
                    console.warn(`[Course Import] Resource creation warning: ${resourceError.message}`);
                    // Continue with other resources even if one fails
                }
            }
            console.log(`[Course Import] Created ${resources.length} resources`);
        }

        // 6. Create import status record for tracking video processing
        const { error: statusError } = await supabase
            .from('course_import_status')
            .insert({
                course_id: newCourse.id,
                course_title: newCourse.title,
                total_videos: videoLessonCount,
                processed_videos: 0,
                status: 'pending',
            });

        if (statusError) {
            // Log but don't fail - status tracking is optional
            console.warn('[Course Import] Status record creation warning:', statusError.message);
        }

        console.log('[Course Import] Import complete for course:', newCourse.title);

        // 7. Return success with new course ID
        return NextResponse.json({
            success: true,
            productionCourseId: newCourse.id,
            modulesCreated: modules.length,
            lessonsCreated: lessons.length,
            resourcesCreated: resources?.length || 0,
            videoLessons: videoLessonCount,
            message: 'Course imported successfully. Video processing will begin shortly.',
        });

    } catch (error: any) {
        console.error('[Course Import] Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to import course',
            },
            { status: 500 }
        );
    }
}
