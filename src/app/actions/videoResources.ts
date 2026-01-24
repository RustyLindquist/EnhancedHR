'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getMuxUploadUrl, getMuxAssetId, getMuxAssetDetails, waitForMuxAssetReady, deleteMuxAsset } from './mux';
import { revalidatePath } from 'next/cache';

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

// ============================================
// USER VIDEO RESOURCES (Personal Collections)
// ============================================

// Detect video platform from URL
function detectVideoPlatform(url: string): string {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    if (url.includes('wistia.com') || url.includes('fast.wistia.net')) return 'wistia';
    return 'other';
}

/**
 * Create a video resource for user collections
 * Returns upload URL for client-side upload to Mux, OR creates directly for external URLs
 */
export async function createVideoResource(data: {
    title: string;
    description?: string;
    collectionId?: string;
    externalUrl?: string;
}): Promise<{ success: boolean; id?: string; uploadUrl?: string; uploadId?: string; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.error('[createVideoResource] Unauthorized: No user found');
        return { success: false, error: 'Unauthorized: No user found' };
    }

    try {
        // If external URL provided, create immediately with status 'ready'
        if (data.externalUrl) {
            const { data: inserted, error } = await supabase
                .from('user_context_items')
                .insert({
                    user_id: user.id,
                    collection_id: data.collectionId || null,
                    type: 'VIDEO',
                    title: data.title,
                    content: {
                        externalUrl: data.externalUrl,
                        externalPlatform: detectVideoPlatform(data.externalUrl),
                        status: 'ready',
                        description: data.description || null
                    }
                })
                .select()
                .single();

            if (error) {
                console.error('[createVideoResource] DB Error:', error);
                return { success: false, error: `Failed to create: ${error.message}` };
            }

            console.log('[createVideoResource] Success! Created external video resource:', inserted.id);
            revalidatePath('/dashboard');

            return {
                success: true,
                id: inserted.id
            };
        }

        // 1. Get Mux upload URL
        const { uploadUrl, uploadId } = await getMuxUploadUrl();

        // 2. Create record in user_context_items with type='VIDEO', status='uploading'
        const { data: inserted, error } = await supabase
            .from('user_context_items')
            .insert({
                user_id: user.id,
                collection_id: data.collectionId || null,
                type: 'VIDEO',
                title: data.title,
                content: {
                    muxAssetId: null,
                    muxPlaybackId: null,
                    muxUploadId: uploadId,
                    duration: null,
                    status: 'uploading',
                    description: data.description || null
                }
            })
            .select()
            .single();

        if (error) {
            console.error('[createVideoResource] DB Error:', error);
            return { success: false, error: `Failed to create: ${error.message}` };
        }

        console.log('[createVideoResource] Success! Created video resource:', inserted.id);

        return {
            success: true,
            id: inserted.id,
            uploadUrl,
            uploadId
        };

    } catch (error) {
        console.error('[createVideoResource] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create video resource'
        };
    }
}

/**
 * Finalize video upload after Mux processing completes
 * Called after client uploads to Mux
 */
export async function finalizeVideoUpload(
    itemId: string,
    uploadId: string
): Promise<{ success: boolean; playbackId?: string; duration?: number; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // 1. Get asset ID from upload ID
        const assetId = await getMuxAssetId(uploadId);
        if (!assetId) {
            // Update status to error
            await supabase
                .from('user_context_items')
                .update({
                    content: {
                        status: 'error'
                    }
                })
                .eq('id', itemId)
                .eq('user_id', user.id);

            return { success: false, error: 'Failed to get asset ID from Mux' };
        }

        // Fetch current content to merge
        const { data: current } = await supabase
            .from('user_context_items')
            .select('content')
            .eq('id', itemId)
            .eq('user_id', user.id)
            .single();

        await supabase
            .from('user_context_items')
            .update({
                content: {
                    ...current?.content,
                    muxAssetId: assetId,
                    status: 'processing'
                }
            })
            .eq('id', itemId)
            .eq('user_id', user.id);

        // 2. Wait for asset to be ready
        const result = await waitForMuxAssetReady(assetId);

        if (!result.ready) {
            // Fetch current content again for merge
            const { data: currentForError } = await supabase
                .from('user_context_items')
                .select('content')
                .eq('id', itemId)
                .eq('user_id', user.id)
                .single();

            await supabase
                .from('user_context_items')
                .update({
                    content: {
                        ...currentForError?.content,
                        status: 'error'
                    }
                })
                .eq('id', itemId)
                .eq('user_id', user.id);

            return { success: false, error: 'Video processing failed' };
        }

        // 3. Update record with playbackId, duration, status='ready'
        const { data: currentForReady } = await supabase
            .from('user_context_items')
            .select('content')
            .eq('id', itemId)
            .eq('user_id', user.id)
            .single();

        const { error: updateError } = await supabase
            .from('user_context_items')
            .update({
                content: {
                    ...currentForReady?.content,
                    muxAssetId: assetId,
                    muxPlaybackId: result.playbackId,
                    duration: result.duration,
                    status: 'ready'
                }
            })
            .eq('id', itemId)
            .eq('user_id', user.id);

        if (updateError) {
            console.error('[finalizeVideoUpload] Update error:', updateError);
            return { success: false, error: 'Failed to update video record' };
        }

        console.log('[finalizeVideoUpload] Success! Video ready:', itemId);

        revalidatePath('/dashboard');
        revalidatePath('/academy');

        return {
            success: true,
            playbackId: result.playbackId,
            duration: result.duration
        };

    } catch (error) {
        console.error('[finalizeVideoUpload] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to finalize video upload'
        };
    }
}

