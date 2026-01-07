# Safe SQL Execution Skill

Execute SQL safely against the local Supabase database without destroying data.

## Critical Safety Rules

⛔ **NEVER RUN THESE COMMANDS:**
- `DROP DATABASE`
- `DROP TABLE` (on data tables)
- `TRUNCATE` (on data tables)
- `DELETE` without WHERE clause
- `UPDATE` without WHERE clause

🚨 **IF YOU'RE TEMPTED TO RESET THE DATABASE, STOP.**
There is ALWAYS a targeted SQL fix. Ask the user for guidance.

---

## Connection Commands

```bash
# Interactive SQL session
docker exec -it supabase_db_san-jose psql -U postgres

# Single command execution
docker exec -it supabase_db_san-jose psql -U postgres -c "YOUR SQL HERE"

# Execute SQL from file
docker exec -i supabase_db_san-jose psql -U postgres < your_script.sql
```

---

## Operation Safety Levels

### 🟢 Always Safe (no approval needed)

```sql
-- Query data
SELECT * FROM table_name WHERE condition;

-- Analyze queries
EXPLAIN SELECT * FROM table_name WHERE condition;

-- Inspect schema
\d table_name
\dt  -- List tables
\dp table_name  -- Show permissions

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Check indexes
SELECT * FROM pg_indexes WHERE tablename = 'your_table';

-- Insert new data
INSERT INTO table_name (col1, col2) VALUES (val1, val2);
```

### 🟡 Safe With Care (verify first, then execute)

```sql
-- Add column (always safe)
ALTER TABLE table_name ADD COLUMN column_name type;

-- Add index (always safe)
CREATE INDEX idx_name ON table_name (column_name);

-- Create new table (always safe)
CREATE TABLE new_table (...);

-- Grant permissions (verify first)
GRANT SELECT ON table_name TO authenticated;

-- Create/replace RLS policy (verify first)
CREATE POLICY "policy_name" ON table_name
  FOR SELECT TO authenticated
  USING (condition);

-- Update with WHERE (MUST verify with SELECT first)
UPDATE table_name SET column = value WHERE condition;
```

### 🔴 Dangerous (require user confirmation)

```sql
-- Delete rows (even with WHERE)
DELETE FROM table_name WHERE condition;

-- Drop column (data loss)
ALTER TABLE table_name DROP COLUMN column_name;

-- Drop table (data loss)
DROP TABLE table_name;

-- Alter column type (potential data loss)
ALTER TABLE table_name ALTER COLUMN col TYPE new_type;
```

### ⛔ NEVER (absolute prohibition)

```sql
-- These commands destroy all data
DROP DATABASE postgres;
TRUNCATE table_name;
DELETE FROM table_name;  -- No WHERE clause
UPDATE table_name SET ...;  -- No WHERE clause
```

---

## Safe Execution Checklist

Before modifying data, verify:

```
[ ] I have a specific, targeted operation (not bulk)
[ ] I've tested with SELECT first to see affected rows
[ ] I have a WHERE clause (for UPDATE/DELETE)
[ ] I understand exactly what rows will be affected
[ ] I've backed up important data (if risky)
[ ] The operation is reversible OR I have user approval
```

---

## Common Fix Patterns

### Fix RLS Policy Issue

```sql
-- 1. Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'your_table';

-- 2. Drop broken policy (if needed)
DROP POLICY IF EXISTS "old_policy_name" ON table_name;

-- 3. Create correct policy
CREATE POLICY "new_policy_name" ON table_name
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
```

### Fix Permission Issue

```sql
-- 1. Check current permissions
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'your_table';

-- 2. Grant missing permission
GRANT SELECT ON table_name TO authenticated;
GRANT INSERT ON table_name TO authenticated;
GRANT UPDATE ON table_name TO authenticated;
```

### Fix Foreign Key Constraint

```sql
-- 1. Check existing constraints
SELECT constraint_name, table_name, column_name
FROM information_schema.key_column_usage
WHERE table_name = 'your_table';

-- 2. Add missing constraint
ALTER TABLE child_table
  ADD CONSTRAINT fk_name
  FOREIGN KEY (column_name)
  REFERENCES parent_table(id)
  ON DELETE CASCADE;
```

