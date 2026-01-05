# Handoff

Make work portable across tools, workspaces, and sessions. Run this skill at the end of a work session to create a handoff note.

## Steps

1. Create or update `.context/handoff.md` with the following sections:

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

Confirm the handoff note was written to `.context/handoff.md` with all required sections populated.
