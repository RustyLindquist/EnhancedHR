# Mitigation Plan

## Overview

This document proposes mitigations for failure points identified in `FAILURE_ANALYSIS.md`. Mitigations are prioritized by risk score and implementation effort.

---

## Mitigation Categories

1. **Technical Controls** - Automated enforcement via hooks, scripts, validation
2. **Process Controls** - Workflow changes, checklists, gates
3. **Documentation Controls** - Clearer guidance, templates, examples
4. **Monitoring Controls** - Detection, alerting, tracking

---

## Priority 1 Mitigations (Critical Risk)

### M1: Automatic Safety Injection for Subagents

**Addresses**: F4.2 (Safety Rules Not Loaded), F1.3 (No Safety Injection)

**Problem**: Subagents spawned via Task tool don't automatically see SAFETY_RULES.md

**Solution**: Create a PreToolUse hook that automatically injects safety rules into Task tool prompts

**Implementation**:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Task",
        "hooks": [{
          "type": "command",
          "command": ".claude/hooks/inject-safety.sh"
        }]
      }
    ]
  }
}
```

**Script** (`.claude/hooks/inject-safety.sh`):
```bash
#!/bin/bash
# Injects safety preamble into Task tool prompts
# Returns modified input with safety rules prepended

SAFETY_PREAMBLE="⛔ CRITICAL SAFETY RULE ⛔
NEVER run these commands — they DESTROY ALL DATA:
- supabase db reset
- DROP TABLE / DROP DATABASE / TRUNCATE
- docker volume rm (supabase volumes)
If blocked by database issue, use targeted SQL or createAdminClient().
NEVER reset the database. ALWAYS ask the user first."

# Echo the preamble (hook can prepend to prompt)
echo "$SAFETY_PREAMBLE"
```

**Effort**: Small
**Risk Reduction**: High

---

### M2: Destructive Command Detection Hook

**Addresses**: F4.1 (Destructive Command Executed)

**Problem**: No technical prevention of destructive commands

**Solution**: PreToolUse hook that detects and blocks destructive commands

**Implementation**:
```json
{
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": ".claude/hooks/block-destructive.sh"
      }]
    }
  ]
}
```

**Script** (`.claude/hooks/block-destructive.sh`):
```bash
#!/bin/bash
# Block destructive database commands

COMMAND="$1"

FORBIDDEN_PATTERNS=(
  "supabase db reset"
  "supabase db push"
  "DROP TABLE"
  "DROP DATABASE"
  "TRUNCATE"
  "docker volume rm.*supabase"
)

for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qi "$pattern"; then
    echo '{"decision": "deny", "message": "BLOCKED: This command would destroy data. Use targeted SQL instead."}'
    exit 0
  fi
done

echo '{"decision": "allow"}'
```

**Effort**: Small
**Risk Reduction**: Critical

---

### M3: Mandatory Session Start/End Hooks

**Addresses**: F3.1 (Handoff Not Written), F3.4 (Session Start Skips Recovery)

**Problem**: Session start/end procedures not enforced

**Solution**:
1. SessionStart hook that prompts for `/session-start`
2. Stop hook that blocks until `/handoff` completed

**Implementation**:
```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "*",
        "hooks": [{
          "type": "command",
          "command": ".claude/hooks/check-session-start.sh"
        }]
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [{
          "type": "command",
          "command": ".claude/hooks/check-handoff.sh"
        }]
      }
    ]
  }
}
```

**Effort**: Medium
**Risk Reduction**: High

---

### M4: Automatic Context Health Monitoring

**Addresses**: F1.4 (Context Degradation Undetected)

**Problem**: Context degradation only detected when user notices

**Solution**: Periodic context check injected via hook

**Implementation**: PostToolUse hook that tracks tool count and suggests `/context-status` after N operations

**Script** (`.claude/hooks/track-context.sh`):
```bash
#!/bin/bash
# Track operations and suggest context check

COUNTER_FILE="/tmp/claude-op-count"
THRESHOLD=50

if [ -f "$COUNTER_FILE" ]; then
  COUNT=$(cat "$COUNTER_FILE")
else
  COUNT=0
fi

COUNT=$((COUNT + 1))
echo $COUNT > "$COUNTER_FILE"

if [ $COUNT -ge $THRESHOLD ]; then
  echo "⚠️ $COUNT operations this session. Consider running /context-status"
  echo 0 > "$COUNTER_FILE"
fi
```

**Effort**: Small
**Risk Reduction**: Medium

---

## Priority 2 Mitigations (High Risk)

### M5: Gate Enforcement via Skill Chaining

**Addresses**: F6.1 (Gate 1 Skipped), F6.2 (Gate 2 Skipped)

**Problem**: Gates can be bypassed

**Solution**: Create a `/gate-check` skill that validates gates were executed

**Implementation**:
- Track gate execution in `.context/session-gates.yaml`
- Before implementation, check Gate 1 completed
- Before completion, check Gate 2 completed

**Gate Tracking**:
```yaml
# .context/session-gates.yaml
session_id: "2026-01-10-001"
gate1:
  doc_discovery: false
  plan_lint: false
  completed: false
gate2:
  test_from_docs: false
  doc_update: false
  drift_check: false
  completed: false
