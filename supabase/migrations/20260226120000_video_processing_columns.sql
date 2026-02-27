-- Add columns to support background video processing for large file uploads
-- When a video >500MB is uploaded, it processes in the background via Mux webhooks
-- instead of waiting synchronously for encoding to complete.

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS mux_upload_id TEXT,
  ADD COLUMN IF NOT EXISTS mux_asset_id TEXT,
  ADD COLUMN IF NOT EXISTS video_status TEXT DEFAULT 'ready',
  ADD COLUMN IF NOT EXISTS deferred_transcript TEXT;

-- Constrain video_status to known states
-- 'ready' is the default so existing lessons are unaffected
ALTER TABLE lessons
  ADD CONSTRAINT lessons_video_status_check
  CHECK (video_status IN ('uploading', 'processing', 'ready', 'errored'));

-- Index for webhook lookups: find lesson by mux_asset_id
CREATE INDEX IF NOT EXISTS idx_lessons_mux_asset_id
  ON lessons(mux_asset_id) WHERE mux_asset_id IS NOT NULL;
