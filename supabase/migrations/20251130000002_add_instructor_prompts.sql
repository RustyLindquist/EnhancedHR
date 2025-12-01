-- Update check constraint to allow instructor_dashboard
ALTER TABLE public.prompt_suggestions DROP CONSTRAINT IF EXISTS prompt_suggestions_page_context_check;

ALTER TABLE public.prompt_suggestions 
ADD CONSTRAINT prompt_suggestions_page_context_check 
CHECK (page_context IN ('user_dashboard', 'employee_dashboard', 'org_admin_dashboard', 'instructor_dashboard'));

-- Add default prompt suggestions for Instructor Dashboard
INSERT INTO public.prompt_suggestions (page_context, label, prompt, category, order_index) VALUES
('instructor_dashboard', 'Analyze my performance', 'Analyze the performance of my courses this month compared to last month.', 'Analytics', 0),
('instructor_dashboard', 'Trending Topics', 'What are the top trending HR topics right now that I should create content about?', 'Inspiration', 1),
('instructor_dashboard', 'Draft Course Outline', 'Help me draft a course outline for a new course on "AI in HR".', 'Content Creation', 2),
('instructor_dashboard', 'Explain Earnings', 'How are my earnings calculated?', 'Financials', 3);
