-- ============================================================================
-- Add Audio Transcription Configuration to AI Prompt Library
-- This agent transcribes audio extracted from YouTube videos when native
-- captions are unavailable. Uses Gemini's direct audio transcription.
-- ============================================================================

INSERT INTO ai_prompt_library (key, prompt_text, description, input_variables, model, has_prompt, category)
VALUES (
    'transcribe_audio',
    'You are a professional transcription assistant. Listen to this audio carefully and produce a detailed, accurate transcript.

Guidelines:
- Transcribe all spoken words exactly as said
- Include speaker labels if there are multiple speakers (e.g., "Speaker 1:", "Speaker 2:")
- Note any significant non-verbal sounds in brackets [applause], [music], [silence]
- Break the transcript into logical paragraphs for readability
- Use proper punctuation and formatting
- Add timestamps at the beginning of each major section or speaker change (e.g., [00:00] Introduction)
- Maintain the natural flow and timing of speech
- If speech is unclear, indicate with [inaudible] rather than guessing

Produce the full transcript now:',
    'Transcribes audio extracted from YouTube videos when native captions are unavailable. Uses Gemini direct audio transcription via the Files API.',
    ARRAY['audio_file']::text[],
    'gemini-2.0-flash-001',
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
