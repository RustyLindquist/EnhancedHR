-- Add Drive Ingestion fields to courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS drive_folder_id text UNIQUE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS sync_status text CHECK (sync_status IN ('idle', 'scanning', 'syncing', 'error')) DEFAULT 'idle';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

-- Add Drive Ingestion and Mux fields to lessons
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS drive_file_id text;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS mux_asset_id text;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS mux_playback_id text;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS script_content text;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_courses_drive_folder_id ON courses(drive_folder_id);
