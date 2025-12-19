-- Enhanced Unified Embeddings RAG Function
-- Supports: Global Academy, Course-specific, Collection-specific, Personal Context, and Platform-wide queries

-- Drop existing function if exists (to allow recreation)
DROP FUNCTION IF EXISTS match_unified_embeddings(vector(768), float, int, jsonb);

-- Create enhanced function with better scope handling
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
    collection_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    scope_user_id UUID;
    scope_is_global BOOLEAN;
    scope_is_platform BOOLEAN;
    scope_include_personal BOOLEAN;
BEGIN
    -- Extract common scope parameters
    scope_user_id := (filter_scope->>'userId')::uuid;
    scope_is_global := COALESCE((filter_scope->>'isGlobalAcademy')::boolean, false);
    scope_is_platform := COALESCE((filter_scope->>'isPlatformScope')::boolean, false);
    scope_include_personal := COALESCE((filter_scope->>'includePersonalContext')::boolean, true);

    RETURN QUERY
    SELECT
        ue.id,
        ue.content,
        ue.source_type::text,
        ue.source_id,
        1 - (ue.embedding <=> query_embedding) AS similarity,
        ue.metadata,
        ue.course_id,
        ue.collection_id
    FROM public.unified_embeddings ue
    WHERE
        -- Similarity threshold
        1 - (ue.embedding <=> query_embedding) > match_threshold
        AND (
            -- SCOPE 1: Global Academy (all course content)
            (
                scope_is_global
                AND ue.course_id IS NOT NULL
            )

            OR

            -- SCOPE 2: Platform-wide (all courses + all user's custom context)
            (
                scope_is_platform
                AND (
                    ue.course_id IS NOT NULL  -- All course content
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
        )
    ORDER BY ue.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION match_unified_embeddings(vector(768), float, int, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION match_unified_embeddings(vector(768), float, int, jsonb) TO service_role;

-- Create index for better performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_unified_embeddings_user_id
ON public.unified_embeddings(user_id)
WHERE user_id IS NOT NULL;

-- Create index for collection_id lookups
CREATE INDEX IF NOT EXISTS idx_unified_embeddings_collection_id
ON public.unified_embeddings(collection_id)
WHERE collection_id IS NOT NULL;

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_unified_embeddings_user_collection
ON public.unified_embeddings(user_id, collection_id);

-- Add comment for documentation
COMMENT ON FUNCTION match_unified_embeddings IS
'Enhanced RAG function for Object-Oriented Context Engineering.
Supports multiple scope types:
- isGlobalAcademy: Search all course content
- isPlatformScope: Search all courses + user custom context (for Platform Assistant)
- allowedCourseIds: Search specific courses (for Course Assistant/Tutor)
- collectionId: Search within a specific collection
- allowedItemIds: Search specific items by ID
- includePersonalContext: Include user global context (default: true)
- includeAllUserContext: Include all user context across all collections
- userId: Required for personal context features';
