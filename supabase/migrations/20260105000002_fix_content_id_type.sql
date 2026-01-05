-- Migration: Fix content_id type mismatch
-- Problem: content_assignments.content_id is uuid but courses.id is bigint
-- Solution: Change content_id to text to support both UUID and bigint content types

-- Step 1: Drop any foreign key constraints on content_id (there shouldn't be any since it's polymorphic)
-- No FK exists based on schema inspection

-- Step 2: Alter the column type from uuid to text
ALTER TABLE content_assignments
  ALTER COLUMN content_id TYPE text USING content_id::text;

-- Add a comment explaining the design
COMMENT ON COLUMN content_assignments.content_id IS 'Polymorphic content ID - stores bigint (courses) or uuid (other content types) as text';
