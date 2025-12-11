import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log("Listing tables in public schema...");
  
  // Use RPC or raw SQL? Supabase JS client doesn't support raw SQL easily unless enabled.
  // But we can query information_schema if we have permissions? Service role usually does?
  // Actually, Supabase restricts access to system tables via API.
  
  // Alternative: Try fetching 1 row from 'collections' and 'user_collections' and 'user_context_items'
  
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_name', 'user_collections')
    .eq('table_schema', 'public');

  // Note: Supabase JS might complain about querying information_schema directly if not enabled.
  // Standard SQL would be better. But let's try RPC if this fails? 
  // Actually, let's try a failing select on a non-existent column to see if it lists checks? No.
  
  // Let's try to just select * from user_collections again but this time we just assume standard fields?
  // No, let's try the information query.
  
  if (error) {
     console.log("Error fetching schema:", error);
     
     // Fallback: Try to insert a dummy row with just user_id and see error?
  } else {
     console.log("Columns:", data);
  }
}

checkTables();
