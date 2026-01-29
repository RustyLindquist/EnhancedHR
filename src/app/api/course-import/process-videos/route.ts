/**
 * Video Processing API Endpoint
 *
 * Processes YouTube videos for imported courses by:
 * 1. Fetching transcripts from YouTube using multiple fallback methods
 * 2. Updating lesson content with transcripts
 * 3. Generating and storing embeddings for AI context (Course Assistant RAG)
 *
 * Transcript extraction fallback chain:
 * 1. Innertube API (youtube-transcript library) - Free, fast, requires captions enabled
 * 2. Supadata transcript API - For videos with restricted caption access
 * 3. Supadata audio transcription - Extracts audio and transcribes (for videos without captions)
 *
 * Note: This endpoint runs without user authentication context (server-to-server).
 * It uses generateTranscriptFromYouTubeAudio instead of generateTranscriptFromVideo
 * because the latter requires user authentication which isn't available here.
 *
 * POST /api/course-import/process-videos
 * Body: { courseId, secretKey }
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchYouTubeTranscriptWithFallback, isYouTubeUrl } from '@/lib/youtube';
import { embedPlatformLessonContent } from '@/lib/context-embeddings';
import { generateTranscriptFromYouTubeAudio } from '@/lib/audio-transcription';

interface ProcessVideosRequest {
    courseId: number;
    secretKey: string;
}

export async function POST(request: Request) {
    try {
        const { courseId, secretKey }: ProcessVideosRequest = await request.json();

        // Validate secret key
        if (secretKey !== process.env.COURSE_IMPORT_SECRET) {
            console.error('[Video Processing] Invalid secret key');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!courseId) {
            return NextResponse.json(
                { error: 'Missing required field: courseId' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        console.log(`[Video Processing] Starting for course ${courseId}`);

        // Update status to processing
        await supabase
            .from('course_import_status')
            .update({ status: 'processing', updated_at: new Date().toISOString() })
            .eq('course_id', courseId);

        // Get all modules for this course
        const { data: modules, error: modulesError } = await supabase
            .from('modules')
            .select('id')
            .eq('course_id', courseId);

        if (modulesError) {
            console.error('[Video Processing] Error fetching modules:', modulesError);
            throw new Error(`Failed to fetch modules: ${modulesError.message}`);
        }

        if (!modules?.length) {
            console.log('[Video Processing] No modules found for course');
            await supabase
                .from('course_import_status')
                .update({ status: 'complete', updated_at: new Date().toISOString() })
                .eq('course_id', courseId);
            return NextResponse.json({ success: true, message: 'No videos to process' });
        }

        const moduleIds = modules.map(m => m.id);

        // Get all video lessons with URLs
        const { data: lessons, error: lessonsError } = await supabase
            .from('lessons')
            .select('*')
            .in('module_id', moduleIds)
            .eq('type', 'video')
            .not('video_url', 'is', null);

        if (lessonsError) {
            console.error('[Video Processing] Error fetching lessons:', lessonsError);
            throw new Error(`Failed to fetch lessons: ${lessonsError.message}`);
        }

        let processedCount = 0;
        let embeddingCount = 0;
        const totalVideos = lessons?.length || 0;
        const errors: string[] = [];

        console.log(`[Video Processing] Found ${totalVideos} video lessons to process`);

        for (const lesson of lessons || []) {
            try {
                // Check if it's a YouTube URL
                const isYouTube = await isYouTubeUrl(lesson.video_url);
                let transcript: string | null = null;
                let transcriptSource: string = 'none';

                if (isYouTube) {
                    console.log(`[Video Processing] Processing YouTube video: ${lesson.title}`);

                    // Try YouTube transcript extraction (Innertube -> Supadata fallback)
                    const transcriptResult = await fetchYouTubeTranscriptWithFallback(lesson.video_url);

                    if (transcriptResult.success && transcriptResult.transcript) {
                        transcript = transcriptResult.transcript;
                        transcriptSource = transcriptResult.source || 'youtube';
                        console.log(`[Video Processing] Got transcript from ${transcriptSource} for: ${lesson.title}`);
                    } else {
                        console.log(`[Video Processing] YouTube Innertube/Supadata failed for: ${lesson.title} - ${transcriptResult.error}`);
                        console.log(`[Video Processing] Trying Supadata audio transcription fallback...`);

                        // Fall back to Supadata audio transcription (doesn't require auth)
                        const audioResult = await generateTranscriptFromYouTubeAudio(lesson.video_url);
                        if (audioResult.success && audioResult.transcript) {
                            transcript = audioResult.transcript;
                            transcriptSource = 'supadata-audio';
                            console.log(`[Video Processing] Got transcript from Supadata audio for: ${lesson.title}`);
                        } else {
                            console.warn(`[Video Processing] All transcript methods failed for: ${lesson.title} - ${audioResult.error}`);
                        }
                    }
                } else {
                    console.log(`[Video Processing] Non-YouTube video, skipping: ${lesson.title}`);
                    // Non-YouTube videos are not supported in course import
                    // They would need to be uploaded to Mux for transcript generation
                }

                // If we got a transcript, save it and create embeddings
                if (transcript) {
                    // Update lesson with transcript in content field
                    const { error: updateError } = await supabase
                        .from('lessons')
                        .update({ content: transcript })
                        .eq('id', lesson.id);

                    if (updateError) {
                        console.warn(`[Video Processing] Failed to update lesson ${lesson.id}:`, updateError);
                    } else {
                        console.log(`[Video Processing] Updated transcript (${transcriptSource}) for: ${lesson.title}`);
                    }

                    // Generate embeddings for the transcript
                    // Using course-level embeddings (no user_id)
                    const embedResult = await embedPlatformLessonContent(
                        lesson.id.toString(),
                        courseId,
                        lesson.title,
                        lesson.description || undefined,
                        transcript
                    );

                    if (embedResult.success) {
                        embeddingCount += embedResult.embeddingCount;
                        console.log(`[Video Processing] Created ${embedResult.embeddingCount} embeddings for: ${lesson.title}`);
                    } else {
                        console.warn(`[Video Processing] Embedding creation failed for: ${lesson.title} - ${embedResult.error}`);
                    }
                } else {
                    const errorMsg = `No transcript generated for: ${lesson.title}`;
                    console.warn(`[Video Processing] ${errorMsg}`);
                    errors.push(errorMsg);
                }

                processedCount++;

                // Update progress
                await supabase
                    .from('course_import_status')
                    .update({
                        processed_videos: processedCount,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('course_id', courseId);

            } catch (lessonError: unknown) {
                const errorMessage = lessonError instanceof Error ? lessonError.message : 'Unknown error';
                const errorMsg = `Lesson "${lesson.title}": ${errorMessage}`;
                console.error(`[Video Processing] Error:`, errorMsg);
                errors.push(errorMsg);
                // Continue with other lessons
            }
        }

        // Mark as complete
        const finalStatus = errors.length > 0 ? 'complete' : 'complete';
        await supabase
            .from('course_import_status')
            .update({
                status: finalStatus,
                processed_videos: processedCount,
                error_message: errors.length > 0 ? errors.join('; ') : null,
                updated_at: new Date().toISOString(),
            })
            .eq('course_id', courseId);

        console.log(`[Video Processing] Complete. Processed: ${processedCount}/${totalVideos}, Embeddings: ${embeddingCount}`);

        return NextResponse.json({
            success: true,
            processed: processedCount,
            total: totalVideos,
            embeddings: embeddingCount,
            errors: errors.length > 0 ? errors : undefined,
        });

    } catch (error: any) {
        console.error('[Video Processing] Error:', error);

        // Try to update status to error
        try {
            const { courseId } = await request.clone().json();
            if (courseId) {
                const supabase = createAdminClient();
                await supabase
                    .from('course_import_status')
                    .update({
                        status: 'error',
                        error_message: error.message,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('course_id', courseId);
            }
        } catch {
            // Ignore error when updating status
        }

        return NextResponse.json(
            {
                success: false,
                error: error.message,
            },
            { status: 500 }
        );
    }
}
