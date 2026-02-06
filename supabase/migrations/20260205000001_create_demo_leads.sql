-- Create demo_leads table for lead capture from /demo page
CREATE TABLE IF NOT EXISTS public.demo_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Contact info (name required, at least one of email/phone enforced in app)
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    preferred_contact TEXT NOT NULL DEFAULT 'either'
        CHECK (preferred_contact IN ('email', 'phone', 'either')),

    -- Professional info (all optional)
    job_title TEXT,
    company_name TEXT,
    employee_count TEXT
        CHECK (employee_count IS NULL OR employee_count IN ('1-50', '51-200', '201-500', '501-1000', '1000+')),

    -- Interest and timing (all optional)
    interests TEXT[] DEFAULT '{}',
    decision_timeline TEXT
        CHECK (decision_timeline IS NULL OR decision_timeline IN ('immediately', '1-3_months', '3-6_months', 'just_exploring')),
    problems_to_solve TEXT,

    -- Admin management
    status TEXT NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'closed')),
    admin_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_demo_leads_status ON public.demo_leads(status);
CREATE INDEX IF NOT EXISTS idx_demo_leads_created_at ON public.demo_leads(created_at DESC);

-- Enable RLS
ALTER TABLE public.demo_leads ENABLE ROW LEVEL SECURITY;

-- Public insert policy (no auth needed for form submission)
CREATE POLICY "Allow public insert on demo_leads" ON public.demo_leads
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Admin-only select
CREATE POLICY "Allow admin select on demo_leads" ON public.demo_leads
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Admin-only update
CREATE POLICY "Allow admin update on demo_leads" ON public.demo_leads
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
