---
description: Spawn N agents to handle similar tasks in parallel for batch operations
---

# Fan-Out

Spawn N agents to handle a list of similar tasks in parallel. This skill automates the pattern of spawning multiple agents for batch operations.

## When to Use This Skill

**Use fan-out when:**
- You have a list of similar tasks (3+ items)
- Each task follows the same pattern (fix bugs, test features, research areas)
- Tasks are independent and can run in parallel
- The work benefits from parallelization

**Do NOT use fan-out when:**
- Only 1-2 tasks (just spawn normally)
- Tasks are too different (use `/parallel-agents` with custom agents)
- Tasks have dependencies (must run sequentially)
- Tasks are trivial (do inline)

## Input Format

```
/fan-out
- Task 1 description
- Task 2 description
- Task 3 description
- Task 4 description
```

Or with context:

```
/fan-out [agent-type]
Context: [shared context for all agents]

Tasks:
- Task 1 description
- Task 2 description
- Task 3 description
```

## Process Overview

When you run `/fan-out`, follow this process:

```
1. Parse task list from user input
   ↓
2. Determine appropriate agent type for tasks
   ↓
3. Group tasks if appropriate (similar items)
   ↓
4. Generate parallel spawn (using /parallel-agents pattern)
   ↓
5. Update agent registry for tracking
   ↓
6. Spawn all agents
   ↓
7. Collect results as agents complete
   ↓
8. Synthesize combined results
   ↓
9. Update todos and registry
```

## Step-by-Step Execution

### 1. Parse Task List

Extract individual tasks from user input:

```
Input:
/fan-out
- Fix dashboard loading bug
- Fix profile avatar upload error
- Fix course progress not saving

Parsed:
✓ 3 tasks identified
✓ All appear to be bug fixes
✓ Tasks seem independent
```

### 2. Determine Agent Type

Based on task type, select appropriate agent:

| Task Pattern | Agent Type | Rationale |
|-------------|------------|-----------|
| "Fix [UI component]" | frontend-agent | UI work |
| "Test [workflow]" | test-agent | Verification |
| "Research [feature]" | doc-agent | Documentation |
| "Implement [feature]" | Depends on feature | Frontend vs general |
| "Fix [bug]" | general-purpose | Generic fixing |
| "Update [docs]" | general-purpose | Doc updates |

### 3. Task Grouping Strategy

Decide whether to group tasks or spawn one agent per task:

**One agent per task** (default):
```
3 tasks → 3 agents
Each agent handles one task independently
```

**Group tasks** (when appropriate):
```
6 similar TypeScript errors → 2 agents
Each agent handles 3 related errors
```

**Grouping heuristics**:

| Scenario | Group? | Agents | Why |
|----------|--------|--------|-----|
| 3-5 independent tasks | No | 1 per task | Clean isolation |
| 6-10 similar small tasks | Maybe | 2-3 agents | Reduce overhead |
| 10+ trivial tasks | Yes | 3-4 agents | Batch efficiency |
| Complex tasks | No | 1 per task | Focus required |

### 4. Generate Spawn Using `/parallel-agents`

Use the parallel-agents pattern to create spawn prompts:

```markdown
## Fan-Out: [Operation Name]

Spawning [N] agents to handle [M] tasks in parallel.

---

### Agent 1: [Task Name]
**Type**: [agent-type]
**Task**: [Description]
**Expected Output**: [Deliverable]

⛔ CRITICAL SAFETY RULE ⛔
NEVER run these commands — they DESTROY ALL DATA:
- supabase db reset
- DROP TABLE / DROP DATABASE / TRUNCATE
- docker volume rm (supabase volumes)

If blocked by a database issue, use targeted SQL or createAdminClient().
NEVER reset the database. There is ALWAYS a non-destructive alternative.
If you're tempted to reset, STOP and tell the user first.

---

[Detailed task instructions]

---

[Repeat for each agent...]
```

### 5. Update Agent Registry

Before spawning, update `.context/agents/active.yaml`:

```yaml
session:
  id: "2026-01-07-afternoon"
  started_at: "2026-01-07T15:00:00Z"
  completed_at: null

agents:
  - type: general-purpose
    status: spawned
    spawned_at: "2026-01-07T15:05:00Z"
    completed_at: null
    task: "Fix dashboard loading bug"
    outcome: null
    dependencies: "None"

  - type: general-purpose
    status: spawned
    spawned_at: "2026-01-07T15:05:00Z"
    completed_at: null
    task: "Fix profile avatar upload error"
    outcome: null
    dependencies: "None"

  - type: general-purpose
    status: spawned
    spawned_at: "2026-01-07T15:05:00Z"
    completed_at: null
    task: "Fix course progress not saving"
    outcome: null
    dependencies: "None"
```

