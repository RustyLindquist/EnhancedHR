# Agent Architecture

> **Feature ID**: `agent-architecture`
> **Status**: Active
> **Last Updated**: 2026-01-04

## Overview

EnhancedHR.ai uses a multi-agent architecture for development coordination. This is a meta-system: it doesn't implement application features, but enables efficient, consistent, and self-improving development of those features.

The system is designed for **continuous self-optimization** — agents not only complete tasks but also identify opportunities to improve the system itself.

## Agents

### Main Agent (Orchestrator)
- **Role**: Receives user requests, plans tasks, coordinates sub-agents
- **Always Active**: Present in every session
- **Responsibilities**:
  - Evaluate task complexity
  - Decide which agents to spawn
  - Coordinate multi-agent work
  - Capture system-level optimization opportunities

### Documentation Agent (Living Canon)
- **Role**: Authoritative source of documented knowledge
- **Prompt Location**: `.claude/agents/doc-agent.md`
- **Key Behaviors**:
  - Lazily loads feature docs as needed
  - Answers queries about invariants, features, and constraints
  - Validates plans against documented requirements
  - Identifies documentation gaps

### Frontend Agent (Design System Guardian)
- **Role**: Owns all UI implementation work
- **Prompt Location**: `.claude/agents/frontend-agent.md`
- **Key Behaviors**:
  - Maintains STYLE_GUIDE.md and COMPONENT_INDEX.md
  - Checks component inventory before creating new
  - Validates work against design tokens
  - Documents new patterns as discovered

### Ops Agent (System Optimizer)
- **Role**: Meta-agent that improves the agent system itself
- **Prompt Location**: `.claude/agents/ops-agent.md`
- **Key Behaviors**:
  - Reviews optimization opportunities from all agents
  - Prioritizes improvements (P0-P3)
  - Proposes changes to user
  - Implements approved system improvements
  - Coordinates with Doc Agent for documentation

## Skills and Commands

Skills are executable playbooks available via slash commands in `.claude/commands/`:

### Core Skills
| Command | Purpose |
|---------|---------|
| `/doc-discovery` | Load relevant docs before planning |
| `/plan-lint` | Validate plan against doc constraints |
| `/doc-update` | Update docs after code changes |
| `/drift-check` | Detect doc/code mismatches |
| `/test-from-docs` | Generate test plan from feature docs |
| `/handoff` | Write handoff note for session end |

### Agent Spawn Commands
| Command | Purpose |
|---------|---------|
| `/spawn-doc-agent` | Spawn Documentation Agent |
| `/spawn-frontend-agent` | Spawn Frontend Agent |
| `/spawn-ops-agent` | Spawn Ops Agent for system optimization |

### Frontend Skills
Located in `.claude/commands/frontend/`:
| Command | Purpose |
|---------|---------|
| `/frontend/component-inventory` | Check what components exist |
| `/frontend/style-discovery` | Find patterns in codebase |
| `/frontend/style-documentation` | Document discovered patterns |
| `/frontend/new-style-creation` | Create following design system |
| `/frontend/style-validation` | Validate against design tokens |

## Self-Optimization System

### How It Works

1. **Agents identify opportunities** during normal task execution
2. **Opportunities are captured** in `.context/optimizations/pending.yaml`
3. **Ops Agent reviews** and prioritizes opportunities
4. **User approves** high-value improvements
5. **Ops Agent implements** approved changes
6. **Doc Agent documents** the changes

### Optimization Types

| Type | What Changes | Examples |
|------|-------------|----------|
| `skill` | New command file | Modal builder, API pattern |
| `rule` | Doc update | Style guide rule, anti-pattern |
| `doc` | Documentation | Component doc, feature doc |
| `protocol` | Agent coordination | Spawn criteria, workflow |
| `agent` | Agent modification | New agent, prompt update |
| `process` | Tooling/workflow | Validation step, handoff |

### User Statement Detection

All agents actively watch for user statements that imply rules:
- "we always..." / "we never..."
- "the rule is..." / "the pattern is..."
- "from now on..." / "going forward..."
- Any correction that implies a broader principle

