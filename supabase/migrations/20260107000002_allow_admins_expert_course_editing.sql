-- Allow Platform Admins to use Expert Course Editing
-- Admins should be able to create/edit courses via the Expert Dashboard
-- This updates RLS policies to check for role='admin' in addition to author_status='approved'

-- ============================================
-- PHASE 1: Update COURSES RLS Policies
-- ============================================

-- Experts/Admins can INSERT new draft courses (their own)
DROP POLICY IF EXISTS "Experts can create draft courses" ON public.courses;
CREATE POLICY "Experts can create draft courses" ON public.courses
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Must be the author
        author_id = auth.uid()
        -- Must start as draft
        AND status = 'draft'
        -- Must be an approved expert OR admin
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND (author_status = 'approved' OR role = 'admin')
        )
    );

-- Experts/Admins can UPDATE their own draft courses
DROP POLICY IF EXISTS "Experts can update own draft courses" ON public.courses;
CREATE POLICY "Experts can update own draft courses" ON public.courses
    FOR UPDATE
    TO authenticated
    USING (
        -- Must own the course
        author_id = auth.uid()
        -- Course must be in draft status
        AND status = 'draft'
        -- Must be an approved expert OR admin
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND (author_status = 'approved' OR role = 'admin')
        )
    )
    WITH CHECK (
        -- Must remain owned by same author
        author_id = auth.uid()
        -- Can only change to draft or pending_review (not published/archived)
        AND status IN ('draft', 'pending_review')
    );

-- ============================================
-- PHASE 2: Update MODULES RLS Policies
-- ============================================

-- Experts/Admins can INSERT modules for their draft courses
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
            WHERE id = auth.uid()
            AND (author_status = 'approved' OR role = 'admin')
        )
    );

-- Experts/Admins can UPDATE modules for their draft courses
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
            WHERE id = auth.uid()
            AND (author_status = 'approved' OR role = 'admin')
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

-- Experts/Admins can DELETE modules for their draft courses
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
            WHERE id = auth.uid()
            AND (author_status = 'approved' OR role = 'admin')
        )
    );

-- ============================================
-- PHASE 3: Update LESSONS RLS Policies
-- ============================================

-- Experts/Admins can INSERT lessons for their draft courses
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
            WHERE id = auth.uid()
            AND (author_status = 'approved' OR role = 'admin')
        )
    );

-- Experts/Admins can UPDATE lessons for their draft courses
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
            WHERE id = auth.uid()
            AND (author_status = 'approved' OR role = 'admin')
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

-- Experts/Admins can DELETE lessons for their draft courses
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
            WHERE id = auth.uid()
            AND (author_status = 'approved' OR role = 'admin')
        )
    );

-- ============================================
-- PHASE 4: Update RESOURCES RLS Policies
-- ============================================

-- Experts/Admins can INSERT resources for their draft courses
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
            WHERE id = auth.uid()
            AND (author_status = 'approved' OR role = 'admin')
        )
    );

-- Experts/Admins can DELETE resources for their draft courses
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
            WHERE id = auth.uid()
            AND (author_status = 'approved' OR role = 'admin')
        )
    );
