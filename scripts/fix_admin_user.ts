
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const email = 'rustylindquist@gmail.com';
  console.log(`Checking user: ${email}`);

  // 1. Get User ID from Auth
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  
  if (userError) {
    console.error('Error fetching users:', userError);
    return;
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    console.error('User not found in Auth');
    return;
  }

  console.log(`Found User ID: ${user.id}`);

  // 2. Get Profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Error fetching profile:', profileError);
    return;
  }

  console.log('Current Profile:', profile);

  // 3. Update to Platform Admin if needed
  if (profile.membership_status !== 'admin') {
    console.log('Updating user to Platform Admin (membership_status = admin)...');
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        membership_status: 'admin',
        role: 'admin' // Ensure role is also admin just in case
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
    } else {
      console.log('Successfully updated profile to Admin.');
    }
  } else {
    console.log('User is already a Platform Admin.');
  }
}

main();
