-- Create storage bucket for user context files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'user-context-files',
    'user-context-files',
    true,
    10485760, -- 10MB limit
    ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown',
        'text/csv',
        'application/json',
        'image/jpeg',
        'image/png',
        'image/gif'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (for idempotent re-runs)
DROP POLICY IF EXISTS "Users can upload their own context files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own context files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own context files" ON storage.objects;
DROP POLICY IF EXISTS "Public can read context files" ON storage.objects;

-- RLS policy: Users can upload to their own folder
CREATE POLICY "Users can upload their own context files"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'user-context-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS policy: Public read access (bucket is public)
CREATE POLICY "Public can read context files"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-context-files');

-- RLS policy: Users can delete their own files
CREATE POLICY "Users can delete their own context files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'user-context-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
