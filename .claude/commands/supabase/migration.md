---
description: Create and apply Supabase database migrations safely
---

# Safe Migration Skill

Create and apply Supabase database migrations safely.

## Critical Safety Rules

⛔ **MIGRATION ANTI-PATTERNS (never do this):**
- DROP TABLE and recreate (data loss)
- DELETE all rows (use UPDATE with conditions)
- Reset database instead of migrating
- Change column type destructively (use safe migration pattern)
- Apply untested migrations to production

✅ **MIGRATION PRINCIPLES:**
- Migrations are additive and reversible
- Existing data must be preserved
- Schema changes are separate from data migrations
- Test locally before production
- Provide production-ready SQL scripts

---

## Migration Workflow

### Step 1: Plan the Change

Before creating a migration, answer:

1. **What schema change is needed?**
   - New table?
   - New column?
   - Modified constraint?
   - New RLS policy?

2. **What data migrations are required?**
   - Data transformations?
   - Default values?
   - Data type conversions?

3. **What is the rollback strategy?**
   - Can this be undone?
   - What's the reverse operation?

4. **What features are affected?**
   - Query Doc Agent for feature impact
   - Check for breaking changes

### Step 2: Create Migration File

```bash
# Create new migration with descriptive name
supabase migration new add_bookmarks_collection_id

# Creates: supabase/migrations/YYYYMMDDHHMMSS_add_bookmarks_collection_id.sql
```

**Naming conventions:**
- `add_[table]_[column]` - Adding columns
- `create_[table]` - Creating tables
- `modify_[table]_[aspect]` - Modifying structure
- `fix_[issue]` - Fixing specific issues
- `update_[policy]` - RLS policy changes

### Step 3: Write Migration SQL

Edit the generated file with clear, commented SQL:

```sql
-- Migration: Add collection_id to bookmarks table
-- Date: 2026-01-07
-- Purpose: Enable bookmarks to be organized into collections
-- Feature: bookmarks, collections
-- Breaking: No (nullable column, backward compatible)

-- Add collection_id column (nullable for backward compatibility)
ALTER TABLE bookmarks
ADD COLUMN collection_id uuid REFERENCES collections(id) ON DELETE SET NULL;

-- Add index for collection queries
CREATE INDEX idx_bookmarks_collection_id ON bookmarks(collection_id);

-- Update RLS policy to include collection access
CREATE POLICY "Users can view bookmarks in their collections"
ON bookmarks FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR
  collection_id IN (
    SELECT id FROM collections WHERE user_id = auth.uid()
  )
);
```

### Step 4: Test Locally

```bash
# Apply migration to local database
supabase migration up

# Verify schema change
docker exec -it supabase_db_san-jose psql -U postgres -c "\d bookmarks"

# Check that existing data is intact
docker exec -it supabase_db_san-jose psql -U postgres -c "SELECT COUNT(*) FROM bookmarks;"
```

### Step 5: Verify

**Schema verification:**
```sql
-- Check column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bookmarks';

-- Check index was created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'bookmarks';

-- Check RLS policy
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'bookmarks';
```

**Data verification:**
```sql
-- Existing data preserved?
SELECT COUNT(*) FROM bookmarks;

-- New column accessible?
SELECT id, collection_id FROM bookmarks LIMIT 5;
```

**Feature verification:**
- Test affected features in the app
- Verify no errors in console
- Check that queries still work

### Step 6: Document

**Update feature docs:**
```markdown
## Data Model

### bookmarks table
- `collection_id` (uuid, nullable) - Reference to collections table (added 2026-01-07)
```

**Create production SQL script:**

Save as `supabase/migrations/production/YYYYMMDDHHMMSS_add_bookmarks_collection_id.sql`:

```sql
-- ========================================
-- Migration: Add collection_id to bookmarks
-- Date: 2026-01-07
-- Feature: bookmarks, collections
-- ========================================

-- PRE-FLIGHT CHECKS
-- Run these first to verify safe to proceed:

-- 1. Check bookmarks table exists
SELECT COUNT(*) FROM bookmarks;

-- 2. Check collections table exists (for foreign key)
SELECT COUNT(*) FROM collections;

-- 3. Verify no existing collection_id column
SELECT column_name FROM information_schema.columns
WHERE table_name = 'bookmarks' AND column_name = 'collection_id';
-- (should return 0 rows)

-- ========================================
-- MIGRATION (run after pre-flight checks pass)
-- ========================================

BEGIN;

-- Add collection_id column
ALTER TABLE bookmarks
ADD COLUMN collection_id uuid REFERENCES collections(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX idx_bookmarks_collection_id ON bookmarks(collection_id);

-- Update RLS policy
CREATE POLICY "Users can view bookmarks in their collections"
ON bookmarks FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR
  collection_id IN (
    SELECT id FROM collections WHERE user_id = auth.uid()
  )
);

COMMIT;

-- ========================================
-- VERIFICATION (run after migration)
-- ========================================

-- Check column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bookmarks' AND column_name = 'collection_id';

-- Check index exists
SELECT indexname FROM pg_indexes
WHERE tablename = 'bookmarks' AND indexname = 'idx_bookmarks_collection_id';

-- Check policy exists
SELECT policyname FROM pg_policies
WHERE tablename = 'bookmarks' AND policyname = 'Users can view bookmarks in their collections';

-- Check data integrity (should match pre-flight count)
SELECT COUNT(*) FROM bookmarks;

-- ========================================
-- ROLLBACK (if needed)
-- ========================================

BEGIN;

-- Drop policy
DROP POLICY IF EXISTS "Users can view bookmarks in their collections" ON bookmarks;

-- Drop index
DROP INDEX IF EXISTS idx_bookmarks_collection_id;

-- Drop column
ALTER TABLE bookmarks DROP COLUMN IF EXISTS collection_id;

COMMIT;
```

