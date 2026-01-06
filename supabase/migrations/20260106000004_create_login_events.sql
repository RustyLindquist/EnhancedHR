-- Create login_events table to track user logins for analytics
-- This enables org admins to see login trends over time

CREATE TABLE IF NOT EXISTS public.login_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_agent TEXT,
    ip_address INET
);

-- Index for efficient querying by user
CREATE INDEX IF NOT EXISTS idx_login_events_user_id ON public.login_events(user_id);

-- Index for org-scoped queries with date filtering
CREATE INDEX IF NOT EXISTS idx_login_events_org_date ON public.login_events(org_id, created_at DESC);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_login_events_created_at ON public.login_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can see their own login events
CREATE POLICY "Users can view own login events"
    ON public.login_events FOR SELECT
    USING (auth.uid() = user_id);

-- Org admins can view login events for their org members
CREATE POLICY "Org admins can view org login events"
    ON public.login_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.org_id = login_events.org_id
            AND (p.role = 'admin' OR p.membership_status = 'org_admin')
        )
    );

-- Platform admins can view all login events
CREATE POLICY "Admins can view all login events"
    ON public.login_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Service role can insert (for server-side login tracking)
CREATE POLICY "Service role can insert login events"
    ON public.login_events FOR INSERT
    WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON public.login_events TO authenticated;
GRANT INSERT ON public.login_events TO service_role;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
