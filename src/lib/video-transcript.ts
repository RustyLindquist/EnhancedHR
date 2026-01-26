'use server';

/**
 * Video Transcript Service
 *
 * Generates transcripts for video content items and creates embeddings
 * for RAG retrieval. This enables videos to contribute to AI context.
 *
 * For YouTube videos: First tries to fetch existing captions via YouTube API
 * For other videos: Uses AI multimodal parsing via OpenRouter + Gemini
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { generateTranscriptFromVideo } from '@/app/actions/course-builder';
import { embedVideoContext, deleteContextEmbeddings } from '@/lib/context-embeddings';
import { isYouTubeUrl, fetchYouTubeTranscript, fetchYouTubeMetadata } from '@/lib/youtube';
import { generateTranscriptFromYouTubeAudio } from '@/lib/audio-transcription';

// Types
type TranscriptStatus = 'pending' | 'generating' | 'ready' | 'failed';

interface ProcessVideoResult {
    success: boolean;
    transcript?: string;
    embeddingCount?: number;
    error?: string;
}

// Video content structure for transcript processing
interface VideoContentData {
    muxPlaybackId?: string;
    externalUrl?: string;
    muxAssetId?: string;
    description?: string;
    status?: string;
    transcript?: string;
    transcriptStatus?: TranscriptStatus;
    transcriptError?: string;
    transcriptGeneratedAt?: string;
}

/**
 * Get the video URL for transcript generation
 * Handles both Mux playback IDs and external URLs
 */
function getVideoUrlForTranscript(content: VideoContentData): string | null {
    // For Mux videos, return the playback ID (generateTranscriptFromVideo handles conversion)
    if (content.muxPlaybackId) {
        return content.muxPlaybackId;
    }
    // For external URLs, return directly
    if (content.externalUrl) {
        return content.externalUrl;
    }
    return null;
}

/**
 * Build the combined context string for embedding
 * Format: Title + Description + Transcript
 */
function buildVideoContextForEmbedding(
    title: string,
    description?: string,
    transcript?: string
): string {
    const parts: string[] = [];

    parts.push(`Video Title: ${title}`);

    if (description) {
        parts.push(`\nDescription: ${description}`);
    }

    if (transcript) {
        parts.push(`\nTranscript:\n${transcript}`);
    }

    return parts.join('\n');
}

/**
 * Update video transcript status in database
 */
async function updateTranscriptStatus(
    videoId: string,
    status: TranscriptStatus,
    data?: { transcript?: string; error?: string }
): Promise<void> {
    const admin = createAdminClient();

    // Build content update using raw SQL to preserve existing content
    const { data: current } = await admin
        .from('user_context_items')
        .select('content')
        .eq('id', videoId)
        .single();

    if (current) {
        const newContent = {
            ...current.content,
            transcriptStatus: status,
            ...(data?.transcript && { transcript: data.transcript, transcriptGeneratedAt: new Date().toISOString() }),
            ...(data?.error && { transcriptError: data.error }),
            ...(status === 'ready' && { transcriptError: null })
        };

        await admin
            .from('user_context_items')
            .update({ content: newContent, updated_at: new Date().toISOString() })
            .eq('id', videoId);
    }
}

/**
 * Main function to process a video for RAG
 * Generates transcript and creates embeddings
 */
