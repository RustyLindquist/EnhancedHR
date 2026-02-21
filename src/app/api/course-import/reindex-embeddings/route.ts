/**
 * Course Embedding Reindex API Endpoint
 *
 * Rebuilds all lesson embeddings for a course from current transcripts.
 * Uses resolveTranscript() to pick the best available transcript per lesson
 * (user_transcript > ai_transcript > legacy content).
 *
 * This is essential when:
 * - Transcripts were regenerated without embedding updates
 * - Embeddings are stale or missing
 * - A bulk reindex is needed after pipeline fixes
 *
 * POST /api/course-import/reindex-embeddings
 * Body: { courseId, secretKey }
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { embedPlatformLessonContent } from '@/lib/context-embeddings';
import { getTranscriptForEmbedding } from '@/lib/lesson-transcript';

interface ReindexRequest {
    courseId: number;
    secretKey: string;
}

export async function POST(request: Request) {
    try {
        const { courseId, secretKey }: ReindexRequest = await request.json();

        // Validate secret key
        if (secretKey !== process.env.COURSE_IMPORT_SECRET) {
            console.error('[Reindex Embeddings] Invalid secret key');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!courseId) {
            return NextResponse.json(
                { error: 'Missing required field: courseId' },
                { status: 400 }
            );
        }

        const admin = createAdminClient();
        console.log(`[Reindex Embeddings] Starting for course ${courseId}`);

        // Fetch all modules with their lessons (including transcript fields)
        const { data: modules, error: modulesError } = await admin
            .from('modules')
            .select('id, title, lessons(id, title, description, type, ai_transcript, user_transcript, transcript_source, transcript_status, content)')
            .eq('course_id', courseId)
            .order('order');

        if (modulesError) {
            console.error('[Reindex Embeddings] Error fetching modules:', modulesError);
            return NextResponse.json({ success: false, error: modulesError.message }, { status: 500 });
        }

        if (!modules || modules.length === 0) {
            return NextResponse.json({
                success: true,
                results: { lessonsProcessed: 0, lessonsSkipped: 0, embeddingsCreated: 0, message: 'No modules found' }
            });
        }

        let lessonsProcessed = 0;
        let lessonsSkipped = 0;
        let embeddingsCreated = 0;
        const errors: string[] = [];

        for (const courseModule of modules) {
            const lessons = (courseModule.lessons || []) as Array<{
                id: string;
                title: string;
                description: string | null;
                type: string | null;
                ai_transcript: string | null;
                user_transcript: string | null;
                transcript_source: string | null;
                transcript_status: string | null;
                content: string | null;
            }>;

            for (const lesson of lessons) {
                // Resolve the best available transcript using the dual-transcript system
                const transcript = getTranscriptForEmbedding({
                    ai_transcript: lesson.ai_transcript,
                    user_transcript: lesson.user_transcript,
                    transcript_source: lesson.transcript_source as any,
                    transcript_status: lesson.transcript_status as any,
                    content: lesson.content
                });

                if (!transcript || transcript.trim().length === 0) {
                    lessonsSkipped++;
                    continue;
                }

                try {
                    // embedPlatformLessonContent automatically cleans up stale embeddings first
                    const embedResult = await embedPlatformLessonContent(
                        lesson.id,
                        courseId,
                        lesson.title,
                        lesson.description || undefined,
                        transcript,
                        courseModule.title
                    );

                    if (embedResult.success) {
                        embeddingsCreated += embedResult.embeddingCount;
                        lessonsProcessed++;
                        console.log(`[Reindex Embeddings] Created ${embedResult.embeddingCount} embeddings for "${lesson.title}"`);
                    } else {
                        errors.push(`${lesson.title}: ${embedResult.error}`);
                        lessonsProcessed++;
                    }
                } catch (err: any) {
                    errors.push(`${lesson.title}: ${err.message}`);
                    lessonsProcessed++;
                }
            }
        }

        console.log(`[Reindex Embeddings] Complete - Processed: ${lessonsProcessed}, Skipped: ${lessonsSkipped}, Embeddings: ${embeddingsCreated}`);

        return NextResponse.json({
            success: true,
            results: {
                lessonsProcessed,
                lessonsSkipped,
                embeddingsCreated,
                errors: errors.length > 0 ? errors : undefined
            }
        });

    } catch (error: any) {
        console.error('[Reindex Embeddings] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
