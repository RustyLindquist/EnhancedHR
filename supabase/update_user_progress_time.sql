-- Add view_time_seconds to user_progress
ALTER TABLE public.user_progress
ADD COLUMN IF NOT EXISTS view_time_seconds INTEGER DEFAULT 0;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_progress_view_time ON public.user_progress(view_time_seconds);
