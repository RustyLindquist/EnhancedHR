# Compact

This skill triggers context compaction to compress working memory and continue long sessions. Use this when context is heavy but you want to stay in the current conversation rather than spawning a subagent.

## When to Use This Skill

**Use this skill when:**
- `/context-status` recommends "COMPACT FIRST"
- Context is at High (60-85%) or Critical (85%+) level
- Finishing a major task and starting a new one
- Conversation history is long and unwieldy
- User requests context compression or "fresh start"
- Before adding complexity to an already-heavy session

**Don't use this skill when:**
- Context is Low or Medium and task ahead is simple
- Better to spawn a subagent for the next task
- In the middle of active work (finish first, then compact)
- Just starting a session (nothing to compact yet)

## What This Skill Does

Compaction is a **mental reset** that:
1. Captures key decisions and state in a persistent file
2. Allows the agent to mentally "clear" verbose history
3. Preserves critical context while dropping noise
4. Enables continuing work in the same session with lighter context

**Compaction is NOT:**
- Deleting conversation history (it remains visible to user)
- Starting a completely new session (continuity is preserved)
- A substitute for spawning when isolation is better

## Step-by-Step Compaction Process

### 1. Summarize Key Decisions

Review the session and extract:
- **What was decided**: Major choices, approaches, patterns established
- **Why it was decided**: Reasoning, constraints, trade-offs
- **What changed**: User statements that established new rules or preferences

**Example:**
```
Key Decisions:
- Use optimistic UI updates for bookmark actions (better UX)
- Store bookmarks in user_collections table (reuse existing structure)
- Show bookmarks in sidebar with course title + timestamp
- User prefers minimal confirmation modals ("just do it" philosophy)
```

### 2. Summarize Files Changed

List all files modified or created, with brief descriptions:

**Example:**
```
Files Changed:
- app/course/[id]/page.tsx - Added bookmark button to player
- app/actions/collections.ts - Added addBookmarkAction server action
- components/sidebar/BookmarksList.tsx - New component for bookmark display
- docs/features/collections.md - Updated with bookmark functionality
```

### 3. Summarize Current Task State

Document where you are in the current work:

**Example:**
```
Current State:
- Bookmark feature implemented and tested
- About to start: Add bulk operations (delete multiple bookmarks)
- Blocked on: None
- Next steps: Create bulk delete UI + server action
```

### 4. Write Session Summary File

Create or update `.context/session-summary.md` with structured summary:

```markdown
# Session Summary

**Date**: YYYY-MM-DD
**Session Start**: [approximate start time/context]
**Last Updated**: [current time]

## Work Completed

### Task 1: [Brief title]
**Status**: Complete
**Files**: list of files
**Key points**: 2-3 bullets

### Task 2: [Brief title]
**Status**: In Progress
**Files**: list of files
**Key points**: 2-3 bullets

## Key Decisions Made This Session

1. **[Decision]**: [Reasoning]
2. **[Decision]**: [Reasoning]
3. ...

## User Preferences Captured

- [Preference/rule stated by user]
- [Another preference]

## Files Modified This Session

- `path/to/file1.ts` - [what changed]
- `path/to/file2.tsx` - [what changed]
- ...

## Current State

**Working on**: [current task]
**Blocked on**: [blockers if any]
**Next steps**:
1. [next action]
2. [following action]
3. ...

## Context for Next Agent/Session

[Any important context that would help someone continue this work]

## Optimizations Captured

- [OPT-ID]: [brief description] - [status: pending/implemented]
- ...

## Compaction History

- [timestamp]: Compacted at [X]% context usage, continuing with [task]
- [timestamp]: Compacted at [X]% context usage, continuing with [task]
```

### 5. Mental Reset Acknowledgment

After writing the summary, explicitly acknowledge the compaction:

**Agent thinks:**
```
Context compacted successfully.
- Verbose history mentally compressed
- Critical state preserved in session-summary.md
- Ready to continue with lighter working memory
- Current focus: [next task from Current State]
```

**Agent communicates to user:**
```
Context compacted. I've summarized our session to session-summary.md
and cleared verbose history mentally. Ready to continue with [next task].

Current context: ~[reduced %] (was [previous %])
```

### 6. Continue with Task

Proceed with the next task using:
- The session summary as reference for past decisions
- Lighter context for current work
- Fresh mental space for complex thinking

## Session Summary Template

Use this template when creating `.context/session-summary.md`:

