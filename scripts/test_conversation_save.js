
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Using Service Role Key to bypass RLS for initial setup/cleanup if needed, 
// but we want to test USER context mostly. 
// Actually, to test RLS, I should use a user session.
// But getting a user session in a script is hard without password.
// I will use SERVICE KEY to verify functionality first. 
// If that works, then RLS might be the blocker.
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function testPersistence() {
    console.log("Starting persistence test...");

    // 1. Get a test user (or just pick one)
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) { console.error(userError); return; }
    if (users.users.length === 0) { console.log("No users found"); return; }

    const testUser = users.users[0];
    console.log(`Testing with user: ${testUser.id} (${testUser.email})`);

    // 2. Get a conversation
    const { data: convs, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', testUser.id)
        .limit(1);

    if (convError || convs.length === 0) {
        console.log("No conversations found for user");
        return;
    }

    const conv = convs[0];
    console.log(`Found conversation: ${conv.id}`);
    console.log(`Initial metadata:`, conv.metadata);

    // 3. Update metadata
    const testCollectionId = 'favorites';
    const newMeta = {
        ...(conv.metadata || {}),
        collection_ids: [testCollectionId]
    };

    console.log("Updating metadata with 'favorites'...");

    // Simulate what the client does (but usage service key here bypasses RLS policies essentially)
    // To properly test RLS we'd need to signInWithPassword but I don't have creds.
    // However, checking if the UPDATE essentially WORKS at DB level is step 1.
    const { error: updateError } = await supabase
        .from('conversations')
        .update({ metadata: newMeta })
        .eq('id', conv.id);

    if (updateError) {
        console.error("Update failed:", updateError);
        return;
    }

    // 4. Read back
    const { data: updatedConv, error: readError } = await supabase
        .from('conversations')
        .select('metadata')
        .eq('id', conv.id)
        .single();

    if (readError) {
        console.error("Read back failed:", readError);
        return;
    }

    console.log("Read back metadata:", updatedConv.metadata);

    if (updatedConv.metadata.collection_ids && updatedConv.metadata.collection_ids.includes('favorites')) {
        console.log("SUCCESS: Collection ID persisted.");
    } else {
        console.log("FAILURE: Collection ID NOT found.");
    }

    // Cleanup (optional)
}

testPersistence();
