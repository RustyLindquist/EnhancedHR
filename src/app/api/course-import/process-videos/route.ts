/**
 * Video Processing API Endpoint
 *
 * Processes YouTube videos for imported courses by:
 * 1. Fetching transcripts from YouTube (Innertube -> Supadata -> AI fallback)
 * 2. Updating lesson content with transcripts
 * 3. Generating and storing embeddings for AI context
 *
 * Transcript extraction fallback chain:
 * 1. Innertube API (youtube-transcript library) - Free, fast
 * 2. Supadata API - Paid, better success rate for restricted videos
 * 3. AI multimodal parsing (Gemini) - Last resort, processes video directly
 *
 * POST /api/course-import/process-videos
 * Body: { courseId, secretKey }
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchYouTubeTranscriptWithFallback, isYouTubeUrl } from '@/lib/youtube';
import { embedPlatformLessonContent } from '@/lib/context-embeddings';
import { generateTranscriptFromVideo } from '@/app/actions/course-builder';

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
                        console.log(`[Video Processing] YouTube methods failed for: ${lesson.title} - ${transcriptResult.error}`);
                        console.log(`[Video Processing] Trying AI multimodal fallback...`);

                        // Fall back to AI multimodal parsing
                        const aiResult = await generateTranscriptFromVideo(lesson.video_url);
                        if (aiResult.success && aiResult.transcript) {
                            transcript = aiResult.transcript;
                            transcriptSource = 'ai';
                            console.log(`[Video Processing] Got transcript from AI for: ${lesson.title}`);
                        } else {
                            console.warn(`[Video Processing] All transcript methods failed for: ${lesson.title} - ${aiResult.error}`);
                        }
                    }
                } else {
                    console.log(`[Video Processing] Non-YouTube video, using AI: ${lesson.title}`);

                    // For non-YouTube videos, use AI multimodal parsing directly
                    const aiResult = await generateTranscriptFromVideo(lesson.video_url);
                    if (aiResult.success && aiResult.transcript) {
                        transcript = aiResult.transcript;
                        transcriptSource = 'ai';
                    }
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
