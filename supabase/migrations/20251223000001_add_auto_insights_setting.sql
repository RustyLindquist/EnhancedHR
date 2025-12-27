-- Add insight settings to profiles table
-- enable_insights: Master toggle for the AI insight system (default true)
-- auto_insights: When true, insights are auto-saved without user approval (default false)

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS enable_insights BOOLEAN DEFAULT TRUE;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS auto_insights BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.enable_insights IS 'Master toggle for AI insight identification. When false, Prometheus will not attempt to identify insights during conversations.';
COMMENT ON COLUMN public.profiles.auto_insights IS 'When true, AI insights are automatically saved. When false (default), user must approve each insight.';
