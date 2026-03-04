import { NextResponse } from 'next/server';
import Mux from '@mux/mux-node';
import { createAdminClient } from '@/lib/supabase/admin';
import { requestMuxAutoCaption, fetchMuxVTT } from '@/app/actions/mux';
import { parseVTTToTranscript } from '@/lib/vtt-parser';
import { recalculateCourseDuration } from '@/app/actions/course-builder';

export const maxDuration = 60;

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});

// ============================================
// Handler: video.asset.ready — encoding complete
// ============================================

/**
 * Handle video.asset.ready — encoding is complete.
 * Updates the lesson with the playback ID and triggers deferred transcript if needed.
 */
async function handleAssetReady(data: any): Promise<'processed' | 'not_found'> {
    const assetId = data.id;
    const playbackId = data.playback_ids?.[0]?.id;
    const duration = data.duration;

    if (!assetId || !playbackId) {
        console.error('video.asset.ready: Missing assetId or playbackId', { assetId, playbackId });
        return 'processed'; // Nothing to retry
    }

    const supabase = createAdminClient();

    // Find the lesson that's waiting for this asset
    const { data: lesson, error: findError } = await supabase
        .from('lessons')
        .select('id, module_id, deferred_transcript, video_status')
        .eq('mux_asset_id', assetId)
        .eq('video_status', 'processing')
        .single();

    if (findError || !lesson) {
        // Lesson not saved yet — return not_found so Mux retries with exponential backoff.
        // This is more robust than the previous 10-second sleep: Mux retries for up to 24 hours.
        console.log('video.asset.ready: No processing lesson found for asset', assetId, '— returning for provider retry');
        return 'not_found';
    }

    await handleAssetReadyForLesson(supabase, lesson, playbackId, duration, assetId);
    return 'processed';
}

/**
 * Shared logic: update a lesson once its Mux asset is ready.
 */
async function handleAssetReadyForLesson(
    supabase: ReturnType<typeof createAdminClient>,
    lesson: { id: string; module_id: string | null; deferred_transcript: string | null; video_status: string },
    playbackId: string,
    duration: number | undefined,
    assetId: string,
) {
    // Format duration as MM:SS or HH:MM:SS
    const formattedDuration = duration ? formatDuration(duration) : null;

    // Build the update payload
    const updateData: Record<string, any> = {
        video_url: playbackId,
        video_status: 'ready',
        ...(formattedDuration && { duration: formattedDuration }),
    };

    // If deferred transcript was requested, trigger caption generation
    if (lesson.deferred_transcript === 'ai') {
        try {
            await requestMuxAutoCaption(assetId);
            updateData.transcript_status = 'generating';
            updateData.deferred_transcript = null;
        } catch (err) {
            console.error('video.asset.ready: Failed to request auto-caption for asset', assetId, err);
            // Still update the video — transcript can be generated manually later
            updateData.deferred_transcript = null;
        }
    }

    const { error: updateError } = await supabase
        .from('lessons')
        .update(updateData)
        .eq('id', lesson.id);

    if (updateError) {
        console.error('video.asset.ready: Failed to update lesson', lesson.id, updateError);
        return;
    }

    // Recalculate course duration
    if (lesson.module_id) {
        try {
            const { data: module } = await supabase
                .from('modules')
                .select('course_id')
                .eq('id', lesson.module_id)
                .single();

            if (module?.course_id) {
                await recalculateCourseDuration(module.course_id);
            }
        } catch (err) {
            console.error('video.asset.ready: Failed to recalculate course duration', err);
        }
    }

    console.log('video.asset.ready: Updated lesson', lesson.id, 'with playbackId', playbackId);
}

// ============================================
// Handler: video.asset.errored — encoding failed
// ============================================

/**
 * Handle video.asset.errored — encoding failed.
 */
async function handleAssetErrored(data: any) {
    const assetId = data.id;

    if (!assetId) {
        console.error('video.asset.errored: Missing assetId');
        return;
    }

    const supabase = createAdminClient();

    const { error } = await supabase
        .from('lessons')
        .update({ video_status: 'errored' })
        .eq('mux_asset_id', assetId)
        .eq('video_status', 'processing');

    if (error) {
        console.error('video.asset.errored: Failed to update lesson for asset', assetId, error);
    } else {
        console.log('video.asset.errored: Marked lesson as errored for asset', assetId);
    }
}

// ============================================
// Handler: video.track.ready — captions generated
// ============================================

/**
 * Handle video.track.ready — auto-generated captions are complete.
 * Fetches the VTT, parses it, and saves as the AI transcript.
 */
