---
name: handoff
description: Write comprehensive handoff note for session end. Captures work done, state, and context for next session. Essential before ending any work session.
allowed-tools: Read, Write, Glob
---

# Handoff Skill

## Purpose
Make work portable across sessions, tools, and workspaces. A good handoff note allows any agent (or human) to pick up exactly where you left off without context loss.

## When to Use
- End of every work session
- Before switching to a different task
- Before the user leaves
- When context is getting full and you need to compact
- When handing off to a different agent or tool

## Handoff Components

```
┌─────────────────────────────────────────────────────────────┐
│                    HANDOFF NOTE STRUCTURE                    │
│                                                              │
│  1. SESSION SUMMARY                                          │
│     └─► What was accomplished this session                   │
│                                                              │
│  2. WORK DETAILS                                             │
│     └─► Files changed, features touched, decisions made      │
│                                                              │
│  3. AGENT ACTIVITY                                           │
│     └─► Which agents were spawned and what they did          │
│                                                              │
│  4. DOCUMENTATION                                            │
│     └─► What docs were updated or need updating              │
│                                                              │
│  5. VERIFICATION                                             │
│     └─► How to confirm the work is correct                   │
│                                                              │
│  6. REMAINING WORK                                           │
│     └─► What's left to do, known issues, blockers            │
│                                                              │
│  7. NEXT SESSION PREP                                        │
│     └─► What to load, where to start, context needed         │
└─────────────────────────────────────────────────────────────┘
```

## Handoff Generation Process

### Step 1: Gather Session Data

```
Review:
- What was the original request?
- What did we actually do?
- What changed (files, data, config)?
- What agents were spawned?
- What docs were consulted/updated?
```

### Step 2: Check Agent Registry

Read `.context/agents/active.yaml` to document agent activity:

```yaml
# Extract for each agent:
- type: [agent-type]
- purpose: [what it was spawned for]
- status: [active/completed]
- tasks: [what it did]
- notes: [relevant observations]
```

### Step 3: Document Decisions

Capture key decisions made during the session:
- Why was approach X chosen over Y?
- What constraints influenced decisions?
- What was learned that future sessions should know?

### Step 4: Identify Verification Steps

How can someone confirm the work is correct?
- Commands to run
- UI actions to perform
- Data to check
- Tests to execute

### Step 5: List Remaining Work

What's not done yet?
- Incomplete tasks
- Known issues
- Deferred decisions
- Follow-up items

### Step 6: Prepare Next Session Context

What does the next session need to be effective?
- Which docs to load
- Which files to review
- What state to verify
- What decisions are pending

## Output Format

Write to `.context/handoff.md`:

```markdown
# Session Handoff

**Date**: [YYYY-MM-DD HH:MM]
**Duration**: [approximate session length]
**Original Request**: [what user asked for]

---

## Summary

[2-3 sentence summary of what was accomplished]

## Work Completed

### Features/Fixes
- [Feature/fix 1]: [brief description]
- [Feature/fix 2]: [brief description]

### Files Changed
| File | Change Type | Description |
|------|-------------|-------------|
| [path] | [created/modified/deleted] | [what changed] |
| [path] | [created/modified/deleted] | [what changed] |

### Database Changes
- [ ] Migrations created: [list or "none"]
- [ ] Production SQL needed: [yes/no]
- [ ] RLS changes: [yes/no]

## Agent Activity

### Agents Spawned
| Agent | Purpose | Status | Key Output |
|-------|---------|--------|------------|
| [type] | [why spawned] | [completed/active] | [what it produced] |

### Agent Coordination Notes
[Any observations about agent interactions, issues, or patterns]

## Documentation

### Docs Updated
- [x] [doc path]: [sections changed]
- [x] [doc path]: [sections changed]

### Docs Need Updating
- [ ] [doc path]: [what needs to change]

### Drift Status
- Last drift-check: [timestamp or "not run"]
- Known drift: [list or "none"]

## Verification

### How to Verify This Work

#### Commands
```bash
[command 1]
[command 2]
```

#### UI Steps
1. Navigate to [route]
2. Perform [action]
3. Expect [outcome]

#### Data Checks
```sql
-- Verify [what]
SELECT ... FROM ...;
```

### Tests Run
- [ ] Static analysis: [pass/fail]
- [ ] Feature checklist: [pass/fail]
- [ ] Workflow smoke: [pass/fail]

## Remaining Work

### Not Yet Complete
- [ ] [Task 1]: [why incomplete, what's needed]
- [ ] [Task 2]: [why incomplete, what's needed]

### Known Issues
- **[Issue 1]**: [description]
  - Severity: [blocking/non-blocking]
  - Workaround: [if any]
  
### Deferred Decisions
- **[Decision]**: [options being considered]
  - Needs: [input/information needed]

### Follow-Up Items
- [ ] [Item 1]: [context]
- [ ] [Item 2]: [context]

## Next Session Prep

### Start With
```
/session-start
```

This will load:
- This handoff note
- Relevant feature docs
- Recent context

### Docs to Load
- `docs/features/[primary].md`
- `docs/features/[related].md`
- [other relevant docs]

### Files to Review
- `[critical file 1]`
- `[critical file 2]`

### First Actions
1. [What to do first]
2. [What to do second]
3. [What to do third]

### Context Needed
[Any external context the next session should gather]

---

## Session Metadata

### Context Usage
- Start: [estimate or "unknown"]
- End: [estimate or "near limit"]
- Recommendation: [compact recommended / ok for continuation]

### Optimization Opportunities Captured
- [ ] Captured to pending.yaml: [count or "none"]
- Topics: [brief list]

### User Preferences Noted
[Any user preferences expressed during session that should persist]
```

## Handoff Quality Checklist

Before finalizing handoff:

- [ ] Summary accurately reflects work done
- [ ] All changed files listed
- [ ] Agent activity documented
- [ ] Verification steps are actionable
- [ ] Remaining work is clear
- [ ] Next session can start immediately
- [ ] No critical context lost

## Quick Handoff (Short Sessions)

For brief sessions, use abbreviated format:

```markdown
# Quick Handoff - [Date]

**Did**: [one sentence]
**Changed**: [file list]
**Verify**: [one command or action]
**Next**: [what to do next]
**Issues**: [any blockers]
```

## Handoff for Context Compaction

When running `/compact`, include in handoff:

```markdown
## Context Compaction Note

This handoff was created during context compaction.

### Critical State to Preserve
- [State item 1]
- [State item 2]

### Must Remember
- [Critical fact 1]
- [Critical fact 2]

### Safe to Forget
- [Exploration that didn't pan out]
- [Details superseded by later work]
```

## Integration Points

### With Agent Registry
Read `.context/agents/active.yaml` to document all spawned agents.

### With Optimization Capture
Note any optimization opportunities identified but not yet captured.

### With Session Start
This handoff is consumed by `/session-start` to restore context.

### With Checkpoint
Handoff can be triggered as part of `/checkpoint` for mid-session saves.

## Anti-Patterns

❌ **Don't skip handoff for "quick" sessions**
Even quick sessions have context worth preserving.

❌ **Don't write vague summaries**
"Fixed some bugs" is useless. Be specific.

❌ **Don't forget verification steps**
If you can't verify it, you can't confirm it works.

❌ **Don't leave remaining work implicit**
Explicit incomplete items prevent dropped work.

❌ **Don't assume next session has any context**
Write as if the next session is a completely fresh start.
