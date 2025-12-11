import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Must use Service Role to bypass RLS for reading/writing setup
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixProfileCollection() {
  console.log("Starting Personal Context Collection Fix...");

  // 1. Get the user (we'll assume the one we saw earlier: c85748b3-1abc-4629-bb6b-a8a41f465437)
  const userId = 'c85748b3-1abc-4629-bb6b-a8a41f465437'; 
  console.log("Target User:", userId);

  // 2. Check if 'Personal Context' collection exists
  let { data: collections, error: colError } = await supabase
    .from('user_collections')
    .select('*')
    .eq('user_id', userId)
    .eq('label', 'Personal Context');

  if (colError) {
    console.error("Error fetching collections:", colError);
    return;
  }

  let personalCollectionId;

  if (collections && collections.length > 0) {
    console.log("Found existing Personal Context collection:", collections[0].id);
    personalCollectionId = collections[0].id;
  } else {
    console.log("Creating new Personal Context collection...");
    const { data: newCol, error: createError } = await supabase
      .from('user_collections')
      .insert({
        user_id: userId,
        label: 'Personal Context',
        color: '#000000',
        is_custom: true
      })
      .select()
      .single();

    if (createError) {
        console.error("Error creating collection:", createError);
        return;
    }
    console.log("Created new collection:", newCol.id);
    personalCollectionId = newCol.id;
  }

  // 3. Update the orphaned PROFILE items to use this ID
  console.log("Updating PROFILE items to use collection", personalCollectionId);

  const { data: updated, error: updateError } = await supabase
    .from('user_context_items')
    .update({ collection_id: personalCollectionId })
    .eq('user_id', userId)
    .eq('type', 'PROFILE')
    .is('collection_id', null)
    .select();

  if (updateError) {
    console.error("Error updating items:", updateError);
  } else {
    console.log(`Updated ${updated.length} items.`);
  }

  // 4. Verify
  const { data: verify, error: verifyError } = await supabase
    .from('user_context_items')
    .select('*')
    .eq('collection_id', personalCollectionId);
    
  console.log("Verification - Items in collection:", verify?.length);
}

fixProfileCollection();
