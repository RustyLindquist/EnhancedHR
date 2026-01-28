'use server';

import Mux from '@mux/mux-node';
import { headers } from 'next/headers';

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});

// Get the CORS origin for Mux uploads
// Detects the actual browser origin from request headers for accurate CORS matching
async function getMuxCorsOrigin(): Promise<string> {
    // First check for explicit production URL
    const prodUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL;
    if (prodUrl) {
        return prodUrl;
    }

    // Try to detect origin from request headers
    try {
        const headersList = await headers();

        // Check Origin header first (most reliable for CORS)
        const origin = headersList.get('origin');
        if (origin) {
            console.log('[Mux] Detected origin from header:', origin);
            return origin;
        }

        // Fall back to Referer header
        const referer = headersList.get('referer');
        if (referer) {
            const url = new URL(referer);
            const detectedOrigin = `${url.protocol}//${url.host}`;
            console.log('[Mux] Detected origin from referer:', detectedOrigin);
            return detectedOrigin;
        }
    } catch (e) {
        console.log('[Mux] Could not detect origin from headers:', e);
    }

    // Final fallback for local development
    return 'http://localhost:3000';
}

export async function getMuxUploadUrl() {
    const corsOrigin = await getMuxCorsOrigin();
    console.log('[Mux] Creating upload with CORS origin:', corsOrigin);

    try {
        const upload = await mux.video.uploads.create({
            new_asset_settings: {
                playback_policy: ['public'],
                encoding_tier: 'smart',
                master_access: 'temporary',     // Enable audio track access for captions
                mp4_support: 'standard',        // Enable MP4 renditions for Whisper fallback
            },
            cors_origin: corsOrigin,
        });

        console.log('[Mux] Upload created successfully, id:', upload.id);

        return {
            uploadUrl: upload.url,
            uploadId: upload.id,
        };
    } catch (error: any) {
        console.error('[Mux] Error creating upload:', error);
        console.error('[Mux] Error details:', JSON.stringify(error, null, 2));

        // Extract user-friendly error message from Mux API response
        const muxMessage = error?.error?.messages?.[0] || error?.message;
        if (muxMessage?.includes('Free plan is limited')) {
            throw new Error('Mux video limit reached. Please delete unused videos or upgrade your Mux plan.');
        }

        throw new Error(`Failed to create upload URL: ${muxMessage || 'Unknown error'}`);
    }
}

export async function getMuxAssetId(uploadId: string) {
    try {
        const upload = await mux.video.uploads.retrieve(uploadId);
        return upload.asset_id;
    } catch (error) {
        console.error('Error retrieving Mux upload:', error);
        return null;
    }
}

