-- Enable RLS on courses table
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read courses
CREATE POLICY "Enable read access for all users" ON "public"."courses"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

-- Create policy to allow admins to insert/update/delete
CREATE POLICY "Enable write access for admins" ON "public"."courses"
AS PERMISSIVE FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'role') = 'admin' OR (auth.jwt() ->> 'email') LIKE '%admin%')
WITH CHECK ((auth.jwt() ->> 'role') = 'admin' OR (auth.jwt() ->> 'email') LIKE '%admin%');
