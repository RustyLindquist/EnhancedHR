/**
 * Debug script to test collection operations
 * Run with: npx ts-node --esm scripts/debug_collections.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log('🔍 Debugging collection operations...\n');
    
    // Get a test user (first user in the system)
    const { data: users } = await supabase.auth.admin.listUsers();
    if (!users?.users?.length) {
        console.log('❌ No users found');
        return;
    }
    
    const testUser = users.users[0];
    console.log(`Using test user: ${testUser.email} (${testUser.id})\n`);
    
    // Check user_collections for this user
    console.log('1️⃣ Checking user_collections...');
    const { data: collections, error: colError } = await supabase
        .from('user_collections')
        .select('*')
        .eq('user_id', testUser.id);
    
    if (colError) {
        console.log('❌ Error fetching collections:', colError);
    } else {
        console.log(`   Found ${collections?.length || 0} collections:`);
        collections?.forEach(c => {
            console.log(`   - ${c.label} (${c.id})`);
        });
    }
    
    // Check if "Favorites" exists
    const favorites = collections?.find(c => c.label === 'Favorites');
    if (!favorites) {
        console.log('\n2️⃣ Creating "Favorites" collection...');
        const { data: newFav, error: createErr } = await supabase
            .from('user_collections')
            .insert({
                user_id: testUser.id,
                label: 'Favorites',
                color: '#FF2600',
                is_custom: false
            })
            .select('id')
            .single();
        
        if (createErr) {
            console.log('❌ Failed to create Favorites:', createErr);
        } else {
            console.log(`✅ Created Favorites with ID: ${newFav?.id}`);
        }
    } else {
        console.log(`\n2️⃣ Favorites already exists: ${favorites.id}`);
    }
    
    // Check collection_items
    console.log('\n3️⃣ Checking collection_items...');
    const { data: items, error: itemsErr } = await supabase
        .from('collection_items')
        .select('*, user_collections!inner(label, user_id)')
        .eq('user_collections.user_id', testUser.id);
    
    if (itemsErr) {
        console.log('❌ Error fetching items:', itemsErr);
    } else {
        console.log(`   Found ${items?.length || 0} items in collections`);
        items?.forEach(i => {
            console.log(`   - ${i.item_type}: ${i.item_id} (in collection ${i.collection_id})`);
        });
    }
    
    // Try inserting a test item
    if (favorites || collections?.find(c => c.label === 'Favorites')) {
        const favId = favorites?.id || collections?.find(c => c.label === 'Favorites')?.id;
        console.log(`\n4️⃣ Attempting to insert test item to Favorites (${favId})...`);
        
        const { error: insertErr } = await supabase
            .from('collection_items')
            .insert({
                collection_id: favId,
                item_id: '999',
                item_type: 'COURSE'
            });
        
        if (insertErr) {
            console.log('❌ Insert failed:', insertErr);
        } else {
            console.log('✅ Insert succeeded!');
            
            // Clean up
            await supabase
                .from('collection_items')
                .delete()
                .eq('collection_id', favId)
                .eq('item_id', '999');
            console.log('   (cleaned up test item)');
        }
    }
    
    console.log('\n✅ Debug complete');
}

debug().catch(console.error);
