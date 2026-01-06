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

const TEST_COURSE_ID = 999;

const RESOURCES = [
  {
    id: randomUUID(),
    course_id: TEST_COURSE_ID,
    title: "HR Analytics Framework Guide",
    type: "PDF",
    size: "2.4 MB",
    url: "https://example.com/resources/hr-analytics-framework.pdf"
  },
  {
    id: randomUUID(),
    course_id: TEST_COURSE_ID,
    title: "Data Collection Templates",
    type: "XLS",
    size: "856 KB",
    url: "https://example.com/resources/data-collection-templates.xlsx"
  },
  {
    id: randomUUID(),
    course_id: TEST_COURSE_ID,
    title: "Dashboard Design Best Practices",
    type: "PDF",
    size: "1.8 MB",
    url: "https://example.com/resources/dashboard-best-practices.pdf"
  },
  {
    id: randomUUID(),
    course_id: TEST_COURSE_ID,
    title: "HR Metrics Glossary",
    type: "PDF",
    size: "945 KB",
    url: "https://example.com/resources/metrics-glossary.pdf"
  },
  {
    id: randomUUID(),
    course_id: TEST_COURSE_ID,
    title: "Sample Analytics Dashboard",
    type: "XLS",
    size: "3.2 MB",
    url: "https://example.com/resources/sample-dashboard.xlsx"
  },
  {
    id: randomUUID(),
    course_id: TEST_COURSE_ID,
    title: "Predictive Analytics Cheat Sheet",
    type: "PDF",
    size: "1.1 MB",
    url: "https://example.com/resources/predictive-analytics-cheatsheet.pdf"
  }
];

async function seedResources() {
  console.log('📦 Seeding Course Resources...\n');

  // Clean up existing resources
  console.log('🧹 Cleaning up existing resources...');
  const { error: deleteError } = await supabase
    .from('resources')
    .delete()
    .eq('course_id', TEST_COURSE_ID);

  if (deleteError) {
    console.error('Error cleaning up resources:', deleteError);
  }

  // Insert new resources
  for (const resource of RESOURCES) {
    const { error } = await supabase
      .from('resources')
      .upsert(resource);

    if (error) {
      console.error(`❌ Error creating resource "${resource.title}":`, error);
    } else {
      console.log(`✅ ${resource.title} (${resource.type}, ${resource.size})`);
    }
  }

  console.log('\n✅ Resources seeded successfully!');
  console.log(`📊 Total resources: ${RESOURCES.length}`);
}

seedResources().catch(console.error);
