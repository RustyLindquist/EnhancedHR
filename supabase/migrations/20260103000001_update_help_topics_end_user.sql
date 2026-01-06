-- ============================================================================
-- Update Help Collection Topics (End-User Focus)
-- - Upserts topics for the Help collection cards
-- - Keeps UI HelpTopicId slugs in sync with DB slugs
-- - Marks Org/Admin-only topics inactive for now
-- ============================================================================

INSERT INTO public.help_topics (
  slug,
  title,
  summary,
  category,
  content_text,
  icon_name,
  display_order,
  is_active
) VALUES

-- START HERE
(
  'getting-started',
  'Getting Started',
  'A quick tour of where to go first and how to get value from EnhancedHR.',
  'Start Here',
  'Getting Started

EnhancedHR is an AI-enhanced learning platform built for HR professionals and leaders. Use it to take expert-led courses, apply what you learn to real situations, and track progress and certification eligibility along the way.

How the platform is organized:
- Dashboard: your learning hub (continue learning, quick prompts, recent activity)
- Academy: browse the course catalog and start learning
- Prometheus AI: full-screen chat for HR questions, coaching, and planning
- Tools: specialized AI workflows for common HR tasks
- Collections: organize courses, conversations, and notes
- Personal Context: your private AI context (profile, insights, documents)
- Help: browse help topics or ask the Help Collection Assistant

Your first 5 minutes:
1) Go to Academy and pick a course that matches a real challenge you are facing.
2) Start a lesson. Your progress updates automatically.
3) Use the right-side AI panel to ask for a summary, an example, or an application plan.
4) Save useful courses, lessons, and conversations to Favorites/Workspace/Watchlist or a custom collection.
5) Come back to Help anytime, or ask the Collection Assistant for guidance.',
  'Compass',
  1,
  true
),

-- AI
(
  'ai-insights',
  'AI Insights',
  'Prometheus can save meaningful context about you to personalize future conversations.',
  'AI',
  'AI Insights are meaningful pieces of information that Prometheus identifies about you during conversations. These insights help the AI understand your preferences, goals, challenges, and context, enabling it to provide more personalized and relevant responses over time.

How it works:
- During conversations, Prometheus detects useful context (role, goals, preferences, constraints).
- You can choose to save or ignore insights (depending on your settings).
- Saved insights are stored in your Personal Context collection.

Managing insights:
- View, edit, or delete insights from Personal Context.
- Add your own insights manually to improve personalization.
- Control insight behavior in Settings (Enable AI Insights, Auto-Save AI Insights).',
  'Sparkles',
  2,
  true
),
(
  'personal-context',
  'Personal Context',
  'Your private collection for profile details, documents, and AI insights that personalize Prometheus.',
  'AI',
  'Personal Context is your private, always-available context for Prometheus and course AI. It stores information that helps the AI respond in ways that fit your role and goals.

What can live in Personal Context:
- Your profile card (role, goals, experience)
- AI Insights captured from conversations
- Documents you upload (reference materials)
- Custom context notes you write yourself

Why it matters:
- Better personalization in Prometheus conversations
- More relevant examples and coaching inside courses
- Less repetition over time because the AI remembers what matters to you',
  'Brain',
  3,
  true
),
(
  'prometheus-ai',
  'Prometheus AI Assistant',
  'Ask HR questions, get coaching, build plans, and apply course concepts with a context-aware AI assistant.',
  'AI',
  'Prometheus is your AI-powered assistant designed to help you navigate HR challenges and accelerate your professional growth. Unlike generic chatbots, Prometheus can use your learning history and personal context to respond more effectively.

Common uses:
- Draft policies, emails, and talking points
- Prepare for difficult conversations (performance, termination, conflict)
- Translate course concepts into a plan for your organization
- Get course recommendations based on what you are working on

Where to access Prometheus:
- Prometheus AI (full-screen chat)
- The right-side AI panel while browsing and learning',
  'Flame',
  4,
  true
),
(
  'course-ai',
  'AI in Courses (Assistant & Tutor)',
  'Use the course-aware Assistant for quick answers or Tutor mode for guided learning and application.',
  'AI',
  'When you are inside a course, the AI panel becomes course-aware. You can switch between two learning modes:

Course Assistant:
- Quick, direct answers about course concepts
- Great for summaries, definitions, and examples

Course Tutor:
- Guided, Socratic teaching style
- Helps you practice, check understanding, and apply concepts to your role

How to use course AI:
1) Open a course and expand the AI panel on the right.
2) Choose Assistant or Tutor depending on what you need.
3) Ask for specific outputs (script, checklist, plan, role-play).
4) Save outcomes as Notes or into a collection.',
  'Bot',
  5,
  true
),

