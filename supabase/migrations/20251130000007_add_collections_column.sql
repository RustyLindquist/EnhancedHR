-- Add collections column to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS collections text[] DEFAULT '{}';

-- Force schema cache reload (by notifying PostgREST if configured, or just by the DDL change)
NOTIFY pgrst, 'reload schema';
