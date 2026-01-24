'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getOrgContext } from '@/lib/org-context';
import { getMuxUploadUrl, getMuxAssetId, waitForMuxAssetReady, deleteMuxAsset } from './mux';
import { revalidatePath } from 'next/cache';
import { processVideoForRAG, regenerateVideoTranscript } from '@/lib/video-transcript';
import { deleteContextEmbeddings } from '@/lib/context-embeddings';

// ============================================
// ORG VIDEO RESOURCES (Org Collection videos)
// ============================================

// Detect video platform from URL
function detectVideoPlatform(url: string): string {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    if (url.includes('wistia.com') || url.includes('fast.wistia.net')) return 'wistia';
    return 'other';
}

/**
 * Create a video resource for an org collection
 * Returns upload URL for client-side upload to Mux, OR creates directly for external URLs
 * Org admin or platform admin only
 */
export async function createOrgVideoResource(
    collectionId: string,
    title: string,
    description?: string,
    externalUrl?: string
): Promise<{ success: boolean; id?: string; uploadUrl?: string; uploadId?: string; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.error('[createOrgVideoResource] Unauthorized: No user found');
        return { success: false, error: 'Unauthorized: No user found' };
    }

    // Check org admin permissions
    const orgContext = await getOrgContext();
    if (!orgContext) {
        console.error('[createOrgVideoResource] No org context');
        return { success: false, error: 'No organization context' };
    }

    if (!orgContext.isPlatformAdmin && !orgContext.isOrgAdmin) {
        console.error('[createOrgVideoResource] Forbidden: User is not org admin');
        return { success: false, error: 'Forbidden: Only org admins can create org videos' };
    }

    // Verify the collection belongs to this org
    const admin = createAdminClient();
    const { data: collection, error: collectionError } = await admin
        .from('user_collections')
        .select('id, org_id, is_org_collection')
        .eq('id', collectionId)
        .single();

    if (collectionError || !collection) {
        console.error('[createOrgVideoResource] Collection not found:', collectionError);
        return { success: false, error: 'Collection not found' };
    }

    if (!collection.is_org_collection || collection.org_id !== orgContext.orgId) {
        console.error('[createOrgVideoResource] Collection does not belong to user org');
        return { success: false, error: 'Collection does not belong to your organization' };
    }

    try {
        // If external URL provided, create immediately with status 'ready'
        if (externalUrl) {
            const { data: inserted, error } = await admin
                .from('user_context_items')
                .insert({
                    user_id: user.id,
                    org_id: orgContext.orgId,
                    collection_id: collectionId,
                    type: 'VIDEO',
                    title,
                    content: {
                        externalUrl,
                        externalPlatform: detectVideoPlatform(externalUrl),
                        status: 'ready',
                        description: description || null,
                        isOrgOwned: true
                    },
                    created_by: user.id
                })
                .select()
                .single();

            if (error) {
                console.error('[createOrgVideoResource] DB Error:', error);
                return { success: false, error: `Failed to create: ${error.message}` };
            }

            console.log('[createOrgVideoResource] Success! Created external org video:', inserted.id);

            revalidatePath('/org/collections');
            revalidatePath(`/org/collections/${collectionId}`);

            // Fire-and-forget transcript generation for external URLs
            if (inserted.id) {
                processVideoForRAG(inserted.id, user.id, {
                    collectionId: collectionId,
                    orgId: orgContext.orgId
                }).catch(err => console.error('[createOrgVideoResource] Transcript generation failed:', err));
            }

            return {
                success: true,
                id: inserted.id
            };
        }

        // 1. Get Mux upload URL
        const { uploadUrl, uploadId } = await getMuxUploadUrl();

        // 2. Create record in user_context_items with org_id and collection_id
        const { data: inserted, error } = await admin
            .from('user_context_items')
            .insert({
                user_id: user.id, // Required for FK
                org_id: orgContext.orgId, // Link to organization
                collection_id: collectionId, // Link to org collection
                type: 'VIDEO',
                title,
                content: {
                    muxAssetId: null,
                    muxPlaybackId: null,
                    muxUploadId: uploadId,
                    duration: null,
                    status: 'uploading',
                    description: description || null,
                    isOrgOwned: true
                },
                created_by: user.id
            })
            .select()
            .single();

        if (error) {
            console.error('[createOrgVideoResource] DB Error:', error);
            return { success: false, error: `Failed to create: ${error.message}` };
        }

        console.log('[createOrgVideoResource] Success! Created org video resource:', inserted.id);

        revalidatePath('/org/collections');
        revalidatePath(`/org/collections/${collectionId}`);

        return {
            success: true,
            id: inserted.id,
            uploadUrl,
            uploadId
        };

    } catch (error) {
        console.error('[createOrgVideoResource] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create org video resource'
        };
    }
}

