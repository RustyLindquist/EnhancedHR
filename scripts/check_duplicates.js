
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Note: In a real backend script we might need SERVICE_ROLE_KEY to bypass RLS if we don't have a user session,
// but for now let's see if we can just pick a user or list all. 
// Actually, RLS usually blocks anon access to user_data. 
// I'll assume I need to use the service role key if available, checking .env.local usually has it?
// If not, I'll have to ask the user or try to use anon key and hope policies allow read.
// wait, usually these stored envs have the service key.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Key.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDuplicates() {
    console.log('Checking for duplicate collections...');

    // Fetch all collections
    const { data: collections, error } = await supabase
        .from('user_collections')
        .select('user_id, label, id, created_at, is_custom')
        .order('user_id')
        .order('label');

    if (error) {
        console.error('Error fetching collections:', error);
        return;
    }

    const map = {};
    let duplicatesFound = 0;

    collections.forEach(c => {
        const key = `${c.user_id}-${c.label}`;
        if (!map[key]) {
            map[key] = [];
        }
        map[key].push(c);
    });

    Object.entries(map).forEach(([key, items]) => {
        // items is array of collections for same user and label
        if (items.length > 1) {
            duplicatesFound++;
            const [userId, label] = key.split('-');
            console.log(`\nDuplicate Found: User ${userId.substring(0, 8)}... - Label: "${label}" has ${items.length} entries.`);
            items.forEach(item => {
                console.log(` - ID: ${item.id} | Created: ${item.created_at} | Custom: ${item.is_custom}`);
            });
        }
    });

    if (duplicatesFound === 0) {
        console.log('\nNo duplicates found in user_collections.');
    } else {
        console.log(`\nFound ${duplicatesFound} sets of duplicates.`);
    }
}

checkDuplicates();
