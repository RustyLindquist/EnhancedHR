---
description: Spawn and coordinate multiple agents working in parallel on independent tasks
---

# Parallel Agents

Spawn and coordinate multiple agents working in parallel on independent tasks. This skill provides templates and guidelines for efficient parallel agent orchestration.

## When to Use This Skill

**Use parallel agents when:**
- Multiple independent tasks need completion
- Tasks can run simultaneously without blocking each other
- Research needed across different areas (features, docs, code)
- Batch operations on independent items (bug fixes, feature additions)
- Time-sensitive work that benefits from parallelization

**Do NOT use parallel agents when:**
- Tasks have dependencies (must run sequentially)
- Single focused task (just spawn one agent)
- Tasks share state or need coordination
- Exploratory work where scope is unclear
- Simple tasks that don't justify the coordination overhead

## Cost Awareness

Parallel agent spawning uses more tokens:

| Scenario | Token Multiplier | When Worth It |
|----------|------------------|---------------|
| Single task inline | 1× | Simple, clear scope |
| Single sub-agent | ~4× | Complex or isolated work |
| Parallel agents (2-3) | ~8-12× | Independent tasks, time-sensitive |
| Parallel agents (4+) | ~15-20× | Large batch operations only |

**Use parallelization when:**
- Time saved justifies token cost
- Tasks are truly independent
- Results need to be combined for decision-making

**Avoid parallelization when:**
- Tasks are small/quick (overhead exceeds benefit)
- Sequential work would be clearer
- User hasn't indicated urgency

## Safety Requirements

**CRITICAL**: Every spawned agent MUST include the safety preamble in its prompt.

### Safety Preamble (REQUIRED)

Copy this EXACTLY into every agent prompt:

```
⛔ CRITICAL SAFETY RULE ⛔
NEVER run these commands — they DESTROY ALL DATA:
- supabase db reset
- DROP TABLE / DROP DATABASE / TRUNCATE
- docker volume rm (supabase volumes)

If blocked by a database issue, use targeted SQL or createAdminClient().
NEVER reset the database. There is ALWAYS a non-destructive alternative.
If you're tempted to reset, STOP and tell the user first.
```

This prevents data loss from sub-agents that don't automatically see CLAUDE.md or SAFETY_RULES.md.

## Parallel Spawn Template

Use this structure for spawning parallel agents:

```markdown
## Parallel Agent Spawn

I'm spawning [N] agents in parallel to handle:
- [High-level goal]

### Agent 1: [Descriptive Name]
**Type**: [doc-agent | frontend-agent | test-agent | general-purpose]
**Task**: [Clear, specific task description]
**Expected Output**: [What to return - e.g., "List of affected features" or "Component implementation"]
**Dependencies**: [None | Requires output from Agent X]

[SAFETY PREAMBLE HERE]

[Detailed instructions for this agent]

---

### Agent 2: [Descriptive Name]
**Type**: [agent type]
**Task**: [task description]
**Expected Output**: [expected deliverable]
**Dependencies**: [None | ...]

[SAFETY PREAMBLE HERE]

[Detailed instructions for this agent]

---

[Continue for all agents...]
```

## Agent Registry Tracking

When spawning parallel agents, update `.context/agents/active.yaml`:

### Create or Update Registry

If the file doesn't exist, create it:

```yaml
session:
  id: "YYYY-MM-DD-[morning|afternoon|evening]"
  started_at: "2026-01-07T14:00:00Z"
  completed_at: null

agents: []
```

### Add Entry for Each Spawned Agent

```yaml
agents:
  - type: doc-agent
    status: spawned
    spawned_at: "2026-01-07T14:05:00Z"
    completed_at: null
    task: "Brief task description"
    outcome: null
    dependencies: "None"

  - type: general-purpose
    status: spawned
    spawned_at: "2026-01-07T14:05:00Z"
    completed_at: null
    task: "Brief task description"
    outcome: null
    dependencies: "None"
```

### Update Status as Agents Complete

When each agent returns:

```yaml
agents:
  - type: doc-agent
    status: complete
    spawned_at: "2026-01-07T14:05:00Z"
    completed_at: "2026-01-07T14:15:00Z"
    task: "Validate plan for bookmarks feature"
    outcome: "Confirmed 2 features affected, 4 invariants identified"
    dependencies: "None"
```

## Result Collection Strategy

### 1. Wait for All Agents

Track which agents have returned results:

```
Waiting for results from:
- [✓] Agent 1: [Name] - COMPLETE
- [✓] Agent 2: [Name] - COMPLETE
- [ ] Agent 3: [Name] - In progress...
```

### 2. Handle Partial Results

If an agent fails or returns incomplete results:

```
Agent [N] encountered an issue:
- Issue: [description]
- Impact: [what this affects]
- Next steps: [spawn replacement | proceed without | adjust plan]
```

