-- Add Admin fields to courses table
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
ADD COLUMN IF NOT EXISTS shrm_activity_id TEXT,
ADD COLUMN IF NOT EXISTS shrm_pdc NUMERIC(4, 2),
ADD COLUMN IF NOT EXISTS hrci_program_id TEXT,
ADD COLUMN IF NOT EXISTS hrci_credits NUMERIC(4, 2);

-- Create a storage bucket for course assets if it doesn't exist
-- Note: Storage buckets are usually created via the Supabase Dashboard or API, 
-- but we can try to insert into storage.buckets if we have permissions (often restricted).
-- For now, we'll assume the user will create 'course-assets' bucket in the dashboard.

-- Add policy for Admins to update courses (assuming 'admin' role in profiles)
CREATE POLICY "Admins can insert courses"
    ON public.courses
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'org_admin')
        )
    );

CREATE POLICY "Admins can update courses"
    ON public.courses
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'org_admin')
        )
    );

CREATE POLICY "Admins can delete courses"
    ON public.courses
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'org_admin')
        )
    );
