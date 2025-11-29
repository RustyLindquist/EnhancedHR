const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Ideally use SERVICE_ROLE_KEY for seeding, but ANON might work if RLS allows insert or is disabled temporarily. For now, assuming user will run this locally or we use a service role key if provided. 
// Actually, for seeding, we usually need the Service Role Key to bypass RLS or we need to be logged in. 
// Since we don't have the Service Role Key, we will ask the user to provide it or run this script with it.
// OR, we can just insert into 'courses' since we made it public read, but write is restricted.
// Let's assume the user will run this and might need to temporarily disable RLS or provide the service key.

// For this script to work robustly, we really need the SERVICE_ROLE_KEY.
// I'll add a prompt or just use the anon key and hope the user has set up policies to allow anon insert (unlikely) or I will instruct them to use the SQL editor for the initial seed if this fails.

// BETTER APPROACH: Generate a SQL file for the seed data too! It's much safer and guaranteed to work in the SQL editor.

const fs = require('fs');
const path = require('path');

// Mock Data (Copied from constants.ts to avoid TS compilation issues in a simple script)
const MOCK_COURSES = [
    {
        id: 1,
        title: 'Strategic HR Leadership',
        author: 'Dr. Sarah Mitchell',
        progress: 0,
        category: 'Leadership',
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2940&auto=format&fit=crop',
        description: 'Master the art of strategic human resources planning and execution. Learn how to align HR initiatives with organizational goals.',
        duration: '4h 30m',
        rating: 4.8,
        badges: ['SHRM', 'HRCI'],
        isSaved: false,
        collections: [],
        dateAdded: '2024-01-15'
    },
    {
        id: 2,
        title: 'AI in Human Resources',
        author: 'James Chen',
        progress: 0,
        category: 'Technology',
        image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2832&auto=format&fit=crop',
        description: 'Explore the transformative power of AI in HR. From recruitment to employee engagement, learn how to leverage AI tools effectively.',
        duration: '3h 15m',
        rating: 4.9,
        badges: ['REQUIRED'],
        isSaved: false,
        collections: [],
        dateAdded: '2024-02-01'
    },
    {
        id: 3,
        title: 'Conflict Resolution Mastery',
        author: 'Elena Rodriguez',
        progress: 0,
        category: 'Communication',
        image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=2787&auto=format&fit=crop',
        description: 'Develop essential skills for managing and resolving workplace conflicts. Create a positive and productive work environment.',
        duration: '2h 45m',
        rating: 4.7,
        badges: ['SHRM'],
        isSaved: false,
        collections: [],
        dateAdded: '2024-01-20'
    },
    {
        id: 4,
        title: 'Inclusive Culture Building',
        author: 'Marcus Johnson',
        progress: 0,
        category: 'Culture',
        image: 'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?q=80&w=2874&auto=format&fit=crop',
        description: 'Learn how to build and maintain a truly inclusive workplace culture. Strategies for diversity, equity, and inclusion.',
        duration: '3h 45m',
        rating: 4.9,
        badges: ['HRCI'],
        isSaved: false,
        collections: [],
        dateAdded: '2024-02-10'
    },
    {
        id: 5,
        title: 'Performance Management',
        author: 'Jennifer Wu',
        progress: 0,
        category: 'Management',
        image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=2940&auto=format&fit=crop',
        description: 'Modern approaches to performance management. Move beyond annual reviews to continuous feedback and growth.',
        duration: '4h 00m',
        rating: 4.6,
        badges: [],
        isSaved: false,
        collections: [],
        dateAdded: '2024-01-05'
    },
    {
        id: 6,
        title: 'HR Analytics Fundamentals',
        author: 'David Thompson',
        progress: 0,
        category: 'Analytics',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2940&auto=format&fit=crop',
        description: 'Data-driven decision making in HR. Learn the basics of HR analytics and how to interpret key metrics.',
        duration: '5h 15m',
        rating: 4.8,
        badges: ['SHRM', 'HRCI'],
        isSaved: false,
        collections: [],
        dateAdded: '2024-02-15'
    }
];

// Generate SQL for seeding
let sql = `-- Seed Data for Courses\n`;
sql += `INSERT INTO courses (id, title, author, category, description, image_url, duration, rating, badges, created_at) VALUES\n`;

const values = MOCK_COURSES.map(course => {
    const badges = course.badges.length > 0 ? `ARRAY['${course.badges.join("','")}']` : 'ARRAY[]::text[]';
    return `(${course.id}, '${course.title.replace(/'/g, "''")}', '${course.author}', '${course.category}', '${course.description.replace(/'/g, "''")}', '${course.image}', '${course.duration}', ${course.rating}, ${badges}, '${course.dateAdded}')`;
}).join(',\n');

sql += values + ';\n\n';

// Seed Modules (Mocking modules for each course)
sql += `-- Seed Data for Modules (Mock)\n`;
sql += `INSERT INTO modules (course_id, title, "order", duration) VALUES\n`;

const moduleValues = [];
MOCK_COURSES.forEach(course => {
    // Create 3 modules for each course
    for (let i = 1; i <= 3; i++) {
        moduleValues.push(`(${course.id}, 'Module ${i}: Introduction to ${course.category}', ${i}, '45m')`);
    }
});
sql += moduleValues.join(',\n') + ';\n';

console.log(sql);
