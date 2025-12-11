/**
 * Debug script to simulate client-side query with auth
 * Run with: npx tsx scripts/debug_client_query.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log('🔍 Simulating fetch flow...\n');
    
    // Get user_collections for c85748b3... user (the one we saw in the debug)
    const { data: collections } = await supabase
        .from('user_collections')
        .select('*');
    
    console.log('1️⃣ User collections:');
    collections?.forEach(c => {
        console.log(`   ${c.label}: ${c.id}`);
    });
    
    // Find Favorites
    const favorites = collections?.find(c => c.label === 'Favorites');
    if (!favorites) {
        console.log('❌ Favorites not found');
        return;
    }
    
    console.log(`\n2️⃣ Favorites ID: ${favorites.id}`);
    console.log(`   User ID: ${favorites.user_id}`);
    
    // Query collection_items like the client does
    console.log('\n3️⃣ Querying collection_items:');
    const { data: items, error } = await supabase
        .from('collection_items')
        .select('*')
        .eq('collection_id', favorites.id);
    
    if (error) {
        console.log('❌ Error:', error);
    } else {
        console.log(`   Found ${items?.length || 0} items`);
        items?.forEach(i => {
            console.log(`   - ${i.item_type}: ${i.item_id}`);
        });
    }
    
    // Now try querying courses with the item_ids
    if (items && items.length > 0) {
        const courseItems = items.filter(i => i.item_type === 'COURSE');
        const courseIds = courseItems.map(i => parseInt(i.item_id, 10));
        
        console.log(`\n4️⃣ Fetching courses with IDs: ${courseIds}`);
        const { data: courses, error: courseError } = await supabase
            .from('courses')
            .select('id, title')
            .in('id', courseIds);
        
        if (courseError) {
            console.log('❌ Course error:', courseError);
        } else {
            console.log(`   Found ${courses?.length || 0} courses`);
            courses?.forEach(c => {
                console.log(`   - ${c.id}: ${c.title}`);
            });
        }
    }
    
    console.log('\n✅ Debug complete');
}

debug().catch(console.error);
