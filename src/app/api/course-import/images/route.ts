/**
 * Course Image Import API Endpoint
 *
 * Imports course images to Supabase Storage.
 * Accepts either:
 * 1. imageUrl - Downloads from URL (must be publicly accessible)
 * 2. imageData - Base64 encoded image data (for localhost sources)
 *
 * Used during course migration to transfer images from WordPress to production.
 *
 * POST /api/course-import/images
 * Body: { courseId, imageUrl?, imageData?, contentType?, secretKey }
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface ImportImageRequest {
    courseId: number;
    imageUrl?: string;      // Public URL to download from
    imageData?: string;     // Base64 encoded image data
    contentType?: string;   // Content type when using imageData
    extension?: string;     // File extension when using imageData
    secretKey: string;
}

/**
 * Get content type from URL/filename
 */
function getContentType(url: string): string {
    const ext = url.split('.').pop()?.toLowerCase().split('?')[0];
    const types: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'gif': 'image/gif',
    };
    return types[ext || ''] || 'image/jpeg';
}

/**
 * Get file extension from URL
 */
function getExtension(url: string): string {
    const ext = url.split('.').pop()?.toLowerCase().split('?')[0];
    return ext || 'jpg';
}

export async function POST(request: Request) {
    try {
        const { courseId, imageUrl, imageData, contentType: providedContentType, extension, secretKey }: ImportImageRequest = await request.json();

        // Validate secret key
        if (secretKey !== process.env.COURSE_IMPORT_SECRET) {
            console.error('[Image Import] Invalid secret key');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!courseId || (!imageUrl && !imageData)) {
            return NextResponse.json(
                { error: 'Missing required fields: courseId and either imageUrl or imageData' },
                { status: 400 }
            );
        }

        let buffer: Uint8Array;
        let ext: string;
        let contentType: string;

        if (imageData) {
            // Use provided base64 data
            console.log(`[Image Import] Importing base64 image for course ${courseId}`);
            buffer = new Uint8Array(Buffer.from(imageData, 'base64'));
            ext = extension || 'jpg';
            contentType = providedContentType || getContentType(`.${ext}`);
        } else if (imageUrl) {
            // Download from URL
            console.log(`[Image Import] Downloading image for course ${courseId}: ${imageUrl}`);

            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) {
                return NextResponse.json(
                    { error: `Failed to download image: ${imageResponse.status}` },
                    { status: 400 }
                );
            }

            const imageBuffer = await imageResponse.arrayBuffer();
            buffer = new Uint8Array(imageBuffer);
            ext = getExtension(imageUrl);
            contentType = getContentType(imageUrl);
        } else {
            return NextResponse.json(
                { error: 'No image source provided' },
                { status: 400 }
            );
        }

        // Generate storage path
        const timestamp = Date.now();
        const storagePath = `course-${courseId}/${timestamp}.${ext}`;

        const supabase = createAdminClient();

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('course-images')
            .upload(storagePath, buffer, {
                contentType,
                upsert: true
            });

        if (uploadError) {
            console.error('[Image Import] Upload error:', uploadError);
            return NextResponse.json(
                { error: `Upload failed: ${uploadError.message}` },
                { status: 500 }
            );
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('course-images')
            .getPublicUrl(storagePath);

        const newImageUrl = urlData.publicUrl;

        // Update course record
        const { error: updateError } = await supabase
            .from('courses')
            .update({ image_url: newImageUrl })
            .eq('id', courseId);

        if (updateError) {
            console.error('[Image Import] Update error:', updateError);
            return NextResponse.json(
                { error: `Course update failed: ${updateError.message}` },
                { status: 500 }
            );
        }

        console.log(`[Image Import] Success: ${newImageUrl}`);

        return NextResponse.json({
            success: true,
            courseId,
            newImageUrl,
        });

    } catch (error: any) {
        console.error('[Image Import] Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
