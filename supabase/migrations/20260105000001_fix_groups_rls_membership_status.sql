-- Fix RLS policies for employee_groups and employee_group_members
-- to include membership_status check (not just role)

-- Drop existing policies
DROP POLICY IF EXISTS "Org Admins can manage groups" ON employee_groups;
DROP POLICY IF EXISTS "Org Admins can manage group members" ON employee_group_members;

-- Recreate employee_groups policy with membership_status check
CREATE POLICY "Org Admins can manage groups" ON employee_groups
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.org_id = employee_groups.org_id
            AND (
                profiles.role = 'org_admin'
                OR profiles.role = 'admin'
                OR profiles.membership_status = 'org_admin'
            )
        )
    );

-- Recreate employee_group_members policy with membership_status check
CREATE POLICY "Org Admins can manage group members" ON employee_group_members
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM employee_groups
            JOIN profiles ON profiles.org_id = employee_groups.org_id
            WHERE employee_groups.id = employee_group_members.group_id
            AND profiles.id = auth.uid()
            AND (
                profiles.role = 'org_admin'
                OR profiles.role = 'admin'
                OR profiles.membership_status = 'org_admin'
            )
        )
    );

NOTIFY pgrst, 'reload schema';