/**
 * Finalize org video upload after Mux processing completes
 * Org admin or platform admin only
 */
export async function finalizeOrgVideoUpload(
    itemId: string,
    uploadId: string
): Promise<{ success: boolean; playbackId?: string; duration?: number; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    // Check org admin permissions
    const orgContext = await getOrgContext();
    if (!orgContext) {
        return { success: false, error: 'No organization context' };
    }

    if (!orgContext.isPlatformAdmin && !orgContext.isOrgAdmin) {
        return { success: false, error: 'Forbidden: Only org admins can finalize org videos' };
    }

    const admin = createAdminClient();

    try {
        // Verify the video belongs to this org
        const { data: item, error: itemError } = await admin
            .from('user_context_items')
            .select('id, org_id, content')
            .eq('id', itemId)
            .single();

        if (itemError || !item) {
            return { success: false, error: 'Video not found' };
        }

        if (item.org_id !== orgContext.orgId) {
            return { success: false, error: 'Video does not belong to your organization' };
        }

        // 1. Get asset ID from upload ID
        const assetId = await getMuxAssetId(uploadId);
        if (!assetId) {
            await admin
                .from('user_context_items')
                .update({
                    content: {
                        ...item.content,
                        status: 'error'
                    }
                })
                .eq('id', itemId);

            return { success: false, error: 'Failed to get asset ID from Mux' };
        }

        // Update status to processing
        await admin
            .from('user_context_items')
            .update({
                content: {
                    ...item.content,
                    muxAssetId: assetId,
                    status: 'processing'
                }
            })
            .eq('id', itemId);

        // 2. Wait for asset to be ready
        const result = await waitForMuxAssetReady(assetId);

        if (!result.ready) {
            const { data: currentForError } = await admin
                .from('user_context_items')
                .select('content')
                .eq('id', itemId)
                .single();

            await admin
                .from('user_context_items')
                .update({
                    content: {
                        ...currentForError?.content,
                        status: 'error'
                    }
                })
                .eq('id', itemId);

            return { success: false, error: 'Video processing failed' };
        }

        // 3. Update record with playbackId, duration, status='ready'
        const { data: currentForReady } = await admin
            .from('user_context_items')
            .select('content, collection_id')
            .eq('id', itemId)
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
            .eq('id', itemId);

        if (updateError) {
            console.error('[finalizeOrgVideoUpload] Update error:', updateError);
            return { success: false, error: 'Failed to update video record' };
        }

        console.log('[finalizeOrgVideoUpload] Success! Org video ready:', itemId);

        revalidatePath('/org/collections');
        if (currentForReady?.collection_id) {
            revalidatePath(`/org/collections/${currentForReady.collection_id}`);
        }

        // Fire-and-forget transcript generation
        processVideoForRAG(itemId, user.id, {
            collectionId: currentForReady?.collection_id,
            orgId: orgContext.orgId
        }).catch(err => console.error('[finalizeOrgVideoUpload] Transcript generation failed:', err));

        return {
            success: true,
            playbackId: result.playbackId,
            duration: result.duration
        };

    } catch (error) {
        console.error('[finalizeOrgVideoUpload] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to finalize org video upload'
        };
    }
}

/**
 * Update org video metadata
 * Org admin or platform admin only
 */
