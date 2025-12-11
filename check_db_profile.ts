
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfileItem() {
  console.log("Checking for 'Verified Final V2' in all user_context_items...");

  const { data: items, error: itemsError } = await supabase
    .from('user_context_items')
    .select('*');

  if (itemsError) {
    console.error("Error fetching items:", itemsError);
    return;
  }

  console.log(`Found ${items.length} items in total. Searching for 'Verified Final V2'...`);
  let found = false;
  items.forEach(item => {
    const contentStr = typeof item.content === 'string' ? item.content : JSON.stringify(item.content);
    // Check if it has our profile data
    if (contentStr && contentStr.includes('Verified Final V2')) {
        console.log("  *** FOUND Verified Final V2 ***");
        console.log("  ID: ", item.id);
        console.log("  User ID: ", item.user_id);
        console.log("  Item Type (item.type): ", item.type);
        console.log("  Full Content:", contentStr);
        console.log("  Collection ID:", item.collection_id);
        found = true;
    }
  });
  
  if (!found) {
      console.log("  !!! 'Verified Final V2' NOT FOUND in any item.");
  }
}

checkProfileItem();