/**
 * Update video metadata
 */
export async function updateVideoResource(
    id: string,
    updates: { title?: string; description?: string; externalUrl?: string }
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    // Fetch current content
    const { data: current } = await supabase
        .from('user_context_items')
        .select('content')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (!current) {
        return { success: false, error: 'Video not found' };
    }

    const updateData: any = {};
    if (updates.title) {
        updateData.title = updates.title;
    }

    // Handle content updates (description and/or externalUrl)
    if (updates.description !== undefined || updates.externalUrl !== undefined) {
        updateData.content = { ...current.content };

        if (updates.description !== undefined) {
            updateData.content.description = updates.description;
        }

        if (updates.externalUrl !== undefined) {
            updateData.content.externalUrl = updates.externalUrl;
            updateData.content.externalPlatform = detectVideoPlatform(updates.externalUrl);
        }
    }

    const { error } = await supabase
        .from('user_context_items')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('[updateVideoResource] Error:', error);
        return { success: false, error: `Failed to update: ${error.message}` };
    }

    revalidatePath('/dashboard');
    return { success: true };
}

/**
 * Delete video (also deletes Mux asset)
 */
export async function deleteVideoResource(id: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    // 1. Get record to find Mux asset ID
    const { data: resource } = await supabase
        .from('user_context_items')
        .select('content')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (!resource) {
        return { success: false, error: 'Video not found' };
    }

    // 2. Delete Mux asset if it exists
    const muxAssetId = resource.content?.muxAssetId;
    if (muxAssetId) {
        const deleted = await deleteMuxAsset(muxAssetId);
        if (!deleted) {
            console.warn('[deleteVideoResource] Failed to delete Mux asset:', muxAssetId);
            // Continue with DB deletion even if Mux deletion fails
        } else {
            console.log('[deleteVideoResource] Deleted Mux asset:', muxAssetId);
        }
    }

    // 3. Delete database record
    const { error } = await supabase
        .from('user_context_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('[deleteVideoResource] Error:', error);
        return { success: false, error: 'Failed to delete video resource' };
    }

    revalidatePath('/dashboard');
    return { success: true };
}

/**
 * Get video status (for polling during processing)
 */
export async function getVideoStatus(id: string): Promise<{
    status: 'uploading' | 'processing' | 'ready' | 'error';
    playbackId?: string;
    duration?: number;
    error?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { status: 'error', error: 'Unauthorized' };
    }

    const { data, error } = await supabase
        .from('user_context_items')
        .select('content')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (error || !data) {
        return { status: 'error', error: 'Video not found' };
    }

    return {
        status: data.content?.status || 'error',
        playbackId: data.content?.muxPlaybackId,
        duration: data.content?.duration
    };
}

// ============================================
// EXPERT RESOURCES (Platform-owned videos)
// ============================================

/**
 * Create video for Expert Resources (platform-owned)
 * Platform admin only
 */
