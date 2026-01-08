---
name: checkpoint
description: Save mid-session state for recovery without clearing context. Use after major milestones, before risky operations, or periodically during long sessions.
allowed-tools: Read, Write
---

# Checkpoint Skill

## Purpose
Save session state at key points to enable recovery without losing progress. Unlike /compact (which clears context), checkpoint preserves everything while creating a restore point.

## When to Use
- After completing a significant piece of work
- Before attempting something risky
- Every 30-45 minutes in long sessions
- Before spawning multiple parallel agents
- When user takes a break
- Before any destructive-ish operation (even safe ones)

## Checkpoint vs Compact vs Handoff

| Skill | When | Context | Recoverable |
|-------|------|---------|-------------|
| **/checkpoint** | Mid-session milestone | Preserved | Yes, continue session |
| **/compact** | Context saturated | Cleared | Yes, but context reset |
| **/handoff** | Session ending | N/A | Yes, new session |

## What Gets Checkpointed

```
┌─────────────────────────────────────────────────────────────┐
│                    CHECKPOINT CONTENTS                       │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ SESSION STATE                                          │  │
│  │ - Current objective                                    │  │
│  │ - Task in progress                                     │  │
│  │ - Position in workflow                                 │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ WORK COMPLETED                                         │  │
│  │ - Tasks finished                                       │  │
│  │ - Files changed                                        │  │
│  │ - Decisions made                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ AGENT STATUS                                           │  │
│  │ - Active agents                                        │  │
│  │ - Pending results                                      │  │
│  │ - Coordination state                                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ CONTEXT SNAPSHOT                                       │  │
│  │ - Docs currently loaded                                │  │
│  │ - Files in working memory                              │  │
│  │ - Key facts established                                │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Checkpoint Process

### Step 1: Identify Checkpoint Type

| Type | Trigger | Depth |
|------|---------|-------|
| **Milestone** | Major work completed | Full checkpoint |
| **Periodic** | Time-based (30-45 min) | Standard checkpoint |
| **Pre-risk** | About to try something uncertain | Full + rollback plan |
| **Quick** | User stepping away briefly | Minimal checkpoint |

### Step 2: Write Checkpoint File

Write to `.context/checkpoints/checkpoint-[timestamp].md`:

```markdown
# Checkpoint: [timestamp]

**Type**: [milestone/periodic/pre-risk/quick]
**Trigger**: [what prompted this checkpoint]

## Session Objective
[Overall goal of this session]

## Current Position

### Task In Progress
- **What**: [current task]
- **Status**: [where in the task]
- **Next step**: [immediate next action]

### Workflow Position
```
[workflow name]
Step 1: ✓ Complete
Step 2: ✓ Complete
Step 3: ◄── CURRENT
Step 4: Pending
```

## Work Completed Since Last Checkpoint

### Tasks Finished
- [Task 1]: [outcome]
- [Task 2]: [outcome]

### Files Changed
| File | Change | Verified |
|------|--------|----------|
| [path] | [what] | [yes/no] |

### Decisions Made
- [Decision]: [choice] because [reason]

## Agent Status

### Active Agents
| Agent | Task | Status | ETA |
|-------|------|--------|-----|
| [type] | [doing] | [state] | [when] |

### Pending Results
- [Agent]: Waiting for [what]

## Context Snapshot

### Docs Loaded
- `docs/features/[name].md`
- `docs/workflows/[name].md`

### Key Facts Established
- [Fact 1]: [source]
- [Fact 2]: [source]

### Working Assumptions
- [Assumption 1]
- [Assumption 2]

## Recovery Instructions

### To Resume From This Checkpoint
1. Read this checkpoint file
2. Verify current file states match "Files Changed"
3. Continue from "Next step" in Current Position
4. Re-spawn any active agents if needed

### If Something Went Wrong
1. [Rollback instruction if applicable]
2. [Recovery step]
3. [Alternative approach]

## Notes
[Any other context that would help recovery]
```

### Step 3: Update Checkpoint Index

Append to `.context/checkpoints/INDEX.md`:

```markdown
| Timestamp | Type | Position | Key Event |
|-----------|------|----------|-----------|
| [time] | [type] | [task/step] | [what happened] |
```

### Step 4: Confirm to User

```markdown
## ✓ Checkpoint Saved

**File**: `.context/checkpoints/checkpoint-[timestamp].md`
**Type**: [type]

### Captured
- Current task: [name]
- Position: [where]
- Files changed: [count]
- Active agents: [count]

### Recovery
If needed, run `/session-start` and specify this checkpoint.

### Continuing...
[proceed with current work]
```

## Quick Checkpoint (Minimal)

For rapid saves:

```markdown
# Quick Checkpoint - [timestamp]

**Task**: [current task]
**Position**: [where]
**Next**: [next action]
**Files**: [changed files]
**Agents**: [active agents]
```

Write to `.context/checkpoints/quick-[timestamp].md`

## Pre-Risk Checkpoint

Before risky operations, add:

```markdown
## Risk Context

### Operation About to Attempt
[what we're about to try]

### Why It's Risky
[potential issues]

### Rollback Plan
If this fails:
1. [rollback step 1]
2. [rollback step 2]
3. [recovery step]

### Point of No Return
[what would make rollback impossible]

### Abort Criteria
Stop if:
- [condition 1]
- [condition 2]
```

## Checkpoint Frequency Guidelines

| Session Activity | Recommended Frequency |
|-----------------|----------------------|
| Routine work | Every 45 minutes |
| Complex multi-step | After each major step |
| Multiple agents | Before spawning, after collecting |
| Risky operations | Before AND after |
| User breaks | When user steps away |

## Recovery from Checkpoint

If session is interrupted or context degrades:

```
/session-start --checkpoint [timestamp]
```

This will:
1. Load the specified checkpoint
2. Verify file states
3. Report current position
4. Be ready to continue

## Checkpoint Cleanup

Old checkpoints can be pruned:

```markdown
## Checkpoint Retention

Keep:
- Last 3 checkpoints
- Any checkpoint marked "milestone"
- Today's checkpoints

Delete:
- Checkpoints older than 24 hours (unless milestone)
- Quick checkpoints after session ends
- Pre-risk checkpoints if operation succeeded
```

## Integration Points

### With /context-status
If context is high, checkpoint before considering compact.

### With /compact
Checkpoint preserves; compact clears. Checkpoint first, then compact if needed.

### With /handoff
Handoff is final; checkpoint is mid-session. Different purposes.

### With agent spawning
Checkpoint before spawning multiple agents to capture pre-spawn state.

## Anti-Patterns

❌ **Don't checkpoint too frequently**
Every 5 minutes is overhead. Every 30-45 minutes is good.

❌ **Don't skip checkpoint before risky operations**
The one time you skip is when you'll need it.

❌ **Don't write incomplete checkpoints**
A checkpoint that can't be recovered from is useless.

❌ **Don't forget to continue after checkpointing**
Checkpoint is a save point, not a stopping point.
