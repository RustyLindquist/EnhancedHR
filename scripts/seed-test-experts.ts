import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'
);

async function run() {
    console.log('Creating test expert accounts...\n');

    // Create test expert users via auth
    const testExperts = [
        {
            email: 'expert.pending@test.com',
            password: 'TestExpert123!',
            full_name: 'Sarah Johnson',
            author_status: 'pending',
            author_bio: 'HR professional with 15 years of experience in talent acquisition, employee development, and organizational design. I specialize in helping companies build high-performing teams through strategic hiring and continuous learning programs.',
            linkedin_url: 'https://linkedin.com/in/sarahjohnson-hr'
        },
        {
            email: 'expert.approved@test.com',
            password: 'TestExpert123!',
            full_name: 'Michael Chen',
            author_status: 'approved',
            author_bio: 'Former VP of People Operations at a Fortune 500 company. Now focused on sharing practical HR strategies that drive business results. Expert in performance management, compensation design, and leadership development.',
            linkedin_url: 'https://linkedin.com/in/michaelchen-hrleader'
        }
    ];

    for (const expert of testExperts) {
        console.log(`\nCreating ${expert.author_status} expert: ${expert.email}`);

        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', expert.email)
            .single();

        if (existingUser) {
            console.log(`  User already exists, updating profile...`);

            // Update existing profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    full_name: expert.full_name,
                    author_status: expert.author_status,
                    author_bio: expert.author_bio,
                    linkedin_url: expert.linkedin_url
                })
                .eq('id', existingUser.id);

            if (updateError) {
                console.log(`  ✗ Error updating profile: ${updateError.message}`);
            } else {
                console.log(`  ✓ Profile updated successfully`);
            }
            continue;
        }

        // Create new auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: expert.email,
            password: expert.password,
            email_confirm: true,
            user_metadata: {
                full_name: expert.full_name
            }
        });

        if (authError) {
            console.log(`  ✗ Error creating auth user: ${authError.message}`);
            continue;
        }

        console.log(`  ✓ Auth user created: ${authData.user?.id}`);

        // Update profile with expert details
        if (authData.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: expert.full_name,
                    author_status: expert.author_status,
                    author_bio: expert.author_bio,
                    linkedin_url: expert.linkedin_url
                })
                .eq('id', authData.user.id);

            if (profileError) {
                console.log(`  ✗ Error updating profile: ${profileError.message}`);
            } else {
                console.log(`  ✓ Profile updated with expert details`);
            }
        }
    }

    // Show final state
    console.log('\n=== Test Expert Accounts ===');
    console.log('\nPENDING EXPERT (for testing application review):');
    console.log('  Email: expert.pending@test.com');
    console.log('  Password: TestExpert123!');
    console.log('  Status: Pending approval');
    console.log('  → Login and go to /teach to see pending status');
    console.log('  → Admin can approve at /admin/experts');

    console.log('\nAPPROVED EXPERT (for testing expert dashboard):');
    console.log('  Email: expert.approved@test.com');
    console.log('  Password: TestExpert123!');
    console.log('  Status: Approved');
    console.log('  → Login and go to /author to see expert dashboard');
    console.log('  → Go to /settings/account to see expert membership');

    // Verify in database
    const { data: experts } = await supabase
        .from('profiles')
        .select('email, full_name, author_status, author_bio')
        .in('email', testExperts.map(e => e.email));

    console.log('\n=== Database State ===');
    console.table(experts?.map(e => ({
        email: e.email,
        name: e.full_name,
        status: e.author_status,
        has_bio: !!e.author_bio
    })));
}

run().catch(console.error);
