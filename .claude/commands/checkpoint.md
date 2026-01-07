# Checkpoint

Create a mid-session save point for recovery. This skill captures current progress to enable resuming work if the session is interrupted.

## When to Use

Run `/checkpoint` in these situations:

| Trigger | Why | Example |
|---------|-----|---------|
| **Before risky operations** | Can recover if something goes wrong | Before schema changes, DB migrations |
| **After completing major subtask** | Preserve progress in multi-step work | Finished API, about to start UI |
| **When context is getting full** | Save state before spawning many agents | Large refactor with multiple sub-agents |
| **Before spawning many subagents** | Record parent state before coordination | Multi-agent feature implementation |
| **Before attempting uncertain fix** | Safe to experiment if you can revert | Debugging complex issue with trial fixes |
| **End of work block** | Stopping mid-task, want to resume later | End of day with work incomplete |

**Don't checkpoint for:**
- Simple, single-file changes
- Work that's about to be completed (just finish and run `/handoff` instead)
- Every small step (too much checkpoint noise)

## Steps

### 1. Assess Current State

Answer these questions:
- What task am I currently working on?
- What have I completed so far in this session?
- What files have I changed?
- What decisions have I made?
- What remains to be done?
- Are there any active sub-agents?

### 2. Capture Task State

Document:
- **Current focus**: The specific subtask you're in the middle of
- **Progress so far**: What steps of the plan have been completed
- **Next steps**: What you were about to do next
- **Decision log**: Key choices made that inform the approach

### 3. List Files Changed

For each file modified:
- Full path
- Brief description of what changed
- Status: completed, in-progress, or pending

### 4. Document Active Sub-Agents

