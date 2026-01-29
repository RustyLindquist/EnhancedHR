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
import { generateEmbedding, generateFileEmbedding } from '@/lib/ai/embedding';
import { chunkText } from '@/lib/file-parser';
import { ContextItemType } from '@/types';

/**
 * Check if a string is a valid UUID
 * Required because unified_embeddings.collection_id is UUID type,
 * but some collections use string IDs (e.g., 'expert-resources')
 */
function isValidUUID(str: string | null | undefined): boolean {
    if (!str) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

/**
 * Sanitize collection_id for database insertion
 * Returns null for non-UUID collection IDs (like 'expert-resources')
 * The embeddings will still be findable via source_id matching
 */
function sanitizeCollectionId(collectionId: string | null | undefined): string | null {
    if (!collectionId || !isValidUUID(collectionId)) {
        return null;
    }
    return collectionId;
}

// Mapping from ContextItemType to unified_embeddings source_type
const SOURCE_TYPE_MAP: Record<ContextItemType, string> = {
    'CUSTOM_CONTEXT': 'custom_context',
    'FILE': 'file',
    'PROFILE': 'profile',
    'AI_INSIGHT': 'custom_context', // Insights are treated as custom context
    'VIDEO': 'video', // Video resources with AI-generated transcripts
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
                    collection_id: sanitizeCollectionId(collectionId),
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
            // Use file-specific embedding model from ai_prompt_library
            const embedding = await generateFileEmbedding(chunk);

            if (!embedding || embedding.length === 0) {
                console.warn(`Failed to generate embedding for file chunk ${i + 1}/${chunks.length}`);
                continue;
            }

            const { error } = await admin
                .from('unified_embeddings')
                .insert({
                    user_id: userId,
                    collection_id: sanitizeCollectionId(collectionId),
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

// ============================================
// Video Context Embeddings
// ============================================

/**
 * Create embeddings for a video context item
 * Uses title + description + transcript as combined content
 */
export async function embedVideoContext(
    userId: string,
    videoId: string,
    title: string,
    description: string | undefined,
    transcript: string,
    collectionId?: string | null,
    orgId?: string | null
): Promise<{ success: boolean; embeddingCount: number; error?: string }> {
    const admin = createAdminClient();

    try {
        // Build combined context
        const parts: string[] = [];
        parts.push(`Video Title: ${title}`);
        if (description) {
            parts.push(`\nDescription: ${description}`);
        }
        if (transcript) {
            parts.push(`\nTranscript:\n${transcript}`);
        }
        const combinedContent = parts.join('\n');

        // Don't embed empty content
        if (!combinedContent || combinedContent.trim().length === 0) {
            return { success: true, embeddingCount: 0 };
        }

        // Chunk content if it's long (transcripts can be very long)
        const chunks = combinedContent.length > 1200 ? chunkText(combinedContent, 1000, 200) : [combinedContent];

        // Generate and store embeddings for each chunk
        let embeddingCount = 0;

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const embedding = await generateEmbedding(chunk);

            if (!embedding || embedding.length === 0) {
                console.warn(`[embedVideoContext] Failed to generate embedding for chunk ${i + 1}/${chunks.length}`);
                continue;
            }

            const { error } = await admin
                .from('unified_embeddings')
                .insert({
                    user_id: userId,
                    collection_id: sanitizeCollectionId(collectionId),
                    org_id: orgId || null,
                    source_type: 'video',
                    source_id: videoId,
                    content: chunk,
                    embedding: embedding,
                    metadata: {
                        title: title,
                        hasTranscript: !!transcript,
                        transcriptLength: transcript?.length || 0,
                        chunk_index: i,
                        total_chunks: chunks.length,
                        item_type: 'VIDEO'
                    }
                });

            if (error) {
                console.error(`[embedVideoContext] Error inserting embedding for chunk ${i}:`, error);
                // Continue with other chunks
            } else {
                embeddingCount++;
            }
        }

        console.log(`[embedVideoContext] Created ${embeddingCount} embeddings for video "${title}" (${videoId})`);
        return { success: true, embeddingCount };

    } catch (error) {
        console.error('[embedVideoContext] Error:', error);
        return {
            success: false,
            embeddingCount: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Embed a platform course lesson for RAG retrieval
 * Creates embeddings linked to the course (not a user) for Course Assistant/Tutor access
 *
 * CRITICAL: Sets course_id so RAG queries can find this content
 * This is for PLATFORM courses (promoted from local dev), NOT org courses.
 */
export async function embedPlatformLessonContent(
    lessonId: string,
    courseId: number,
    title: string,
    description: string | undefined,
    transcript: string,
    moduleTitle?: string
): Promise<{ success: boolean; embeddingCount: number; error?: string }> {
    const admin = createAdminClient();

    try {
        // Build combined context (same pattern as embedVideoContext)
        const parts: string[] = [];
        if (moduleTitle) {
            parts.push(`Module: ${moduleTitle}`);
        }
        parts.push(`Lesson: ${title}`);
        if (description) {
            parts.push(`Description: ${description}`);
        }
        if (transcript) {
            parts.push(`Transcript:\n${transcript}`);
        }
        const combinedContent = parts.join('\n\n');

        if (!combinedContent || combinedContent.trim().length === 0) {
            return { success: true, embeddingCount: 0 };
        }

        // Chunk long content
        const chunks = combinedContent.length > 1200
            ? chunkText(combinedContent, 1000, 200)
            : [combinedContent];

        let embeddingCount = 0;

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const embedding = await generateEmbedding(chunk);

            if (!embedding || embedding.length === 0) {
                console.warn(`[embedPlatformLessonContent] Failed embedding chunk ${i + 1}/${chunks.length}`);
                continue;
            }

            const { error } = await admin
                .from('unified_embeddings')
                .insert({
                    user_id: null,           // CRITICAL: null, not empty string
                    course_id: courseId,     // CRITICAL: enables RAG discovery
                    collection_id: null,
                    org_id: null,            // Platform courses, not org-specific
                    source_type: 'lesson',   // CRITICAL: correct type for course content
                    source_id: lessonId,
                    content: chunk,
                    embedding: embedding,
                    metadata: {
                        lesson_title: title,
                        module_title: moduleTitle || null,
                        has_transcript: !!transcript,
                        transcript_length: transcript?.length || 0,
                        chunk_index: i,
                        total_chunks: chunks.length
                    }
                });

            if (error) {
                console.error(`[embedPlatformLessonContent] Insert error:`, error);
            } else {
                embeddingCount++;
            }
        }

        console.log(`[embedPlatformLessonContent] Created ${embeddingCount} embeddings for "${title}" (course ${courseId})`);
        return { success: true, embeddingCount };

    } catch (error) {
        console.error('[embedPlatformLessonContent] Error:', error);
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

// ============================================
// Course Resource Embeddings
// ============================================

/**
 * Embed a course resource for RAG retrieval
 * Creates embeddings linked to the course (not a user) for Course Assistant/Tutor access
 *
 * For file resources (PDF, DOC): Attempts to fetch and parse content
 * For links/images: Embeds title and URL as searchable context
 */
export async function embedCourseResource(
    resourceId: string,
    courseId: number,
    title: string,
    resourceType: 'PDF' | 'DOC' | 'XLS' | 'IMG' | 'LINK',
    url: string,
    fileContent?: string // Optional: pre-parsed content for file resources
): Promise<{ success: boolean; embeddingCount: number; error?: string }> {
    const admin = createAdminClient();

    try {
        let contentToEmbed = '';

        // If file content is provided (e.g., from parsing), use it
        if (fileContent && fileContent.trim().length > 0) {
            contentToEmbed = `Course Resource: ${title}\n\n${fileContent}`;
        } else {
            // Create a descriptive context for the resource
            // This ensures the resource is findable even without parsed content
            const typeDescriptions: Record<string, string> = {
                'PDF': 'PDF document',
                'DOC': 'Word document',
                'XLS': 'Excel spreadsheet',
                'IMG': 'Image file',
                'LINK': 'External link or web resource'
            };

            contentToEmbed = `Course Resource: ${title}\nType: ${typeDescriptions[resourceType] || resourceType}\nURL: ${url}`;
        }

        // Chunk if content is long (mainly for parsed file content)
        const chunks = contentToEmbed.length > 1200
            ? chunkText(contentToEmbed, 1000, 200)
            : [contentToEmbed];

        let embeddingCount = 0;

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const embedding = await generateFileEmbedding(chunk);

            if (!embedding || embedding.length === 0) {
                console.warn(`[embedCourseResource] Failed to generate embedding for chunk ${i + 1}/${chunks.length}`);
                continue;
            }

            const { error } = await admin
                .from('unified_embeddings')
                .insert({
                    user_id: null, // Course resources are not user-specific
                    course_id: courseId,
                    collection_id: null,
                    source_type: 'resource',
                    source_id: resourceId,
                    content: chunk,
                    embedding: embedding,
                    metadata: {
                        resource_title: title,
                        resource_type: resourceType,
                        resource_url: url,
                        chunk_index: i,
                        total_chunks: chunks.length,
                        has_parsed_content: !!fileContent
                    }
                });

            if (error) {
                console.error(`[embedCourseResource] Error inserting embedding:`, error);
            } else {
                embeddingCount++;
            }
        }

        console.log(`[embedCourseResource] Created ${embeddingCount} embeddings for resource "${title}" (${resourceId})`);
        return { success: true, embeddingCount };

    } catch (error) {
        console.error('[embedCourseResource] Error:', error);
        return {
            success: false,
            embeddingCount: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Delete all embeddings for a course resource
 */
export async function deleteCourseResourceEmbeddings(
    resourceId: string
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    const admin = createAdminClient();

    try {
        const { data, error } = await admin
            .from('unified_embeddings')
            .delete()
            .eq('source_id', resourceId)
            .eq('source_type', 'resource')
            .select('id');

        if (error) {
            console.error('[deleteCourseResourceEmbeddings] Error:', error);
            return { success: false, deletedCount: 0, error: error.message };
        }

        console.log(`[deleteCourseResourceEmbeddings] Deleted ${data?.length || 0} embeddings for resource ${resourceId}`);
        return { success: true, deletedCount: data?.length || 0 };

    } catch (error) {
        console.error('[deleteCourseResourceEmbeddings] Error:', error);
        return {
            success: false,
            deletedCount: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Embed all resources for a course
 * Useful for batch processing or re-indexing
 */
export async function embedAllCourseResources(
    courseId: number
): Promise<{ success: boolean; resourceCount: number; embeddingCount: number; errors: string[] }> {
    const admin = createAdminClient();
    const errors: string[] = [];
    let totalEmbeddings = 0;

    try {
        // Fetch all resources for the course
        const { data: resources, error } = await admin
            .from('resources')
            .select('id, title, type, url')
            .eq('course_id', courseId);

        if (error) {
            return { success: false, resourceCount: 0, embeddingCount: 0, errors: [error.message] };
        }

        if (!resources || resources.length === 0) {
            return { success: true, resourceCount: 0, embeddingCount: 0, errors: [] };
        }

        // Process each resource
        for (const resource of resources) {
            const result = await embedCourseResource(
                resource.id,
                courseId,
                resource.title,
                resource.type as 'PDF' | 'DOC' | 'XLS' | 'IMG' | 'LINK',
                resource.url
            );

            if (result.success) {
                totalEmbeddings += result.embeddingCount;
            } else if (result.error) {
                errors.push(`Resource "${resource.title}": ${result.error}`);
            }
        }

        console.log(`[embedAllCourseResources] Processed ${resources.length} resources, created ${totalEmbeddings} embeddings`);
        return {
            success: errors.length === 0,
            resourceCount: resources.length,
            embeddingCount: totalEmbeddings,
            errors
        };

    } catch (error) {
        console.error('[embedAllCourseResources] Error:', error);
        return {
            success: false,
            resourceCount: 0,
            embeddingCount: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error']
        };
    }
}
