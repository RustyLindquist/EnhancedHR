-- Add 'note' and 'conversation' to embedding_source_type enum
-- This enables RAG search across user notes and saved conversations

ALTER TYPE embedding_source_type ADD VALUE IF NOT EXISTS 'note';
ALTER TYPE embedding_source_type ADD VALUE IF NOT EXISTS 'conversation';
