-- Add org_id column to notes table for org-owned notes
-- Notes with org_id = NULL are personal notes
-- Notes with org_id set are organization notes

-- Add org_id column
ALTER TABLE notes ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Add index for org queries
CREATE INDEX IF NOT EXISTS idx_notes_org_id ON notes(org_id);

-- Update RLS policies to allow org members to view org notes

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON notes;
DROP POLICY IF EXISTS "Users can update own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON notes;

-- Personal notes: Users can view their own personal notes
CREATE POLICY "Users can view own personal notes" ON notes
  FOR SELECT USING (
    auth.uid() = user_id
    AND org_id IS NULL
  );

-- Org notes: Org members can view org notes
CREATE POLICY "Org members can view org notes" ON notes
  FOR SELECT USING (
    org_id IN (
      SELECT p.org_id FROM profiles p WHERE p.id = auth.uid()
    )
  );

-- Personal notes: Users can insert their own personal notes
CREATE POLICY "Users can insert own personal notes" ON notes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND org_id IS NULL
  );

-- Org notes: Org admins can insert org notes
CREATE POLICY "Org admins can insert org notes" ON notes
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT p.org_id FROM profiles p
      WHERE p.id = auth.uid()
      AND p.membership_status IN ('org_admin', 'platform_admin')
    )
  );

-- Personal notes: Users can update their own personal notes
CREATE POLICY "Users can update own personal notes" ON notes
  FOR UPDATE USING (
    auth.uid() = user_id
    AND org_id IS NULL
  );

-- Org notes: Org admins can update org notes
CREATE POLICY "Org admins can update org notes" ON notes
  FOR UPDATE USING (
    org_id IN (
      SELECT p.org_id FROM profiles p
      WHERE p.id = auth.uid()
      AND p.membership_status IN ('org_admin', 'platform_admin')
    )
  );

-- Personal notes: Users can delete their own personal notes
CREATE POLICY "Users can delete own personal notes" ON notes
  FOR DELETE USING (
    auth.uid() = user_id
    AND org_id IS NULL
  );

-- Org notes: Org admins can delete org notes
CREATE POLICY "Org admins can delete org notes" ON notes
  FOR DELETE USING (
    org_id IN (
      SELECT p.org_id FROM profiles p
      WHERE p.id = auth.uid()
      AND p.membership_status IN ('org_admin', 'platform_admin')
    )
  );

-- Data migration: Set org_id for existing notes that are in org collections
-- This fixes notes that were added to org collections before this migration
UPDATE notes n
SET org_id = uc.org_id
FROM collection_items ci
JOIN user_collections uc ON ci.collection_id = uc.id
WHERE ci.item_type = 'NOTE'
  AND ci.item_id::uuid = n.id
  AND uc.is_org_collection = true
  AND n.org_id IS NULL
  AND uc.org_id IS NOT NULL;
