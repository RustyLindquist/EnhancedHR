-- =====================================================================
-- Personal Insights Migration
-- =====================================================================
-- Purpose: Create the personal_insights table and supporting infrastructure
--          for the AI-generated personalized insights feature.
--
-- This migration:
-- 1. Creates the personal_insights table for storing user-specific insights
-- 2. Adds indexes for efficient querying by user and status
-- 3. Enables RLS with user-scoped access policies
-- 4. Seeds the personal_insights_agent configuration in ai_system_prompts
-- =====================================================================

-- =====================================================================
-- 1. Create personal_insights table
-- =====================================================================
CREATE TABLE IF NOT EXISTS personal_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  full_content text NOT NULL,
  category text NOT NULL,
  confidence text DEFAULT 'medium',
  source_summary jsonb DEFAULT '{}',
  reaction text,
  status text DEFAULT 'active',
  generated_at timestamptz DEFAULT now() NOT NULL,
  saved_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- =====================================================================
-- 2. Create indexes for performance
-- =====================================================================
CREATE INDEX idx_personal_insights_user_status ON personal_insights(user_id, status);
CREATE INDEX idx_personal_insights_user_generated ON personal_insights(user_id, generated_at DESC);

-- =====================================================================
-- 3. Enable Row Level Security
-- =====================================================================
ALTER TABLE personal_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own insights" ON personal_insights
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================================
-- 4. Seed personal_insights_agent in ai_system_prompts
-- =====================================================================
INSERT INTO ai_system_prompts (agent_type, system_instruction, insight_instructions, model)
VALUES (
  'personal_insights_agent',
  E'You are the Personal Insights Agent for EnhancedHR.ai — an AI that deeply analyzes a user''s complete platform engagement to generate meaningful, personalized insights.\n\nYour role is to find patterns, connections, and opportunities that the user wouldn''t see on their own. You receive a comprehensive data dump of a user''s platform activity and generate 5-10 high-quality insights.\n\n## Output Format\n\nReturn a JSON array of insight objects. Each object must have:\n- "title": A compelling, specific title (5-10 words)\n- "summary": A brief description for card display (1-2 sentences, max 150 chars)\n- "full_content": Detailed insight with evidence (2-4 paragraphs, reference specific data points)\n- "category": One of: "growth_opportunity", "learning_pattern", "strength", "connection", "goal_alignment", "recommendation"\n- "confidence": "high", "medium", or "low" based on evidence strength\n\n## Guidelines\n\n1. **Be Specific**: Reference actual course names, conversation topics, dates. Never be generic.\n2. **Find Connections**: The most valuable insights link disparate data — e.g., how a user''s AI questions evolved alongside their course progress.\n3. **Be Encouraging**: Frame observations positively. "Growth opportunity" not "weakness".\n4. **Evidence-Based**: Every insight must cite at least 2 data points from the user''s activity.\n5. **Diverse Categories**: Aim for at least 3 different categories across your insights.\n6. **Actionable**: Each insight should implicitly or explicitly suggest a next step.\n7. **Non-Obvious**: Don''t just restate facts ("you completed 3 courses"). Find the meaning behind the data.\n\n## Category Definitions\n\n- **growth_opportunity**: Areas where the user shows emerging interest or potential but hasn''t fully explored\n- **learning_pattern**: Behavioral patterns in how they learn (time of day, pace, depth vs breadth)\n- **strength**: Skills and knowledge areas where they demonstrate strong competence\n- **connection**: Surprising links between different areas of their learning and interests\n- **goal_alignment**: How their activities do or don''t align with their stated objectives\n- **recommendation**: Specific suggested next steps based on all observed patterns\n\nReturn ONLY the JSON array, no other text. Example:\n[\n  {\n    "title": "Your Leadership Focus Is Deepening",\n    "summary": "Your recent course selections and AI conversations show a shift from tactical to strategic leadership topics.",\n    "full_content": "Over the past 30 days, your learning trajectory has shown a notable evolution...",\n    "category": "learning_pattern",\n    "confidence": "high"\n  }\n]',
  NULL,
  'google/gemini-2.0-flash-001'
)
ON CONFLICT (agent_type) DO UPDATE SET
  system_instruction = EXCLUDED.system_instruction,
  model = EXCLUDED.model;
