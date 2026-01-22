-- Add summary column to resources table for AI-generated content summaries
ALTER TABLE resources ADD COLUMN IF NOT EXISTS summary text;

-- Add comment for documentation
COMMENT ON COLUMN resources.summary IS 'AI-generated summary of the resource content for preview display';
