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

// TEST COURSE ID - Use a unique ID that can be easily identified and deleted later
const TEST_COURSE_ID = 999;

// Full test course with realistic content
const TEST_COURSE = {
  id: TEST_COURSE_ID,
  title: "Strategic HR Analytics",
  author: "Dr. Emily Rodriguez",
  category: "Analytics",
  image_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2000&auto=format&fit=crop",
  description: "Master the power of data-driven decision making in HR. This comprehensive course teaches you how to collect, analyze, and present HR metrics that drive business value. Learn to build dashboards, conduct predictive analytics, and communicate insights to stakeholders.",
  duration: "6h 45m",
  rating: 4.9,
  badges: ['SHRM', 'HRCI'],
  is_saved: false,
  collections: [],
  status: 'published',
  created_at: new Date().toISOString()
};

// Mux test video playback IDs (these are public Mux test streams)
const MUX_TEST_VIDEOS = [
  'EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs', // Big Buck Bunny
  'Wtx00gP2Vow01aWBp7v02DJMYDfj4O9RKQnIJQSLh9Pw00', // Sintel
  'qxb01SJoRrC02cYuv9rCBQ4vV01RQKT5x2W2FGE2fKV68M', // Test pattern
];

// Comprehensive course content structure
const MODULES = [
  {
    title: "Introduction to HR Analytics",
    order: 1,
    duration: "1h 15m",
    lessons: [
      {
        title: "Welcome to HR Analytics",
        order: 1,
        duration: "8m",
        type: "video",
        mux_playback_id: MUX_TEST_VIDEOS[0],
        content: "Introduction to the course and what you'll learn about HR analytics."
      },
      {
        title: "The Business Case for HR Analytics",
        order: 2,
        duration: "12m",
        type: "video",
        mux_playback_id: MUX_TEST_VIDEOS[1],
        content: "Understanding why HR analytics is critical for modern organizations."
      },
      {
        title: "Key HR Metrics Overview",
        order: 3,
        duration: "15m",
        type: "video",
        mux_playback_id: MUX_TEST_VIDEOS[2],
        content: "Overview of the most important HR metrics to track."
      },
      {
        title: "Module 1 Assessment",
        order: 4,
        duration: "10m",
        type: "quiz",
        quiz_data: {
          questions: [
            {
              id: 'q1',
              text: 'What is the primary purpose of HR analytics?',
              options: [
                { id: 'a', text: 'To make data-driven decisions about people and workforce strategies', isCorrect: true },
                { id: 'b', text: 'To replace HR professionals with automated systems', isCorrect: false },
                { id: 'c', text: 'To reduce the HR budget', isCorrect: false },
                { id: 'd', text: 'To monitor employee behavior', isCorrect: false }
              ]
            },
            {
              id: 'q2',
              text: 'Which of the following is NOT a common HR metric?',
              options: [
                { id: 'a', text: 'Employee turnover rate', isCorrect: false },
                { id: 'b', text: 'Time to hire', isCorrect: false },
                { id: 'c', text: 'Stock price volatility', isCorrect: true },
                { id: 'd', text: 'Cost per hire', isCorrect: false }
              ]
            },
            {
              id: 'q3',
              text: 'HR analytics can help organizations with:',
              options: [
                { id: 'a', text: 'Predicting employee attrition', isCorrect: false },
                { id: 'b', text: 'Optimizing recruitment strategies', isCorrect: false },
                { id: 'c', text: 'Identifying skills gaps', isCorrect: false },
                { id: 'd', text: 'All of the above', isCorrect: true }
              ]
            }
          ],
          passingScore: 70
        }
      }
    ]
  },
  {
    title: "Data Collection and Management",
    order: 2,
    duration: "1h 45m",
    lessons: [
      {
        title: "Sources of HR Data",
        order: 1,
        duration: "14m",
        type: "video",
        mux_playback_id: MUX_TEST_VIDEOS[0],
        content: "Identifying and accessing various sources of HR data in your organization."
      },
      {
        title: "Data Quality and Integrity",
        order: 2,
        duration: "18m",
        type: "video",
        mux_playback_id: MUX_TEST_VIDEOS[1],
        content: "Ensuring your HR data is accurate, complete, and reliable."
      },
      {
        title: "HRIS Systems Overview",
        order: 3,
        duration: "16m",
        type: "video",
        mux_playback_id: MUX_TEST_VIDEOS[2],
        content: "Understanding how to leverage your HRIS for analytics."
      },
      {
        title: "Data Privacy and Compliance",
        order: 4,
        duration: "20m",
        type: "video",
        mux_playback_id: MUX_TEST_VIDEOS[0],
        content: "Navigating GDPR, privacy laws, and ethical considerations in HR analytics."
      },
      {
        title: "Module 2 Assessment",
        order: 5,
        duration: "12m",
        type: "quiz",
        quiz_data: {
          questions: [
            {
              id: 'q1',
              text: 'What is the most critical factor in HR data analytics?',
              options: [
                { id: 'a', text: 'Data quality', isCorrect: true },
                { id: 'b', text: 'Data quantity', isCorrect: false },
                { id: 'c', text: 'Data speed', isCorrect: false },
                { id: 'd', text: 'Data cost', isCorrect: false }
              ]
            },
            {
              id: 'q2',
              text: 'Which regulation requires organizations to protect employee data in the EU?',
              options: [
                { id: 'a', text: 'HIPAA', isCorrect: false },
                { id: 'b', text: 'GDPR', isCorrect: true },
                { id: 'c', text: 'SOX', isCorrect: false },
                { id: 'd', text: 'PCI-DSS', isCorrect: false }
              ]
            }
          ],
          passingScore: 70
        }
      }
    ]
  },
  {
    title: "Workforce Analytics Fundamentals",
    order: 3,
    duration: "2h 00m",
    lessons: [
      {
        title: "Turnover Analysis",
        order: 1,
        duration: "22m",
        type: "video",
        mux_playback_id: MUX_TEST_VIDEOS[1],
        content: "Deep dive into calculating and analyzing employee turnover."
      },
      {
        title: "Recruitment Metrics",
        order: 2,
        duration: "18m",
        type: "video",
        mux_playback_id: MUX_TEST_VIDEOS[2],
        content: "Measuring the efficiency and effectiveness of your recruitment process."
      },
      {
        title: "Performance Analytics",
        order: 3,
        duration: "25m",
        type: "video",
        mux_playback_id: MUX_TEST_VIDEOS[0],
        content: "Analyzing employee performance data to identify trends and insights."
      },
      {
        title: "Compensation Analytics",
        order: 4,
        duration: "20m",
        type: "video",
        mux_playback_id: MUX_TEST_VIDEOS[1],
        content: "Understanding pay equity, competitiveness, and total rewards analytics."
      },
      {
        title: "Module 3 Assessment",
        order: 5,
        duration: "15m",
        type: "quiz",
        quiz_data: {
          questions: [
            {
              id: 'q1',
              text: 'What does "time to fill" measure in recruitment analytics?',
              options: [
                { id: 'a', text: 'The number of days from when a job is posted until an offer is accepted', isCorrect: true },
                { id: 'b', text: 'The number of applications received per day', isCorrect: false },
                { id: 'c', text: 'The time it takes to interview a candidate', isCorrect: false },
                { id: 'd', text: 'The duration of the onboarding process', isCorrect: false }
              ]
            },
            {
              id: 'q2',
              text: 'Voluntary turnover rate measures:',
              options: [
                { id: 'a', text: 'Employees who leave by their own choice', isCorrect: true },
                { id: 'b', text: 'Employees who are terminated', isCorrect: false },
                { id: 'c', text: 'All employees who leave', isCorrect: false },
                { id: 'd', text: 'Employees who retire', isCorrect: false }
              ]
            },
            {
              id: 'q3',
              text: 'Pay equity analysis helps organizations:',
              options: [
                { id: 'a', text: 'Identify compensation gaps across different groups', isCorrect: true },
                { id: 'b', text: 'Reduce overall compensation costs', isCorrect: false },
                { id: 'c', text: 'Eliminate all performance bonuses', isCorrect: false },
                { id: 'd', text: 'Hire more employees', isCorrect: false }
              ]
            }
          ],
          passingScore: 70
        }
      }
    ]
  },
  {
    title: "Predictive Analytics and Modeling",
    order: 4,
    duration: "1h 45m",
    lessons: [
      {
        title: "Introduction to Predictive Analytics",
        order: 1,
        duration: "16m",
        type: "video",
        mux_playback_id: MUX_TEST_VIDEOS[2],
        content: "Understanding how predictive models can forecast HR outcomes."
      },
      {
        title: "Attrition Prediction Models",
        order: 2,
        duration: "24m",
        type: "video",
        mux_playback_id: MUX_TEST_VIDEOS[0],
        content: "Building models to predict which employees are at risk of leaving."
      },
      {
        title: "Succession Planning Analytics",
        order: 3,
        duration: "20m",
        type: "video",
        mux_playback_id: MUX_TEST_VIDEOS[1],
        content: "Using analytics to identify and develop future leaders."
      },
      {
        title: "Skills Gap Analysis",
        order: 4,
        duration: "18m",
        type: "video",
        mux_playback_id: MUX_TEST_VIDEOS[2],
        content: "Identifying current and future skills needs in your organization."
      },
      {
        title: "Module 4 Assessment",
        order: 5,
        duration: "12m",
        type: "quiz",
        quiz_data: {
          questions: [
            {
              id: 'q1',
              text: 'Predictive analytics in HR is primarily used to:',
              options: [
                { id: 'a', text: 'Forecast future HR trends and outcomes', isCorrect: true },
                { id: 'b', text: 'Record historical data', isCorrect: false },
                { id: 'c', text: 'Replace human decision-making entirely', isCorrect: false },
                { id: 'd', text: 'Reduce headcount', isCorrect: false }
              ]
            },
            {
              id: 'q2',
              text: 'Common factors in attrition prediction models include:',
              options: [
                { id: 'a', text: 'Tenure, compensation, performance ratings', isCorrect: true },
                { id: 'b', text: 'Only salary information', isCorrect: false },
                { id: 'c', text: 'Employee birthdays', isCorrect: false },
                { id: 'd', text: 'Office location only', isCorrect: false }
              ]
            }
          ],
          passingScore: 70
        }
      }
    ]
  },
  {
    title: "Reporting and Visualization",
    order: 5,
    duration: "1h 30m",
    lessons: [
      {
        title: "Designing Effective HR Dashboards",
        order: 1,
        duration: "20m",
        type: "video",
        mux_playback_id: MUX_TEST_VIDEOS[0],
        content: "Best practices for creating impactful HR dashboards."
      },
      {
        title: "Data Visualization Principles",
        order: 2,
        duration: "18m",
        type: "video",
        mux_playback_id: MUX_TEST_VIDEOS[1],
        content: "Choosing the right charts and visualizations for your HR data."
      },
      {
        title: "Storytelling with Data",
        order: 3,
        duration: "22m",
        type: "video",
        mux_playback_id: MUX_TEST_VIDEOS[2],
        content: "Communicating insights to stakeholders through compelling narratives."
      },
      {
        title: "Real-Time Reporting",
        order: 4,
        duration: "15m",
        type: "video",
        mux_playback_id: MUX_TEST_VIDEOS[0],
        content: "Setting up automated reports and real-time monitoring."
      },
      {
        title: "Module 5 Assessment",
        order: 5,
        duration: "10m",
        type: "quiz",
        quiz_data: {
          questions: [
            {
              id: 'q1',
              text: 'What makes an HR dashboard effective?',
              options: [
                { id: 'a', text: 'Clear metrics, actionable insights, and easy-to-understand visualizations', isCorrect: true },
                { id: 'b', text: 'As many charts as possible', isCorrect: false },
                { id: 'c', text: 'Complex statistical models', isCorrect: false },
                { id: 'd', text: 'Bright colors only', isCorrect: false }
              ]
            },
            {
              id: 'q2',
              text: 'When presenting HR data to executives, you should:',
              options: [
                { id: 'a', text: 'Focus on business impact and actionable recommendations', isCorrect: true },
                { id: 'b', text: 'Show every data point collected', isCorrect: false },
                { id: 'c', text: 'Use only technical jargon', isCorrect: false },
                { id: 'd', text: 'Avoid visualizations', isCorrect: false }
              ]
            }
          ],
          passingScore: 70
        }
      }
    ]
  }
];

