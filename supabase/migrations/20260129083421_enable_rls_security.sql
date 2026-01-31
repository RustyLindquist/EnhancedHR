-- Enable RLS on tables flagged by security audit
-- Addresses: ai_content_citations and context_embeddings missing RLS

-- ============================================
-- 1. ai_content_citations - Enable RLS
-- ============================================
-- This table tracks when AI cites course content
-- Columns: id, course_id, author_id, user_id, citation_type, created_at

ALTER TABLE public.ai_content_citations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own citations (where they asked the AI)
CREATE POLICY "Users can view own citations"
ON public.ai_content_citations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Authors can view citations for their content
CREATE POLICY "Authors can view citations for their content"
ON public.ai_content_citations
FOR SELECT
TO authenticated
USING (auth.uid() = author_id);

-- Policy: Service role has full access (for API routes to insert)
CREATE POLICY "Service role has full access to citations"
ON public.ai_content_citations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 2. context_embeddings - Enable RLS
-- ============================================
-- This table stores vector embeddings for AI search
-- Accessed only by server-side AI functions via service role
-- No direct client access needed

ALTER TABLE public.context_embeddings ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access (for server-side AI operations)
CREATE POLICY "Service role has full access to embeddings"
ON public.context_embeddings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Note: No authenticated user policies - this table is internal to AI
-- Client queries go through API routes that use service role
