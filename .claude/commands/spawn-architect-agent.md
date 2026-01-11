---
description: Spawn the Architect Agent (System Designer) for architecture and design decisions
---

# Spawn Architect Agent

<!-- Version: 1.0.0 | Last Updated: 2026-01-10 -->

> **Cost**: ~4× token usage. Uses **Opus** model for critical architecture decisions.

Spawn the Architect Agent (System Designer) to handle system design, refactoring strategy, and architectural decisions.

## When to Use

Use this command for architecture work:
- Designing new features or systems
- Planning major refactoring
- Evaluating design patterns
- Analyzing technical debt
- Defining component boundaries
- Making structural decisions

## When NOT to Use

Skip the Architect Agent ONLY when ALL are true:
- Simple, isolated change
- No structural implications
- Clear existing pattern to follow
- No cross-component impact

### Examples: Skip Architect Agent

| Task | Why Skip |
|------|----------|
| "Add a field to this form" | Single component, existing pattern |
| "Fix this bug" | Not architectural |
| "Update text content" | No design decisions |

### Examples: DO NOT Skip Architect Agent

| Task | Why Spawn |
|------|-----------|
| "Design the new analytics dashboard" | New system design |
| "Refactor the course player" | Major structural change |
| "How should we structure permissions?" | Architecture decision |
| "Add a new entity type to the system" | Data model design |

## What Happens

1. Architect Agent spawns with **Opus** model and:
   - Loads feature docs for context
   - Queries Research Agent for current state
   - Identifies constraints and invariants

2. For each design question:
   - Generates 2-3 design options
   - Documents trade-offs
   - Recommends preferred approach
   - Defines implementation order

3. Returns architecture document with:
   - Design options and trade-offs
   - Recommended approach with rationale
   - Implementation plan
   - Affected components

## How to Delegate Work

```
@architect-agent: Design the architecture for the new reporting system

@architect-agent: What's the best approach to refactor the course enrollment flow?

@architect-agent: Should we use server actions or API routes for this use case?

@architect-agent: Review the current auth architecture and suggest improvements
```

## Coordination

After the Architect Agent provides a design:
- **Frontend Agent** implements UI portions
- **Backend Agent** implements server-side portions
- **Security Agent** reviews security implications
- **Test Agent** verifies implementation matches design

## Expected Output Format

```
## Architecture Analysis: [Topic]

### Problem Statement
[What we're solving]

### Design Options
#### Option A: [Name]
- Pros/Cons/Effort/Risk

#### Option B: [Name]
- Pros/Cons/Effort/Risk

### Recommendation
**Preferred**: Option X
**Rationale**: [Why]

### Implementation Plan
1. [Step 1]
2. [Step 2]

### Affected Components
- [Component]: [Impact]
```

## Full Specification

See `.claude/agents/architect-agent.md` for the complete agent prompt.
