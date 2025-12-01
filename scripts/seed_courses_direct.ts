
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const MOCK_COURSES = [
  {
    id: 101,
    title: "AI Leadership Strategies",
    author: "Dr. Sarah Chen",
    category: "AI for HR",
    image_url: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop",
    description: "Master the art of leading teams through the AI revolution. Learn to balance automation with human empathy.",
    duration: "4h 15m",
    rating: 4.8,
    badges: ['REQUIRED', 'SHRM'],
    is_saved: true,
    collections: ['favorites'],
    status: 'published',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 102,
    title: "Generative AI for Recruiters",
    author: "Tech HR Labs",
    category: "AI for HR",
    image_url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop",
    description: "Practical applications of LLMs in sourcing, screening, and communicating with candidates.",
    duration: "3h 00m",
    rating: 4.8,
    badges: ['SHRM'],
    is_saved: true,
    collections: ['to_learn'],
    status: 'published',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 103,
    title: "Prompt Engineering 101",
    author: "Alex Rivera",
    category: "AI for HR",
    image_url: "https://images.unsplash.com/photo-1678911820864-e2c567c655d7?q=80&w=1000&auto=format&fit=crop",
    description: "Learn the specific syntax and structures to get the best results from ChatGPT and Claude for HR tasks.",
    duration: "2h 15m",
    rating: 4.9,
    badges: [],
    is_saved: false,
    collections: [],
    status: 'published',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 201,
    title: "Change Management Essentials",
    author: "Robert Fox",
    category: "Leadership",
    image_url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1000&auto=format&fit=crop",
    description: "Navigating organizational transitions with minimal disruption and maximum employee engagement.",
    duration: "5h 15m",
    rating: 4.6,
    badges: ['HRCI'],
    is_saved: true,
    collections: ['to_learn'],
    status: 'published',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 301,
    title: "Strategic HR Management",
    author: "James Wilson",
    category: "Business Functions",
    image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000&auto=format&fit=crop",
    description: "Aligning human resources with the core business objectives to drive long-term organizational success.",
    duration: "8h 45m",
    rating: 4.2,
    badges: ['REQUIRED'],
    is_saved: false,
    collections: [],
    status: 'published',
    created_at: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 401,
    title: "Crisis Communication",
    author: "Marcus Rodriguez",
    category: "Soft Skills",
    image_url: "https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?q=80&w=1000&auto=format&fit=crop",
    description: "Effective frameworks for handling internal and external communications during organizational crises.",
    duration: "2h 30m",
    rating: 4.5,
    badges: ['HRCI'],
    is_saved: false,
    collections: [],
    status: 'published',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  }
];

async function seedCourses() {
  console.log('Seeding courses...');
  
  for (const course of MOCK_COURSES) {
    const { error } = await supabase
      .from('courses')
      .upsert(course, { onConflict: 'id' });
      
    if (error) {
      console.error(`Error seeding course ${course.id}:`, error);
    } else {
      console.log(`Seeded course: ${course.title}`);
    }
  }
  
  console.log('Done!');
}

seedCourses();
