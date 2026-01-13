-- Organization Courses RLS Policies
-- Update courses table RLS to handle org-specific course visibility and access control

-- ============================================
-- PHASE 1: Drop existing policies
-- ============================================
-- We need to drop existing policies before creating new ones

DROP POLICY IF EXISTS "Public courses are viewable by everyone" ON public.courses;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.courses;
DROP POLICY IF EXISTS "Enable write access for admins" ON public.courses;
DROP POLICY IF EXISTS "Experts can create draft courses" ON public.courses;
DROP POLICY IF EXISTS "Experts can update own draft courses" ON public.courses;

-- ============================================
-- PHASE 2: SELECT Policy
-- ============================================
-- Visibility rules:
-- 1. Platform admins (role='admin') can see ALL courses
-- 2. Published platform courses (org_id IS NULL, status='published') visible to all authenticated users
-- 3. Org courses visible to members of that org
-- 4. Authors can see their own draft/pending courses

CREATE POLICY "courses_select_policy" ON public.courses
    FOR SELECT
    TO authenticated
    USING (
        -- Platform admins can see everything
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
        OR
        -- Published platform courses (no org) visible to all
        (org_id IS NULL AND status = 'published')
        OR
        -- Org courses visible to org members
        (
            org_id IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND profiles.org_id = courses.org_id
            )
        )
        OR
        -- Authors can see their own courses (any status)
        author_id = auth.uid()
    );

-- ============================================
-- PHASE 3: INSERT Policy
-- ============================================
-- Insert rules:
-- 1. Platform admins can insert any course
-- 2. Org admins can insert courses for their org only
-- 3. Approved experts can insert their own draft platform courses

CREATE POLICY "courses_insert_policy" ON public.courses
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Platform admins can insert any course
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
        OR
        -- Org admins can create courses for their org
        (
            org_id IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND profiles.org_id = courses.org_id
                AND profiles.membership_status = 'org_admin'
            )
        )
        OR
        -- Approved experts can create their own draft platform courses
        (
            author_id = auth.uid()
            AND status = 'draft'
            AND org_id IS NULL
            AND EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND (author_status = 'approved' OR role = 'admin')
            )
        )
    );

-- ============================================
-- PHASE 4: UPDATE Policy
-- ============================================
-- Update rules:
-- 1. Platform admins can update any course
-- 2. Org admins can update courses belonging to their org
-- 3. Approved experts can update their own draft courses

CREATE POLICY "courses_update_policy" ON public.courses
    FOR UPDATE
    TO authenticated
    USING (
        -- Platform admins can update any course
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
        OR
        -- Org admins can update their org's courses
        (
            org_id IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND profiles.org_id = courses.org_id
                AND profiles.membership_status = 'org_admin'
            )
        )
        OR
        -- Authors can update their own draft courses
        (
            author_id = auth.uid()
            AND status = 'draft'
            AND EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND (author_status = 'approved' OR role = 'admin')
            )
        )
    )
    WITH CHECK (
        -- Platform admins can set any values
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
        OR
        -- Org admins can update their org's courses (must keep same org)
        (
            org_id IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND profiles.org_id = courses.org_id
                AND profiles.membership_status = 'org_admin'
            )
        )
        OR
        -- Authors can only set to draft/pending_review, must remain author
        (
            author_id = auth.uid()
            AND status IN ('draft', 'pending_review')
        )
    );

-- ============================================
-- PHASE 5: DELETE Policy
-- ============================================
-- Delete rules:
-- 1. Platform admins can delete any course
-- 2. Org admins can delete courses belonging to their org

CREATE POLICY "courses_delete_policy" ON public.courses
    FOR DELETE
    TO authenticated
    USING (
        -- Platform admins can delete any course
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
        OR
        -- Org admins can delete their org's courses
        (
            org_id IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND profiles.org_id = courses.org_id
                AND profiles.membership_status = 'org_admin'
            )
        )
    );

-- ============================================
-- SUMMARY
-- ============================================
-- SELECT: Platform admins see all, authenticated see published platform courses,
--         org members see their org's courses, authors see their own courses
-- INSERT: Platform admins can insert any, org admins for their org, experts for their own drafts
-- UPDATE: Platform admins can update any, org admins their org's courses, experts their drafts
-- DELETE: Platform admins and org admins only
