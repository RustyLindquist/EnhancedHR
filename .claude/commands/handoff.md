---
description: Create a handoff note at end of work session for session portability
---

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

**Date**: YYYY-MM-DD HH:MM
**Agent/Author**: [identifier]
**Branch**: [branch name]
**Session Duration**: [approximate time spent]

## Summary

[2-4 sentences describing what was accomplished this session]

### Key Accomplishments
- [Major accomplishment 1]
- [Major accomplishment 2]
- [Major accomplishment 3]

### Work Status
- **Completed**: [What is fully done]
- **In Progress**: [What is partially done]
- **Not Started**: [What remains]

## Files Changed

Group by type for clarity:

### Source Code
- `path/to/file1.ts` - [detailed description: what changed and why]
- `path/to/file2.tsx` - [detailed description: what changed and why]

### Configuration
- `path/to/config.json` - [what was changed]

### Database/Schema
- `supabase/migrations/[timestamp]_[name].sql` - [what the migration does]
- [List any RLS policy changes]

### Tests
- `path/to/test.spec.ts` - [what tests were added/modified]

### Styles
- `path/to/styles.css` - [what styling changed]

## Docs Updated

### Feature Documentation
- `docs/features/feature-name.md` - [specific sections updated, what changed]
- `docs/features/FEATURE_INDEX.md` - [if coupling notes changed, what was added]

### Frontend Documentation
- `docs/frontend/STYLE_GUIDE.md` - [if design system rules changed]
- `docs/frontend/COMPONENT_INDEX.md` - [if components documented]

### Foundation Documentation
- `docs/foundation/[doc-name].md` - [what was updated]

### Workflow Documentation
- `docs/workflows/[workflow-name].md` - [if user workflows affected]

**Docs NOT Updated** (if any):
- [ ] [Doc that should be updated but wasn't - reason why]

## How to Verify

### Local Testing
1. [Detailed step 1 - be specific about commands or actions]
2. [Detailed step 2 - include expected outcomes]
3. [Detailed step 3 - what success looks like]

### UI Verification
1. Navigate to [specific URL or path]
2. [Specific action to perform]
3. Confirm [specific expected result]
4. Test edge case: [specific edge case and expected behavior]

### API/Backend Verification
1. [API endpoint to test]
2. [Expected response]
3. [Auth/permission check to verify]

### Database Verification
1. [Query to run or table to check]
2. [Expected data state]

## What Remains / Known Issues

### To Complete
- [ ] [Specific incomplete item 1 - with enough detail to pick up]
- [ ] [Specific incomplete item 2 - include any blockers]

### Known Issues
- [ ] [Known issue 1 - what's wrong and potential approach]
- [ ] [Edge case not yet handled - description]

### Future Enhancements
- [ ] [Nice-to-have that's out of scope for now]

## Active Sub-Agent Summary

[If no sub-agents: "None"]

[If sub-agents were used:]
- **Doc Agent**: [Status - complete/still needed] - [What it provided or what remains]
- **Frontend Agent**: [Status] - [Summary of work]
- **Test Agent**: [Status] - [Test results or what needs testing]
- [Other agents]

## Session Notes

### Key Decisions Made
1. [Decision 1 and rationale - important for future context]
2. [Decision 2 and rationale]

### Approaches Tried
- [Approach that worked and why]
- [Approach that didn't work and why - saves time for next agent]

### Blockers Encountered
- [Blocker 1 - how it was resolved or if still blocking]
- [Blocker 2 - how it was resolved or if still blocking]

### External Dependencies
- [Waiting on user input about X]
- [Need API documentation for Y]
- [Blocked on decision about Z]

### Optimizations Captured
- [Reference to optimization ID in pending.yaml if any were captured]

## Next Session Recommendations

### Recommended Next Steps
1. [Most logical next task to tackle]
2. [Secondary task if primary is blocked]

### Recommended Agent(s) to Spawn
- [Agent type] - [Why it's needed for next work]

### Documentation to Review
- [Relevant docs for next session to load]

### Context to Load
- Run `/session-start` to load this handoff
- Consider spawning [specific agent] for [specific reason]

## Production Notes

[If this work is ready for production:]
- **Deployment Steps**: [Any special deployment considerations]
- **Migration Required**: [Yes/No - if yes, provide SQL script and instructions]
- **Environment Variables**: [Any new env vars needed]
- **Feature Flags**: [Any flags to enable/disable]

[If NOT ready for production:]
- **Blocks Production**: [What needs to be done before prod deployment]
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
