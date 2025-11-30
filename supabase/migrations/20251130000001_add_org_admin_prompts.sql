-- Add default prompts for Org Admin Dashboard
INSERT INTO public.prompt_suggestions (page_context, label, prompt, category, order_index)
VALUES
    ('org_admin_dashboard', 'Analyze Team Progress', 'Analyze the learning progress of my team this month. Who are the top performers, and who needs support?', 'Analytics', 0),
    ('org_admin_dashboard', 'ROI Report', 'Draft a brief report for the executive team summarizing the ROI of our learning program, focusing on certification credits earned and skills acquired.', 'Reporting', 1),
    ('org_admin_dashboard', 'Assign Training', 'Suggest a learning path for a new First-Time Manager based on our available leadership courses.', 'Management', 2),
    ('org_admin_dashboard', 'Skill Gap Analysis', 'Based on the courses my team is taking, what skills are we building, and where might we have gaps?', 'Strategy', 3);
