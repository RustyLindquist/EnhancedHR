-- Expert Course Editing Migration
-- Enables approved experts to create and edit their own draft courses
-- Adds 'pending_review' status for admin approval workflow

-- ============================================
-- PHASE 1: Add status column and CHECK constraint
-- ============================================

-- Add status column if it doesn't exist
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';

-- Ensure all existing courses have valid status values
UPDATE public.courses
SET status = 'draft'
WHERE status IS NULL OR status NOT IN ('draft', 'pending_review', 'published', 'archived');

-- Add CHECK constraint (drop if exists for idempotency)
ALTER TABLE public.courses
DROP CONSTRAINT IF EXISTS courses_status_check;

ALTER TABLE public.courses
ADD CONSTRAINT courses_status_check
CHECK (status IN ('draft', 'pending_review', 'published', 'archived'));

-- ============================================
-- PHASE 2: RLS Policies for COURSES table
-- ============================================
-- Note: Existing policies:
--   - "Enable read access for all users" (SELECT for public)
--   - "Enable write access for admins" (ALL for admins)
-- We ADD expert-specific policies (admins continue using service-role client)

-- Experts can INSERT new draft courses (their own)
DROP POLICY IF EXISTS "Experts can create draft courses" ON public.courses;
CREATE POLICY "Experts can create draft courses" ON public.courses
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Must be the author
        author_id = auth.uid()
        -- Must start as draft
        AND status = 'draft'
        -- Must be an approved expert
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND author_status = 'approved'
        )
    );

-- Experts can UPDATE their own draft courses
DROP POLICY IF EXISTS "Experts can update own draft courses" ON public.courses;
CREATE POLICY "Experts can update own draft courses" ON public.courses
    FOR UPDATE
    TO authenticated
    USING (
        -- Must own the course
        author_id = auth.uid()
        -- Course must be in draft status
        AND status = 'draft'
        -- Must be an approved expert
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND author_status = 'approved'
        )
    )
    WITH CHECK (
        -- Must remain owned by same author
        author_id = auth.uid()
        -- Can only change to draft or pending_review (not published/archived)
        AND status IN ('draft', 'pending_review')
    );

-- ============================================
-- PHASE 3: RLS Policies for MODULES table
-- ============================================
-- Enable RLS if not already
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Experts can INSERT modules for their draft courses
DROP POLICY IF EXISTS "Experts can create modules for own draft courses" ON public.modules;
CREATE POLICY "Experts can create modules for own draft courses" ON public.modules
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = course_id
            AND c.author_id = auth.uid()
            AND c.status = 'draft'
        )
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND author_status = 'approved'
        )
    );

-- Experts can UPDATE modules for their draft courses
DROP POLICY IF EXISTS "Experts can update modules for own draft courses" ON public.modules;
CREATE POLICY "Experts can update modules for own draft courses" ON public.modules
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = course_id
            AND c.author_id = auth.uid()
            AND c.status = 'draft'
        )
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND author_status = 'approved'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = course_id
            AND c.author_id = auth.uid()
            AND c.status = 'draft'
        )
    );

-- Experts can DELETE modules for their draft courses
DROP POLICY IF EXISTS "Experts can delete modules for own draft courses" ON public.modules;
CREATE POLICY "Experts can delete modules for own draft courses" ON public.modules
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = course_id
            AND c.author_id = auth.uid()
            AND c.status = 'draft'
        )
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND author_status = 'approved'
        )
    );

-- ============================================
-- PHASE 4: RLS Policies for LESSONS table
-- ============================================
-- Enable RLS if not already
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Experts can INSERT lessons for their draft courses
DROP POLICY IF EXISTS "Experts can create lessons for own draft courses" ON public.lessons;
CREATE POLICY "Experts can create lessons for own draft courses" ON public.lessons
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.modules m
            JOIN public.courses c ON c.id = m.course_id
            WHERE m.id = module_id
            AND c.author_id = auth.uid()
            AND c.status = 'draft'
        )
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND author_status = 'approved'
        )
    );

-- Experts can UPDATE lessons for their draft courses
DROP POLICY IF EXISTS "Experts can update lessons for own draft courses" ON public.lessons;
CREATE POLICY "Experts can update lessons for own draft courses" ON public.lessons
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.modules m
            JOIN public.courses c ON c.id = m.course_id
            WHERE m.id = module_id
            AND c.author_id = auth.uid()
            AND c.status = 'draft'
        )
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND author_status = 'approved'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.modules m
            JOIN public.courses c ON c.id = m.course_id
            WHERE m.id = module_id
            AND c.author_id = auth.uid()
            AND c.status = 'draft'
        )
    );

-- Experts can DELETE lessons for their draft courses
DROP POLICY IF EXISTS "Experts can delete lessons for own draft courses" ON public.lessons;
CREATE POLICY "Experts can delete lessons for own draft courses" ON public.lessons
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.modules m
            JOIN public.courses c ON c.id = m.course_id
            WHERE m.id = module_id
            AND c.author_id = auth.uid()
            AND c.status = 'draft'
        )
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND author_status = 'approved'
        )
    );

-- ============================================
-- PHASE 5: RLS Policies for RESOURCES table
-- ============================================
-- Enable RLS if not already
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Public read access for resources
DROP POLICY IF EXISTS "Public resources are viewable by everyone" ON public.resources;
CREATE POLICY "Public resources are viewable by everyone" ON public.resources
    FOR SELECT
    TO public
    USING (true);

-- Experts can INSERT resources for their draft courses
DROP POLICY IF EXISTS "Experts can create resources for own draft courses" ON public.resources;
CREATE POLICY "Experts can create resources for own draft courses" ON public.resources
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = course_id
            AND c.author_id = auth.uid()
            AND c.status = 'draft'
        )
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND author_status = 'approved'
        )
    );

-- Experts can DELETE resources for their draft courses
DROP POLICY IF EXISTS "Experts can delete resources for own draft courses" ON public.resources;
CREATE POLICY "Experts can delete resources for own draft courses" ON public.resources
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = course_id
            AND c.author_id = auth.uid()
            AND c.status = 'draft'
        )
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND author_status = 'approved'
        )
    );

-- ============================================
-- SUMMARY
-- ============================================
-- Experts (author_status='approved') can now:
--   - CREATE draft courses (author_id = their user ID)
--   - UPDATE their own draft courses (can change status to pending_review)
--   - CREATE/UPDATE/DELETE modules for their draft courses
--   - CREATE/UPDATE/DELETE lessons for their draft courses
--   - CREATE/DELETE resources for their draft courses
--
-- Once status = 'pending_review', experts CANNOT edit (only admins can)
-- Admins continue using service-role client which bypasses RLS
