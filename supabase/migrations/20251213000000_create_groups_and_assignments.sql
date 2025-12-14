-- Create Employee Groups Table
CREATE TABLE IF NOT EXISTS employee_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Associate Groups with profiles RLS (Org Admins can manage, Members can view if involved? Actually mainly Org Admins)
ALTER TABLE employee_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org Admins can manage groups" ON employee_groups
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.org_id = employee_groups.org_id
            AND (profiles.role = 'org_admin' OR profiles.role = 'admin')
        )
    );

-- Create Group Members Table (Junction)
CREATE TABLE IF NOT EXISTS employee_group_members (
    group_id UUID NOT NULL REFERENCES employee_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (group_id, user_id)
);

ALTER TABLE employee_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org Admins can manage group members" ON employee_group_members
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM employee_groups
            JOIN profiles ON profiles.org_id = employee_groups.org_id
            WHERE employee_groups.id = employee_group_members.group_id
            AND profiles.id = auth.uid()
            AND (profiles.role = 'org_admin' OR profiles.role = 'admin')
        )
    );

-- Create Content Assignments Table
CREATE TABLE IF NOT EXISTS content_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Assignee (Polymorphic-ish, or just fields)
    assignee_type TEXT NOT NULL CHECK (assignee_type IN ('user', 'group', 'org')),
    assignee_id UUID NOT NULL, -- Could be profile.id or employee_group.id. No FK constraint possible easily if polymorphic, checking in app logic or separate columns. Let's use generic ID but indices.
    
    -- Content
    content_type TEXT NOT NULL CHECK (content_type IN ('course', 'module', 'lesson', 'resource')), -- Extensible
    content_id UUID NOT NULL, -- References courses(id) etc (but polymorphic content)
    
    -- Meta
    assignment_type TEXT NOT NULL CHECK (assignment_type IN ('required', 'recommended')),
    assigned_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_content_assignments_org_id ON content_assignments(org_id);
CREATE INDEX idx_content_assignments_assignee ON content_assignments(assignee_type, assignee_id);

ALTER TABLE content_assignments ENABLE ROW LEVEL SECURITY;

-- RLS: Org Admins can manage assignments
CREATE POLICY "Org Admins can manage assignments" ON content_assignments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.org_id = content_assignments.org_id
            AND (profiles.role = 'org_admin' OR profiles.role = 'admin')
        )
    );

-- RLS: Users can view assignments assigned to them (Directly)
CREATE POLICY "Users can view their own assignments" ON content_assignments
    FOR SELECT
    USING (
        (assignee_type = 'user' AND assignee_id = auth.uid())
    );

-- RLS: Users can view assignments assigned to their groups (Complex join, maybe simpler to do in app logic or a "view" helper?)
-- Determining if auth.uid() is in group ID "assignee_id".
-- For usage performance, we might just query as Admin or query specific endpoints. 
-- But strictly, user should see it.
CREATE POLICY "Users can view group assignments" ON content_assignments
    FOR SELECT
    USING (
         assignee_type = 'group' AND EXISTS (
            SELECT 1 FROM employee_group_members
            WHERE employee_group_members.group_id = content_assignments.assignee_id
            AND employee_group_members.user_id = auth.uid()
         )
    );

-- RLS: Users can view org assignments
CREATE POLICY "Users can view org assignments" ON content_assignments
    FOR SELECT
    USING (
        assignee_type = 'org' AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.org_id = content_assignments.org_id
        )
    );

NOTIFY pgrst, 'reload schema';
