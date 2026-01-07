# Context Status

This skill helps agents understand current context usage and make intelligent decisions about spawning subagents, compacting context, or continuing inline.

## When to Use This Skill

**Use this skill when:**
- Starting a complex task
- Mid-session when feeling "heavy" or uncertain
- Before deciding whether to spawn a subagent
- User asks about context or performance
- After loading many large files
- Long conversation feels unwieldy

**Don't use this skill for:**
- Simple, single-file tasks
- Quick questions or clarifications
- Tasks already in progress (finish first, then check)

## What This Skill Does

Analyzes current context load and provides:
1. Estimated context usage level
2. List of loaded docs and files
3. Active subagents status
4. Actionable recommendation with reasoning

## Context Estimation Framework

### Context Signals

Track these indicators:

| Signal | Low | Medium | High | Critical |
|--------|-----|--------|------|----------|
| Conversation turns | <10 | 10-25 | 25-50 | >50 |
| Files loaded | <5 | 5-15 | 15-30 | >30 |
| Docs loaded | <3 | 3-7 | 7-12 | >12 |
| Active subagents | 0 | 1-2 | 3-4 | >4 |
| Large files (>500 lines) | 0-1 | 2-4 | 5-8 | >8 |
| Code blocks in response history | <10 | 10-25 | 25-50 | >50 |

### Overall Context Level Calculation

```
Low Context (0-30%):
- Few turns, few files, no/minimal subagents
- Fresh session, single feature work
- Continue inline comfortably

Medium Context (30-60%):
- Multiple turns, several files loaded
- 1-2 active subagents OR many docs loaded
- Monitor, but can continue inline for now
- Consider compacting if adding complexity

High Context (60-85%):
- Many turns, many files, multiple subagents
- Large conversation history
- RECOMMEND: compact before new major task
- RECOMMEND: spawn subagent for complex new work

Critical Context (85-100%):
- Conversation extremely long
- Many files/docs/subagents active
- Risk of degraded performance or context overflow
- MANDATORY: compact immediately OR spawn subagent
```

## Step-by-Step Process

### 1. Check Active Subagents

```bash
# Check agent registry
cat .context/agents/active.yaml
```

Count agents with `status: active` or `status: working`.

### 2. Estimate Loaded Resources

Mental checklist:
- How many files have I read this session?
- How many feature docs have I loaded?
- How many large code blocks have I generated?
- How many conversation turns have occurred?

### 3. Calculate Context Level

Use the framework above to determine: Low / Medium / High / Critical

### 4. Generate Recommendation

Based on context level and task type:

| Context Level | Simple Task | Medium Task | Complex Task |
|--------------|-------------|-------------|--------------|
| **Low** | Continue inline | Continue inline | Continue inline |
| **Medium** | Continue inline | Continue inline | Consider spawning subagent |
| **High** | Continue inline | Compact first OR spawn subagent | Spawn subagent |
| **Critical** | Compact first | Compact first, then spawn | Spawn subagent immediately |

**Task Complexity Heuristics:**

- **Simple**: Single file, single feature, clear scope
- **Medium**: 2-5 files, single feature with complexity, OR multiple related features
- **Complex**: 5+ files, cross-cutting concerns, high-risk areas, OR new major feature

## Output Format

When running `/context-status`, provide this structured report:

```markdown
## Context Status Report

### Estimated Context Usage: [LOW / MEDIUM / HIGH / CRITICAL]

**Overall**: [X%] of estimated context window

### Breakdown:
- Conversation turns: [count] → [signal level]
- Files loaded this session: [count] → [signal level]
- Docs loaded: [count] → [signal level]
- Active subagents: [count] → [signal level]
- Large files (>500 lines): [count] → [signal level]

### Loaded Resources:

**Files:**
- `path/to/file1.ts` (XXX lines)
- `path/to/file2.tsx` (XXX lines)
- ...

**Docs:**
- `docs/features/feature-name.md`
- `docs/workflows/workflow-name.md`
- ...

**Active Subagents** (from `.context/agents/active.yaml`):
- doc-agent: [status] - [task]
- frontend-agent: [status] - [task]
- [none if no active agents]

### Recommendation:

[CONTINUE INLINE / COMPACT FIRST / SPAWN SUBAGENT]

**Reasoning:**
[2-3 sentences explaining why this is the right choice based on context level and upcoming task]

**Next Steps:**
1. [Specific action to take]
2. [If applicable: which subagent to spawn or run /compact]
3. [Continue with task]
```

