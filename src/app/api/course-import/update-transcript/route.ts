/**
 * Lesson Transcript Update API Endpoint
 *
 * Updates a lesson's AI transcript on production.
 * Used by fetch-transcripts-ytdlp.ts to bulk update transcripts.
 *
 * POST /api/course-import/update-transcript
 * Body: { lessonId, transcript, courseId, secretKey }
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface UpdateTranscriptRequest {
    lessonId: string;
    transcript: string;
    courseId: number;
    secretKey: string;
}

export async function POST(request: Request) {
    try {
        const { lessonId, transcript, courseId, secretKey }: UpdateTranscriptRequest = await request.json();

        // Validate secret key
        if (secretKey !== process.env.COURSE_IMPORT_SECRET) {
            console.error('[Transcript Update] Invalid secret key');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!lessonId || !transcript) {
            return NextResponse.json(
                { error: 'Missing required fields: lessonId and transcript' },
                { status: 400 }
            );
        }

        console.log(`[Transcript Update] Updating lesson ${lessonId} (course ${courseId})`);

        const supabase = createAdminClient();

        // Verify lesson belongs to the specified course
        const { data: lesson, error: fetchError } = await supabase
            .from('lessons')
            .select('id, modules!inner(course_id)')
            .eq('id', lessonId)
            .single();

        if (fetchError || !lesson) {
            console.error('[Transcript Update] Lesson not found:', fetchError);
            return NextResponse.json(
                { error: 'Lesson not found' },
                { status: 404 }
            );
        }

        const lessonCourseId = (lesson.modules as any).course_id;
        if (lessonCourseId !== courseId) {
            console.error('[Transcript Update] Course ID mismatch:', lessonCourseId, '!=', courseId);
            return NextResponse.json(
                { error: 'Course ID mismatch' },
                { status: 400 }
            );
        }

        // Update the transcript
        const { error: updateError } = await supabase
            .from('lessons')
            .update({
                ai_transcript: transcript,
                transcript_source: 'youtube',
                transcript_status: 'ready'
            })
            .eq('id', lessonId);

        if (updateError) {
            console.error('[Transcript Update] Error:', updateError);
            return NextResponse.json(
                { error: updateError.message },
                { status: 500 }
            );
        }

        console.log(`[Transcript Update] Successfully updated lesson ${lessonId} with ${transcript.length} chars`);

        return NextResponse.json({
            success: true,
            lessonId,
            courseId,
            transcriptLength: transcript.length
        });

    } catch (error: any) {
        console.error('[Transcript Update] Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
