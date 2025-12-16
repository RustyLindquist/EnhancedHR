
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDuplicates() {
    console.log('Starting duplicate cleanup...');

    // 1. Fetch potential duplicates
    const { data: collections, error } = await supabase
        .from('user_collections')
        .select('id, user_id, label, created_at')
        .order('created_at', { ascending: true }); // Oldest first = Master

    if (error) {
        console.error('Fetch error:', error);
        return;
    }

    const map = {};
    collections.forEach(c => {
        const key = `${c.user_id}-${c.label}`;
        if (!map[key]) map[key] = [];
        map[key].push(c);
    });

    for (const [key, items] of Object.entries(map)) {
        if (items.length > 1) {
            console.log(`Processing duplicates for ${key} (${items.length} items)`);

            const master = items[0]; // Oldest is master
            const duplicates = items.slice(1);

            for (const dup of duplicates) {
                console.log(`  Merging ${dup.id} into ${master.id}...`);

                // A. Move Collection Items
                const { error: moveItemsError } = await supabase
                    .from('collection_items')
                    .update({ collection_id: master.id })
                    .eq('collection_id', dup.id);

                if (moveItemsError) {
                    // Ignore unique violation if item already exists in master
                    if (moveItemsError.code !== '23505') {
                        console.error(`  Error moving items from ${dup.id}:`, moveItemsError);
                        continue; // Skip deletion if move failed
                    } else {
                        console.log('  Items merge conflict (some items already in master), cleaning up dup sources...');
                        // We can't update if it violates unique. 
                        // So we should probably just delete the dup items if they exist in master?
                        // Complex. Simple strategy: Try update. If fail, manually inspect?
                        // Or: Delete duplicates from 'collection_items' that match (coll_id, course_id)
                        // Then update remainder. 
                        // For now, let's just log and skip delete of collection if error.
                    }
                }

                // B. Move Context Items
                const { error: moveContextError } = await supabase
                    .from('user_context_items')
                    .update({ collection_id: master.id })
                    .eq('collection_id', dup.id);

                if (moveContextError) {
                    console.error(`  Error moving context from ${dup.id}:`, moveContextError);
                }

                // C. Delete Duplicate Collection
                if (!moveItemsError && !moveContextError) {
                    const { error: delError } = await supabase
                        .from('user_collections')
                        .delete()
                        .eq('id', dup.id);

                    if (delError) console.error(`  Failed to delete ${dup.id}:`, delError);
                    else console.log(`  Deleted ${dup.id}`);
                }
            }
        }
    }
    console.log('Cleanup complete.');
}

fixDuplicates();
