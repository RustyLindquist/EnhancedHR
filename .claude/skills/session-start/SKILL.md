---
name: session-start
description: Resume work from a previous session using handoff notes, checkpoints, or compact state. Use at the beginning of a new session to restore context and continuity.
allowed-tools: Read, Glob
---

# Session Start Skill

## Purpose
Restore context from a previous session to enable seamless continuation. Prevents the "starting from scratch" problem and maintains work continuity across sessions.

## When to Use
- Beginning a new session after a previous handoff
- Resuming after a break
- Recovering from a crash or timeout
- Starting work on an in-progress task
- User says "continue where we left off"

## Recovery Sources

```
┌─────────────────────────────────────────────────────────────┐
│                    RECOVERY PRIORITY                         │
│                                                              │
│   1. HANDOFF NOTE (highest priority)                         │
│      └─► .context/handoff.md                                 │
│      └─► Complete session summary with next steps            │
│                                                              │
│   2. CHECKPOINTS (specific point-in-time)                    │
│      └─► .context/checkpoints/checkpoint-*.md                │
│      └─► Mid-session saves, granular recovery                │
│                                                              │
│   3. COMPACT STATE (post-compaction)                         │
│      └─► .context/compact-state.md                           │
│      └─► Minimal essential state after context clear         │
│                                                              │
│   4. AGENT REGISTRY (coordination state)                     │
│      └─► .context/agents/active.yaml                         │
│      └─► What agents were active, what they were doing       │
│                                                              │
│   5. OPTIMIZATION LOG (system learning)                      │
│      └─► .context/optimizations/pending.yaml                 │
│      └─► Captured improvements to review                     │
└─────────────────────────────────────────────────────────────┘
```

## Session Start Process

### Step 1: Locate Recovery Sources

```bash
# Check for handoff
ls -la .context/handoff.md

# Check for checkpoints
ls -la .context/checkpoints/

# Check for compact state
ls -la .context/compact-state.md

# Check agent registry
ls -la .context/agents/active.yaml
```

### Step 2: Load Primary Source

**If handoff.md exists (preferred):**
```
Read: .context/handoff.md
Extract:
- Session objective
- Current task status
- Next steps
- Remaining work
- Known issues
```

**If checkpoint requested:**
```
Read: .context/checkpoints/checkpoint-[specified].md
Extract:
- Position in workflow
- Work completed
- Files changed
- Agent status
```

**If compact-state.md exists:**
```
Read: .context/compact-state.md
Extract:
- Minimal essential state
- Current task
- Critical context
```

### Step 3: Verify Current State

Before proceeding, verify the codebase matches expected state:

```markdown
## State Verification

### Files Expected Modified
| File | Expected State | Actual | Match |
|------|---------------|--------|-------|
| [path] | [state from handoff] | [current] | ✓/✗ |

### Database State
- [ ] Migrations applied as expected
- [ ] Data state consistent

### Environment
- [ ] Dev server running
- [ ] Supabase local running
- [ ] Expected branch checked out
```

### Step 4: Load Relevant Documentation

Based on the task context, load necessary docs:

```
If task touches features:
  → Run /doc-discovery or spawn Doc Agent

If task involves UI:
  → Load STYLE_GUIDE.md, COMPONENT_INDEX.md

If task involves backend:
  → Load relevant feature docs, RLS patterns
```

### Step 5: Refresh Core Instructions

Ensure critical behaviors are active:

```
MANDATORY REFRESH:
□ Safety rules (no destructive DB commands)
□ Orchestration mode (delegate to agents)
□ Tool awareness (Supabase CLI, Chrome extension)
□ Context management (spawn subagents, return summaries)
```

### Step 6: Report Readiness

