# Orchestrator Extended Guide

<!-- Extended reference for the Main Agent. Core rules in CLAUDE.md -->

This document contains detailed protocols for the orchestrator agent. For quick reference, see `CLAUDE.md` in the project root.

---

## Table of Contents

1. [Spawn Criteria](#spawn-criteria)
2. [Context Management](#context-management)
3. [Documentation Protocol](#documentation-protocol)
4. [Meta-Cognitive Architecture](#meta-cognitive-architecture)
5. [Parallel Agent Orchestration](#parallel-agent-orchestration)
6. [Definition of Done](#definition-of-done)

---

## Spawn Criteria

### When to Spawn Doc Agent

**Spawn if ANY are true:**
- Task touches server actions, database, or schema
- Task touches AI/context/prompts
- Task is a bug fix (not just styling)
- Task spans 2+ features
- Task touches auth/RLS/permissions
- Task touches billing/payments
- Uncertain about scope

**Skip only if ALL are true:**
- Pure styling/CSS change
- Single-file, single-feature
- No server/DB involvement
- No AI behavior changes

### When to Spawn Frontend Agent

**Spawn if ANY are true:**
- Creating new UI components
- Modifying component styling
- Building new pages/views
- Fixing UI bugs
- Layout changes

**Skip only if ALL are true:**
- Pure text change ("Submit" → "Save")
- Backend-only work
- Simple typo fix

### When to Spawn Backend Agent

**Spawn if ANY are true:**
- Creating/modifying server actions
- RLS policy changes
- Database migrations
- API route implementation
- createAdminClient usage
- Edge function work

**Skip only if ALL are true:**
- Pure frontend work
- Documentation only
- Simple config change

### When to Spawn Research Agent

**Spawn if ANY are true:**
- "Where is X implemented?"
- "How does Y work?"
- "Find all places that use Z"
- Tracing a bug to its source
- Pre-implementation research

**Skip only if ALL are true:**
- Simple file read
- Documentation question (use Doc Agent)
- Known file location

### When to Spawn Test Agent

**Spawn if ANY are true:**
- Multi-feature changes
- Workflow-impacting changes
- High-risk areas (auth/billing/AI/schema)
- Pre-PR validation
- User requests thorough testing

**Skip only if ALL are true:**
- Single feature, low risk
- No workflow impact
- Simple verification needed

---

## Context Management

### Warning Signs by Severity

| Level | Signal | Action |
|-------|--------|--------|
| Low | Responses still sharp | Continue normally |
| Medium | Missing details mentioned earlier | Spawn subagents more |
| High | Forgetting recent decisions | `/checkpoint`, then `/remember` |
| Critical | Forgetting tools or delegation rules | `/compact` immediately |

### Strategies

1. **Spawn subagents for work** — They return summaries, not raw content
2. **Use Doc Agent lazily** — Query for answers, don't load full docs
3. **Checkpoint regularly** — Every 30-45 minutes: `/checkpoint`
4. **Refresh instructions** — When degraded: `/remember`
5. **Compact proactively** — Don't wait until critical: `/compact`

### Session Skills Reference

| Skill | When to Use | What It Does |
|-------|-------------|--------------|
| `/session-start` | Beginning of session | Restore previous context from handoff/checkpoint |
| `/context-status` | When session feels slow | Check context health, get recommendations |
| `/remember` | Behaviors degraded | Refresh critical instructions |
| `/checkpoint` | Every 30-45 min | Save state at milestones |
| `/compact` | Context high/critical | Compress context, preserve state to disk |
| `/handoff` | End of session | Comprehensive summary for next session |

---

## Documentation Protocol

### Authority Order (When Sources Conflict)

1. **Code + runtime behavior** (source of truth)
2. **DB schema / migrations / RLS** (binding constraints)
3. **Feature docs** (`docs/features/*`) (canonical description)
4. **Engine docs** (`docs/engine/*`) (protocol and schema)
5. **PRDs** (`docs/*.md`) (intent/history only)
6. **Legacy docs** (secondary reference)

### Documentation Locations

| Type | Location |
|------|----------|
| Feature docs | `docs/features/*.md` |
| Feature index | `docs/features/FEATURE_INDEX.md` |
| Workflow docs | `docs/workflows/*.md` |
| Engine docs | `docs/engine/*.md` |
| Foundation docs | `docs/foundation/*.md` |
| Style guide | `docs/frontend/STYLE_GUIDE.md` |
| Component index | `docs/frontend/COMPONENT_INDEX.md` |

### Lifecycle Hooks

**BEFORE changing:** server actions, AI context, auth/RLS, billing
→ Consult docs or Doc Agent

**AFTER changing:** user-facing workflows, data paths, permissions
→ Update relevant docs

**END of session:**
→ Write handoff note to `.context/handoff.md`

---

## Meta-Cognitive Architecture

### The Optimization Loop

```
Task Execution → Agents capture optimization signals → pending.yaml
                                    ↓
              Ops Agent reviews → prioritizes → implements
                                    ↓
                        System improves for next task
```

### What to Watch For

| Signal Type | Examples |
|-------------|----------|
| User statements implying rules | "we always...", "we never...", "from now on..." |
| Repeated friction patterns | Same problem occurring multiple times |
| Missing capabilities | "I wish the agent could..." |
| Documentation gaps | Undocumented invariants discovered |

### Capture Format

Opportunities go to `.context/optimizations/pending.yaml`:

```yaml
- id: "OPT-YYYY-MM-DD-NNN"
  type: skill | rule | doc | protocol | agent | process
  source_agent: [agent name]
  trigger: "What prompted this"
  proposal: "What should change"
  impact: "Why it matters"
  frequency: one-time | occasional | frequent | constant
  effort: trivial | small | medium | large
```

### Goal

Each task should:
1. Complete the user's request
2. Leave the system slightly better than before

---

## Parallel Agent Orchestration

### When to Parallelize

| Scenario | Parallel? | Why |
|----------|-----------|-----|
| Multiple independent bugs | Yes | No dependencies |
| Research across different features | Yes | No dependencies |
| Feature + its tests | No | Tests depend on implementation |
| Multiple file reads | Yes | No dependencies |
| Backend + Frontend for same feature | Maybe | Depends on API contract |

### How to Parallelize

1. Send a **single message** with multiple Task tool calls
2. Track spawned agents in `.context/agents/active.yaml`
3. Collect and synthesize results when all complete

### Cost Awareness

| Configuration | Relative Cost |
|---------------|---------------|
| Single chat | 1x |
| Single agent | ~4x |
| Multi-agent parallel | ~15x |

**Rule**: Parallelize when tasks are truly independent AND substantial. Don't parallelize trivial tasks.

---

## Feature Planning Checklist

When planning any new feature, always ask these questions:

### Pages & Surfaces
- [ ] What pages/surfaces are involved?
- [ ] Do they follow `docs/frontend/PAGE_STANDARDS.md`? (Canvas Header, transparent background)

### AI Panel (MANDATORY)
- [ ] **How should the AI panel work on each page?**
  - What agent type? (platform_assistant, course_assistant, collection_assistant, etc.)
  - What context scope? (PLATFORM, COURSE, COLLECTION, ORG_COURSES, etc.)
  - What data should be searchable via RAG?
- [ ] If new page type: Does it need a new agent type and context scope?
- [ ] Reference: `docs/frontend/PAGE_STANDARDS.md` Section 3

### Data Scoping
- [ ] Does any data need org-scoping? (org_id column)
- [ ] What embeddings need to be generated for AI? (if any)
- [ ] Reference: `docs/architecture/org-scoped-content.md`

### Example: Org Courses Feature
```
Pages: /org-courses, /org-courses/[id], /org-courses/[id]/builder
AI Panel:
  - Agent type: org_course_assistant
  - Context scope: ORG_COURSES with orgId
  - RAG: org course content (lessons, descriptions)
Data scoping:
  - courses.org_id for org ownership
  - unified_embeddings.org_id for RAG isolation
```

---

## Definition of Done

For any task, verify:

- [ ] Code complete and working
- [ ] Docs updated (if behavior changed)
- [ ] Tests executed (per risk level)
- [ ] If schema change: migration + prod SQL script
- [ ] Handoff note written (end of session)

### High-Risk Areas Requiring Extra Verification

- Schema / migrations / RLS policies
- Auth / session handling
- `createAdminClient()` or service-role paths
- Billing / entitlements / credits
- AI context assembly / embeddings / prompts

For these areas, MUST use full 2-gate flow WITH Doc Agent validation.

---

## Sub-Agent Safety Injection

When spawning ANY sub-agent, include this preamble:

```
CRITICAL SAFETY RULE:
NEVER run: supabase db reset, DROP TABLE, TRUNCATE, docker volume rm
ALWAYS use: targeted SQL, createAdminClient(), incremental migrations
If tempted to reset, STOP and ask the user first.
```

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| `CLAUDE.md` | Minimal orchestrator instructions (always loaded) |
| `.claude/agents/AGENT_PROTOCOL.md` | Full agent coordination protocol |
| `.claude/agents/SAFETY_RULES.md` | Complete safety rules |
| `.claude/skills/SKILLS_INDEX.md` | All skills with workflows |
| `docs/engine/AGENT_SYSTEM_OPTIMIZATION.md` | System optimization methodology |