### 6. Create Todos for Tracking

Use TodoWrite to track progress:

```
[ ] Fix dashboard loading bug (Agent 1 - spawned)
[ ] Fix profile avatar upload error (Agent 2 - spawned)
[ ] Fix course progress not saving (Agent 3 - spawned)
```

### 7. Monitor and Update Progress

As each agent returns results:

**Update Registry**:
```yaml
agents:
  - type: general-purpose
    status: complete
    spawned_at: "2026-01-07T15:05:00Z"
    completed_at: "2026-01-07T15:18:00Z"
    task: "Fix dashboard loading bug"
    outcome: "Fixed loading state in dashboard/page.tsx, verified working"
    dependencies: "None"
```

**Update Todos**:
```
[✓] Fix dashboard loading bug (Agent 1 - complete)
[ ] Fix profile avatar upload error (Agent 2 - in progress)
[ ] Fix course progress not saving (Agent 3 - in progress)
```

### 8. Synthesize Results

Once all agents complete, combine results:

```markdown
## Fan-Out Results: [Operation Name]

### Completed (N/M)
- **Task 1**: [Summary] ✓
- **Task 2**: [Summary] ✓
- **Task 3**: [Summary] ✓

### Failed (if any)
- **Task X**: [What went wrong]
  - Issue: [Description]
  - Next steps: [How to resolve]

### Synthesis
[Overall summary]
- Common patterns discovered: [list]
- Conflicts or dependencies: [none / describe]
- Follow-up needed: [none / list]

### Files Changed
- `path/to/file1.ts` (Task 1)
- `path/to/file2.tsx` (Task 2, Task 3)
- `path/to/file3.ts` (Task 3)

### Next Steps
- [ ] [Any follow-up work]
- [ ] [Testing across all changes]
- [ ] [Documentation updates]
```

## Example: Fan-Out Bug Fixes

### User Input

```
/fan-out
- Fix the dashboard loading spinner that doesn't disappear
- Fix profile avatar upload showing error
- Fix course progress not saving
```

### Execution

**1. Parse and analyze:**
```
✓ 3 tasks identified
✓ All are bug fixes
✓ Tasks appear independent
✓ Agent type: general-purpose (except avatar which could be frontend-agent)
```

**2. Create spawn:**
```markdown
## Fan-Out: Bug Fixes

Spawning 3 agents to fix these bugs in parallel.

---

### Agent 1: Fix Dashboard Loading Spinner
**Type**: general-purpose
**Task**: Fix loading spinner that doesn't disappear
**Expected Output**: Code changes + verification

⛔ CRITICAL SAFETY RULE ⛔
[...safety preamble...]

---

Bug: Dashboard loading spinner doesn't disappear after data loads.

1. Find dashboard component (`app/dashboard/page.tsx` or similar)
2. Locate loading state logic
3. Fix the condition that controls spinner visibility
4. Verify in browser that spinner now works
5. Run build to check for errors

Return:
- Files changed
- What was fixed
- Verification steps taken

---

### Agent 2: Fix Profile Avatar Upload
**Type**: frontend-agent
**Task**: Fix avatar upload error
**Expected Output**: Fixed component + verification

⛔ CRITICAL SAFETY RULE ⛔
[...safety preamble...]

---

Bug: Profile avatar upload shows "Failed to upload" error.

1. Locate avatar upload component
2. Identify error source (validation, server action, etc.)
3. Fix following design system patterns
4. Test upload with actual file
5. Document any component changes

Return:
- Files changed
- Root cause of error
- Fix implemented
- Test results

---

### Agent 3: Fix Course Progress Not Saving
**Type**: general-purpose
**Task**: Fix course progress persistence
**Expected Output**: Code changes + verification

⛔ CRITICAL SAFETY RULE ⛔
[...safety preamble...]

---

Bug: Course progress doesn't persist when module completed.

1. Find course progress server action
2. Check database schema for progress table
3. Identify where save is failing (RLS policies, missing await, etc.)
4. Fix the issue
5. Test that progress now saves

Return:
- Files changed
- Root cause
- Fix implemented
- Verification that progress persists
```

**3. Update tracking:**
```yaml
# .context/agents/active.yaml
agents:
  - type: general-purpose
    status: spawned
    spawned_at: "2026-01-07T15:05:00Z"
    task: "Fix dashboard loading spinner"
  - type: frontend-agent
    status: spawned
    spawned_at: "2026-01-07T15:05:00Z"
    task: "Fix profile avatar upload"
  - type: general-purpose
    status: spawned
    spawned_at: "2026-01-07T15:05:00Z"
    task: "Fix course progress not saving"
```

