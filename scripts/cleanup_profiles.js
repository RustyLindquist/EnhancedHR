const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing keys');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupProfiles() {
    console.log('Fetching all PROFILE items...');
    const { data, error } = await supabase
        .from('user_context_items')
        .select('*')
        .eq('type', 'PROFILE')
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    if (data.length <= 1) {
        console.log('No duplicates found.');
        return;
    }

    // Keep the first one (latest)
    const latest = data[0];
    const duplicates = data.slice(1);

    console.log(`\nKEEPING latest profile: ${latest.id} \nCreated: ${latest.created_at} \nContent: ${JSON.stringify(latest.content)}\n`);
    console.log(`Deleting ${duplicates.length} duplicates...`);

    const idsToDelete = duplicates.map(d => d.id);

    const { error: deleteError } = await supabase
        .from('user_context_items')
        .delete()
        .in('id', idsToDelete);

    if (deleteError) console.error('Error deleting:', deleteError);
    else console.log('Cleanup complete.');
}

cleanupProfiles();
