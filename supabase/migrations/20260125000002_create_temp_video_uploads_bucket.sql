-- Create storage bucket for temporary video uploads
-- Used as fallback when direct Mux upload fails (ISP TLS interference)
-- Files are temporary and should be deleted after Mux processes them

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'temp-video-uploads',
    'temp-video-uploads',
    true,  -- Public so Mux can pull from the URL
    524288000, -- 500MB limit for videos
    ARRAY[
        'video/mp4',
        'video/quicktime',
        'video/x-msvideo',
        'video/webm',
        'video/x-matroska',
        'video/mpeg',
        'video/ogg',
        'video/3gpp',
        'video/x-m4v'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (for idempotent re-runs)
DROP POLICY IF EXISTS "Authenticated users can upload temp videos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read temp videos" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete temp videos" ON storage.objects;
DROP POLICY IF EXISTS "Uploaders can delete their temp videos" ON storage.objects;

-- RLS policy: Authenticated users can upload to their own folder
CREATE POLICY "Authenticated users can upload temp videos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'temp-video-uploads'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS policy: Public read access (so Mux can pull the video)
CREATE POLICY "Public can read temp videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'temp-video-uploads');

-- RLS policy: Users can delete their own temp uploads
CREATE POLICY "Uploaders can delete their temp videos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'temp-video-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Note: Cleanup of orphaned files should be done via a scheduled function
-- or after Mux successfully processes the video