```
Todos:
[ ] Fix dashboard loading spinner (Agent 1)
[ ] Fix profile avatar upload (Agent 2)
[ ] Fix course progress not saving (Agent 3)
```

**4. Collect results:**
```
[✓] Agent 1: Complete - Fixed loading state condition
[✓] Agent 2: Complete - Fixed missing await in server action
[✓] Agent 3: Complete - Added RLS policy for progress table
```

**5. Synthesize:**
```markdown
## Fan-Out Results: Bug Fixes

### Completed (3/3)
- **Dashboard Loading Spinner**: Fixed loading state condition in `app/dashboard/page.tsx` ✓
- **Profile Avatar Upload**: Fixed missing await in upload server action ✓
- **Course Progress**: Added missing RLS policy to progress table ✓

### Failed
None - all fixes completed successfully.

### Synthesis
All three bugs fixed independently with no conflicts. Common theme: each bug was caused by a small oversight (condition logic, missing await, missing RLS policy).

### Files Changed
- `app/dashboard/page.tsx` (loading state fix)
- `app/actions/profile/upload-avatar.ts` (await added)
- `components/profile/AvatarUpload.tsx` (error handling improved)
- `supabase/migrations/20260107_add_progress_rls.sql` (new RLS policy)

### Verification
- All agents tested their fixes in browser
- Build passes with no new errors
- Each fix verified independently

### Next Steps
- [ ] Run full test suite to check for regressions
- [ ] Update handoff note with completed fixes
```

## Example: Fan-Out Feature Research

### User Input

```
/fan-out
Context: Planning a new notifications feature

Tasks:
- Research how other features handle user preferences
- Research real-time update patterns in the codebase
- Research existing notification/alert UI components
```

### Execution

**Agent type selection**: general-purpose for research tasks

**Spawn pattern**:
```markdown
## Fan-Out: Notifications Feature Research

Spawning 3 research agents to explore different aspects of the planned notifications feature.

---

### Agent 1: User Preferences Patterns
**Type**: general-purpose
**Task**: Research how existing features handle user preferences
**Expected Output**: Patterns, components, and data models for preferences

⛔ CRITICAL SAFETY RULE ⛔
[...safety preamble...]

---

Research existing user preferences patterns:
1. Search for preference-related components and server actions
2. Check database schema for preference storage
3. Identify UI patterns for preference selection
4. Document common patterns

Return:
- How preferences are stored (DB schema)
- Components used for preference UI
- Server actions for saving preferences
- Recommended pattern for notifications preferences

---

[Continue for other agents...]
```

**Result synthesis**:
```markdown
## Fan-Out Results: Notifications Feature Research

### Completed (3/3)
- **User Preferences Patterns**: Found preferences stored in user_metadata, toggles use Switch component ✓
- **Real-time Update Patterns**: Supabase Realtime used for chat, can apply to notifications ✓
- **Notification UI Components**: AlertDialog component exists, can be adapted for notifications ✓

### Synthesis
Discovered existing patterns that can be leveraged:
1. **Preferences**: Store in `user_metadata` field, update via `updateUserAction`
2. **Real-time**: Use Supabase Realtime channels (already configured)
3. **UI**: Extend `AlertDialog` component for notification display

### Recommended Approach
Based on research:
- Store notification preferences in `user_metadata.notifications`
- Use Supabase Realtime for push notifications
- Create `NotificationCard` component extending AlertDialog
- Add notification preferences to Settings page

### Next Steps
- [ ] Create plan for notifications feature using discovered patterns
- [ ] Estimate effort based on existing components
- [ ] Identify any missing infrastructure
```

## Task Grouping Example

### User Input

```
/fan-out
Fix these TypeScript errors:
- Type error in dashboard/UserCard.tsx (missing prop)
- Type error in profile/Settings.tsx (wrong type)
- Type error in courses/CourseList.tsx (undefined check)
- Type error in auth/LoginForm.tsx (missing type)
- Type error in billing/PlanSelector.tsx (enum mismatch)
- Type error in admin/Dashboard.tsx (wrong return type)
```

### Grouping Decision

**6 simple errors → Group into 2-3 agents**

**Grouping**:
```
Agent 1: Fix 2 errors (dashboard, profile)
Agent 2: Fix 2 errors (courses, auth)
Agent 3: Fix 2 errors (billing, admin)
```

**Rationale**: Each error is simple, grouping reduces overhead while maintaining focus.

**Alternative**: If errors were complex, spawn 6 agents (one per error).

## Result Template

Use this template for synthesizing fan-out results:

