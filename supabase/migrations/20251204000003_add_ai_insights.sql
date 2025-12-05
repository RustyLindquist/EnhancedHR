-- Add ai_insights column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_insights jsonb DEFAULT '[]'::jsonb;

-- Comment on column
COMMENT ON COLUMN public.profiles.ai_insights IS 'List of AI-derived insights about the user (e.g. "New to HR", "Prefers concise answers"). Stored as an array of strings.';
