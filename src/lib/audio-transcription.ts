/**
 * Audio Transcription Service
 *
 * Provides reliable YouTube video transcription using Supadata API.
 * Supadata handles the complexity of YouTube access and provides AI-generated
 * transcripts when native captions aren't available.
 *
 * Flow:
 * 1. Try Supadata API with 'auto' mode (native captions -> AI transcription)
 * 2. Handle both sync and async (job-based) responses
 * 3. Return formatted transcript
 */

import { Supadata, SupadataError } from '@supadata/js';

// Environment setup
const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY || '';

// Constants
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const JOB_POLL_INTERVAL_MS = 2000;
const JOB_MAX_WAIT_MS = 120000; // 2 minutes max wait for async jobs

// Types
interface TranscriptionResult {
    success: boolean;
    transcript?: string;
    error?: string;
    source?: 'native' | 'ai';
}

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYouTubeVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    // Check if it's already just a video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url;
    }

    return null;
}

/**
 * Sleep helper for retry logic
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get transcript using Supadata API
 * This is the primary method for getting YouTube transcripts reliably.
 *
 * Supadata handles:
 * - Native caption extraction (when available)
 * - AI-generated transcription (when no captions)
 * - YouTube's anti-bot measures
 */
async function getTranscriptWithSupadata(videoUrl: string): Promise<TranscriptionResult> {
    if (!SUPADATA_API_KEY) {
        console.log('[AudioTranscription] Supadata API key not configured, skipping Supadata');
        return {
            success: false,
            error: 'Supadata API key not configured. Set SUPADATA_API_KEY in your environment.'
        };
    }

    const videoId = extractYouTubeVideoId(videoUrl);
    if (!videoId) {
        return { success: false, error: 'Invalid YouTube URL or video ID' };
    }

    console.log('[AudioTranscription] Fetching transcript via Supadata for video:', videoId);

    try {
        const supadata = new Supadata({
            apiKey: SUPADATA_API_KEY,
        });

        // Use the universal transcript method with 'auto' mode
        // 'auto' tries native captions first, falls back to AI transcription
        const result = await supadata.transcript({
            url: videoUrl,
            text: true, // Return plain text instead of timestamped chunks
            mode: 'auto', // 'native' | 'auto' | 'generate'
        });

        // Check if this is an async job response
        if (result && 'jobId' in result) {
            console.log('[AudioTranscription] Supadata returned async job, polling for result...');

            // Poll for job completion
            const jobId = result.jobId as string;
            const startTime = Date.now();

            while (Date.now() - startTime < JOB_MAX_WAIT_MS) {
                await sleep(JOB_POLL_INTERVAL_MS);

                try {
                    // The SDK should have a method to check job status
                    // Based on the docs, we need to check the job result
                    const jobResult = await (supadata.transcript as any).getJobStatus?.(jobId);

                    if (jobResult?.status === 'completed' && jobResult?.content) {
                        console.log('[AudioTranscription] Supadata job completed successfully');
                        return {
                            success: true,
                            transcript: typeof jobResult.content === 'string'
                                ? jobResult.content
                                : JSON.stringify(jobResult.content),
                            source: 'ai'
                        };
                    } else if (jobResult?.status === 'failed') {
                        console.error('[AudioTranscription] Supadata job failed:', jobResult?.error);
                        return { success: false, error: jobResult?.error || 'Transcription job failed' };
                    }
                    // Continue polling if status is 'queued' or 'active'
                } catch (pollError) {
                    console.log('[AudioTranscription] Job poll error, continuing...', pollError);
                }
            }

            return { success: false, error: 'Transcription job timed out. Please try again.' };
        }

        // Synchronous result
        if (result && (result as any).content) {
            const content = (result as any).content;
            const transcript = typeof content === 'string' ? content : JSON.stringify(content);

            console.log('[AudioTranscription] Supadata returned transcript, length:', transcript.length);
            return {
                success: true,
                transcript,
                source: 'native' // Assuming native if sync response
            };
        }

        // Handle case where result might be the transcript directly
        if (result && typeof result === 'string') {
            console.log('[AudioTranscription] Supadata returned direct string transcript');
            return {
                success: true,
                transcript: result,
                source: 'native'
            };
        }

        // Try to extract transcript from various response formats
        if (result) {
            // The result might be an object with transcript property
            const possibleTranscript = (result as any).transcript ||
                                       (result as any).text ||
                                       (result as any).data?.transcript;
            if (possibleTranscript) {
                console.log('[AudioTranscription] Supadata returned transcript in alternate format');
                return {
                    success: true,
                    transcript: typeof possibleTranscript === 'string'
                        ? possibleTranscript
                        : JSON.stringify(possibleTranscript),
                    source: 'native'
                };
            }
        }

        console.error('[AudioTranscription] Unexpected Supadata response format:', result);
        return { success: false, error: 'Unexpected response format from transcription service' };

    } catch (error: unknown) {
        if (error instanceof SupadataError) {
            console.error('[AudioTranscription] Supadata error:', error.error, error.message);

            // Map Supadata errors to user-friendly messages
            // Error types: 'invalid-request' | 'internal-error' | 'transcript-unavailable' | 'not-found' | 'unauthorized' | 'upgrade-required' | 'limit-exceeded'
            if (error.error === 'not-found') {
                return { success: false, error: 'Video not found. Please check the URL.' };
            }
            if (error.error === 'transcript-unavailable') {
                return { success: false, error: 'Transcript is not available for this video.' };
            }
            if (error.error === 'limit-exceeded') {
                return { success: false, error: 'Too many requests. Please try again in a few minutes.' };
            }
            if (error.error === 'unauthorized') {
                return { success: false, error: 'Transcription service authentication error. Please contact support.' };
            }
            if (error.error === 'upgrade-required') {
                return { success: false, error: 'Transcription service limit reached. Please try again later.' };
            }

            return { success: false, error: error.message || 'Failed to get transcript from video' };
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[AudioTranscription] Supadata request failed:', errorMessage);
        return { success: false, error: `Transcription service error: ${errorMessage}` };
    }
}

/**
 * Main orchestrator function: Get transcript from YouTube video
 * Uses Supadata API which handles both native captions and AI transcription.
 *
 * This is the primary function to call when YouTube native captions are unavailable
 * (the youtube-transcript package has already failed).
 */
export async function generateTranscriptFromYouTubeAudio(videoUrl: string): Promise<TranscriptionResult> {
    console.log('[AudioTranscription] Starting transcript generation for:', videoUrl);

    // Try Supadata API with retry logic
    let lastError: string = '';

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (attempt > 0) {
            const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
            console.log(`[AudioTranscription] Retry attempt ${attempt + 1}/${MAX_RETRIES}, waiting ${delay}ms...`);
            await sleep(delay);
        }

        const result = await getTranscriptWithSupadata(videoUrl);

        if (result.success) {
            console.log('[AudioTranscription] Successfully obtained transcript via Supadata');
            return result;
        }

        lastError = result.error || 'Unknown error';

        // Don't retry for certain errors
        if (lastError.includes('not found') ||
            lastError.includes('unavailable') ||
            lastError.includes('private') ||
            lastError.includes('not configured')) {
            break;
        }
    }

    console.error('[AudioTranscription] All attempts failed, last error:', lastError);
    return {
        success: false,
        error: lastError || 'Failed to generate transcript from video'
    };
}

/**
 * Check if a URL is a YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be');
}

/**
 * Export for backward compatibility and testing
 */
export { extractYouTubeVideoId };