```markdown
## Fan-Out Results: [Operation Name]

### Summary
[One-line summary of overall outcome]

### Completed (N/M)
- **[Task 1 name]**: [Brief result] ✓
- **[Task 2 name]**: [Brief result] ✓
- **[Task N name]**: [Brief result] ✓

### Failed (if any)
- **[Task X name]**: [What went wrong]
  - **Issue**: [Description]
  - **Impact**: [What this affects]
  - **Next steps**: [How to resolve]

### Synthesis
[2-4 paragraphs analyzing combined results]

**Common Patterns**:
- [Pattern 1 discovered across tasks]
- [Pattern 2 discovered across tasks]

**Conflicts/Dependencies**:
- [None / List any discovered]

**Insights**:
- [Key learnings from the batch operation]

### Files Changed
- `path/to/file1.ts` (Task 1, Task 3)
- `path/to/file2.tsx` (Task 2)
- `path/to/file3.md` (Documentation)

### Verification
- [How results were verified]
- [Any tests run]
- [Any issues found]

### Next Steps
- [ ] [Follow-up item 1]
- [ ] [Follow-up item 2]
- [ ] [Any remaining work]
```

## Integration with Other Skills

### With `/parallel-agents`

Fan-out is built on `/parallel-agents`:
```
/fan-out → parses tasks → generates /parallel-agents pattern → spawns
```

### With `/context-status`

Before fan-out:
```
1. Run /context-status to check capacity
2. If context is high, fan-out to fresh agents is a good choice
3. Fan-out creates N fresh contexts
```

### With `/test-from-docs`

After fan-out implementation:
```
1. Complete fan-out (all features implemented)
2. Run /test-from-docs to generate comprehensive test plan
3. Spawn test-agent to verify all implementations
```

### With `/handoff`

After fan-out completion:
```
1. Synthesize all results
2. Update agent registry
3. Update todos
4. Run /handoff with complete summary
```

## Best Practices

### 1. Batch Similar Tasks

Fan-out works best when tasks follow a pattern:

**Good patterns**:
- Fix N similar bugs
- Test N workflows
- Research N features
- Implement N similar components

**Poor patterns**:
- Mix of unrelated tasks (use `/parallel-agents` instead)
- Single large task (just spawn one agent)
- Dependent tasks (spawn sequentially)

### 2. Provide Context

If tasks share context, include it once:

```
/fan-out frontend-agent
Context: Building user profile page following design system

Tasks:
- Create ProfileHeader component
- Create ProfileStats component
- Create ProfileActivity component
```

### 3. Appropriate Task Size

Each task should be:
- **Clear**: Agent knows exactly what to do
- **Scoped**: Can complete in one session
- **Independent**: Doesn't block on other tasks
- **Verifiable**: Has clear success criteria

### 4. Monitor Progress

Don't spawn and forget:
```
1. Spawn all agents
2. Update tracking (registry + todos)
3. As agents complete, review output
4. Update tracking (mark complete)
5. Identify any issues early
6. Synthesize when all complete
```

### 5. Handle Failures Gracefully

If an agent fails:
```
1. Document what failed and why
2. Assess impact on other tasks
3. Decide: retry, manual fix, or proceed without
4. Update synthesis with partial results
```

## Common Pitfalls

### Pitfall 1: Tasks Too Different

**Problem**: Tasks require different approaches, making batch handling inefficient.

**Solution**: Use `/parallel-agents` with custom agents for each task.

### Pitfall 2: Tasks Have Dependencies

**Problem**: Agent 2 needs results from Agent 1.

**Solution**: Don't fan-out. Spawn sequentially or include conditional logic.

### Pitfall 3: Too Many Agents

**Problem**: Spawning 10+ agents is expensive and hard to coordinate.

**Solution**: Group tasks or do in batches (fan-out 5, synthesize, fan-out next 5).

### Pitfall 4: Trivial Tasks

**Problem**: Tasks are so simple that spawning overhead exceeds benefit.

**Solution**: Do inline or spawn single agent to handle all tasks.

## What This Skill Does NOT Cover

- **Custom agent coordination** (use `/parallel-agents` for that)
- **Sequential workflows** (spawn agents one at a time)
- **Single complex task** (just spawn one focused agent)
- **Agent result dependencies** (requires sequential spawning)

This skill is for **batch parallel operations** — spawning N agents to handle M similar independent tasks.

## Quick Reference

```markdown
# Fan-out checklist:

[ ] 3+ similar tasks to handle
[ ] Tasks are independent (no dependencies)
[ ] Determined appropriate agent type
[ ] Decided on grouping strategy (1:1 or batched)
[ ] Safety preamble in all agent prompts
[ ] Agent registry ready to update
[ ] Todos created for tracking
[ ] Result synthesis plan ready
```
