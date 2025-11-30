-- Seed Data for Courses
INSERT INTO public.courses (id, title, author, category, description, image_url, duration, rating, badges, created_at) VALUES
(1, 'Strategic HR Leadership', 'Dr. Sarah Mitchell', 'Leadership', 'Master the art of strategic human resources planning and execution. Learn how to align HR initiatives with organizational goals.', 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2940&auto=format&fit=crop', '4h 30m', 4.8, ARRAY['SHRM','HRCI'], '2024-01-15'),
(2, 'AI in Human Resources', 'James Chen', 'Technology', 'Explore the transformative power of AI in HR. From recruitment to employee engagement, learn how to leverage AI tools effectively.', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2832&auto=format&fit=crop', '3h 15m', 4.9, ARRAY['REQUIRED'], '2024-02-01'),
(3, 'Conflict Resolution Mastery', 'Elena Rodriguez', 'Communication', 'Develop essential skills for managing and resolving workplace conflicts. Create a positive and productive work environment.', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=2787&auto=format&fit=crop', '2h 45m', 4.7, ARRAY['SHRM'], '2024-01-20'),
(4, 'Inclusive Culture Building', 'Marcus Johnson', 'Culture', 'Learn how to build and maintain a truly inclusive workplace culture. Strategies for diversity, equity, and inclusion.', 'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?q=80&w=2874&auto=format&fit=crop', '3h 45m', 4.9, ARRAY['HRCI'], '2024-02-10'),
(5, 'Performance Management', 'Jennifer Wu', 'Management', 'Modern approaches to performance management. Move beyond annual reviews to continuous feedback and growth.', 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=2940&auto=format&fit=crop', '4h 00m', 4.6, ARRAY[]::text[], '2024-01-05'),
(6, 'HR Analytics Fundamentals', 'David Thompson', 'Analytics', 'Data-driven decision making in HR. Learn the basics of HR analytics and how to interpret key metrics.', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2940&auto=format&fit=crop', '5h 15m', 4.8, ARRAY['SHRM','HRCI'], '2024-02-15');

-- Seed Data for Modules (Mock)
INSERT INTO public.modules (course_id, title, "order", duration) VALUES
(1, 'Module 1: Introduction to Leadership', 1, '45m'),
(1, 'Module 2: Introduction to Leadership', 2, '45m'),
(1, 'Module 3: Introduction to Leadership', 3, '45m'),
(2, 'Module 1: Introduction to Technology', 1, '45m'),
(2, 'Module 2: Introduction to Technology', 2, '45m'),
(2, 'Module 3: Introduction to Technology', 3, '45m'),
(3, 'Module 1: Introduction to Communication', 1, '45m'),
(3, 'Module 2: Introduction to Communication', 2, '45m'),
(3, 'Module 3: Introduction to Communication', 3, '45m'),
(4, 'Module 1: Introduction to Culture', 1, '45m'),
(4, 'Module 2: Introduction to Culture', 2, '45m'),
(4, 'Module 3: Introduction to Culture', 3, '45m'),
(5, 'Module 1: Introduction to Management', 1, '45m'),
(5, 'Module 2: Introduction to Management', 2, '45m'),
(5, 'Module 3: Introduction to Management', 3, '45m'),
(6, 'Module 1: Introduction to Analytics', 1, '45m'),
(6, 'Module 2: Introduction to Analytics', 2, '45m'),
(6, 'Module 3: Introduction to Analytics', 3, '45m');
