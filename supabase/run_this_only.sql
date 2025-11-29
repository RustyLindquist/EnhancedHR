-- !!! IMPORTANT: CLEAR THE EDITOR BEFORE PASTING THIS !!!

-- 1. Ensure RLS Policy is correct for Courses
drop policy if exists "Public courses are viewable by everyone" on courses;
create policy "Public courses are viewable by everyone" on courses for select using (true);
alter table courses enable row level security;

-- 2. Seed Courses (Upsert to avoid duplicates)
INSERT INTO courses (id, title, author, category, description, image_url, duration, rating, badges, created_at) VALUES
(1, 'Strategic HR Leadership', 'Dr. Sarah Mitchell', 'Leadership', 'Master the art of strategic human resources planning and execution. Learn how to align HR initiatives with organizational goals.', 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2940&auto=format&fit=crop', '4h 30m', 4.8, ARRAY['SHRM','HRCI'], '2024-01-15'),
(2, 'AI in Human Resources', 'James Chen', 'Technology', 'Explore the transformative power of AI in HR. From recruitment to employee engagement, learn how to leverage AI tools effectively.', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2832&auto=format&fit=crop', '3h 15m', 4.9, ARRAY['REQUIRED'], '2024-02-01'),
(3, 'Conflict Resolution Mastery', 'Elena Rodriguez', 'Communication', 'Develop essential skills for managing and resolving workplace conflicts. Create a positive and productive work environment.', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=2787&auto=format&fit=crop', '2h 45m', 4.7, ARRAY['SHRM'], '2024-01-20'),
(4, 'Inclusive Culture Building', 'Marcus Johnson', 'Culture', 'Learn how to build and maintain a truly inclusive workplace culture. Strategies for diversity, equity, and inclusion.', 'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?q=80&w=2874&auto=format&fit=crop', '3h 45m', 4.9, ARRAY['HRCI'], '2024-02-10'),
(5, 'Performance Management', 'Jennifer Wu', 'Management', 'Modern approaches to performance management. Move beyond annual reviews to continuous feedback and growth.', 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=2940&auto=format&fit=crop', '4h 00m', 4.6, ARRAY[]::text[], '2024-01-05'),
(6, 'HR Analytics Fundamentals', 'David Thompson', 'Analytics', 'Data-driven decision making in HR. Learn the basics of HR analytics and how to interpret key metrics.', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2940&auto=format&fit=crop', '5h 15m', 4.8, ARRAY['SHRM','HRCI'], '2024-02-15')
ON CONFLICT (id) DO UPDATE SET
title = EXCLUDED.title,
author = EXCLUDED.author,
category = EXCLUDED.category,
description = EXCLUDED.description,
image_url = EXCLUDED.image_url,
duration = EXCLUDED.duration,
rating = EXCLUDED.rating,
badges = EXCLUDED.badges;

-- 3. Fix Sequence
SELECT setval('courses_id_seq', (SELECT MAX(id) FROM courses));

-- 4. Seed Modules
DELETE FROM modules WHERE course_id IN (1, 2, 3, 4, 5, 6);

INSERT INTO modules (course_id, title, "order", duration) VALUES
(1, 'Module 1: Introduction to Leadership', 1, '45m'),
(1, 'Module 2: Strategic Planning', 2, '45m'),
(1, 'Module 3: Team Building', 3, '45m'),
(2, 'Module 1: AI Fundamentals', 1, '45m'),
(2, 'Module 2: AI Tools for HR', 2, '45m'),
(2, 'Module 3: Ethics in AI', 3, '45m'),
(3, 'Module 1: Understanding Conflict', 1, '45m'),
(3, 'Module 2: Mediation Techniques', 2, '45m'),
(3, 'Module 3: Resolution Strategies', 3, '45m'),
(4, 'Module 1: Diversity Basics', 1, '45m'),
(4, 'Module 2: Inclusion Strategies', 2, '45m'),
(4, 'Module 3: Measuring Belonging', 3, '45m'),
(5, 'Module 1: Goal Setting', 1, '45m'),
(5, 'Module 2: Feedback Loops', 2, '45m'),
(5, 'Module 3: Performance Reviews', 3, '45m'),
(6, 'Module 1: Data Literacy', 1, '45m'),
(6, 'Module 2: Key HR Metrics', 2, '45m'),
(6, 'Module 3: Predictive Analytics', 3, '45m');

-- 5. Ensure Public Read Policy for Modules
drop policy if exists "Public modules are viewable by everyone" on modules;
create policy "Public modules are viewable by everyone" on modules for select using (true);
alter table modules enable row level security;
