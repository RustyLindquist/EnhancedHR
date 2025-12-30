-- Add expert_title field to profiles table
-- This stores the expert's professional title (e.g., "Senior HR Consultant", "CHRO", etc.)

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS expert_title text;

COMMENT ON COLUMN public.profiles.expert_title IS 'Professional title for experts displayed on their profile and courses';
