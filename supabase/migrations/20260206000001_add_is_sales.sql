-- Add is_sales flag to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_sales BOOLEAN DEFAULT false;

-- Index for querying sales users
CREATE INDEX IF NOT EXISTS idx_profiles_is_sales ON public.profiles(is_sales) WHERE is_sales = true;
