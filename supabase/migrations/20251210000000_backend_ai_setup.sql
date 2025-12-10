CREATE TABLE IF NOT EXISTS ai_prompt_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    prompt_text TEXT NOT NULL,
    description TEXT,
    input_variables TEXT[],
    model TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ai_prompt_library ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users (admin logic usually handles write, but for now we allow all authenticated to read)
CREATE POLICY "Allow read access to authenticated users" ON ai_prompt_library
    FOR SELECT TO authenticated USING (true);

-- Allow full access to service role (and potentially admins if we check role)
-- For simplicity in this prototype, we'll allow authenticated to update/insert for now or rely on Service Role for specific admin actions if the UI uses it.
-- Actually the Admin Panel usually uses client-side auth. Let's allowing all authenticated users to manage it for this prototype environment as 'admin' role isn't strictly enforced at RLS level in many prototypes.
CREATE POLICY "Allow full access to authenticated users" ON ai_prompt_library
    FOR ALL TO authenticated USING (true);


-- Initial Seed for Backend AI Agent
INSERT INTO ai_system_prompts (agent_type, system_instruction, model)
VALUES (
    'backend_ai', 
    'You are the Backend AI Assistant for EnhancedHR. Your role is to perform specific processing tasks such as summarization, extraction, and content analysis. Always output valid JSON when requested.', 
    'google/gemini-2.0-flash-001'
) ON CONFLICT (agent_type) DO NOTHING;

-- Initial Seed for Prompt Library
INSERT INTO ai_prompt_library (key, prompt_text, description, input_variables, model)
VALUES 
(
    'generate_recommendations',
    'You are an expert HR Learning & Development consultant.\n\nUSER PROFILE:\n- Role: {role}\n- Industry: {industry}\n- Interests: {interests}\n- AI Insights: {insights}\n\nAVAILABLE COURSES:\n{course_list}\n\nTASK:\nSelect exactly 4 courses from the list above that are most relevant to this user''s profile and learning needs.\nReturn ONLY a JSON array of the 4 Course IDs. Do not include any explanation or markdown formatting.\nExample: [1, 5, 12, 3]',
    'Generates course recommendations based on user profile',
    ARRAY['{role}', '{industry}', '{interests}', '{insights}', '{course_list}'],
    'google/gemma-2-27b-it:free'
)
ON CONFLICT (key) DO NOTHING;
