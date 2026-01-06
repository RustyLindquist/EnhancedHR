import { createClient } from '@/lib/supabase/client';
import { ContextScope, ContextItem } from './types';

const supabase = createClient();

export async function getContextForScope(scope: ContextScope, query?: string): Promise<ContextItem[]> {
    const contextItems: ContextItem[] = [];

    try {
        // 1. Generate Embedding if needed (skip for Help collection which uses text matching)
        let queryEmbedding: number[] = [];
        const shouldEmbedQuery = !!query && (
            (scope.type === 'COURSE' && !!scope.id) ||
            scope.type === 'PLATFORM' ||
            (scope.type === 'COLLECTION' && !!scope.id && scope.id !== 'help')
        );
        if (shouldEmbedQuery) {
            const { generateEmbedding } = await import('./embedding');
            queryEmbedding = await generateEmbedding(query!);
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
            let handledCollectionScope = false;

            // Special-case: Help Collection uses help_topics (not collection_items)
            if (scope.id === 'help') {
                const { data: topics, error } = await supabase
                    .from('help_topics')
                    .select('slug, title, summary, content_text, display_order')
                    .eq('is_active', true)
                    .order('display_order', { ascending: true });

                if (!error && topics && topics.length > 0) {
                    // Add a lightweight index so the agent can reference available help topics
                    const indexLines = topics.map((t: any) => `- ${t.title} (${t.slug})`);
                    contextItems.push({
                        id: 'help_topics_index',
                        type: 'HELP_INDEX',
                        content: `Available Help Topics:\n${indexLines.join('\n')}`
                    });

                    // Basic keyword scoring for retrieval
                    const q = (query || '').toLowerCase();
                    const terms = Array.from(new Set(
                        q
                            .split(/[^a-z0-9]+/g)
                            .map(t => t.trim())
                            .filter(t => t.length >= 3)
                    ));

                    const scored = topics.map((t: any) => {
                        const title = (t.title || '').toLowerCase();
                        const slug = (t.slug || '').toLowerCase();
                        const summary = (t.summary || '').toLowerCase();
                        const content = (t.content_text || '').toLowerCase();
                        const haystack = `${title}\n${summary}\n${content}`;

                        let score = 0;
                        for (const term of terms) {
                            if (slug.includes(term)) score += 5;
                            if (title.includes(term)) score += 4;
                            if (summary.includes(term)) score += 2;
                            if (haystack.includes(term)) score += 1;
                        }

                        // Always prefer core orientation topics slightly
                        if (t.slug === 'help-collection') score += 2;
                        if (t.slug === 'getting-started') score += 1;

                        return { ...t, score };
                    });

                    scored.sort((a: any, b: any) => {
                        if (b.score !== a.score) return b.score - a.score;
                        return (a.display_order || 0) - (b.display_order || 0);
                    });

                    const alwaysInclude = new Set(['help-collection', 'getting-started']);
                    const selected: any[] = [];
                    for (const t of scored) {
                        if (selected.length >= 5) break;
                        if (t.score <= 0 && terms.length > 0) continue;
                        selected.push(t);
                    }

                    // Ensure anchors are present
                    for (const slug of alwaysInclude) {
                        const found = scored.find((t: any) => t.slug === slug);
                        if (found && !selected.some(s => s.slug === slug)) {
                            selected.unshift(found);
                        }
                    }

                    const MAX_TOPIC_CHARS = 1800;
                    selected.slice(0, 6).forEach((t: any) => {
                        const raw = t.content_text || '';
                        const trimmed = raw.length > MAX_TOPIC_CHARS ? `${raw.slice(0, MAX_TOPIC_CHARS)}…` : raw;
                        contextItems.push({
                            id: t.slug,
                            type: 'HELP_TOPIC',
                            content: `Help Topic: ${t.title} (${t.slug})\n\n${trimmed}`
                        });
                    });
                }

                handledCollectionScope = true;
            }

            if (!handledCollectionScope) {
                // Fetch items from collection_items
                const { data: items } = await supabase
                    .from('collection_items')
                    .select('item_type, item_id')
                    .eq('collection_id', scope.id);

                if (items) {
                    const courseIds = items.filter(i => i.item_type === 'COURSE').map(i => i.item_id);

                    // For Collection, we want to search across these courses.
                    // Since match_course_embeddings only takes one ID, we'll do a Global Search
                    // and then filter in code (suboptimal but works without schema change).
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
