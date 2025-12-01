-- Add missing columns to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_saved boolean DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS badges text[] DEFAULT '{}';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS image_url text;
