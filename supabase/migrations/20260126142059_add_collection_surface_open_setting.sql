-- ============================================================================
-- Add Collection Surface Open Preference to User Profiles
--
-- This setting controls whether the Collection Surface at the bottom of the
-- canvas is expanded or collapsed by default.
--
-- Default: FALSE (collapsed) - to reduce visual clutter for new users
-- ============================================================================

-- Add the collection_surface_open column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS collection_surface_open BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.collection_surface_open IS
'User preference for Collection Surface visibility. FALSE = collapsed (default), TRUE = expanded.';
