-- ============================================================================
-- Help Topics Table for Help Collection
-- Stores metadata for help cards, with content text for RAG embedding
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
CREATE POLICY "Authenticated users can read help topics"
    ON public.help_topics FOR SELECT TO authenticated
    USING (is_active = true);

-- Indexes for efficient queries
CREATE INDEX idx_help_topics_slug ON public.help_topics(slug);
CREATE INDEX idx_help_topics_category ON public.help_topics(category);
CREATE INDEX idx_help_topics_order ON public.help_topics(display_order);

-- Comments for documentation
COMMENT ON TABLE public.help_topics IS 'Help collection topics for platform feature documentation and AI-powered help';
COMMENT ON COLUMN public.help_topics.slug IS 'URL-safe identifier matching HelpTopicId in HelpContent.tsx';
COMMENT ON COLUMN public.help_topics.summary IS 'Brief description shown on help cards in collection view';
COMMENT ON COLUMN public.help_topics.content_text IS 'Full plain-text content for RAG embedding - AI uses this to answer questions';
COMMENT ON COLUMN public.help_topics.icon_name IS 'Lucide icon name (e.g., Sparkles, Brain, Folder) for card display';

-- ============================================================================
-- Seed Initial Help Topics
-- ============================================================================

INSERT INTO public.help_topics (slug, title, summary, category, content_text, icon_name, display_order) VALUES

('ai-insights', 'AI Insights',
'Prometheus automatically detects meaningful information about you during conversations, helping personalize your experience.',
'AI Features',
'AI Insights are meaningful pieces of information that Prometheus identifies about you during conversations. These insights help the AI understand your preferences, goals, challenges, and context, enabling it to provide more personalized and relevant responses over time.

As you chat with Prometheus, it listens for information that could help improve your experience. When it detects something meaningful, like your role, a goal you are working toward, or a challenge you are facing, it will present the insight for your review.

Example insights include: your job title and industry, professional goals you mention, challenges or pain points you describe, learning preferences you express, and topics you show interest in.

All saved insights are stored in your Personal Context collection, accessible from the left navigation panel. From there you can view all insights that have been saved about you, edit insights to add more detail or correct information, delete insights that are no longer relevant or accurate, and add new insights manually to help Prometheus understand you better.

You can customize how insights work from Settings in your profile menu. Enable AI Insights turns insight detection on or off - when disabled, Prometheus will not attempt to identify insights during conversations. Auto-Save AI Insights, when enabled, saves insights automatically without asking for your approval, creating a seamless experience though you can always review and manage insights later.

All insights are stored securely and are only visible to you. They are never shared with other users or used for purposes other than improving your personal experience with Prometheus.',
'Sparkles', 1),

('personal-context', 'Personal Context',
'Your dedicated collection for information that helps the AI understand you better and provide personalized responses.',
'Collections',
'Your Personal Context collection stores information about you that helps Prometheus provide more personalized and relevant responses. This is your private space for building context that makes every AI interaction more valuable.

Personal Context includes several types of information. AI-detected insights are automatically identified during your conversations. Custom notes are information you manually add about yourself. Your profile details include structured information like your role and experience. Uploaded documents are files you share for the AI to reference.

The AI uses this context in every conversation to understand your role and responsibilities, your professional goals and objectives, challenges you are facing, your learning preferences and style, and relevant background information.

To add custom context, navigate to the Personal Context collection and click Add Text to write a note or Add File to upload a document. For text notes, describe something about yourself, your work, or your goals. For files, upload relevant documents like your resume, project descriptions, or reference materials.

Your profile card appears at the top of Personal Context. Click to edit and add details like your job title, years of experience, industry, and professional objectives. The more context you provide, the more personalized and helpful Prometheus becomes.

All context is private to you. It is never shared with other users and is used only to improve your experience with the AI assistant.',
'Brain', 2),

