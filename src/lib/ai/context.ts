import { createClient } from '@/lib/supabase/client';
import { ContextScope, ContextItem } from './types';

const supabase = createClient();

export async function getContextForScope(scope: ContextScope, query?: string): Promise<ContextItem[]> {
    const contextItems: ContextItem[] = [];

    try {
        // 1. Generate Embedding if query exists
        let queryEmbedding: number[] = [];
        if (query) {
            const { generateEmbedding } = await import('./embedding');
            queryEmbedding = await generateEmbedding(query);
        }

        if (scope.type === 'COURSE' && scope.id) {
            // 1. Fetch Course Details (Always useful)
            const { data: course } = await supabase
                .from('courses')
                .select('title, description, author')
                .eq('id', scope.id)
                .single();
            
            if (course) {
                contextItems.push({
                    id: scope.id,
                    type: 'COURSE_META',
                    content: `Course Title: ${course.title}\nDescription: ${course.description}\nAuthor: ${course.author}`
                });
            }

            // 2. Vector Search (RAG)
            if (queryEmbedding.length > 0) {
                const { data: chunks, error } = await supabase.rpc('match_course_embeddings', {
                    query_embedding: queryEmbedding,
                    match_threshold: 0.7,
                    match_count: 5,
                    filter_course_id: parseInt(scope.id)
                });

                if (chunks) {
                    chunks.forEach((chunk: any) => {
                        contextItems.push({
                            id: chunk.id,
                            type: 'RAG_CONTENT',
                            content: chunk.content,
                            similarity: chunk.similarity
                        });
                    });
                }
            } else {
                // Fallback: If no query (initial load), maybe just list modules?
                // Do NOT load full transcripts.
                const { data: modules } = await supabase
                    .from('modules')
                    .select('title')
                    .eq('course_id', scope.id);
                
                if (modules) {
                    contextItems.push({
                        id: 'outline',
                        type: 'COURSE_OUTLINE',
                        content: `Modules: ${modules.map(m => m.title).join(', ')}`
                    });
                }
            }

        } else if (scope.type === 'COLLECTION' && scope.id) {
            // Fetch items from collection_items
            const { data: items } = await supabase
                .from('collection_items')
                .select('item_type, item_id')
                .eq('collection_id', scope.id);

            if (items) {
                const courseIds = items.filter(i => i.item_type === 'COURSE').map(i => i.item_id);
                
                // For Collection, we want to search across these courses.
                // Since match_course_embeddings only takes one ID, we'll do a Global Search 
                // and then filter in code (suboptimal but works without schema change)
                // OR just do Global Search and assume relevance sorts it out.
                // Let's do Global Search if query exists.
                
                if (queryEmbedding.length > 0) {
                     const { data: chunks } = await supabase.rpc('match_course_embeddings', {
                        query_embedding: queryEmbedding,
                        match_threshold: 0.5,
                        match_count: 7, // Slightly more for collections
                        filter_course_id: null // Global search
                    });

                    if (chunks) {
                        // Filter to only items in this collection (if they are courses)
                        // This assumes chunks have course_id.
                        const relevantChunks = chunks.filter((c: any) => courseIds.includes(c.course_id.toString()));
                        
                        relevantChunks.forEach((chunk: any) => {
                            contextItems.push({
                                id: chunk.id,
                                type: 'RAG_CONTENT',
                                content: chunk.content,
                                similarity: chunk.similarity
                            });
                        });
                    }
                }
            }
        } else if (scope.type === 'PLATFORM') {
            // Global Context
            contextItems.push({
                id: 'platform_global',
                type: 'PLATFORM',
                content: 'EnhancedHR is a platform for HR professionals to learn and earn credits. It features AI-powered courses and tools.'
            });

            // Global Vector Search
            if (queryEmbedding.length > 0) {
                const { data: chunks } = await supabase.rpc('match_course_embeddings', {
                    query_embedding: queryEmbedding,
                    match_threshold: 0.5,
                    match_count: 5,
                    filter_course_id: null // Global search
                });

                if (chunks) {
                    chunks.forEach((chunk: any) => {
                        contextItems.push({
                            id: chunk.id,
                            type: 'RAG_CONTENT',
                            content: chunk.content,
                            similarity: chunk.similarity
                        });
                    });
                }
            }
        }

        // User Context (Always append if userId is present)
        if (scope.userId) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, role, org_id, ai_insights')
                .eq('id', scope.userId)
                .single();
            
            if (profile) {
                contextItems.push({
                    id: scope.userId,
                    type: 'USER_PROFILE',
                    content: `User: ${profile.full_name}\nRole: ${profile.role}\nOrganization ID: ${profile.org_id}`
                });

                // Add AI Insights if available
                if (profile.ai_insights && Array.isArray(profile.ai_insights) && profile.ai_insights.length > 0) {
                    contextItems.push({
                        id: `${scope.userId}_insights`,
                        type: 'USER_INSIGHTS',
                        content: `Known User Context:\n- ${profile.ai_insights.join('\n- ')}`
                    });
                }
            }
        }

    } catch (error) {
        console.error('Error fetching context:', error);
    }

    return contextItems;
}
