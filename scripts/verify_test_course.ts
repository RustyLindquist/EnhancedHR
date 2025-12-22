import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyCourse() {
  console.log('🔍 Verifying test course (ID: 999)...\n');

  // Check course
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', 999)
    .single();

  if (courseError) {
    console.error('❌ Course not found:', courseError);
    return;
  }

  console.log('✅ Course found:');
  console.log(`   ID: ${course.id}`);
  console.log(`   Title: ${course.title}`);
  console.log(`   Author: ${course.author}`);
  console.log(`   Status: ${course.status}`);
  console.log(`   Category: ${course.category}`);

  // Check modules
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('id, title, order')
    .eq('course_id', 999)
    .order('order');

  if (modulesError) {
    console.error('❌ Error fetching modules:', modulesError);
  } else {
    console.log(`\n📖 Modules: ${modules.length}`);
    modules.forEach(m => console.log(`   ${m.order}. ${m.title}`));
  }

  // Check lessons
  if (modules && modules.length > 0) {
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, module_id, title, type')
      .in('module_id', modules.map(m => m.id));

    if (lessonsError) {
      console.error('❌ Error fetching lessons:', lessonsError);
    } else if (lessons) {
      console.log(`\n🎥 Lessons: ${lessons.length}`);
      console.log(`   Videos: ${lessons.filter(l => l.type === 'video').length}`);
      console.log(`   Quizzes: ${lessons.filter(l => l.type === 'quiz').length}`);
    }
  }

  // Check resources
  const { data: resources, error: resourcesError } = await supabase
    .from('resources')
    .select('id, title, type')
    .eq('course_id', 999);

  if (resourcesError) {
    console.error('❌ Error fetching resources:', resourcesError);
  } else if (resources) {
    console.log(`\n📦 Resources: ${resources.length}`);
  }

  // Test the fetchCoursesAction logic
  console.log('\n🔍 Testing course retrieval...');
  const { data: allCourses } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });

  const testCourse = allCourses?.find(c => c.id === 999);
  if (testCourse) {
    console.log('✅ Course appears in standard query');
  } else {
    console.log('❌ Course NOT in standard query results');
  }
}

verifyCourse().catch(console.error);