---

## Safe Column Operations

### Adding a Column (Always Safe)

```sql
-- Basic add
ALTER TABLE table_name ADD COLUMN column_name type;

-- With default value
ALTER TABLE table_name ADD COLUMN column_name type DEFAULT value;

-- With NOT NULL (requires default or data population)
ALTER TABLE table_name ADD COLUMN column_name type NOT NULL DEFAULT value;

-- With foreign key
ALTER TABLE table_name
ADD COLUMN fk_column uuid REFERENCES other_table(id) ON DELETE CASCADE;
```

### Renaming a Column (Safe Pattern)

**Bad (breaks existing code immediately):**
```sql
ALTER TABLE t RENAME COLUMN old_name TO new_name;
```

**Good (zero-downtime migration):**

```sql
-- Step 1: Add new column
ALTER TABLE t ADD COLUMN new_name type;

-- Step 2: Populate new column from old
UPDATE t SET new_name = old_name WHERE new_name IS NULL;

-- Step 3: Make new column NOT NULL (after population)
ALTER TABLE t ALTER COLUMN new_name SET NOT NULL;

-- Step 4: Deploy application code to use new_name

-- Step 5: Drop old column (after deployment)
ALTER TABLE t DROP COLUMN old_name;
```

### Changing Column Type (Safe Pattern)

**Bad (may fail or lose data):**
```sql
ALTER TABLE t ALTER COLUMN col TYPE new_type;
```

**Good (safe migration):**

```sql
-- Step 1: Add new column with new type
ALTER TABLE t ADD COLUMN col_new new_type;

-- Step 2: Migrate data with conversion
UPDATE t SET col_new = col::new_type WHERE col_new IS NULL;
-- (handle conversion errors gracefully)

-- Step 3: Verify migration
SELECT COUNT(*) FROM t WHERE col_new IS NULL;
-- (should be 0)

-- Step 4: Make new column NOT NULL
ALTER TABLE t ALTER COLUMN col_new SET NOT NULL;

-- Step 5: Drop old column (after app deployment)
ALTER TABLE t DROP COLUMN col;

-- Step 6: Rename new column to old name
ALTER TABLE t RENAME COLUMN col_new TO col;
```

### Making Column NOT NULL (Safe Pattern)

**Bad (fails if NULL values exist):**
```sql
ALTER TABLE t ALTER COLUMN col SET NOT NULL;
```

**Good (safe migration):**

```sql
-- Step 1: Set default value for new rows
ALTER TABLE t ALTER COLUMN col SET DEFAULT default_value;

-- Step 2: Update existing NULL rows
UPDATE t SET col = default_value WHERE col IS NULL;

-- Step 3: Verify no NULLs remain
SELECT COUNT(*) FROM t WHERE col IS NULL;
-- (should be 0)

-- Step 4: Add NOT NULL constraint
ALTER TABLE t ALTER COLUMN col SET NOT NULL;
```

---

## Safe Table Operations

### Creating a Table (Always Safe)

```sql
CREATE TABLE table_name (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_table_user_id ON table_name(user_id);

-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view own records"
ON table_name FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create own records"
ON table_name FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
```

### Dropping a Table (Dangerous - Requires Approval)

**Never do this without user confirmation and backup.**

```sql
-- ONLY after user confirms and data is backed up
DROP TABLE IF EXISTS table_name CASCADE;
```

---

## Safe RLS Policy Operations

### Creating a Policy

```sql
-- Create new policy
CREATE POLICY "policy_name" ON table_name
  FOR operation  -- SELECT, INSERT, UPDATE, DELETE, or ALL
  TO role  -- authenticated, anon, or public
  USING (condition)  -- For SELECT, UPDATE, DELETE
  WITH CHECK (condition);  -- For INSERT, UPDATE
```

### Replacing a Policy

```sql
-- Drop old policy
DROP POLICY IF EXISTS "old_policy_name" ON table_name;

-- Create new policy
CREATE POLICY "new_policy_name" ON table_name
  FOR SELECT TO authenticated
  USING (new_condition);
```

### Common RLS Patterns

```sql
-- User owns the row
USING (user_id = auth.uid())

-- User is member of organization
USING (org_id IN (
  SELECT org_id FROM org_members WHERE user_id = auth.uid()
))

-- Row is public OR user owns it
USING (is_public = true OR user_id = auth.uid())

-- User has specific role
USING (
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
  )
)
```

