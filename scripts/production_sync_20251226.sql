-- ============================================================================
-- PRODUCTION SYNC SCRIPT - December 26, 2025
-- Run this in Supabase SQL Editor to enable AI Insight System
-- ============================================================================

-- ============================================================================
-- STEP 1: Add insight settings to profiles
-- enable_insights: Master toggle for the AI insight system (default true)
-- auto_insights: When true, insights are auto-saved without user approval (default false)
-- ============================================================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS enable_insights BOOLEAN DEFAULT TRUE;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS auto_insights BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.profiles.enable_insights IS 'Master toggle for AI insight identification. When false, Prometheus will not attempt to identify insights during conversations.';
COMMENT ON COLUMN public.profiles.auto_insights IS 'When true, AI insights are automatically saved. When false (default), user must approve each insight.';

-- ============================================================================
-- STEP 2: Add insight_instructions column to ai_system_prompts
-- This stores the insight training appendix separately from the base system prompt
-- ============================================================================
ALTER TABLE public.ai_system_prompts
ADD COLUMN IF NOT EXISTS insight_instructions TEXT DEFAULT '';

COMMENT ON COLUMN public.ai_system_prompts.insight_instructions IS 'Separate insight training instructions appended to system_instruction at runtime. Editable via Admin Console for easy testing and refinement.';

-- ============================================================================
-- VERIFICATION: Check that all columns exist
-- ============================================================================
SELECT
    'profiles.enable_insights' as column_check,
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'enable_insights'
    ) as exists;

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
-- STEP 3: Create help_topics table for Help Collection
-- Stores metadata for help cards with content text for RAG embedding
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.help_topics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,           -- 'ai-insights', 'collections', etc.
    title TEXT NOT NULL,
    summary TEXT NOT NULL,               -- Card preview text (shown on card)
    category TEXT,                       -- 'AI Features', 'Collections', 'Learning', 'Platform'
    content_text TEXT NOT NULL,          -- Plain text version for RAG embedding
    icon_name TEXT,                      -- Lucide icon name for card display
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.help_topics ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated users can read active help topics
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'help_topics'
        AND policyname = 'Authenticated users can read help topics'
    ) THEN
        CREATE POLICY "Authenticated users can read help topics"
            ON public.help_topics FOR SELECT TO authenticated
            USING (is_active = true);
    END IF;
END $$;

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_help_topics_slug ON public.help_topics(slug);
CREATE INDEX IF NOT EXISTS idx_help_topics_category ON public.help_topics(category);
CREATE INDEX IF NOT EXISTS idx_help_topics_order ON public.help_topics(display_order);

-- Comments for documentation
COMMENT ON TABLE public.help_topics IS 'Help collection topics for platform feature documentation and AI-powered help';
COMMENT ON COLUMN public.help_topics.slug IS 'URL-safe identifier matching HelpTopicId in HelpContent.tsx';
COMMENT ON COLUMN public.help_topics.summary IS 'Brief description shown on help cards in collection view';
COMMENT ON COLUMN public.help_topics.content_text IS 'Full plain-text content for RAG embedding - AI uses this to answer questions';
COMMENT ON COLUMN public.help_topics.icon_name IS 'Lucide icon name (e.g., Sparkles, Brain, Folder) for card display';

-- ============================================================================
-- STEP 4: Seed Help Topics (only if table is empty)
-- ============================================================================