```markdown
## Session Started ✓

### Recovered From
**Source**: [handoff/checkpoint/compact-state]
**Timestamp**: [when source was created]

### Session Context

#### Objective
[Overall goal from previous session]

#### Current Task
**What**: [task name/description]
**Status**: [where we are]
**Next step**: [immediate action]

#### Work Previously Completed
- [Completed item 1]
- [Completed item 2]

#### Remaining Work
- [ ] [Remaining item 1]
- [ ] [Remaining item 2]

#### Known Issues
- [Issue 1]: [status]
- [Issue 2]: [status]

### State Verification
- [x] Files match expected state
- [x] Environment ready
- [x] Core instructions refreshed

### Documentation Loaded
- [doc 1]
- [doc 2]

### Ready to Continue
[Specific statement about what to do next]

---
**Proceed?** [Ready for next instruction or can auto-continue]
```

## Quick Start (No Handoff)

If no handoff/checkpoint exists:

```markdown
## Fresh Session Start

No previous session state found.

### Available Context
- CLAUDE.md loaded
- Core instructions active
- Tools available

### To Begin
Please describe what you'd like to work on, or specify:
- A previous task to continue
- A new task to start
- A specific checkpoint to recover from

### If Previous Work Exists
Check `.context/` directory for any state files:
- handoff.md
- checkpoints/
- compact-state.md
```

## Checkpoint-Specific Start

If user specifies a checkpoint:

```
/session-start --checkpoint 2025-01-07-14-30
```

Process:
1. Load `.context/checkpoints/checkpoint-2025-01-07-14-30.md`
2. Report checkpoint contents
3. Verify state matches
4. Resume from checkpoint position

## Handling State Mismatches

If current state doesn't match expected:

```markdown
## ⚠️ State Mismatch Detected

### Expected (from handoff)
- [expected state]

### Actual
- [current state]

### Discrepancies
| Item | Expected | Actual | Impact |
|------|----------|--------|--------|
| [item] | [expected] | [actual] | [impact] |

### Options
1. **Proceed anyway**: Accept current state as new baseline
2. **Investigate**: Figure out what changed
3. **Rollback**: Attempt to restore expected state

### Recommendation
[Based on discrepancy severity]
```

## Multi-Session Project Continuity

For projects spanning many sessions:

```markdown
## Project Continuity

### Project
[Project name/description]

### Session History
| Date | Focus | Outcome | Handoff |
|------|-------|---------|---------|
| [date] | [what] | [result] | [file] |

### Current Phase
[Where in overall project]

### Major Milestones
- [x] [Milestone 1]
- [x] [Milestone 2]
- [ ] [Milestone 3] ← Current
- [ ] [Milestone 4]
```

## Integration Points

### With /handoff
Session-start consumes what handoff produces.

### With /checkpoint
Can recover from specific checkpoints.

### With /compact
Can resume from compact-state after context was cleared.

### With Doc Agent
May spawn Doc Agent to load feature context based on task.

## Output Format

```markdown
## 🚀 Session Started

### Recovery Summary
| Source | Found | Used |
|--------|-------|------|
| Handoff | [yes/no] | [yes/no] |
| Checkpoint | [yes/no] | [yes/no] |
| Compact State | [yes/no] | [yes/no] |
| Agent Registry | [yes/no] | [yes/no] |

### Context Restored
- **Objective**: [goal]
- **Task**: [current task]
- **Position**: [where in workflow]

### Verification
- [x] State matches expected
- [x] Environment ready
- [x] Instructions refreshed

### Next Action
[Specific next step, ready to execute]

---
Session ready. Awaiting instruction or auto-continuing with: [next step]
```

## Anti-Patterns

❌ **Don't skip state verification**
Proceeding with mismatched state causes confusion.

❌ **Don't ignore handoff notes**
They exist for a reason; use them.

❌ **Don't start fresh when recovery exists**
Wastes previous context work.

❌ **Don't forget to refresh core instructions**
Critical behaviors must be active.

❌ **Don't auto-continue without confirmation on complex tasks**
Get user acknowledgment before major work.
