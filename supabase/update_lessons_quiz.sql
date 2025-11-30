-- Add quiz_data to lessons if it doesn't exist
ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS quiz_data JSONB;

-- Create table for tracking user assessment attempts
CREATE TABLE IF NOT EXISTS public.user_assessment_attempts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  score NUMERIC(5, 2) NOT NULL, -- Percentage 0-100.00
  responses JSONB NOT NULL, -- Store user answers { "q1": "a", "q2": ["b", "c"] }
  passed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_assessment_attempts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own attempts" 
ON public.user_assessment_attempts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attempts" 
ON public.user_assessment_attempts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
