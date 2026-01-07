-- Script to assign organizations to existing platform admins who don't have one
-- Run this in Supabase SQL Editor on production

-- This creates a personal organization for each platform admin without an org_id
-- and updates their profile to link them to that org

DO $$
DECLARE
    admin_record RECORD;
    new_org_id UUID;
    base_name TEXT;
    org_name TEXT;
    org_slug TEXT;
    invite_hash TEXT;
BEGIN
    -- Loop through all platform admins without an org_id
    FOR admin_record IN
        SELECT p.id, p.full_name, u.email
        FROM profiles p
        JOIN auth.users u ON u.id = p.id
        WHERE p.role = 'admin'
          AND p.org_id IS NULL
    LOOP
        -- Generate org details
        base_name := COALESCE(admin_record.full_name, split_part(admin_record.email, '@', 1), 'Admin');
        org_name := base_name || '''s Organization';
        org_slug := lower(regexp_replace(base_name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || to_char(now(), 'YYYYMMDDHH24MISS');
        invite_hash := substr(md5(random()::text), 1, 16);

        -- Create the organization
        INSERT INTO organizations (name, slug, invite_hash)
        VALUES (org_name, org_slug, invite_hash)
        RETURNING id INTO new_org_id;

        -- Update the admin's profile
        UPDATE profiles
        SET org_id = new_org_id,
            membership_status = 'org_admin'
        WHERE id = admin_record.id;

        -- Seed dynamic groups for the new org
        PERFORM seed_dynamic_groups_for_org(new_org_id);

        RAISE NOTICE 'Created org "%" for admin % (%)', org_name, admin_record.full_name, admin_record.email;
    END LOOP;
END $$;

-- Verify the results
SELECT
    p.id,
    p.full_name,
    u.email,
    p.role,
    p.org_id,
    o.name as org_name,
    p.membership_status
FROM profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN organizations o ON o.id = p.org_id
WHERE p.role = 'admin'
ORDER BY p.full_name;