export async function processVideoForRAG(
    videoId: string,
    userId: string,
    options?: {
        collectionId?: string | null;
        orgId?: string | null;
    }
): Promise<ProcessVideoResult> {
    const admin = createAdminClient();

    try {
        // Get video record
        const { data: video, error: fetchError } = await admin
            .from('user_context_items')
            .select('*')
            .eq('id', videoId)
            .single();

        if (fetchError || !video) {
            console.error('[processVideoForRAG] Video not found:', fetchError);
            return { success: false, error: 'Video not found' };
        }

        // Get video URL
        const videoUrl = getVideoUrlForTranscript(video.content);
        if (!videoUrl) {
            console.log('[processVideoForRAG] No video URL available for:', videoId);
            return { success: false, error: 'No video URL available' };
        }

        // Update status to generating
        await updateTranscriptStatus(videoId, 'generating');

        console.log('[processVideoForRAG] Generating transcript for video:', videoId);

        let transcript: string | null = null;
        let transcriptSource: 'youtube' | 'ai' = 'ai';

        // For YouTube videos, try to fetch existing captions first
        if (await isYouTubeUrl(videoUrl)) {
            console.log('[processVideoForRAG] YouTube video detected, trying to fetch existing captions...');

            const youtubeResult = await fetchYouTubeTranscript(videoUrl);

            if (youtubeResult.success && youtubeResult.transcript) {
                console.log('[processVideoForRAG] Successfully fetched YouTube captions');
                transcript = youtubeResult.transcript;
                transcriptSource = 'youtube';

                // Also try to fetch metadata to potentially update description
                const metadataResult = await fetchYouTubeMetadata(videoUrl);
                if (metadataResult.success && metadataResult.metadata) {
                    console.log('[processVideoForRAG] Fetched YouTube metadata:', metadataResult.metadata.title);
                    // Could update video description here if needed
                }
            } else {
                console.log('[processVideoForRAG] YouTube captions not available:', youtubeResult.error);
                console.log('[processVideoForRAG] Trying audio extraction fallback...');

                // Try audio extraction fallback for YouTube videos without captions
                const audioTranscriptResult = await generateTranscriptFromYouTubeAudio(videoUrl);

                if (audioTranscriptResult.success && audioTranscriptResult.transcript) {
                    console.log('[processVideoForRAG] Successfully generated transcript via audio extraction');
                    transcript = audioTranscriptResult.transcript;
                    transcriptSource = 'ai';
                } else {
                    console.log('[processVideoForRAG] Audio extraction failed:', audioTranscriptResult.error);
                    console.log('[processVideoForRAG] Falling back to standard AI transcript generation...');
                }
            }
        }

        // If no transcript yet (not YouTube or all YouTube methods failed), use AI parsing
        if (!transcript) {
            const transcriptResult = await generateTranscriptFromVideo(videoUrl);

            if (!transcriptResult.success || !transcriptResult.transcript) {
                console.error('[processVideoForRAG] AI transcript generation failed:', transcriptResult.error);
                await updateTranscriptStatus(videoId, 'failed', {
                    error: transcriptResult.error || 'Failed to generate transcript'
                });
                return {
                    success: false,
                    error: transcriptResult.error || 'Failed to generate transcript'
                };
            }

            transcript = transcriptResult.transcript;
            transcriptSource = 'ai';
        }

        console.log(`[processVideoForRAG] Transcript ready (source: ${transcriptSource}), length: ${transcript.length}`);

        if (!transcript) {
            await updateTranscriptStatus(videoId, 'failed', {
                error: 'No transcript generated'
            });
            return { success: false, error: 'No transcript generated' };
        }

        // Update with transcript
        await updateTranscriptStatus(videoId, 'ready', {
            transcript: transcript
        });

        console.log('[processVideoForRAG] Transcript saved, creating embeddings');

        // Create embeddings
        const embeddingResult = await embedVideoContext(
            userId,
            videoId,
            video.title,
            video.content.description,
            transcript,
            options?.collectionId || video.collection_id,
            options?.orgId || video.org_id
        );

        if (!embeddingResult.success) {
            console.error('[processVideoForRAG] Embedding creation failed:', embeddingResult.error);
        } else {
            console.log('[processVideoForRAG] Created', embeddingResult.embeddingCount, 'embeddings for video:', videoId);
        }

        return {
            success: true,
            transcript: transcript,
            embeddingCount: embeddingResult.embeddingCount
        };

    } catch (error) {
        console.error('[processVideoForRAG] Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await updateTranscriptStatus(videoId, 'failed', {
            error: errorMessage
        });
        return { success: false, error: errorMessage };
    }
}

/**
 * Regenerate transcript for a video (retry after failure)
 */
export async function regenerateVideoTranscript(
    videoId: string,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    const admin = createAdminClient();

    // Get video to get collection/org context
    const { data: video } = await admin
        .from('user_context_items')
        .select('collection_id, org_id')
        .eq('id', videoId)
        .single();

    // Delete old embeddings first
    await deleteContextEmbeddings(videoId);

    // Re-process
    const result = await processVideoForRAG(videoId, userId, {
        collectionId: video?.collection_id,
        orgId: video?.org_id
    });

    return { success: result.success, error: result.error };
}
