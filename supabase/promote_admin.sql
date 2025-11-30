UPDATE public.profiles
SET role = 'admin', membership_status = 'org_admin', author_status = 'approved'
FROM auth.users
WHERE public.profiles.id = auth.users.id
AND auth.users.email = 'rustylindquist@gmail.com';

SELECT * FROM public.profiles 
JOIN auth.users ON public.profiles.id = auth.users.id
WHERE auth.users.email = 'rustylindquist@gmail.com';
