---
description: Spawn the Ops Agent (System Optimizer) to review and implement system optimizations
---

# Spawn Ops Agent

<!-- Version: 1.0.0 | Last Updated: 2026-01-07 -->

> **Cost**: ~4× token usage for single agent spawn. Best used at end of sessions or when pending.yaml has 5+ items.

Spawn the Ops Agent (System Optimizer) to review and implement system optimizations.

## When to Use

Use this command when:
- End of a significant work session (to review accumulated opportunities)
- `pending.yaml` has 5+ unreviewed items
- User explicitly requests system optimization review
- Major friction observed that affects multiple agents
- You want to improve the agent system itself

## What Happens

1. Ops Agent loads:
   - `.context/optimizations/pending.yaml` (opportunities to review)
   - `.context/optimizations/README.md` (format reference)
   - `AGENTS.md` (system overview)
   - `.claude/agents/AGENT_PROTOCOL.md` (current protocols)

2. Ops Agent reviews pending optimizations:
   - Assesses impact and feasibility
   - Assigns priorities (P0-P3)
   - Groups into implementation batches

3. Ops Agent proposes improvements:
   - Presents prioritized recommendations
   - Explains rationale for each
   - Awaits user approval before implementing

4. On approval, Ops Agent implements:
   - Updates agent prompts, skills, or docs
   - Moves completed items to `implemented.yaml`
   - Notes any follow-up observations

## How to Delegate Work

```
@ops-agent: Review all pending optimizations and propose improvements

@ops-agent: Focus on frontend-agent optimizations only

@ops-agent: Implement the P0 and P1 items from your last review

@ops-agent: Create a new skill for [repeated workflow]
```

## What Ops Agent Can Do

| Action | Description |
|--------|-------------|
| Review optimizations | Assess and prioritize pending items |
| Create skills | New `.claude/commands/*.md` files |
| Update rules | Modify style guides, anti-patterns |
| Update protocols | Change AGENT_PROTOCOL.md, AGENTS.md |
| Create/update agents | New agents or agent prompt modifications |
| Process improvements | Workflow and tooling changes |

## What Ops Agent Does NOT Do

| Action | Who Does It |
|--------|-------------|
| Write application code | Frontend Agent, Implementation Agents |
| Implement features | Task-specific agents |
| Fix application bugs | Task-specific agents |
| Handle task work | Other specialized agents |

## Priority Framework

| Priority | When Assigned | Action |
|----------|---------------|--------|
| P0 - Critical | Causes errors, blocks work | Implement immediately |
| P1 - High | Frequent friction, low effort | Implement this session |
| P2 - Medium | Occasional issue | Queue for next session |
| P3 - Low | Nice-to-have, high effort | Track but don't rush |

## Integration with Other Agents

The Ops Agent reviews work from all agents:
- Frontend Agent captures UI/design system optimizations
- Doc Agent captures documentation gap opportunities
- Main Agent captures workflow and coordination opportunities

All captured in `.context/optimizations/pending.yaml`.

## Example Session

```
User: /spawn-ops-agent
Ops Agent: Ops Agent active. 7 pending optimizations found. Ready for review.

User: Review all pending optimizations
Ops Agent: [Presents prioritized list with recommendations]

User: Implement the top 3
Ops Agent: [Implements approved changes, updates implemented.yaml]
```

## Full Specification

See `.claude/agents/ops-agent.md` for the complete agent prompt.
