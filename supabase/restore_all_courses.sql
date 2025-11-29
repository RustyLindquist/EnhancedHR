-- !!! IMPORTANT: CLEAR THE EDITOR BEFORE PASTING THIS !!!

-- 1. Ensure RLS Policy is correct for Courses
drop policy if exists "Public courses are viewable by everyone" on courses;
create policy "Public courses are viewable by everyone" on courses for select using (true);
alter table courses enable row level security;

-- 2. Clear existing data to avoid duplicates/conflicts
DELETE FROM modules;
DELETE FROM courses;

-- 3. Seed All Courses
INSERT INTO courses (id, title, author, category, description, image_url, duration, rating, badges, created_at) VALUES
-- AI FOR HR
(101, 'AI Leadership Strategies', 'Dr. Sarah Chen', 'AI for HR', 'Master the art of leading teams through the AI revolution. Learn to balance automation with human empathy.', 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop', '4h 15m', 4.8, ARRAY['REQUIRED', 'SHRM'], NOW() - INTERVAL '2 days'),
(102, 'Generative AI for Recruiters', 'Tech HR Labs', 'AI for HR', 'Practical applications of LLMs in sourcing, screening, and communicating with candidates.', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop', '3h 00m', 4.8, ARRAY['SHRM'], NOW() - INTERVAL '10 days'),
(103, 'Prompt Engineering 101', 'Alex Rivera', 'AI for HR', 'Learn the specific syntax and structures to get the best results from ChatGPT and Claude for HR tasks.', 'https://images.unsplash.com/photo-1678911820864-e2c567c655d7?q=80&w=1000&auto=format&fit=crop', '2h 15m', 4.9, ARRAY[]::text[], NOW() - INTERVAL '1 day'),
(104, 'Ethical AI Governance', 'Legal Dept & IT', 'AI for HR', 'Understanding bias, privacy, and security when deploying AI tools in the workplace.', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop', '1h 30m', 4.5, ARRAY['REQUIRED'], NOW() - INTERVAL '45 days'),
(105, 'Predictive Retention Models', 'Data Science Team', 'AI for HR', 'Using machine learning to identify flight risks before they hand in their resignation.', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop', '5h 00m', 4.7, ARRAY['HRCI'], NOW() - INTERVAL '5 days'),
(106, 'The Automated Onboarding', 'People Ops', 'AI for HR', 'Building a seamless, AI-assisted onboarding journey that feels personal at scale.', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1000&auto=format&fit=crop', '3h 45m', 4.2, ARRAY[]::text[], NOW() - INTERVAL '100 days'),

-- LEADERSHIP
(201, 'Change Management Essentials', 'Robert Fox', 'Leadership', 'Navigating organizational transitions with minimal disruption and maximum employee engagement.', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1000&auto=format&fit=crop', '5h 15m', 4.6, ARRAY['HRCI'], NOW() - INTERVAL '20 days'),
(202, 'Leading Remote Teams', 'Sarah Jenks', 'Leadership', 'Strategies for maintaining culture, productivity, and connection in a distributed workforce.', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000&auto=format&fit=crop', '3h 20m', 4.5, ARRAY[]::text[], NOW()),
(203, 'Executive Presence', 'Marcus Aurelius II', 'Leadership', 'How to command a room, speak with authority, and influence C-Suite stakeholders.', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto=format&fit=crop', '4h 00m', 4.9, ARRAY['SHRM'], NOW() - INTERVAL '8 days'),
(204, 'Strategic Visioning', 'Board of Directors', 'Leadership', 'Moving from tactical execution to long-term strategic planning.', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1000&auto=format&fit=crop', '6h 30m', 4.7, ARRAY['REQUIRED'], NOW() - INTERVAL '300 days'),
(205, 'Mentorship Masterclass', 'Elena Fisher', 'Leadership', 'How to effectively mentor junior talent and build the next generation of leaders.', 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1000&auto=format&fit=crop', '2h 45m', 4.8, ARRAY[]::text[], NOW() - INTERVAL '15 days'),
(206, 'Conflict Resolution', 'HR Mediation Team', 'Leadership', 'Turning workplace conflict into constructive dialogue and growth opportunities.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1000&auto=format&fit=crop', '3h 15m', 4.6, ARRAY['HRCI'], NOW() - INTERVAL '60 days'),

-- BUSINESS FUNCTIONS
(301, 'Strategic HR Management', 'James Wilson', 'Business Functions', 'Aligning human resources with the core business objectives to drive long-term organizational success.', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000&auto=format&fit=crop', '8h 45m', 4.2, ARRAY['REQUIRED'], NOW() - INTERVAL '200 days'),
(302, 'Compensation & Benefits', 'Finance Dept', 'Business Functions', 'Designing competitive packages that attract talent without breaking the bank.', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1000&auto=format&fit=crop', '5h 30m', 4.4, ARRAY['SHRM'], NOW() - INTERVAL '4 days'),
(303, 'The Future of HR Analytics', 'Elena Fisher', 'Business Functions', 'Dive deep into predictive analytics and how data is shaping the future of talent acquisition.', 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?q=80&w=1000&auto=format&fit=crop', '6h 00m', 4.9, ARRAY['SHRM', 'HRCI'], NOW() - INTERVAL '1 day'),
(304, 'Labor Law Compliance', 'Legal Partners LLP', 'Business Functions', 'An essential update on federal and state labor laws for the current fiscal year.', 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=1000&auto=format&fit=crop', '4h 00m', 4.3, ARRAY['REQUIRED', 'HRCI'], NOW() - INTERVAL '180 days'),
(305, 'Agile HR Workflows', 'Scrum Masters', 'Business Functions', 'Implementing agile methodologies within the People Operations function.', 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=1000&auto=format&fit=crop', '3h 15m', 4.6, ARRAY[]::text[], NOW() - INTERVAL '25 days'),
(306, 'Global Mobility', 'International Team', 'Business Functions', 'Managing expatriate assignments, visas, and cross-border taxation issues.', 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=1000&auto=format&fit=crop', '4h 45m', 4.5, ARRAY[]::text[], NOW() - INTERVAL '40 days'),

-- SOFT SKILLS
(401, 'Crisis Communication', 'Marcus Rodriguez', 'Soft Skills', 'Effective frameworks for handling internal and external communications during organizational crises.', 'https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?q=80&w=1000&auto=format&fit=crop', '2h 30m', 4.5, ARRAY['HRCI'], NOW() - INTERVAL '3 days'),
(402, 'Active Listening Lab', 'Dr. Lisa Su', 'Soft Skills', 'Techniques to truly hear what your employees are saying, not just what they are speaking.', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000&auto=format&fit=crop', '1h 45m', 4.8, ARRAY[]::text[], NOW() - INTERVAL '7 days'),
(403, 'Negotiation Tactics', 'The Dealmakers', 'Soft Skills', 'Getting to ''Yes'' in salary negotiations, vendor contracts, and internal disputes.', 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1000&auto=format&fit=crop', '3h 00m', 4.7, ARRAY['SHRM'], NOW() - INTERVAL '90 days'),
(404, 'Emotional Intelligence', 'Daniel Goleman (Guest)', 'Soft Skills', 'Understanding your own emotions and those of others to manage relationships effectively.', 'https://images.unsplash.com/photo-1493612276216-ee3925520721?q=80&w=1000&auto=format&fit=crop', '4h 15m', 4.9, ARRAY['REQUIRED'], NOW() - INTERVAL '12 days'),
(405, 'Time Management', 'Productivity Pros', 'Soft Skills', 'Deep work, time blocking, and the art of saying no to non-essential meetings.', 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=1000&auto=format&fit=crop', '2h 00m', 4.4, ARRAY[]::text[], NOW() - INTERVAL '30 days'),
(406, 'Public Speaking', 'Toastmasters', 'Soft Skills', 'Overcome stage fright and deliver compelling presentations to large groups.', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1000&auto=format&fit=crop', '3h 30m', 4.6, ARRAY[]::text[], NOW() - INTERVAL '55 days'),

-- HR STORIES
(501, 'Diversity & Inclusion Stories', 'Maya Patel', 'HR Stories', 'Real-world stories of building inclusive workplace cultures that foster innovation and belonging.', 'https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=1000&auto=format&fit=crop', '3h 30m', 4.7, ARRAY['SHRM'], NOW() - INTERVAL '2 days'),
(502, 'Startup to IPO: A Journey', 'Founders Collective', 'HR Stories', 'The chaotic, exciting, and difficult HR challenges faced during rapid scaling.', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1000&auto=format&fit=crop', '2h 00m', 4.8, ARRAY[]::text[], NOW() - INTERVAL '18 days'),
(503, 'The 4-Day Work Week', 'Case Study Group', 'HR Stories', 'Interviews with companies that successfully made the switch, and those that failed.', 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=1000&auto=format&fit=crop', '1h 45m', 4.5, ARRAY[]::text[], NOW()),
(504, 'From Toxic to Thriving', 'Culture Turnaround', 'HR Stories', 'A documentary-style look at how one company completely overhauled its toxic culture.', 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1000&auto=format&fit=crop', '2h 30m', 4.9, ARRAY['SHRM'], NOW() - INTERVAL '6 days'),
(505, 'Lessons from the Factory Floor', 'Manufacturing HR', 'HR Stories', 'Unique HR challenges in the manufacturing sector and what corporate can learn from them.', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1000&auto=format&fit=crop', '2h 15m', 4.4, ARRAY[]::text[], NOW() - INTERVAL '365 days'),

-- BOOK CLUB
(601, 'Radical Candor Review', 'Book Club Group', 'Book Club', 'A deep dive group discussion into Kim Scott''s Radical Candor and its application in modern HR.', 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?q=80&w=1000&auto=format&fit=crop', '1h 30m', 4.9, ARRAY[]::text[], NOW() - INTERVAL '14 days'),
(602, 'Good to Great', 'Jim Collins (Analysis)', 'Book Club', 'Breaking down the seminal text on why some companies make the leap and others don''t.', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=1000&auto=format&fit=crop', '2h 00m', 4.8, ARRAY[]::text[], NOW() - INTERVAL '500 days'),
(603, 'Work Rules!', 'Google HR Alumni', 'Book Club', 'Discussing Laszlo Bock''s insights from inside Google to transform how you live and lead.', 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?q=80&w=1000&auto=format&fit=crop', '1h 45m', 4.7, ARRAY[]::text[], NOW() - INTERVAL '400 days'),
(604, 'Dare to Lead', 'Brené Brown Fan Club', 'Book Club', 'Exploring courage, vulnerability, and values in the workplace context.', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1000&auto=format&fit=crop', '2h 15m', 4.9, ARRAY['SHRM'], NOW() - INTERVAL '22 days'),
(605, 'The Culture Map', 'Erin Meyer Discussion', 'Book Club', 'Breaking through the invisible boundaries of global business.', 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1000&auto=format&fit=crop', '1h 50m', 4.6, ARRAY[]::text[], NOW() - INTERVAL '28 days');

-- 4. Fix Sequence
SELECT setval('courses_id_seq', (SELECT MAX(id) FROM courses));

-- 5. Seed Modules (3 modules per course)
INSERT INTO modules (course_id, title, "order", duration)
SELECT id, 'Module 1: Introduction', 1, '45m' FROM courses;

INSERT INTO modules (course_id, title, "order", duration)
SELECT id, 'Module 2: Deep Dive', 2, '45m' FROM courses;

INSERT INTO modules (course_id, title, "order", duration)
SELECT id, 'Module 3: Advanced Concepts', 3, '45m' FROM courses;

-- 6. Ensure Public Read Policy for Modules
drop policy if exists "Public modules are viewable by everyone" on modules;
create policy "Public modules are viewable by everyone" on modules for select using (true);
alter table modules enable row level security;
