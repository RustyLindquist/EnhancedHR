import { createClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

export interface RAGScope {
    isGlobalAcademy?: boolean;
    allowedCourseIds?: number[];
    allowedItemIds?: string[]; // Source IDs (unified_embeddings.source_id)
    includeProfiles?: boolean;
    userId?: string;
    isAllConversations?: boolean;
}

export interface PageContext {
    type: 'COLLECTION' | 'COURSE' | 'PAGE';
    id?: string;
    collectionId?: string; // Legacy support
}

export class ContextResolver {
    
    /**
     * Resolves the RAG Scope for a given user context.
     * Determines what content the AI is allowed to see.
     */
    static async resolve(userId: string, context: PageContext): Promise<RAGScope> {
        const supabase = await createClient();

        // 1. Academy Scope (Global)
        if (context.collectionId === 'academy' || context.id === 'academy') {
            return { isGlobalAcademy: true };
        }

        // 2. Specific Course Scope
        // If the user is on a specific Course page (not just collection), 
        // we might want to Scope to THAT course. 
        // BUT, the prompt usually implies "Collection Assistant". 
        // If context.type is COURSE, we probably limit to that course.
        if (context.type === 'COURSE' && context.id) {
            return { allowedCourseIds: [parseInt(context.id)] };
        }

        // 3. Conversations Collection
        if (context.collectionId === 'conversations' || context.collectionId === 'conversations-collection') {
            return { isAllConversations: true };
        }

        // 4. Custom / Personal Collections
        // We need to fetch the items in this collection to know what to Scope to.
        if (context.collectionId || (context.type === 'COLLECTION' && context.id)) {
            const collectionId = context.collectionId || context.id!;
            
            // Special "Implicit" Collections
            if (collectionId === 'favorites') {
                return await this.resolveFavorites(supabase, userId);
            }
            if (collectionId === 'watchlist') {
                return await this.resolveWatchlist(supabase, userId);
            }
            if (collectionId === 'workspace') {
                 // Workspace might be a real DB collection or an implicit one.
                 // For now assuming it matches a standard collection resolution.
            }

            // Standard Custom Collection
            return await this.resolveCustomCollection(supabase, userId, collectionId);
        }

        // Fallback: Default to Global Academy if no specific scope found? 
        // Or specific empty scope? 
        // "AI panels... should always be specific to the context...".
        // If on Dashboard, maybe Global?
        return { isGlobalAcademy: true }; 
    }

    // --- Specific Resolvers ---

    private static async resolveCustomCollection(supabase: SupabaseClient, userId: string, collectionId: string): Promise<RAGScope> {
        const scope: RAGScope = {
            allowedCourseIds: [],
            allowedItemIds: []
        };

        // Fetch User Context Items for this Collection
        const { data: items } = await supabase
            .from('user_context_items')
            .select('id, type, content, title') // We might need source_id if we stored it?
            // Wait, user_context_items stores the *references*.
            // We need to know what they refer to.
            // Current schema: content is JSONB.
            // We need to inspect how items are stored.
            .eq('user_id', userId)
            .eq('collection_id', collectionId);

        if (!items) return scope;

        for (const item of items) {
             // Logic to extract IDs from the content jsonb
             // Expected content shape: { courseId: 123 } or { fileId: '...' }
             if (item.type === 'COURSE' || (item.content as any).courseId) {
                 const cid = (item.content as any).courseId;
                 if (cid) scope.allowedCourseIds?.push(cid);
             }
             else if (item.type === 'LESSON' || (item.content as any).lessonId) {
                 // If embedding source_type is 'lesson', source_id is lessonId
                 const lid = (item.content as any).lessonId;
                 // But wait, lessons are also covered if their COURSE is in scope? 
                 // If I add just a lesson, I probably only want that lesson.
                 // Our unified_embeddings for lessons are linked to course_id.
                 // Filtering by lesson_id is harder unless we index it.
                 // For MVP, if a Lesson is added, maybe we add the whole course? 
                 // Or we rely on source_id matching.
                 // Let's assume unified_embeddings.source_id stores lessonId.
                 if (lid) scope.allowedItemIds?.push(lid.toString());
             }
             else if (item.type === 'FILE' || item.type === 'CUSTOM_CONTEXT') {
                  // The item itself IS the source. 
                  // So the unified_embeddings.source_id should match this context item's ID?
                  // Or the file ID?
                  // If content is { fileId: '...' }, we use that.
                  // If it's a raw Text context, maybe the item.id is the source_id?
                  // Let's assume item.id is the source_id for simple text notes.
                  // For now, let's push item.id
                  // Note: Migration needs to ensure this linkage.
                  scope.allowedItemIds?.push(item.id || (item.content as any).id);
             }
        }
        
        return scope;
    }

    private static async resolveFavorites(supabase: SupabaseClient, userId: string): Promise<RAGScope> {
         // Mock logic for favorites
         // Fetch favorites table
         return { allowedCourseIds: [1, 2] }; // Placeholder
    }

    private static async resolveWatchlist(supabase: SupabaseClient, userId: string): Promise<RAGScope> {
         // Mock logic
         return { allowedCourseIds: [3] }; 
    }
}
