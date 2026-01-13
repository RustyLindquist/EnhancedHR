-- Create standalone_experts table for expert profiles not tied to user accounts
-- These are experts whose content we host but who don't have active accounts

CREATE TABLE IF NOT EXISTS public.standalone_experts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name text NOT NULL,
    email text,  -- For reference only, not a login
    avatar_url text,
    expert_title text,
    author_bio text,
    phone_number text,
    linkedin_url text,
    twitter_url text,
    website_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES public.profiles(id)  -- Admin who created the record
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_standalone_experts_is_active ON public.standalone_experts(is_active);
CREATE INDEX IF NOT EXISTS idx_standalone_experts_created_at ON public.standalone_experts(created_at);

-- Enable Row Level Security
ALTER TABLE public.standalone_experts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can manage all standalone experts
CREATE POLICY "Admins can manage standalone experts" ON public.standalone_experts
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Anyone can view active standalone experts (for public expert pages)
CREATE POLICY "Public can view active standalone experts" ON public.standalone_experts
    FOR SELECT USING (is_active = true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_standalone_experts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_standalone_experts_updated_at ON public.standalone_experts;
CREATE TRIGGER update_standalone_experts_updated_at
    BEFORE UPDATE ON public.standalone_experts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_standalone_experts_updated_at();

-- Add standalone_expert_id to courses table as alternative to author_id
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS standalone_expert_id uuid REFERENCES public.standalone_experts(id);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_courses_standalone_expert_id ON public.courses(standalone_expert_id);

-- Add constraint to ensure course has exactly one author type (either regular or standalone)
-- Note: We allow both to be NULL for courses in creation, but not both to be set
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_author_xor_standalone;
ALTER TABLE public.courses ADD CONSTRAINT courses_author_xor_standalone
    CHECK (NOT (author_id IS NOT NULL AND standalone_expert_id IS NOT NULL));

COMMENT ON TABLE public.standalone_experts IS 'Expert profiles not tied to user accounts - for content from experts no longer with the platform';
COMMENT ON COLUMN public.courses.standalone_expert_id IS 'UUID of standalone expert (alternative to author_id for non-user experts)';

-- Create standalone_expert_credentials table
-- Mirrors expert_credentials but for standalone experts
CREATE TABLE IF NOT EXISTS public.standalone_expert_credentials (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    standalone_expert_id uuid NOT NULL REFERENCES public.standalone_experts(id) ON DELETE CASCADE,
    title text NOT NULL,
    type text NOT NULL DEFAULT 'certification' CHECK (type IN (
        'certification',
        'degree',
        'experience',
        'expertise',
        'publication',
        'achievement'
    )),
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_standalone_expert_credentials_expert_id ON public.standalone_expert_credentials(standalone_expert_id);
CREATE INDEX IF NOT EXISTS idx_standalone_expert_credentials_type ON public.standalone_expert_credentials(type);

-- Enable RLS
ALTER TABLE public.standalone_expert_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for standalone expert credentials
CREATE POLICY "Admins can manage standalone expert credentials" ON public.standalone_expert_credentials
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Public can view standalone expert credentials" ON public.standalone_expert_credentials
    FOR SELECT USING (true);

-- Create trigger for updated_at on credentials
CREATE OR REPLACE FUNCTION public.update_standalone_expert_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_standalone_expert_credentials_updated_at ON public.standalone_expert_credentials;
CREATE TRIGGER update_standalone_expert_credentials_updated_at
    BEFORE UPDATE ON public.standalone_expert_credentials
    FOR EACH ROW
    EXECUTE FUNCTION public.update_standalone_expert_credentials_updated_at();

COMMENT ON TABLE public.standalone_expert_credentials IS 'Credentials for standalone experts (not tied to user accounts)';
