
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking ai_prompt_library...');
    const { data, error } = await supabase.from('ai_prompt_library').select('*');
    if (error) {
        console.error('Error fetching data:', error);
    } else {
        console.log('Data found:', data ? data.length : 0, 'rows');
        if (data && data.length > 0) {
            console.log('First row:', data[0]);
        }
    }
}

check();
