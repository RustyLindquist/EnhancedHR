'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { ContextItemType } from '@/types';
import { parseFileContent, uploadFileToStorage } from '@/lib/file-parser';
import { generateQuickAIResponse } from '@/lib/ai/quick-ai';

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

interface CreateExpertResourceDTO {
    type: ContextItemType;
    title: string;
    content: any;
}

/**
 * Create an expert resource (platform admin only)
 * Uses admin client to bypass RLS since expert resources are platform-wide
 */
export async function createExpertResource(data: CreateExpertResourceDTO) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.error('[createExpertResource] Unauthorized: No user found');
        return { success: false, error: 'Unauthorized: No user found' };
    }

    // Verify user is platform admin
    const isAdmin = await isPlatformAdmin(user.id);
    if (!isAdmin) {
        console.error('[createExpertResource] Forbidden: User is not platform admin');
        return { success: false, error: 'Forbidden: Only platform admins can create expert resources' };
    }

    console.log('[createExpertResource] Creating resource:', {
        userId: user.id,
        collectionId: EXPERT_RESOURCES_COLLECTION_ID,
        type: data.type,
        title: data.title
    });

    // Use admin client to bypass RLS
    const admin = createAdminClient();

    const { data: inserted, error } = await admin
        .from('user_context_items')
        .insert({
            user_id: user.id,
            collection_id: EXPERT_RESOURCES_COLLECTION_ID,
            type: data.type,
            title: data.title,
            content: data.content
        })
        .select()
        .single();

    if (error) {
        console.error('[createExpertResource] DB Error:', error);
        return { success: false, error: `Failed to create: ${error.message} (${error.code})` };
    }

    console.log('[createExpertResource] Success! Inserted:', inserted);

    revalidatePath('/author/resources');
    return { success: true, id: inserted.id };
}

/**
 * Update an expert resource (platform admin only)
 */
export async function updateExpertResource(id: string, updates: { title?: string; content?: any }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    // Verify user is platform admin
    const isAdmin = await isPlatformAdmin(user.id);
    if (!isAdmin) {
        return { success: false, error: 'Forbidden: Only platform admins can update expert resources' };
    }

    const admin = createAdminClient();

    const { error } = await admin
        .from('user_context_items')
        .update(updates)
        .eq('id', id)
        .eq('collection_id', EXPERT_RESOURCES_COLLECTION_ID);

    if (error) {
        console.error('[updateExpertResource] Error:', error);
        return { success: false, error: `Failed to update: ${error.message}` };
    }

    revalidatePath('/author/resources');
    return { success: true };
}

/**
 * Delete an expert resource (platform admin only)
 */
export async function deleteExpertResource(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    // Verify user is platform admin
    const isAdmin = await isPlatformAdmin(user.id);
    if (!isAdmin) {
        return { success: false, error: 'Forbidden: Only platform admins can delete expert resources' };
    }

    const admin = createAdminClient();

    const { error } = await admin
        .from('user_context_items')
        .delete()
        .eq('id', id)
        .eq('collection_id', EXPERT_RESOURCES_COLLECTION_ID);

    if (error) {
        console.error('[deleteExpertResource] Error:', error);
        return { success: false, error: 'Failed to delete resource' };
    }

    revalidatePath('/author/resources');
    return { success: true };
}

/**
 * Get all expert resources (for any expert user)
 * Uses admin client to bypass RLS
 */
export async function getExpertResources() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    // Use admin client to read all expert resources regardless of user_id
    const admin = createAdminClient();

    const { data, error } = await admin
        .from('user_context_items')
        .select('*')
        .eq('collection_id', EXPERT_RESOURCES_COLLECTION_ID)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[getExpertResources] Error:', error);
        return [];
    }

    return data || [];
}

/**
 * Create a file expert resource (platform admin only)
 * Handles file upload, parsing, and storage
 */
export async function createExpertFileResource(
    fileName: string,
    fileType: string,
    fileBuffer: ArrayBuffer
): Promise<{ success: boolean; id?: string; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    // Verify user is platform admin
    const isAdmin = await isPlatformAdmin(user.id);
    if (!isAdmin) {
        return { success: false, error: 'Forbidden: Only platform admins can create expert resources' };
    }

    try {
        // 1. Parse file content
        const parseResult = await parseFileContent(fileBuffer, fileType, fileName);
        const textContent = parseResult.success ? parseResult.text : '';

        // 2. Generate AI summary of the file content (if we have parsed text)
        let summary: string | null = null;
        if (textContent && textContent.length > 50) {
            try {
                const truncatedText = textContent.substring(0, 2500);
                const summaryPrompt = `Summarize the following document in 2-3 concise sentences for a preview card. Focus on the main topic and key points:\n\n${truncatedText}`;

                const generatedSummary = await generateQuickAIResponse(summaryPrompt, 150);
                if (generatedSummary && generatedSummary.length > 0) {
                    summary = generatedSummary;
                    console.log('[createExpertFileResource] Generated summary:', summary.substring(0, 100) + '...');
                }
            } catch (summaryError) {
                console.warn('[createExpertFileResource] Summary generation failed (non-blocking):', summaryError);
            }
        }

        // 3. Upload to storage
        const file = new File([fileBuffer], fileName, { type: fileType });
        const upload = await uploadFileToStorage(file, user.id, EXPERT_RESOURCES_COLLECTION_ID);

        // 4. Create the context item record using admin client
        const admin = createAdminClient();

        const { data: inserted, error } = await admin
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
                    url: upload.success ? upload.url : null,
                    storagePath: upload.success ? upload.path : null,
                    parsedTextLength: textContent.length,
                    parseError: parseResult.success ? null : parseResult.error,
                    summary
                }
            })
            .select()
            .single();

        if (error) {
            console.error('[createExpertFileResource] DB Error:', error);
            return { success: false, error: error.message };
        }

        console.log('[createExpertFileResource] Success! Inserted:', inserted);

        revalidatePath('/author/resources');
        return { success: true, id: inserted.id };

    } catch (error) {
        console.error('[createExpertFileResource] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'File processing failed'
        };
    }
}
