/**
 * Debug script to check database state
 * Run with: npx tsx scripts/debug_db_state.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log('🔍 Checking database state...\n');
    
    // Check all user_collections
    console.log('1️⃣ All user_collections:');
    const { data: collections, error: colError } = await supabase
        .from('user_collections')
        .select('id, user_id, label, color, is_custom')
        .limit(20);
    
    if (colError) {
        console.log('❌ Error:', colError);
    } else {
        console.log(`   Found ${collections?.length || 0} collections`);
        collections?.forEach(c => {
            console.log(`   - [${c.label}] user: ${c.user_id?.substring(0, 8)}... id: ${c.id?.substring(0, 8)}...`);
        });
    }
    
    // Check all collection_items
    console.log('\n2️⃣ All collection_items:');
    const { data: items, error: itemsErr } = await supabase
        .from('collection_items')
        .select('collection_id, item_type, item_id, added_at')
        .limit(20);
    
    if (itemsErr) {
        console.log('❌ Error:', itemsErr);
    } else {
        console.log(`   Found ${items?.length || 0} items`);
        items?.forEach(i => {
            console.log(`   - ${i.item_type}: ${i.item_id} in collection ${i.collection_id?.substring(0, 8)}...`);
        });
    }
    
    // Check all user_context_items
    console.log('\n3️⃣ All user_context_items:');
    const { data: contextItems, error: contextErr } = await supabase
        .from('user_context_items')
        .select('id, user_id, collection_id, type, title')
        .limit(20);
    
    if (contextErr) {
        console.log('❌ Error:', contextErr);
    } else {
        console.log(`   Found ${contextItems?.length || 0} context items`);
        contextItems?.forEach(c => {
            console.log(`   - [${c.type}] "${c.title}" collection_id: ${c.collection_id || 'NULL'}`);
        });
    }
    
    console.log('\n✅ Debug complete');
}

debug().catch(console.error);
