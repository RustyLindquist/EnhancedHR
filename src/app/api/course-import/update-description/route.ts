/**
 * Course Description Update API Endpoint
 *
 * Updates a course description on production.
 * Used during course migration to fix missing/generic descriptions.
 *
 * POST /api/course-import/update-description
 * Body: { courseId, description, secretKey }
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface UpdateDescriptionRequest {
    courseId: number;
    description: string;
    secretKey: string;
}

export async function POST(request: Request) {
    try {
        const { courseId, description, secretKey }: UpdateDescriptionRequest = await request.json();

        // Validate secret key
        if (secretKey !== process.env.COURSE_IMPORT_SECRET) {
            console.error('[Description Update] Invalid secret key');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!courseId || !description) {
            return NextResponse.json(
                { error: 'Missing required fields: courseId and description' },
                { status: 400 }
            );
        }

        console.log(`[Description Update] Updating course ${courseId}`);

        const supabase = createAdminClient();

        const { error } = await supabase
            .from('courses')
            .update({ description })
            .eq('id', courseId);

        if (error) {
            console.error('[Description Update] Error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            courseId,
        });

    } catch (error: any) {
        console.error('[Description Update] Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
