---
description: Analyze session performance and create process improvements. Use at end of sessions to drive continuous improvement.
---

# Analyze Session

<!-- Version: 1.0.0 | Last Updated: 2026-01-10 -->

> **Cost**: ~4× token usage. Uses **Opus** model for deep analysis.

Spawn the Workflow Analysis Agent to analyze session performance and drive process improvements.

## When to Use

Use this command:
- At the **end of a work session** (after `/handoff`)
- After a **particularly challenging session** (to learn from friction)
- After a **particularly smooth session** (to reinforce what worked)
- **Periodically** to maintain system health

## What Happens

### Phase 1: Data Collection
The agent loads:
- `.context/handoff.md` — Session summary
- `.context/checkpoints/` — Session milestones
- `.context/optimizations/pending.yaml` — Captured opportunities
- Git history — What changed this session
- Agent protocol — Current system understanding

### Phase 2: Performance Analysis
Evaluates session across dimensions:
- **Task Routing**: Were right agents spawned?
- **Context Management**: Was context protected?
- **Documentation**: Were docs used effectively?
- **Coordination**: Did agents work well together?
- **Tool Usage**: Were tools used appropriately?
- **Error Handling**: Were issues resolved efficiently?

### Phase 3: Improvement Planning
For each friction point identified:
- Classifies type (skill/agent/protocol/doc)
- Assesses impact and frequency
- Proposes specific solution
- Prioritizes (P0-P3)

### Phase 4: User Presentation
Presents to you:
- Session performance summary
- Friction points with evidence
- Prioritized improvement plan
- Awaits your approval

### Phase 5: Implementation (If Approved)
After your approval:
- Implements approved changes
- Updates relevant documentation
- Coordinates with Ops Agent if needed

### Phase 6: Documentation
Creates session analysis document in:
`.context/workflow-analysis/YYYY-MM-DD-session-N.md`

Updates the INDEX.md with session entry.

## Approval Options

When presented with the improvement plan, you can:

| Response | Effect |
|----------|--------|
| "approve" | Implement all proposed changes |
| "approve P0 only" | Implement only critical changes |
| "approve P0 and P1" | Implement critical and high priority |
| "modify: [specifics]" | Adjust plan, then implement |
| "reject" | Skip implementation, document analysis only |

## Example Interaction

```
User: /analyze

Agent: ## Session Workflow Analysis

### Session Overview
- **Date**: 2026-01-10
- **Duration**: ~2 hours
- **Primary Work**: System optimization
- **Agents Used**: Research, Doc, Ops
- **Outcome**: Success

### Performance Summary
| Dimension | Rating | Notes |
|-----------|--------|-------|
| Task Routing | ⭐⭐⭐⭐⭐ | Good agent selection |
| Context Mgmt | ⭐⭐⭐⭐☆ | One /remember needed |

### Friction Points Identified

#### 1. No auto-routing for task types (P1)
- **Description**: Manual agent selection required
- **Impact**: Extra orchestrator decisions
- **Proposed**: task-router skill already exists, ensure it's used

### Improvement Plan
| # | Change | Type | Effort |
|---|--------|------|--------|
| 1 | Add task-router to session-start | protocol | Trivial |

**Awaiting your approval to proceed.**

User: approve

Agent: Implementing approved changes...
[Makes changes]

Session analysis documented in:
.context/workflow-analysis/2026-01-10-session-1.md
```

## Output Location

All analysis documents are stored in:
```
.context/workflow-analysis/
├── INDEX.md                    ← Session index
├── 2026-01-10-session-1.md    ← Session analysis
├── 2026-01-10-session-2.md    ← Another session
└── patterns/
    └── recurring-issues.md     ← Cross-session patterns
```

## Relationship to Other Commands

| Command | Purpose | When |
|---------|---------|------|
| `/handoff` | Document session for next session | Before `/analyze` |
| `/analyze` | Analyze and improve process | After `/handoff` |
| `/spawn-ops-agent` | Review pending.yaml opportunities | Anytime |

**Recommended flow**:
```
[End of session]
     │
     ▼
/handoff ──────► Document what was done
     │
     ▼
/analyze ──────► Analyze and improve
```

## Differences from Ops Agent

| Aspect | Workflow Analysis Agent | Ops Agent |
|--------|------------------------|-----------|
| **Trigger** | `/analyze` command | `/spawn-ops-agent` |
| **Input** | Entire session data | `pending.yaml` only |
| **Scope** | Holistic performance | Captured opportunities |
| **Timing** | End of session | Anytime |
| **Output** | Session analysis doc | Implemented changes |

Both agents contribute to system improvement but from different angles.

## Full Specification

See `.claude/agents/workflow-analysis-agent.md` for the complete agent prompt.
