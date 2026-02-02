'use server';

/**
 * YouTube Service
 *
 * Fetches transcripts and metadata from YouTube videos.
 *
 * Transcript extraction fallback chain:
 * 1. Innertube API (youtube-transcript library) - Free, fast, but blocked for some videos
 * 2. Supadata API - Paid service with better success rate for videos without public captions
 * 3. yt-dlp - Local tool that downloads YouTube auto-generated captions directly
 * 4. AI multimodal parsing - Last resort, uses Gemini to watch and transcribe
 *
 * Uses YouTube Data API v3 for metadata (title, description, duration, thumbnail)
 */

import { YoutubeTranscript } from 'youtube-transcript';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// YouTube Data API v3 key
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyC4UfqwJM0toBikRdFo7jtx_eDZGOBW3Ng';

// Supadata API key for transcript fallback
const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY;

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
export async function extractYouTubeVideoId(url: string): Promise<string | null> {
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
        const videoId = await extractYouTubeVideoId(videoIdOrUrl);
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
        const videoId = await extractYouTubeVideoId(videoIdOrUrl);
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

/**
 * Fetch transcript from YouTube using Supadata API
 * This is a fallback when the Innertube API (youtube-transcript library) fails
 * Supadata has a higher success rate for videos without public captions
 */
export async function fetchYouTubeTranscriptSupadata(videoIdOrUrl: string): Promise<{
    success: boolean;
    transcript?: string;
    error?: string;
}> {
    if (!SUPADATA_API_KEY) {
        return { success: false, error: 'Supadata API key not configured' };
    }

    try {
        const videoId = await extractYouTubeVideoId(videoIdOrUrl);
        if (!videoId) {
            return { success: false, error: 'Invalid YouTube URL or video ID' };
        }

        console.log('[YouTube/Supadata] Fetching transcript for video:', videoId);

        // Supadata API endpoint for YouTube transcripts
        const response = await fetch(
            `https://api.supadata.ai/v1/youtube/transcript?video_id=${videoId}`,
            {
                method: 'GET',
                headers: {
                    'x-api-key': SUPADATA_API_KEY,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[YouTube/Supadata] API error:', response.status, errorData);
            return {
                success: false,
                error: errorData.error || `Supadata API error: ${response.status}`
            };
        }

        const data = await response.json();

        // Supadata returns transcript as an array of segments or a content string
        let transcript: string;
        if (data.content) {
            // Direct content string
            transcript = data.content;
        } else if (Array.isArray(data.transcript)) {
            // Array of segments with text
            transcript = data.transcript.map((seg: { text?: string }) => seg.text || '').join(' ');
        } else if (typeof data === 'string') {
            transcript = data;
        } else {
            return { success: false, error: 'Unexpected response format from Supadata' };
        }

        if (!transcript || transcript.trim().length === 0) {
            return { success: false, error: 'No transcript content returned from Supadata' };
        }

        console.log('[YouTube/Supadata] Successfully fetched transcript, length:', transcript.length);

        return {
            success: true,
            transcript: transcript.trim(),
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[YouTube/Supadata] Failed to fetch transcript:', errorMessage);
        return { success: false, error: `Supadata error: ${errorMessage}` };
    }
}

/**
 * Fetch transcript from YouTube using yt-dlp
 * This is a fallback when both Innertube and Supadata fail
 * yt-dlp can access auto-generated captions that other methods miss
 */
export async function fetchYouTubeTranscriptYtdlp(videoIdOrUrl: string): Promise<{
    success: boolean;
    transcript?: string;
    error?: string;
}> {
    try {
        const videoId = await extractYouTubeVideoId(videoIdOrUrl);
        if (!videoId) {
            return { success: false, error: 'Invalid YouTube URL or video ID' };
        }

        console.log('[YouTube/yt-dlp] Fetching transcript for video:', videoId);

        // Create temp directory for caption files
        const tempDir = path.join(os.tmpdir(), 'yt-transcripts');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const outputPath = path.join(tempDir, videoId);
        const vttFile = `${outputPath}.en.vtt`;

        // Clean up any existing file
        if (fs.existsSync(vttFile)) {
            fs.unlinkSync(vttFile);
        }

        // Download auto-generated subtitles in English using yt-dlp
        try {
            execSync(
                `yt-dlp --write-auto-sub --skip-download --sub-lang en -o "${outputPath}" "https://www.youtube.com/watch?v=${videoId}" 2>&1`,
                { timeout: 60000 }
            );
        } catch (execError: any) {
            // yt-dlp returns non-zero exit codes for various warnings, check if file exists
            if (!fs.existsSync(vttFile)) {
                return { success: false, error: 'yt-dlp failed to download captions' };
            }
        }

        // Check if VTT file was created
        if (!fs.existsSync(vttFile)) {
            return { success: false, error: 'No captions available for this video' };
        }

        // Parse VTT file
        const vttContent = fs.readFileSync(vttFile, 'utf-8');
        fs.unlinkSync(vttFile); // Clean up

        const transcript = parseVTT(vttContent);

        if (!transcript || transcript.length < 50) {
            return { success: false, error: 'Caption file was empty or too short' };
        }

        console.log('[YouTube/yt-dlp] Successfully fetched transcript, length:', transcript.length);

        return {
            success: true,
            transcript: transcript.trim(),
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[YouTube/yt-dlp] Failed to fetch transcript:', errorMessage);
        return { success: false, error: `yt-dlp error: ${errorMessage}` };
    }
}

/**
 * Parse VTT file to plain text transcript
 */
function parseVTT(vttContent: string): string {
    const lines = vttContent.split('\n');
    const textLines: string[] = [];
    let lastText = '';

    for (const line of lines) {
        // Skip WEBVTT header, timestamps, and empty lines
        if (line.startsWith('WEBVTT') ||
            line.startsWith('Kind:') ||
            line.startsWith('Language:') ||
            line.includes('-->') ||
            line.trim() === '') {
            continue;
        }

        // Remove VTT formatting tags like <c> and timestamps
        let text = line
            .replace(/<[^>]+>/g, '')  // Remove XML-like tags
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"')
            .trim();

        // Avoid duplicates (VTT often repeats lines with slight additions)
        if (text && text !== lastText && !lastText.includes(text)) {
            textLines.push(text);
            lastText = text;
        }
    }

    // Join and clean up
    return textLines.join(' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Fetch transcript with full fallback chain:
 * 1. Innertube API (youtube-transcript library) - Free, fast
 * 2. Supadata API - Paid, better success rate for restricted videos
 * 3. yt-dlp - Local tool for auto-generated captions
 *
 * Returns transcript source in result for logging/debugging
 */
export async function fetchYouTubeTranscriptWithFallback(videoIdOrUrl: string): Promise<{
    success: boolean;
    transcript?: string;
    segments?: YouTubeTranscriptSegment[];
    source?: 'innertube' | 'supadata' | 'ytdlp';
    error?: string;
}> {
    // Try Innertube API first (free, fast)
    console.log('[YouTube] Trying Innertube API for transcript...');
    const innertubeResult = await fetchYouTubeTranscript(videoIdOrUrl);

    if (innertubeResult.success && innertubeResult.transcript) {
        return {
            ...innertubeResult,
            source: 'innertube',
        };
    }

    console.log('[YouTube] Innertube failed:', innertubeResult.error);

    // Try Supadata API as fallback
    if (SUPADATA_API_KEY) {
        console.log('[YouTube] Trying Supadata API as fallback...');
        const supadataResult = await fetchYouTubeTranscriptSupadata(videoIdOrUrl);

        if (supadataResult.success && supadataResult.transcript) {
            return {
                success: true,
                transcript: supadataResult.transcript,
                source: 'supadata',
            };
        }

        console.log('[YouTube] Supadata failed:', supadataResult.error);
    }

    // Try yt-dlp as final fallback
    console.log('[YouTube] Trying yt-dlp as fallback...');
    const ytdlpResult = await fetchYouTubeTranscriptYtdlp(videoIdOrUrl);

    if (ytdlpResult.success && ytdlpResult.transcript) {
        return {
            success: true,
            transcript: ytdlpResult.transcript,
            source: 'ytdlp',
        };
    }

    console.log('[YouTube] yt-dlp failed:', ytdlpResult.error);

    // Return combined error
    const errors = [`Innertube: ${innertubeResult.error}`];
    if (SUPADATA_API_KEY) {
        errors.push('Supadata: rate limited or failed');
    }
    errors.push(`yt-dlp: ${ytdlpResult.error}`);

    return {
        success: false,
        error: errors.join('; '),
    };
}