## Decision Matrix

Use this to generate the recommendation:

### Continue Inline

**When:**
- Context is Low or Medium
- Task is simple or medium complexity
- No high-risk areas involved
- Current work can be completed quickly

**Example:**
```
Context: Medium (40%)
Task: Fix styling on single component
Recommendation: CONTINUE INLINE
Reasoning: Simple task, single file, no high-risk concerns.
Context usage is manageable.
```

### Compact First

**When:**
- Context is High or Critical
- But task is relatively simple
- OR need to continue in current flow but context is heavy
- User wants to stay in current session

**Example:**
```
Context: High (70%)
Task: Add new field to existing form
Recommendation: COMPACT FIRST
Reasoning: Context is heavy from previous work, but this task is
straightforward. Compacting will free space for clean implementation.
Next: Run /compact, then proceed inline.
```

### Spawn Subagent

**When:**
- Context is High or Critical AND task is medium/complex
- Task touches multiple features or high-risk areas
- Task requires fresh context and focused work
- Better isolation desired

**Example:**
```
Context: High (75%)
Task: Refactor server actions across multiple features
Recommendation: SPAWN SUBAGENT
Reasoning: Context is heavy, task is complex and cross-cutting.
Fresh subagent will have clean context and focused scope.
Next: Spawn appropriate subagent with clear scope.
```

## Integration with Other Skills

### With `/compact`
```
If recommendation is "COMPACT FIRST", next action:
→ Run /compact to compress context
→ Then continue with task inline
```

### With Agent Spawning
```
If recommendation is "SPAWN SUBAGENT", next action:
→ Determine which agent (Frontend, Doc, Test, or generic sub-agent)
→ Prepare spawn prompt with safety preamble
→ Spawn agent with clear scope
```

### With `/handoff`
```
At end of session:
→ Run /context-status to assess state
→ Include context level in handoff note
→ Recommend whether next session should start fresh
```

## Example: Using Context Status Mid-Session

**Scenario**: User asks for a new feature after several tasks completed.

**Agent Process:**
```
1. Run /context-status mentally:
   - Turns: ~20 → Medium
   - Files: 8 → Medium
   - Docs: 5 → Medium
   - Subagents: 1 active → Low
   - Overall: Medium (50%)

2. Assess new task:
   - "Add bookmark functionality to course player"
   - Complexity: Medium-High (UI + server action + database)
   - Risk: Medium (touches existing feature)

3. Generate recommendation:
   Context: Medium (50%)
   Task: Medium-High complexity
   Recommendation: SPAWN SUBAGENT
   Reasoning: While context isn't critical, this task is complex
   enough that a focused subagent will produce better results with
   cleaner isolation. Frontend Agent is appropriate here.

4. Communicate to user:
   "I'll spawn the Frontend Agent to handle this. Current context
   is at medium usage, and this task involves UI + backend work
   that will benefit from focused attention."

5. Proceed with spawn.
```

## What This Skill Does NOT Cover

- **Fixing context issues** (that's handled by /compact or spawning)
- **Deciding which specific subagent to use** (that's agent selection logic)
- **Managing subagent lifecycle** (that's the agent registry)
- **Compacting automatically** (always explicit with /compact)

This skill is for **assessment and recommendation** — helping you make informed decisions about how to proceed.

## Quick Reference

```bash
# Check context before deciding on approach
/context-status

# Common outcomes:
# → "Continue inline" - just proceed with task
# → "Compact first" - run /compact, then continue
# → "Spawn subagent" - spawn appropriate agent for task
```

## Best Practices

1. **Check context at natural breakpoints**: After completing a task, before starting a new one
2. **Trust the signals**: If context feels heavy, it probably is
3. **Don't wait for Critical**: Act at High to prevent degradation
4. **Spawning is not expensive**: Better isolation often produces better results
5. **Document heavy sessions**: Note context level in handoff for next agent

## Mental Shortcuts

**Quick self-assessment without full skill:**

```
Ask yourself:
- Have I been working for a while? → Probably Medium+
- Do I have many files/docs loaded? → Probably Medium+
- Am I about to do something complex? → Check formally
- Do I feel uncertain or "heavy"? → Check formally
```

If any of these are true, run `/context-status` formally before proceeding.
