const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    console.log('Attempting to fetch courses...');
    const { data, error } = await supabase
        .from('courses')
        .select('*');

    if (error) {
        console.error('Error fetching courses:', error);
    } else {
        console.log(`Successfully fetched ${data.length} courses.`);
        if (data.length > 0) {
            console.log('First course:', data[0]);
        } else {
            console.log('No courses found. The table might be empty.');
        }
    }
}

testFetch();
