-- Enable pgcrypto for password hashing
create extension if not exists "pgcrypto";

-- Seed Demo Accounts
do $$
declare
  v_password_hash text := crypt('password123', gen_salt('bf'));
  v_user_id uuid;
begin

  -----------------------------------------------------------------------------
  -- 1. Org Admin
  -----------------------------------------------------------------------------
  if not exists (select 1 from auth.users where email = 'demo.admin@enhancedhr.ai') then
    v_user_id := gen_random_uuid();
    
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      raw_app_meta_data,
      created_at,
      updated_at
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'demo.admin@enhancedhr.ai',
      v_password_hash,
      now(),
      '{"full_name": "Org Admin", "role": "admin"}',
      '{"provider": "email", "providers": ["email"], "role": "admin"}',
      now(),
      now()
    );
    
    -- Update profile (created by trigger)
    -- We wait a moment or manually insert if trigger doesn't fire immediately in this block context,
    -- but usually trigger fires. However, to be safe in a DO block, we can upsert.
    insert into public.profiles (id, full_name, role, membership_status)
    values (v_user_id, 'Org Admin', 'admin', 'org_admin')
    on conflict (id) do update
    set role = 'admin', membership_status = 'org_admin';
    
  else
    select id into v_user_id from auth.users where email = 'demo.admin@enhancedhr.ai';
    update auth.users 
    set raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb,
        raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
    where id = v_user_id;
    
    update public.profiles 
    set role = 'admin', membership_status = 'org_admin' 
    where id = v_user_id;
  end if;

  -----------------------------------------------------------------------------
  -- 2. Instructor (Author)
  -----------------------------------------------------------------------------
  if not exists (select 1 from auth.users where email = 'demo.instructor@enhancedhr.ai') then
    v_user_id := gen_random_uuid();
    
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      raw_app_meta_data,
      created_at,
      updated_at
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'demo.instructor@enhancedhr.ai',
      v_password_hash,
      now(),
      '{"full_name": "Demo Instructor", "role": "author"}',
      '{"provider": "email", "providers": ["email"], "role": "author"}',
      now(),
      now()
    );
    
    insert into public.profiles (id, full_name, role, author_status)
    values (v_user_id, 'Demo Instructor', 'user', 'approved')
    on conflict (id) do update
    set role = 'user', author_status = 'approved';

  else
    select id into v_user_id from auth.users where email = 'demo.instructor@enhancedhr.ai';
    update auth.users 
    set raw_user_meta_data = raw_user_meta_data || '{"role": "author"}'::jsonb,
        raw_app_meta_data = raw_app_meta_data || '{"role": "author"}'::jsonb
    where id = v_user_id;
    
    update public.profiles set author_status = 'approved' where id = v_user_id;
  end if;

  -----------------------------------------------------------------------------
  -- 3. Pending Instructor
  -----------------------------------------------------------------------------
  if not exists (select 1 from auth.users where email = 'demo.applicant@enhancedhr.ai') then
    v_user_id := gen_random_uuid();
    
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      raw_app_meta_data,
      created_at,
      updated_at
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'demo.applicant@enhancedhr.ai',
      v_password_hash,
      now(),
      '{"full_name": "Pending Instructor", "role": "pending_author"}',
      '{"provider": "email", "providers": ["email"], "role": "pending_author"}',
      now(),
      now()
    );
    
    insert into public.profiles (id, full_name, role, author_status)
    values (v_user_id, 'Pending Instructor', 'user', 'pending')
    on conflict (id) do update
    set role = 'user', author_status = 'pending';

  else
    select id into v_user_id from auth.users where email = 'demo.applicant@enhancedhr.ai';
    update auth.users 
    set raw_user_meta_data = raw_user_meta_data || '{"role": "pending_author"}'::jsonb,
        raw_app_meta_data = raw_app_meta_data || '{"role": "pending_author"}'::jsonb
    where id = v_user_id;
    
    update public.profiles set author_status = 'pending' where id = v_user_id;
  end if;

  -----------------------------------------------------------------------------
  -- 4. Employee
  -----------------------------------------------------------------------------
  if not exists (select 1 from auth.users where email = 'demo.employee@enhancedhr.ai') then
    v_user_id := gen_random_uuid();
    
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      raw_app_meta_data,
      created_at,
      updated_at
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'demo.employee@enhancedhr.ai',
      v_password_hash,
      now(),
      '{"full_name": "Demo Employee", "role": "employee"}',
      '{"provider": "email", "providers": ["email"], "role": "employee"}',
      now(),
      now()
    );
    
    insert into public.profiles (id, full_name, role, membership_status)
    values (v_user_id, 'Demo Employee', 'user', 'employee')
    on conflict (id) do update
    set role = 'user', membership_status = 'employee';

  else
    select id into v_user_id from auth.users where email = 'demo.employee@enhancedhr.ai';
    update auth.users 
    set raw_user_meta_data = raw_user_meta_data || '{"role": "employee"}'::jsonb,
        raw_app_meta_data = raw_app_meta_data || '{"role": "employee"}'::jsonb
    where id = v_user_id;
    
    update public.profiles set membership_status = 'employee' where id = v_user_id;
  end if;

  -----------------------------------------------------------------------------
  -- 5. Individual User
  -----------------------------------------------------------------------------
  if not exists (select 1 from auth.users where email = 'demo.user@enhancedhr.ai') then
    v_user_id := gen_random_uuid();
    
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      raw_app_meta_data,
      created_at,
      updated_at
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'demo.user@enhancedhr.ai',
      v_password_hash,
      now(),
      '{"full_name": "Demo User", "role": "user"}',
      '{"provider": "email", "providers": ["email"], "role": "user"}',
      now(),
      now()
    );
    
    insert into public.profiles (id, full_name, role, membership_status)
    values (v_user_id, 'Demo User', 'user', 'active')
    on conflict (id) do update
    set role = 'user', membership_status = 'active';

  else
    select id into v_user_id from auth.users where email = 'demo.user@enhancedhr.ai';
    update auth.users 
    set raw_user_meta_data = raw_user_meta_data || '{"role": "user"}'::jsonb,
        raw_app_meta_data = raw_app_meta_data || '{"role": "user"}'::jsonb
    where id = v_user_id;
    
    update public.profiles set membership_status = 'active' where id = v_user_id;
  end if;

end $$;
