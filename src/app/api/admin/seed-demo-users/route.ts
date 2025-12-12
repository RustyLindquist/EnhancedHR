import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase environment variables' }, { status: 500 });
    }

    // Create a Supabase client with the SERVICE ROLE key to bypass RLS and use Admin API
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const DEMO_ACCOUNTS = [
      { 
        email: 'demo.admin@enhancedhr.ai', 
        password: 'password123', 
        data: { full_name: 'Org Admin', role: 'admin' },
        profile: { role: 'admin', membership_status: 'org_admin' }
      },
      { 
        email: 'demo.instructor@enhancedhr.ai', 
        password: 'password123', 
        data: { full_name: 'Demo Expert', role: 'author' },
        profile: { role: 'user', author_status: 'approved' }
      },
      { 
        email: 'demo.applicant@enhancedhr.ai', 
        password: 'password123', 
        data: { full_name: 'Pending Expert', role: 'pending_author' },
        profile: { role: 'user', author_status: 'pending' }
      },
      { 
        email: 'demo.employee@enhancedhr.ai', 
        password: 'password123', 
        data: { full_name: 'Demo Employee', role: 'employee' },
        profile: { role: 'user', membership_status: 'employee' }
      },
      { 
        email: 'demo.user@enhancedhr.ai', 
        password: 'password123', 
        data: { full_name: 'Demo User', role: 'user' },
        profile: { role: 'user', membership_status: 'active' }
      },
    ];

    const results = [];

    for (const account of DEMO_ACCOUNTS) {
      // 1. Check if user exists
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = users?.find(u => u.email === account.email);

      let userId = existingUser?.id;

      if (existingUser) {
        // Update existing user
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
          existingUser.id,
          { 
            password: account.password,
            user_metadata: account.data,
            email_confirm: true
          }
        );
        if (error) throw error;
        results.push({ email: account.email, status: 'updated', id: data.user.id });
      } else {
        // Create new user
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: account.email,
          password: account.password,
          user_metadata: account.data,
          email_confirm: true
        });
        if (error) throw error;
        userId = data.user.id;
        results.push({ email: account.email, status: 'created', id: data.user.id });
      }

      // 2. Update Profile (Public Table)
      if (userId) {
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: userId,
            full_name: account.data.full_name,
            ...account.profile
          });
        
        if (profileError) {
            console.error(`Error updating profile for ${account.email}:`, profileError);
            results.push({ email: account.email, status: 'profile_error', error: profileError.message });
        }
      }
    }

    return NextResponse.json({ success: true, results });

  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
