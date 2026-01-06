-- Note: Admin access to all profiles is now handled via the service role client
-- in the application code (createAdminClient), not through RLS policies.
-- This avoids complex RLS policies that can cause circular reference issues.

-- The default RLS policies remain:
-- - Users can view their own profile
-- - Users can update their own profile
--
-- Admin operations use the service role key which bypasses RLS entirely.
