-- ============================================================================
-- PRODUCTION MIGRATION: Object-Oriented Context Engineering
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor to enable the full context
-- engineering pipeline including:
--   1. Unified embeddings table for RAG
--   2. Enhanced RAG function with proper scope handling
--   3. Storage bucket for user file uploads
--   4. Performance indexes
--
-- This migration is IDEMPOTENT - safe to run multiple times
-- ============================================================================


-- ============================================================================
-- PART 0: Prerequisites - Ensure pgvector extension is enabled
-- ============================================================================
-- Note: This should already be enabled in Supabase, but just in case
CREATE EXTENSION IF NOT EXISTS vector;


-- ============================================================================
-- PART 1: Create Unified Embeddings Table
-- ============================================================================

-- Create the source type enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'embedding_source_type') THEN
        CREATE TYPE embedding_source_type AS ENUM ('lesson', 'custom_context', 'file', 'conversation', 'profile', 'module', 'course');
    END IF;
END$$;

-- Add new enum values if they don't exist (for existing databases)
DO $$
BEGIN
    -- Add 'module' if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'module' AND enumtypid = 'embedding_source_type'::regtype) THEN
        ALTER TYPE embedding_source_type ADD VALUE IF NOT EXISTS 'module';
    END IF;
    -- Add 'course' if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'course' AND enumtypid = 'embedding_source_type'::regtype) THEN
        ALTER TYPE embedding_source_type ADD VALUE IF NOT EXISTS 'course';
    END IF;
EXCEPTION
    WHEN others THEN NULL; -- Ignore errors if values already exist
END$$;

-- Create the unified_embeddings table
CREATE TABLE IF NOT EXISTS public.unified_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id BIGINT REFERENCES public.courses(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES public.user_collections(id) ON DELETE CASCADE,

    source_type embedding_source_type NOT NULL,
    source_id TEXT NOT NULL,

    content TEXT NOT NULL,
    embedding vector(768),
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.unified_embeddings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Access Unified Embeddings" ON public.unified_embeddings;
DROP POLICY IF EXISTS "Service Role Access" ON public.unified_embeddings;

-- RLS Policy: Users can see public content (course_id not null) OR their own private content
CREATE POLICY "Access Unified Embeddings" ON public.unified_embeddings
    FOR SELECT TO authenticated
    USING (
        (course_id IS NOT NULL) OR
        (user_id = auth.uid())
    );

-- RLS Policy: Service Role has full access (for ingestion)
CREATE POLICY "Service Role Access" ON public.unified_embeddings
    FOR ALL TO service_role
    USING (true);


-- ============================================================================
-- PART 2: Migrate Existing Course Embeddings (if course_embeddings table exists)
-- ============================================================================

DO $$
BEGIN
    -- Only migrate if course_embeddings exists and unified_embeddings is empty
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_embeddings') THEN
        IF NOT EXISTS (SELECT 1 FROM public.unified_embeddings WHERE source_type = 'lesson' LIMIT 1) THEN
            INSERT INTO public.unified_embeddings (course_id, source_type, source_id, content, embedding, metadata)
            SELECT
                course_id,
                'lesson'::embedding_source_type,
                COALESCE(lesson_id::text, 'unknown'),
                content,
                embedding,
                metadata
            FROM public.course_embeddings
            ON CONFLICT DO NOTHING;

            RAISE NOTICE 'Migrated existing course embeddings to unified_embeddings';
        END IF;
    END IF;
END$$;


-- ============================================================================
-- PART 3: Enhanced RAG Function for Unified Embeddings
-- ============================================================================

-- Drop existing function if exists (to allow recreation with new signature)
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
                    ue.course_id IS NOT NULL
                    OR (
                        scope_user_id IS NOT NULL
                        AND ue.user_id = scope_user_id
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
                AND ue.collection_id IS NULL
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


-- ============================================================================
-- PART 4: Performance Indexes
-- ============================================================================

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

-- Create index for source_id lookups (used when deleting context items)
CREATE INDEX IF NOT EXISTS idx_unified_embeddings_source_id
ON public.unified_embeddings(source_id);

-- Create index for course_id lookups
CREATE INDEX IF NOT EXISTS idx_unified_embeddings_course_id
ON public.unified_embeddings(course_id)
WHERE course_id IS NOT NULL;


-- ============================================================================
-- PART 5: Storage Bucket for User Context Files
-- ============================================================================

-- Create storage bucket for user context files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'user-context-files',
    'user-context-files',
    true,
    10485760, -- 10MB limit
    ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown',
        'text/csv',
        'application/json',
        'image/jpeg',
        'image/png',
        'image/gif'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (for idempotent re-runs)
DROP POLICY IF EXISTS "Users can upload their own context files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own context files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own context files" ON storage.objects;
DROP POLICY IF EXISTS "Public can read context files" ON storage.objects;

-- RLS policy: Users can upload to their own folder
CREATE POLICY "Users can upload their own context files"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'user-context-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS policy: Public read access (bucket is public)
CREATE POLICY "Public can read context files"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-context-files');

-- RLS policy: Users can delete their own files
CREATE POLICY "Users can delete their own context files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'user-context-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
);


-- ============================================================================
-- VERIFICATION QUERIES (Uncomment and run to verify)
-- ============================================================================

-- Check table exists:
-- SELECT * FROM public.unified_embeddings LIMIT 5;

-- Check function exists:
-- SELECT proname FROM pg_proc WHERE proname = 'match_unified_embeddings';

-- Check storage bucket:
-- SELECT * FROM storage.buckets WHERE id = 'user-context-files';

-- Check indexes:
-- SELECT indexname FROM pg_indexes WHERE tablename = 'unified_embeddings';

-- Check enum values:
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = 'embedding_source_type'::regtype;
