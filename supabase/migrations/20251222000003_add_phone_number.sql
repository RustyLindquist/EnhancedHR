-- Add phone number field to profiles table for expert applications

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone_number text;

COMMENT ON COLUMN public.profiles.phone_number IS 'Contact phone number for experts';