When detected:
1. Complete the immediate task
2. Capture the optimization in `pending.yaml`
3. Continue work (don't ask for permission to capture)

### Optimization Capture Format

```yaml
- id: "OPT-YYYY-MM-DD-NNN"
  type: skill | rule | doc | protocol | agent | process
  source_agent: frontend-agent | doc-agent | main-agent | ops-agent
  timestamp: "ISO-8601"
  trigger: "What prompted this"
  observation: "What was noticed"
  proposal: "What should change"
  impact: "Why it matters"
  frequency: one-time | occasional | frequent | constant
  effort: trivial | small | medium | large
  priority: null  # Set by Ops Agent
  status: pending
```

## Data Model

### File Locations

| Path | Purpose |
|------|---------|
| `AGENTS.md` | Root protocol doc, read by all agents |
| `.claude/agents/*.md` | Agent system prompts |
| `.claude/commands/*.md` | Skill/command definitions |
| `.context/optimizations/` | Optimization capture directory |
| `docs/frontend/` | Frontend style system docs |
| `docs/features/` | Feature documentation |

### Optimization Files

| File | Purpose |
|------|---------|
| `.context/optimizations/pending.yaml` | Unreviewed opportunities |
| `.context/optimizations/implemented.yaml` | Completed optimizations |
| `.context/optimizations/README.md` | Format reference |

## Invariants

### Agent Spawn Rules
1. Doc Agent MUST be spawned when task touches: server actions, DB, AI, auth, billing, or spans 2+ features
2. Doc Agent MUST be spawned when: new agent/skill/command created, or process/protocol changes
3. Frontend Agent MUST be spawned for any UI work beyond text changes
4. Ops Agent spawned on-demand for system optimization review

### Documentation Requirements
1. Every system change MUST be documented
2. Ops Agent MUST coordinate with Doc Agent for documentation
3. Optimizations are not complete until documented

### Meta-Cognition Rules
1. All agents MUST watch for optimization opportunities
2. User general statements MUST be captured as potential rules
3. Captured optimizations go to `pending.yaml` without asking permission
4. Only Ops Agent can prioritize and propose implementation

## Integration Points

### With All Features
- Doc Agent queries feature docs for any feature
- Frontend Agent maintains UI consistency across all features
- Ops Agent can improve any part of the system

### With AGENTS.md
- Root protocol document
- All agents read this on initialization
- Updated by Ops Agent for protocol changes

### With docs/features/FEATURE_INDEX.md
- Doc Agent uses for feature identification
- Cross-references for coupling analysis

## Testing Checklist

### Agent Spawning
- [ ] Doc Agent spawns for complex tasks
- [ ] Frontend Agent spawns for UI work
- [ ] Ops Agent spawns on command

### Optimization Capture
- [ ] Agents capture opportunities in pending.yaml
- [ ] Format is valid YAML
- [ ] Required fields are present

### Ops Agent Workflow
- [ ] Reviews pending optimizations
- [ ] Assigns priorities correctly
- [ ] Coordinates with Doc Agent for documentation
- [ ] Moves completed items to implemented.yaml

## Implementation Guidance

**Primary Agent**: Ops Agent (system changes, optimization)
**Secondary Agent**: Doc Agent (documentation coordination)

**Skills to Use**:
- `/doc-update` — Update agent and skill documentation
- `/handoff` — Document system changes at session end
- `/capture-optimization` — Record improvement opportunities

**Key Invariants**:
- Every system change must be documented
- Ops Agent coordinates with Doc Agent for documentation
- User general statements must be captured as potential rules

**Optimization Guide**: `docs/engine/AGENT_SYSTEM_OPTIMIZATION.md`

For comprehensive optimization sessions (analysis, restructuring, verification), consult the optimization guide. It contains:
- Full system architecture overview
- Optimization methodology and verification procedures
- Skill system architecture patterns
- Agent prompt architecture requirements
- Success metrics and measurement procedures

## Related Documentation

- `AGENTS.md` — Root agent protocol
- `.claude/agents/AGENT_PROTOCOL.md` — Detailed coordination rules
- `.claude/agents/doc-agent.md` — Doc Agent prompt
- `.claude/agents/frontend-agent.md` — Frontend Agent prompt
- `.claude/agents/ops-agent.md` — Ops Agent prompt
- `.context/optimizations/README.md` — Optimization capture guide
- `docs/engine/AGENT_SYSTEM_OPTIMIZATION.md` — System optimization guide
