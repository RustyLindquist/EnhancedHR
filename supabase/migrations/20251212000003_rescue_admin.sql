-- Rescue Migration: Fix Trigger and Restore Admin

-- 1. Redefine handle_new_user to be robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role, membership_status)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'), 
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    COALESCE(new.raw_user_meta_data->>'membership_status', 'trial')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    role = EXCLUDED.role,
    membership_status = EXCLUDED.membership_status;
  RETURN new;
END;
$$;

-- 2. Restore Main Admin User (if missing)
DO $$
DECLARE
  v_user_id uuid := '00000000-0000-0000-0000-000000000001'::uuid; -- Fixed UUID for reliability
  v_password_hash text := crypt('Ongofu.com123', gen_salt('bf'));
  v_email text := 'rustylindquist@gmail.com';
BEGIN
  -- Insert into auth.users if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
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
      updated_at,
      confirmation_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      v_password_hash,
      now(),
      '{"full_name": "Rusty Lindquist", "role": "admin", "membership_status": "org_admin"}',
      '{"provider": "email", "providers": ["email"], "role": "admin"}',
      now(),
      now(),
      ''
    );
  ELSE
    -- If user exists, update password and metadata to ensure they can login
    UPDATE auth.users
    SET encrypted_password = v_password_hash,
        raw_user_meta_data = '{"full_name": "Rusty Lindquist", "role": "admin", "membership_status": "org_admin"}',
        raw_app_meta_data = '{"provider": "email", "providers": ["email"], "role": "admin"}'
    WHERE email = v_email;
    
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
  END IF;

  -- 3. Ensure Profile Exists
  INSERT INTO public.profiles (id, full_name, role, membership_status)
  VALUES (v_user_id, 'Rusty Lindquist', 'admin', 'org_admin')
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin', membership_status = 'org_admin';
  
END $$;

-- 4. Force Schema Cache Reload (by notifying PostgREST)
NOTIFY pgrst, 'reload config';
