'use server';

/**
 * Whisper Transcription Service
 *
 * Uses OpenAI's Whisper API to transcribe Mux videos.
 * Fallback for when Mux auto-captions fail.
 */

import OpenAI from 'openai';

// Lazy-initialize OpenAI client to avoid build-time errors when key is not set
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
    if (!openai) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY not configured');
        }
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openai;
}

interface TranscriptionResult {
    success: boolean;
    transcript?: string;
    error?: string;
}

/**
 * Transcribe a Mux video using OpenAI Whisper
 *
 * @param playbackId - Mux playback ID
 * @returns Transcription result with transcript text or error
 */
export async function transcribeWithWhisper(playbackId: string): Promise<TranscriptionResult> {
    if (!process.env.OPENAI_API_KEY) {
        console.error('[Whisper] OPENAI_API_KEY not configured');
        return { success: false, error: 'Whisper transcription not configured' };
    }

    // Mux provides MP4 renditions at predictable URLs
    // high.mp4 gives us good quality audio for transcription
    const videoUrl = `https://stream.mux.com/${playbackId}/high.mp4`;

    console.log('[Whisper] Starting transcription for:', playbackId);

    try {
        // Fetch the video file
        console.log('[Whisper] Fetching video from Mux...');
        const response = await fetch(videoUrl);

        if (!response.ok) {
            console.error('[Whisper] Failed to fetch video:', response.status);
            return {
                success: false,
                error: `Failed to fetch video: ${response.status} ${response.statusText}`
            };
        }

        // Get the video as a buffer
        const videoBuffer = await response.arrayBuffer();
        const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' });

        // Create a File object for the Whisper API
        // OpenAI's SDK expects a File-like object
        const file = new File([videoBlob], 'video.mp4', { type: 'video/mp4' });

        console.log('[Whisper] Sending to OpenAI Whisper API...');
        console.log('[Whisper] File size:', (videoBuffer.byteLength / 1024 / 1024).toFixed(2), 'MB');

        // Call Whisper API
        const transcription = await getOpenAIClient().audio.transcriptions.create({
            file: file,
            model: 'whisper-1',
            response_format: 'text',
            language: 'en',  // Optimize for English
        });

        console.log('[Whisper] Transcription complete, length:', transcription.length);

        return {
            success: true,
            transcript: transcription
        };

    } catch (error: any) {
        console.error('[Whisper] Transcription error:', error);

        // Handle specific error types
        if (error?.code === 'ECONNREFUSED') {
            return { success: false, error: 'Could not connect to OpenAI API' };
        }

        if (error?.status === 413) {
            return { success: false, error: 'Video file too large for transcription (max 25MB)' };
        }

        if (error?.status === 429) {
            return { success: false, error: 'Rate limit exceeded. Please try again later.' };
        }

        if (error?.status === 401) {
            return { success: false, error: 'Invalid OpenAI API key' };
        }

        return {
            success: false,
            error: error.message || 'Transcription failed'
        };
    }
}

/**
 * Transcribe a video from a direct URL using OpenAI Whisper
 * Used for non-Mux videos where we have a direct video/audio URL
 *
 * @param url - Direct URL to video or audio file
 * @returns Transcription result
 */
export async function transcribeFromUrl(url: string): Promise<TranscriptionResult> {
    if (!process.env.OPENAI_API_KEY) {
        return { success: false, error: 'Whisper transcription not configured' };
    }

    console.log('[Whisper] Transcribing from URL:', url);

    try {
        const response = await fetch(url);

        if (!response.ok) {
            return {
                success: false,
                error: `Failed to fetch media: ${response.status}`
            };
        }

        const buffer = await response.arrayBuffer();

        // Check file size (Whisper has 25MB limit)
        const fileSizeMB = buffer.byteLength / 1024 / 1024;
        if (fileSizeMB > 25) {
            return {
                success: false,
                error: `File too large (${fileSizeMB.toFixed(1)}MB). Maximum is 25MB.`
            };
        }

        // Determine content type
        const contentType = response.headers.get('content-type') || 'audio/mpeg';
        const extension = getExtensionFromContentType(contentType);

        const blob = new Blob([buffer], { type: contentType });
        const file = new File([blob], `audio.${extension}`, { type: contentType });

        const transcription = await getOpenAIClient().audio.transcriptions.create({
            file: file,
            model: 'whisper-1',
            response_format: 'text',
        });

        return { success: true, transcript: transcription };

    } catch (error: any) {
        console.error('[Whisper] Error:', error);
        return { success: false, error: error.message || 'Transcription failed' };
    }
}

/**
 * Helper to get file extension from content type
 */
function getExtensionFromContentType(contentType: string): string {
    const typeMap: Record<string, string> = {
        'video/mp4': 'mp4',
        'audio/mp4': 'm4a',
        'audio/mpeg': 'mp3',
        'audio/wav': 'wav',
        'audio/webm': 'webm',
        'video/webm': 'webm',
        'audio/ogg': 'ogg',
        'audio/flac': 'flac',
    };

    return typeMap[contentType] || 'mp4';
}

/**
 * Check if Whisper transcription is available
 * Use this to determine if fallback is possible
 */
export async function isWhisperAvailable(): Promise<boolean> {
    return !!process.env.OPENAI_API_KEY;
}
