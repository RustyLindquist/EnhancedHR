-- ============================================================================
-- PRODUCTION SYNC SCRIPT - December 26, 2025
-- Run this in Supabase SQL Editor to enable AI Insight System
-- ============================================================================

-- ============================================================================
-- STEP 1: Add auto_insights setting to profiles
-- This allows users to toggle between manual approval and automatic insight capture
-- ============================================================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS auto_insights BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.profiles.auto_insights IS 'When true, AI insights are automatically saved. When false (default), user must approve each insight.';

-- ============================================================================
-- STEP 2: Add insight_instructions column to ai_system_prompts
-- This stores the insight training appendix separately from the base system prompt
-- ============================================================================
ALTER TABLE public.ai_system_prompts
ADD COLUMN IF NOT EXISTS insight_instructions TEXT DEFAULT '';

COMMENT ON COLUMN public.ai_system_prompts.insight_instructions IS 'Separate insight training instructions appended to system_instruction at runtime. Editable via Admin Console for easy testing and refinement.';

-- ============================================================================
-- VERIFICATION: Check that both columns exist
-- ============================================================================
SELECT
    'profiles.auto_insights' as column_check,
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'auto_insights'
    ) as exists;

SELECT
    'ai_system_prompts.insight_instructions' as column_check,
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ai_system_prompts'
        AND column_name = 'insight_instructions'
    ) as exists;

-- ============================================================================
-- DONE!
--
-- Next Steps:
-- 1. Go to Admin Console > AI Agents
-- 2. Select each agent (Platform Assistant, Course Tutor, etc.)
-- 3. Click the "Insight Training" tab
-- 4. Click "Load Default" to populate the comprehensive training instructions
-- 5. Click "Save Changes"
-- 6. Repeat for each agent
--
-- The insight training instructions teach each agent:
-- - Trigger patterns for when to capture insights
-- - Quality examples (good vs bad insights)
-- - Confidence calibration (HIGH/MEDIUM/LOW)
-- - Category disambiguation
-- - Privacy rules
-- - How to naturally reference insights in responses
-- ============================================================================
