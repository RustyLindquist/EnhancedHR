'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { ContextItemType } from '@/types';
import {
    embedContextItem,
    embedProfileDetails,
    updateContextEmbeddings,
    deleteContextEmbeddings,
    embedFileChunks
} from '@/lib/context-embeddings';
import { parseFileContent, chunkText, uploadFileToStorage } from '@/lib/file-parser';

interface CreateContextItemDTO {
    collection_id?: string | null; // null for Global
    type: ContextItemType;
    title: string;
    content: any;
}

/**
 * Extract text content from different item types for embedding
 */
function extractTextForEmbedding(type: ContextItemType, content: any, title: string): string {
    switch (type) {
        case 'CUSTOM_CONTEXT':
            return `${title}\n\n${content?.text || ''}`;
        case 'AI_INSIGHT':
            return `Insight: ${title}\n${content?.insight || content?.text || ''}`;
        case 'PROFILE':
            // Profile is handled separately by embedProfileDetails
            return '';
        case 'FILE':
            // Files are embedded separately after parsing
            return '';
        default:
            return typeof content === 'string' ? content : JSON.stringify(content);
    }
}

export async function createContextItem(data: CreateContextItemDTO) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.error('[createContextItem] Unauthorized: No user found');
        return { success: false, error: 'Unauthorized: No user found' };
    }

    const resolvedCollectionId = await resolveCollectionId(supabase, data.collection_id, user.id);

    console.log('[createContextItem] Request:', {
        userId: user.id,
        inputCollectionId: data.collection_id,
        resolvedCollectionId: resolvedCollectionId,
        type: data.type,
        title: data.title
    });

    const { data: inserted, error } = await supabase
        .from('user_context_items')
        .insert({
            user_id: user.id,
            collection_id: resolvedCollectionId,
            type: data.type,
            title: data.title,
            content: data.content
        })
        .select() // Select to confirm insert
        .single();

    if (error) {
        console.error('[createContextItem] DB Error:', error);
        return { success: false, error: `Failed to create: ${error.message} (${error.code})` };
    }

    console.log('[createContextItem] Success! Inserted:', inserted);

    // Generate embeddings for RAG
    try {
        if (data.type === 'PROFILE') {
            // Profile gets special handling
            await embedProfileDetails(
                user.id,
                inserted.id,
                data.content,
                resolvedCollectionId
            );
            console.log('[createContextItem] Profile embeddings created');
        } else if (data.type !== 'FILE') {
            // Custom context and AI insights get embedded
            const textToEmbed = extractTextForEmbedding(data.type, data.content, data.title);
            if (textToEmbed) {
                const result = await embedContextItem(
                    user.id,
                    inserted.id,
                    data.type,
                    textToEmbed,
                    resolvedCollectionId,
                    { title: data.title }
                );
                console.log('[createContextItem] Embeddings created:', result.embeddingCount);
            }
        }
        // FILE type embeddings are handled by createFileContextItem
    } catch (embeddingError) {
        // Log but don't fail the creation - embeddings can be regenerated
        console.error('[createContextItem] Embedding generation failed:', embeddingError);
    }

    revalidatePath('/dashboard');
    revalidatePath('/academy');
    return { success: true, id: inserted.id };
}

/**
 * Create a file context item with full parsing and embedding
 */
