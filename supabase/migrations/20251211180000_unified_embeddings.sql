-- 1. Create the unified_embeddings table
CREATE TYPE embedding_source_type AS ENUM ('lesson', 'custom_context', 'file', 'conversation', 'profile');

CREATE TABLE IF NOT EXISTS public.unified_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Owner (for privacy)
    course_id BIGINT REFERENCES public.courses(id) ON DELETE CASCADE, -- Optional (for Academy scope)
    collection_id UUID REFERENCES public.user_collections(id) ON DELETE CASCADE, -- Optional (for exclusive collection items)
    
    source_type embedding_source_type NOT NULL,
    source_id TEXT NOT NULL, -- Generic ID (can be int or uuid string)
    
    content TEXT NOT NULL,
    embedding vector(768), -- Dimensions must match your model (Gemini/Gemma typically 768)
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.unified_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can see public content (course_id not null) OR their own private content
CREATE POLICY "Access Unified Embeddings" ON public.unified_embeddings
    FOR SELECT TO authenticated
    USING (
        (course_id IS NOT NULL) OR -- Public Academy Content (simplification for now)
        (user_id = auth.uid())     -- Private User Content
    );

-- RLS Policy: Service Role has full access (for ingestion)
CREATE POLICY "Service Role Access" ON public.unified_embeddings
    FOR ALL TO service_role
    USING (true);


-- 2. Migrate existing data (if any)
INSERT INTO public.unified_embeddings (course_id, source_type, source_id, content, embedding, metadata)
SELECT 
    course_id, 
    'lesson'::embedding_source_type, 
    COALESCE(lesson_id::text, 'unknown'), 
    content, 
    embedding, 
    metadata
FROM public.course_embeddings;

-- 3. Create the Scoped RAG RPC
CREATE OR REPLACE FUNCTION match_unified_embeddings(
    query_embedding vector(768),
    match_threshold float,
    match_count int,
    filter_scope jsonb
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    source_type embedding_source_type,
    source_id TEXT,
    similarity float,
    metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ue.id,
        ue.content,
        ue.source_type,
        ue.source_id,
        1 - (ue.embedding <=> query_embedding) AS similarity,
        ue.metadata
    FROM public.unified_embeddings ue
    WHERE 1 - (ue.embedding <=> query_embedding) > match_threshold
    AND (
        -- Scope Logic
        
        -- 1. Global Academy Scope (Allow all courses)
        ( (filter_scope->>'isGlobalAcademy')::boolean IS TRUE AND ue.course_id IS NOT NULL )
        
        OR
        
        -- 2. Specific Course Filter (e.g., searching within one course)
        ( 
            (filter_scope->>'allowedCourseIds')::jsonb IS NOT NULL AND 
            ue.course_id IS NOT NULL AND 
            ue.course_id::text = ANY (
                SELECT jsonb_array_elements_text(filter_scope->'allowedCourseIds')
            )
        )
        
        OR
        
        -- 3. Specific Item Filter (Custom Context Items)
        (
            (filter_scope->>'allowedItemIds')::jsonb IS NOT NULL AND
            ue.source_type IN ('custom_context', 'file') AND
            ue.source_id = ANY (
                SELECT jsonb_array_elements_text(filter_scope->'allowedItemIds')
            )
        )
        
        OR
        
        -- 4. User Profile Context
        (
            (filter_scope->>'includeProfiles')::boolean IS TRUE AND
            ue.source_type = 'profile' AND
            ue.user_id = (filter_scope->>'userId')::uuid
        )
    )
    ORDER BY ue.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