### 3. Synthesize Results

Once all agents complete (or partial results are handled), synthesize:

```markdown
## Parallel Agent Results

### Summary
[High-level synthesis of what was accomplished]

### Agent 1: [Name]
**Status**: Complete
**Output**: [Key findings or deliverables]

### Agent 2: [Name]
**Status**: Complete
**Output**: [Key findings or deliverables]

### Agent 3: [Name]
**Status**: Failed / Partial
**Output**: [What was completed]
**Issue**: [What went wrong]

### Combined Analysis
[How results fit together, any conflicts or dependencies discovered]

### Next Steps
- [Action items based on combined results]
- [Any follow-up work needed]
```

## Example: Parallel Bug Fix

**Scenario**: User reports 3 unrelated bugs that need fixing.

### Spawn Pattern

```markdown
I'm spawning 3 agents in parallel to fix these bugs independently:

---

### Agent 1: Fix Dashboard Loading Spinner
**Type**: general-purpose
**Task**: Fix the loading spinner that doesn't disappear on the dashboard
**Expected Output**: Code changes + verification that spinner now disappears

⛔ CRITICAL SAFETY RULE ⛔
NEVER run these commands — they DESTROY ALL DATA:
- supabase db reset
- DROP TABLE / DROP DATABASE / TRUNCATE
- docker volume rm (supabase volumes)

If blocked by a database issue, use targeted SQL or createAdminClient().
NEVER reset the database. There is ALWAYS a non-destructive alternative.
If you're tempted to reset, STOP and tell the user first.

---

Bug: Dashboard loading spinner doesn't disappear after data loads.

Steps to fix:
1. Locate the dashboard component
2. Find the loading state logic
3. Fix the condition that hides the spinner
4. Verify with browser that spinner now works correctly
5. Run build to ensure no errors

Return: File changes made + screenshot of fixed behavior

---

### Agent 2: Fix Profile Avatar Upload
**Type**: frontend-agent
**Task**: Fix avatar upload that's showing error on submission
**Expected Output**: Fixed upload component + verification

⛔ CRITICAL SAFETY RULE ⛔
[...safety preamble...]

---

Bug: Profile avatar upload shows "Failed to upload" error.

The Frontend Agent should:
1. Check existing avatar upload component
2. Identify the error source (likely server action or validation)
3. Fix the issue following design system patterns
4. Test upload with browser
5. Document any component changes

Return: Fixed component + test report

---

### Agent 3: Fix Course Progress Not Saving
**Type**: general-purpose
**Task**: Fix course progress that's not persisting to database
**Expected Output**: Code changes + verification that progress saves

⛔ CRITICAL SAFETY RULE ⛔
[...safety preamble...]

---

Bug: Course progress doesn't save when user completes a module.

Steps to fix:
1. Check the course progress server action
2. Verify database schema for progress tracking
3. Find where save is failing (check RLS policies if needed)
4. Fix the issue (likely missing await or RLS policy)
5. Test that progress now saves correctly

Return: File changes + verification steps taken
```

### Registry Tracking

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
    task: "Fix dashboard loading spinner"
    outcome: null
    dependencies: "None"

  - type: frontend-agent
    status: spawned
    spawned_at: "2026-01-07T15:05:00Z"
    completed_at: null
    task: "Fix profile avatar upload"
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

### Result Synthesis

```markdown
## Bug Fix Results

### Summary
All 3 bugs fixed successfully. Each agent completed independently without conflicts.

### Agent 1: Dashboard Loading Spinner
**Status**: Complete
**Changes**:
- Modified `app/dashboard/page.tsx`
- Fixed loading state condition from `data && !loading` to `!loading`
**Verification**: Tested in browser, spinner now disappears correctly

### Agent 2: Profile Avatar Upload
**Status**: Complete
**Changes**:
- Updated `components/profile/AvatarUpload.tsx`
- Fixed server action call (missing await)
- Added error handling
**Verification**: Tested upload with image, works correctly

### Agent 3: Course Progress Not Saving
**Status**: Complete
**Changes**:
- Fixed `app/actions/course-progress.ts`
- Added missing RLS policy for progress table
**Verification**: Tested module completion, progress now persists

### Combined Analysis
No conflicts between changes. All fixes are isolated to their respective features.

### Next Steps
- [✓] All fixes verified individually
- [ ] Run full test suite to ensure no regressions
- [ ] Update `.context/handoff.md` with completed work
```

## Example: Parallel Research

**Scenario**: User wants to understand how bookmarks feature would integrate with existing systems.

### Spawn Pattern