export async function createFileContextItem(
    collectionId: string | null,
    fileName: string,
    fileType: string,
    fileBuffer: ArrayBuffer
): Promise<{ success: boolean; id?: string; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    const resolvedCollectionId = await resolveCollectionId(supabase, collectionId, user.id);

    try {
        // 1. Parse file content
        const parseResult = await parseFileContent(fileBuffer, fileType, fileName);
        const textContent = parseResult.success ? parseResult.text : '';

        // 2. Upload to storage
        const file = new File([fileBuffer], fileName, { type: fileType });
        const upload = await uploadFileToStorage(file, user.id, resolvedCollectionId || undefined);

        // 3. Create the context item record
        const { data: inserted, error } = await supabase
            .from('user_context_items')
            .insert({
                user_id: user.id,
                collection_id: resolvedCollectionId,
                type: 'FILE',
                title: fileName,
                content: {
                    fileName,
                    fileType,
                    fileSize: fileBuffer.byteLength,
                    url: upload.success ? upload.url : null,
                    storagePath: upload.success ? upload.path : null,
                    parsedTextLength: textContent.length,
                    parseError: parseResult.success ? null : parseResult.error
                }
            })
            .select()
            .single();

        if (error) {
            console.error('[createFileContextItem] DB Error:', error);
            return { success: false, error: error.message };
        }

        // 4. Generate embeddings from parsed content
        if (textContent && textContent.length > 0) {
            const chunks = chunkText(textContent, 1000, 200);
            const embeddingResult = await embedFileChunks(
                user.id,
                inserted.id,
                chunks,
                resolvedCollectionId,
                { fileName, fileType }
            );
            console.log(`[createFileContextItem] Created ${embeddingResult.embeddingCount} embeddings for file`);
        }

        revalidatePath('/dashboard');
        revalidatePath('/academy');

        return { success: true, id: inserted.id };

    } catch (error) {
        console.error('[createFileContextItem] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'File processing failed'
        };
    }
}

export async function updateContextItem(id: string, updates: { title?: string; content?: any }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    // First fetch the existing item to know its type
    const { data: existing } = await supabase
        .from('user_context_items')
        .select('type, collection_id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    const { error } = await supabase
        .from('user_context_items')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error updating context item:', error);
        return { success: false, error: `Failed to update: ${error.message}` };
    }

    // Re-generate embeddings if content was updated
    if (updates.content && existing) {
        try {
            const newText = extractTextForEmbedding(
                existing.type,
                updates.content,
                updates.title || ''
            );

            if (newText) {
                await updateContextEmbeddings(
                    user.id,
                    id,
                    existing.type,
                    newText,
                    existing.collection_id,
                    { title: updates.title }
                );
                console.log('[updateContextItem] Embeddings updated');
            }
        } catch (embeddingError) {
            console.error('[updateContextItem] Embedding update failed:', embeddingError);
        }
    }

    revalidatePath('/dashboard');
    return { success: true };
}

export async function deleteContextItem(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    // Delete associated embeddings first
    try {
        await deleteContextEmbeddings(id);
        console.log('[deleteContextItem] Embeddings deleted');
    } catch (embeddingError) {
        console.error('[deleteContextItem] Error deleting embeddings:', embeddingError);
    }

    const { error } = await supabase
        .from('user_context_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deleting context item:', error);
        return { success: false, error: 'Failed to delete context item' };
    }

    revalidatePath('/dashboard');
    return { success: true };
}

