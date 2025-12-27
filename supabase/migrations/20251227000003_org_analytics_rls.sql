-- Org Analytics RLS Policies
-- Allows Org Admins to view aggregated AI logs for their organization

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Org Admins can view org logs" ON public.ai_logs;

-- Create policy for Org Admins to view their organization's logs
-- Note: This supplements the existing admin policy
CREATE POLICY "Org Admins can view org logs" ON public.ai_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.org_id = ai_logs.org_id
            AND p.membership_status = 'org_admin'
        )
    );

-- Ensure ai_logs has org_id column (should already exist from cost tracking migration)
-- This is a no-op if column already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'ai_logs'
        AND column_name = 'org_id'
    ) THEN
        ALTER TABLE public.ai_logs ADD COLUMN org_id UUID REFERENCES public.organizations(id);
    END IF;
END $$;

-- Create index on org_id for performance
CREATE INDEX IF NOT EXISTS idx_ai_logs_org_id ON public.ai_logs(org_id);