async function seedCompleteTestCourse() {
  console.log('🌱 Seeding Complete Test Course...\n');

  // 1. Create the course
  console.log('📚 Creating course...');
  const { error: courseError } = await supabase
    .from('courses')
    .upsert(TEST_COURSE, { onConflict: 'id' });

  if (courseError) {
    console.error('Error creating course:', courseError);
    return;
  }
  console.log(`✅ Course created: "${TEST_COURSE.title}" (ID: ${TEST_COURSE_ID})\n`);

  // 2. Clean up existing modules for this course
  console.log('🧹 Cleaning up existing modules...');
  const { error: deleteError } = await supabase
    .from('modules')
    .delete()
    .eq('course_id', TEST_COURSE_ID);

  if (deleteError) {
    console.error('Error cleaning up modules:', deleteError);
  }

  // 3. Create modules and lessons
  for (const moduleData of MODULES) {
    const moduleId = randomUUID();

    console.log(`\n📖 Creating module: "${moduleData.title}"`);
    const { error: modError } = await supabase
      .from('modules')
      .upsert({
        id: moduleId,
        course_id: TEST_COURSE_ID,
        title: moduleData.title,
        order: moduleData.order,
        duration: moduleData.duration
      });

    if (modError) {
      console.error(`   ❌ Error creating module:`, modError);
      continue;
    }
    console.log(`   ✅ Module created`);

    // Create lessons for this module
    for (const lessonData of moduleData.lessons) {
      const lessonId = randomUUID();

      const lessonRecord: any = {
        id: lessonId,
        module_id: moduleId,
        title: lessonData.title,
        order: lessonData.order,
        duration: lessonData.duration,
        type: lessonData.type,
        content: lessonData.content
      };

      // Add video-specific fields
      if (lessonData.type === 'video' && 'mux_playback_id' in lessonData) {
        lessonRecord.mux_playback_id = lessonData.mux_playback_id;
        lessonRecord.video_url = lessonData.mux_playback_id; // Also store in video_url for backwards compatibility
      }

      // Add quiz-specific fields
      if (lessonData.type === 'quiz' && 'quiz_data' in lessonData) {
        lessonRecord.quiz_data = lessonData.quiz_data;
      }

      const { error: lessonError } = await supabase
        .from('lessons')
        .upsert(lessonRecord);

      if (lessonError) {
        console.error(`   ❌ Error creating lesson "${lessonData.title}":`, lessonError);
      } else {
        const lessonType = lessonData.type === 'video' ? '🎥' : '📝';
        console.log(`      ${lessonType} ${lessonData.title} (${lessonData.duration})`);
      }
    }
  }

  console.log('\n✅ Seeding Complete!');
  console.log('\n📊 Course Summary:');
  console.log(`   Course ID: ${TEST_COURSE_ID}`);
  console.log(`   Title: ${TEST_COURSE.title}`);
  console.log(`   Modules: ${MODULES.length}`);
  console.log(`   Total Lessons: ${MODULES.reduce((sum, m) => sum + m.lessons.length, 0)}`);
  console.log(`   Video Lessons: ${MODULES.reduce((sum, m) => sum + m.lessons.filter(l => l.type === 'video').length, 0)}`);
  console.log(`   Quizzes: ${MODULES.reduce((sum, m) => sum + m.lessons.filter(l => l.type === 'quiz').length, 0)}`);
  console.log('\n💡 To delete this test course later, run:');
  console.log(`   DELETE FROM courses WHERE id = ${TEST_COURSE_ID};`);
}

seedCompleteTestCourse().catch(console.error);