export async function getContextItems(collectionId?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    let query = supabase
        .from('user_context_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    // Filter by collection ID
    const targetId = await resolveCollectionId(supabase, collectionId, user.id);
    
    if (targetId) {
        query = query.eq('collection_id', targetId);
    } else {
        // Only if truly meant to be global/null (which we aren't using for Personal Context anymore technically, 
        // but let's keep it robust)
        query = query.is('collection_id', null);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching context items:', error);
        return [];
    }

    return data;
}

// Fetch GLOBAL items specifically (for AI injection)
export async function getGlobalContextItems() {
    return getContextItems('personal-context');
}
// Helper to resolve "personal-context" and other default IDs to real DB ID
async function resolveCollectionId(supabase: any, collectionId: string | undefined | null, userId: string): Promise<string | null> {
    if (!collectionId) return null;

    const labelMap: Record<string, string> = {
        'personal-context': 'Personal Context',
        'favorites': 'Favorites',
        'research': 'Workspace',
        'to_learn': 'Watchlist'
    };

    const targetLabel = labelMap[collectionId];

    if (targetLabel) {
        console.log(`[resolveCollectionId] Resolving target: ${targetLabel} for user: ${userId}`);
        const { data, error } = await supabase
            .from('user_collections')
            .select('id')
            .eq('user_id', userId)
            .eq('user_id', userId)
            .eq('label', targetLabel)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (data?.id) {
            return data.id;
        }

        // Auto-create if missing (to match client behavior and ensure per-collection persistence)
        console.log(`[resolveCollectionId] Collection '${targetLabel}' missing. Auto-creating.`);
        
        let defaultColor = '#64748B'; // Slate
        if (targetLabel === 'Favorites') defaultColor = '#EAB308'; // Yellow
        else if (targetLabel === 'Workspace') defaultColor = '#3B82F6'; // Blue
        else if (targetLabel === 'Watchlist') defaultColor = '#A855F7'; // Purple

        const { data: newData, error: createError } = await supabase
            .from('user_collections')
            .insert({
                user_id: userId,
                label: targetLabel,
                color: defaultColor
            })
            .select('id')
            .single();
        
        if (createError) {
            console.error(`[resolveCollectionId] Failed to auto-create '${targetLabel}':`, createError);
            // Fallback to null (global) if create fails, or throw? 
            // Better to return null than crash, but items will be orphaned from collection view.
            return null;
        }

        return newData.id;
    }

    // Is it a UUID? (Custom Collection)
    return collectionId;
}

export async function getCollectionDetailsAction(collectionIdOrAlias: string) {
    const supabase = await createClient(); // Auth client for user verification
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { courses: [], contextItems: [] };

    // Resolve ID using standard client (safe)
    const resolvedId = await resolveCollectionId(supabase, collectionIdOrAlias, user.id);
    if (!resolvedId) return { courses: [], contextItems: [] };

    const admin = createAdminClient(); // Service Role client

    // Helper to separate IDs by type
    interface GroupedIds {
        courses: number[];
        modules: string[];
        lessons: string[];
        conversations: string[];
        notes: string[];
        itemsWithoutType: any[];
    }

    // 1. Fetch ALL collection items (references)
    const { data: rawItems } = await admin
        .from('collection_items')
        .select('*')
        .eq('collection_id', resolvedId);

    const grouped: GroupedIds = {
        courses: [],
        modules: [],
        lessons: [],
        conversations: [],
        notes: [],
        itemsWithoutType: []
    };

    // Sort into buckets
    rawItems?.forEach((item: any) => {
        if (item.course_id) {
            grouped.courses.push(item.course_id);
        } else if (item.item_type === 'MODULE') {
            grouped.modules.push(item.item_id);
        } else if (item.item_type === 'LESSON') {
            grouped.lessons.push(item.item_id);
        } else if (item.item_type === 'CONVERSATION') {
            grouped.conversations.push(item.item_id);
        } else if (item.item_type === 'NOTE') {
            grouped.notes.push(item.item_id);
        } else {
            grouped.itemsWithoutType.push(item);
        }
    });

    // 2. Parallel Fetch Details
    const promises: any[] = [];

    // A. Courses
    if (grouped.courses.length > 0) {
        promises.push(
            admin.from('courses').select('*').in('id', grouped.courses)
                .then(({ data }) => data?.map((c: any) => ({
                    ...c,
                    type: 'COURSE',     // Used by modal and save handlers
                    itemType: 'COURSE', // Legacy - kept for backwards compatibility
                    isSaved: true,
                    image: c.image_url // Map DB column to frontend prop
                })) || [])
        );
    } else {
        promises.push(Promise.resolve([]));
    }

    // B. Modules (Join Course for Image/Authors)
    if (grouped.modules.length > 0) {
        promises.push(
            admin.from('modules')
                .select(`
                    *,
                    courses (
                        title,
                        image_url,
                        author
                    )
                `)
                .in('id', grouped.modules)
                .then(({ data }) => data?.map((m: any) => ({
                    ...m,
                    type: 'MODULE',
                    itemType: 'MODULE',
                    // Enrich with Course Data if missing on Module
                    image: m.courses?.image_url,
                    courseTitle: m.courses?.title,
                    author: m.courses?.author
                })) || [])
        );
    } else {
        promises.push(Promise.resolve([]));
    }

    // C. Lessons (Join Module -> Course)
    if (grouped.lessons.length > 0) {
        promises.push(
            admin.from('lessons')
                .select(`
                    *,
                    modules (
                        id,
                        title,
                        course_id,
                        courses (
                            id,
                            title,
                            image_url,
                            author
                        )
                    )
                `)
                .in('id', grouped.lessons)
                .then(({ data }) => data?.map((l: any) => ({
                    ...l,
                    type: 'LESSON',
                    itemType: 'LESSON',
                    moduleTitle: l.modules?.title,
                    courseTitle: l.modules?.courses?.title,
                    course_id: l.modules?.course_id,
                    image: l.modules?.courses?.image_url,
                    author: l.modules?.courses?.author
                })) || [])
        );
    } else {
        promises.push(Promise.resolve([]));
    }

    // D. Conversations
    if (grouped.conversations.length > 0) {
        promises.push(
            admin.from('conversations')
                .select('*')
                .in('id', grouped.conversations)
                .then(({ data }) => data?.map((cov: any) => ({
                    ...cov,
                    type: 'CONVERSATION',
                    itemType: 'CONVERSATION',
                    title: cov.title || 'Untitled Conversation',
                    // Map last message or similar if needed for card
                    lastMessage: cov.last_message || cov.preview || ''
                })) || [])
        );
    } else {
        promises.push(Promise.resolve([]));
    }

    // E. Notes
    if (grouped.notes.length > 0) {
        promises.push(
            admin.from('notes')
                .select(`
                    id,
                    user_id,
                    title,
                    content,
                    course_id,
                    created_at,
                    updated_at,
                    courses (
                        title
                    )
                `)
                .in('id', grouped.notes)
                .then(({ data }) => data?.map((note: any) => ({
                    id: note.id,
                    user_id: note.user_id,
                    title: note.title || 'Untitled Note',
                    content: note.content,
                    course_id: note.course_id,
                    course_title: note.courses?.title || null,
                    created_at: note.created_at,
                    updated_at: note.updated_at,
                    itemType: 'NOTE',
                    type: 'NOTE'
                })) || [])
        );
    } else {
        promises.push(Promise.resolve([]));
    }

    // F. Context Items (Already fetched but logic should be here or separate?
    // The original code fetched them separately. We can keep that or merge.
    // Let's keep fetching them separately as they are in a different table 'user_context_items'
    // BUT we need to return them in the 'contextItems' prop or merge into 'courses' (which is actually 'items').
    // The frontend hook `useCollections` merges them: `items: [...courses, ...mappedContext]`.
    // So distinct is fine.

    // Execute fetches
    const [courses, modules, lessons, conversations, notes] = await Promise.all(promises);

    // 3. Fetch Context Items (Same as before)
    const { data: contextItems } = await admin
        .from('user_context_items')
        .select('*')
        .eq('collection_id', resolvedId)
        .order('created_at', { ascending: false });

    // Combine "Courses" (which is actually 'Standard Items') and strictly typed ContextItems
    // The frontend expects 'courses' to be the array of standard items (Courses, Modules, Lessons, Convos, Notes)
    // and 'contextItems' to be the user_context_items table rows.

    const allStandardItems = [
        ...courses,
        ...modules,
        ...lessons,
        ...conversations,
        ...notes
    ];

    return {
        courses: allStandardItems,
        contextItems: contextItems || [],
        debug: { resolvedId, groupedCounts: {
            courses: grouped.courses.length,
            modules: grouped.modules.length,
            lessons: grouped.lessons.length,
            conversations: grouped.conversations.length,
            notes: grouped.notes.length
        }}
    };
}
