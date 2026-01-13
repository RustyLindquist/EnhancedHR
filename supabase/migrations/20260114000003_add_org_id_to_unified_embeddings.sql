-- Add org_id column for org-scoped content in unified_embeddings
-- This enables Organization Courses to be searchable via RAG but ONLY by org members

-- 1. Add org_id column to unified_embeddings table
ALTER TABLE unified_embeddings ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 2. Create index for efficient org-scoped queries
CREATE INDEX IF NOT EXISTS idx_unified_embeddings_org_id ON unified_embeddings(org_id) WHERE org_id IS NOT NULL;

-- 3. Add 'org_course' to the embedding_source_type enum
ALTER TYPE embedding_source_type ADD VALUE IF NOT EXISTS 'org_course';

-- 4. Update the match_unified_embeddings RPC to support org scope
-- Drop existing function first to allow signature changes
DROP FUNCTION IF EXISTS match_unified_embeddings(vector(768), float, int, jsonb);

-- Create enhanced function with org scope support
CREATE OR REPLACE FUNCTION match_unified_embeddings(
    query_embedding vector(768),
    match_threshold float,
    match_count int,
    filter_scope jsonb
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    source_type TEXT,
    source_id TEXT,
    similarity float,
    metadata JSONB,
    course_id BIGINT,
    collection_id UUID,
    org_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    scope_user_id UUID;
    scope_is_global BOOLEAN;
    scope_is_platform BOOLEAN;
    scope_include_personal BOOLEAN;
    scope_org_id UUID;
BEGIN
    -- Extract common scope parameters
    scope_user_id := (filter_scope->>'userId')::uuid;
    scope_is_global := COALESCE((filter_scope->>'isGlobalAcademy')::boolean, false);
    scope_is_platform := COALESCE((filter_scope->>'isPlatformScope')::boolean, false);
    scope_include_personal := COALESCE((filter_scope->>'includePersonalContext')::boolean, true);
    scope_org_id := (filter_scope->>'orgId')::uuid;

    RETURN QUERY
    SELECT
        ue.id,
        ue.content,
        ue.source_type::text,
        ue.source_id,
        1 - (ue.embedding <=> query_embedding) AS similarity,
        ue.metadata,
        ue.course_id,
        ue.collection_id,
        ue.org_id
    FROM public.unified_embeddings ue
    WHERE
        -- Similarity threshold
        1 - (ue.embedding <=> query_embedding) > match_threshold
        AND (
            -- SCOPE 1: Global Academy (all public course content, excludes org-specific content)
            (
                scope_is_global
                AND ue.course_id IS NOT NULL
                AND ue.org_id IS NULL  -- Exclude org-specific content from global academy
            )

            OR

            -- SCOPE 2: Platform-wide (all public courses + all user's custom context, excludes org-specific)
            (
                scope_is_platform
                AND (
                    (ue.course_id IS NOT NULL AND ue.org_id IS NULL)  -- All public course content
                    OR (
                        scope_user_id IS NOT NULL
                        AND ue.user_id = scope_user_id  -- All user's custom context
                    )
                )
            )

            OR

            -- SCOPE 3: Specific Course(s)
            (
                (filter_scope->>'allowedCourseIds') IS NOT NULL
                AND ue.course_id IS NOT NULL
                AND ue.course_id::text = ANY (
                    SELECT jsonb_array_elements_text(filter_scope->'allowedCourseIds')
                )
            )

            OR

            -- SCOPE 4: Specific Collection (custom context within that collection)
            (
                (filter_scope->>'collectionId') IS NOT NULL
                AND ue.collection_id = (filter_scope->>'collectionId')::uuid
            )

            OR

            -- SCOPE 5: Specific Item IDs (for targeted retrieval)
            (
                (filter_scope->>'allowedItemIds') IS NOT NULL
                AND ue.source_id = ANY (
                    SELECT jsonb_array_elements_text(filter_scope->'allowedItemIds')
                )
            )

            OR

            -- SCOPE 6: Personal Context (global user context - always included when requested)
            (
                scope_include_personal
                AND scope_user_id IS NOT NULL
                AND ue.user_id = scope_user_id
                AND ue.collection_id IS NULL  -- Personal context has no collection_id
            )

            OR

            -- SCOPE 7: All user's context across all collections
            (
                (filter_scope->>'includeAllUserContext')::boolean IS TRUE
                AND scope_user_id IS NOT NULL
                AND ue.user_id = scope_user_id
            )

            OR

            -- SCOPE 8: Org-scoped content (ONLY for members of that org)
            -- This scope is for org courses - only accessible to org members
            (
                scope_org_id IS NOT NULL
                AND ue.org_id = scope_org_id
            )
        )
    ORDER BY ue.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION match_unified_embeddings(vector(768), float, int, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION match_unified_embeddings(vector(768), float, int, jsonb) TO service_role;

-- 5. Update RLS policy to include org-scoped access
-- Users can access: public course content, their own content, or content from their org

-- Drop existing policies
DROP POLICY IF EXISTS "Access Unified Embeddings" ON public.unified_embeddings;
DROP POLICY IF EXISTS "Service Role Access" ON public.unified_embeddings;

-- Create new policy for authenticated users
CREATE POLICY "Access Unified Embeddings" ON public.unified_embeddings
    FOR SELECT TO authenticated
    USING (
        (course_id IS NOT NULL AND org_id IS NULL) OR -- Public Academy Content
        (user_id = auth.uid()) OR                      -- User's own content
        (org_id IN (                                   -- Org content for org members
            SELECT org_id FROM profiles WHERE id = auth.uid()
        ))
    );

-- Service role policy for backend operations
CREATE POLICY "Service Role Access" ON public.unified_embeddings
    FOR ALL TO service_role
    USING (true);

-- Add comment for documentation
COMMENT ON FUNCTION match_unified_embeddings IS
'Enhanced RAG function for Object-Oriented Context Engineering.
Supports multiple scope types:
- isGlobalAcademy: Search all public course content (excludes org-specific)
- isPlatformScope: Search all public courses + user custom context (for Platform Assistant)
- allowedCourseIds: Search specific courses (for Course Assistant/Tutor)
- collectionId: Search within a specific collection
- allowedItemIds: Search specific items by ID
- includePersonalContext: Include user global context (default: true)
- includeAllUserContext: Include all user context across all collections
- orgId: Search org-specific content (org courses) - ONLY for org members
- userId: Required for personal context features';
