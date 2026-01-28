-- Migration: Add dual transcript storage for course lessons
--
-- This migration adds support for storing both AI-generated and user-entered transcripts.
-- User transcripts take priority over AI transcripts when both are present.

-- Add new transcript columns
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS ai_transcript TEXT,
ADD COLUMN IF NOT EXISTS user_transcript TEXT,
ADD COLUMN IF NOT EXISTS transcript_source TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS transcript_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS transcript_generated_at TIMESTAMPTZ;

-- Add check constraint for valid transcript_source values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'lessons_transcript_source_check'
    ) THEN
        ALTER TABLE lessons
        ADD CONSTRAINT lessons_transcript_source_check
        CHECK (transcript_source IN ('none', 'ai', 'user', 'mux-caption', 'whisper', 'youtube', 'legacy'));
    END IF;
END $$;

-- Add check constraint for valid transcript_status values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'lessons_transcript_status_check'
    ) THEN
        ALTER TABLE lessons
        ADD CONSTRAINT lessons_transcript_status_check
        CHECK (transcript_status IN ('pending', 'generating', 'ready', 'failed'));
    END IF;
END $$;

-- Migrate existing content to ai_transcript
-- The 'content' column in lessons currently stores the transcript
-- We'll copy existing content to ai_transcript and mark as 'legacy' source
UPDATE lessons
SET
    ai_transcript = content,
    transcript_source = 'legacy',
    transcript_status = CASE
        WHEN content IS NOT NULL AND content != '' THEN 'ready'
        ELSE 'pending'
    END,
    transcript_generated_at = CASE
        WHEN content IS NOT NULL AND content != '' THEN created_at
        ELSE NULL
    END
WHERE ai_transcript IS NULL
  AND content IS NOT NULL
  AND content != '';

-- Create index for transcript status queries
-- Useful for finding lessons that need transcript generation
CREATE INDEX IF NOT EXISTS idx_lessons_transcript_status
ON lessons(transcript_status)
WHERE transcript_status IN ('pending', 'generating', 'failed');

-- Create index for finding lessons with user transcripts
CREATE INDEX IF NOT EXISTS idx_lessons_user_transcript
ON lessons(id)
WHERE user_transcript IS NOT NULL AND user_transcript != '';

-- Add comment explaining the dual transcript system
COMMENT ON COLUMN lessons.ai_transcript IS 'AI-generated transcript from Mux captions, Whisper, or YouTube';
COMMENT ON COLUMN lessons.user_transcript IS 'User-entered transcript override (takes priority over AI transcript)';
COMMENT ON COLUMN lessons.transcript_source IS 'Source of the current active transcript: none, ai, user, mux-caption, whisper, youtube, legacy';
COMMENT ON COLUMN lessons.transcript_status IS 'Status of transcript generation: pending, generating, ready, failed';
COMMENT ON COLUMN lessons.transcript_generated_at IS 'Timestamp of last transcript generation';
