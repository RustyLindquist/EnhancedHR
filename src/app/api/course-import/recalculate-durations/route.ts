/**
 * Course Duration Recalculation API Endpoint
 *
 * Recalculates course durations by:
 * 1. For each course (or a specific course), fetching all video durations from YouTube/Mux/Vimeo
 * 2. Summing lesson durations + resource estimated_durations
 * 3. Updating the course duration field
 *
 * Uses resetCourseDurations() which does a DEEP recalculation (re-fetches from video APIs).
 *
 * POST /api/course-import/recalculate-durations
 * Body: { secretKey, courseId? }
 *   - secretKey: Required. COURSE_IMPORT_SECRET for authentication.
 *   - courseId: Optional. If provided, recalculates only that course.
 *              If omitted, recalculates ALL published courses.
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resetCourseDurations } from '@/app/actions/course-builder';

export const maxDuration = 300; // 5 minutes — Mux API lookups can be slow

interface RecalculateRequest {
    secretKey: string;
    courseId?: number;
}

export async function POST(request: Request) {
    try {
        const { secretKey, courseId }: RecalculateRequest = await request.json();

        if (secretKey !== process.env.COURSE_IMPORT_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const admin = createAdminClient();

        // If a specific courseId is provided, just recalculate that one
        if (courseId) {
            console.log(`[Recalculate Durations] Starting for course ${courseId}`);
            const result = await resetCourseDurations(courseId);
            return NextResponse.json({
                success: true,
                coursesProcessed: 1,
                results: [{ courseId, ...result }]
            });
        }

        // Otherwise, recalculate ALL courses
        console.log('[Recalculate Durations] Starting for ALL courses');

        const { data: courses, error } = await admin
            .from('courses')
            .select('id, title, duration')
            .order('id');

        if (error) {
            console.error('[Recalculate Durations] Error fetching courses:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!courses || courses.length === 0) {
            return NextResponse.json({ success: true, coursesProcessed: 0, results: [] });
        }

        console.log(`[Recalculate Durations] Processing ${courses.length} courses`);

        const results = [];
        let successCount = 0;
        let failCount = 0;

        for (const course of courses) {
            try {
                console.log(`[Recalculate Durations] Processing course ${course.id}: "${course.title}" (was: ${course.duration})`);
                const result = await resetCourseDurations(course.id);

                results.push({
                    courseId: course.id,
                    title: course.title,
                    oldDuration: course.duration,
                    newDuration: result.results?.totalDuration || 'unknown',
                    success: result.success,
                    lessonsUpdated: result.results?.lessonsUpdated || 0,
                    lessonsFailed: result.results?.lessonsFailed || 0,
                    error: result.error
                });

                if (result.success) {
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (err: any) {
                console.error(`[Recalculate Durations] Error on course ${course.id}:`, err);
                results.push({
                    courseId: course.id,
                    title: course.title,
                    oldDuration: course.duration,
                    success: false,
                    error: err.message
                });
                failCount++;
            }
        }

        console.log(`[Recalculate Durations] Complete. Success: ${successCount}, Failed: ${failCount}`);

        return NextResponse.json({
            success: true,
            coursesProcessed: courses.length,
            successCount,
            failCount,
            results
        });

    } catch (err: any) {
        console.error('[Recalculate Durations] Unexpected error:', err);
        return NextResponse.json(
            { error: err.message || 'Unexpected error' },
            { status: 500 }
        );
    }
}
