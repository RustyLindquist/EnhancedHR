
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const USER_ID = 'c85748b3-1abc-4629-bb6b-a8a41f465437'; // From user logs

async function debugUserData() {
    console.log(`Debugging data for User: ${USER_ID}`);
    
    // 1. Get Collections
    const { data: collections } = await supabase
        .from('user_collections')
        .select('*')
        .eq('user_id', USER_ID);
        
    console.log('\n--- User Collections ---');
    collections?.forEach(c => console.log(`[${c.label}] ID: ${c.id}, Color: ${c.color}`));
    
    const workspace = collections?.find(c => c.label === 'Workspace');
    const workspaceId = workspace?.id;
    
    if (!workspaceId) {
        console.error('CRITICAL: No Workspace collection found!');
    } else {
        console.log(`\nTARGET WORKSPACE ID: ${workspaceId}`);
        
        // 2. Get Context Items in Workspace
        const { data: contextItems } = await supabase
            .from('user_context_items')
            .select('*')
            .eq('collection_id', workspaceId);
            
        console.log(`\n--- Context Items in Workspace (${contextItems?.length}) ---`);
        contextItems?.forEach(i => console.log(` - [${i.type}] ${i.title} (ID: ${i.id})`));

        // 3. Get Collection Items (Courses) in Workspace
        const { data: collectionItems } = await supabase
            .from('collection_items')
            .select('*')
            .eq('collection_id', workspaceId);
            
        console.log(`\n--- Mixed Items in Workspace (${collectionItems?.length}) ---`);
        collectionItems?.forEach(i => console.log(` - [${i.item_type}] ItemID: ${i.item_id}`));
    }
    
    // 4. Check for Orphaned Items (Global?)
    const { data: globalContext } = await supabase
        .from('user_context_items')
        .select('*')
        .is('collection_id', null)
        .eq('user_id', USER_ID);
        
    console.log(`\n--- Global Context Items (${globalContext?.length}) ---`);
    globalContext?.forEach(i => console.log(` - [${i.type}] ${i.title}`));

}

debugUserData();
