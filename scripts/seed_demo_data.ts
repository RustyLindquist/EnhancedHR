import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Role Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DEMO_PASSWORD = 'password123';

const ACCOUNTS = [
  {
    email: 'demo.admin@enhancedhr.ai',
    role: 'org_admin',
    name: 'Demo Org Admin',
    orgName: 'Acme Corp',
    bio: 'HR Director at Acme Corp. Passionate about AI in HR.'
  },
  {
    email: 'demo.employee@enhancedhr.ai',
    role: 'employee',
    name: 'Demo Employee',
    orgName: 'Acme Corp',
    bio: 'Product Manager at Acme Corp. Learning leadership skills.'
  },
  {
    email: 'demo.instructor@enhancedhr.ai',
    role: 'author',
    name: 'Demo Instructor',
    bio: 'Expert in HR Strategy and Conflict Resolution. 10+ years experience.'
  },
  {
    email: 'demo.applicant@enhancedhr.ai',
    role: 'pending_author',
    name: 'Demo Applicant',
    bio: 'Aspiring course creator specializing in Remote Work culture.'
  },
  {
    email: 'demo.user@enhancedhr.ai',
    role: 'user',
    name: 'Demo User',
    bio: 'Individual learner looking to upskill.'
  }
];

async function seed() {
  console.log('🌱 Starting Demo Data Seed...');

  // 1. Create Organization (Acme Corp)
  console.log('Creating Organization...');
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .upsert({ 
        name: 'Acme Corp', 
        slug: 'acme-corp',
        invite_hash: 'demo-invite-hash',
        // domain: 'acmecorp.com', // Column does not exist
        // seats_total: 50, // Column does not exist
        // seats_used: 32   // Column does not exist
    }, { onConflict: 'slug' })
    .select()
    .single();

  if (orgError) {
      console.error('Error creating org:', orgError);
      return;
  }
  console.log('✅ Organization created:', org.id);

  // 2. Create Users
  for (const acc of ACCOUNTS) {
    console.log(`Processing ${acc.email}...`);

    // Check if user exists
    const { data: { users } } = await supabase.auth.admin.listUsers();
    let user = users.find(u => u.email === acc.email);

    if (!user) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: acc.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: acc.name }
      });
      if (error) {
          console.error(`Error creating user ${acc.email}:`, error);
          continue;
      }
      user = data.user;
      console.log(`✅ Created Auth User: ${acc.email}`);
    } else {
        console.log(`ℹ️ User ${acc.email} already exists.`);
    }

    if (!user) continue;

    // Update Profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: acc.name,
        role: acc.role,
        author_bio: acc.bio,
        org_id: (acc.role === 'org_admin' || acc.role === 'employee') ? org.id : null
      });

    if (profileError) console.error(`Error updating profile for ${acc.email}:`, profileError);
    else console.log(`✅ Profile updated for ${acc.email}`);

    // Add to Org Members if applicable
    if (acc.role === 'org_admin' || acc.role === 'employee') {
        const { error: memberError } = await supabase
            .from('organization_members')
            .upsert({
                organization_id: org.id,
                user_id: user.id,
                role: acc.role === 'org_admin' ? 'admin' : 'member'
            }, { onConflict: 'organization_id,user_id' });
        
        if (memberError) console.error(`Error adding org member ${acc.email}:`, memberError);
    }

    // Specific Data Seeding based on Role
    if (acc.role === 'author') {
        // Create Mock Courses for Instructor
        // Note: In a real app we'd insert into 'courses' table. 
        // Assuming 'courses' table exists and has 'author_id'
        // For now, we'll just log this as the table schema might vary.
        console.log(`   👉 Seeding courses for ${acc.name}... (Mock logic)`);
    }

    if (acc.role === 'employee') {
        // Enroll in courses
        console.log(`   👉 Enrolling ${acc.name} in courses... (Mock logic)`);
    }
  }

  console.log('🎉 Demo Data Seed Completed!');
}

seed().catch(console.error);
