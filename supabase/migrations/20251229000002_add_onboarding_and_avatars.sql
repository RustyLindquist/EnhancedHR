-- Add onboarding tracking fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS onboarding_skipped_at timestamp with time zone DEFAULT NULL;

-- Create avatars storage bucket (separate from user-context-files for cleaner organization)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    5242880, -- 5MB limit for avatars
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for avatars bucket
-- Users can upload their own avatar (path must start with their user id)
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Anyone can view avatars (public bucket)
CREATE POLICY "Public can read avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Index for efficient onboarding status queries
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles (onboarding_completed_at, onboarding_skipped_at);
