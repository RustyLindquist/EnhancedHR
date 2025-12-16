-- Fix Demo Org and Link Users
do $$
declare
  v_org_id uuid;
  v_admin_id uuid;
  v_employee_id uuid;
begin

  -----------------------------------------------------------------------------
  -- 1. Ensure Demo Organization Exists
  -----------------------------------------------------------------------------
  -- Check if exists, else create
  if not exists (select 1 from organizations where slug = 'demo-org') then
    insert into organizations (name, slug, invite_hash)
    values ('Demo Corp', 'demo-org', encode(gen_random_bytes(8), 'hex'))
    returning id into v_org_id;
  else
    select id into v_org_id from organizations where slug = 'demo-org';
  end if;

  -----------------------------------------------------------------------------
  -- 2. Link Org Admin
  -----------------------------------------------------------------------------
  select id into v_admin_id from auth.users where email = 'demo.admin@enhancedhr.ai';
  
  if v_admin_id is not null then
    -- Update Profile with Org ID
    update public.profiles 
    set org_id = v_org_id,
        role = 'admin',
        membership_status = 'org_admin'
    where id = v_admin_id;
  end if;

  -----------------------------------------------------------------------------
  -- 3. Link Demo Employee
  -----------------------------------------------------------------------------
  select id into v_employee_id from auth.users where email = 'demo.employee@enhancedhr.ai';
  
  if v_employee_id is not null then
    -- Update Profile with Org ID
    update public.profiles 
    set org_id = v_org_id,
        role = 'user',
        membership_status = 'employee'
    where id = v_employee_id;
  end if;

end $$;
