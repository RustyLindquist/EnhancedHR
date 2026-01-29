import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

// Route segment config - allow larger body for chunks (but still under Vercel's limit)
export const runtime = 'nodejs';
export const maxDuration = 60;
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

/**
 * POST - Receive a file chunk and upload it directly to storage
 * Each chunk is stored as a separate file: {storagePath}.chunk.{index}
 * The final processing step will combine them
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

        // Upload this chunk to storage as a separate file
        const chunkPath = `${storagePath}.chunk.${chunkIndex}`;
        const admin = createAdminClient();

        const { error: uploadError } = await admin.storage
            .from(STORAGE_BUCKET)
            .upload(chunkPath, chunkBuffer, {
                contentType: 'application/octet-stream',
                upsert: true
            });

        if (uploadError) {
            console.error(`[chunk-upload] Failed to upload chunk ${chunkIndex}:`, uploadError);
            return NextResponse.json(
                { success: false, error: uploadError.message },
                { status: 500 }
            );
        }

        console.log(`[chunk-upload] Chunk ${chunkIndex + 1}/${totalChunks} uploaded to ${chunkPath}`);

        // If this is the last chunk, combine all chunks into the final file
        if (chunkIndex === totalChunks - 1) {
            console.log(`[chunk-upload] Last chunk received. Combining ${totalChunks} chunks...`);

            // Download all chunks and combine
            const chunks: Buffer[] = [];
            for (let i = 0; i < totalChunks; i++) {
                const chunkFilePath = `${storagePath}.chunk.${i}`;
                const { data: chunkData, error: downloadError } = await admin.storage
                    .from(STORAGE_BUCKET)
                    .download(chunkFilePath);

                if (downloadError || !chunkData) {
                    console.error(`[chunk-upload] Failed to download chunk ${i}:`, downloadError);
                    return NextResponse.json(
                        { success: false, error: `Failed to combine chunks: chunk ${i} missing` },
                        { status: 500 }
                    );
                }

                chunks.push(Buffer.from(await chunkData.arrayBuffer()));
            }

            // Combine all chunks
            const completeFile = Buffer.concat(chunks);
            console.log(`[chunk-upload] Combined file size: ${completeFile.length} bytes`);

            // Upload the complete file
            const { error: finalUploadError } = await admin.storage
                .from(STORAGE_BUCKET)
                .upload(storagePath, completeFile, {
                    contentType: fileType,
                    upsert: true
                });

            if (finalUploadError) {
                console.error('[chunk-upload] Failed to upload combined file:', finalUploadError);
                return NextResponse.json(
                    { success: false, error: finalUploadError.message },
                    { status: 500 }
                );
            }

            // Clean up chunk files
            const chunkPaths = Array.from({ length: totalChunks }, (_, i) => `${storagePath}.chunk.${i}`);
            await admin.storage.from(STORAGE_BUCKET).remove(chunkPaths);

            console.log(`[chunk-upload] Successfully combined and uploaded complete file to ${storagePath}`);

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
            chunkIndex,
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
