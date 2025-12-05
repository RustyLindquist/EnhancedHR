-- Add model column to ai_system_prompts
ALTER TABLE public.ai_system_prompts ADD COLUMN IF NOT EXISTS model text;

-- Set default model for existing prompts (optional, but good practice)
UPDATE public.ai_system_prompts SET model = 'google/gemini-2.0-flash-001' WHERE model IS NULL;
