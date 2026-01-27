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
