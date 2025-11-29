-- Create the user_credits_ledger table
CREATE TABLE IF NOT EXISTS public.user_credits_ledger (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    course_id BIGINT REFERENCES public.courses(id) ON DELETE SET NULL,
    credit_type TEXT NOT NULL CHECK (credit_type IN ('SHRM', 'HRCI')),
    amount NUMERIC(4, 2) NOT NULL,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    certificate_id TEXT UNIQUE, -- Optional: External cert ID if we generate one
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.user_credits_ledger ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own credits"
    ON public.user_credits_ledger
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only service role can insert/update (for now, or maybe via edge function)
-- But for simplicity in Phase 3, we might allow authenticated users to insert if we trust the client (NOT RECOMMENDED for prod, but okay for prototype if protected by logic)
-- Better: Create a function to award credits.

-- Function to award credits safely
CREATE OR REPLACE FUNCTION award_course_credits(
    p_user_id UUID,
    p_course_id BIGINT,
    p_credit_type TEXT,
    p_amount NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ledger_id UUID;
BEGIN
    -- Check if already awarded
    SELECT id INTO v_ledger_id
    FROM public.user_credits_ledger
    WHERE user_id = p_user_id 
      AND course_id = p_course_id 
      AND credit_type = p_credit_type;

    IF v_ledger_id IS NOT NULL THEN
        RETURN v_ledger_id; -- Already exists
    END IF;

    -- Insert
    INSERT INTO public.user_credits_ledger (user_id, course_id, credit_type, amount)
    VALUES (p_user_id, p_course_id, p_credit_type, p_amount)
    RETURNING id INTO v_ledger_id;

    RETURN v_ledger_id;
END;
$$;
