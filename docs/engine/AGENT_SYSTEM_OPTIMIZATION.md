# Agent System Optimization Guide

This document provides comprehensive guidance for analyzing, optimizing, and maintaining the EnhancedHR.ai multi-agent system. Use this guide when conducting system-wide optimization sessions or when making significant changes to the agent architecture.

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Optimization Methodology](#optimization-methodology)
3. [Skill System Architecture](#skill-system-architecture)
4. [Agent Prompt Architecture](#agent-prompt-architecture)
5. [Documentation Connectivity](#documentation-connectivity)
6. [Context Management Infrastructure](#context-management-infrastructure)
7. [Verification Procedures](#verification-procedures)
8. [Success Metrics](#success-metrics)
9. [Future Optimization Opportunities](#future-optimization-opportunities)
10. [Running an Optimization Session](#running-an-optimization-session)

---

## System Architecture Overview

### Component Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MULTI-AGENT SYSTEM                                 │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         ORCHESTRATOR                                 │    │
│  │                    (Main Agent / CLAUDE.md)                          │    │
│  │                                                                      │    │
│  │  Responsibilities:                                                   │    │
│  │  - Plan and coordinate work                                          │    │
│  │  - Delegate to specialized agents                                    │    │
│  │  - Synthesize results                                                │    │
│  │  - Manage context and session state                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                    ┌───────────────┼───────────────┐                        │
│                    ▼               ▼               ▼                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     SPECIALIZED AGENTS                               │    │
│  │                                                                      │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │    │
│  │  │ Frontend │ │ Backend  │ │ Research │ │   Doc    │               │    │
│  │  │  Agent   │ │  Agent   │ │  Agent   │ │  Agent   │               │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │    │
│  │                                                                      │    │
│  │  ┌──────────┐ ┌──────────┐                                          │    │
│  │  │   Test   │ │   Ops    │                                          │    │
│  │  │  Agent   │ │  Agent   │ ◄── System optimizer                     │    │
│  │  └──────────┘ └──────────┘                                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                    ┌───────────────┼───────────────┐                        │
│                    ▼               ▼               ▼                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                          SKILLS                                      │    │
│  │                    (.claude/skills/*)                                │    │
│  │                                                                      │    │
│  │  Documentation:     Session:          Testing:                       │    │
│  │  - doc-discovery    - session-start   - test-from-docs              │    │
│  │  - plan-lint        - checkpoint                                     │    │
│  │  - doc-update       - compact                                        │    │
│  │  - drift-check      - handoff                                        │    │
│  │                     - remember                                       │    │
│  │                     - context-status                                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                    ┌───────────────┼───────────────┐                        │
│                    ▼               ▼               ▼                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                       DOCUMENTATION                                  │    │
│  │                                                                      │    │
│  │  Feature Docs:           Foundation Docs:        Engine Docs:        │    │
│  │  docs/features/*.md      docs/foundation/*.md    docs/engine/*.md    │    │
│  │                                                                      │    │
│  │  Workflow Docs:          Agent Docs:                                 │    │
│  │  docs/workflows/*.md     .claude/agents/*.md                         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      CONTEXT STATE                                   │    │
│  │                       (.context/)                                    │    │
│  │                                                                      │    │
│  │  handoff.md              agents/active.yaml                          │    │
│  │  notes.md                optimizations/pending.yaml                  │    │
│  │  todos.md                checkpoints/*.md                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### File Locations

| Component | Location | Purpose |
|-----------|----------|---------|
| Orchestrator instructions | `CLAUDE.md` | Core agent behavior |
| Agent prompts | `.claude/agents/*.md` | Specialized agent definitions |
| Skills | `.claude/skills/*/SKILL.md` | Reusable capabilities |
| Commands | `.claude/commands/*.md` | Slash command definitions |
| Feature docs | `docs/features/*.md` | Feature documentation |
| Foundation docs | `docs/foundation/*.md` | Cross-cutting concerns |
| Engine docs | `docs/engine/*.md` | System protocols |
| Context state | `.context/` | Session state and optimizations |

---

## Optimization Methodology

### Core Principles

1. **Progressive Disclosure**: Load minimal context upfront; detailed content on-demand
2. **One Level Deep**: References from SKILL.md → reference files (never A→B→C)
3. **Agent-Skill Connectivity**: Every agent knows which skills to invoke when
4. **Documentation as Source of Truth**: Agents consult docs before acting
5. **Context Efficiency**: Minimize token usage while maximizing effectiveness

### The Optimization Loop

```
┌─────────────────────────────────────────────────────────────────┐
│                    OPTIMIZATION CYCLE                            │
│                                                                  │
│  1. ANALYZE                                                      │
│     └─► Measure current state (tokens, bytes, patterns)          │
│     └─► Identify bloat, gaps, friction points                    │
│     └─► Research best practices                                  │
│                                                                  │
│  2. PLAN                                                         │
│     └─► Create optimization plan with phases                     │
│     └─► Define success metrics and targets                       │
│     └─► Identify verification procedures                         │
│                                                                  │
│  3. IMPLEMENT                                                    │
│     └─► Execute changes phase by phase                           │
│     └─► Document as you go                                       │
│     └─► Create reference files for extracted content             │
│                                                                  │
│  4. VERIFY                                                       │
│     └─► Run verification tests                                   │
│     └─► Measure against success metrics                          │
│     └─► Document results                                         │
│                                                                  │
│  5. ITERATE                                                      │
│     └─► Identify remaining opportunities                         │
│     └─► Plan next optimization cycle                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Skill System Architecture

### Directory Structure

```
.claude/skills/
├── SKILLS_INDEX.md              ← Discovery index with decision tree
│
├── [skill-name]/
│   ├── SKILL.md                 ← Core instructions (<500 lines)
│   └── reference/               ← Detailed content (loaded on-demand)
│       ├── templates.md         ← Full templates
│       ├── examples.md          ← Detailed examples
│       └── [domain-specific].md ← Domain reference
```

### SKILL.md Structure (Optimized)

```markdown
---
name: skill-name
description: Third-person description with trigger keywords. Use when [conditions].
allowed-tools: Read, Write, Bash
---

# Skill Name

[1-2 sentence purpose statement]

## When to Use

- [Trigger condition 1]
- [Trigger condition 2]
- [Trigger condition 3]

## Process

1. [Step 1]
2. [Step 2]
3. [Step 3]

## Output

[Brief output format description]

## Related

- [Reference 1]: See [reference/file1.md](reference/file1.md)
- [Reference 2]: See [reference/file2.md](reference/file2.md)
- Related skill: `/other-skill`
```

### Key Optimization Rules

| Rule | Rationale |
|------|-----------|
| SKILL.md < 500 lines | Minimize always-loaded tokens |
| Third-person descriptions | Required for skill discovery |
| Include trigger keywords | Improves skill matching |
| One level deep references | Prevents partial file reads |
| Templates in reference/ | Load only when needed |

### Skill Categories

**Documentation Skills**:
- `doc-discovery` — Load docs before planning
- `plan-lint` — Validate plan against constraints
- `doc-update` — Update docs after changes
- `drift-check` — Detect doc/code mismatches

**Session Management Skills**:
- `session-start` — Resume from previous session
- `checkpoint` — Save mid-session state
- `compact` — Compress context when full
- `handoff` — End-of-session summary
- `remember` — Refresh instructions when degraded
- `context-status` — Check context health

**Testing Skills**:
- `test-from-docs` — Generate tests from documentation

---

## Agent Prompt Architecture

### Required Sections

Every agent prompt MUST include:

1. **Safety Rules** — Reference to SAFETY_RULES.md
2. **Role Definition** — What the agent does and doesn't do
3. **Available Skills** — Skills the agent can invoke
4. **Skill Invocation Protocol (MANDATORY)** — When to invoke skills
5. **Initialization** — What to do when spawned
6. **Core Workflow** — Step-by-step process
7. **Output Format** — How to return results

### Skill Invocation Protocol Template

```markdown
## Skill Invocation Protocol (MANDATORY)

**CRITICAL**: You MUST run specific skills at specific points. This is not optional.

### Pre-Work (BEFORE any [work type])

1. **Always run `/skill-1`** first
   - [Reason]
   - [What it provides]

2. **If [condition]** → run `/skill-2`
   - [When to use]

### During Work

3. **Use `/skill-3`** when [condition]
   - [Purpose]

### Post-Work (BEFORE returning to Main Agent)

4. **Always run `/skill-4`** if [condition]
   - [What it updates]

5. **Always run `/skill-5`**
   - [Final verification]

### Workflow Enforcement Summary

| Phase | Skill | Required? |
|-------|-------|-----------|
| Pre-Work | `/skill-1` | ALWAYS |
| Pre-Work | `/skill-2` | If [condition] |
| During | `/skill-3` | When [condition] |
| Post-Work | `/skill-4` | If behavior changed |
| Post-Work | `/skill-5` | ALWAYS |
```

### Agent-Specific Skill Maps

| Agent | Pre-Work | During | Post-Work |
|-------|----------|--------|-----------|
| **Frontend** | component-inventory, style-discovery | new-style-creation | style-validation, style-documentation |
| **Backend** | doc-discovery, query @doc-agent | supabase/safe-sql | doc-update, drift-check |
| **Research** | doc-discovery | capture-optimization | Report doc gaps |
| **Test** | test-from-docs | browser-use | Report results |
| **Doc** | — | Query features, validate plans | — |
| **Ops** | Load pending.yaml | Query @doc-agent | doc-update, handoff |

---

## Documentation Connectivity

### FEATURE_INDEX.md Structure

The feature index provides agent routing:

```markdown
| Feature Name | Feature ID | Risk | Primary Agent | Key Skills | Coupling Notes | Doc Status |
|--------------|------------|------|---------------|------------|----------------|------------|
| Feature X | feature-x | High | Backend | doc-discovery, plan-lint | Coupled to Y, Z | Exists |
```

**Required Columns**:
- **Primary Agent**: Which agent handles this feature
- **Key Skills**: Which skills to use for this feature
- **Risk**: High/Medium/Low (determines skill requirements)

### Implementation Guidance Section

Every high-risk feature doc should include:

```markdown
## Implementation Guidance

**Primary Agent**: [Agent] ([specific responsibilities])
**Secondary Agent**: [Agent if applicable]

**Skills to Use**:
- `/doc-discovery` — [Feature-specific reason]
- `/plan-lint` — [What to validate]
- `/test-from-docs` — [What to test]

**Key Invariants**:
- [Invariant 1 from doc]
- [Invariant 2 from doc]
- [Invariant 3 from doc]

**Related Workflows**: [Path to workflow doc]
```

### Foundation Docs

Cross-cutting concerns that affect multiple features:

| Doc | Purpose | Location |
|-----|---------|----------|
| auth-roles-rls.md | Auth patterns, RLS, admin client | `docs/foundation/` |
| supabase-schema-and-migrations.md | Migration workflow, safe SQL | `docs/foundation/` |

---

## Context Management Infrastructure

### .context/ Directory Structure

```
.context/
├── handoff.md                 ← Session continuity (populated by /handoff)
├── notes.md                   ← Working notes
├── todos.md                   ← Task tracking
│
├── agents/
│   └── active.yaml            ← Track spawned agents
│
├── optimizations/
│   └── pending.yaml           ← Captured improvement opportunities
│
└── checkpoints/
    ├── INDEX.md               ← Checkpoint index
    └── checkpoint-*.md        ← Point-in-time saves
```

### Session State Files

**handoff.md** — End-of-session summary:
```markdown
# Session Handoff — [Date]

## Objective
[What the session was working on]

## Completed
- [x] Item 1
- [x] Item 2

## Remaining
- [ ] Item 3

## Key Decisions
- Decision: Rationale

## Files Modified
- `path/to/file`: Description
```

**pending.yaml** — Optimization opportunities:
```yaml
optimizations:
  - id: "OPT-2026-01-10-001"
    type: skill | rule | doc | protocol | agent
    source_agent: [agent name]
    trigger: "What prompted this"
    proposal: "What should change"
    impact: "Why it matters"
    priority: P0 | P1 | P2 | P3
    status: pending | in_progress | implemented | rejected
```

---

## Verification Procedures

### 1. Token Reduction Verification

```bash
# Measure SKILL.md files
find .claude/skills -name "SKILL.md" -exec wc -c {} + | tail -1

# Measure reference files
find .claude/skills -path "*/reference/*" -name "*.md" -exec wc -c {} + | tail -1

# Calculate reduction
# Original baseline: ~106KB
# Target: 50% reduction in SKILL.md files
```

**Success Criteria**: SKILL.md total < 50% of baseline

### 2. Agent-Skill Integration Testing

Verify each agent has:
```bash
# Check for Skill Invocation Protocol
grep -l "Skill Invocation Protocol" .claude/agents/*.md

# Verify required skills mentioned
grep -E "doc-discovery|doc-update|drift-check" .claude/agents/backend-agent.md
```

**Success Criteria**: All 6 agents have mandatory skill protocols

### 3. Documentation Connectivity Testing

```bash
# Check for Implementation Guidance in feature docs
for doc in docs/features/*.md; do
  grep -l "## Implementation Guidance" "$doc" 2>/dev/null
done

# Verify FEATURE_INDEX has agent routing
grep -E "Primary Agent|Key Skills" docs/features/FEATURE_INDEX.md
```

**Success Criteria**: High-risk features have Implementation Guidance

### 4. Session Continuity Testing

```bash
# Verify .context/ structure
ls -la .context/
ls -la .context/agents/
ls -la .context/optimizations/

# Verify templates exist
head -20 .context/handoff.md
```

**Success Criteria**: All context files exist with templates

---

## Success Metrics

### Quantitative Metrics

| Metric | How to Measure | Target |
|--------|----------------|--------|
| SKILL.md tokens | `wc -c` on all SKILL.md | < 25KB |
| Reference file tokens | `wc -c` on reference/* | Reasonable (30-50KB) |
| Skills with reference dirs | `ls -d .claude/skills/*/reference` | 11/11 |
| Agents with skill protocols | `grep` for protocol section | 6/6 |
| Feature docs with guidance | `grep` for Implementation Guidance | 10+ high-risk |
| Foundation docs | `ls docs/foundation/` | 2+ |

### Qualitative Metrics

- Agents consistently invoke required skills
- Documentation stays in sync with code
- Session handoffs enable continuity
- Context management prevents degradation
- Optimization opportunities are captured

---

## Future Optimization Opportunities

### Phase 9 Items (Not Yet Implemented)

1. **Workflow Verification Skill** (`/workflow-verify`)
   - Verify code changes haven't broken documented workflows
   - Bridge between feature docs and workflow docs

2. **Skill Chaining**
   - Skills recommend next skills
   - Automatic workflow progression

3. **Feature-Specific Skill Bundles**
   - High-risk feature guides (auth-changes, billing-changes)
   - Pre-packaged skill sequences for common scenarios

4. **Sub-Skill Nesting**
   - Complex skills with sub-workflows
   - Example: `/doc-discovery:feature-map`, `/doc-discovery:invariants`

### Continuous Improvement

The Ops Agent reviews `pending.yaml` for:
- Repeated friction patterns
- Missing capabilities
- Documentation gaps
- Process improvements

---

## Running an Optimization Session

### Pre-Session Checklist

- [ ] Run `/session-start` to load previous context
- [ ] Check `.context/optimizations/pending.yaml` for queued items
- [ ] Review this guide for methodology refresh
- [ ] Identify optimization goals for this session

### Session Workflow

```
1. ANALYZE CURRENT STATE
   ├── Measure skill tokens: wc -c .claude/skills/*/SKILL.md
   ├── Check agent protocols: grep for skill invocation
   ├── Review feature docs: look for gaps
   └── Check .context/ health

2. IDENTIFY OPPORTUNITIES
   ├── Token bloat in skills
   ├── Missing skill protocols in agents
   ├── Features without Implementation Guidance
   ├── Missing foundation docs
   └── Process friction points

3. CREATE PLAN
   ├── Prioritize by impact
   ├── Define phases
   ├── Set success metrics
   └── Document verification procedures

4. IMPLEMENT CHANGES
   ├── Work phase by phase
   ├── Create reference files for extracted content
   ├── Update all affected files
   └── Document as you go

5. VERIFY RESULTS
   ├── Run all verification procedures
   ├── Measure against success metrics
   ├── Document any gaps
   └── Plan follow-up if needed

6. DOCUMENT SESSION
   ├── Update this guide if process improved
   ├── Add pending items to optimizations/pending.yaml
   └── Run /handoff for session summary
```

### Post-Session Checklist

- [ ] All verification tests pass
- [ ] Success metrics documented
- [ ] Remaining opportunities in `pending.yaml`
- [ ] Session handoff written
- [ ] This guide updated if process changed

---

## Appendix: Historical Context

### 2026-01-10 Optimization Session

**Goals**: Comprehensive multi-agent system optimization
**Duration**: Extended session with context compaction

**Achievements**:
- 78% reduction in always-loaded skill tokens (106KB → 23KB)
- 11/11 skills restructured with reference directories
- 6/6 agents with mandatory skill invocation protocols
- 10 high-risk feature docs with Implementation Guidance
- 2 foundation docs created
- Complete .context/ infrastructure
- FEATURE_INDEX.md with agent routing
- SKILLS_INDEX.md with decision tree

**Methodology**: Progressive disclosure pattern, one-level-deep references, agent-skill connectivity, documentation as source of truth.

---

## Related Documentation

- `CLAUDE.md` — Orchestrator instructions
- `.claude/agents/AGENT_PROTOCOL.md` — Agent coordination protocol
- `.claude/agents/ops-agent.md` — System optimizer agent
- `.claude/skills/SKILLS_INDEX.md` — Skill discovery index
- `docs/features/FEATURE_INDEX.md` — Feature routing index
- `docs/features/agent-architecture.md` — Agent architecture feature doc
