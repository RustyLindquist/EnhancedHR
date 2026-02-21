'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { Note } from '@/types';
import { embedNote, deleteNoteEmbeddings } from '@/lib/context-embeddings';

/**
 * Fetch all PERSONAL notes for the current user.
 * Excludes org notes (notes with org_id set).
 * This is used for "All Notes" view which should only show personal notes.
 */
export async function getNotesAction(): Promise<Note[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const admin = createAdminClient();

    const { data: notes, error } = await admin
        .from('notes')
        .select(`
            id,
            user_id,
            org_id,
            title,
            content,
            course_id,
            tool_slug,
            created_at,
            updated_at,
            courses (
                title
            )
        `)
        .eq('user_id', user.id)
        .is('org_id', null)  // Only personal notes (no org_id)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('[getNotesAction] Error fetching notes:', error);
        return [];
    }

    // Map to Note type with course_title
    return (notes || []).map((note: any) => ({
        type: 'NOTE' as const,
        id: note.id,
        user_id: note.user_id,
        title: note.title,
        content: note.content,
        course_id: note.course_id,
        tool_slug: note.tool_slug,
        course_title: note.courses?.title || null,
        created_at: note.created_at,
        updated_at: note.updated_at,
    }));
}

/**
 * Fetch general PERSONAL notes (not associated with any course)
 * Used for tool pages where notes are standalone
 * Excludes org notes.
 * @param toolSlug - Optional tool slug to filter notes by tool (e.g., 'roleplay-dojo')
 */
export async function getGeneralNotesAction(toolSlug?: string): Promise<Note[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const admin = createAdminClient();

    let query = admin
        .from('notes')
        .select(`
            id,
            user_id,
            org_id,
            title,
            content,
            course_id,
            tool_slug,
            created_at,
            updated_at
        `)
        .eq('user_id', user.id)
        .is('org_id', null)  // Only personal notes
        .is('course_id', null);

    // Filter by tool_slug if provided
    if (toolSlug) {
        query = query.eq('tool_slug', toolSlug);
    } else {
        // If no tool_slug provided, get notes that are not associated with any tool
        query = query.is('tool_slug', null);
    }

    const { data: notes, error } = await query.order('updated_at', { ascending: false });

    if (error) {
        console.error('[getGeneralNotesAction] Error fetching general notes:', error);
        return [];
    }

    return (notes || []).map((note: any) => ({
        type: 'NOTE' as const,
        id: note.id,
        user_id: note.user_id,
        title: note.title,
        content: note.content,
        course_id: null,  // General notes have no course
        tool_slug: note.tool_slug,
        course_title: undefined,  // No course title for general notes
        created_at: note.created_at,
        updated_at: note.updated_at,
    }));
}

/**
 * Fetch all PERSONAL notes for a specific course.
 * Excludes org notes.
 */
export async function getNotesByCourseAction(courseId: number): Promise<Note[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const admin = createAdminClient();

    const { data: notes, error } = await admin
        .from('notes')
        .select(`
            id,
            user_id,
            org_id,
            title,
            content,
            course_id,
            tool_slug,
            created_at,
            updated_at,
            courses (
                title
            )
        `)
        .eq('user_id', user.id)
        .is('org_id', null)  // Only personal notes
        .eq('course_id', courseId)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('[getNotesByCourseAction] Error fetching notes:', error);
        return [];
    }

    return (notes || []).map((note: any) => ({
        type: 'NOTE' as const,
        id: note.id,
        user_id: note.user_id,
        title: note.title,
        content: note.content,
        course_id: note.course_id,
        tool_slug: note.tool_slug,
        course_title: note.courses?.title || null,
        created_at: note.created_at,
        updated_at: note.updated_at,
    }));
}

/**
 * Fetch a single note by ID
 */
export async function getNoteAction(noteId: string): Promise<Note | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const admin = createAdminClient();

    const { data: note, error } = await admin
        .from('notes')
        .select(`
            id,
            user_id,
            title,
            content,
            course_id,
            tool_slug,
            created_at,
            updated_at,
            courses (
                title
            )
        `)
        .eq('id', noteId)
        .eq('user_id', user.id)
        .single();

    if (error || !note) {
        console.error('[getNoteAction] Error fetching note:', error);
        return null;
    }

    return {
        type: 'NOTE',
        id: note.id,
        user_id: note.user_id,
        title: note.title,
        content: note.content,
        course_id: note.course_id,
        tool_slug: note.tool_slug,
        course_title: (note as any).courses?.title || null,
        created_at: note.created_at,
        updated_at: note.updated_at,
    };
}

