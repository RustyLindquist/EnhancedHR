-- Migration: Update user-context-files bucket to support larger files and PPTX
-- Fixes: "Failed to fetch" error when uploading files > 10MB or PPTX files

-- Update file_size_limit from 10MB to 25MB (26214400 bytes)
-- Add PPTX mime types to allowed_mime_types
UPDATE storage.buckets
SET
    file_size_limit = 26214400,
    allowed_mime_types = ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-powerpoint',
        'text/plain',
        'text/markdown',
        'text/csv',
        'application/json',
        'image/jpeg',
        'image/png',
        'image/gif'
    ]
WHERE id = 'user-context-files';

-- Verify the update
DO $$
DECLARE
    bucket_limit BIGINT;
    mime_count INT;
BEGIN
    SELECT file_size_limit, array_length(allowed_mime_types, 1)
    INTO bucket_limit, mime_count
    FROM storage.buckets
    WHERE id = 'user-context-files';

    IF bucket_limit != 26214400 THEN
        RAISE EXCEPTION 'Bucket file_size_limit not updated correctly. Expected 26214400, got %', bucket_limit;
    END IF;

    IF mime_count < 11 THEN
        RAISE EXCEPTION 'Bucket allowed_mime_types not updated correctly. Expected at least 11 types, got %', mime_count;
    END IF;

    RAISE NOTICE 'user-context-files bucket updated: file_size_limit=25MB, mime_types=%', mime_count;
END $$;
