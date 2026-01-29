-- Migration: Add storage fields to resources table for file uploads
-- This enables direct file upload support for course resources

-- Add storage_path column to track uploaded file locations
ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Add file metadata columns for better file management
ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT;

ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS mime_type TEXT;

ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS parsed_text_length INTEGER;

ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS parse_error TEXT;

ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS summary TEXT;

-- Add comment explaining the columns
COMMENT ON COLUMN public.resources.storage_path IS 'Supabase storage path for uploaded files (null for URL-only resources)';
COMMENT ON COLUMN public.resources.file_size_bytes IS 'File size in bytes for uploaded files';
COMMENT ON COLUMN public.resources.mime_type IS 'MIME type of the uploaded file';
COMMENT ON COLUMN public.resources.parsed_text_length IS 'Length of parsed text content for RAG indexing';
COMMENT ON COLUMN public.resources.parse_error IS 'Error message if file parsing failed';
COMMENT ON COLUMN public.resources.summary IS 'AI-generated summary of the file content';
