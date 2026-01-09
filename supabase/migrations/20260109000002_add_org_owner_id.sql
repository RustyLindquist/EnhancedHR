-- Add owner_id to organizations table if it doesn't exist
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id);

CREATE INDEX IF NOT EXISTS idx_organizations_owner_id
ON public.organizations(owner_id);

COMMENT ON COLUMN public.organizations.owner_id IS
'The user who owns this organization (can transfer ownership)';
