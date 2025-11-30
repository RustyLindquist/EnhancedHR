-- Add author_status to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS author_status TEXT DEFAULT 'none' CHECK (author_status IN ('none', 'pending', 'approved', 'rejected'));

-- Add author_bio and linkedin_url for application
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS author_bio TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Index for admin filtering
CREATE INDEX IF NOT EXISTS idx_profiles_author_status ON public.profiles(author_status);
