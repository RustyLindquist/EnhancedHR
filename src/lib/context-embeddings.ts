'use server';

/**
 * Context Embeddings Service
 *
 * Generates and stores embeddings for user-created context (custom text, files, profiles)
 * in the unified_embeddings table for RAG retrieval.
 *
 * This is the core of the "Object-Oriented Context Engineering" system.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { generateEmbedding } from '@/lib/ai/embedding';
import { chunkText } from '@/lib/file-parser';
import { ContextItemType } from '@/types';

// Mapping from ContextItemType to unified_embeddings source_type
const SOURCE_TYPE_MAP: Record<ContextItemType, string> = {
    'CUSTOM_CONTEXT': 'custom_context',
    'FILE': 'file',
    'PROFILE': 'profile',
    'AI_INSIGHT': 'custom_context', // Insights are treated as custom context
};

/**
 * Create embeddings for a context item
 * Handles chunking for long content
 */
export async function embedContextItem(
    userId: string,
    itemId: string,
    itemType: ContextItemType,
    content: string,
    collectionId?: string | null,
    metadata?: Record<string, any>
): Promise<{ success: boolean; embeddingCount: number; error?: string }> {
    const admin = createAdminClient();

    try {
        // Don't embed empty content
        if (!content || content.trim().length === 0) {
            return { success: true, embeddingCount: 0 };
        }

        const sourceType = SOURCE_TYPE_MAP[itemType] || 'custom_context';

        // Chunk content if it's long
        const chunks = content.length > 1200 ? chunkText(content, 1000, 200) : [content];

        // Generate and store embeddings for each chunk
        let embeddingCount = 0;

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const embedding = await generateEmbedding(chunk);

            if (!embedding || embedding.length === 0) {
                console.warn(`Failed to generate embedding for chunk ${i + 1}/${chunks.length}`);
                continue;
            }

            const { error } = await admin
                .from('unified_embeddings')
                .insert({
                    user_id: userId,
                    collection_id: collectionId || null,
                    source_type: sourceType,
                    source_id: itemId,
                    content: chunk,
                    embedding: embedding,
                    metadata: {
                        ...metadata,
                        chunk_index: i,
                        total_chunks: chunks.length,
                        item_type: itemType
                    }
                });

            if (error) {
                console.error('Error inserting embedding:', error);
                // Continue with other chunks
            } else {
                embeddingCount++;
            }
        }

        return { success: true, embeddingCount };

    } catch (error) {
        console.error('Error in embedContextItem:', error);
        return {
            success: false,
            embeddingCount: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Update embeddings when a context item is modified
 * Deletes old embeddings and creates new ones
 */
export async function updateContextEmbeddings(
    userId: string,
    itemId: string,
    itemType: ContextItemType,
    newContent: string,
    collectionId?: string | null,
    metadata?: Record<string, any>
): Promise<{ success: boolean; embeddingCount: number; error?: string }> {
    // First delete existing embeddings for this item
    await deleteContextEmbeddings(itemId);

    // Then create new embeddings
    return embedContextItem(userId, itemId, itemType, newContent, collectionId, metadata);
}

/**
 * Delete all embeddings for a context item
 */
export async function deleteContextEmbeddings(
    itemId: string
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    const admin = createAdminClient();

    try {
        const { data, error } = await admin
            .from('unified_embeddings')
            .delete()
            .eq('source_id', itemId)
            .select('id');

        if (error) {
            console.error('Error deleting embeddings:', error);
            return { success: false, deletedCount: 0, error: error.message };
        }

        return { success: true, deletedCount: data?.length || 0 };

    } catch (error) {
        console.error('Error in deleteContextEmbeddings:', error);
        return {
            success: false,
            deletedCount: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Embed profile details
 * Converts structured profile data into a searchable text format
 */
export async function embedProfileDetails(
    userId: string,
    itemId: string,
    profileContent: Record<string, any>,
    collectionId?: string | null
): Promise<{ success: boolean; embeddingCount: number; error?: string }> {
    // Convert profile fields to a rich text representation
    const profileText = formatProfileForEmbedding(profileContent);

    return embedContextItem(
        userId,
        itemId,
        'PROFILE',
        profileText,
        collectionId,
        { profileFields: Object.keys(profileContent) }
    );
}

/**
 * Format profile content into a text representation for embedding
 */
function formatProfileForEmbedding(profile: Record<string, any>): string {
    const parts: string[] = [];

    if (profile.role) {
        parts.push(`Role/Job Title: ${profile.role}`);
    }
    if (profile.yearsInRole) {
        parts.push(`Years in current role: ${profile.yearsInRole}`);
    }
    if (profile.yearsInCompany) {
        parts.push(`Years at company: ${profile.yearsInCompany}`);
    }
    if (profile.yearsInHR) {
        parts.push(`Years of HR experience: ${profile.yearsInHR}`);
    }
    if (profile.directReports) {
        parts.push(`Number of direct reports: ${profile.directReports}`);
    }
    if (profile.objectives) {
        parts.push(`Professional objectives and goals: ${profile.objectives}`);
    }
    if (profile.measuresOfSuccess) {
        parts.push(`How success is measured: ${profile.measuresOfSuccess}`);
    }
    if (profile.areasOfConcern) {
        parts.push(`Current areas of concern: ${profile.areasOfConcern}`);
    }
    if (profile.areasOfInterest) {
        parts.push(`Areas of interest: ${profile.areasOfInterest}`);
    }

    return parts.join('\n\n');
}

/**
 * Embed multiple file chunks at once
 * Used after file parsing
 */
export async function embedFileChunks(
    userId: string,
    fileId: string,
    chunks: string[],
    collectionId?: string | null,
    metadata?: Record<string, any>
): Promise<{ success: boolean; embeddingCount: number; error?: string }> {
    const admin = createAdminClient();
    let embeddingCount = 0;

    try {
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const embedding = await generateEmbedding(chunk);

            if (!embedding || embedding.length === 0) {
                console.warn(`Failed to generate embedding for file chunk ${i + 1}/${chunks.length}`);
                continue;
            }

            const { error } = await admin
                .from('unified_embeddings')
                .insert({
                    user_id: userId,
                    collection_id: collectionId || null,
                    source_type: 'file',
                    source_id: fileId,
                    content: chunk,
                    embedding: embedding,
                    metadata: {
                        ...metadata,
                        chunk_index: i,
                        total_chunks: chunks.length
                    }
                });

            if (error) {
                console.error(`Error inserting file embedding chunk ${i}:`, error);
            } else {
                embeddingCount++;
            }
        }

        return { success: true, embeddingCount };

    } catch (error) {
        console.error('Error in embedFileChunks:', error);
        return {
            success: false,
            embeddingCount: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Get embedding statistics for a user
 * Useful for debugging and monitoring
 */
export async function getEmbeddingStats(
    userId: string
): Promise<{
    total: number;
    bySourceType: Record<string, number>;
    byCollection: Record<string, number>;
}> {
    const admin = createAdminClient();

    const { data } = await admin
        .from('unified_embeddings')
        .select('source_type, collection_id')
        .eq('user_id', userId);

    const stats = {
        total: data?.length || 0,
        bySourceType: {} as Record<string, number>,
        byCollection: {} as Record<string, number>
    };

    data?.forEach(item => {
        // Count by source type
        const sourceType = item.source_type || 'unknown';
        stats.bySourceType[sourceType] = (stats.bySourceType[sourceType] || 0) + 1;

        // Count by collection
        const collectionId = item.collection_id || 'personal';
        stats.byCollection[collectionId] = (stats.byCollection[collectionId] || 0) + 1;
    });

    return stats;
}
