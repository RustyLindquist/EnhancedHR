# Supabase Schema & Migrations Foundation

This document covers database schema management, migration authoring, and local/production synchronization for EnhancedHR.ai. **Read this before any schema changes.**

## Local Development Setup

### Supabase Containers

```bash
# Start local Supabase
supabase start

# Check status
supabase status

# View logs
supabase logs
```

### Direct Database Access

```bash
# Connect to local database
docker exec -it supabase_db_enhancedhr psql -U postgres -d postgres

# Run a query
docker exec -i supabase_db_enhancedhr psql -U postgres -d postgres -c "SELECT * FROM profiles LIMIT 5;"
```

## Migration Workflow

### Creating a New Migration

```bash
# Generate timestamped migration file
supabase migration new [migration_name]

# Example:
supabase migration new add_user_preferences
# Creates: supabase/migrations/[timestamp]_add_user_preferences.sql
```

### Migration File Structure

```sql
-- supabase/migrations/[timestamp]_migration_name.sql

-- 1. Schema changes
CREATE TABLE IF NOT EXISTS new_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- 2. RLS policies
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_data" ON new_table
FOR ALL USING (auth.uid() = user_id);

-- 3. Indexes (if needed)
CREATE INDEX IF NOT EXISTS idx_new_table_user_id ON new_table(user_id);

-- 4. Functions (if needed)
CREATE OR REPLACE FUNCTION do_something()
RETURNS void AS $$
BEGIN
  -- Function body
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Applying Migrations Locally

```bash
# Apply pending migrations
supabase db push

# Reset and reapply all migrations (DANGEROUS - destroys data)
# ONLY use in development with explicit permission
supabase db reset
```

## Safe SQL Execution

### The /supabase/safe-sql Skill

For ad-hoc queries that don't need migrations:

```bash
# Read-only query
docker exec -i supabase_db_enhancedhr psql -U postgres -d postgres -c "
SELECT * FROM profiles WHERE email LIKE '%test%';
"

# Data modification (be careful)
docker exec -i supabase_db_enhancedhr psql -U postgres -d postgres -c "
UPDATE profiles SET display_name = 'Test User' WHERE id = 'specific-uuid';
"
```

### Rules for Safe SQL

1. **Always use WHERE clauses** — Never UPDATE/DELETE without WHERE
2. **Test SELECT first** — Before UPDATE, run SELECT to verify rows
3. **Use transactions for multi-step** — ROLLBACK if something goes wrong
4. **Never TRUNCATE production tables** — Use targeted DELETEs

## Schema Inspection

### View Table Structure

```sql
-- List all tables
\dt

-- Describe a table
\d table_name

-- Show table with indexes
\d+ table_name
```

### View RLS Policies

```sql
-- List all policies on a table
SELECT * FROM pg_policies WHERE tablename = 'table_name';

-- Check if RLS is enabled
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'table_name';
```

### View Functions

```sql
-- List functions
\df

-- Show function definition
\sf function_name
```

## Production Sync

### Local → Production Flow

```
1. Create migration locally
2. Test locally (supabase db push)
3. Commit migration file
4. PR review
5. Merge to main
6. CI/CD applies to production
```

### Checking Migration Status

```bash
# List migrations
supabase migration list

# Check which migrations are applied
supabase db diff
```

### Schema Drift Detection

If local and production are out of sync:

```bash
# Generate diff between local and remote
supabase db diff --linked

# This shows what SQL would bring remote in sync with local
```

## Common Patterns

### Adding a Column

```sql
-- Add column with default
ALTER TABLE table_name ADD COLUMN new_column text DEFAULT 'default_value';

-- Add nullable column
ALTER TABLE table_name ADD COLUMN new_column text;
```

### Adding a Foreign Key

```sql
-- Add FK to existing column
ALTER TABLE child_table
ADD CONSTRAINT fk_parent
FOREIGN KEY (parent_id) REFERENCES parent_table(id)
ON DELETE CASCADE;
```

### Creating an Enum

```sql
-- Create enum type
CREATE TYPE status_type AS ENUM ('pending', 'active', 'completed');

-- Use in table
ALTER TABLE table_name ADD COLUMN status status_type DEFAULT 'pending';
```

### Adding an Index

```sql
-- Simple index
CREATE INDEX idx_table_column ON table_name(column_name);

-- Composite index
CREATE INDEX idx_table_multi ON table_name(col1, col2);

-- Partial index
CREATE INDEX idx_active_only ON table_name(id) WHERE status = 'active';
```

## Destructive Operations

### FORBIDDEN Without Explicit Permission

```sql
-- These require explicit user approval:
DROP TABLE table_name;
TRUNCATE table_name;
DELETE FROM table_name; -- without WHERE
ALTER TABLE table_name DROP COLUMN column_name;
```

### Safe Alternatives

| Instead of | Do this |
|------------|---------|
| DROP TABLE | Add `deprecated_at` column, filter in queries |
| TRUNCATE | DELETE WHERE with specific criteria |
| DROP COLUMN | Add `_deprecated` suffix, stop using |

## Rollback Strategies

### For Data Migrations

```sql
-- Before migration, create backup
CREATE TABLE table_name_backup AS SELECT * FROM table_name;

-- If rollback needed
TRUNCATE table_name;
INSERT INTO table_name SELECT * FROM table_name_backup;
DROP TABLE table_name_backup;
```

### For Schema Migrations

Create down migration in separate file or comments:

```sql
-- UP: Add column
ALTER TABLE table_name ADD COLUMN new_column text;

-- DOWN (for rollback - run manually if needed):
-- ALTER TABLE table_name DROP COLUMN new_column;
```

## Key Invariants

1. **Never run `supabase db reset` without explicit permission**
2. **All schema changes go through migrations**
3. **Test migrations locally before production**
4. **RLS policies must accompany new tables**
5. **FKs should specify ON DELETE behavior**
6. **Indexes on frequently queried columns**

## Implementation Guidance

**Primary Agent**: Backend Agent
**Skills to Use**:
- `/supabase/migration` — Create new migrations
- `/supabase/safe-sql` — Execute safe queries
- `/doc-discovery` — Understand affected features
- `/plan-lint` — Validate schema changes

**Before schema changes**:
1. Understand current schema state
2. Plan migration with rollback strategy
3. Test locally
4. Document in relevant feature docs

## Related Docs

- `docs/features/FEATURE_INDEX.md` — Features and their tables
- `docs/foundation/auth-roles-rls.md` — RLS patterns
- `supabase/migrations/` — Migration files
- `.claude/agents/SAFETY_RULES.md` — Safety rules for agents
