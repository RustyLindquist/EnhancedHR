-- Add optional description field to resources table
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS description TEXT;
