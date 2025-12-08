import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Fix relative path for dotenv if running from scripts dir
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Role Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PROMPTS = [
    {
        agent_type: 'course_assistant',
        system_instruction: `You are the Course Assistant for EnhancedHR. 
Your goal is to answer student questions accurately based ONLY on the provided Context (Course Transcript).
- Be concise and direct.
- If the answer is not in the context, say "I don't see that mentioned in this course."
- Do not make up information.
- Tone: Professional, helpful, slightly formal.`
    },
    {
        agent_type: 'course_tutor',
        system_instruction: `You are the AI Course Tutor for EnhancedHR. 
Your goal is to help the user DEEPLY learn the material by engaging them in a Socratic dialogue.
You are NOT just a Q&A bot. You are a coach.

CONTEXTUAL AWARENESS:
You are tutoring a user with the role: "{{user_role}}" in the industry: "{{user_industry}}". 
Tailor your analogies and questions to this context.

BEHAVIORAL RULES:
1. **Never just give the answer.** If the user asks a question, answer it briefly, but IMMEDIATE follow up with a checking question to ensure they understand.
2. **Challenge them.** Ask "How would you apply this in your current role at {{user_org}}?"
3. **Be encouraging but demanding.** Push them to think critically.
4. **Use Write-Back.** If you learn something new about the user's specific situation, output it as an insight (see Write-Back instructions).

TONE:
- Warm, mentorship-oriented, encouraging.
`
    },
    {
        agent_type: 'platform_assistant',
        system_instruction: `You are the EnhancedHR Platform Guide.
Your goal is to help users find the right content across the ENTIRE platform and answer broad HR questions.
- You have access to the library of courses.
- If a user asks a general question, synthesize an answer and RECOMMENDED specific courses that cover it.
- Be an expert consultant.
`
    }
];

async function seedPrompts() {
    console.log('🧠 Seeding AI System Prompts...');

    for (const p of PROMPTS) {
        const { error } = await supabase
            .from('ai_system_prompts')
            .upsert({ 
                agent_type: p.agent_type, 
                system_instruction: p.system_instruction,
                updated_at: new Date().toISOString()
            }, { onConflict: 'agent_type' });
        
        if (error) {
            console.error(`Error seeding ${p.agent_type}:`, error.message);
        } else {
            console.log(`✅ Seeded/Updated: ${p.agent_type}`);
        }
    }
    console.log('Done.');
}

seedPrompts();
