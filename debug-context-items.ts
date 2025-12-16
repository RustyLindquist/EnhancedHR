
import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';

async function debug() {
    const supabase = createAdminClient();
    
    // 1. Get User (Assume first user or specific if known, but admin can list all recent)
    // Actually, let's get the user 'Rusty' or just list collections
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError || !users.users.length) {
        console.error('No users found', userError);
        return;
    }

    const user = users.users.find(u => u.email?.includes('rusty')); // Heuristic
    if (!user) {
        console.log('User rusty not found. Users:', users.users.map(u => u.email));
        return;
    }
    
    console.log('User:', user.id, user.email);

    // 2. Get Workspace Collection
    const { data: collections } = await supabase
        .from('user_collections')
        .select('*')
        .eq('user_id', user.id)
        .eq('label', 'Workspace');

    console.log('Workspace Collections:', collections);

    if (collections && collections.length > 0) {
        const colId = collections[0].id;

        // 3. Check Standard Items (Courses)
        const { data: standardItems } = await supabase
            .from('collection_items')
            .select('*')
            .eq('collection_id', colId);
        
        console.log('Standard Items (Courses):', standardItems);

        // 4. Check Context Items (Modules)
        const { data: contextItems } = await supabase
            .from('user_context_items')
            .select('*')
            .eq('collection_id', colId);
        
        console.log('Context Items (Modules):', contextItems);
    } else {
        console.log('Workspace collection not found in DB!');
    }
}

debug();
