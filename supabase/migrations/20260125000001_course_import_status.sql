-- Course Import Status Table
-- Tracks the progress of course imports from local to production
-- Used by the course promotion feature
--
-- This table can be dropped after all courses are migrated

-- Create the course import status table
CREATE TABLE IF NOT EXISTS public.course_import_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id BIGINT NOT NULL,
    course_title TEXT NOT NULL,
    total_videos INT DEFAULT 0,
    processed_videos INT DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete', 'error')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups by course_id
CREATE INDEX IF NOT EXISTS idx_course_import_status_course_id
    ON public.course_import_status(course_id);

-- Index for filtering by status (useful for finding pending/error imports)
CREATE INDEX IF NOT EXISTS idx_course_import_status_status
    ON public.course_import_status(status);

-- Comment for documentation
COMMENT ON TABLE public.course_import_status IS
    'Temporary table for tracking course import/promotion progress from local to production. Can be dropped after migration is complete.';

COMMENT ON COLUMN public.course_import_status.course_id IS
    'The ID of the course on production (after import)';

COMMENT ON COLUMN public.course_import_status.total_videos IS
    'Total number of video lessons that need transcript processing';

COMMENT ON COLUMN public.course_import_status.processed_videos IS
    'Number of video lessons that have been processed';

COMMENT ON COLUMN public.course_import_status.status IS
    'Current status: pending (waiting to start), processing (in progress), complete (done), error (failed)';

-- Enable RLS (admin-only access via service role key)
ALTER TABLE public.course_import_status ENABLE ROW LEVEL SECURITY;

-- No RLS policies needed - this table is only accessed via admin client (service role)
-- The API endpoints validate the COURSE_IMPORT_SECRET before any operations
