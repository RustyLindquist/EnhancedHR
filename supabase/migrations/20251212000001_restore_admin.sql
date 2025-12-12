-- Restore Main Admin User
DO $$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_password_hash text := crypt('Ongofu.com123', gen_salt('bf'));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'rustylindquist@gmail.com') THEN
    INSERT INTO auth.users (
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
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'rustylindquist@gmail.com',
      v_password_hash,
      now(),
      '{"full_name": "Rusty Lindquist", "role": "admin"}',
      '{"provider": "email", "providers": ["email"], "role": "admin"}',
      now(),
      now()
    );

    -- Profile will be created by the trigger, but we can ensure it's correct context
    INSERT INTO public.profiles (id, full_name, role, membership_status)
    VALUES (v_user_id, 'Rusty Lindquist', 'admin', 'org_admin')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin', membership_status = 'org_admin';
    
  END IF;
END $$;
