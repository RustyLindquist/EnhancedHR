import { createClient } from '@/lib/supabase/client';
import { ContextScope, ContextItem } from './types';

const supabase = createClient();

export async function getContextForScope(scope: ContextScope, query?: string): Promise<ContextItem[]> {
    const contextItems: ContextItem[] = [];

    try {
        if (scope.type === 'COURSE' && scope.id) {
            // 1. Fetch Course Details
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

            // 2. Fetch Lessons (Text Content)
            // Note: In a real scenario, we'd use vector search here if query is present
            // For now, we'll fetch high-level lesson outlines
            const { data: modules } = await supabase
                .from('modules')
                .select('id, title, lessons(id, title, content)')
                .eq('course_id', scope.id);

            if (modules) {
                modules.forEach(mod => {
                    mod.lessons.forEach((lesson: any) => {
                        contextItems.push({
                            id: lesson.id,
                            type: 'LESSON',
                            content: `Lesson: ${lesson.title}\nModule: ${mod.title}\nContent: ${lesson.content ? lesson.content.substring(0, 500) + '...' : 'No transcript available.'}`
                        });
                    });
                });
            }

        } else if (scope.type === 'COLLECTION' && scope.id) {
            // Fetch items from collection_items
            const { data: items } = await supabase
                .from('collection_items')
                .select('item_type, item_id')
                .eq('collection_id', scope.id);

            if (items) {
                // This is where polymorphism shines. We'd ideally fetch details for each item.
                // For MVP, we'll just list them or fetch course details if it's a course.
                for (const item of items) {
                    if (item.item_type === 'COURSE') {
                         const { data: c } = await supabase.from('courses').select('title, description').eq('id', item.item_id).single();
                         if (c) {
                             contextItems.push({
                                 id: item.item_id,
                                 type: 'COURSE',
                                 content: `Collection Item (Course): ${c.title} - ${c.description}`
                             });
                         }
                    }
                    // Add handlers for other types (LESSON, RESOURCE) here
                }
            }
        } else if (scope.type === 'PLATFORM') {
            // Global Context - maybe fetch top categories or recent trends
            contextItems.push({
                id: 'platform_global',
                type: 'PLATFORM',
                content: 'EnhancedHR is a platform for HR professionals to learn and earn credits. It features AI-powered courses and tools.'
            });
        }

        // User Context (Always append if userId is present)
        if (scope.userId) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, role, org_id')
                .eq('id', scope.userId)
                .single();
            
            if (profile) {
                contextItems.push({
                    id: scope.userId,
                    type: 'USER_PROFILE',
                    content: `User: ${profile.full_name}\nRole: ${profile.role}\nOrganization ID: ${profile.org_id}`
                });
            }
        }

    } catch (error) {
        console.error('Error fetching context:', error);
    }

    return contextItems;
}
