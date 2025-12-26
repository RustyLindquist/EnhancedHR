-- Add auto_insights setting to profiles table
-- This allows users to toggle between manual approval and automatic insight generation

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS auto_insights BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.auto_insights IS 'When true, AI insights are automatically saved. When false (default), user must approve each insight.';
