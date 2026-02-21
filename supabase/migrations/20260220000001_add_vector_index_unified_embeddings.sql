-- Add vector index on unified_embeddings for faster RAG queries
-- Without this, every match_unified_embeddings call does a full sequential scan
-- HNSW provides better recall than IVFFLAT and doesn't require training

-- Create HNSW index for cosine similarity (matches the <=> operator used in match_unified_embeddings)
CREATE INDEX IF NOT EXISTS idx_unified_embeddings_vector_hnsw
ON public.unified_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Also add a course_id index for faster course-scoped queries
CREATE INDEX IF NOT EXISTS idx_unified_embeddings_course_id
ON public.unified_embeddings(course_id)
WHERE course_id IS NOT NULL;

-- Add composite index for source_type + source_id lookups (used by stale embedding cleanup)
CREATE INDEX IF NOT EXISTS idx_unified_embeddings_source_lookup
ON public.unified_embeddings(source_id, source_type);