async function handleTrackReady(body: any) {
    const track = body.data;
    const assetId = body.object?.id || track?.asset_id;

    // Only process text/subtitle tracks, not audio/video tracks
    const isSubtitleTrack = track?.type === 'text' && track?.text_type === 'subtitles';
    if (!isSubtitleTrack) {
        return;
    }

    if (!assetId) {
        console.error('video.track.ready: Missing assetId');
        return;
    }

    const supabase = createAdminClient();

    // Find the lesson waiting for transcript
    const { data: lesson, error: findError } = await supabase
        .from('lessons')
        .select('id, video_url, transcript_status')
        .eq('mux_asset_id', assetId)
        .eq('transcript_status', 'generating')
        .single();

    if (findError || !lesson) {
        console.log('video.track.ready: No lesson awaiting transcript for asset', assetId);
        return;
    }

    if (!lesson.video_url) {
        console.error('video.track.ready: Lesson has no video_url (playback ID)', lesson.id);
        return;
    }

    try {
        // Build the VTT URL and fetch content
        const trackId = track.id;
        const vttUrl = `https://stream.mux.com/${lesson.video_url}/text/${trackId}.vtt`;
        const vttResult = await fetchMuxVTT(vttUrl);

        if (!vttResult.success || !vttResult.content) {
            throw new Error(vttResult.error || 'Empty VTT content');
        }

        // Parse VTT to plain text
        const transcriptText = parseVTTToTranscript(vttResult.content);

        // Save the transcript
        const { error: updateError } = await supabase
            .from('lessons')
            .update({
                ai_transcript: transcriptText,
                transcript_status: 'ready',
                transcript_source: 'mux-caption',
                transcript_generated_at: new Date().toISOString(),
            })
            .eq('id', lesson.id);

        if (updateError) {
            throw updateError;
        }

        console.log('video.track.ready: Saved transcript for lesson', lesson.id);
    } catch (err) {
        console.error('video.track.ready: Failed to process transcript for lesson', lesson.id, err);

        // Mark transcript as failed so user knows to retry
        await supabase
            .from('lessons')
            .update({ transcript_status: 'failed' })
            .eq('id', lesson.id);
    }
}

// ============================================
// Utility
// ============================================

/**
 * Format seconds to duration string (MM:SS or HH:MM:SS)
 */
function formatDuration(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============================================
// POST Handler
// ============================================

export async function POST(request: Request) {
    try {
        const rawBody = await request.text();

        // Verify webhook signature if secret is configured
        const webhookSecret = process.env.MUX_WEBHOOK_SECRET;
        if (webhookSecret) {
            const signature = request.headers.get('mux-signature');
            if (!signature) {
                console.error('Mux webhook: Missing signature header');
                return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
            }
            try {
                mux.webhooks.verifySignature(rawBody, { 'mux-signature': signature }, webhookSecret);
            } catch (err) {
                console.error('Mux webhook signature verification failed:', err);
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
        }

        const body = JSON.parse(rawBody);
        const eventType = body.type;

        console.log('Received Mux Webhook:', eventType);

        // Handle video asset ready (encoding complete)
        if (eventType === 'video.asset.ready') {
            const result = await handleAssetReady(body.data);
            if (result === 'not_found') {
                // Return 503 so Mux retries with exponential backoff (up to 24 hours)
                return NextResponse.json(
                    { error: 'Lesson not yet saved — will be retried' },
                    { status: 503 }
                );
            }
        }

        // Handle video asset error
        else if (eventType === 'video.asset.errored') {
            await handleAssetErrored(body.data);
        }

        // Handle video track ready (captions generated)
        else if (eventType === 'video.track.ready') {
            await handleTrackReady(body);
        }

        // Handle viewing session (existing trial tracking)
        else if (eventType === 'video.viewing.session') {
            const supabase = createAdminClient();
            const data = body.data;

            // 1. Extract Data
            const userId = data.viewer_user_id;
            const videoId = data.video_id; // This is our Lesson ID
            const viewingTimeSeconds = data.viewing_time || 0;
            const viewingTimeMinutes = Math.ceil(viewingTimeSeconds / 60);

            if (!userId) {
                console.warn('No viewer_user_id found in webhook data');
                return NextResponse.json({ message: 'No user ID' }, { status: 200 });
            }

            console.log(`Processing viewing session for User ${userId}: ${viewingTimeMinutes} minutes`);

            // 2. Update Trial Usage (Global)
            // Fetch current usage
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('trial_minutes_used')
                .eq('id', userId)
                .single();

            if (profileError) {
                console.error('Error fetching profile:', profileError);
            } else {
                const newUsage = (profile.trial_minutes_used || 0) + viewingTimeMinutes;

                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ trial_minutes_used: newUsage })
                    .eq('id', userId);

                if (updateError) console.error('Error updating trial usage:', updateError);
            }

            // 3. Update Course Progress (Instructional Time)
            // We need to find the course_id for this lesson
            if (videoId) {
                const { data: lesson, error: lessonError } = await supabase
                    .from('lessons')
                    .select('module_id, modules(course_id)')
                    .eq('id', videoId)
                    .single();

                if (lesson && lesson.modules) {
                    // @ts-ignore
                    const courseId = lesson.modules.course_id;

                    // Update or Insert User Course Progress
                    // We increment view_time_seconds
                    const { data: progress, error: progressFetchError } = await supabase
                        .from('user_progress')
                        .select('view_time_seconds')
                        .eq('user_id', userId)
                        .eq('lesson_id', videoId)
                        .single();

                    if (progressFetchError && progressFetchError.code !== 'PGRST116') { // PGRST116 is "Row not found"
                        console.error('Error fetching progress:', progressFetchError);
                    }

                    const currentSeconds = progress?.view_time_seconds || 0;
                    const newSeconds = currentSeconds + viewingTimeSeconds;

                    const { error: progressUpdateError } = await supabase
                        .from('user_progress')
                        .upsert({
                            user_id: userId,
                            lesson_id: videoId,
                            course_id: courseId,
                            view_time_seconds: newSeconds,
                            last_accessed: new Date().toISOString()
                        }, { onConflict: 'user_id, lesson_id' });

                    if (progressUpdateError) {
                        console.error('Error updating course progress:', progressUpdateError);
                    } else {
                        console.log(`Updated instructional time for User ${userId}, Lesson ${videoId}: +${viewingTimeSeconds}s`);
                    }
                }
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Mux webhook error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