export async function createExpertVideoResource(
    title: string,
    description?: string,
    externalUrl?: string
): Promise<{ success: boolean; id?: string; uploadUrl?: string; uploadId?: string; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.error('[createExpertVideoResource] Unauthorized: No user found');
        return { success: false, error: 'Unauthorized: No user found' };
    }

    // Check isPlatformAdmin
    const isAdmin = await isPlatformAdmin(user.id);
    if (!isAdmin) {
        console.error('[createExpertVideoResource] Forbidden: User is not platform admin');
        return { success: false, error: 'Forbidden: Only platform admins can create expert resources' };
    }

    try {
        // 2. Use admin client to bypass RLS
        const admin = createAdminClient();

        // If external URL provided, create immediately with status 'ready'
        if (externalUrl) {
            const { data: inserted, error } = await admin
                .from('user_context_items')
                .insert({
                    user_id: user.id,
                    collection_id: EXPERT_RESOURCES_COLLECTION_ID,
                    type: 'VIDEO',
                    title,
                    content: {
                        externalUrl,
                        externalPlatform: detectVideoPlatform(externalUrl),
                        status: 'ready',
                        description: description || null,
                        isPlatformOwned: true
                    },
                    created_by: user.id
                })
                .select()
                .single();

            if (error) {
                console.error('[createExpertVideoResource] DB Error:', error);
                return { success: false, error: `Failed to create: ${error.message}` };
            }

            console.log('[createExpertVideoResource] Success! Created external expert video:', inserted.id);
            revalidatePath('/author/resources');

            return {
                success: true,
                id: inserted.id
            };
        }

        // 1. Get Mux upload URL
        const { uploadUrl, uploadId } = await getMuxUploadUrl();

        // 3. Create record with collection_id='expert-resources'
        const { data: inserted, error } = await admin
            .from('user_context_items')
            .insert({
                user_id: user.id, // Required for FK, but resource is platform-owned
                collection_id: EXPERT_RESOURCES_COLLECTION_ID,
                type: 'VIDEO',
                title,
                content: {
                    muxAssetId: null,
                    muxPlaybackId: null,
                    muxUploadId: uploadId,
                    duration: null,
                    status: 'uploading',
                    description: description || null,
                    isPlatformOwned: true
                },
                created_by: user.id // Audit trail: who created this resource
            })
            .select()
            .single();

        if (error) {
            console.error('[createExpertVideoResource] DB Error:', error);
            return { success: false, error: `Failed to create: ${error.message}` };
        }

        console.log('[createExpertVideoResource] Success! Created expert video resource:', inserted.id);

        revalidatePath('/author/resources');
        return {
            success: true,
            id: inserted.id,
            uploadUrl,
            uploadId
        };

    } catch (error) {
        console.error('[createExpertVideoResource] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create expert video resource'
        };
    }
}

/**
 * Finalize Expert Resources video upload
 * Platform admin only
 */
export async function finalizeExpertVideoUpload(
    itemId: string,
    uploadId: string
): Promise<{ success: boolean; playbackId?: string; duration?: number; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    // Check isPlatformAdmin
    const isAdmin = await isPlatformAdmin(user.id);
    if (!isAdmin) {
        return { success: false, error: 'Forbidden: Only platform admins can finalize expert resources' };
    }

    const admin = createAdminClient();

    try {
        // 1. Get asset ID from upload ID
        const assetId = await getMuxAssetId(uploadId);
        if (!assetId) {
            // Update status to error
            const { data: current } = await admin
                .from('user_context_items')
                .select('content')
                .eq('id', itemId)
                .eq('collection_id', EXPERT_RESOURCES_COLLECTION_ID)
                .single();

            await admin
                .from('user_context_items')
                .update({
                    content: {
                        ...current?.content,
                        status: 'error'
                    }
                })
                .eq('id', itemId)
                .eq('collection_id', EXPERT_RESOURCES_COLLECTION_ID);

            return { success: false, error: 'Failed to get asset ID from Mux' };
        }

        // Fetch current content to merge
        const { data: current } = await admin
            .from('user_context_items')
            .select('content')
            .eq('id', itemId)
            .eq('collection_id', EXPERT_RESOURCES_COLLECTION_ID)
            .single();

        // Update status to processing
        await admin
            .from('user_context_items')
            .update({
                content: {
                    ...current?.content,
                    muxAssetId: assetId,
                    status: 'processing'
                }
            })
            .eq('id', itemId)
            .eq('collection_id', EXPERT_RESOURCES_COLLECTION_ID);

        // 2. Wait for asset to be ready
        const result = await waitForMuxAssetReady(assetId);

        if (!result.ready) {
            const { data: currentForError } = await admin
                .from('user_context_items')
                .select('content')
                .eq('id', itemId)
                .eq('collection_id', EXPERT_RESOURCES_COLLECTION_ID)
                .single();

            await admin
                .from('user_context_items')
                .update({
                    content: {
                        ...currentForError?.content,
                        status: 'error'
                    }
                })
                .eq('id', itemId)
                .eq('collection_id', EXPERT_RESOURCES_COLLECTION_ID);

            return { success: false, error: 'Video processing failed' };
        }

        // 3. Update record with playbackId, duration, status='ready'
        const { data: currentForReady } = await admin
            .from('user_context_items')
            .select('content')
            .eq('id', itemId)
            .eq('collection_id', EXPERT_RESOURCES_COLLECTION_ID)
            .single();

        const { error: updateError } = await admin
            .from('user_context_items')
            .update({
                content: {
                    ...currentForReady?.content,
                    muxAssetId: assetId,
                    muxPlaybackId: result.playbackId,
                    duration: result.duration,
                    status: 'ready'
                }
            })
            .eq('id', itemId)
            .eq('collection_id', EXPERT_RESOURCES_COLLECTION_ID);

        if (updateError) {
            console.error('[finalizeExpertVideoUpload] Update error:', updateError);
            return { success: false, error: 'Failed to update video record' };
        }

        console.log('[finalizeExpertVideoUpload] Success! Expert video ready:', itemId);

        revalidatePath('/author/resources');

        return {
            success: true,
            playbackId: result.playbackId,
            duration: result.duration
        };

    } catch (error) {
        console.error('[finalizeExpertVideoUpload] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to finalize expert video upload'
        };
    }
}