('prometheus-ai', 'Prometheus AI Assistant',
'Your intelligent companion for HR learning and professional development, aware of your context and goals.',
'AI Features',
'Prometheus is your AI-powered assistant designed to help you navigate HR challenges and accelerate your professional growth. Unlike generic chatbots, Prometheus knows about your personal context, learning history, and goals.

Prometheus helps you in many ways. It answers questions about HR topics with expertise. It recommends courses based on your interests and goals. It helps you understand complex concepts from your courses. It provides personalized learning paths. It remembers your conversation history for continuity.

You can access Prometheus from multiple places. Click Prometheus AI in the left navigation for full-screen chat. Use the AI panel on the right side while browsing courses. Start from Dashboard quick actions for common prompts. Access from within any course for contextual help.

Prometheus uses your Personal Context to personalize every response. The more context you provide, the more relevant and helpful the AI becomes. Your conversation history is saved automatically.

Each conversation is stored in the Conversations collection. You can resume any past conversation, save important conversations to other collections, and start fresh conversations anytime.

When viewing a collection, the Collection Assistant knows about items in that collection. Ask questions about your saved courses, get recommendations from your favorites, or explore topics from your research.',
'Flame', 3),

('collections', 'Collections',
'Organize your learning with Favorites, Workspace, Watchlist, and custom collections tailored to your needs.',
'Collections',
'Collections help you organize courses, conversations, and resources in ways that make sense for your learning journey. Think of them as smart folders that also enable AI-powered assistance.

The platform includes three built-in collections. Favorites is for your top picks and go-to courses. Workspace is for active research, current projects, and reference material. Watchlist is for courses you want to take later.

You can also create custom collections for any purpose. Create collections for specific projects, learning goals, or topics you are exploring. Each collection can have a custom name and color.

To add items to a collection, drag and drop any card onto a collection portal at the bottom of the screen. Alternatively, click the add button on any card and select the target collection.

Each collection has its own Collection Assistant. When viewing a collection, the AI knows about the items you have saved there. Ask questions about your saved content, get recommendations based on your collection, or explore connections between items.

View collection counts in the sidebar to see how many items are in each collection. Click any collection to see its contents. Use the manage menu on custom collections to rename, change color, or delete.',
'Folder', 4),

('academy', 'Academy',
'Browse our catalog of expert-led HR courses across multiple categories and find your next learning opportunity.',
'Learning',
'The Academy is your gateway to professional development with courses spanning multiple categories of HR expertise. Our expert-led courses are designed for practical application and real-world impact.

Course categories include AI for HR covering artificial intelligence applications in human resources. Leadership development focuses on management and leadership skills. Business Functions covers core HR operations and strategy. Soft Skills develops interpersonal and communication abilities. HR Stories shares real-world case studies and experiences. Book Club offers discussions of influential HR and business books.

Navigation is designed for easy discovery. Use category pills at the top for quick filtering. The search and filter panel offers advanced options. Browse by scrolling through the categorized grid.

The search and filter panel lets you find courses by keyword, filter by category, certification credits, completion status, rating, and date added. Combine multiple filters for precise results.

Each course card shows the title and instructor, duration and rating, certification credits if available, your progress if started, and category tags.

Click any course to see the full course page with syllabus, instructor information, resources, and the option to start or continue learning.',
'GraduationCap', 5),

('dashboard', 'Dashboard',
'Your personalized learning hub with statistics, progress tracking, and quick actions to keep you moving forward.',
'Platform',
'The Dashboard is your home base, providing a personalized overview of your learning journey. It adapts based on your role and shows what matters most to you.

Learning statistics are displayed prominently showing your total learning hours, courses completed, and current learning streak. These metrics help you track progress toward your professional development goals.

Continue Learning shows your in-progress courses so you can pick up right where you left off. See your progress percentage and jump back into any course with one click.

Quick Prompts provide instant access to common Prometheus conversations. Start a conversation about your learning goals, get course recommendations, or explore HR topics.

The Dashboard adapts to your role. Regular learners see personal progress and recommendations. Employees see assigned learning paths and team activity. Org Admins see team analytics and management tools.

Recent activity shows your latest interactions including courses viewed, conversations had, and content saved. This helps you maintain continuity in your learning journey.',
'LayoutDashboard', 6),

