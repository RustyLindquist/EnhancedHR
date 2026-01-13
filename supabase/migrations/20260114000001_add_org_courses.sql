-- Organization Courses Migration
-- Add org_id column to courses table to support organization-specific courses
-- NULL = platform-wide course, UUID = org-specific course

-- ============================================
-- Add org_id column to courses
-- ============================================
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Create index for efficient org course lookups
CREATE INDEX IF NOT EXISTS idx_courses_org_id ON public.courses(org_id);

-- Add descriptive comment
COMMENT ON COLUMN public.courses.org_id IS 'Organization ID for org-specific courses. NULL indicates a platform-wide course.';