```

**Effort**: Medium
**Risk Reduction**: High

---

### M6: File Lock for Parallel Agents

**Addresses**: F2.3 (Agent Coordination Breakdown), F7.2 (Parallel Agent Conflict)

**Problem**: Parallel agents can modify same files

**Solution**: Simple file-based locking mechanism

**Implementation**:
- Before Edit/Write, check lock file
- If locked by another agent, wait or error
- Release lock after operation

**Lock Convention**:
```
.context/locks/
├── src_components_Button.lock  # Format: path with _ replacing /
└── src_app_actions_user.lock
```

**Effort**: Medium
**Risk Reduction**: Medium

---

### M7: Invariant Registry

**Addresses**: F5.4 (Invariants Not Documented)

**Problem**: Critical rules not captured in docs

**Solution**: Create an INVARIANTS.md that aggregates all invariants

**Implementation**:
- Central registry of all known invariants
- Each feature doc references relevant invariants
- `/plan-lint` validates against registry

**Format**:
```markdown
# Invariants Registry

## Authentication
- INV-AUTH-001: All server actions must verify user via getUser()
- INV-AUTH-002: Session tokens expire after 24h

## Data Access
- INV-RLS-001: Users can only access own data
- INV-RLS-002: Org admins can access org-scoped data
```

**Effort**: Medium
**Risk Reduction**: High

---

### M8: Orchestrator Self-Check

**Addresses**: F1.2 (No Agent When Needed)

**Problem**: Orchestrator does implementation work directly

**Solution**: Add self-check to `/remember` that validates delegation

**Implementation**: Update `/remember` skill to include:
```markdown
## Delegation Check

Before any code modification, ask:
1. Is this frontend work? → @frontend-agent
2. Is this backend work? → @backend-agent
3. Am I doing implementation? → STOP, delegate

If you're editing code files, you're probably violating delegation rules.
```

**Effort**: Small
**Risk Reduction**: Medium

---

## Priority 3 Mitigations (Medium Risk)

### M9: Output Schema Validation

**Addresses**: F2.4 (Agent Provides Incomplete Output)

**Problem**: Agent responses may be missing required sections

**Solution**: Define JSON schemas for agent outputs, validate in SubagentStop hook

**Effort**: Large
**Risk Reduction**: Medium

---

### M10: Drift Detection Automation

**Addresses**: F5.1 (Documentation Drift)

**Problem**: Drift check is manual

**Solution**: Git hook that runs drift check on file changes

**Implementation**: Post-commit hook that flags potential drift

**Effort**: Medium
**Risk Reduction**: Medium

---

### M11: Optimization Capture Reminder

**Addresses**: F7.3 (Optimization Not Captured)

**Problem**: Agents forget to capture optimization opportunities

**Solution**: SubagentStop hook that prompts for optimization capture

**Effort**: Small
**Risk Reduction**: Low

---

### M12: Sensitive Data Sanitization

**Addresses**: F4.4 (Sensitive Data in Logs/Output)

**Problem**: No sanitization guidelines

**Solution**: Add sanitization rules to SAFETY_RULES.md

**Content**:
```markdown
## Sensitive Data Rules

NEVER output in responses or logs:
- API keys or secrets
- Passwords or tokens
- Full credit card numbers
- Social Security Numbers
- Personal health information

If you encounter sensitive data:
1. Mask it: `sk-...XXXX`
2. Reference it: "the API key in .env"
3. Never echo the full value
```

**Effort**: Small
**Risk Reduction**: Medium

---

## Implementation Priority Matrix

| ID | Mitigation | Effort | Risk Reduction | Priority |
|----|------------|--------|----------------|----------|
| M2 | Destructive Command Block | Small | Critical | P0 |
| M1 | Safety Injection | Small | High | P0 |
| M3 | Session Hooks | Medium | High | P1 |
| M5 | Gate Enforcement | Medium | High | P1 |
| M7 | Invariant Registry | Medium | High | P1 |
| M4 | Context Monitoring | Small | Medium | P2 |
| M8 | Orchestrator Self-Check | Small | Medium | P2 |
| M12 | Sensitive Data Rules | Small | Medium | P2 |
| M6 | File Locking | Medium | Medium | P3 |
| M10 | Drift Automation | Medium | Medium | P3 |
| M9 | Output Validation | Large | Medium | P3 |
| M11 | Optimization Reminder | Small | Low | P3 |

---

## Implementation Plan

### Phase 1: Critical Safety (Immediate)
1. M2: Create `block-destructive.sh` hook
2. M1: Create `inject-safety.sh` hook
3. M12: Update SAFETY_RULES.md with sensitive data rules

### Phase 2: Session Protection (This Week)
4. M3: Create session start/end hooks
5. M4: Create context monitoring hook
6. M8: Update `/remember` with delegation check

### Phase 3: Process Enforcement (Next Week)
7. M5: Create gate tracking system
8. M7: Create INVARIANTS.md registry
9. M10: Create drift detection automation

### Phase 4: Advanced Controls (Future)
10. M6: Implement file locking
11. M9: Implement output validation
12. M11: Add optimization capture reminder

---

## Success Metrics

After implementation, track:

| Metric | Target | Measurement |
|--------|--------|-------------|
| Destructive commands blocked | 100% | Hook logs |
| Sessions with handoff | >90% | handoff.md presence |
| Gate 1 completion rate | >80% | Gate tracking |
| Context check triggers | <2 per session | Hook logs |
| Documentation drift incidents | <1 per week | Drift check results |

---

## Review Schedule

- **Weekly**: Review hook logs for blocked commands
- **Monthly**: Analyze gate completion rates
- **Quarterly**: Full failure analysis review