```markdown
# Session Summary

**Date**: YYYY-MM-DD
**Session Start**: [when/how session started]
**Last Updated**: [timestamp of most recent compaction]

---

## Work Completed

### [Task Title 1]
**Status**: Complete
**Files Changed**:
- `path/to/file1.ts` - [change description]
- `path/to/file2.tsx` - [change description]

**Key Points**:
- [Important decision or outcome]
- [Technical detail worth remembering]
- [Constraint or invariant discovered]

**Documentation Updated**:
- [doc file] - [what was updated]

---

### [Task Title 2]
**Status**: In Progress
**Files Changed**:
- `path/to/file3.ts` - [change description]

**Key Points**:
- [What's done so far]
- [What remains]

---

## Key Decisions Made This Session

1. **[Decision Topic]**: [What was decided and why]
   - Context: [situation that prompted decision]
   - Reasoning: [why this choice]
   - Alternatives considered: [if any]

2. **[Decision Topic]**: [What was decided and why]
   - Context: [situation]
   - Reasoning: [rationale]

3. ...

---

## User Preferences & Rules Captured

- **[Preference/Rule]**: [User statement or behavior that established this]
- **[Preference/Rule]**: [Context and implication]
- ...

---

## Files Modified This Session

**By Feature/Area:**

### Feature: [Feature Name]
- `app/path/to/file.tsx` - [description]
- `components/path/to/component.tsx` - [description]

### Documentation
- `docs/features/feature-name.md` - [what sections updated]
- `docs/workflows/workflow-name.md` - [if applicable]

### Configuration/Schema
- [If any schema, config, or infrastructure changes]

---

## Current State

**Currently Working On**: [current task description]

**Status**: [In Progress / Blocked / Planning]

**Blocked On**: [None / describe blocker]

**Completed Steps**:
1. [What's already done]
2. [Another completed step]

**Next Steps**:
1. [Immediate next action]
2. [Following action]
3. [Subsequent action]

**Context Needed to Continue**:
- [Important context for next steps]
- [Dependencies or considerations]

---

## Active Subagents

[Check .context/agents/active.yaml and list any active agents]

- **[agent-name]**: [status] - [what they're doing]
- **[agent-name]**: [status] - [what they're doing]
- [None if no active subagents]

---

## Context for Next Agent/Session

**If this session ends, the next agent should know:**

- [Critical context item 1]
- [Critical context item 2]
- [Where to pick up]
- [Any gotchas or important constraints]

---

## Optimizations Captured

- **OPT-YYYY-MM-DD-NNN**: [brief description] - Status: [pending/implemented]
- **OPT-YYYY-MM-DD-NNN**: [brief description] - Status: [pending/implemented]
- [Reference .context/optimizations/pending.yaml for details]

---

## Compaction History

This section tracks when context was compacted during this session:

- **[timestamp]**: Compacted at [X]% context usage, continuing with [task description]
- **[timestamp]**: Compacted at [X]% context usage, continuing with [task description]

[Each compaction adds an entry here]

---

## Notes

[Any additional notes, observations, or reminders that don't fit above categories]

```

## What to Preserve vs. What to Drop

### PRESERVE (Critical Context)

**Must keep:**
- User preferences and rules stated this session
- Key architectural decisions and their reasoning
- Current task state and next steps
- Files changed and why
- Active blockers or constraints
- Optimizations captured
- Feature-specific invariants discovered

**Example of what to preserve:**
```
User stated: "Always use optimistic updates for bookmark actions"
→ This is a preference that affects future implementation
→ PRESERVE in "User Preferences" section

Decision: Store bookmarks in user_collections table (reuse existing structure)
→ This is architectural and affects future work
→ PRESERVE in "Key Decisions" section
```

### DROP (Verbose Noise)

**Can drop:**
- Detailed exploration paths that didn't pan out
- Verbose file contents that were read but not changed
- Intermediate debugging steps
- Long code blocks that were generated then modified
- Exploratory questions and answers
- Detailed explanations of basic concepts

**Example of what to drop:**
```
Long conversation about whether to use a new table or existing table
→ Decision was made, reasoning captured
→ DROP the full back-and-forth debate

Read 5 different component files to understand patterns
→ Pattern was learned, preference established
→ DROP the individual file contents from mental context
```

### The Principle

**Keep DECISIONS and OUTCOMES. Drop PROCESS and EXPLORATION.**

The summary should answer:
- What did we decide?
- What did we build/change?
- What did we learn?
- Where are we now?
- What's next?

It should NOT be a play-by-play of every step taken.

## Example: Full Compaction Flow

**Scenario**: Context is at 75% (High) after implementing bookmark feature. About to add bulk operations.

### Agent Process:

**1. Assess need:**
```
Run /context-status:
- Context: High (75%)
- About to start: Medium complexity task (bulk operations)
- Recommendation: COMPACT FIRST
```

**2. Execute compaction:**