/**
 * Create a new note
 */
export async function createNoteAction(data: {
    title?: string;
    content?: string;
    course_id?: number;
    tool_slug?: string;
}): Promise<Note | null> {
    console.log('[createNoteAction] Starting with data:', data);
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    console.log('[createNoteAction] Auth result - user:', authData?.user?.id, 'error:', authError?.message);

    if (!authData?.user) {
        console.error('[createNoteAction] No user found in auth');
        return null;
    }
    const user = authData.user;

    const admin = createAdminClient();

    const { data: note, error } = await admin
        .from('notes')
        .insert({
            user_id: user.id,
            title: data.title || 'Untitled Note',
            content: data.content || '',
            course_id: data.course_id || null,
            tool_slug: data.tool_slug || null,
        })
        .select(`
            id,
            user_id,
            title,
            content,
            course_id,
            tool_slug,
            created_at,
            updated_at,
            courses (
                title
            )
        `)
        .single();

    if (error || !note) {
        console.error('[createNoteAction] Error creating note:', error);
        return null;
    }

    // Generate embedding for RAG (async, don't block)
    embedNote(user.id, note.id, note.title, note.content || '').catch(err =>
        console.warn('[createNoteAction] Embedding error:', err)
    );

    revalidatePath('/dashboard');

    return {
        type: 'NOTE',
        id: note.id,
        user_id: note.user_id,
        title: note.title,
        content: note.content,
        course_id: note.course_id,
        tool_slug: note.tool_slug,
        course_title: (note as any).courses?.title || null,
        created_at: note.created_at,
        updated_at: note.updated_at,
    };
}

/**
 * Create a new ORG note (for org collections).
 * Only org admins can create org notes.
 * The note is created with org_id set, marking it as an org note.
 */
export async function createOrgNoteAction(data: {
    title?: string;
    content?: string;
    org_id: string;
    collection_id: string; // The org collection to add the note to
}): Promise<Note | null> {
    console.log('[createOrgNoteAction] Starting with data:', data);
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (!authData?.user) {
        console.error('[createOrgNoteAction] No user found in auth');
        return null;
    }
    const user = authData.user;

    const admin = createAdminClient();

    // Verify user is org admin for this org
    const { data: profile } = await admin
        .from('profiles')
        .select('org_id, membership_status')
        .eq('id', user.id)
        .single();

    if (!profile || profile.org_id !== data.org_id) {
        console.error('[createOrgNoteAction] User not in this org');
        return null;
    }

    if (profile.membership_status !== 'org_admin' && profile.membership_status !== 'platform_admin') {
        console.error('[createOrgNoteAction] User is not an org admin');
        return null;
    }

    // Create the note with org_id set
    const { data: note, error } = await admin
        .from('notes')
        .insert({
            user_id: user.id,
            org_id: data.org_id,
            title: data.title || 'Untitled Note',
            content: data.content || '',
        })
        .select(`
            id,
            user_id,
            org_id,
            title,
            content,
            course_id,
            tool_slug,
            created_at,
            updated_at
        `)
        .single();

    if (error || !note) {
        console.error('[createOrgNoteAction] Error creating note:', error);
        return null;
    }

    // Add to the org collection
    const { error: collectionError } = await admin
        .from('collection_items')
        .insert({
            item_id: note.id,
            item_type: 'NOTE',
            collection_id: data.collection_id,
        });

    if (collectionError && collectionError.code !== '23505') {
        console.error('[createOrgNoteAction] Error adding note to collection:', collectionError);
        // Note created but not added to collection - still return note
    }

    // Generate embedding for RAG (async, don't block)
    embedNote(user.id, note.id, note.title, note.content || '', data.collection_id).catch(err =>
        console.warn('[createOrgNoteAction] Embedding error:', err)
    );

    revalidatePath('/dashboard');

    return {
        type: 'NOTE',
        id: note.id,
        user_id: note.user_id,
        title: note.title,
        content: note.content,
        course_id: null,
        tool_slug: null,
        course_title: undefined,
        created_at: note.created_at,
        updated_at: note.updated_at,
    };
}

