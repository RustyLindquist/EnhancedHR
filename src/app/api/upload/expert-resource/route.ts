import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { parseFileContent } from '@/lib/file-parser';
import { generateQuickAIResponse } from '@/lib/ai/quick-ai';
import { revalidatePath } from 'next/cache';

// Route segment config for large file uploads
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for file processing

const EXPERT_RESOURCES_COLLECTION_ID = 'expert-resources';

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
 * API route for uploading expert resources
 * Uses FormData to bypass serverless function payload limits
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

        // Parse FormData
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            );
        }

        const fileName = file.name;
        const fileType = file.type;
        const fileBuffer = await file.arrayBuffer();

        console.log('[expert-resource-upload] Processing file:', {
            fileName,
            fileType,
            size: fileBuffer.byteLength
        });

        // 1. Parse file content
        const parseResult = await parseFileContent(fileBuffer, fileType, fileName);
        const textContent = parseResult.success ? parseResult.text : '';

        console.log('[expert-resource-upload] Parse result:', {
            success: parseResult.success,
            textLength: textContent.length,
            error: parseResult.error
        });

        // 2. Generate AI summary (if we have parsed text)
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

        // 3. Upload to Supabase Storage
        const admin = createAdminClient();
        const timestamp = Date.now();
        const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `platform/${EXPERT_RESOURCES_COLLECTION_ID}/${timestamp}_${sanitizedName}`;

        const { error: uploadError } = await admin.storage
            .from('user-context-files')
            .upload(storagePath, fileBuffer, {
                contentType: fileType,
                upsert: false
            });

        if (uploadError) {
            console.error('[expert-resource-upload] Storage upload error:', uploadError);
            return NextResponse.json(
                { success: false, error: uploadError.message },
                { status: 500 }
            );
        }

        // Get public URL
        const { data: urlData } = admin.storage
            .from('user-context-files')
            .getPublicUrl(storagePath);

        // 4. Create database record
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
                    fileSize: fileBuffer.byteLength,
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
            await admin.storage.from('user-context-files').remove([storagePath]);
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
        console.error('[expert-resource-upload] Error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Upload failed' },
            { status: 500 }
        );
    }
}
