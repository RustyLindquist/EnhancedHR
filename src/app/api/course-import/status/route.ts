/**
 * Course Import Status API Endpoint
 *
 * Returns the current status of a course import, including video processing progress.
 *
 * GET /api/course-import/status?courseId=123&secretKey=xxx
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const secretKey = searchParams.get('secretKey');

    // Validate secret key
    if (secretKey !== process.env.COURSE_IMPORT_SECRET) {
        console.error('[Import Status] Invalid secret key');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!courseId) {
        return NextResponse.json(
            { error: 'Missing required parameter: courseId' },
            { status: 400 }
        );
    }

    const supabase = createAdminClient();

    // Fetch import status
    const { data: status, error: statusError } = await supabase
        .from('course_import_status')
        .select('*')
        .eq('course_id', parseInt(courseId))
        .single();

    if (statusError) {
        // Check if it's a "not found" error
        if (statusError.code === 'PGRST116') {
            return NextResponse.json(
                { error: 'Import status not found for this course' },
                { status: 404 }
            );
        }
        console.error('[Import Status] Error fetching status:', statusError);
        return NextResponse.json(
            { error: statusError.message },
            { status: 500 }
        );
    }

    // Calculate progress percentage
    const progress = status.total_videos > 0
        ? Math.round((status.processed_videos / status.total_videos) * 100)
        : 100;

    return NextResponse.json({
        success: true,
        status: {
            ...status,
            progress,
        },
    });
}
