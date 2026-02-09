-- Add claimed_by to track which sales person/admin owns a lead
ALTER TABLE public.demo_leads
ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES public.profiles(id);

CREATE INDEX IF NOT EXISTS idx_demo_leads_claimed_by ON public.demo_leads(claimed_by);

-- Allow sales users to view all leads
CREATE POLICY "Sales users can view all leads"
ON public.demo_leads FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_sales = true
    )
);

-- Allow sales users to update leads
CREATE POLICY "Sales users can update leads"
ON public.demo_leads FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_sales = true
    )
);
