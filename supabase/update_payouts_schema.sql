-- Table to track AI citations of course content
CREATE TABLE IF NOT EXISTS public.ai_content_citations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id BIGINT REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) NOT NULL, -- Denormalized for easier querying
  user_id UUID REFERENCES auth.users(id) NOT NULL, -- The user who asked the question
  citation_type TEXT NOT NULL, -- 'direct_quote', 'summary', 'reference'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for reporting
CREATE INDEX IF NOT EXISTS idx_ai_citations_author_date ON public.ai_content_citations(author_id, created_at);

-- Function to generate Monthly Payout Report
-- Returns: Author Name, Course Title, Watch Time (Minutes), AI Citations, Estimated Payout
CREATE OR REPLACE FUNCTION get_monthly_payout_report(report_month DATE)
RETURNS TABLE (
  author_name TEXT,
  course_title TEXT,
  watch_time_minutes NUMERIC,
  ai_citations BIGINT,
  total_payout_score NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH monthly_watch_time AS (
    SELECT 
      c.author_id,
      c.id as course_id,
      SUM(up.view_time_seconds) / 60.0 as minutes
    FROM public.user_progress up
    JOIN public.courses c ON up.course_id = c.id
    WHERE date_trunc('month', up.last_accessed) = date_trunc('month', report_month)
    GROUP BY c.author_id, c.id
  ),
  monthly_citations AS (
    SELECT 
      author_id,
      course_id,
      COUNT(*) as citations
    FROM public.ai_content_citations
    WHERE date_trunc('month', created_at) = date_trunc('month', report_month)
    GROUP BY author_id, course_id
  )
  SELECT 
    p.full_name as author_name,
    c.title as course_title,
    COALESCE(wt.minutes, 0) as watch_time_minutes,
    COALESCE(mc.citations, 0) as ai_citations,
    (COALESCE(wt.minutes, 0) * 0.10) + (COALESCE(mc.citations, 0) * 0.50) as total_payout_score -- Mock formula: $0.10/min + $0.50/citation
  FROM public.courses c
  JOIN public.profiles p ON c.author_id = p.id
  LEFT JOIN monthly_watch_time wt ON c.id = wt.course_id
  LEFT JOIN monthly_citations mc ON c.id = mc.course_id
  WHERE p.author_status = 'approved';
END;
$$;
