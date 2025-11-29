-- Grant Admin Access to rustylindquist@gmail.com
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'rustylindquist@gmail.com'
);

-- Verify the update
SELECT * FROM public.profiles 
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'rustylindquist@gmail.com'
);