If any sub-agents are running:
- Agent type (doc-agent, frontend-agent, test-agent, etc.)
- What they're working on
- Status (active, blocked, completed-but-not-reported)
- Dependencies (what's waiting on what)

### 5. Write Checkpoint File

Create `.context/checkpoint.md` using the template below.

## Checkpoint File Template

```markdown
# Checkpoint: [Brief description]

**Date**: YYYY-MM-DD HH:MM
**Agent**: [identifier]
**Branch**: [branch name]

## Current Task

[One sentence describing the primary task you're working on]

## Progress Summary

### Completed in This Session
- [X] [Subtask 1 completed]
- [X] [Subtask 2 completed]

### In Progress
- [ ] [Current subtask - specific enough to resume]

### Remaining
- [ ] [Next subtask]
- [ ] [Future subtask]

## Files Changed

### Completed Changes
- `path/to/file1.ts` - [what was changed]
- `path/to/file2.tsx` - [what was changed]

### In Progress
- `path/to/file3.ts` - [started but not finished, what remains]

### Planned Changes
- `path/to/file4.ts` - [what needs to be done]

## Decisions Made

Key choices that inform the current approach:
1. [Decision 1 and rationale]
2. [Decision 2 and rationale]
3. [Decision 3 and rationale]

## Active Sub-Agents

[If none: "None"]

[If any:]
- **Agent**: [type, e.g., frontend-agent]
  - **Working on**: [specific task]
  - **Status**: [active | blocked | complete-pending-integration]
  - **Dependencies**: [what it's waiting on or what's waiting on it]

## Context Notes

[Any important context needed to resume this work]
- Blockers encountered
- Approaches tried that didn't work
- External dependencies (waiting on user input, API docs, etc.)
- Known issues or edge cases discovered

## Next Actions

When resuming from this checkpoint:
1. [First thing to do]
2. [Second thing to do]
3. [Third thing to do]

## Verification Status

[If any work has been completed but not verified:]
- [ ] [Feature X needs testing via Y]
- [ ] [Component Z needs visual check]

## Recovery Instructions

If you need to revert changes made after this checkpoint:
- Files to revert: [list]
- Git reset point: [commit hash if applicable]
- DB state: [any DB changes to undo]
```

## Output Confirmation

After creating the checkpoint, confirm:

```markdown
## Checkpoint Created

**File**: `.context/checkpoint.md`
**Timestamp**: [ISO-8601]
**Task**: [brief description]

**Captured**:
- [N] files changed
- [N] subtasks completed
- [N] decisions documented
- [N] active sub-agents

**Ready to**: Continue work or safely interrupt session

**To resume**: Run `/session-start` at beginning of next session
```

## Recovery Process

When you return to resume from a checkpoint:

1. Run `/session-start` (it will detect the checkpoint automatically)
2. Verify the checkpoint state matches current reality:
   - Check files listed still have the changes described
   - Confirm no conflicting changes happened outside this session
3. Resume from "Next Actions" in the checkpoint
4. Once work is complete:
   - Run `/handoff` to create final handoff note
   - Delete the checkpoint: `rm .context/checkpoint.md`

## Checkpoint vs Handoff

| Aspect | Checkpoint | Handoff |
|--------|-----------|---------|
| **Timing** | Mid-session | End of session |
| **State** | In-progress work | Completed work |
| **Purpose** | Recovery point | Session transition |
| **Verification** | May be incomplete | Should be verified |
| **Docs** | May not be updated yet | Must be updated |
| **Cleanup** | Delete when work completes | Keep for next session |

**Key rule**: A checkpoint is temporary. When work completes, replace it with a proper handoff.

## Integration with Agent Registry

If you have spawned agents, also update `.context/agents/active.yaml`:

```yaml
checkpoint:
  timestamp: "YYYY-MM-DDTHH:MM:SSZ"
  task: "Brief description"
  primary_agent: main-agent

active_agents:
  - type: frontend-agent
    status: active
    task: "Building collection view UI"
    spawned_at: "YYYY-MM-DDTHH:MM:SSZ"

  - type: doc-agent
    status: complete
    task: "Validated plan for collection feature"
    spawned_at: "YYYY-MM-DDTHH:MM:SSZ"
    completed_at: "YYYY-MM-DDTHH:MM:SSZ"
```

## Example Checkpoint

### Before Database Migration

```markdown
# Checkpoint: Adding user_preferences table

**Date**: 2026-01-07 14:30
**Agent**: main-agent
**Branch**: feature/user-preferences

## Current Task

Adding user_preferences table to support dark mode and notification settings

## Progress Summary

### Completed in This Session
- [X] Reviewed requirements with Doc Agent
- [X] Designed table schema
- [X] Created migration file (local)

### In Progress
- [ ] Testing migration on local Supabase

### Remaining
- [ ] Add RLS policies
- [ ] Update TypeScript types
- [ ] Create server action for preferences CRUD
- [ ] Update Settings UI

## Files Changed

### Completed Changes
- `supabase/migrations/20260107143000_add_user_preferences.sql` - new table with columns: user_id, dark_mode, email_notifications, created_at, updated_at

### Planned Changes
- `app/actions/preferences.ts` - CRUD actions
- `app/settings/page.tsx` - UI for preferences
- `lib/types/database.ts` - TypeScript types

## Decisions Made

1. Storing preferences in separate table rather than extending profiles - allows for easier versioning
2. Using boolean columns for now rather than JSONB - simpler, type-safe
3. RLS policy will match user_id to auth.uid() - standard pattern

## Active Sub-Agents

None

## Context Notes

- Migration tested locally and works
- About to test that RLS policies work correctly
- Need to verify that table is properly accessible from server actions

## Next Actions

When resuming from this checkpoint:
1. Run migration test: `supabase db reset` (local only)
2. Verify table exists and RLS works
3. Add RLS policies to migration
4. Proceed with TypeScript types and server actions

## Verification Status

- [ ] Migration runs successfully
- [ ] RLS policies tested
- [ ] Server actions can read/write preferences

## Recovery Instructions

If migration causes issues:
- Revert: `git checkout supabase/migrations/20260107143000_add_user_preferences.sql`
- Reset local DB: `supabase db reset`
- DB state: No changes pushed to production
```

## Critical Reminders

1. **Checkpoint = mid-work state** - not a replacement for handoff
2. **Delete after completing** - don't leave stale checkpoints
3. **Be specific about "in progress"** - next agent needs to know where you were
4. **Document decisions** - rationale is critical for resuming work
5. **Update agent registry** - if sub-agents are active