---

## Migration Patterns

### Add Table with RLS

```sql
-- Create table
CREATE TABLE collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_collections_user_id ON collections(user_id);

-- Enable RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view own collections"
ON collections FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create own collections"
ON collections FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own collections"
ON collections FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own collections"
ON collections FOR DELETE TO authenticated
USING (user_id = auth.uid());
```

### Add Foreign Key to Existing Table

```sql
-- Add column
ALTER TABLE bookmarks
ADD COLUMN collection_id uuid REFERENCES collections(id) ON DELETE SET NULL;

-- Add index for foreign key
CREATE INDEX idx_bookmarks_collection_id ON bookmarks(collection_id);

-- Update RLS to include collection access
CREATE POLICY "Users can view bookmarks in their collections"
ON bookmarks FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR
  collection_id IN (
    SELECT id FROM collections WHERE user_id = auth.uid()
  )
);
```

### Add Unique Constraint

```sql
-- Add unique constraint
ALTER TABLE table_name
ADD CONSTRAINT unique_column_name UNIQUE (column_name);

-- Or unique index (preferred for performance)
CREATE UNIQUE INDEX idx_table_unique_column ON table_name(column_name);
```

---

## Production Deployment Checklist

Before running migration in production:

```
[ ] Migration tested locally successfully
[ ] Existing data verified intact after local migration
[ ] Affected features tested and working
[ ] Feature docs updated
[ ] Production SQL script created and reviewed
[ ] Rollback SQL prepared and tested
[ ] User confirms ready to apply
[ ] Backup of production data available (if risky)
```

---

## Rollback Strategy

Every migration should have a rollback plan:

```sql
-- ========================================
-- ROLLBACK for: add_collection_id_to_bookmarks
-- ========================================

BEGIN;

-- Reverse operations in opposite order

-- Drop policy
DROP POLICY IF EXISTS "Users can view bookmarks in their collections" ON bookmarks;

-- Drop index
DROP INDEX IF EXISTS idx_bookmarks_collection_id;

-- Drop column (data loss - only if safe)
ALTER TABLE bookmarks DROP COLUMN IF EXISTS collection_id;

COMMIT;

-- Verify rollback
SELECT column_name FROM information_schema.columns
WHERE table_name = 'bookmarks' AND column_name = 'collection_id';
-- (should return 0 rows)
```

---

## Common Migration Scenarios

### Scenario 1: Add Optional Feature Column

```sql
-- Safe: nullable column, backward compatible
ALTER TABLE courses ADD COLUMN difficulty_level text;

-- Safe: add index
CREATE INDEX idx_courses_difficulty ON courses(difficulty_level);
```

### Scenario 2: Add Required Feature Column

```sql
-- Step 1: Add nullable column
ALTER TABLE courses ADD COLUMN instructor_id uuid REFERENCES users(id);

-- Step 2: Populate with data
UPDATE courses SET instructor_id = created_by WHERE instructor_id IS NULL;

-- Step 3: Make NOT NULL
ALTER TABLE courses ALTER COLUMN instructor_id SET NOT NULL;

-- Step 4: Add index
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
```

### Scenario 3: Split Column into Two

```sql
-- Original: full_name text
-- Target: first_name text, last_name text

-- Step 1: Add new columns
ALTER TABLE users ADD COLUMN first_name text;
ALTER TABLE users ADD COLUMN last_name text;

-- Step 2: Migrate data (example - adjust parsing as needed)
UPDATE users
SET
  first_name = split_part(full_name, ' ', 1),
  last_name = split_part(full_name, ' ', 2)
WHERE first_name IS NULL;

-- Step 3: Verify migration
SELECT COUNT(*) FROM users WHERE first_name IS NULL OR last_name IS NULL;

-- Step 4: Drop old column (after app deployment)
ALTER TABLE users DROP COLUMN full_name;
```

### Scenario 4: Add Enum Type Safely

```sql
-- Step 1: Create enum type
CREATE TYPE user_role AS ENUM ('admin', 'member', 'guest');

-- Step 2: Add column with enum type
ALTER TABLE users ADD COLUMN role user_role NOT NULL DEFAULT 'member';

-- Step 3: Add index if needed
CREATE INDEX idx_users_role ON users(role);
```

---

## When Stuck

If migration is failing:

1. **Read the error message** - it tells you exactly what's wrong
2. **Check current schema state:**
   ```sql
   \d table_name
   SELECT * FROM pg_policies WHERE tablename = 'table_name';
   ```
3. **Verify constraints:**
   ```sql
   SELECT * FROM information_schema.table_constraints
   WHERE table_name = 'table_name';
   ```
4. **Don't reset the database** - find the targeted fix
5. **Ask for help** if truly stuck

---

## Remember

- **Test locally first** - never run untested migrations in production
- **Preserve existing data** - migrations should be additive
- **Provide rollback** - every migration should be reversible
- **Document changes** - update feature docs
- **One change at a time** - small, focused migrations
- **Include verification** - how to confirm migration succeeded

Migrations change the foundation of the application. Do them carefully.
