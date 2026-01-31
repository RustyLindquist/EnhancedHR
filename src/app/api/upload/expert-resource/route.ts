import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { parseFileContent } from '@/lib/file-parser';
import { generateQuickAIResponse } from '@/lib/ai/quick-ai';
import { revalidatePath } from 'next/cache';

// Route segment config for file processing
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for file processing

const EXPERT_RESOURCES_COLLECTION_ID = 'expert-resources';
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
 * GET - Get a signed upload URL for direct upload to Supabase Storage
 * This bypasses Vercel's payload limit by allowing the client to upload directly
 */
export async function GET(request: NextRequest) {
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

        // Get file info from query params
        const { searchParams } = new URL(request.url);
        const fileName = searchParams.get('fileName');
        const fileType = searchParams.get('fileType');

        if (!fileName || !fileType) {
            return NextResponse.json(
                { success: false, error: 'Missing fileName or fileType' },
                { status: 400 }
            );
        }

        // Generate storage path
        const timestamp = Date.now();
        const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `platform/${EXPERT_RESOURCES_COLLECTION_ID}/${timestamp}_${sanitizedName}`;

        // Create signed upload URL using admin client
        const admin = createAdminClient();
        const { data: signedUrl, error: signError } = await admin.storage
            .from(STORAGE_BUCKET)
            .createSignedUploadUrl(storagePath);

        if (signError || !signedUrl) {
            console.error('[expert-resource-upload] Failed to create signed URL:', signError);
            return NextResponse.json(
                { success: false, error: signError?.message || 'Failed to create upload URL' },
                { status: 500 }
            );
        }

        console.log('[expert-resource-upload] Created signed upload URL for:', storagePath);

        return NextResponse.json({
            success: true,
            signedUrl: signedUrl.signedUrl,
            token: signedUrl.token,
            storagePath,
            fileName,
            fileType
        });

    } catch (error) {
        console.error('[expert-resource-upload] GET Error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to get upload URL' },
            { status: 500 }
        );
    }
}

/**
 * POST - Process an uploaded file and create the database record
 * Called after the client has uploaded directly to Supabase Storage
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
                { success: false, error: 'Forbidden: Only platform admins can create expert resources' },
                { status: 403 }
            );
        }

        // Get the storage path and file info from the request body
        const body = await request.json();
        const { storagePath, fileName, fileType, fileSize } = body;

        if (!storagePath || !fileName || !fileType) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: storagePath, fileName, fileType' },
                { status: 400 }
            );
        }

        console.log('[expert-resource-upload] Processing uploaded file:', {
            storagePath,
            fileName,
            fileType,
            fileSize
        });

        const admin = createAdminClient();

        // 1. Download the file from storage to parse it
        const { data: fileData, error: downloadError } = await admin.storage
            .from(STORAGE_BUCKET)
            .download(storagePath);

        if (downloadError || !fileData) {
            console.error('[expert-resource-upload] Failed to download file for processing:', downloadError);
            return NextResponse.json(
                { success: false, error: 'Failed to access uploaded file' },
                { status: 500 }
            );
        }

        const fileBuffer = await fileData.arrayBuffer();

        // 2. Parse file content
        const parseResult = await parseFileContent(fileBuffer, fileType, fileName);
        const textContent = parseResult.success ? parseResult.text : '';

        console.log('[expert-resource-upload] Parse result:', {
            success: parseResult.success,
            textLength: textContent.length,
            error: parseResult.error
        });

        // 3. Generate AI summary (if we have parsed text)
        let summary: string | null = null;
        if (textContent && textContent.length > 50) {
            try {
                const truncatedText = textContent.substring(0, 2500);
                const summaryPrompt = `Summarize the following document in 2-3 concise sentences for a preview card. Focus on the main topic and key points:\n\n${truncatedText}`;

                const generatedSummary = await generateQuickAIResponse(summaryPrompt, 150);
                if (generatedSummary && generatedSummary.length > 0) {
                    summary = generatedSummary;
                    console.log('[expert-resource-upload] Generated summary:', summary.substring(0, 100) + '...');
                }
            } catch (summaryError) {
                console.warn('[expert-resource-upload] Summary generation failed (non-blocking):', summaryError);
            }
        }

        // 4. Get public URL
        const { data: urlData } = admin.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(storagePath);

        // 5. Create database record
        const { data: inserted, error: dbError } = await admin
            .from('user_context_items')
            .insert({
                user_id: user.id,
                collection_id: EXPERT_RESOURCES_COLLECTION_ID,
                type: 'FILE',
                title: fileName,
                content: {
                    fileName,
                    fileType,
                    fileSize: fileSize || fileBuffer.byteLength,
                    url: urlData.publicUrl,
                    storagePath,
                    parsedTextLength: textContent.length,
                    parseError: parseResult.success ? null : parseResult.error,
                    summary,
                    isPlatformOwned: true
                },
                created_by: user.id
            })
            .select()
            .single();

        if (dbError) {
            console.error('[expert-resource-upload] DB Error:', dbError);
            // Try to clean up uploaded file
            await admin.storage.from(STORAGE_BUCKET).remove([storagePath]);
            return NextResponse.json(
                { success: false, error: dbError.message },
                { status: 500 }
            );
        }

        console.log('[expert-resource-upload] Success! Inserted:', inserted.id);

        revalidatePath('/author/resources');

        return NextResponse.json({
            success: true,
            id: inserted.id
        });

    } catch (error) {
        console.error('[expert-resource-upload] POST Error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Processing failed' },
            { status: 500 }
        );
    }
}
