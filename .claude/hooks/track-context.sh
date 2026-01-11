#!/bin/bash
# Track operations and suggest context health check
# This hook runs after tool operations to monitor session length

COUNTER_FILE="/tmp/claude-session-op-count-$$"
THRESHOLD=50
CHECKPOINT_THRESHOLD=30

# Initialize or increment counter
if [ -f "$COUNTER_FILE" ]; then
  COUNT=$(cat "$COUNTER_FILE")
else
  COUNT=0
fi

COUNT=$((COUNT + 1))
echo $COUNT > "$COUNTER_FILE"

# Check thresholds
if [ $COUNT -eq $CHECKPOINT_THRESHOLD ]; then
  echo "📌 $COUNT operations this session. Consider /checkpoint to save progress."
elif [ $COUNT -eq $THRESHOLD ]; then
  echo "⚠️ $COUNT operations this session. Run /context-status to check context health."
elif [ $COUNT -eq $((THRESHOLD + 20)) ]; then
  echo "🔴 $COUNT operations. Context may be degraded. Consider /compact or /remember."
  # Reset counter after critical warning
  echo 0 > "$COUNTER_FILE"
fi
