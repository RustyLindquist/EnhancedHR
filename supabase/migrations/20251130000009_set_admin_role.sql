-- Set Admin Role for User
-- Replace 'rustylindquist@gmail.com' with the actual user email if different

-- 1. Update public.profiles
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'rustylindquist@gmail.com'
);

-- 2. Update auth.users metadata (so session has correct role on next login)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'rustylindquist@gmail.com';
