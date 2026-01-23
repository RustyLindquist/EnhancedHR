# Skills Index

This directory contains all skills for the EnhancedHR.ai agent system.

## Skill Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SESSION LIFECYCLE                                  │
│                                                                          │
│   /session-start ─────────────────────────────────────────────────────┐ │
│         │                                                              │ │
│         ▼                                                              │ │
│   /doc-discovery ──► /plan-lint ──► [IMPLEMENTATION] ──► /test-from-docs │
│         │                                │                      │      │ │
│         │                                ▼                      │      │ │
│         │                    ┌──────────────────────┐           │      │ │
│         │                    │ Agent Skills         │           │      │ │
│         │                    │ /supabase/safe-sql   │           │      │ │
│         │                    │ /supabase/migration  │           │      │ │
│         │                    │ /frontend/*          │           │      │ │
│         │                    └──────────────────────┘           │      │ │
│         │                                                       │      │ │
│         └────────────────────────────────────────────────────────┘      │ │
│                                                                          │
│   /test-from-docs ──► /doc-update ──► /drift-check ──► /handoff ────────┘
│                                                                          │
│                                                                          │
│   RECOVERY LOOP (as needed):                                            │
│                                                                          │
│   /context-status ──► /checkpoint ──► /compact ──► /remember            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Skills vs Commands

| Component | Location | Purpose | Loading |
|-----------|----------|---------|---------|
| **Skills** | `.claude/skills/*/SKILL.md` | Auto-discovered capabilities with detailed reference docs | At startup |
| **Commands** | `.claude/commands/*.md` | Slash command invocations (thin wrappers) | On invocation |

**Relationship**: Commands invoke skills. Skills contain the full logic with validation checklists and reference materials. Commands are user-facing entry points.

Example:
- User runs `/doc-discovery` (command)
- Command content guides the agent through the skill workflow
- Skill provides detailed reference materials in `/reference` subdirectory

## Directory Structure

```
.claude/skills/
├── SKILLS_INDEX.md              ← This file
│
├── doc-discovery/
│   ├── SKILL.md                 ← Load relevant docs before planning
│   └── reference/               ← Examples and high-risk area guide
│
├── plan-lint/
│   ├── SKILL.md                 ← Validate plan against docs
│   └── reference/               ← Output templates and failure patterns
│
├── doc-update/
│   ├── SKILL.md                 ← Update docs after code changes
│   └── reference/               ← Section templates and update patterns
│
├── drift-check/
│   ├── SKILL.md                 ← Detect doc/code mismatches
│   └── reference/               ← Check procedures and remediation templates
│
├── test-from-docs/
│   ├── SKILL.md                 ← Generate tests from documentation
│   └── reference/               ← Test phases and browser testing guide
│
├── handoff/
│   ├── SKILL.md                 ← Write session handoff notes
│   └── reference/               ← Full and compact handoff templates
│
├── context-status/
│   ├── SKILL.md                 ← Check context window health
│   └── reference/               ← Recommendations matrix
│
├── compact/
│   ├── SKILL.md                 ← Compress context for long sessions
│   └── reference/               ← Emergency procedures
│
├── checkpoint/
│   ├── SKILL.md                 ← Save mid-session state
│   └── reference/               ← Full, pre-risk, and recovery templates
│
├── session-start/
│   ├── SKILL.md                 ← Resume from previous session
│   └── reference/               ← Recovery procedures
│
├── remember/
│   ├── SKILL.md                 ← Refresh critical instructions
│   └── reference/               ← Degradation fixes and decision guide
│
├── infer-intent/
│   └── SKILL.md                 ← Analyze user requests for structured intent
│
├── task-router/
│   └── SKILL.md                 ← Auto-route tasks to optimal agents
│
├── systematic-debugging/
│   └── SKILL.md                 ← Methodical debugging protocol
│
├── parallel-dispatch/
│   └── SKILL.md                 ← Coordinate parallel agent execution
│
└── push/
    └── SKILL.md                 ← Git commit, push, PR, merge via @git-ops-agent
```

## Skill Categories

### Documentation Skills
| Skill | Purpose | When to Use | Depends On |
|-------|---------|-------------|------------|
| **doc-discovery** | Load relevant docs before planning | Start of any complex task | - |
| **plan-lint** | Validate plan against constraints | After creating plan, before coding | doc-discovery |
| **doc-update** | Update docs after code changes | After implementation complete | test-from-docs |
| **drift-check** | Detect doc/code mismatches | Periodically, after changes | doc-update |

### Testing Skills
| Skill | Purpose | When to Use | Depends On |
|-------|---------|-------------|------------|
| **test-from-docs** | Generate test plans from docs | After implementation, before merge | Implementation |

### Session Management Skills
| Skill | Purpose | When to Use | Depends On |
|-------|---------|-------------|------------|
| **session-start** | Resume from previous session | Beginning of new session | - |
| **context-status** | Check context window health | When responses degrade | - |
| **checkpoint** | Save mid-session state | After milestones, periodically | - |
| **compact** | Compress context, preserve state | When context is high/critical | checkpoint |
| **remember** | Refresh critical instructions | When behaviors degrade | - |
| **handoff** | Write comprehensive session summary | End of session | drift-check |

### Browser Skills
| Skill | Purpose | When to Use | Depends On |
|-------|---------|-------------|------------|
| **browser-use** | UI verification, screenshots, workflow testing | After UI changes, workflow testing | One of the tools below |

**Browser Tool Selection:**
| Need | Tool |
|------|------|
| Structured test suite | Playwright Test (`npx playwright test`) |
| Assertions & reports | Playwright Test |
| CI/CD / regression | Playwright Test |
| User's logged-in session | Claude in Chrome |
| GIF recording | Claude in Chrome |
| Network monitoring | Claude in Chrome |
| Isolated/clean test | Browser MCP |
| Quick smoke test | Browser MCP |

### Orchestration Skills
| Skill | Purpose | When to Use | Depends On |
|-------|---------|-------------|------------|
| **infer-intent** | Analyze user request for structured intent | Ambiguous or complex requests | - |
| **task-router** | Auto-route tasks to optimal agents | At start of complex tasks | infer-intent (optional) |
| **parallel-dispatch** | Coordinate parallel agent execution | When tasks can run in parallel | task-router |
| **systematic-debugging** | Methodical debugging protocol | When facing non-obvious bugs | - |
| **push** | Git commit, push, PR, merge | Context low, feature complete, session ending | - |

## Skill Decision Tree

### Starting a Task
```
"User request is ambiguous or complex"
    └─► /infer-intent → /task-router

"I'm beginning work on a feature"
    └─► /doc-discovery

"I need to plan implementation"
    └─► /plan-lint (after doc-discovery)

"I'm returning to previous work"
    └─► /session-start

"I'm unsure which agent to spawn"
    └─► /task-router (or /infer-intent first)
```

### During Implementation
```
"I need to change database"
    └─► /supabase/safe-sql or /supabase/migration

"I'm creating UI components"
    └─► /frontend/component-inventory first

"I need to verify UI changes"
    └─► /browser-use (routes to optimal tool)
        ├─► Claude in Chrome (authenticated, GIF, network)
        └─► Browser MCP (isolated, simple tests)

"I found an undocumented pattern"
    └─► /capture-optimization
```

### Finishing Work
```
"I modified feature behavior"
    └─► /doc-update

"I want to verify doc accuracy"
    └─► /drift-check

"I'm ending my session"
    └─► /handoff
```

### Context Management
```
"My responses seem degraded"
    └─► /remember

"It's been 30+ minutes"
    └─► /checkpoint

"Context is getting full"
    └─► /compact
```

### Quick Decision Matrix

| Situation | Skill |
|-----------|-------|
| Unclear user request | `/infer-intent` |
| Which agent to spawn | `/task-router` |
| Starting complex task | `/doc-discovery` |
| Validating plan | `/plan-lint` |
| After code changes | `/doc-update` |
| Checking doc accuracy | `/drift-check` |
| Generating tests | `/test-from-docs` |
| Verify UI changes | `/browser-use` |
| Push when context low | `/push` |
| Session ending | `/handoff` |
| Responses degraded | `/remember` |
| 30-45 min milestone | `/checkpoint` |
| Context high/critical | `/compact` |
| New session | `/session-start` |

## Skill Workflow

```
SESSION START
     │
     ▼
/session-start ──────► Load previous context
     │
     ▼
/doc-discovery ──────► Understand feature scope
     │
     ▼
Create Plan
     │
     ▼
/plan-lint ──────────► Validate plan
     │
     ▼
Implementation (delegate to agents)
     │
     ▼
/test-from-docs ─────► Verify changes
     │
     ▼
/doc-update ─────────► Update documentation
     │
     ▼
/drift-check ────────► Confirm no drift
     │
     ▼
/handoff ────────────► Prepare for next session


DURING SESSION (as needed):

/context-status ─────► Check context health
     │
     ├─► OK ────────► Continue
     │
     └─► High ──────► /checkpoint or /compact

/remember ───────────► Refresh instructions when degraded
```

## Quick Reference

### Start Work
```
/session-start        # Resume previous session
/doc-discovery        # Understand scope
```

### During Work
```
/plan-lint           # Validate plan
/checkpoint          # Save state (every 30-45 min)
/remember            # Refresh if degraded
/context-status      # Check context health
/browser-use         # Verify UI (routes to Claude in Chrome or Browser MCP)
```

### Finish Work
```
/test-from-docs      # Verify changes
/doc-update          # Update docs
/drift-check         # Confirm no drift
/handoff             # End session summary
```

### Recovery
```
/compact             # Clear context, preserve state
/session-start       # Resume from checkpoint/handoff
```

## Skill Loading

Skills are automatically discovered by Claude Code at startup from `.claude/skills/*/SKILL.md`.

To verify skills are loaded:
```bash
claude doctor
```

Skills should appear under "Loaded Skills" with green checkmarks.

## Adding New Skills

1. Create directory: `.claude/skills/[skill-name]/`
2. Create `SKILL.md` with YAML frontmatter:
   ```markdown
   ---
   name: skill-name
   description: What this skill does. When to use it.
   allowed-tools: Read, Write, Bash  # optional
   ---

   # Skill Name

   ## Purpose
   ...

   ## When to Use
   ...

   ## Process
   ...
   ```
3. Restart Claude Code to load new skill

## Optimizing Skills

For guidance on skill architecture and optimization:
- See `docs/engine/AGENT_SYSTEM_OPTIMIZATION.md`

Key principles:
- SKILL.md < 500 lines (minimize always-loaded tokens)
- Detailed content in `/reference` subdirectory
- Third-person descriptions with trigger keywords
- One level deep references (never A→B→C)

## Agent Cost Awareness

| Action | Relative Cost |
|--------|---------------|
| Inline work (no agent) | 1x |
| Single subagent spawn | ~4x |
| Parallel agents (2-3) | ~8-12x |
| Multi-agent parallel (4+) | ~15x+ |

**Best practice**: Parallelize only when tasks are truly independent AND substantial.
