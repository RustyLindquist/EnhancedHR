-- Migrate existing 'closed' rows to 'closed_won'
UPDATE public.demo_leads SET status = 'closed_won' WHERE status = 'closed';

-- Drop existing CHECK constraint and add new one with split statuses
ALTER TABLE public.demo_leads DROP CONSTRAINT IF EXISTS demo_leads_status_check;
ALTER TABLE public.demo_leads ADD CONSTRAINT demo_leads_status_check
    CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'closed_won', 'closed_lost'));
