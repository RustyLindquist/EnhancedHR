#!/bin/bash
# Block destructive database commands
# This hook runs before any Bash command and blocks dangerous operations

# Read command from stdin (Claude Code passes tool input via stdin)
COMMAND=$(cat)

# Define forbidden patterns (case-insensitive matching)
FORBIDDEN_PATTERNS=(
  "supabase db reset"
  "supabase db push"
  "DROP TABLE"
  "DROP DATABASE"
  "TRUNCATE TABLE"
  "TRUNCATE "
  "docker volume rm.*supabase"
  "docker-compose down -v"
)

# Check each pattern
for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qi "$pattern"; then
    # Log the blocked command
    echo "[$(date -Iseconds)] BLOCKED: $COMMAND" >> .context/blocked-commands.log 2>/dev/null

    # Return deny decision with helpful message
    cat << 'EOF'
{
  "decision": "deny",
  "message": "⛔ BLOCKED: This command would destroy data.\n\nThe command you tried to run matches a forbidden pattern that could cause data loss.\n\nSafe alternatives:\n- For RLS issues: Use targeted SQL via docker exec\n- For permission issues: Use createAdminClient()\n- For schema issues: Create an incremental migration\n- For data issues: Use UPDATE/DELETE with WHERE clause\n\nIf you believe this is a false positive, ask the user to run the command manually."
}
EOF
    exit 0
  fi
done

# Command is safe, allow it
echo '{"decision": "allow"}'
