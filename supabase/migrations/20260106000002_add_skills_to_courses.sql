-- Add skills column to courses table
-- Skills are text array representing competencies/topics covered in the course
ALTER TABLE courses ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}';

-- Create index for skills array for efficient querying
CREATE INDEX IF NOT EXISTS courses_skills_idx ON courses USING GIN (skills);
