/**
 * Get Lessons Needing Transcripts API Endpoint
 *
 * Returns all lessons with YouTube videos that don't have transcripts.
 * Used by fetch-transcripts-ytdlp.ts for bulk transcript fetching.
 *
 * POST /api/course-import/get-lessons-needing-transcripts
 * Body: { startCourseId, endCourseId, secretKey }
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface GetLessonsRequest {
    startCourseId: number;
    endCourseId: number;
    secretKey: string;
}

export async function POST(request: Request) {
    try {
        const { startCourseId, endCourseId, secretKey }: GetLessonsRequest = await request.json();

        // Validate secret key
        if (secretKey !== process.env.COURSE_IMPORT_SECRET) {
            console.error('[Get Lessons] Invalid secret key');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!startCourseId || !endCourseId) {
            return NextResponse.json(
                { error: 'Missing required fields: startCourseId and endCourseId' },
                { status: 400 }
            );
        }

        console.log(`[Get Lessons] Fetching lessons for courses ${startCourseId}-${endCourseId}`);

        const supabase = createAdminClient();

        // Fetch all lessons with YouTube URLs that don't have transcripts
        const { data: lessons, error } = await supabase
            .from('lessons')
            .select(`
                id,
                title,
                video_url,
                ai_transcript,
                user_transcript,
                modules!inner(course_id, title)
            `)
            .gte('modules.course_id', startCourseId)
            .lte('modules.course_id', endCourseId)
            .like('video_url', '%youtube%')
            .order('id');

        if (error) {
            console.error('[Get Lessons] Error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        // Filter to lessons without transcripts
        const needsTranscript = (lessons || []).filter(l =>
            !l.ai_transcript && !l.user_transcript
        ).map(l => ({
            id: l.id,
            title: l.title,
            video_url: l.video_url,
            course_id: (l.modules as any).course_id,
            module_title: (l.modules as any).title
        }));

        console.log(`[Get Lessons] Found ${needsTranscript.length} lessons needing transcripts`);

        return NextResponse.json({
            success: true,
            count: needsTranscript.length,
            lessons: needsTranscript
        });

    } catch (error: any) {
        console.error('[Get Lessons] Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
