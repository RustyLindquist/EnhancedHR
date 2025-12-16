
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findGhost() {
    console.log('--- Finding Ghost Collection 25749d71... ---');
    const id = '25749d71-0f3b-4f8b-bc06-53cf86e61a82'; // From Browser Log

    const { data, error } = await supabase
        .from('user_collections')
        .select('*')
        .eq('id', id);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Found Ghost Collection:', data[0]);
        // Get user details
        const userId = data[0].user_id;
        const { data: { user }, error: uErr } = await supabase.auth.admin.getUserById(userId);
        console.log('Owner:', user?.email, user?.id);
    } else {
        console.log('Ghost Collection NOT FOUND in DB.');
    }
}

findGhost();
