
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

async function checkTable() {
  console.log('Checking conversations table...');
  const { data, error } = await supabase
    .from('conversations')
    .select('count', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Error accessing table:', error);
  } else {
    console.log('✅ Table exists and is accessible. Count:', data);
  }
}

checkTable();
