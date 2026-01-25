import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Route segment config for large file uploads
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for video uploads

const TEMP_VIDEO_BUCKET = 'temp-video-uploads';

/**
 * Server-side proxy for video uploads
 *
 * This route accepts file uploads from the browser and forwards them to Supabase Storage.
 * Used as a fallback when direct browser-to-storage uploads fail due to ISP TLS interference
 * (e.g., Xfinity networks blocking certain TLS connections).
 *
 * Flow: Browser -> Our Server -> Supabase Storage
 *
 * The browser makes a same-origin request to our server (not blocked by ISP),
 * then our server makes a server-to-server request to Supabase (not using browser TLS).
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get the storage path from headers
        const storagePath = request.headers.get('X-Storage-Path');
        const contentType = request.headers.get('Content-Type') || 'video/mp4';

        if (!storagePath) {
            return NextResponse.json(
                { error: 'Missing storage path' },
                { status: 400 }
            );
        }

        // Validate that the storage path belongs to this user
        if (!storagePath.startsWith(`${user.id}/`)) {
            return NextResponse.json(
                { error: 'Invalid storage path' },
                { status: 403 }
            );
        }

        // Get the file data from the request body
        const fileData = await request.arrayBuffer();

        if (!fileData || fileData.byteLength === 0) {
            return NextResponse.json(
                { error: 'No file data received' },
                { status: 400 }
            );
        }

        console.log(`[Upload API] Uploading ${fileData.byteLength} bytes to ${storagePath}`);

        // Upload to Supabase Storage from the server
        const { data, error } = await supabase.storage
            .from(TEMP_VIDEO_BUCKET)
            .upload(storagePath, fileData, {
                contentType: contentType,
                upsert: true, // Overwrite if exists (in case of retry)
            });

        if (error) {
            console.error('[Upload API] Supabase upload error:', error);
            return NextResponse.json(
                { error: `Upload failed: ${error.message}` },
                { status: 500 }
            );
        }

        console.log('[Upload API] Upload successful:', data.path);

        return NextResponse.json({
            success: true,
            path: data.path,
        });

    } catch (error) {
        console.error('[Upload API] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Upload failed' },
            { status: 500 }
        );
    }
}
