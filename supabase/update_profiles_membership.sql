-- Add membership fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_minutes_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS org_id UUID, -- References an organizations table (to be created later or mocked)
ADD COLUMN IF NOT EXISTS membership_status TEXT DEFAULT 'trial' CHECK (membership_status IN ('trial', 'active', 'inactive', 'employee', 'org_admin'));

-- Create an organizations table (basic version for Phase 4)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    invite_hash TEXT NOT NULL, -- For the secure join URL
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK constraint to profiles if not already there (safe to run multiple times if checked)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_org_id_fkey') THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_org_id_fkey
        FOREIGN KEY (org_id)
        REFERENCES public.organizations(id)
        ON DELETE SET NULL;
    END IF;
END;
$$;

-- Policy for Organization Access (Basic)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view orgs by slug (for invite page)"
    ON public.organizations
    FOR SELECT
    USING (true); -- In real app, might restrict to only slug/name lookup

-- Function to increment trial minutes
CREATE OR REPLACE FUNCTION increment_trial_minutes(p_user_id UUID, p_minutes INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.profiles
    SET trial_minutes_used = COALESCE(trial_minutes_used, 0) + p_minutes
    WHERE id = p_user_id;
END;
$$;
