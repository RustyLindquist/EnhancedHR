# CLAUDE.md - Critical Instructions for AI Agents

This file contains the most critical safety rules for any AI agent working in this codebase. These rules are NON-NEGOTIABLE.

## CRITICAL SAFETY RULE: DATABASE PROTECTION

**READ THIS FIRST. THIS IS THE MOST IMPORTANT RULE.**

### FORBIDDEN COMMANDS - NEVER RUN WITHOUT EXPLICIT USER APPROVAL

```
ABSOLUTELY FORBIDDEN (will destroy all data):
- supabase db reset
- supabase db push (with destructive changes)
- docker volume rm (for supabase volumes)
- DROP TABLE / DROP DATABASE / TRUNCATE
- Any command that wipes, resets, or destroys database data
- supabase stop && supabase start (if unsure about data persistence)
```

### Why This Rule Exists

On 2026-01-05, an AI agent destroyed the entire database while attempting to fix a simple RLS policy issue. All user data, groups, courses, and configurations were permanently lost. The fix required only a SINGLE SQL STATEMENT or a minor code change.

**The agent chose to use a sledgehammer when a screwdriver was needed.**

### Before Running ANY Database-Related Command

STOP and ask yourself:
1. **Will this command delete or reset ANY data?** → If yes or maybe, STOP
2. **Can this be solved with a targeted SQL statement?** → If yes, do that instead
3. **Can this be solved with a code change?** → If yes, do that instead
4. **Is there ANY alternative that preserves data?** → If yes, use that

### Safe Alternatives

| Problem | WRONG (destroys data) | RIGHT (preserves data) |
|---------|----------------------|------------------------|
| RLS policy issue | `supabase db reset` | `docker exec supabase_db_* psql -c "ALTER POLICY..."` |
| Permission denied | Reset database | Use `createAdminClient()` in server action |
| Apply migration | Reset and restart | `supabase migration up` or pipe SQL via docker exec |
| Schema mismatch | Delete volumes | Write incremental migration |

### If You Are THINKING About Resetting

**STOP IMMEDIATELY.** Tell the user:

> "I was about to run [command] which would destroy all database data. Instead, I recommend [specific safe alternative]. Do you want me to proceed with the safe alternative, or do you have a specific reason to reset the database?"

### Executing SQL Safely

To run targeted SQL without destroying data:

```bash
# Execute a single SQL statement
docker exec supabase_db_EnhancedHR psql -U postgres -d postgres -c "YOUR SQL HERE"

# Execute a migration file
cat path/to/migration.sql | docker exec -i supabase_db_EnhancedHR psql -U postgres -d postgres
```

---

## Other Critical Rules

For complete agent protocols, see:
- `AGENTS.md` - Full agent protocol documentation
- `.claude/agents/AGENT_PROTOCOL.md` - Multi-agent coordination rules

---

## Quick Reference: This Project

- **Stack**: Next.js (App Router), Supabase, Tailwind CSS
- **Local Supabase**: Running via Docker, data persists in Docker volumes
- **Database**: PostgreSQL via Supabase at `127.0.0.1:54322`
- **Admin Client**: Use `createAdminClient()` to bypass RLS when needed (with proper auth checks)
