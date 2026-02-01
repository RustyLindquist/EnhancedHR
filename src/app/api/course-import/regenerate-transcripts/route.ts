/**
 * Course Transcript Regeneration API Endpoint
 *
 * Triggers transcript regeneration for a specific course.
 * Uses the same logic as the admin UI button but callable via API.
 *
 * POST /api/course-import/regenerate-transcripts
 * Body: { courseId, secretKey }
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateTranscriptFromVideoAdmin } from '@/app/actions/course-builder';

interface RegenerateRequest {
    courseId: number;
    secretKey: string;
}

export async function POST(request: Request) {
    try {
        const { courseId, secretKey }: RegenerateRequest = await request.json();

        // Validate secret key
        if (secretKey !== process.env.COURSE_IMPORT_SECRET) {
            console.error('[Regenerate Transcripts API] Invalid secret key');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!courseId) {
            return NextResponse.json(
                { error: 'Missing required field: courseId' },
                { status: 400 }
            );
        }

        console.log(`[Regenerate Transcripts API] Starting for course ${courseId}`);

        const admin = createAdminClient();

        // Fetch all modules with their lessons
        const { data: modules, error: modulesError } = await admin
            .from('modules')
            .select('id, title, lessons(id, title, video_url, type, user_transcript, ai_transcript, transcript_source)')
            .eq('course_id', courseId)
            .order('order');

        if (modulesError) {
            console.error('[Regenerate Transcripts API] Error fetching modules:', modulesError);
            return NextResponse.json({ success: false, error: modulesError.message });
        }

        if (!modules || modules.length === 0) {
            return NextResponse.json({ success: true, results: { lessonsGenerated: 0, lessonsSkipped: 0, lessonsFailed: 0, message: 'No modules found' } });
        }

        let lessonsGenerated = 0;
        let lessonsSkipped = 0;
        let lessonsFailed = 0;
        const failedLessons: { title: string; error: string }[] = [];

        // Process each module
        for (const courseModule of modules) {
            const lessons = courseModule.lessons as Array<{
                id: string;
                title: string;
                video_url: string | null;
                type: string | null;
                user_transcript: string | null;
                ai_transcript: string | null;
                transcript_source: string | null;
            }> || [];

            // Process each lesson
            for (const lesson of lessons) {
                // Skip non-video lessons or lessons without video_url
                if (lesson.type !== 'video' || !lesson.video_url) {
                    lessonsSkipped++;
                    continue;
                }

                // Skip lessons with user-entered transcripts
                if (lesson.user_transcript && lesson.user_transcript.trim().length > 0) {
                    lessonsSkipped++;
                    continue;
                }

                // Skip lessons that already have AI transcripts
                if (lesson.ai_transcript && lesson.ai_transcript.trim().length > 0) {
                    lessonsSkipped++;
                    continue;
                }

                try {
                    console.log(`[Regenerate Transcripts API] Generating for "${lesson.title}"`);

                    const result = await generateTranscriptFromVideoAdmin(lesson.video_url);

                    if (result.success && result.transcript) {
                        const { error: updateError } = await admin
                            .from('lessons')
                            .update({
                                ai_transcript: result.transcript,
                                transcript_source: result.source || 'ai',
                                transcript_status: 'ready'
                            })
                            .eq('id', lesson.id);

                        if (updateError) {
                            failedLessons.push({ title: lesson.title, error: updateError.message });
                            lessonsFailed++;
                        } else {
                            lessonsGenerated++;
                        }
                    } else {
                        failedLessons.push({ title: lesson.title, error: result.error || 'Unknown error' });
                        lessonsFailed++;
                    }

                    // Rate limiting: 15 second delay between requests
                    // Supadata free plan allows 1 req/sec, but we use 15s to be safe
                    await new Promise(resolve => setTimeout(resolve, 15000));

                } catch (err: any) {
                    failedLessons.push({ title: lesson.title, error: err.message });
                    lessonsFailed++;
                    await new Promise(resolve => setTimeout(resolve, 15000));
                }
            }
        }

        console.log(`[Regenerate Transcripts API] Complete - Generated: ${lessonsGenerated}, Skipped: ${lessonsSkipped}, Failed: ${lessonsFailed}`);

        return NextResponse.json({
            success: true,
            results: {
                lessonsGenerated,
                lessonsSkipped,
                lessonsFailed,
                failedLessons: failedLessons.length > 0 ? failedLessons : undefined
            }
        });

    } catch (error: any) {
        console.error('[Regenerate Transcripts API] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
