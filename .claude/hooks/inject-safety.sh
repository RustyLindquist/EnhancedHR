#!/bin/bash
# Inject safety rules into subagent prompts
# This hook runs before Task tool calls to ensure subagents see safety rules

# Output the safety preamble that should be prepended to subagent prompts
cat << 'EOF'
⛔ CRITICAL SAFETY RULES ⛔

You are a subagent. These rules are ABSOLUTE and NON-NEGOTIABLE:

1. NEVER run these commands — they DESTROY ALL DATA:
   - supabase db reset
   - DROP TABLE / DROP DATABASE / TRUNCATE
   - docker volume rm (supabase volumes)
   - supabase db push (with destructive changes)

2. If blocked by a database issue:
   - Use targeted SQL via: docker exec -i supabase_db_enhancedhr psql -U postgres -c "..."
   - Use createAdminClient() for permission issues
   - Create incremental migrations for schema changes

3. NEVER reset the database. There is ALWAYS a non-destructive alternative.

4. If you're tempted to run a destructive command, STOP and return to the main agent with:
   "I need user approval for a potentially destructive operation: [describe operation]"

5. Do NOT output sensitive data (API keys, passwords, PII) in your responses.

---

EOF
