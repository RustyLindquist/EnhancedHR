# Skills Index

This directory contains all skills for the EnhancedHR.ai agent system.

## Directory Structure

```
.claude/skills/
├── SKILLS_INDEX.md          ← This file
│
├── doc-discovery/
│   └── SKILL.md             ← Load relevant docs before planning
│
├── plan-lint/
│   └── SKILL.md             ← Validate plan against docs
│
├── doc-update/
│   └── SKILL.md             ← Update docs after code changes
│
├── drift-check/
│   └── SKILL.md             ← Detect doc/code mismatches
│
├── test-from-docs/
│   └── SKILL.md             ← Generate tests from documentation
│
├── handoff/
│   └── SKILL.md             ← Write session handoff notes
│
├── context-status/
│   └── SKILL.md             ← Check context window health
│
├── compact/
│   └── SKILL.md             ← Compress context for long sessions
│
├── checkpoint/
│   └── SKILL.md             ← Save mid-session state
│
├── session-start/
│   └── SKILL.md             ← Resume from previous session
│
└── remember/
    └── SKILL.md             ← Refresh critical instructions
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