('experts', 'Experts',
'Learn from vetted industry leaders who bring real-world experience and practical frameworks to their teaching.',
'Learning',
'Our Expert instructors bring real-world experience, practical frameworks, and unique perspectives to their courses. Each expert is rigorously vetted for subject matter expertise and teaching ability.

Expert profiles showcase their credentials and experience, their course catalog on the platform, student count and ratings, and their areas of specialization.

Finding experts is easy. Browse the Experts page to see all instructors. Filter by topic or specialization. View expert profiles from any course page.

Expert quality is ensured through our vetting process. We verify professional credentials and experience, assess teaching ability and communication skills, review content for accuracy and practical value, and gather ongoing student feedback.

Many experts participate beyond their courses through live Q and A sessions, community discussions, and responding to student questions. This creates opportunities for deeper engagement with industry leaders.',
'Users', 7),

('certifications', 'Certifications',
'Track SHRM and HRCI continuing education credits to maintain your professional certifications.',
'Learning',
'Many courses offer SHRM and HRCI continuing education credits, helping you maintain your professional certifications while developing new skills.

Certification credits are displayed on course cards with badges. SHRM credits are shown with the SHRM logo. HRCI credits are shown with the HRCI logo. Some courses offer both types of credits.

To find credit-eligible courses, use the Certifications filter in the Academy search panel. Filter by SHRM credits, HRCI credits, or both. The Certifications page shows only credit-eligible content.

Credit tracking is automatic. When you complete a credit-eligible course, the credits are logged to your profile. View your earned credits from the Certifications page. Export your credit history for professional development records.

Maintain your certifications by regularly completing credit-eligible courses. Set learning goals that align with your recertification requirements. The platform helps you track progress toward credit targets.',
'Award', 8),

('conversations', 'Conversations',
'Your chat history with Prometheus is saved and organized, making it easy to resume any discussion.',
'AI Features',
'The Conversations collection stores your complete chat history with Prometheus. Every conversation is saved automatically and can be resumed at any time.

Conversations are created whenever you chat with Prometheus, whether from the main Prometheus AI page, the AI panel while browsing, or within a course context.

Each conversation has an automatically generated title based on the discussion topic. You can see when the conversation started and how many messages it contains.

To resume a conversation, navigate to the Conversations collection and click on any conversation card. You will return to that conversation with full context preserved. Continue right where you left off.

Important conversations can be saved to other collections. Drag a conversation card to any collection portal, or use the save action. This helps you organize conversations by project or topic.

Start a new conversation anytime from the Conversations page header button, the Prometheus AI navigation item, or Dashboard quick actions. Each new conversation starts fresh while your Personal Context is always available.',
'MessageSquare', 9),

('drag-and-drop', 'Drag and Drop',
'Easily organize content by dragging cards to collections, making content management intuitive and fast.',
'Platform',
'Drag and drop makes organizing your learning effortless. Move courses, conversations, and context items between collections with simple gestures.

To drag an item, click and hold any card. The card will lift and follow your cursor. Collection portals appear along the bottom of the screen as drop targets.

Drop targets include your built-in collections like Favorites, Workspace, and Watchlist, plus any custom collections you have created. A New or Other portal lets you create a new collection on the fly.

Visual feedback guides you through the process. Cards glow when positioned over a valid drop target. The target portal highlights to confirm the drop location. Release to add the item to that collection.

Most card types support drag and drop including courses, modules, lessons, conversations, and context items. Help cards and some system items are not draggable.

Organize your learning by dragging related courses into project-specific collections. Save interesting conversations for later reference. Build curated collections for specific learning goals.',
'Layers', 10),

