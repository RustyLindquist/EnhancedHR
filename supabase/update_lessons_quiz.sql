-- Add quiz_data to lessons
ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS quiz_data JSONB;

-- Example structure for quiz_data:
-- {
--   "questions": [
--     {
--       "id": "q1",
--       "text": "What is the capital of France?",
--       "options": [
--         { "id": "a", "text": "London", "isCorrect": false },
--         { "id": "b", "text": "Paris", "isCorrect": true }
--       ],
--       "explanation": "Paris is the capital..."
--     }
--   ],
--   "passingScore": 80
-- }
