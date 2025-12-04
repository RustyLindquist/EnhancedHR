-- Enable pgcrypto for password hashing
create extension if not exists "pgcrypto";

do $$
declare
  v_instance_id uuid;
  v_password_hash text := crypt('password123', gen_salt('bf'));
begin
  -- 1. Detect the correct instance_id from an existing NON-demo user
  --    (If this is a fresh project with NO users, it defaults to 0000...)
  select instance_id into v_instance_id 
  from auth.users 
  where email not like 'demo.%' 
  limit 1;

  -- Default if no other users found
  if v_instance_id is null then
    v_instance_id := '00000000-0000-0000-0000-000000000000';
  end if;

  raise notice 'Detected instance_id: %', v_instance_id;

  -- 2. Update all demo accounts to use the correct instance_id and ensure password is valid
  update auth.users
  set instance_id = v_instance_id,
      encrypted_password = v_password_hash,
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now(),
      -- Ensure provider metadata is correct for email login
      raw_app_meta_data = raw_app_meta_data || '{"provider": "email", "providers": ["email"]}'::jsonb
  where email in (
    'demo.admin@enhancedhr.ai',
    'demo.instructor@enhancedhr.ai',
    'demo.applicant@enhancedhr.ai',
    'demo.employee@enhancedhr.ai',
    'demo.user@enhancedhr.ai'
  );

end $$;
