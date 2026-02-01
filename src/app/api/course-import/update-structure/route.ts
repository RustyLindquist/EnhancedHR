/**
 * Course Structure Update API Endpoint
 *
 * Updates a course's module and lesson structure on production.
 * Preserves video URLs while updating titles and organization.
 *
 * POST /api/course-import/update-structure
 * Body: { courseId, modules: [{ title, order, lessons: [{ title, video_url, order }] }], secretKey }
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface LessonInput {
    title: string;
    video_url: string | null;
    order: number;
    content?: string | null;
    duration?: string | null;
}

interface ModuleInput {
    title: string;
    order: number;
    lessons: LessonInput[];
}

interface UpdateStructureRequest {
    courseId: number;
    modules: ModuleInput[];
    secretKey: string;
}

export async function POST(request: Request) {
    try {
        const { courseId, modules, secretKey }: UpdateStructureRequest = await request.json();

        // Validate secret key
        if (secretKey !== process.env.COURSE_IMPORT_SECRET) {
            console.error('[Structure Update] Invalid secret key');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!courseId || !modules || modules.length === 0) {
            return NextResponse.json(
                { error: 'Missing required fields: courseId and modules' },
                { status: 400 }
            );
        }

        console.log(`[Structure Update] Updating course ${courseId} with ${modules.length} modules`);

        const supabase = createAdminClient();

        // Step 1: Get existing modules to delete
        const { data: existingModules } = await supabase
            .from('modules')
            .select('id')
            .eq('course_id', courseId);

        // Step 2: Delete existing modules (lessons cascade delete)
        if (existingModules && existingModules.length > 0) {
            for (const mod of existingModules) {
                await supabase.from('modules').delete().eq('id', mod.id);
            }
            console.log(`[Structure Update] Deleted ${existingModules.length} existing modules`);
        }

        // Step 3: Create new modules and lessons
        let totalLessons = 0;

        for (const moduleInput of modules) {
            // Create module
            const { data: newModule, error: modError } = await supabase
                .from('modules')
                .insert({
                    course_id: courseId,
                    title: moduleInput.title,
                    order: moduleInput.order
                })
                .select()
                .single();

            if (modError || !newModule) {
                console.error(`[Structure Update] Failed to create module: ${moduleInput.title}`, modError);
                continue;
            }

            // Create lessons for this module
            for (const lessonInput of moduleInput.lessons) {
                const { error: lessonError } = await supabase
                    .from('lessons')
                    .insert({
                        module_id: newModule.id,
                        title: lessonInput.title,
                        video_url: lessonInput.video_url,
                        content: lessonInput.content || null,
                        duration: lessonInput.duration || null,
                        order: lessonInput.order,
                        type: 'video'
                    });

                if (lessonError) {
                    console.error(`[Structure Update] Failed to create lesson: ${lessonInput.title}`, lessonError);
                } else {
                    totalLessons++;
                }
            }
        }

        console.log(`[Structure Update] Created ${modules.length} modules, ${totalLessons} lessons for course ${courseId}`);

        return NextResponse.json({
            success: true,
            courseId,
            modulesCreated: modules.length,
            lessonsCreated: totalLessons
        });

    } catch (error: any) {
        console.error('[Structure Update] Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