### Safe Data Update

```sql
-- 1. FIRST: Verify what will be affected
SELECT * FROM table_name WHERE condition;

-- 2. Count affected rows
SELECT COUNT(*) FROM table_name WHERE condition;

-- 3. THEN: Update (only if results are expected)
UPDATE table_name
SET column = value
WHERE condition;

-- 4. Verify update succeeded
SELECT * FROM table_name WHERE condition;
```

### Safe Data Deletion

```sql
-- 1. FIRST: See what will be deleted
SELECT * FROM table_name WHERE condition;

-- 2. Count rows to be deleted
SELECT COUNT(*) FROM table_name WHERE condition;

-- 3. CONFIRM with user before proceeding

-- 4. THEN: Delete (only after confirmation)
DELETE FROM table_name WHERE condition;

-- 5. Verify deletion
SELECT COUNT(*) FROM table_name WHERE condition;  -- Should be 0
```

### Add Column Safely

```sql
-- Always safe - no data loss
ALTER TABLE table_name
ADD COLUMN column_name data_type;

-- With default value
ALTER TABLE table_name
ADD COLUMN column_name data_type DEFAULT default_value;

-- With NOT NULL (requires default)
ALTER TABLE table_name
ADD COLUMN column_name data_type NOT NULL DEFAULT default_value;
```

### Rename Column Safely

```sql
-- Option 1: Direct rename (breaks existing queries)
ALTER TABLE table_name
RENAME COLUMN old_name TO new_name;

-- Option 2: Safe migration (no downtime)
-- Step 1: Add new column
ALTER TABLE table_name ADD COLUMN new_name type;

-- Step 2: Copy data
UPDATE table_name SET new_name = old_name;

-- Step 3: Update application code to use new_name

-- Step 4: Drop old column (after app deployment)
ALTER TABLE table_name DROP COLUMN old_name;
```

---

## Emergency Recovery

If you accidentally run a destructive command:

### If DELETE/TRUNCATE just happened:

1. **STOP immediately** - don't run more commands
2. **Check if there's a backup:**
   ```bash
   # Check for automatic backups
   ls -la supabase/.branches/
   ```
3. **Notify the user** - they may have external backups
4. **DO NOT try to "fix" by running more commands**

### If RLS is broken:

```sql
-- Enable RLS if disabled
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'table_name';

-- Recreate policy (don't drop table!)
CREATE POLICY "policy_name" ON table_name
  FOR ALL TO authenticated
  USING (condition);
```

---

## When Stuck

If a SQL operation is failing:

1. **DO NOT reset the database**
2. **Read the error message carefully**
3. **Query the schema to understand current state:**
   ```sql
   \d table_name  -- Show table structure
   SELECT * FROM pg_policies WHERE tablename = 'table_name';
   SELECT * FROM information_schema.table_constraints WHERE table_name = 'table_name';
   ```
4. **Find the targeted fix** (usually a single ALTER/CREATE/GRANT statement)
5. **If truly stuck, ask the user** - don't guess with destructive operations

---

## Example Session

```sql
-- Safe investigation workflow
postgres=# \dt  -- List all tables
postgres=# \d bookmarks  -- Show bookmarks structure
postgres=# SELECT * FROM pg_policies WHERE tablename = 'bookmarks';
postgres=# SELECT COUNT(*) FROM bookmarks;  -- How many rows?

-- Found the issue: missing RLS policy
-- Safe fix:
postgres=# CREATE POLICY "Users can view own bookmarks" ON bookmarks
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Verify fix
postgres=# SELECT * FROM pg_policies WHERE tablename = 'bookmarks';
postgres=# \q  -- Exit
```

---

## Remember

- **SELECT before UPDATE/DELETE** - always verify affected rows
- **WHERE clauses are mandatory** - never modify data in bulk
- **One table at a time** - targeted fixes, not sweeping changes
- **Read error messages** - they usually tell you exactly what to fix
- **Ask for help** - if you're considering `DROP` or `TRUNCATE`, stop and ask

The database has valuable data. Protect it.
