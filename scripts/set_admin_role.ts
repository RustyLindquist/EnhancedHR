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
    .update({ role: 'admin', membership_status: 'org_admin' })
    .eq('id', user.id);

  if (profileError) {
      console.error('Error updating profile role:', profileError);
  } else {
      console.log('✅ Updated profile role to: admin');
  }

  // 4. Check if user has an organization, create one if not
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, full_name')
    .eq('id', user.id)
    .single();

  if (!profile?.org_id) {
    console.log('Platform admin has no organization, creating one...');

    // Generate a unique slug from the user's name or email
    const baseName = profile?.full_name || email.split('@')[0];
    const orgName = `${baseName}'s Organization`;
    const slug = baseName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const uniqueSlug = `${slug}-${Date.now().toString(36)}`;
    const inviteHash = Math.random().toString(36).substring(2, 18);

    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: orgName,
        slug: uniqueSlug,
        invite_hash: inviteHash,
      })
      .select()
      .single();

    if (orgError) {
      console.error('Error creating organization:', orgError);
    } else {
      console.log(`✅ Created organization: ${newOrg.name} (${newOrg.slug})`);

      // Update profile with the new org_id
      const { error: updateOrgError } = await supabase
        .from('profiles')
        .update({ org_id: newOrg.id })
        .eq('id', user.id);

      if (updateOrgError) {
        console.error('Error linking profile to organization:', updateOrgError);
      } else {
        console.log('✅ Linked profile to new organization');
      }
    }
  } else {
    console.log('✅ Platform admin already has an organization');
  }
}

setAdminRole();
