-- Add tool_slug column to notes table for tool-specific notes
-- This allows notes to be scoped to specific tools (e.g., roleplay-dojo, role-disruption-forecasting)
-- Notes can be:
-- 1. Course-scoped: course_id IS NOT NULL, tool_slug IS NULL
-- 2. Tool-scoped: course_id IS NULL, tool_slug IS NOT NULL
-- 3. General: course_id IS NULL, tool_slug IS NULL

ALTER TABLE notes ADD COLUMN IF NOT EXISTS tool_slug TEXT REFERENCES tools(slug) ON DELETE SET NULL;

-- Create index for tool_slug queries
CREATE INDEX IF NOT EXISTS idx_notes_tool_slug ON notes(tool_slug);

-- Create composite index for user_id + tool_slug for efficient filtering
CREATE INDEX IF NOT EXISTS idx_notes_user_tool ON notes(user_id, tool_slug) WHERE tool_slug IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN notes.tool_slug IS 'References tools.slug - used to scope notes to specific tools (e.g., roleplay-dojo)';
