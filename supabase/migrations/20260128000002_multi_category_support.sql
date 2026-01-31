-- Migration: Convert single category to multi-category support
-- Changes courses.category (TEXT) to courses.categories (TEXT[])

-- Step 1: Add new categories column as TEXT array
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS categories TEXT[];

-- Step 2: Migrate existing data - wrap single category in array
UPDATE public.courses
SET categories = ARRAY[category]
WHERE category IS NOT NULL AND categories IS NULL;

-- Step 3: Set default for courses with no category
UPDATE public.courses
SET categories = ARRAY['General']
WHERE categories IS NULL;

-- Step 4: Make categories NOT NULL with default
ALTER TABLE public.courses
ALTER COLUMN categories SET DEFAULT ARRAY['General']::TEXT[];

ALTER TABLE public.courses
ALTER COLUMN categories SET NOT NULL;

-- Step 5: Drop old category column (keeping for now as backup, uncomment to remove)
-- ALTER TABLE public.courses DROP COLUMN category;

-- Note: We're keeping the old 'category' column for backwards compatibility during rollout.
-- Once all code is updated and tested, run:
-- ALTER TABLE public.courses DROP COLUMN category;

-- Add index for category filtering
CREATE INDEX IF NOT EXISTS idx_courses_categories ON public.courses USING GIN (categories);

COMMENT ON COLUMN public.courses.categories IS 'Array of category names this course belongs to';
