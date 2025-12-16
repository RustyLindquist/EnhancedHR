
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function repairWorkspace() {
    console.log('--- Checking for Duplicate Workspaces ---');

    // 1. Get User
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
        console.error('Error listing users:', userError);
        return;
    }
    const user = users.find(u => u.email?.includes('rusty'));
    if (!user) {
        console.error('User not found');
        return;
    }
    console.log('User Found:', user.id, user.email);

    // 2. Get Workspace Collections
    const { data: collections, error: colError } = await supabase
        .from('user_collections')
        .select('*')
        .eq('user_id', user.id)
        .eq('label', 'Workspace');

    if (colError) {
        console.error('Error fetching collections:', colError);
        return;
    }

    console.log(`Found ${collections.length} Workspace collections:`);

    for (const col of collections) {
        // Count items in collection_items
        const { count: standardCount } = await supabase
            .from('collection_items')
            .select('*', { count: 'exact', head: true })
            .eq('collection_id', col.id);

        // Count items in user_context_items
        const { count: contextCount } = await supabase
            .from('user_context_items')
            .select('*', { count: 'exact', head: true })
            .eq('collection_id', col.id);

        console.log(`- ID: ${col.id}, Items: ${standardCount} (standard) + ${contextCount} (context) = ${standardCount! + contextCount!}`);
    }

    // 3. Auto-Fix (Optional: Rename empty ones)
    /*
    if (collections.length > 1) {
        const bestCol = collections.sort((a,b) => {
             // Logic to pick best...
             return 0; 
        })[0]; 
        // ...
    }
    */
}

repairWorkspace();
