-- Create ai_logs table
CREATE TABLE IF NOT EXISTS public.ai_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id text, -- Can be null for single-turn interactions
    agent_type text NOT NULL,
    page_context text,
    prompt text NOT NULL,
    response text,
    metadata jsonb DEFAULT '{}'::jsonb, -- Stores sources, tokens, etc.
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

-- Policies

-- Admins can view all logs
CREATE POLICY "Admins can view all ai_logs" ON public.ai_logs
    FOR SELECT
    TO authenticated
    USING (
        (SELECT role FROM auth.users WHERE id = auth.uid()) = 'service_role' OR
        (auth.jwt() ->> 'role') = 'service_role' OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND (role = 'admin' OR role = 'org_admin') -- Org admins might need to see their org's logs? For now let's stick to platform admin.
        )
    );

-- Platform Admins only for now based on request "Platform Administrators to view all AI conversation logs"
-- Let's refine the policy to be strict for Platform Admins.

DROP POLICY IF EXISTS "Admins can view all ai_logs" ON public.ai_logs;

CREATE POLICY "Platform Admins can view all ai_logs" ON public.ai_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Users can view their own logs (optional, but good for history)
CREATE POLICY "Users can view their own ai_logs" ON public.ai_logs
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
    );

-- Service role can insert (for API route)
CREATE POLICY "Service role can insert ai_logs" ON public.ai_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true); -- API route uses service role or authenticated user. If authenticated user inserts, we need a policy.

-- Allow users to insert their own logs (if client-side logging, but we are doing server-side)
-- Since we are doing server-side logging in the API route, the API route runs as the user (usually) or we can use service role.
-- If the API route uses `supabase.auth.getUser()`, it acts as the user.
-- So we need an insert policy for users.

CREATE POLICY "Users can insert their own ai_logs" ON public.ai_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid()
    );
