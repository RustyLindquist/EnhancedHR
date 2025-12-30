-- Create course_proposals table for supporting multiple proposals per expert
-- This replaces the single proposal fields on profiles table

CREATE TABLE IF NOT EXISTS public.course_proposals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    expert_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'converted')),
    admin_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    reviewed_at timestamp with time zone,
    reviewed_by uuid REFERENCES public.profiles(id)
);

-- Create index for efficient expert lookups
CREATE INDEX IF NOT EXISTS idx_course_proposals_expert_id ON public.course_proposals(expert_id);

-- Enable Row Level Security
ALTER TABLE public.course_proposals ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop first if they exist to make migration idempotent)

DROP POLICY IF EXISTS "Admins can manage all proposals" ON public.course_proposals;
DROP POLICY IF EXISTS "Experts can view own proposals" ON public.course_proposals;
DROP POLICY IF EXISTS "Experts can insert own proposals" ON public.course_proposals;
DROP POLICY IF EXISTS "Experts can update own pending proposals" ON public.course_proposals;

-- Admins can manage all proposals
CREATE POLICY "Admins can manage all proposals" ON public.course_proposals
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Experts can view their own proposals
CREATE POLICY "Experts can view own proposals" ON public.course_proposals
    FOR SELECT USING (expert_id = auth.uid());

-- Experts can insert their own proposals
CREATE POLICY "Experts can insert own proposals" ON public.course_proposals
    FOR INSERT WITH CHECK (expert_id = auth.uid());

-- Experts can update their own pending proposals
CREATE POLICY "Experts can update own pending proposals" ON public.course_proposals
    FOR UPDATE USING (expert_id = auth.uid() AND status = 'pending')
    WITH CHECK (expert_id = auth.uid());

-- Add approved_at column to profiles for tracking when expert was approved
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;

COMMENT ON COLUMN public.profiles.approved_at IS 'Timestamp when expert was approved by admin';

-- Add author_id column to courses table to link courses to expert profiles
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES public.profiles(id);

-- Create index for efficient author lookups
CREATE INDEX IF NOT EXISTS idx_courses_author_id ON public.courses(author_id);

COMMENT ON COLUMN public.courses.author_id IS 'UUID of the expert who authored this course';

-- Migrate existing proposals from profiles table to new course_proposals table
-- Only migrate if there's actual proposal data
INSERT INTO public.course_proposals (expert_id, title, description, status, created_at)
SELECT
    id as expert_id,
    course_proposal_title as title,
    course_proposal_description as description,
    CASE
        WHEN author_status = 'approved' THEN 'approved'
        WHEN author_status = 'rejected' THEN 'rejected'
        ELSE 'pending'
    END as status,
    COALESCE(application_submitted_at, created_at) as created_at
FROM public.profiles
WHERE course_proposal_title IS NOT NULL
  AND course_proposal_title != ''
  AND author_status IN ('pending', 'approved', 'rejected')
ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_course_proposal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_course_proposals_updated_at ON public.course_proposals;
CREATE TRIGGER update_course_proposals_updated_at
    BEFORE UPDATE ON public.course_proposals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_course_proposal_updated_at();
