-- Seed Backend AI Agents for ai_prompt_library
-- These are used for various backend processing tasks and must persist through database resets

-- Add columns for category and has_prompt if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_prompt_library' AND column_name = 'has_prompt') THEN
        ALTER TABLE ai_prompt_library ADD COLUMN has_prompt BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_prompt_library' AND column_name = 'category') THEN
        ALTER TABLE ai_prompt_library ADD COLUMN category TEXT DEFAULT 'backend';
    END IF;
END $$;

-- Update existing generate_recommendations with category if it exists
UPDATE ai_prompt_library
SET category = 'recommendations'
WHERE key = 'generate_recommendations' AND (category IS NULL OR category = 'backend');

-- Seed all Backend AI Agents
-- 1. Generate Recommendations (if not exists from earlier migration)
INSERT INTO ai_prompt_library (key, prompt_text, description, input_variables, model, has_prompt, category)
VALUES (
    'generate_recommendations',
    'You are an expert HR Learning & Development consultant.

USER PROFILE:
- Role: {role}
- Industry: {industry}
- Interests: {interests}
- AI Insights: {insights}

AVAILABLE COURSES:
{course_list}

TASK:
Select exactly 4 courses from the list above that are most relevant to this user''s profile and learning needs.
Return ONLY a JSON array of the 4 Course IDs. Do not include any explanation or markdown formatting.
Example: [1, 5, 12, 3]',
    'Generates personalized course recommendations based on user profile',
    ARRAY['role', 'industry', 'interests', 'insights', 'course_list'],
    'google/gemini-2.0-flash-001',
    true,
    'recommendations'
)
ON CONFLICT (key) DO UPDATE SET
    category = 'recommendations',
    has_prompt = true;

-- 2. Generate Conversation Title
INSERT INTO ai_prompt_library (key, prompt_text, description, input_variables, model, has_prompt, category)
VALUES (
    'generate_conversation_title',
    'Based on this conversation where the user asked: "{user_message}" and the assistant responded with: "{assistant_response}", generate a very concise title (maximum 5 words) that captures the main topic or intent. Respond with ONLY the title, no quotes or extra text.',
    'Generates concise titles for chat conversations',
    ARRAY['user_message', 'assistant_response'],
    'google/gemini-2.0-flash-001',
    true,
    'chat'
)
ON CONFLICT (key) DO UPDATE SET
    category = 'chat',
    has_prompt = true;

-- 3. Embed Context Item (Model Only - for embedding user context items)
INSERT INTO ai_prompt_library (key, prompt_text, description, input_variables, model, has_prompt, category)
VALUES (
    'embed_context_item',
    '',
    'Model used for generating embeddings for user context items (notes, profiles, custom text)',
    ARRAY[]::TEXT[],
    'google/gemini-2.0-flash-001',
    false,
    'embeddings'
)
ON CONFLICT (key) DO UPDATE SET
    category = 'embeddings',
    has_prompt = false;

-- 4. Embed Course Transcript (Model Only - for embedding course transcripts)
INSERT INTO ai_prompt_library (key, prompt_text, description, input_variables, model, has_prompt, category)
VALUES (
    'embed_course_transcript',
    '',
    'Model used for generating embeddings for course transcripts and lesson content',
    ARRAY[]::TEXT[],
    'google/gemini-2.0-flash-001',
    false,
    'embeddings'
)
ON CONFLICT (key) DO UPDATE SET
    category = 'embeddings',
    has_prompt = false;

-- 5. Embed File Content (Model Only - for embedding uploaded files)
INSERT INTO ai_prompt_library (key, prompt_text, description, input_variables, model, has_prompt, category)
VALUES (
    'embed_file_content',
    '',
    'Model used for generating embeddings for uploaded file content (PDFs, documents, etc.)',
    ARRAY[]::TEXT[],
    'google/gemini-2.0-flash-001',
    false,
    'embeddings'
)
ON CONFLICT (key) DO UPDATE SET
    category = 'embeddings',
    has_prompt = false;

-- 6. Embed Query (Model Only - for embedding user search queries)
INSERT INTO ai_prompt_library (key, prompt_text, description, input_variables, model, has_prompt, category)
VALUES (
    'embed_query',
    '',
    'Model used for generating embeddings for user search queries in RAG retrieval',
    ARRAY[]::TEXT[],
    'google/gemini-2.0-flash-001',
    false,
    'embeddings'
)
ON CONFLICT (key) DO UPDATE SET
    category = 'embeddings',
    has_prompt = false;
