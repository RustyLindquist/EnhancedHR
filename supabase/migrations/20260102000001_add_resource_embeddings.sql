-- Add 'resource' to the embedding_source_type enum
-- This enables Course Resources to be included in RAG for Course Assistant and Course Tutor

-- Add the new enum value
ALTER TYPE embedding_source_type ADD VALUE IF NOT EXISTS 'resource';

-- Note: PostgreSQL doesn't allow reordering enum values, but 'resource' will be added at the end
-- This is fine as the enum is only used for categorization, not ordering

-- Add comment for documentation
COMMENT ON TYPE embedding_source_type IS
'Source types for unified embeddings:
- lesson: Course lesson transcripts
- custom_context: User-created text context
- file: User-uploaded documents
- conversation: Chat history (reserved)
- profile: User profile information
- resource: Course resources (PDFs, documents, links)';
