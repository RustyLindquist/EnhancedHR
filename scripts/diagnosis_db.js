const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase Service Key or URL.');
    console.log('URL Exists:', !!supabaseUrl);
    console.log('Service Key Exists:', !!supabaseServiceKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkContextItems() {
    console.log('Fetching user_context_items...');
    const { data, error } = await supabase
        .from('user_context_items')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Found ${data.length} items.`);
        // Filter for PROFILE type to be specific
        const profiles = data.filter(i => i.type === 'PROFILE');
        console.log(`Found ${profiles.length} PROFILE items.`);
        console.log('Latest PROFILE item:', JSON.stringify(profiles[0], null, 2));

        console.log('All items summary:', data.map(i => ({ id: i.id, type: i.type, title: i.title, contentLen: JSON.stringify(i.content).length })));
    }
}

checkContextItems();
