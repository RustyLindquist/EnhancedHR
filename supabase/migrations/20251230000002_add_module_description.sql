-- ============================================================================
-- Add description column to modules table
-- ============================================================================

ALTER TABLE modules ADD COLUMN IF NOT EXISTS description TEXT;

-- ============================================================================
-- Add Course Description Generator to AI Prompt Library
-- ============================================================================

INSERT INTO ai_prompt_library (key, prompt_text, description, input_variables, model, has_prompt, category)
VALUES (
    'generate_course_description',
    'You are an expert course marketing copywriter specializing in professional development and HR education. Your task is to write a compelling course description that will attract and inform potential learners.

Analyze the provided course transcript(s) and generate an engaging course description.

Guidelines:
1. Start with a strong hook that captures attention and highlights the value proposition
2. Clearly explain what learners will gain from this course
3. Highlight the practical, real-world applications of the content
4. Use professional but accessible language appropriate for HR professionals
5. Keep the description between 150-250 words - concise but comprehensive
6. Structure with a brief intro paragraph, key takeaways, and who should take this course
7. Avoid generic phrases like "this comprehensive course" - be specific about the content
8. End with a motivating call-to-action or benefit statement

Format: Return ONLY the description text, no JSON formatting or additional commentary.

Course Title: {course_title}

Course Content (transcripts from all lessons):
{transcripts}

Write the course description now:',
    'Generates compelling marketing descriptions for courses based on lesson transcripts. Creates engaging copy that highlights value proposition and learning outcomes.',
    ARRAY['course_title', 'transcripts']::text[],
    'google/gemini-2.0-flash-001',
    true,
    'backend'
)
ON CONFLICT (key) DO UPDATE SET
    prompt_text = EXCLUDED.prompt_text,
    description = EXCLUDED.description,
    input_variables = EXCLUDED.input_variables,
    model = EXCLUDED.model,
    has_prompt = EXCLUDED.has_prompt,
    category = EXCLUDED.category,
    updated_at = NOW();

-- ============================================================================
-- Add Module Description Generator to AI Prompt Library
-- ============================================================================

INSERT INTO ai_prompt_library (key, prompt_text, description, input_variables, model, has_prompt, category)
VALUES (
    'generate_module_description',
    'You are an expert instructional designer creating module summaries for professional development courses.

Analyze the lesson transcripts from this module and generate a concise, informative module description.

Guidelines:
1. Summarize the key topics and concepts covered in this module
2. Keep it brief - 2-4 sentences, approximately 50-100 words
3. Focus on what learners will learn and be able to do after completing this module
4. Use clear, professional language
5. Make it scannable - learners should quickly understand what this module covers
6. Avoid repeating the module title - add new information

Format: Return ONLY the description text, no JSON formatting or additional commentary.

Module Title: {module_title}

Lesson Transcripts:
{transcripts}

Write the module description now:',
    'Generates concise module descriptions by summarizing lesson content. Creates scannable summaries that help learners understand module objectives.',
    ARRAY['module_title', 'transcripts']::text[],
    'google/gemini-2.0-flash-001',
    true,
    'backend'
)
ON CONFLICT (key) DO UPDATE SET
    prompt_text = EXCLUDED.prompt_text,
    description = EXCLUDED.description,
    input_variables = EXCLUDED.input_variables,
    model = EXCLUDED.model,
    has_prompt = EXCLUDED.has_prompt,
    category = EXCLUDED.category,
    updated_at = NOW();
