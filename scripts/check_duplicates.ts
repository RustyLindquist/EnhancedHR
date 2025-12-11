
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDupes() {
    console.log('Checking for duplicate Workspace collections...');
    
    // 1. Get all 'Workspace' collections
    const { data: collections, error } = await supabase
        .from('user_collections')
        .select('id, user_id, label, created_at')
        .eq('label', 'Workspace');
        
    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${collections.length} Workspace collections.`);
    
    // Group by user
    const byUser: Record<string, any[]> = {};
    collections.forEach(c => {
        if (!byUser[c.user_id]) byUser[c.user_id] = [];
        byUser[c.user_id].push(c);
    });

    for (const userId in byUser) {
        const userCols = byUser[userId];
        if (userCols.length > 1) {
            console.log(`User ${userId} has ${userCols.length} Workspace collections!`);
            // Keep the oldest? Or the one with items?
            // Let's just list them for now.
            userCols.forEach(c => console.log(` - ID: ${c.id}, Created: ${c.created_at}`));
            
            // Fix: Delete all but the OLDEST
            // Sort by created_at asc
            userCols.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            const [keep, ...remove] = userCols;
            
            console.log(`KEEPING: ${keep.id}`);
            console.log(`REMOVING: ${remove.map(r => r.id).join(', ')}`);
            
            // Delete duplicates
            const { error: delError } = await supabase.from('user_collections').delete().in('id', remove.map(r => r.id));
            if (delError) console.error('Delete failed:', delError);
            else console.log('Duplicates deleted.');
        }
    }
}

checkDupes();