// Poll for the asset ID with retries - the asset may not be created immediately after upload
export async function waitForMuxAssetId(uploadId: string, maxAttempts: number = 30): Promise<string | null> {
    for (let i = 0; i < maxAttempts; i++) {
        const assetId = await getMuxAssetId(uploadId);
        if (assetId) {
            console.log(`[Mux] Got asset ID on attempt ${i + 1}:`, assetId);
            return assetId;
        }
        // Wait 2 seconds between checks
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    console.error('[Mux] Timed out waiting for asset ID');
    return null;
}

export async function createMuxAssetFromUrl(url: string, passthrough?: string) {
    try {
        const asset = await mux.video.assets.create({
            input: [{ url }],
            playback_policy: ['public'],
            encoding_tier: 'smart',
            passthrough, // We can store our internal ID here
        } as any);
        return asset;
    } catch (error) {
        console.error("Mux Creation Error:", error);
        throw error;
    }
}

export async function getMuxAssetDetails(assetId: string) {
    try {
        const asset = await mux.video.assets.retrieve(assetId);
        return {
            duration: asset.duration,
            playbackId: asset.playback_ids?.[0]?.id,
            status: asset.status,
        };
    } catch (error) {
        console.error('Error retrieving Mux asset:', error);
        return null;
    }
}

export async function waitForMuxAssetReady(assetId: string, maxAttempts: number = 60): Promise<{ ready: boolean; playbackId?: string; duration?: number }> {
    for (let i = 0; i < maxAttempts; i++) {
        const details = await getMuxAssetDetails(assetId);
        if (details?.status === 'ready' && details.playbackId) {
            return {
                ready: true,
                playbackId: details.playbackId,
                duration: details.duration,
            };
        }
        if (details?.status === 'errored') {
            return { ready: false };
        }
        // Wait 2 seconds between checks
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    return { ready: false };
}

export async function deleteMuxAsset(assetId: string): Promise<boolean> {
    try {
        await mux.video.assets.delete(assetId);
        return true;
    } catch (error) {
        console.error('Error deleting Mux asset:', error);
        return false;
    }
}

/**
 * Delete a Mux asset by its playback ID
 * Looks up the asset ID first, then deletes
 */
export async function deleteMuxAssetByPlaybackId(playbackId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        console.log(`[Mux] Attempting to delete asset with playback ID: ${playbackId}`);

        // First, get the asset ID from the playback ID
        const assetId = await getAssetIdFromPlaybackId(playbackId);

        if (!assetId) {
            console.log(`[Mux] No asset found for playback ID: ${playbackId} - may already be deleted`);
            return { success: true }; // Consider it a success if the asset doesn't exist
        }

        // Delete the asset
        const deleted = await deleteMuxAsset(assetId);

        if (deleted) {
            console.log(`[Mux] Successfully deleted asset ${assetId} (playback ID: ${playbackId})`);
            return { success: true };
        } else {
            console.error(`[Mux] Failed to delete asset ${assetId}`);
            return { success: false, error: 'Failed to delete Mux asset' };
        }
    } catch (error: any) {
        console.error('[Mux] Error deleting asset by playback ID:', error);
        return { success: false, error: error.message || 'Unknown error' };
    }
}

/**
 * Get playback ID from an upload ID by querying Mux API
 * Upload ID → Asset ID → Playback ID
 */
export async function getPlaybackIdFromUploadId(uploadId: string): Promise<string | null> {
    try {
        // Get upload details - this gives us the asset_id
        const upload = await mux.video.uploads.retrieve(uploadId);
        const assetId = upload.asset_id;

        if (!assetId) {
            console.log(`[Mux] Upload ${uploadId} has no asset yet`);
            return null;
        }

        // Get asset details - this gives us the playback_id
        const asset = await mux.video.assets.retrieve(assetId);
        const playbackId = asset.playback_ids?.[0]?.id;

        return playbackId || null;
    } catch (error) {
        console.error(`[Mux] Error getting playback ID for upload ${uploadId}:`, error);
        return null;
    }
}

/**
 * Check if a string looks like a Mux upload ID (UUID format)
 * Upload IDs are UUIDs with hyphens: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 * Playback IDs are shorter alphanumeric strings without hyphens
 */
function isUploadId(str: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Find all course lessons with broken video URLs (upload IDs instead of playback IDs)
 * Returns diagnostic info without making changes
 */
export async function findBrokenVideoUrls(): Promise<{
    broken: Array<{ id: string; title: string; courseId: string; videoUrl: string }>;
    total: number;
}> {
    // Import here to avoid circular dependencies
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const admin = createAdminClient();

    // Get all lessons with video URLs that aren't external URLs
    const { data: lessons, error } = await admin
        .from('course_lessons')
        .select('id, title, video_url, course_id')
        .not('video_url', 'is', null)
        .not('video_url', 'ilike', 'http%');

    if (error || !lessons) {
        console.error('[Mux] Error fetching lessons:', error);
        return { broken: [], total: 0 };
    }

    // Filter to only those with upload IDs (UUID format)
    const broken = lessons
        .filter(lesson => lesson.video_url && isUploadId(lesson.video_url))
        .map(lesson => ({
            id: lesson.id,
            title: lesson.title,
            courseId: lesson.course_id,
            videoUrl: lesson.video_url,
        }));

    return { broken, total: lessons.length };
}

/**
 * Fix a single lesson's video URL by converting upload ID to playback ID
 */
export async function fixLessonVideoUrl(lessonId: string, uploadId: string): Promise<{
    success: boolean;
    playbackId?: string;
    error?: string;
}> {
    const playbackId = await getPlaybackIdFromUploadId(uploadId);

    if (!playbackId) {
        return { success: false, error: 'Could not retrieve playback ID from Mux' };
    }

    // Import here to avoid circular dependencies
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const admin = createAdminClient();

    const { error } = await admin
        .from('course_lessons')
        .update({ video_url: playbackId })
        .eq('id', lessonId);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, playbackId };
}

/**
 * Fix all broken video URLs in course lessons
 * Converts upload IDs to playback IDs via Mux API
 */
export async function fixBrokenVideoUrls(): Promise<{
    fixed: number;
    failed: number;
    results: Array<{ lessonId: string; title: string; oldUrl: string; newUrl?: string; error?: string }>;
}> {
    const { broken } = await findBrokenVideoUrls();

    console.log(`[Mux] Found ${broken.length} lessons with upload IDs that need fixing`);

    const results: Array<{ lessonId: string; title: string; oldUrl: string; newUrl?: string; error?: string }> = [];
    let fixed = 0;
    let failed = 0;

    for (const lesson of broken) {
        console.log(`[Mux] Fixing lesson "${lesson.title}" (${lesson.id}): ${lesson.videoUrl}`);

        const result = await fixLessonVideoUrl(lesson.id, lesson.videoUrl);

        if (result.success && result.playbackId) {
            fixed++;
            results.push({
                lessonId: lesson.id,
                title: lesson.title,
                oldUrl: lesson.videoUrl,
                newUrl: result.playbackId,
            });
            console.log(`[Mux] ✓ Fixed: ${lesson.videoUrl} → ${result.playbackId}`);
        } else {
            failed++;
            results.push({
                lessonId: lesson.id,
                title: lesson.title,
                oldUrl: lesson.videoUrl,
                error: result.error,
            });
            console.log(`[Mux] ✗ Failed: ${result.error}`);
        }
    }

    console.log(`[Mux] Fix complete: ${fixed} fixed, ${failed} failed`);

    return { fixed, failed, results };
}

/**
 * Get asset ID from a playback ID
 * Searches through Mux assets to find the matching one
 */
export async function getAssetIdFromPlaybackId(playbackId: string): Promise<string | null> {
    try {
        console.log(`[Mux] Looking up asset ID for playback ID: ${playbackId}`);

        // List recent assets and find the one with matching playback ID
        // The list returns a paginated result, iterate through it
        const assetsPage = await mux.video.assets.list({ limit: 100 });

        for await (const asset of assetsPage) {
            if (asset.playback_ids?.some(p => p.id === playbackId)) {
                console.log(`[Mux] Found asset ID: ${asset.id} for playback ID: ${playbackId}`);
                return asset.id;
            }
        }

        console.log(`[Mux] No asset found for playback ID: ${playbackId}`);
        return null;
    } catch (error) {
        console.error('[Mux] Error looking up asset by playback ID:', error);
        return null;
    }
}

/**
 * Request auto-generated captions for a Mux asset
 * Uses Mux's generateSubtitles API which requires the audio track ID
 * Returns the generated text track IDs for polling
 */
export async function requestMuxAutoCaption(assetId: string): Promise<{
    success: boolean;
    trackIds?: string[];
    error?: string;
}> {
    try {
        console.log(`[Mux] Requesting auto-caption for asset: ${assetId}`);

        // First, get the asset to find the audio track ID
        const asset = await mux.video.assets.retrieve(assetId);
        const audioTrack = asset.tracks?.find(t => t.type === 'audio');

        if (!audioTrack?.id) {
            console.error('[Mux] No audio track found on asset');
            return { success: false, error: 'No audio track found on asset' };
        }

        console.log(`[Mux] Found audio track: ${audioTrack.id}`);

        // Use generateSubtitles to request auto-generated captions
        const result = await mux.video.assets.generateSubtitles(assetId, audioTrack.id, {
            generated_subtitles: [
                {
                    language_code: 'en',
                    name: 'English (auto-generated)',
                },
            ],
        });

        // The result contains the generated text tracks
        const trackIds = result.map(track => track.id).filter((id): id is string => !!id);
        console.log(`[Mux] Auto-caption tracks created with IDs: ${trackIds.join(', ')}`);

        return { success: true, trackIds };
    } catch (error: any) {
        console.error('[Mux] Error requesting auto-caption:', error);
        return { success: false, error: error.message || 'Failed to request captions' };
    }
}

/**
 * Poll for caption track completion
 * Returns the VTT URL when ready
 * Can accept a single trackId or array of trackIds (will return first ready track)
 */
export async function waitForMuxCaptionReady(
    assetId: string,
    trackIdOrIds: string | string[],
    maxAttempts: number = 40  // ~2 minutes at 3 second intervals
): Promise<{
    ready: boolean;
    vttUrl?: string;
    playbackId?: string;
    trackId?: string;
    error?: string;
}> {
    const trackIds = Array.isArray(trackIdOrIds) ? trackIdOrIds : [trackIdOrIds];
    console.log(`[Mux] Waiting for caption track(s) ${trackIds.join(', ')} on asset ${assetId} to be ready...`);

    for (let i = 0; i < maxAttempts; i++) {
        try {
            const asset = await mux.video.assets.retrieve(assetId);

            // Check all provided track IDs
            for (const trackId of trackIds) {
                const track = asset.tracks?.find(t => t.id === trackId);

                if (track?.status === 'ready') {
                    const playbackId = asset.playback_ids?.[0]?.id;
                    if (!playbackId) {
                        console.error('[Mux] Caption track ready but no playback ID found');
                        return { ready: false, error: 'No playback ID found' };
                    }

                    // Mux VTT URL format
                    const vttUrl = `https://stream.mux.com/${playbackId}/text/${trackId}.vtt`;
                    console.log(`[Mux] Caption track ready! VTT URL: ${vttUrl}`);
                    return { ready: true, vttUrl, playbackId, trackId };
                }

                if (track?.status === 'errored') {
                    console.error(`[Mux] Caption generation failed for track ${trackId}`);
                    return { ready: false, error: 'Caption generation failed' };
                }
            }

            // Log status of first track for progress indication
            const firstTrack = asset.tracks?.find(t => trackIds.includes(t.id || ''));
            console.log(`[Mux] Caption track status: ${firstTrack?.status || 'unknown'}, attempt ${i + 1}/${maxAttempts}`);

            // Wait 3 seconds between checks
            await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (error: any) {
            console.error('[Mux] Error checking caption status:', error);
        }
    }

    console.error('[Mux] Caption generation timed out');
    return { ready: false, error: 'Caption generation timed out' };
}

/**
 * Fetch VTT content from Mux
 */
export async function fetchMuxVTT(vttUrl: string): Promise<{
    success: boolean;
    content?: string;
    error?: string;
}> {
    try {
        console.log(`[Mux] Fetching VTT content from: ${vttUrl}`);

        const response = await fetch(vttUrl);
        if (!response.ok) {
            console.error(`[Mux] Failed to fetch VTT: ${response.status} ${response.statusText}`);
            return { success: false, error: `Failed to fetch VTT: ${response.status}` };
        }

        const content = await response.text();
        console.log(`[Mux] Successfully fetched VTT content (${content.length} characters)`);
        return { success: true, content };
    } catch (error: any) {
        console.error('[Mux] Error fetching VTT:', error);
        return { success: false, error: error.message };
    }
}