('course-progress', 'Course Progress',
'Track your progress through lessons and modules with automatic progress tracking and easy resume functionality.',
'Learning',
'Course progress is tracked automatically as you complete lessons, making it easy to see how far you have come and pick up where you left off.

Progress indicators appear throughout the platform. Course cards show a progress bar with completion percentage. Inside courses, completed lessons and modules are marked. The Dashboard shows your in-progress courses.

Progress is updated automatically when you complete a lesson by watching the video or completing activities. There is no need to manually mark items complete.

To resume a course, click the Continue button on any in-progress course card. You will be taken to your next incomplete lesson. The course page also shows your exact position in the curriculum.

Completed courses are marked with a checkmark on the card. They contribute to your learning statistics including total hours and courses completed. Completed courses remain accessible for review anytime.

View your complete learning history from the Dashboard. See all courses you have started or completed. Track your progress toward learning goals.',
'TrendingUp', 11),

('search-filters', 'Search & Filters',
'Find exactly what you need with powerful search and filtering tools designed for quick discovery.',
'Platform',
'The Search and Filter panel in the Academy helps you find courses quickly using multiple criteria. Combine filters for precise results or search by keyword.

To access search and filters, click the Search and Filter button in the Academy header. The filter panel slides in from the side.

Keyword search finds courses by title, author name, or description. Type your search term and results update instantly.

Available filters include category to filter by course category, certification to show only SHRM or HRCI credit courses, designation to filter by Required, Recommended, or Optional status, completion to show completed, in-progress, or not-started courses, rating to filter by minimum star rating, and date to filter by when courses were added.

Combine multiple filters to narrow results. For example, find AI courses with SHRM credits that you have not started yet.

Filter settings persist as you navigate within the Academy. Clear all filters to return to the full catalog. The active filter count shows in the button.',
'Search', 12),

('settings', 'Settings',
'Customize your experience with preferences for AI behavior, notifications, and account management.',
'Platform',
'Settings let you customize your EnhancedHR experience. Access Settings from your profile menu in the bottom left corner of the navigation panel.

AI Settings control how Prometheus interacts with you. Enable AI Insights turns insight detection on or off. Auto-Save AI Insights automatically saves detected insights without prompting for approval.

Profile settings help the AI understand you better. Update your role and experience information. Set your professional objectives. Manage your personal context preferences.

Account settings include your email and password management, notification preferences, and subscription or membership details.

For Org Admins, additional settings are available for team management, user permissions, and organization configuration.

Changes to settings take effect immediately. AI behavior settings apply to all future conversations. Profile updates immediately improve AI personalization.',
'Settings', 13),

('organization', 'Organization Features',
'Team management, learning assignments, and analytics for administrators managing organizational learning.',
'Platform',
'Organization features help Org Admins manage team learning effectively. These tools are available to users with Org Admin or Org Owner roles.

Team management allows you to view all team members and their roles, invite new members to your organization, manage user permissions and access, and organize members into groups.

Learning assignments let you assign courses to individuals or groups, create learning paths with sequential courses, set deadlines and track compliance, and send reminders for incomplete assignments.

Analytics provide insights into team learning activity including completion rates and time spent, engagement metrics and trends, individual progress reports, and exportable data for reporting.

The Organization Dashboard shows a summary of team activity. View recent completions, upcoming deadlines, and areas needing attention.

Access organization features from the My Organization section in the navigation panel. Additional settings are available in the admin area.',
'Building', 14),

('help-collection', 'Help Collection',
'You are here! Comprehensive platform documentation with AI-powered assistance for all your questions.',
'Platform',
'The Help Collection provides comprehensive documentation for every feature in the EnhancedHR platform. This is where you can explore what the platform offers and get answers to your questions.

Each help card covers a feature with three levels of detail. Value and Purpose at the top explains why the feature matters and what problem it solves. How It Works in the middle provides conceptual explanations. Step by Step Instructions at the bottom offers specific guidance for using the feature.

To use the Help Collection, browse the cards to explore features. Click any card to open the full documentation panel. Read at your own pace, starting with value and scrolling for details.

The Collection Assistant is aware of all help content. When viewing the Help collection, you can ask Prometheus questions about the platform. It will use the help documentation to provide accurate answers.

Common uses include learning about a new feature before using it, getting step-by-step guidance for specific tasks, understanding the value of features during evaluation, and answering questions during onboarding.

The Help Collection is designed for both exploration and reference. Come back anytime you need guidance on using the platform effectively.',
'HelpCircle', 15);
