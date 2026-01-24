-- Migration: Add org_id to user_context_items for org collection video support
-- This allows org admins to create videos that are owned by the organization

-- 1. Add org_id column to user_context_items
ALTER TABLE user_context_items
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 2. Create index for org-scoped queries
CREATE INDEX IF NOT EXISTS idx_user_context_items_org_id
ON user_context_items(org_id) WHERE org_id IS NOT NULL;

-- 3. RLS: Org admins can insert org context items (including videos)
CREATE POLICY "Org admins can insert org context items"
ON user_context_items FOR INSERT
WITH CHECK (
    org_id IS NOT NULL AND
    org_id IN (
        SELECT p.org_id FROM profiles p
        WHERE p.id = auth.uid()
        AND (p.membership_status = 'org_admin' OR p.role = 'admin')
    )
);

-- 4. RLS: Org admins can update org context items
CREATE POLICY "Org admins can update org context items"
ON user_context_items FOR UPDATE
USING (
    org_id IS NOT NULL AND
    org_id IN (
        SELECT p.org_id FROM profiles p
        WHERE p.id = auth.uid()
        AND (p.membership_status = 'org_admin' OR p.role = 'admin')
    )
);

-- 5. RLS: Org admins can delete org context items
CREATE POLICY "Org admins can delete org context items"
ON user_context_items FOR DELETE
USING (
    org_id IS NOT NULL AND
    org_id IN (
        SELECT p.org_id FROM profiles p
        WHERE p.id = auth.uid()
        AND (p.membership_status = 'org_admin' OR p.role = 'admin')
    )
);

-- 6. RLS: Org members can view org context items
CREATE POLICY "Org members can view org context items"
ON user_context_items FOR SELECT
USING (
    org_id IS NOT NULL AND
    org_id IN (
        SELECT p.org_id FROM profiles p
        WHERE p.id = auth.uid()
    )
);
