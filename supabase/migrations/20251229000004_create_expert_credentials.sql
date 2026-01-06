-- Create expert_credentials table for itemized credential entries
-- Replaces the single credentials text field on profiles table

CREATE TABLE IF NOT EXISTS public.expert_credentials (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    expert_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    type text NOT NULL DEFAULT 'certification' CHECK (type IN (
        'certification',  -- Professional certifications (SHRM-SCP, PHR, etc.)
        'degree',         -- Academic degrees (MBA, PhD, etc.)
        'experience',     -- Years/type of experience
        'expertise',      -- Areas of expertise/specialization
        'publication',    -- Publications, books, articles
        'achievement'     -- Awards, recognition, honors
    )),
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_expert_credentials_expert_id ON public.expert_credentials(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_credentials_type ON public.expert_credentials(type);

-- Enable Row Level Security
ALTER TABLE public.expert_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop first if they exist to make migration idempotent)
DROP POLICY IF EXISTS "Admins can manage all credentials" ON public.expert_credentials;
DROP POLICY IF EXISTS "Public can view credentials" ON public.expert_credentials;
DROP POLICY IF EXISTS "Experts can manage own credentials" ON public.expert_credentials;

-- Admins can manage all credentials
CREATE POLICY "Admins can manage all credentials" ON public.expert_credentials
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Anyone can view credentials (for public expert pages)
CREATE POLICY "Public can view credentials" ON public.expert_credentials
    FOR SELECT USING (true);

-- Experts can manage their own credentials
CREATE POLICY "Experts can manage own credentials" ON public.expert_credentials
    FOR ALL USING (expert_id = auth.uid())
    WITH CHECK (expert_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_expert_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_expert_credentials_updated_at ON public.expert_credentials;
CREATE TRIGGER update_expert_credentials_updated_at
    BEFORE UPDATE ON public.expert_credentials
    FOR EACH ROW
    EXECUTE FUNCTION public.update_expert_credentials_updated_at();

-- Migrate existing credentials from profiles table to new expert_credentials table
-- Parse the existing comma-separated or newline-separated credentials string
-- Default all migrated credentials to 'certification' type
INSERT INTO public.expert_credentials (expert_id, title, type, display_order)
SELECT
    p.id as expert_id,
    trim(unnest(string_to_array(
        regexp_replace(p.credentials, E'[\\n\\r]+', ',', 'g'),
        ','
    ))) as title,
    'certification' as type,
    row_number() OVER (PARTITION BY p.id ORDER BY 1) as display_order
FROM public.profiles p
WHERE p.credentials IS NOT NULL
  AND p.credentials != ''
  AND p.author_status IN ('pending', 'approved', 'rejected')
ON CONFLICT DO NOTHING;

-- Clean up any empty titles that may have been created
DELETE FROM public.expert_credentials WHERE title = '' OR title IS NULL;

COMMENT ON TABLE public.expert_credentials IS 'Itemized credentials for experts with type-based icons';
COMMENT ON COLUMN public.expert_credentials.type IS 'Credential type determines display icon: certification, degree, experience, expertise, publication, achievement';
