---
description: Spawn the Documentation Agent (Living Canon) as a persistent knowledge source
---

# Spawn Documentation Agent

<!-- Version: 1.0.0 | Last Updated: 2026-01-07 -->

> **Cost**: ~4× token usage for single agent spawn. Doc Agent is efficient—loads docs lazily and retains them for the session.

Spawn the Documentation Agent (Living Canon) to serve as a persistent knowledge source for this work session.

## When to Use

Use this command when ANY of these are true:
- Task touches server actions, database, or schema
- Task touches AI/context/prompts
- Task is a bug fix (not just styling)
- Task spans 2+ features
- Task touches auth/RLS/permissions
- Task touches billing/payments
- You're uncertain about scope or impact

## When NOT to Use

Skip the Doc Agent ONLY when ALL of these are true:
- Pure styling/CSS change (e.g., "Make the button blue")
- Single-file, single-feature change
- No server/DB involvement
- No AI behavior changes
- Change is entirely frontend presentation

### Examples: Skip Doc Agent

| Task | Why Skip |
|------|----------|
| "Change button color from blue to green" | Pure CSS, single component |
| "Add tooltip to the save button" | Single UI element, no logic |
| "Fix typo in header text" | Content only, no code |
| "Add hover state to card" | Styling only |

### Examples: DO NOT Skip Doc Agent

| Task | Why Spawn |
|------|-----------|
| "Fix bug where save button doesn't work" | Bug fix = need to understand intended behavior |
| "Add a new button that calls an API" | Touches server action |
| "Change how the card displays progress" | May touch multiple features |
| "Fix the collection dropdown" | Collections is high-coupling feature |

**When in doubt, spawn.** Over-spawning is safe; under-spawning causes regressions.

## What Happens

1. A new Doc Agent is spawned in the background
2. It immediately loads `docs/features/FEATURE_INDEX.md`
3. It announces readiness and waits for queries
4. It remains active for the duration of the session

## How to Query

Once spawned, query the Doc Agent with:

```
@doc-agent: What features does [description] touch?
@doc-agent: What are the invariants for [feature]?
@doc-agent: Does this plan violate any constraints? [plan]
@doc-agent: Can I change X without breaking Y?
```

## Doc Agent Capabilities

| Query Type | What You Get |
|------------|--------------|
| Feature identification | Primary + impacted features, risk levels |
| Invariant extraction | Non-negotiable rules from feature docs |
| Plan validation | PASS or WARN with specific concerns |
| Data model queries | Tables, permissions, RLS notes |
| Test scope | Testing checklist from docs |
| Integration points | How features connect |

## Session Lifecycle

- Doc Agent builds knowledge incrementally as you query
- Loaded docs are retained for the session
- Knowledge doesn't persist to next session (but docs do)

## Full Specification

See `.claude/agents/doc-agent.md` for the complete agent prompt.
See `.claude/agents/AGENT_PROTOCOL.md` for multi-agent coordination.