```markdown
I'm spawning 3 research agents in parallel:

---

### Agent 1: Collections Feature Analysis
**Type**: doc-agent
**Task**: Research collections feature and identify integration points
**Expected Output**: Feature overview + integration points with bookmarks

⛔ CRITICAL SAFETY RULE ⛔
[...safety preamble...]

---

Research the collections feature:
1. Load `docs/features/FEATURE_INDEX.md`
2. Find and load collections feature doc
3. Identify data models, server actions, UI surfaces
4. Determine how bookmarks would integrate with collections

Return: Summary of collections architecture + bookmark integration points

---

### Agent 2: Course Player Integration
**Type**: general-purpose
**Task**: Analyze course player codebase for bookmark integration
**Expected Output**: Technical analysis of where bookmark UI would fit

⛔ CRITICAL SAFETY RULE ⛔
[...safety preamble...]

---

Research course player integration:
1. Find course player components
2. Identify where bookmark button would be placed
3. Check existing actions/patterns for similar features
4. List files that would need modification

Return: Component tree + proposed integration points + file list

---

### Agent 3: Database Schema Research
**Type**: general-purpose
**Task**: Research database patterns for user-content relationships
**Expected Output**: Schema proposal for bookmarks table

⛔ CRITICAL SAFETY RULE ⛔
[...safety preamble...]

---

Research database schema:
1. Check existing tables for user-content patterns
2. Review RLS policies for similar features
3. Propose bookmarks table schema
4. Identify any migration concerns

Return: Proposed schema + RLS policy pattern + migration notes
```

## Integration with Other Skills

### With `/fan-out`

`/parallel-agents` is the underlying mechanism for `/fan-out`. Fan-out uses this pattern to spawn N agents for similar tasks.

### With `/context-status`

Before spawning parallel agents:

```
1. Run /context-status to check current load
2. If context is High/Critical, consider spawning instead of continuing inline
3. Spawning parallel agents creates fresh context for each agent
```

### With `/handoff`

After parallel agents complete:

```
1. Synthesize all results
2. Update agent registry with outcomes
3. Run /handoff to document the session
4. Include all agent outcomes in handoff note
```

## Best Practices

### 1. Clear Task Boundaries

Each agent should have a well-defined, independent task:

**Good**:
- "Fix the login button styling"
- "Research the collections feature integration points"
- "Test the checkout flow end-to-end"

**Bad**:
- "Fix the whole authentication system" (too broad, interdependent)
- "Make it better" (unclear scope)
- "Do whatever needs doing" (no clear deliverable)

### 2. Appropriate Agent Types

Match agent type to task:

| Task Type | Agent Type |
|-----------|------------|
| UI/component work | frontend-agent |
| Doc research/validation | doc-agent |
| Testing/verification | test-agent |
| General code/bug fix | general-purpose |
| System optimization | ops-agent |

### 3. Result Dependencies

If results from one agent inform another agent's work:

**Option A**: Spawn sequentially (not parallel)
```
1. Spawn Agent 1
2. Wait for result
3. Spawn Agent 2 with context from Agent 1
```

**Option B**: Spawn with conditional next steps
```
1. Spawn all agents in parallel
2. Agent 2 includes: "If Agent 1 finds X, do Y; otherwise do Z"
```

### 4. Monitor and Synthesize

Don't just spawn and forget:

```
1. Spawn all agents
2. Track status in registry
3. As each completes, review output
4. Adjust remaining agents if needed
5. Synthesize all results
6. Identify next steps
```

## Common Patterns

### Pattern: Multi-Feature Fix

**When**: Bug affects multiple independent features

**Approach**:
```
Spawn N agents (one per feature) to:
- Investigate the issue in their feature
- Fix independently
- Verify their fix works
```

### Pattern: Exploratory Research

**When**: Need to understand multiple areas before planning

**Approach**:
```
Spawn N agents (one per area) to:
- Research their assigned area
- Document findings
- Identify integration points

Then synthesize to create comprehensive plan
```

### Pattern: Batch Testing

**When**: Multiple workflows need verification

**Approach**:
```
Spawn N test agents (one per workflow) to:
- Test their assigned workflow
- Capture screenshots
- Report results

Then synthesize to create comprehensive test report
```

### Pattern: Parallel Implementation

**When**: Multiple independent features to build

**Approach**:
```
Spawn N agents (one per feature) to:
- Implement their feature
- Test their implementation
- Document their work

Then integrate all features and test together
```

## What This Skill Does NOT Cover

- **Sequential workflows** (use standard agent spawning)
- **Dependent tasks** (spawn sequentially, not in parallel)
- **Single complex task** (spawn one focused agent)
- **Agent communication** (agents work independently)

This skill is for **independent parallel work** — multiple agents tackling separate tasks simultaneously.

## Quick Reference

```markdown
# Parallel spawn checklist:

[ ] Tasks are truly independent
[ ] Each task has clear scope and deliverable
[ ] Token cost justified by time savings
[ ] Safety preamble in every agent prompt
[ ] Agent registry will be updated
[ ] Result synthesis plan in place
[ ] Each agent has appropriate type
```