```markdown
# Session Summary

**Date**: 2026-01-07
**Session Start**: User requested bookmark feature for course player
**Last Updated**: 2026-01-07 14:30

## Work Completed

### Task 1: Implement Bookmark Feature
**Status**: Complete
**Files Changed**:
- `app/course/[id]/page.tsx` - Added bookmark button to player header
- `app/actions/collections.ts` - Added addBookmarkAction server action
- `components/sidebar/BookmarksList.tsx` - New component for bookmark display
- `docs/features/collections.md` - Updated with bookmark functionality

**Key Points**:
- Bookmarks stored in user_collections table (type: "bookmark")
- Optimistic UI updates for instant feedback
- Bookmarks show in sidebar with course title + timestamp
- Server action handles deduplication automatically

**Documentation Updated**:
- docs/features/collections.md - Added "Bookmarks" section with data paths and invariants

## Key Decisions Made This Session

1. **Reuse existing collections infrastructure**: Rather than create a new bookmarks table, use user_collections with type="bookmark"
   - Context: User asked for bookmark feature
   - Reasoning: Existing table already has user scoping, RLS policies, and UI patterns
   - Reduces complexity, maintains consistency

2. **Optimistic UI updates**: Update UI immediately, then sync with server
   - Context: User preference stated: "just do it, no confirmation modals"
   - Reasoning: Better UX, feels instant, error handling via toast
   - Aligns with user's preference for minimal friction

## User Preferences & Rules Captured

- **Minimal confirmation modals**: User prefers "just do it" philosophy - actions should happen immediately with feedback, not ask for confirmation
- **Clean, modern UI**: Favor simplicity over feature-heavy interfaces

## Files Modified This Session

### Feature: Collections (Bookmarks)
- `app/course/[id]/page.tsx` - Added bookmark button
- `app/actions/collections.ts` - Added addBookmarkAction
- `components/sidebar/BookmarksList.tsx` - New component
- `components/ui/toast.tsx` - Imported for feedback

### Documentation
- `docs/features/collections.md` - Added Bookmarks section

## Current State

**Currently Working On**: About to implement bulk bookmark operations (delete multiple)

**Status**: Planning

**Blocked On**: None

**Completed Steps**:
1. Bookmark feature fully implemented and tested
2. Documentation updated

**Next Steps**:
1. Design bulk delete UI (checkbox selection in BookmarksList)
2. Create bulkDeleteBookmarksAction server action
3. Add "Delete Selected" button with count indicator
4. Test bulk operations
5. Update docs

## Context for Next Agent/Session

**If this session ends, the next agent should know:**
- Bookmark feature is complete and working
- Uses user_collections table with type="bookmark"
- User prefers minimal modals, optimistic updates
- Next task is bulk operations (delete multiple)

## Compaction History

- **2026-01-07 14:30**: Compacted at 75% context usage, continuing with bulk bookmark operations

```

**3. Acknowledge compaction:**

```
Agent communicates to user:
"Context compacted. I've summarized our bookmark work to session-summary.md.
Ready to implement bulk bookmark operations with lighter context.

Current context: ~30% (was 75%)"
```

**4. Continue with next task:**
```
Proceed with bulk operations task, referring to session-summary.md
for decisions about optimistic updates and table structure.
```

## Integration with Other Skills

### With `/context-status`
```
/context-status → recommends "COMPACT FIRST" → /compact → continue
```

### With `/handoff`
```
End of session after compaction:
→ session-summary.md already exists
→ /handoff incorporates summary into handoff note
→ Next session can start from either document
```

### With Agent Spawning
```
Alternative to compacting:
→ /context-status recommends spawn OR compact
→ If spawn is better isolation, skip compact and spawn
→ If continuing inline is preferred, compact
```

## Compaction Best Practices

1. **Compact at task boundaries**: Don't compact mid-task; finish first
2. **Be ruthless about dropping noise**: Keep decisions, drop process
3. **Update summary incrementally**: Can compact multiple times in one session
4. **Preserve user voice**: Capture exact user statements about preferences
5. **Link to files**: Keep references to changed files, not full contents
6. **State next steps clearly**: Next agent needs to know where to continue

## What This Skill Does NOT Cover

- **Deciding when to compact** (that's `/context-status`)
- **Fixing context overflow** (prevention only, not recovery)
- **Managing conversation history** (that persists regardless)
- **Starting new sessions** (compaction continues current session)

This skill is for **compression within a session** — keeping the conversation going with lighter mental load.

## Quick Reference

```bash
# When context is heavy and you want to continue inline
/compact

# Process:
# 1. Summarize decisions → session-summary.md
# 2. Summarize changes → session-summary.md
# 3. Summarize state → session-summary.md
# 4. Acknowledge compaction mentally
# 5. Continue with lighter context
```

## Mental Shortcut: "Do I need to compact?"

Ask yourself:
- Is context High or Critical? → Probably yes
- Am I about to start a new task? → Good time to compact
- Do I feel "heavy" or uncertain? → Compact helps
- Is user requesting it? → Definitely yes

If unsure, run `/context-status` first to get a recommendation.
