-- Database-side aggregation for expert directory page
-- Replaces full courses table scan with efficient GROUP BY queries

CREATE OR REPLACE FUNCTION get_published_course_counts_by_author()
RETURNS TABLE(author_id uuid, course_count bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT c.author_id, COUNT(*) AS course_count
  FROM courses c
  WHERE c.status = 'published'
    AND c.author_id IS NOT NULL
  GROUP BY c.author_id;
$$;

CREATE OR REPLACE FUNCTION get_published_course_counts_by_standalone_expert()
RETURNS TABLE(standalone_expert_id uuid, course_count bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT c.standalone_expert_id, COUNT(*) AS course_count
  FROM courses c
  WHERE c.status = 'published'
    AND c.standalone_expert_id IS NOT NULL
  GROUP BY c.standalone_expert_id;
$$;