INSERT INTO public.help_topics (slug, title, summary, category, content_text, icon_name, display_order)
SELECT * FROM (VALUES
    ('ai-insights', 'AI Insights',
    'Prometheus automatically detects meaningful information about you during conversations, helping personalize your experience.',
    'AI Features',
    'AI Insights are meaningful pieces of information that Prometheus identifies about you during conversations. These insights help the AI understand your preferences, goals, challenges, and context, enabling it to provide more personalized and relevant responses over time. As you chat with Prometheus, it listens for information that could help improve your experience. When it detects something meaningful, like your role, a goal you are working toward, or a challenge you are facing, it will present the insight for your review. All saved insights are stored in your Personal Context collection, accessible from the left navigation panel.',
    'Sparkles', 1),

    ('personal-context', 'Personal Context',
    'Your dedicated collection for information that helps the AI understand you better and provide personalized responses.',
    'Collections',
    'Your Personal Context collection stores information about you that helps Prometheus provide more personalized and relevant responses. This is your private space for building context that makes every AI interaction more valuable. Personal Context includes AI-detected insights, custom notes, profile details, and uploaded documents. To add custom context, navigate to the Personal Context collection and click Add Text or Add File.',
    'Brain', 2),

    ('prometheus-ai', 'Prometheus AI Assistant',
    'Your intelligent companion for HR learning and professional development, aware of your context and goals.',
    'AI Features',
    'Prometheus is your AI-powered assistant designed to help you navigate HR challenges and accelerate your professional growth. Unlike generic chatbots, Prometheus knows about your personal context, learning history, and goals. Prometheus helps by answering questions about HR topics, recommending courses, helping understand complex concepts, providing personalized learning paths, and remembering your conversation history.',
    'Flame', 3),

    ('collections', 'Collections',
    'Organize your learning with Favorites, Workspace, Watchlist, and custom collections tailored to your needs.',
    'Collections',
    'Collections help you organize courses, conversations, and resources in ways that make sense for your learning journey. Built-in collections include Favorites for your top picks, Workspace for active research and projects, and Watchlist for courses to take later. You can also create custom collections. Each collection has its own Collection Assistant that knows about items saved there.',
    'Folder', 4),

    ('academy', 'Academy',
    'Browse our catalog of expert-led HR courses across multiple categories and find your next learning opportunity.',
    'Learning',
    'The Academy is your gateway to professional development with courses spanning multiple categories of HR expertise. Course categories include AI for HR, Leadership, Business Functions, Soft Skills, HR Stories, and Book Club. Use category pills for quick filtering or open the Search and Filter panel for advanced options.',
    'GraduationCap', 5),

    ('dashboard', 'Dashboard',
    'Your personalized learning hub with statistics, progress tracking, and quick actions to keep you moving forward.',
    'Platform',
    'The Dashboard is your home base, providing a personalized overview of your learning journey. It shows learning statistics including total hours, courses completed, and current streak. The Continue Learning section shows in-progress courses, and Quick Prompts provide instant access to common Prometheus conversations.',
    'LayoutDashboard', 6),

    ('experts', 'Experts',
    'Learn from vetted industry leaders who bring real-world experience and practical frameworks to their teaching.',
    'Learning',
    'Our Expert instructors bring real-world experience, practical frameworks, and unique perspectives to their courses. Each expert is rigorously vetted for subject matter expertise and teaching ability. Expert profiles showcase credentials, course catalog, student count, ratings, and areas of specialization.',
    'Users', 7),

    ('certifications', 'Certifications',
    'Track SHRM and HRCI continuing education credits to maintain your professional certifications.',
    'Learning',
    'Many courses offer SHRM and HRCI continuing education credits, helping you maintain your professional certifications while developing new skills. Certification credits are displayed on course cards with badges. Use the Certifications filter in the Academy to find credit-eligible courses.',
    'Award', 8),

    ('conversations', 'Conversations',
    'Your chat history with Prometheus is saved and organized, making it easy to resume any discussion.',
    'AI Features',
    'The Conversations collection stores your complete chat history with Prometheus. Every conversation is saved automatically and can be resumed at any time. Click any conversation card to resume where you left off. You can drag conversations to other collections to organize by topic.',
    'MessageSquare', 9),

    ('drag-and-drop', 'Drag and Drop',
    'Easily organize content by dragging cards to collections, making content management intuitive and fast.',
    'Platform',
    'Drag and drop makes organizing your learning effortless. Move courses, conversations, and context items between collections with simple gestures. Click and hold any card, drag over a collection portal at the bottom of the screen, and release to add the item to that collection.',
    'Layers', 10),

    ('course-progress', 'Course Progress',
    'Track your progress through lessons and modules with automatic progress tracking and easy resume functionality.',
    'Learning',
    'Course progress is tracked automatically as you complete lessons, making it easy to see how far you have come and pick up where you left off. Course cards show a progress bar with completion percentage. Inside courses, completed lessons are marked with checkmarks. Click the Continue button to jump to your next incomplete lesson.',
    'TrendingUp', 11),

    ('search-filters', 'Search & Filters',
    'Find exactly what you need with powerful search and filtering tools designed for quick discovery.',
    'Platform',
    'The Search and Filter panel in the Academy helps you find courses quickly using multiple criteria. Available filters include category, certification credits, completion status, and rating. Combine multiple filters for precise results or search by keyword.',
    'Search', 12),

    ('settings', 'Settings',
    'Customize your experience with preferences for AI behavior, notifications, and account management.',
    'Platform',
    'Settings let you customize your EnhancedHR experience. Access Settings from your profile menu. AI Settings include Enable AI Insights to turn insight detection on or off, and Auto-Save AI Insights to automatically save insights without prompting.',
    'Settings', 13),

    ('organization', 'Organization Features',
    'Team management, learning assignments, and analytics for administrators managing organizational learning.',
    'Platform',
    'Organization features help Org Admins manage team learning effectively. These tools include team management for viewing members and managing permissions, learning assignments for assigning courses and creating learning paths, and analytics for completion rates and engagement metrics.',
    'Building', 14),

    ('help-collection', 'Help Collection',
    'You are here! Comprehensive platform documentation with AI-powered assistance for all your questions.',
    'Platform',
    'The Help Collection provides comprehensive documentation for every feature in the EnhancedHR platform. Browse cards to explore features, click any card to open full documentation, and use the Collection Assistant to ask questions about the platform.',
    'HelpCircle', 15)
) AS v(slug, title, summary, category, content_text, icon_name, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.help_topics LIMIT 1);

-- ============================================================================
-- VERIFICATION: Check help_topics table
-- ============================================================================
SELECT
    'help_topics table' as check_item,
    EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'help_topics'
    ) as exists;

SELECT COUNT(*) as help_topics_count FROM public.help_topics;

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
--
-- Help Collection:
-- - Navigate to Help in the left sidebar to see all 15 feature cards
-- - Click any card to open the documentation panel
-- - Use the Collection Assistant to ask questions about the platform
-- ============================================================================
