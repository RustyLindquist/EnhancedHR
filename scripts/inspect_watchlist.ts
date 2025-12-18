
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(supabaseUrl, supabaseServiceKey);

async function inspectWatchlist() {
    // Watchlist ID from previous script output
    const WATCHLIST_ID = '3ff665d1-5921-4def-89d6-4dd2125061b6';
    
    console.log(`Inspecting Watchlist: ${WATCHLIST_ID}`);

    // 1. Collection Items
    const { data: items } = await admin
        .from('collection_items')
        .select('item_type, item_id, course_id')
        .eq('collection_id', WATCHLIST_ID);

    console.log('\n--- COLLECTION ITEMS ---');
    if (items && items.length > 0) {
        items.forEach((i, idx) => {
            console.log(`#${idx + 1}: Type=${i.item_type}, ItemID=${i.item_id}, CourseID=${i.course_id}`);
        });
    } else {
        console.log('No collection items found.');
    }

    // 2. Context Items
    const { data: context } = await admin
        .from('user_context_items')
        .select('type, title')
        .eq('collection_id', WATCHLIST_ID);

    console.log('\n--- CONTEXT ITEMS ---');
    if (context && context.length > 0) {
        context.forEach((c, idx) => {
            console.log(`#${idx + 1}: Type=${c.type}, Title=${c.title}`);
        });
    } else {
        console.log('No context items found.');
    }
}

inspectWatchlist();
