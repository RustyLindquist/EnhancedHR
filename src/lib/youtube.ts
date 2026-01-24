'use server';

/**
 * YouTube Service
 *
 * Fetches transcripts and metadata from YouTube videos.
 * Uses Innertube API for transcripts (more reliable than official API for auto-generated captions)
 * Uses YouTube Data API v3 for metadata (title, description, duration, thumbnail)
 */

import { YoutubeTranscript } from 'youtube-transcript';

// YouTube Data API v3 key
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyC4UfqwJM0toBikRdFo7jtx_eDZGOBW3Ng';

// Types
export interface YouTubeTranscriptSegment {
    text: string;
    offset: number;
    duration: number;
}

export interface YouTubeMetadata {
    title: string;
    description: string;
    duration: number; // in seconds
    thumbnail: string;
    channelTitle: string;
    publishedAt: string;
}

export interface YouTubeVideoData {
    transcript: string | null;
    metadata: YouTubeMetadata | null;
    transcriptSegments?: YouTubeTranscriptSegment[];
    error?: string;
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
 * Check if a URL is a YouTube URL
 */
export async function isYouTubeUrl(url: string): Promise<boolean> {
    return url.includes('youtube.com') || url.includes('youtu.be');
}

/**
 * Fetch transcript from YouTube using Innertube API
 * This can access auto-generated captions which the official API cannot
 */
export async function fetchYouTubeTranscript(videoIdOrUrl: string): Promise<{
    success: boolean;
    transcript?: string;
    segments?: YouTubeTranscriptSegment[];
    error?: string;
}> {
    try {
        const videoId = extractYouTubeVideoId(videoIdOrUrl);
        if (!videoId) {
            return { success: false, error: 'Invalid YouTube URL or video ID' };
        }

        console.log('[YouTube] Fetching transcript for video:', videoId);

        // Fetch transcript using youtube-transcript library
        const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);

        if (!transcriptData || transcriptData.length === 0) {
            return { success: false, error: 'No transcript available for this video' };
        }

        // Convert to our segment format
        const segments: YouTubeTranscriptSegment[] = transcriptData.map(item => ({
            text: item.text,
            offset: item.offset,
            duration: item.duration,
        }));

        // Combine all segments into full transcript text
        const transcript = segments.map(s => s.text).join(' ');

        console.log('[YouTube] Successfully fetched transcript, length:', transcript.length);

        return {
            success: true,
            transcript,
            segments,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[YouTube] Failed to fetch transcript:', errorMessage);

        // Common errors to handle gracefully
        if (errorMessage.includes('disabled') || errorMessage.includes('Subtitles are disabled')) {
            return { success: false, error: 'Subtitles/captions are disabled for this video' };
        }
        if (errorMessage.includes('not found') || errorMessage.includes('Could not find')) {
            return { success: false, error: 'Video not found or unavailable' };
        }
        if (errorMessage.includes('private') || errorMessage.includes('Private video')) {
            return { success: false, error: 'This video is private' };
        }

        return { success: false, error: `Failed to fetch transcript: ${errorMessage}` };
    }
}

/**
 * Fetch video metadata from YouTube Data API v3
 */
export async function fetchYouTubeMetadata(videoIdOrUrl: string): Promise<{
    success: boolean;
    metadata?: YouTubeMetadata;
    error?: string;
}> {
    try {
        const videoId = extractYouTubeVideoId(videoIdOrUrl);
        if (!videoId) {
            return { success: false, error: 'Invalid YouTube URL or video ID' };
        }

        console.log('[YouTube] Fetching metadata for video:', videoId);

        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?` +
            `part=snippet,contentDetails&` +
            `id=${videoId}&` +
            `key=${YOUTUBE_API_KEY}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok) {
            console.error('[YouTube] API error:', data);
            return { success: false, error: data.error?.message || 'Failed to fetch video metadata' };
        }

        if (!data.items || data.items.length === 0) {
            return { success: false, error: 'Video not found' };
        }

        const video = data.items[0];
        const snippet = video.snippet;
        const contentDetails = video.contentDetails;

        // Parse ISO 8601 duration to seconds
        const duration = parseISO8601Duration(contentDetails.duration);

        // Get best thumbnail
        const thumbnails = snippet.thumbnails;
        const thumbnail = thumbnails.maxres?.url ||
            thumbnails.high?.url ||
            thumbnails.medium?.url ||
            thumbnails.default?.url ||
            '';

        const metadata: YouTubeMetadata = {
            title: snippet.title,
            description: snippet.description,
            duration,
            thumbnail,
            channelTitle: snippet.channelTitle,
            publishedAt: snippet.publishedAt,
        };

        console.log('[YouTube] Successfully fetched metadata:', metadata.title);

        return { success: true, metadata };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[YouTube] Failed to fetch metadata:', errorMessage);
        return { success: false, error: `Failed to fetch metadata: ${errorMessage}` };
    }
}

/**
 * Fetch both transcript and metadata from YouTube
 * This is the main function to use for YouTube videos
 */
export async function fetchYouTubeVideoData(videoIdOrUrl: string): Promise<YouTubeVideoData> {
    const [transcriptResult, metadataResult] = await Promise.all([
        fetchYouTubeTranscript(videoIdOrUrl),
        fetchYouTubeMetadata(videoIdOrUrl),
    ]);

    return {
        transcript: transcriptResult.success ? transcriptResult.transcript || null : null,
        metadata: metadataResult.success ? metadataResult.metadata || null : null,
        transcriptSegments: transcriptResult.success ? transcriptResult.segments : undefined,
        error: !transcriptResult.success && !metadataResult.success
            ? `Transcript: ${transcriptResult.error}; Metadata: ${metadataResult.error}`
            : undefined,
    };
}

/**
 * Parse ISO 8601 duration string to seconds
 * e.g., "PT1H2M10S" -> 3730
 */
function parseISO8601Duration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    return hours * 3600 + minutes * 60 + seconds;
}
