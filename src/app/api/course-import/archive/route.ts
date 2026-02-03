/**
 * Course Archive API Endpoint
 *
 * Archives a course on production by setting its status to 'archived'.
 * Used during course management to retire outdated courses.
 *
 * POST /api/course-import/archive
 * Body: { courseId, secretKey }
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface ArchiveCourseRequest {
    courseId: number;
    secretKey: string;
}

export async function POST(request: Request) {
    try {
        const { courseId, secretKey }: ArchiveCourseRequest = await request.json();

        // Validate secret key
        if (secretKey !== process.env.COURSE_IMPORT_SECRET) {
            console.error('[Course Archive] Invalid secret key');
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        if (!courseId) {
            return NextResponse.json(
                { success: false, error: 'Missing required field: courseId' },
                { status: 400 }
            );
        }

        console.log(`[Course Archive] Archiving course ${courseId}`);

        const supabase = createAdminClient();

        // Verify course exists before archiving
        const { data: course, error: fetchError } = await supabase
            .from('courses')
            .select('id, title, status')
            .eq('id', courseId)
            .single();

        if (fetchError || !course) {
            console.error('[Course Archive] Course not found:', fetchError);
            return NextResponse.json(
                { success: false, error: `Course ${courseId} not found` },
                { status: 404 }
            );
        }

        // Update course status to archived
        const { error: updateError } = await supabase
            .from('courses')
            .update({ status: 'archived' })
            .eq('id', courseId);

        if (updateError) {
            console.error('[Course Archive] Error:', updateError);
            return NextResponse.json(
                { success: false, error: updateError.message },
                { status: 500 }
            );
        }

        console.log(`[Course Archive] Successfully archived course ${courseId}: "${course.title}"`);

        return NextResponse.json({
            success: true,
            courseId,
            title: course.title,
            previousStatus: course.status,
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Course Archive] Error:', errorMessage);
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
