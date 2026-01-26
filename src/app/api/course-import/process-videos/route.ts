/**
 * Video Processing API Endpoint
 *
 * Processes YouTube videos for imported courses by:
 * 1. Fetching transcripts from YouTube
 * 2. Updating lesson content with transcripts
 * 3. Generating and storing embeddings for AI context
 *
 * POST /api/course-import/process-videos
 * Body: { courseId, secretKey }
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchYouTubeTranscript, isYouTubeUrl } from '@/lib/youtube';
import { embedVideoContext } from '@/lib/context-embeddings';

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

                if (isYouTube) {
                    console.log(`[Video Processing] Processing YouTube video: ${lesson.title}`);

                    // Fetch transcript
                    const transcriptResult = await fetchYouTubeTranscript(lesson.video_url);

                    if (transcriptResult.success && transcriptResult.transcript) {
                        // Update lesson with transcript in content field
                        const { error: updateError } = await supabase
                            .from('lessons')
                            .update({ content: transcriptResult.transcript })
                            .eq('id', lesson.id);

                        if (updateError) {
                            console.warn(`[Video Processing] Failed to update lesson ${lesson.id}:`, updateError);
                        } else {
                            console.log(`[Video Processing] Updated transcript for: ${lesson.title}`);
                        }

                        // Generate embeddings for the transcript
                        // Using course-level embeddings (no user_id)
                        const embedResult = await embedVideoContext(
                            '', // No user_id for course content
                            lesson.id,
                            lesson.title,
                            lesson.description || undefined,
                            transcriptResult.transcript,
                            null, // No collection_id
                            null  // No org_id for platform courses
                        );

                        if (embedResult.success) {
                            embeddingCount += embedResult.embeddingCount;
                            console.log(`[Video Processing] Created ${embedResult.embeddingCount} embeddings for: ${lesson.title}`);
                        }
                    } else {
                        console.warn(`[Video Processing] No transcript available for: ${lesson.title} - ${transcriptResult.error}`);
                    }
                } else {
                    console.log(`[Video Processing] Skipping non-YouTube video: ${lesson.title}`);
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

            } catch (lessonError: any) {
                const errorMsg = `Lesson "${lesson.title}": ${lessonError.message}`;
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
