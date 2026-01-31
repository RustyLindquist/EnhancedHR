-- Migration: Update temp-video-uploads bucket to support chunked uploads
-- Adds application/octet-stream to allowed_mime_types for chunk uploads

UPDATE storage.buckets
SET
    allowed_mime_types = ARRAY[
        'video/mp4',
        'video/quicktime',
        'video/x-msvideo',
        'video/webm',
        'video/x-matroska',
        'video/mpeg',
        'video/ogg',
        'video/3gpp',
        'video/x-m4v',
        'application/octet-stream'  -- For chunk uploads
    ]
WHERE id = 'temp-video-uploads';

-- Verify the update
DO $$
DECLARE
    mime_count INT;
BEGIN
    SELECT array_length(allowed_mime_types, 1)
    INTO mime_count
    FROM storage.buckets
    WHERE id = 'temp-video-uploads';

    IF mime_count < 10 THEN
        RAISE EXCEPTION 'Bucket allowed_mime_types not updated correctly. Expected at least 10 types, got %', mime_count;
    END IF;

    RAISE NOTICE 'temp-video-uploads bucket updated with % mime types', mime_count;
END $$;
