# Handoff

Make work portable across tools, workspaces, and sessions. Run this skill at the end of a work session to create a handoff note.

## Pre-Handoff Checklist (MANDATORY)

Before writing the handoff note, verify these items:

### Gate Completion Verification
- [ ] Gate 1 (Plan) was completed OR task was simple enough to skip
- [ ] Gate 2 (Execute with Docs) was completed
- [ ] Documentation was updated for any changes made
- [ ] Run `/validate-gate-completion` if uncertain

### Agent Registry Update
- [ ] Update `.context/agents/active.yaml` with session summary
- [ ] Mark all spawned agents as completed
- [ ] Note any agents that should be resumed next session

### Optimization Capture Review
- [ ] Review session for any uncaptured optimization signals
- [ ] Check for user statements that implied rules ("we always...", "we never...")
- [ ] Check for repeated patterns that should become skills
- [ ] Add any final entries to `.context/optimizations/pending.yaml`

### Template Reference
Use `.context/handoff.md.template` as the base structure for your handoff note.

## Steps

1. Complete the Pre-Handoff Checklist above
2. Create or update `.context/handoff.md` using the template below:

## Handoff Note Template

```markdown
# Handoff: [Brief description of work]

**Date**: YYYY-MM-DD
**Agent/Author**: [identifier]
**Branch**: [branch name]

## Summary

[2-4 sentences describing what was accomplished]

## Files Changed

- `path/to/file1.ts` - [brief description of change]
- `path/to/file2.tsx` - [brief description of change]
- ...

## Docs Updated

- `docs/features/feature-name.md` - [sections updated]
- `docs/features/FEATURE_INDEX.md` - [if coupling notes changed]
- ...

## How to Verify

### Local Testing
1. [Step 1]
2. [Step 2]
3. ...

### UI Verification
1. [Navigate to X]
2. [Perform action Y]
3. [Confirm Z]

## What Remains / Known Issues

- [ ] [Incomplete item 1]
- [ ] [Known issue or edge case]
- ...

## Notes for Next Session

[Any context that would help the next agent/developer continue this work]
```

## Output

Confirm:
1. Pre-Handoff Checklist was completed
2. Handoff note was written to `.context/handoff.md` with all required sections
3. Agent registry (`.context/agents/active.yaml`) was updated
4. Any captured optimizations were added to pending.yaml

## Critical Reminders

1. **Never skip the checklist** - it ensures nothing is forgotten
2. **Update the agent registry** - future sessions need this context
3. **Capture optimizations last** - end-of-session is a good time to reflect
4. **Be specific in verification steps** - the next agent needs to be able to verify your work