/**
 * Fetch notes for an org collection.
 * Returns notes that are in the specified org collection.
 */
export async function getOrgCollectionNotesAction(collectionId: string): Promise<Note[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const admin = createAdminClient();

    // Get note IDs from collection_items
    const { data: items, error: itemsError } = await admin
        .from('collection_items')
        .select('item_id')
        .eq('collection_id', collectionId)
        .eq('item_type', 'NOTE');

    if (itemsError || !items || items.length === 0) {
        return [];
    }

    const noteIds = items.map(item => item.item_id);

    // Fetch the notes
    const { data: notes, error } = await admin
        .from('notes')
        .select(`
            id,
            user_id,
            org_id,
            title,
            content,
            course_id,
            tool_slug,
            created_at,
            updated_at
        `)
        .in('id', noteIds)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('[getOrgCollectionNotesAction] Error fetching notes:', error);
        return [];
    }

    return (notes || []).map((note: any) => ({
        type: 'NOTE' as const,
        id: note.id,
        user_id: note.user_id,
        title: note.title,
        content: note.content,
        course_id: note.course_id,
        tool_slug: note.tool_slug,
        course_title: undefined,
        created_at: note.created_at,
        updated_at: note.updated_at,
    }));
}

/**
 * Update a note's title and/or content
 */
export async function updateNoteAction(noteId: string, data: {
    title?: string;
    content?: string;
}): Promise<Note | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const admin = createAdminClient();

    const updateData: Record<string, any> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;

    if (Object.keys(updateData).length === 0) return null;

    const { data: note, error } = await admin
        .from('notes')
        .update(updateData)
        .eq('id', noteId)
        .eq('user_id', user.id)
        .select(`
            id,
            user_id,
            title,
            content,
            course_id,
            tool_slug,
            created_at,
            updated_at,
            courses (
                title
            )
        `)
        .single();

    if (error || !note) {
        console.error('[updateNoteAction] Error updating note:', error);
        return null;
    }

    // Re-embed with updated content (async, don't block)
    embedNote(user.id, note.id, note.title, note.content || '').catch(err =>
        console.warn('[updateNoteAction] Embedding error:', err)
    );

    return {
        type: 'NOTE',
        id: note.id,
        user_id: note.user_id,
        title: note.title,
        content: note.content,
        course_id: note.course_id,
        tool_slug: note.tool_slug,
        course_title: (note as any).courses?.title || null,
        created_at: note.created_at,
        updated_at: note.updated_at,
    };
}

/**
 * Delete a note
 */
