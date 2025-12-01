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

async function setAdminRole() {
  const email = 'rustylindquist@gmail.com'; // Based on screenshot

  console.log(`Looking for user: ${email}`);

  // 1. Get User ID
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  
  if (userError) {
      console.error('Error listing users:', userError);
      return;
  }

  const user = users.find(u => u.email === email);

  if (!user) {
      console.error('User not found');
      return;
  }

  console.log(`Found user: ${user.id}`);

  // 2. Update Auth Metadata
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { user_metadata: { role: 'admin' } }
  );

  if (updateError) {
      console.error('Error updating auth metadata:', updateError);
  } else {
      console.log('✅ Updated auth metadata to role: admin');
  }

  // 3. Update Profile Role
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', user.id);

  if (profileError) {
      console.error('Error updating profile role:', profileError);
  } else {
      console.log('✅ Updated profile role to: admin');
  }
}

setAdminRole();
