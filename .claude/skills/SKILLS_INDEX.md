# Skills Index

This directory contains all skills for the EnhancedHR.ai agent system.

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
└── remember/
    ├── SKILL.md                 ← Refresh critical instructions
    └── reference/               ← Degradation fixes and decision guide
```

## Skill Categories

### Documentation Skills
| Skill | Purpose | When to Use |
|-------|---------|-------------|
| **doc-discovery** | Load relevant docs before planning | Start of any complex task |
| **plan-lint** | Validate plan against constraints | After creating plan, before coding |
| **doc-update** | Update docs after code changes | After implementation complete |
| **drift-check** | Detect doc/code mismatches | Periodically, after changes |

### Testing Skills
| Skill | Purpose | When to Use |
|-------|---------|-------------|
| **test-from-docs** | Generate test plans from docs | After implementation, before merge |

### Session Management Skills
| Skill | Purpose | When to Use |
|-------|---------|-------------|
| **handoff** | Write comprehensive session summary | End of session |
| **context-status** | Check context window health | When responses degrade |
| **compact** | Compress context, preserve state | When context is high/critical |
| **checkpoint** | Save mid-session state | After milestones, periodically |
| **session-start** | Resume from previous session | Beginning of new session |
| **remember** | Refresh critical instructions | When behaviors degrade |

## Skill Decision Tree

### Starting a Task
```
"I'm beginning work on a feature"
    └─► /doc-discovery

"I need to plan implementation"
    └─► /plan-lint (after doc-discovery)

"I'm returning to previous work"
    └─► /session-start
```

### During Implementation
```
"I need to change database"
    └─► /supabase/safe-sql or /supabase/migration

"I'm creating UI components"
    └─► /frontend/component-inventory first

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
| Starting complex task | `/doc-discovery` |
| Validating plan | `/plan-lint` |
| After code changes | `/doc-update` |
| Checking doc accuracy | `/drift-check` |
| Generating tests | `/test-from-docs` |
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

## Relationship to Slash Commands

Skills (`.claude/skills/`) are auto-discovered capabilities.
Commands (`.claude/commands/`) are explicit slash invocations.

Some skills have corresponding commands:
- Skill: `doc-discovery` → Command: `/doc-discovery`
- Skill: `handoff` → Command: `/handoff`

Commands can invoke skills, and skills can reference commands.

## Optimizing Skills

For guidance on skill architecture and optimization:
- See `docs/engine/AGENT_SYSTEM_OPTIMIZATION.md`

Key principles:
- SKILL.md < 500 lines (minimize always-loaded tokens)
- Detailed content in `/reference` subdirectory
- Third-person descriptions with trigger keywords
- One level deep references (never A→B→C)