-- LEARNING
(
  'academy',
  'Academy',
  'Browse the full course catalog, filter by category/credits, and start learning.',
  'Learning',
  'The Academy is the course catalog for EnhancedHR. Browse categories, search by keyword, and filter to quickly find the right content.

Ways to discover courses:
- Category pills for quick browsing
- Search & Filter panel for advanced filtering (credits, status, rating, date)
- Expert browsing to explore instructor profiles and their courses

You can save courses to Favorites, Watchlist, or a custom collection to organize your learning.',
  'GraduationCap',
  6,
  true
),
(
  'course-experience',
  'Course Experience',
  'How courses, lessons, notes, and progress work when you start learning.',
  'Learning',
  'Courses are organized into modules and lessons. The course page gives you the overview, syllabus, and resources. The lesson player tracks progress automatically as you watch, and some courses include quizzes or activities.

How to take a course:
- From Academy, open a course and click Start Course (or Resume Learning).
- Move through lessons using next/previous navigation.
- Use the right-side AI panel for course-aware explanations and tutoring.
- Use the Notes tab to capture takeaways as you learn (notes auto-save).

Saving for later:
- Add courses, lessons, conversations, and notes to collections using the + button or drag-and-drop.

Certification eligibility:
- SHRM/HRCI badges appear on eligible courses and help you focus on credit-eligible learning.',
  'Monitor',
  7,
  true
),
(
  'dashboard',
  'Dashboard',
  'Your home base: continue learning, see stats, and start fast conversations with Prometheus.',
  'Learning',
  'The Dashboard is your learning hub. It shows your learning statistics, in-progress courses, and quick prompts to start useful conversations fast.

Best ways to use it:
- Continue Learning: jump back into your next lesson
- Quick Prompts: start strong conversations and customize them to your situation
- Ask the AI panel for course recommendations or guidance',
  'LayoutDashboard',
  8,
  true
),
(
  'experts',
  'Experts',
  'Learn from vetted experts and explore instructor profiles and course catalogs.',
  'Learning',
  'Experts are the instructors and authors behind the courses on EnhancedHR. Expert profiles help you understand who is teaching and what they specialize in.

Expert profiles typically include:
- Background and credentials
- Areas of expertise
- Courses they teach on the platform
- Ratings and learner engagement',
  'Users',
  9,
  true
),

-- ORGANIZATION / WORKSPACE
(
  'collections',
  'Collections',
  'Organize courses, conversations, and notes into project-focused collections (with AI assistance).',
  'Collections',
  'Collections help you organize learning content in ways that match your work. Think of them as smart folders that can also power collection-aware AI help.

Built-in collections:
- Favorites: your top picks
- Workspace: active projects and research
- Watchlist: courses to take later

Custom collections:
- Create your own collections for projects (Onboarding, Culture, HR Ops, etc.)
- Add items using the + button or drag-and-drop',
  'Folder',
  10,
  true
),
(
  'drag-and-drop',
  'Drag and Drop',
  'Move courses, conversations, notes, and context items into collections with simple drag-and-drop.',
  'Collections',
  'Drag and drop makes organizing effortless. Click and hold a card, then drag it to a collection portal at the bottom of the screen and release to add it.

Notes:
- Most learning cards support drag-and-drop (courses, lessons, conversations, notes, context items).
- Help cards and some system items are not draggable.',
  'Layers',
  11,
  true
),
(
  'conversations',
  'Conversations',
  'Your saved chat history with Prometheus, plus the ability to organize and export important outputs.',
  'Collections',
  'The Conversations collection stores your chat history with Prometheus. Each conversation can be resumed later and organized into collections.

Common actions:
- Resume a conversation from a card
- Drag conversations into collections to organize by project
- Export a conversation when you want to reuse the output (policy draft, checklist, script)

Tools can create tool-specific conversations that you can resume later from Tools or your collections.',
  'MessageSquare',
  12,
  true
),
(
  'notes',
  'Notes in Courses',
  'Take notes while learning and access all notes from the Notes collection.',
  'Learning',
  'Notes help you capture takeaways and build a personal knowledge base.

How notes work:
- In a course, use the right-side panel Notes tab to create and edit notes (auto-saves).
- Notes stay linked to the course so you can revisit them later.
- The All Notes collection shows every note you have created across courses.
- Notes can be added to collections just like courses and conversations.',
  'StickyNote',
  13,
  true
),
(
  'prompt-library',
  'Prompt Library',
  'Curated prompts that help you start stronger conversations with Prometheus.',
  'Start Here',
  'The Prompt Library gives you ready-to-use prompts for common HR situations so you can get value quickly.

How to use prompts:
1) Pick a prompt that matches your situation.
2) Customize it with your context (role, company, constraints, timeline).
3) Ask for a specific deliverable (script, checklist, email draft, plan).',
  'Library',
  14,
  true
),