export async function updateOrgVideoResource(
    id: string,
    updates: { title?: string; description?: string; externalUrl?: string }
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    // Check org admin permissions
    const orgContext = await getOrgContext();
    if (!orgContext) {
        return { success: false, error: 'No organization context' };
    }

    if (!orgContext.isPlatformAdmin && !orgContext.isOrgAdmin) {
        return { success: false, error: 'Forbidden: Only org admins can update org videos' };
    }

    const admin = createAdminClient();

    // Verify the video belongs to this org
    const { data: current, error: fetchError } = await admin
        .from('user_context_items')
        .select('content, org_id, collection_id')
        .eq('id', id)
        .single();

    if (fetchError || !current) {
        return { success: false, error: 'Video not found' };
    }

    if (current.org_id !== orgContext.orgId) {
        return { success: false, error: 'Video does not belong to your organization' };
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

    const currentContent = current.content;

    const { error } = await admin
        .from('user_context_items')
        .update(updateData)
        .eq('id', id);

    if (error) {
        console.error('[updateOrgVideoResource] Error:', error);
        return { success: false, error: `Failed to update: ${error.message}` };
    }

    // If external URL changed, regenerate transcript
    if (updates.externalUrl && updates.externalUrl !== currentContent.externalUrl) {
        regenerateVideoTranscript(id, user.id)
            .catch(err => console.error('[updateOrgVideoResource] Re-transcription failed:', err));
    }

    revalidatePath('/org/collections');
    if (current.collection_id) {
        revalidatePath(`/org/collections/${current.collection_id}`);
    }

    return { success: true };
}

/**
 * Delete org video (also deletes Mux asset)
 * Org admin or platform admin only
 */
export async function deleteOrgVideoResource(id: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    // Check org admin permissions
    const orgContext = await getOrgContext();
    if (!orgContext) {
        return { success: false, error: 'No organization context' };
    }

    if (!orgContext.isPlatformAdmin && !orgContext.isOrgAdmin) {
        return { success: false, error: 'Forbidden: Only org admins can delete org videos' };
    }

    const admin = createAdminClient();

    // 1. Get record to verify org and find Mux asset ID
    const { data: resource, error: fetchError } = await admin
        .from('user_context_items')
        .select('content, org_id, collection_id')
        .eq('id', id)
        .single();

    if (fetchError || !resource) {
        return { success: false, error: 'Video not found' };
    }

    if (resource.org_id !== orgContext.orgId) {
        return { success: false, error: 'Video does not belong to your organization' };
    }

    // 2. Clean up embeddings
    await deleteContextEmbeddings(id);

    // 3. Delete Mux asset if it exists
    const muxAssetId = resource.content?.muxAssetId;
    if (muxAssetId) {
        const deleted = await deleteMuxAsset(muxAssetId);
        if (!deleted) {
            console.warn('[deleteOrgVideoResource] Failed to delete Mux asset:', muxAssetId);
        } else {
            console.log('[deleteOrgVideoResource] Deleted Mux asset:', muxAssetId);
        }
    }

    // 4. Delete database record
    const { error } = await admin
        .from('user_context_items')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('[deleteOrgVideoResource] Error:', error);
        return { success: false, error: 'Failed to delete video resource' };
    }

    revalidatePath('/org/collections');
    if (resource.collection_id) {
        revalidatePath(`/org/collections/${resource.collection_id}`);
    }

    return { success: true };
}

/**
 * Get org video status (for polling during processing)
 * Org admin or platform admin only
 */
export async function getOrgVideoStatus(id: string): Promise<{
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

    // Check org admin permissions
    const orgContext = await getOrgContext();
    if (!orgContext) {
        return { status: 'error', error: 'No organization context' };
    }

    if (!orgContext.isPlatformAdmin && !orgContext.isOrgAdmin) {
        return { status: 'error', error: 'Forbidden' };
    }

    const admin = createAdminClient();

    const { data, error } = await admin
        .from('user_context_items')
        .select('content, org_id')
        .eq('id', id)
        .single();

    if (error || !data) {
        return { status: 'error', error: 'Video not found' };
    }

    if (data.org_id !== orgContext.orgId) {
        return { status: 'error', error: 'Video does not belong to your organization' };
    }

    return {
        status: data.content?.status || 'error',
        playbackId: data.content?.muxPlaybackId,
        duration: data.content?.duration
    };
}

/**
 * Get all videos in an org collection
 */
export async function getOrgCollectionVideos(collectionId: string): Promise<{
    success: boolean;
    videos?: Array<{
        id: string;
        title: string;
        content: any;
        created_at: string;
    }>;
    error?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    const orgContext = await getOrgContext();
    if (!orgContext) {
        return { success: false, error: 'No organization context' };
    }

    const admin = createAdminClient();

    // Verify collection belongs to org
    const { data: collection } = await admin
        .from('user_collections')
        .select('id, org_id')
        .eq('id', collectionId)
        .single();

    if (!collection || collection.org_id !== orgContext.orgId) {
        return { success: false, error: 'Collection not found or not accessible' };
    }

    // Fetch videos
    const { data: videos, error } = await admin
        .from('user_context_items')
        .select('id, title, content, created_at')
        .eq('collection_id', collectionId)
        .eq('type', 'VIDEO')
        .eq('org_id', orgContext.orgId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[getOrgCollectionVideos] Error:', error);
        return { success: false, error: 'Failed to fetch videos' };
    }

    return { success: true, videos: videos || [] };
}
