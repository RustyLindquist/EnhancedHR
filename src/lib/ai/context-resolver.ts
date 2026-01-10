import { createClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * RAGScope defines what content the AI can access via vector search.
 *
 * Object-Oriented Context Engineering Scope Types:
 * 1. Global Academy - All course content (for general browsing)
 * 2. Platform Scope - All courses + ALL user's custom context (for Platform Assistant)
 * 3. Course Scope - Specific course(s) + Personal Context (for Course Assistant/Tutor)
 * 4. Collection Scope - Items in collection + Personal Context (for Collection Assistant)
 * 5. Personal Context - User's global context (always included unless explicitly excluded)
 */
export interface RAGScope {
    // Scope type flags
    isGlobalAcademy?: boolean;        // All course content
    isPlatformScope?: boolean;        // All courses + all user context (Platform Assistant)

    // Specific content filters
    allowedCourseIds?: number[];      // Specific courses to search
    collectionId?: string;            // Specific collection to search
    allowedItemIds?: string[];        // Specific item IDs (source_id in unified_embeddings)

    // User context settings
    userId?: string;                  // Required for personal context features
    includePersonalContext?: boolean; // Include global personal context (default: true)
    includeAllUserContext?: boolean;  // Include ALL user context across all collections

    // Legacy/special
    isAllConversations?: boolean;

    // User data context (for org admin views)
    includeUserDataContext?: boolean;
    userDataScopeId?: string; // 'all-users' or group ID
}

export interface PageContext {
    type: 'COLLECTION' | 'COURSE' | 'PAGE' | 'PLATFORM' | 'DASHBOARD' | 'USER';
    id?: string;
    collectionId?: string;
    agentType?: string;
}

// Map of collection aliases to their database labels
const COLLECTION_ALIAS_MAP: Record<string, string> = {
    'personal-context': 'Personal Context',
    'favorites': 'Favorites',
    'research': 'Workspace',
    'to_learn': 'Watchlist',
    'workspace': 'Workspace',
    'watchlist': 'Watchlist'
};

export class ContextResolver {

    /**
     * Resolves the RAG Scope for a given user context.
     * Determines what content the AI is allowed to see.
     *
     * CRITICAL: Personal Context is ALWAYS included unless explicitly excluded.
     * This ensures the AI knows about the user in every conversation.
     */
    static async resolve(userId: string, context: PageContext): Promise<RAGScope> {
        const supabase = await createClient();

        // Base scope - always include user ID and personal context
        const baseScope: RAGScope = {
            userId,
            includePersonalContext: true  // Personal context always included
        };

        // 1. Platform/Dashboard Scope (Platform Assistant)
        // Searches ALL courses + ALL user's custom context from all collections
        if (
            context.type === 'PLATFORM' ||
            context.type === 'DASHBOARD' ||
            context.id === 'dashboard' ||
            context.agentType === 'platform_assistant'
        ) {
            return {
                ...baseScope,
                isPlatformScope: true,
                includeAllUserContext: true
            };
        }

        // 2. Academy Scope (browsing all courses)
        if (context.collectionId === 'academy' || context.id === 'academy') {
            return {
                ...baseScope,
                isGlobalAcademy: true
            };
        }

        // 3. Course Scope (Course Assistant/Tutor)
        // Searches specific course + personal context
        if (context.type === 'COURSE' && context.id) {
            return {
                ...baseScope,
                allowedCourseIds: [parseInt(context.id)]
            };
        }

        // 4. Conversations Collection (special handling)
        if (context.collectionId === 'conversations' || context.collectionId === 'conversations-collection') {
            return {
                ...baseScope,
                isAllConversations: true
            };
        }

        // 5. Personal Context Collection
        // When viewing personal context, include ALL user context
        if (context.collectionId === 'personal-context' || context.id === 'personal-context') {
            return {
                ...baseScope,
                includeAllUserContext: true
            };
        }

        // 5.5 User/Group Scope (Team Analytics)
        // For viewing team member data in Users/Groups collections
        if (context.type === 'USER' && context.id) {
            return {
                ...baseScope,
                isPlatformScope: true,  // Allow searching all content for general questions
                includeUserDataContext: true,
                userDataScopeId: context.id  // 'all-users' or group ID
            };
        }

        // 5.6 Assigned Learning Scope
        // For viewing assigned content - includes all courses/modules/lessons assigned to user
        if (context.collectionId === 'assigned-learning' || context.id === 'assigned-learning') {
            const assignedCourseIds = await this.getAssignedCourseIds(supabase, userId);

            return {
                ...baseScope,
                allowedCourseIds: assignedCourseIds.length > 0 ? assignedCourseIds : undefined,
                // If no assigned courses, fall back to personal context only
                // Personal context already included via baseScope
            };
        }

        // 6. Named Collections (Favorites, Workspace, Watchlist, Custom)
        if (context.collectionId || (context.type === 'COLLECTION' && context.id)) {
            const collectionId = context.collectionId || context.id!;

            // Resolve collection alias to actual ID if needed
            const resolvedCollectionId = await this.resolveCollectionId(supabase, userId, collectionId);

            if (resolvedCollectionId) {
                // For collections, search:
                // 1. Custom context added TO this collection
                // 2. Courses/content added to this collection
                // 3. Personal context (always)
                return await this.resolveCollectionScope(supabase, userId, resolvedCollectionId, baseScope);
            }
        }

        // 7. Fallback: Platform-wide scope (be generous with context)
        return {
            ...baseScope,
            isPlatformScope: true
        };
    }

    /**
     * Resolve collection alias (e.g., 'favorites') to actual UUID
     */
    private static async resolveCollectionId(
        supabase: SupabaseClient,
        userId: string,
        collectionIdOrAlias: string
    ): Promise<string | null> {
        // Check if it's an alias
        const label = COLLECTION_ALIAS_MAP[collectionIdOrAlias];

        if (label) {
            const { data } = await supabase
                .from('user_collections')
                .select('id')
                .eq('user_id', userId)
                .eq('label', label)
                .maybeSingle();

            return data?.id || null;
        }

        // Assume it's already a UUID
        return collectionIdOrAlias;
    }

    /**
     * Build scope for a specific collection.
     * Includes: collection's custom context + courses in collection + personal context
     */
    private static async resolveCollectionScope(
        supabase: SupabaseClient,
        userId: string,
        collectionId: string,
        baseScope: RAGScope
    ): Promise<RAGScope> {
        const scope: RAGScope = {
            ...baseScope,
            collectionId,  // Search custom context in this collection
            allowedCourseIds: [],
            allowedItemIds: []
        };

        // Fetch collection_items to find courses/content in this collection
        const { data: collectionItems } = await supabase
            .from('collection_items')
            .select('item_type, item_id, course_id')
            .eq('collection_id', collectionId);

        if (collectionItems) {
            for (const item of collectionItems) {
                if (item.course_id) {
                    scope.allowedCourseIds?.push(item.course_id);
                } else if (item.item_type === 'COURSE' && item.item_id) {
                    scope.allowedCourseIds?.push(parseInt(item.item_id));
                } else if (item.item_id) {
                    // For modules, lessons, conversations, etc.
                    scope.allowedItemIds?.push(item.item_id);
                }
            }
        }

        // Also include custom context items in this collection
        const { data: contextItems } = await supabase
            .from('user_context_items')
            .select('id')
            .eq('user_id', userId)
            .eq('collection_id', collectionId);

        if (contextItems) {
            for (const item of contextItems) {
                scope.allowedItemIds?.push(item.id);
            }
        }

        return scope;
    }

    /**
     * Get Personal Context collection ID for a user
     * Used when we need to fetch personal context explicitly
     */
    static async getPersonalContextCollectionId(
        supabase: SupabaseClient,
        userId: string
    ): Promise<string | null> {
        return this.resolveCollectionId(supabase, userId, 'personal-context');
    }

    /**
     * Get course IDs assigned to a user via content_assignments.
     * Includes assignments via:
     * 1. Direct user assignments
     * 2. Group assignments (if user is in those groups)
     * 3. Org-wide assignments
     */
    private static async getAssignedCourseIds(
        supabase: SupabaseClient,
        userId: string
    ): Promise<number[]> {
        // Get user's org_id
        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', userId)
            .single();

        if (!profile?.org_id) return [];

        // Get user's group memberships
        const { data: memberships } = await supabase
            .from('employee_group_members')
            .select('group_id')
            .eq('user_id', userId);

        const groupIds = memberships?.map(m => m.group_id) || [];

        // Build the OR filter for content_assignments
        // Query for: direct user assignments, group assignments, org-wide assignments
        let orFilter = `assignee_type.eq.user,assignee_id.eq.${userId}`;

        // Add org-wide assignments
        orFilter += `,and(assignee_type.eq.org,org_id.eq.${profile.org_id})`;

        // Add group assignments if user belongs to any groups
        if (groupIds.length > 0) {
            orFilter += `,and(assignee_type.eq.group,assignee_id.in.(${groupIds.join(',')}))`;
        }

        const { data: assignments } = await supabase
            .from('content_assignments')
            .select('content_type, content_id')
            .or(orFilter);

        // Extract course IDs (content_type = 'course')
        const courseIds = (assignments || [])
            .filter(a => a.content_type === 'course')
            .map(a => parseInt(a.content_id))
            .filter(id => !isNaN(id));

        return [...new Set(courseIds)]; // Deduplicate
    }
}
