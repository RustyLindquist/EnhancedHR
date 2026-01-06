-- ============================================================
-- BACKEND AI INSTANCES MIGRATION
-- ============================================================
-- This migration seeds the ai_prompt_library table with all
-- backend AI instances used across the platform, allowing
-- admins to configure models for each.
-- ============================================================

-- Ensure the ai_prompt_library table has a model column (should already exist)
ALTER TABLE public.ai_prompt_library
ADD COLUMN IF NOT EXISTS model text;

-- Add has_prompt column to distinguish between prompt-based and model-only AI uses
ALTER TABLE public.ai_prompt_library
ADD COLUMN IF NOT EXISTS has_prompt boolean DEFAULT true;

-- Add category column for grouping in the UI
ALTER TABLE public.ai_prompt_library
ADD COLUMN IF NOT EXISTS category text DEFAULT 'backend';

-- ============================================================
-- UPSERT BACKEND AI INSTANCES
-- ============================================================

-- 1. Course Recommendations (has configurable prompt)
INSERT INTO public.ai_prompt_library (key, prompt_text, description, input_variables, model, has_prompt, category)
VALUES (
    'generate_recommendations',
    'You are an expert HR Learning & Development consultant.

USER PROFILE:
- Role: {role}
- Industry: {industry}
- Interests: {interests}
- AI Insights (What we know about them): {insights}

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
    model = COALESCE(EXCLUDED.model, ai_prompt_library.model),
    has_prompt = true,
    category = 'recommendations';

-- 2. Conversation Title Generation (has configurable prompt)
INSERT INTO public.ai_prompt_library (key, prompt_text, description, input_variables, model, has_prompt, category)
VALUES (
    'generate_conversation_title',
    'Based on this conversation where the user asked: "{user_message}" and the AI responded with: "{ai_response}", generate a very concise title (maximum 5 words) that captures the main topic or intent. Respond with ONLY the title, no quotes or extra text.',
    'Generates a title for AI conversations in Prometheus chat',
    ARRAY['user_message', 'ai_response'],
    'google/gemini-2.0-flash-001',
    true,
    'chat'
)
ON CONFLICT (key) DO UPDATE SET
    has_prompt = true,
    category = 'chat';

-- 3. Course Transcript Embedding (model-only, no prompt)
INSERT INTO public.ai_prompt_library (key, prompt_text, description, input_variables, model, has_prompt, category)
VALUES (
    'embed_course_transcript',
    '',
    'Generates vector embeddings for course transcripts to enable RAG search',
    ARRAY[]::text[],
    'text-embedding-004',
    false,
    'embeddings'
)
ON CONFLICT (key) DO UPDATE SET
    has_prompt = false,
    category = 'embeddings',
    model = COALESCE(ai_prompt_library.model, 'text-embedding-004');

-- 4. Context Item Embedding (model-only, no prompt)
INSERT INTO public.ai_prompt_library (key, prompt_text, description, input_variables, model, has_prompt, category)
VALUES (
    'embed_context_item',
    '',
    'Generates vector embeddings for user context items (notes, insights, files)',
    ARRAY[]::text[],
    'text-embedding-004',
    false,
    'embeddings'
)
ON CONFLICT (key) DO UPDATE SET
    has_prompt = false,
    category = 'embeddings',
    model = COALESCE(ai_prompt_library.model, 'text-embedding-004');

-- 5. File Content Embedding (model-only, no prompt)
INSERT INTO public.ai_prompt_library (key, prompt_text, description, input_variables, model, has_prompt, category)
VALUES (
    'embed_file_content',
    '',
    'Generates vector embeddings for uploaded file content (PDF, DOCX, TXT)',
    ARRAY[]::text[],
    'text-embedding-004',
    false,
    'embeddings'
)
ON CONFLICT (key) DO UPDATE SET
    has_prompt = false,
    category = 'embeddings',
    model = COALESCE(ai_prompt_library.model, 'text-embedding-004');

-- 6. Query Embedding for RAG Search (model-only, no prompt)
INSERT INTO public.ai_prompt_library (key, prompt_text, description, input_variables, model, has_prompt, category)
VALUES (
    'embed_query',
    '',
    'Generates vector embeddings for user queries during RAG search',
    ARRAY[]::text[],
    'text-embedding-004',
    false,
    'embeddings'
)
ON CONFLICT (key) DO UPDATE SET
    has_prompt = false,
    category = 'embeddings',
    model = COALESCE(ai_prompt_library.model, 'text-embedding-004');

-- ============================================================
-- VERIFY RESULTS
-- ============================================================
SELECT
    key,
    category,
    has_prompt,
    model,
    CASE WHEN prompt_text = '' THEN '(no prompt)' ELSE LEFT(prompt_text, 50) || '...' END as prompt_preview,
    description
FROM public.ai_prompt_library
ORDER BY category, key;