export async function deleteNoteAction(noteId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    const admin = createAdminClient();

    // First, clean up embeddings
    await deleteNoteEmbeddings(noteId);

    // Remove from any collections
    await admin
        .from('collection_items')
        .delete()
        .eq('item_id', noteId)
        .eq('item_type', 'NOTE');

    // Then delete the note itself
    const { error } = await admin
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id);

    if (error) {
        console.error('[deleteNoteAction] Error deleting note:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
}

/**
 * Get collection IDs where a note is saved
 */
export async function getNoteCollectionsAction(noteId: string): Promise<string[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const admin = createAdminClient();

    const { data: items, error } = await admin
        .from('collection_items')
        .select('collection_id')
        .eq('item_id', noteId)
        .eq('item_type', 'NOTE');

    if (error) {
        console.error('[getNoteCollectionsAction] Error fetching note collections:', error);
        return [];
    }

    return (items || []).map((item: any) => item.collection_id);
}

/**
 * Helper to resolve collection aliases to actual collection IDs
 */
async function resolveCollectionId(collectionId: string, userId: string): Promise<string | null> {
    console.log('[resolveCollectionId] Input:', { collectionId, userId });

    const labelMap: Record<string, string> = {
        'personal-context': 'Personal Context',
        'favorites': 'Favorites',
        'research': 'Workspace',
        'to_learn': 'Watchlist'
    };

    const targetLabel = labelMap[collectionId];
    console.log('[resolveCollectionId] Target label:', targetLabel);

    if (targetLabel) {
        // Use admin client to bypass RLS
        const admin = createAdminClient();

        // Look up the actual collection ID by label (use limit(1) in case of duplicates)
        const { data, error } = await admin
            .from('user_collections')
            .select('id')
            .eq('user_id', userId)
            .eq('label', targetLabel)
            .order('created_at', { ascending: true })
            .limit(1)
            .single();

        console.log('[resolveCollectionId] Query result:', { data, error });

        if (data?.id) {
            console.log('[resolveCollectionId] Found existing collection:', data.id);
            return data.id;
        }

        // Auto-create if missing
        console.log('[resolveCollectionId] Collection not found, auto-creating...');
        let defaultColor = '#64748B';
        if (targetLabel === 'Favorites') defaultColor = '#EAB308';
        else if (targetLabel === 'Workspace') defaultColor = '#3B82F6';
        else if (targetLabel === 'Watchlist') defaultColor = '#A855F7';
        else if (targetLabel === 'Personal Context') defaultColor = '#22C55E';

        const { data: created, error: createError } = await admin
            .from('user_collections')
            .insert({
                user_id: userId,
                label: targetLabel,
                color: defaultColor,
                is_system: true,
            })
            .select('id')
            .single();

        console.log('[resolveCollectionId] Create result:', { created, createError });
        return created?.id || null;
    }

    // If not an alias, it's already a real collection ID
    console.log('[resolveCollectionId] Not an alias, returning as-is:', collectionId);
    return collectionId;
}

/**
 * Add a note to a collection
 */
export async function addNoteToCollectionAction(noteId: string, collectionId: string): Promise<{ success: boolean; error?: string }> {
    console.log('[addNoteToCollectionAction] Called with noteId:', noteId, 'collectionId:', collectionId);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    // Resolve collection alias to actual ID
    const resolvedCollectionId = await resolveCollectionId(collectionId, user.id);
    console.log('[addNoteToCollectionAction] Resolved collection ID:', resolvedCollectionId);

    if (!resolvedCollectionId) {
        console.error('[addNoteToCollectionAction] Could not resolve collection ID:', collectionId);
        return { success: false, error: 'Could not resolve collection' };
    }

    const admin = createAdminClient();

    console.log('[addNoteToCollectionAction] Inserting into collection_items:', { item_id: noteId, item_type: 'NOTE', collection_id: resolvedCollectionId });
    const { error } = await admin
        .from('collection_items')
        .insert({
            item_id: noteId,
            item_type: 'NOTE',
            collection_id: resolvedCollectionId,
        });

    if (error) {
        // Ignore duplicate key errors
        if (error.code === '23505') {
            console.log('[addNoteToCollectionAction] Note already in collection (duplicate)');
            return { success: true };
        }
        console.error('[addNoteToCollectionAction] Error adding note to collection:', error);
        return { success: false, error: error.message };
    }

    console.log('[addNoteToCollectionAction] Successfully added note to collection');
    revalidatePath('/dashboard');
    return { success: true };
}

/**
 * Remove a note from a collection
 */
export async function removeNoteFromCollectionAction(noteId: string, collectionId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    // Resolve collection alias to actual ID
    const resolvedCollectionId = await resolveCollectionId(collectionId, user.id);

    if (!resolvedCollectionId) {
        console.error('[removeNoteFromCollectionAction] Could not resolve collection ID:', collectionId);
        return { success: false, error: 'Could not resolve collection' };
    }

    const admin = createAdminClient();

    const { error } = await admin
        .from('collection_items')
        .delete()
        .eq('item_id', noteId)
        .eq('item_type', 'NOTE')
        .eq('collection_id', resolvedCollectionId);

    if (error) {
        console.error('[removeNoteFromCollectionAction] Error removing note from collection:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
}

/**
 * Get the count of notes for the current user
 */
export async function getNotesCountAction(): Promise<number> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return 0;

    const admin = createAdminClient();

    const { count, error } = await admin
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    if (error) {
        console.error('[getNotesCountAction] Error counting notes:', error);
        return 0;
    }

    return count || 0;
}
