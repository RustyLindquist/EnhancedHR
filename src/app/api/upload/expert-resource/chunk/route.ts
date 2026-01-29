import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

// Route segment config - allow larger body for chunks (but still under Vercel's limit)
export const runtime = 'nodejs';
export const maxDuration = 60;
// Increase body size limit for this route (default is 1MB for Vercel)
export const dynamic = 'force-dynamic';

const STORAGE_BUCKET = 'user-context-files';

/**
 * Check if user is a platform admin
 */
async function isPlatformAdmin(userId: string): Promise<boolean> {
    const admin = createAdminClient();
    const { data: profile } = await admin
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

    return profile?.role === 'admin';
}

// In-memory storage for chunks (in production, use Redis or similar)
const chunkStorage = new Map<string, { chunks: Buffer[]; totalChunks: number; fileType: string }>();

/**
 * POST - Receive a file chunk and store/upload it
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Verify user is platform admin
        const isAdmin = await isPlatformAdmin(user.id);
        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Forbidden: Only platform admins can upload expert resources' },
                { status: 403 }
            );
        }

        // Get chunk metadata from headers
        const storagePath = request.headers.get('X-Storage-Path');
        const chunkIndex = parseInt(request.headers.get('X-Chunk-Index') || '0', 10);
        const totalChunks = parseInt(request.headers.get('X-Total-Chunks') || '1', 10);
        const fileType = request.headers.get('X-File-Type') || 'application/octet-stream';

        if (!storagePath) {
            return NextResponse.json(
                { success: false, error: 'Missing X-Storage-Path header' },
                { status: 400 }
            );
        }

        // Read chunk data
        const chunkData = await request.arrayBuffer();
        const chunkBuffer = Buffer.from(chunkData);

        console.log(`[chunk-upload] Received chunk ${chunkIndex + 1}/${totalChunks} for ${storagePath} (${chunkBuffer.length} bytes)`);

        // Initialize or get existing chunk storage for this file
        if (!chunkStorage.has(storagePath)) {
            chunkStorage.set(storagePath, {
                chunks: new Array(totalChunks).fill(null),
                totalChunks,
                fileType
            });
        }

        const fileChunks = chunkStorage.get(storagePath)!;
        fileChunks.chunks[chunkIndex] = chunkBuffer;

        // Check if all chunks are received
        const receivedChunks = fileChunks.chunks.filter(c => c !== null).length;

        if (receivedChunks === totalChunks) {
            console.log(`[chunk-upload] All ${totalChunks} chunks received. Assembling and uploading...`);

            // Combine all chunks
            const completeFile = Buffer.concat(fileChunks.chunks);
            console.log(`[chunk-upload] Complete file size: ${completeFile.length} bytes`);

            // Upload to Supabase Storage using admin client
            const admin = createAdminClient();
            const { error: uploadError } = await admin.storage
                .from(STORAGE_BUCKET)
                .upload(storagePath, completeFile, {
                    contentType: fileType,
                    upsert: true
                });

            // Clean up chunk storage
            chunkStorage.delete(storagePath);

            if (uploadError) {
                console.error('[chunk-upload] Upload error:', uploadError);
                return NextResponse.json(
                    { success: false, error: uploadError.message },
                    { status: 500 }
                );
            }

            console.log(`[chunk-upload] Successfully uploaded complete file to ${storagePath}`);

            return NextResponse.json({
                success: true,
                complete: true,
                storagePath
            });
        }

        // Return success for this chunk (file not yet complete)
        return NextResponse.json({
            success: true,
            complete: false,
            chunksReceived: receivedChunks,
            totalChunks
        });

    } catch (error) {
        console.error('[chunk-upload] Error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Chunk upload failed' },
            { status: 500 }
        );
    }
}
