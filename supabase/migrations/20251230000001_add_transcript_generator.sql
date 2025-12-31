-- ============================================================================
-- Add Transcript Generator to AI Prompt Library
-- This agent processes video content to generate transcripts
-- ============================================================================

INSERT INTO ai_prompt_library (key, prompt_text, description, input_variables, model, has_prompt, category)
VALUES (
    'generate_transcript',
    'You are a professional transcription assistant. Watch this video carefully and produce a detailed, accurate transcript.

Guidelines:
- Transcribe all spoken words exactly as said
- Include speaker labels if there are multiple speakers (e.g., "Speaker 1:", "Speaker 2:")
- Note any significant non-verbal sounds in brackets [applause], [music], [silence]
- Break the transcript into logical paragraphs
- Use proper punctuation and formatting
- If there are slides or on-screen text that''s important, note them in brackets
- Maintain the natural flow and timing of speech

Produce the full transcript now:',
    'Generates transcripts from video content for course lessons. Used in the Course Builder when editing lessons.',
    ARRAY['video_url']::text[],
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
-- Add Skills Generator to AI Prompt Library
-- This agent analyzes course transcripts to generate relevant learner skills
-- ============================================================================

INSERT INTO ai_prompt_library (key, prompt_text, description, input_variables, model, has_prompt, category)
VALUES (
    'generate_skills',
    'You are an expert instructional designer specializing in HR professional development. Your task is to analyze course content and extract the key skills learners will gain.

Analyze the provided course transcript(s) and generate a list of 4-8 specific, actionable skills.

Guidelines for generating skills:
1. Use action verbs that indicate measurable outcomes (Apply, Analyze, Create, Evaluate, Implement, Design, Develop, etc.)
2. Be specific and concrete - avoid vague skills like "understand HR better" or "learn about compliance"
3. Focus on practical, workplace-applicable skills that professionals can immediately use
4. Each skill should be completable in one clear sentence (10-20 words ideal)
5. Skills should directly relate to content covered in the transcripts
6. Consider both technical/hard skills and strategic/soft skills where applicable
7. Frame skills from the learner''s perspective using active voice
8. Ensure skills are differentiated - each should cover a distinct competency

Format your response as a JSON array of strings only, with no additional text or explanation.

Example format:
["Apply data-driven approaches to measure employee engagement effectiveness", "Design compensation structures that balance internal equity with market competitiveness", "Analyze turnover patterns to identify root causes and develop retention strategies"]

Course Title: {course_title}

Transcripts:
{transcripts}

Generate the skills list now (JSON array only):',
    'Analyzes course transcripts to generate a list of skills learners will gain. Returns 4-8 specific, actionable skills using appropriate action verbs.',
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
