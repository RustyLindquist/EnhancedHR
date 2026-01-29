'use server';

/**
 * Video metadata server actions for fetching duration and metadata
 * from various video platforms (Vimeo, Wistia) using their oEmbed APIs.
 */

export type VideoPlatform = 'youtube' | 'vimeo' | 'wistia' | 'mux' | 'other';

export interface VideoMetadataResult {
    success: boolean;
    duration?: number; // in seconds
    title?: string;
    thumbnail?: string;
    error?: string;
}

/**
 * Detect the video platform from a URL or ID
 * Note: This is async to comply with "use server" requirements
 */
export async function detectVideoPlatform(url: string): Promise<VideoPlatform> {
    if (!url) return 'other';

    // YouTube detection
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return 'youtube';
    }

    // Vimeo detection
    if (url.includes('vimeo.com')) {
        return 'vimeo';
    }

    // Wistia detection - various formats
    if (
        url.includes('wistia.com') ||
        url.includes('wistia.net') ||
        url.includes('fast.wistia')
    ) {
        return 'wistia';
    }

    // Mux playback IDs are alphanumeric strings without dots or slashes
    // Typically 12-30 characters like "abc123XYZ789"
    if (/^[a-zA-Z0-9]+$/.test(url) && url.length >= 10 && url.length <= 40) {
        return 'mux';
    }

    return 'other';
}

/**
 * Fetch video metadata from Vimeo using their oEmbed API
 * Supports URLs like:
 * - https://vimeo.com/123456789
 * - https://player.vimeo.com/video/123456789
 */
export async function fetchVimeoMetadata(videoUrl: string): Promise<VideoMetadataResult> {
    try {
        console.log(`[VideoMetadata] Fetching Vimeo metadata for: ${videoUrl}`);

        // Vimeo oEmbed API endpoint
        const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(videoUrl)}`;

        const response = await fetch(oembedUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            // Add a reasonable timeout
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[VideoMetadata] Vimeo API error: ${response.status} - ${errorText}`);
            return {
                success: false,
                error: `Vimeo API returned ${response.status}: ${response.statusText}`,
            };
        }

        const data = await response.json();

        console.log(`[VideoMetadata] Vimeo metadata received:`, {
            title: data.title,
            duration: data.duration,
            hasThumbnail: !!data.thumbnail_url,
        });

        return {
            success: true,
            duration: data.duration, // Vimeo returns duration in seconds (integer)
            title: data.title,
            thumbnail: data.thumbnail_url,
        };
    } catch (error: any) {
        console.error('[VideoMetadata] Error fetching Vimeo metadata:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch Vimeo metadata',
        };
    }
}

/**
 * Fetch video metadata from Wistia using their oEmbed API
 * Supports URLs like:
 * - https://home.wistia.com/medias/abc123xyz
 * - https://fast.wistia.net/embed/iframe/abc123xyz
 * - https://{company}.wistia.com/medias/abc123xyz
 */
export async function fetchWistiaMetadata(videoUrl: string): Promise<VideoMetadataResult> {
    try {
        console.log(`[VideoMetadata] Fetching Wistia metadata for: ${videoUrl}`);

        // Wistia oEmbed API endpoint
        const oembedUrl = `https://fast.wistia.com/oembed?url=${encodeURIComponent(videoUrl)}`;

        const response = await fetch(oembedUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            // Add a reasonable timeout
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[VideoMetadata] Wistia API error: ${response.status} - ${errorText}`);
            return {
                success: false,
                error: `Wistia API returned ${response.status}: ${response.statusText}`,
            };
        }

        const data = await response.json();

        console.log(`[VideoMetadata] Wistia metadata received:`, {
            title: data.title,
            duration: data.duration,
            hasThumbnail: !!data.thumbnail_url,
        });

        // Wistia returns duration as a float (seconds), round to integer
        const durationSeconds = data.duration ? Math.round(data.duration) : undefined;

        return {
            success: true,
            duration: durationSeconds,
            title: data.title,
            thumbnail: data.thumbnail_url,
        };
    } catch (error: any) {
        console.error('[VideoMetadata] Error fetching Wistia metadata:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch Wistia metadata',
        };
    }
}

/**
 * Unified function to fetch video metadata based on detected platform
 * This can be extended to support more platforms in the future
 */
export async function fetchVideoMetadata(videoUrl: string): Promise<VideoMetadataResult & { platform: VideoPlatform }> {
    const platform = await detectVideoPlatform(videoUrl);

    console.log(`[VideoMetadata] Detected platform: ${platform} for URL: ${videoUrl}`);

    switch (platform) {
        case 'vimeo':
            const vimeoResult = await fetchVimeoMetadata(videoUrl);
            return { ...vimeoResult, platform };

        case 'wistia':
            const wistiaResult = await fetchWistiaMetadata(videoUrl);
            return { ...wistiaResult, platform };

        case 'youtube':
            // YouTube is handled separately via fetchYouTubeMetadataAction
            return {
                success: false,
                error: 'Use fetchYouTubeMetadataAction for YouTube videos',
                platform,
            };

        case 'mux':
            // Mux is handled separately via getDurationFromPlaybackId
            return {
                success: false,
                error: 'Use getDurationFromPlaybackId for Mux videos',
                platform,
            };

        default:
            return {
                success: false,
                error: 'Unsupported video platform',
                platform,
            };
    }
}
