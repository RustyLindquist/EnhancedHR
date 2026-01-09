-- Fix: Add RLS policy for authenticated users to view organizations
-- Previously only 'public' role could select, causing "No Organization Found" errors
-- for authenticated users

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'organizations'
        AND policyname = 'Authenticated users can view organizations'
    ) THEN
        CREATE POLICY "Authenticated users can view organizations"
        ON public.organizations
        FOR SELECT
        TO authenticated
        USING (true);
    END IF;
END
$$;
