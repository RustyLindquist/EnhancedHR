ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS estimated_duration text DEFAULT '0m';
