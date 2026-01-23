-- Migration: Platform Expert Resources
-- Purpose: Decouple Expert Resources from individual user accounts to prevent data loss
-- when admin accounts are deleted.
--
-- Changes:
-- 1. Add created_by column for audit trail (tracks who created the resource)
-- 2. Add storage policy allowing admins to upload to platform/ folder
-- 3. Add RLS policy for admin management of expert resources

-- ============================================================================
-- 1. Add created_by column to user_context_items for audit trail
-- ============================================================================
ALTER TABLE user_context_items
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Backfill existing expert resources - set created_by to current user_id
UPDATE user_context_items
SET created_by = user_id
WHERE collection_id = 'expert-resources' AND created_by IS NULL;

-- Add index for created_by queries
CREATE INDEX IF NOT EXISTS user_context_items_created_by_idx ON user_context_items(created_by);

-- ============================================================================
-- 2. Add storage policy for platform folder uploads by admins
-- ============================================================================

-- Policy: Admins can upload to platform/ folder
DROP POLICY IF EXISTS "Admins can upload platform context files" ON storage.objects;
CREATE POLICY "Admins can upload platform context files"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'user-context-files'
    AND (storage.foldername(name))[1] = 'platform'
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Policy: Admins can delete from platform/ folder
DROP POLICY IF EXISTS "Admins can delete platform context files" ON storage.objects;
CREATE POLICY "Admins can delete platform context files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'user-context-files'
    AND (storage.foldername(name))[1] = 'platform'
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- ============================================================================
-- 3. Add RLS policies for admin management of expert resources
-- ============================================================================

-- Allow admins to read all expert resources
DROP POLICY IF EXISTS "Admins can view expert resources" ON user_context_items;
CREATE POLICY "Admins can view expert resources"
ON user_context_items FOR SELECT
USING (
    collection_id = 'expert-resources'
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'expert')
    )
);

-- Allow admins to insert expert resources (with any user_id for platform content)
DROP POLICY IF EXISTS "Admins can insert expert resources" ON user_context_items;
CREATE POLICY "Admins can insert expert resources"
ON user_context_items FOR INSERT
WITH CHECK (
    collection_id = 'expert-resources'
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Allow admins to update expert resources
DROP POLICY IF EXISTS "Admins can update expert resources" ON user_context_items;
CREATE POLICY "Admins can update expert resources"
ON user_context_items FOR UPDATE
USING (
    collection_id = 'expert-resources'
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Allow admins to delete expert resources
DROP POLICY IF EXISTS "Admins can delete expert resources" ON user_context_items;
CREATE POLICY "Admins can delete expert resources"
ON user_context_items FOR DELETE
USING (
    collection_id = 'expert-resources'
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- ============================================================================
-- 4. Create or get system platform user for ownership
-- ============================================================================

-- We'll use a UUID constant for the platform user_id
-- This allows us to set user_id to a known constant without creating a fake user
-- The constant is: 00000000-0000-0000-0000-000000000000 (nil UUID)
-- However, since user_id has a foreign key to auth.users, we need a different approach.

-- Alternative: Allow NULL user_id for platform content by making it nullable for expert-resources
-- This is the cleanest solution as it clearly indicates "platform-owned" content

-- For now, the application code will continue using admin client to bypass RLS
-- and will store created_by for audit trail while keeping user_id for compatibility.

COMMENT ON COLUMN user_context_items.created_by IS 'Audit trail: The user who originally created this item. For expert-resources, the item is platform-owned but this tracks who created it.';
