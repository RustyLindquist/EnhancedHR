-- Allow public read access to expert profiles (admins and approved authors)
-- This enables the /experts/[id] page to work for all visitors

-- Drop existing policy if it exists (idempotent)
DROP POLICY IF EXISTS "Public can view expert profiles" ON profiles;

-- Policy: Anyone can view profiles of admins or approved experts
CREATE POLICY "Public can view expert profiles"
ON profiles
FOR SELECT
USING (role = 'admin' OR author_status = 'approved');
