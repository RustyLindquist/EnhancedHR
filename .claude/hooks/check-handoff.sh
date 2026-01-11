#!/bin/bash
# Check if handoff note exists for current session
# This hook runs when the session is stopping

HANDOFF_FILE=".context/handoff.md"

# Check if handoff file was updated recently (within last hour)
if [ -f "$HANDOFF_FILE" ]; then
  # Get file modification time
  FILE_AGE=$(( $(date +%s) - $(stat -c %Y "$HANDOFF_FILE" 2>/dev/null || echo 0) ))

  if [ $FILE_AGE -lt 3600 ]; then
    # Handoff was written recently, all good
    echo "✅ Handoff note is current. Session can end safely."
    exit 0
  fi
fi

# Handoff not written or stale
echo "⚠️ REMINDER: Run /handoff before ending session to preserve context for next session."
echo ""
echo "Your handoff note should include:"
echo "  - Summary of work completed"
echo "  - Files changed"
echo "  - Verification steps for next session"
echo "  - Any remaining tasks"
