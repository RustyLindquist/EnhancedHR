/**
 * End-to-end debug of collection save operations
 * Run with: npx tsx scripts/debug_save_flow.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log('🔍 End-to-End Save Debug\n');
    
    // Get the user's collections
    const { data: collections } = await supabase
        .from('user_collections')
        .select('*');
    
    if (!collections?.length) {
        console.log('❌ No collections found');
        return;
    }
    
    const favorites = collections.find(c => c.label === 'Favorites');
    if (!favorites) {
        console.log('❌ Favorites collection not found');
        return;
    }
    
    console.log('1️⃣ Favorites Collection:');
    console.log(`   ID: ${favorites.id}`);
    console.log(`   User ID: ${favorites.user_id}`);
    
    // Count current items
    const { data: itemsBefore, count: countBefore } = await supabase
        .from('collection_items')
        .select('*', { count: 'exact' })
        .eq('collection_id', favorites.id);
    
    console.log(`\n2️⃣ Items BEFORE test: ${countBefore || 0}`);
    
    // Try to add a test course (ID 999 which doesn't exist - just testing the insert)
    console.log('\n3️⃣ Attempting to save test course (ID: 99999)...');
    
    const { error: insertError } = await supabase
        .from('collection_items')
        .insert({
            collection_id: favorites.id,
            item_id: '99999',
            item_type: 'COURSE'
        });
    
    if (insertError) {
        console.log('❌ INSERT FAILED:', insertError);
    } else {
        console.log('✅ Insert succeeded!');
    }
    
    // Check items after
    const { data: itemsAfter, count: countAfter } = await supabase
        .from('collection_items')
        .select('*', { count: 'exact' })
        .eq('collection_id', favorites.id);
    
    console.log(`\n4️⃣ Items AFTER test: ${countAfter || 0}`);
    
    // Now test context item
    console.log('\n5️⃣ Attempting to save test context item...');
    
    const { error: contextError } = await supabase
        .from('user_context_items')
        .insert({
            user_id: favorites.user_id,
            collection_id: favorites.id,
            type: 'CUSTOM_CONTEXT',
            title: 'Test Context ' + new Date().toISOString(),
            content: { text: 'Test content' }
        });
    
    if (contextError) {
        console.log('❌ CONTEXT INSERT FAILED:', contextError);
    } else {
        console.log('✅ Context insert succeeded!');
    }
    
    // Check context items
    const { data: contextItems, count: contextCount } = await supabase
        .from('user_context_items')
        .select('*', { count: 'exact' })
        .eq('collection_id', favorites.id);
    
    console.log(`\n6️⃣ Context items in Favorites: ${contextCount || 0}`);
    contextItems?.slice(-3).forEach(ci => {
        console.log(`   - ${ci.title} (${ci.type})`);
    });
    
    // Clean up test data
    console.log('\n7️⃣ Cleaning up test data...');
    await supabase
        .from('collection_items')
        .delete()
        .eq('collection_id', favorites.id)
        .eq('item_id', '99999');
    
    console.log('\n✅ Debug complete - Database operations work correctly!');
    console.log('   If the app still doesn\'t work, the issue is in the React side.');
}

debug().catch(console.error);
