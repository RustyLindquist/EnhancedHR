-- Add 'video' to the embedding_source_type enum
-- This enables video context items (with transcripts) to be indexed for RAG retrieval

-- 1. Add 'video' to the embedding_source_type enum
ALTER TYPE embedding_source_type ADD VALUE IF NOT EXISTS 'video';

-- 2. Update the comment to reflect all valid source types
COMMENT ON TYPE embedding_source_type IS
'Source types for unified embeddings:
- lesson: Course lesson content (transcripts, articles)
- custom_context: User-created custom text context
- file: Uploaded file content (PDFs, docs)
- conversation: AI conversation content
- profile: User profile information
- resource: Course resources (PDFs, links, etc.)
- org_course: Organization-specific course content
- video: Video context items with AI-generated transcripts';