-- DISCOVERY / TRACKING
(
  'search-filters',
  'Search & Filters',
  'Find exactly what you need with keyword search plus filters for credits, status, rating, and more.',
  'Learning',
  'The Search & Filter panel in Academy helps you find courses quickly using multiple criteria.

Common filters include:
- Category
- Credits (SHRM/HRCI)
- Designation (Required/Recommended)
- Status (Not started/In progress/Completed)
- Rating
- Date/timeframe
- Include Lessons (search lesson titles/content too)

Tip: start broad with a keyword, then add one or two filters to narrow results.',
  'Search',
  15,
  true
),
(
  'course-progress',
  'Course Progress',
  'Automatic progress tracking and easy resume so you always know what to do next.',
  'Learning',
  'Course progress is tracked automatically as you complete lessons. Course cards show a progress bar, and the Dashboard highlights in-progress courses so you can continue quickly.

Tip: use Continue Learning to jump to your next incomplete lesson.',
  'TrendingUp',
  16,
  true
),
(
  'certifications',
  'Certifications',
  'Find SHRM/HRCI-eligible courses, claim credits after completion, and access certificates when available.',
  'Learning',
  'Many courses offer SHRM and HRCI continuing education credits. Credit-eligible courses show SHRM/HRCI badges on the card and course page.

Finding eligible courses:
- Use the Credits filter in Academy search
- Look for badges on course cards

Claiming credits & certificates:
- Complete the course (some credit claims require a minimum completion threshold)
- From the course page, click Claim Credits
- If a Certificate button is shown, open the verification page to view/share your certificate',
  'Award',
  17,
  true
),

-- TOOLS
(
  'tools',
  'Tools',
  'Specialized AI tools for HR workflows like roleplay practice and structured assessments.',
  'Tools',
  'Tools are purpose-built AI experiences for specific HR tasks. Each tool uses a specialized agent and interface so you can get better results than a generic prompt.

How tools work:
- Choose a tool from Tools in the left navigation.
- Start a new session (some tools begin with structured inputs).
- Tool sessions are saved as conversations so you can return later.

Tip: be specific about your context and ask for usable outputs (talk tracks, checklists, plans).',
  'Wrench',
  18,
  true
),

-- SETTINGS / ACCOUNT
(
  'settings',
  'Settings',
  'Customize AI behavior (AI Insights) and find links to account and billing pages.',
  'Account',
  'Settings let you customize your EnhancedHR experience. AI Settings control how Prometheus captures and saves AI Insights.

You may also use:
- My Account: profile photo and password
- Billing & Membership: upgrade and subscription management',
  'Settings',
  19,
  true
),
(
  'account-membership',
  'Account & Membership',
  'Manage your profile, trial/membership access, billing, and subscription settings.',
  'Account',
  'Account & Membership pages help you manage access and billing.

Where to go:
- Settings: AI preferences (AI Insights)
- My Account: profile photo, password, membership status
- Billing & Membership: upgrade and manage billing via Stripe

Trial note:
- Trial access may be limited by minutes watched while viewing lessons. If your trial ends, upgrade to continue learning.',
  'CreditCard',
  20,
  true
),

-- HELP
(
  'help-collection',
  'Help Collection',
  'Browse platform documentation or ask the Help Collection Assistant for answers.',
  'Start Here',
  'The Help Collection is a guided, card-based set of platform documentation.

How to use it:
- Browse help cards to explore platform features
- Click a card to open the full documentation panel
- Ask the Collection Assistant questions about the platform; it will use the help topics as reference

The Help Collection is designed for both exploration and reference. Come back anytime you need guidance.',
  'HelpCircle',
  21,
  true
),

-- ADMIN-ONLY (HIDDEN FOR NOW)
(
  'organization',
  'Organization Features (Admins)',
  'Admin-only team management, assignments, and analytics (hidden for end-users).',
  'Admin',
  'Organization features help Org Admins manage team learning effectively. These tools are available to users with Org Admin or Org Owner roles.',
  'Building',
  99,
  false
)

ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  category = EXCLUDED.category,
  content_text = EXCLUDED.content_text,
  icon_name = EXCLUDED.icon_name,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