/**
 * Update Expert Resources video metadata
 * Platform admin only
 */
export async function updateExpertVideoResource(
    id: string,
    updates: { title?: string; description?: string; externalUrl?: string }
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    // Check isPlatformAdmin
    const isAdmin = await isPlatformAdmin(user.id);
    if (!isAdmin) {
        return { success: false, error: 'Forbidden: Only platform admins can update expert resources' };
    }

    const admin = createAdminClient();

    // Fetch current content
    const { data: current } = await admin
        .from('user_context_items')
        .select('content')
        .eq('id', id)
        .eq('collection_id', EXPERT_RESOURCES_COLLECTION_ID)
        .single();

    if (!current) {
        return { success: false, error: 'Video not found' };
    }

    const updateData: any = {};
    if (updates.title) {
        updateData.title = updates.title;
    }

    // Handle content updates (description and/or externalUrl)
    if (updates.description !== undefined || updates.externalUrl !== undefined) {
        updateData.content = { ...current.content };

        if (updates.description !== undefined) {
            updateData.content.description = updates.description;
        }

        if (updates.externalUrl !== undefined) {
            updateData.content.externalUrl = updates.externalUrl;
            updateData.content.externalPlatform = detectVideoPlatform(updates.externalUrl);
        }
    }

    const { error } = await admin
        .from('user_context_items')
        .update(updateData)
        .eq('id', id)
        .eq('collection_id', EXPERT_RESOURCES_COLLECTION_ID);

    if (error) {
        console.error('[updateExpertVideoResource] Error:', error);
        return { success: false, error: `Failed to update: ${error.message}` };
    }

    revalidatePath('/author/resources');
    return { success: true };
}

/**
 * Delete Expert Resources video (also deletes Mux asset)
 * Platform admin only
 */
export async function deleteExpertVideoResource(id: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    // Check isPlatformAdmin
    const isAdmin = await isPlatformAdmin(user.id);
    if (!isAdmin) {
        return { success: false, error: 'Forbidden: Only platform admins can delete expert resources' };
    }

    const admin = createAdminClient();

    // 1. Get record to find Mux asset ID
    const { data: resource } = await admin
        .from('user_context_items')
        .select('content')
        .eq('id', id)
        .eq('collection_id', EXPERT_RESOURCES_COLLECTION_ID)
        .single();

    if (!resource) {
        return { success: false, error: 'Video not found' };
    }

    // 2. Delete Mux asset if it exists
    const muxAssetId = resource.content?.muxAssetId;
    if (muxAssetId) {
        const deleted = await deleteMuxAsset(muxAssetId);
        if (!deleted) {
            console.warn('[deleteExpertVideoResource] Failed to delete Mux asset:', muxAssetId);
            // Continue with DB deletion even if Mux deletion fails
        } else {
            console.log('[deleteExpertVideoResource] Deleted Mux asset:', muxAssetId);
        }
    }

    // 3. Delete database record
    const { error } = await admin
        .from('user_context_items')
        .delete()
        .eq('id', id)
        .eq('collection_id', EXPERT_RESOURCES_COLLECTION_ID);

    if (error) {
        console.error('[deleteExpertVideoResource] Error:', error);
        return { success: false, error: 'Failed to delete video resource' };
    }

    revalidatePath('/author/resources');
    return { success: true };
}

/**
 * Get Expert Resources video status (for polling during processing)
 * Platform admin only
 */
export async function getExpertVideoStatus(id: string): Promise<{
    status: 'uploading' | 'processing' | 'ready' | 'error';
    playbackId?: string;
    duration?: number;
    error?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { status: 'error', error: 'Unauthorized' };
    }

    // Check isPlatformAdmin
    const isAdmin = await isPlatformAdmin(user.id);
    if (!isAdmin) {
        return { status: 'error', error: 'Forbidden: Only platform admins can view expert resources' };
    }

    const admin = createAdminClient();

    const { data, error } = await admin
        .from('user_context_items')
        .select('content')
        .eq('id', id)
        .eq('collection_id', EXPERT_RESOURCES_COLLECTION_ID)
        .single();

    if (error || !data) {
        return { status: 'error', error: 'Video not found' };
    }

    return {
        status: data.content?.status || 'error',
        playbackId: data.content?.muxPlaybackId,
        duration: data.content?.duration
    };
}
