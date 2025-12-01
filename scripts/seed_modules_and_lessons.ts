

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { randomUUID } from 'crypto';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- MOCK DATA GENERATORS ---

const COURSES_TO_SEED = [101, 102];


async function seedContent() {
  console.log('🌱 Seeding Modules and Lessons...');

  for (const courseId of COURSES_TO_SEED) {
    console.log(`\nProcessing Course ${courseId}...`);

    // 1. Cleanup: Delete existing modules (cascades to lessons)
    console.log('   🧹 Cleaning up existing modules...');
    const { error: deleteError } = await supabase
        .from('modules')
        .delete()
        .eq('course_id', courseId);
    
    if (deleteError) {
        console.error('Error cleaning up modules:', deleteError);
    }

    // 2. Create Modules
    const modules = [
      { title: 'Introduction', order: 1, duration: '45m' },
      { title: 'Core Concepts', order: 2, duration: '1h 30m' },
      { title: 'Advanced Application', order: 3, duration: '2h 00m' },
    ];

    for (const modData of modules) {
      const moduleId = randomUUID();
      
      const { error: modError } = await supabase
        .from('modules')
        .upsert({
          id: moduleId,
          course_id: courseId,
          title: modData.title,
          order: modData.order,
          duration: modData.duration
        });

      if (modError) {
        console.error(`Error seeding module ${modData.title}:`, modError);
        continue;
      }
      console.log(`   ✅ Module created: ${modData.title}`);

      // Create Lessons for this Module
      const lessons = [
        { title: `${modData.title} - Part 1`, order: 1, duration: '15m', type: 'video', video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', content: 'Lesson content...' },
        { title: `${modData.title} - Part 2`, order: 2, duration: '15m', type: 'video', video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', content: 'Lesson content...' },
        { title: `${modData.title} - Assessment`, order: 3, duration: '15m', type: 'quiz', quiz_data: { 
            questions: [
                {
                    id: 'q1',
                    text: 'What is the primary focus of this module?',
                    options: [
                        { id: 'a', text: 'To learn about AI', isCorrect: true },
                        { id: 'b', text: 'To learn about cooking', isCorrect: false },
                        { id: 'c', text: 'To learn about sports', isCorrect: false }
                    ]
                }
            ],
            passingScore: 80
        } },
      ];

      for (const lessonData of lessons) {
        const lessonId = randomUUID();
        const { error: lessonError } = await supabase
          .from('lessons')
          .upsert({
            id: lessonId,
            module_id: moduleId,
            title: lessonData.title,
            order: lessonData.order,
            duration: lessonData.duration,
            type: lessonData.type,
            video_url: lessonData.video_url,
            content: lessonData.content,
            quiz_data: lessonData.quiz_data
          });

        if (lessonError) {
          console.error(`Error seeding lesson ${lessonData.title}:`, lessonError);
        } else {
          console.log(`      -> Lesson created: ${lessonData.title}`);
        }
      }
    }
  }

  console.log('\n✅ Seeding Complete!');
}

seedContent().catch(console.error);

