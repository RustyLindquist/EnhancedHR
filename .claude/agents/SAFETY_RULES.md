# Safety Rules (Shared)

<!-- Version: 1.0.0 | Last Updated: 2026-01-07 -->

**This file is automatically included for all agents. Do NOT duplicate these rules in agent prompts.**

---

## Absolutely Forbidden Commands

You MUST **NEVER** execute these commands under ANY circumstances:

| Command | Why It's Forbidden |
|---------|-------------------|
| `supabase db reset` | **DESTROYS ENTIRE LOCAL DATABASE** — all users, groups, courses, configurations |
| `supabase db push` (destructive) | Can drop tables/columns unexpectedly |
| `DROP TABLE` / `DROP DATABASE` / `TRUNCATE` | Direct data destruction |
| `docker volume rm` (supabase volumes) | Destroys database storage |

---

## Historical Context

On 2026-01-05 and 2026-01-06, agents ran `supabase db reset` multiple times while attempting to fix issues. Each time destroyed the entire database. **The actual fixes required only single SQL statements.**

Every destructive database operation so far has had a simple, non-destructive alternative.

---

## If You're Tempted to Run These

**STOP.** Ask yourself:

1. Can this be solved with a targeted SQL statement? → Do that
2. Can this be solved with a migration file? → Do that
3. Can this be solved with a code change? → Do that
4. Can this be solved with `createAdminClient()`? → Do that
5. Is there ANY alternative that preserves data? → Use it

If none of the above work, **TELL THE USER** and let them decide:

> "I was considering running [command] which would destroy all database data. The safer approach is [alternative]. Should I proceed with the safe alternative, or would you like to approve the destructive operation?"

---

## Safe Alternatives Reference

| Problem | WRONG Approach | RIGHT Approach |
|---------|---------------|----------------|
| RLS policy blocking access | `supabase db reset` | Execute targeted SQL via `docker exec` |
| Permission denied errors | Reset database | Use `createAdminClient()` in code |
| Need to apply migration | Reset and restart | `supabase migration up` or direct SQL |
| Schema out of sync | Delete volumes | Create incremental migration |
| Need to fix data | TRUNCATE table | UPDATE or DELETE with WHERE clause |
| Need fresh test data | Reset database | Create seed script that doesn't destroy |

---

## Executing SQL Safely

When you need to run SQL directly:

```bash
# Connect to local database
docker exec -it supabase_db_san-jose psql -U postgres

# Or run a single command
docker exec -it supabase_db_san-jose psql -U postgres -c "YOUR SQL HERE"
```

Always:
- Use WHERE clauses on UPDATE/DELETE
- Test SELECT first before UPDATE/DELETE
- Create backups of important data before modifications
- Prefer INSERT/UPDATE over DELETE when possible

---

## GitHub Submission Rules

Agents MUST NOT autonomously:
- Push commits
- Open pull requests
- Merge branches
- Tag releases
- Change GitHub settings

Agents MAY:
- Create local commits
- Prepare branch names
- Draft PR titles/descriptions
- Provide exact commands for the human to run

**Exception**: If the user explicitly asks for a push/PR/merge, the agent may proceed.

---

## High-Risk Change Discipline

Any change touching these areas requires the full 2-gate flow with Doc Agent validation:

- Supabase schema / migrations
- RLS policies or permission logic
- Auth/session handling
- `createAdminClient()` or service-role access paths
- Stripe billing or entitlements/credits
- AI context assembly / embeddings / prompt orchestration

---

## Sub-Agent Safety Injection

When spawning ANY sub-agent via Task tool, the spawning agent MUST include this safety preamble in the prompt:

```
⛔ CRITICAL SAFETY RULE ⛔
NEVER run these commands — they DESTROY ALL DATA:
- supabase db reset
- DROP TABLE / DROP DATABASE / TRUNCATE
- docker volume rm (supabase volumes)

If blocked by a database issue, use targeted SQL or createAdminClient().
NEVER reset the database. There is ALWAYS a non-destructive alternative.
If you're tempted to reset, STOP and tell the user first.
```

This is mandatory because sub-agents don't automatically see CLAUDE.md or these safety rules.

---

## Sensitive Data Protection

**NEVER output these in responses, logs, or files:**

| Data Type | Examples | How to Reference |
|-----------|----------|------------------|
| API Keys | `sk-...`, `pk_live_...` | "the API key in .env" |
| Passwords | User passwords, DB passwords | "the password from config" |
| Tokens | Session tokens, JWTs | "the auth token" |
| PII | SSN, full credit cards | Mask: `***-**-1234` |
| Secrets | Webhook secrets, signing keys | "the secret in .env.local" |

**If you encounter sensitive data:**
1. **Mask it**: `sk-...XXXX` (show only last 4 chars)
2. **Reference it**: "the value stored in .env"
3. **Never echo**: Don't repeat the full value back

**In error messages:**
- BAD: "Invalid API key: sk-abc123def456..."
- GOOD: "Invalid API key (check .env for correct value)"

---

## Automated Safety Enforcement

The following hooks provide automated protection:

| Hook | Purpose | Location |
|------|---------|----------|
| `block-destructive.sh` | Blocks dangerous Bash commands | PreToolUse |
| `inject-safety.sh` | Injects safety rules into subagents | PreToolUse (Task) |
| `track-context.sh` | Monitors session length | PostToolUse |
| `check-handoff.sh` | Reminds about handoff | Stop |

These hooks are configured in `.claude/settings.local.json`.

