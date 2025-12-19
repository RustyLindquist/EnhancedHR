import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'
);

async function run() {
  console.log('Seeding backend AI instances...\n');

  const records = [
    {
      key: 'generate_recommendations',
      prompt_text: `You are an expert HR Learning & Development consultant.

USER PROFILE:
- Role: {role}
- Industry: {industry}
- Interests: {interests}
- AI Insights (What we know about them): {insights}

AVAILABLE COURSES:
{course_list}

TASK:
Select exactly 4 courses from the list above that are most relevant to this user's profile and learning needs.
Return ONLY a JSON array of the 4 Course IDs. Do not include any explanation or markdown formatting.
Example: [1, 5, 12, 3]`,
      description: 'Generates personalized course recommendations based on user profile',
      input_variables: ['role', 'industry', 'interests', 'insights', 'course_list'],
      model: 'google/gemini-2.0-flash-001',
      has_prompt: true,
      category: 'recommendations'
    },
    {
      key: 'generate_conversation_title',
      prompt_text: 'Based on this conversation where the user asked: "{user_message}" and the AI responded with: "{ai_response}", generate a very concise title (maximum 5 words) that captures the main topic or intent. Respond with ONLY the title, no quotes or extra text.',
      description: 'Generates a title for AI conversations in Prometheus chat',
      input_variables: ['user_message', 'ai_response'],
      model: 'google/gemini-2.0-flash-001',
      has_prompt: true,
      category: 'chat'
    },
    {
      key: 'embed_course_transcript',
      prompt_text: '',
      description: 'Generates vector embeddings for course transcripts to enable RAG search',
      input_variables: [],
      model: 'text-embedding-004',
      has_prompt: false,
      category: 'embeddings'
    },
    {
      key: 'embed_context_item',
      prompt_text: '',
      description: 'Generates vector embeddings for user context items (notes, insights, files)',
      input_variables: [],
      model: 'text-embedding-004',
      has_prompt: false,
      category: 'embeddings'
    },
    {
      key: 'embed_file_content',
      prompt_text: '',
      description: 'Generates vector embeddings for uploaded file content (PDF, DOCX, TXT)',
      input_variables: [],
      model: 'text-embedding-004',
      has_prompt: false,
      category: 'embeddings'
    },
    {
      key: 'embed_query',
      prompt_text: '',
      description: 'Generates vector embeddings for user queries during RAG search',
      input_variables: [],
      model: 'text-embedding-004',
      has_prompt: false,
      category: 'embeddings'
    }
  ];

  for (const record of records) {
    console.log(`Upserting ${record.key}...`);
    const { error } = await supabase
      .from('ai_prompt_library')
      .upsert(record, { onConflict: 'key' });

    if (error) {
      console.error(`  ✗ Error: ${error.message}`);
    } else {
      console.log(`  ✓ Success`);
    }
  }

  // Verify
  const { data: final } = await supabase
    .from('ai_prompt_library')
    .select('key, category, has_prompt, model')
    .order('category');

  console.log('\n=== Final State ===');
  console.table(final);
}

run().catch(console.error);
