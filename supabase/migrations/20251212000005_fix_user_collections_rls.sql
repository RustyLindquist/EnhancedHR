-- Fix RLS for user_collections to allow users to manage their own collections
ALTER TABLE "public"."user_collections" ENABLE ROW LEVEL SECURITY;

-- Note: Policies might already exist under different names, but these specific ones are standard.
-- If they exist, this might error, but in SQL usually we check existence or drop first.
-- Given I didn't see them, I'll try to create them.

DROP POLICY IF EXISTS "Users can view their own collections" ON "public"."user_collections";
CREATE POLICY "Users can view their own collections"
ON "public"."user_collections"
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own collections" ON "public"."user_collections";
CREATE POLICY "Users can create their own collections"
ON "public"."user_collections"
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own collections" ON "public"."user_collections";
CREATE POLICY "Users can update their own collections"
ON "public"."user_collections"
FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own collections" ON "public"."user_collections";
CREATE POLICY "Users can delete their own collections"
ON "public"."user_collections"
FOR DELETE
USING (auth.uid() = user_id);
