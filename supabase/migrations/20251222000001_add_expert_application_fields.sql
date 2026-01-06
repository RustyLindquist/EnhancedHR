-- Add expert application fields to profiles table
-- These fields support the expert application workflow for pending_author users

-- Add credentials field for expert's qualifications
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS credentials text;

-- Add course proposal fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS course_proposal_title text;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS course_proposal_description text;

-- Add application status and timestamp
-- Note: author_status already exists with values (none, pending, approved, rejected)
-- We'll add a separate application_status for more granular tracking
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS application_status text DEFAULT 'draft'
CHECK (application_status IN ('draft', 'submitted', 'reviewing', 'approved', 'rejected'));

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS application_submitted_at timestamp with time zone;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.credentials IS 'Expert credentials and qualifications';
COMMENT ON COLUMN public.profiles.course_proposal_title IS 'Title of the proposed course';
COMMENT ON COLUMN public.profiles.course_proposal_description IS 'Description of the proposed course';
COMMENT ON COLUMN public.profiles.application_status IS 'Status of expert application: draft, submitted, reviewing, approved, rejected';
COMMENT ON COLUMN public.profiles.application_submitted_at IS 'Timestamp when application was submitted';
