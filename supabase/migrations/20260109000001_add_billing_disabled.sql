-- Add billing_disabled column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS billing_disabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.profiles.billing_disabled IS
'When true, user is exempt from billing regardless of subscription status';
