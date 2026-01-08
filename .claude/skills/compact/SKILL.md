---
name: compact
description: Compress context for long sessions by writing state to disk and clearing working memory. Use when context is high/critical or before complex multi-step work.
allowed-tools: Read, Write
---

# Compact Skill

## Purpose
Preserve critical state while freeing context capacity. Compaction writes important information to disk, allowing the session to continue with renewed capacity while maintaining continuity.

## When to Use
- Context status shows 🟠 High or 🔴 Critical
- Session has been running > 60 minutes
- About to start complex multi-step work
- Noticing degraded responses or forgotten instructions
- User mentions "context seems full"

## What Compaction Does

```
BEFORE COMPACT:
┌─────────────────────────────────────────┐
│ Context Window                          │
│ ┌─────────────────────────────────────┐ │
│ │ System prompt      [████████░░] 20% │ │
│ │ CLAUDE.md          [██████░░░░] 15% │ │
│ │ Conversation       [████████████] 35%│ │
│ │ Loaded files       [██████████░] 25% │ │
│ │ Working memory     [████░░░░░░]  5% │ │
│ └─────────────────────────────────────┘ │
│ TOTAL: ~100% (saturated)                │
└─────────────────────────────────────────┘

AFTER COMPACT:
┌─────────────────────────────────────────┐
│ Context Window                          │
│ ┌─────────────────────────────────────┐ │
│ │ System prompt      [████████░░] 20% │ │
│ │ CLAUDE.md          [██████░░░░] 15% │ │
│ │ Compact summary    [████░░░░░░] 10% │ │
│ │ Working memory     [██░░░░░░░░]  5% │ │
│ │ FREE CAPACITY      [░░░░░░░░░░] 50% │ │
│ └─────────────────────────────────────┘ │
│ TOTAL: ~50% (healthy)                   │
└─────────────────────────────────────────┘
```

## Compaction Process

### Step 1: Capture Critical State

Write to `.context/compact-state.md`:

```markdown
# Compact State - [timestamp]

## Session Objective
[What is the user trying to accomplish overall]

## Current Task
[What are we working on right now]

## Completed Work
- [Task 1]: [status/outcome]
- [Task 2]: [status/outcome]

## Key Decisions Made
- [Decision 1]: [choice and rationale]
- [Decision 2]: [choice and rationale]

## Active Files
| File | Purpose | Key Info |
|------|---------|----------|
| [path] | [why loaded] | [critical details] |

## Agent Status
| Agent | Purpose | Status | Key Output |
|-------|---------|--------|------------|
| [type] | [task] | [state] | [summary] |

## Critical Context
[Any other information that MUST be preserved]

## User Preferences Expressed
- [Preference 1]
- [Preference 2]

## Next Steps
1. [Immediate next action]
2. [Following action]
3. [After that]
```

### Step 2: Refresh Core Instructions

Re-read critical instructions to ensure they're in active memory:

```
MANDATORY RE-LOAD:
1. Safety rules (Section 2 of CLAUDE.md)
2. Orchestration behaviors (You are an ORCHESTRATOR)
3. Tool awareness (Supabase CLI, Chrome extension)
4. Agent spawn criteria
```

### Step 3: Acknowledge Compaction

Report to user:

```markdown
## Context Compacted ✓

**State saved to**: `.context/compact-state.md`

### Preserved
- Session objective
- Current task status
- Key decisions
- Critical context

### Cleared
- Detailed conversation history
- Raw file contents
- Exploratory work

### Restored
- Safety rules
- Orchestration behaviors
- Tool awareness

### Ready to Continue
Context capacity restored. Proceeding with: [current task]
```

## What to Preserve (Always)

| Category | Why Critical |
|----------|--------------|
| Session objective | Must remember overall goal |
| Current task | Must know what we're doing |
| Completed work | Avoid redoing work |
| Key decisions | Maintain consistency |
| Blockers/issues | Don't forget problems |
| User preferences | Respect expressed wishes |
| Next steps | Maintain momentum |

## What to Clear (Safe to Forget)

| Category | Why Safe |
|----------|----------|
| Exploration that didn't pan out | No longer relevant |
| Verbose explanations | Can regenerate if needed |
| Raw file contents | Can re-read from disk |
| Detailed agent outputs | Summary sufficient |
| Conversation preamble | Context established |

## Critical Instruction Refresh

After compaction, these MUST be in active memory:

### Safety Rules
```
⛔ NEVER: supabase db reset, DROP TABLE, TRUNCATE
✓ ALWAYS: Use targeted SQL, migrations, code changes
```

### Orchestration Mode
```
You are the ORCHESTRATOR, not the implementer.
DELEGATE to: frontend-agent, backend-agent, research-agent, test-agent
```

### Tool Awareness
```
AVAILABLE:
- Supabase CLI: For database queries and schema inspection
- Chrome Extension: For browser testing and UI verification
- Agent spawning: For delegating implementation work
```

### Context Management
```
ALWAYS spawn subagents for implementation work
RETURN summaries, not raw content
LOAD docs lazily through Doc Agent
```

## Output Template

```markdown
## 🔄 Context Compacted

### Session State Saved
**File**: `.context/compact-state.md`
**Timestamp**: [time]

### Summary of Session
[2-3 sentences covering what's been accomplished]

### Current Task
**Objective**: [what we're doing]
**Status**: [where we are]
**Next**: [immediate next step]

### Critical Context Preserved
- [Key item 1]
- [Key item 2]
- [Key item 3]

### Instructions Refreshed
- ✓ Safety rules active
- ✓ Orchestration mode active
- ✓ Tool awareness active

### Context Status
**Before**: 🔴 Critical (~90%)
**After**: 🟢 Low (~40%)

### Ready to Continue
[Statement about proceeding with current task]
```

## Emergency Compact

If context is critically saturated and behavior is degraded:

```markdown
# EMERGENCY COMPACT

## Absolute Essentials Only

**Task**: [one sentence]
**Next action**: [one action]
**Blocker**: [if any]

## Must Remember
1. No destructive DB commands
2. Spawn agents for work
3. Use tools: Supabase CLI, Chrome extension

## State File
.context/compact-state.md

---
Context emergency-cleared. Core function restored.
```

## Post-Compact Verification

After compaction, verify:

- [ ] Can state the current task clearly
- [ ] Remember safety rules
- [ ] Know to spawn agents for implementation
- [ ] Aware of available tools
- [ ] Know where state file is saved

If any are unclear → re-read `.context/compact-state.md` and this skill.

## Integration Points

### With /checkpoint
Checkpoint saves state periodically; compact does the same but more aggressively clears context.

### With /handoff
Compact is for continuing; handoff is for ending session completely.

### With /context-status
Run context-status first to determine if compact is needed.

### With /session-start
After compact, if session continues significantly, session-start can reload the compact state.

## Anti-Patterns

❌ **Don't compact without saving state first**
Losing critical context defeats the purpose.

❌ **Don't compact too frequently**
Overhead of save/restore; let context build when healthy.

❌ **Don't skip instruction refresh**
The whole point is to restore core behaviors.

❌ **Don't continue without verifying restoration**
Confirm critical knowledge is active before proceeding.
