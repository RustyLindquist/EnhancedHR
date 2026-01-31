-- Fix ai_prompt_library RLS - restrict writes to admins only
-- Issue: "Allow full access to authenticated users" policy is overly permissive

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.ai_prompt_library;

-- Keep the read policy (all authenticated users need to read prompts for AI features)
-- Policy "Allow read access to authenticated users" already exists and is appropriate

-- Add admin-only write policies
CREATE POLICY "Admins can insert prompts"
ON public.ai_prompt_library
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

CREATE POLICY "Admins can update prompts"
ON public.ai_prompt_library
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

CREATE POLICY "Admins can delete prompts"
ON public.ai_prompt_library
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Service role always has full access (for server-side operations)
CREATE POLICY "Service role has full access to prompts"
ON public.ai_prompt_library
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
