---
name: start
description: Initialize a new work session. Loads previous context, refreshes instructions, and prepares for work. Run this at the beginning of every session.
---

# Session Start Command

## Purpose
Initialize a work session with full context restoration and instruction reinforcement.

## What This Command Does

```
┌─────────────────────────────────────────────────────────────────┐
│                    SESSION INITIALIZATION                        │
│                                                                  │
│  1. RESTORE CONTEXT                                              │
│     └─► Load handoff.md or checkpoint if available               │
│                                                                  │
│  2. REFRESH INSTRUCTIONS                                         │
│     └─► Reload core rules (safety, orchestration, tools)         │
│                                                                  │
│  3. VERIFY ENVIRONMENT                                           │
│     └─► Check dev server, Supabase, tools available              │
│                                                                  │
│  4. REPORT STATUS                                                │
│     └─► Show context level, previous work, next steps            │
└─────────────────────────────────────────────────────────────────┘
```

## Execution Steps

### Step 1: Check for Previous Session Context

Look for these files in order:
1. `.context/handoff.md` — Most recent session handoff
2. `.context/checkpoints/` — Most recent checkpoint
3. `.context/compact-state.md` — Post-compaction state

If found, extract:
- Previous session objective
- Work completed
- Remaining tasks
- Known issues
- Next steps

### Step 2: Refresh Core Instructions

Reload these critical behaviors:

```
╔══════════════════════════════════════════════════════════════════════════╗
║                         CORE RULES REFRESH                                ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  SAFETY RULES (Non-negotiable):                                           ║
║  ⛔ NEVER: supabase db reset, DROP TABLE, TRUNCATE, docker volume rm      ║
║  ✓ ALWAYS: Targeted SQL, createAdminClient(), incremental migrations      ║
║                                                                           ║
║  ORCHESTRATION MODE:                                                      ║
║  • I am the ORCHESTRATOR, not the implementer                             ║
║  • I DELEGATE frontend work to @frontend-agent                            ║
║  • I DELEGATE backend work to @backend-agent                              ║
║  • I DELEGATE exploration to @research-agent                              ║
║  • I DELEGATE testing to @test-agent                                      ║
║  • I coordinate, plan, and synthesize results                             ║
║                                                                           ║
║  TOOLS AVAILABLE:                                                         ║
║  • Supabase CLI — For ALL database queries and schema inspection          ║
║  • Playwright MCP — For browser testing and UI verification             ║
║  • Agent spawning — For delegating implementation work                    ║
║                                                                           ║
║  CONTEXT MANAGEMENT:                                                      ║
║  • /checkpoint every 30-45 minutes                                        ║
║  • /remember if behaviors degrade                                         ║
║  • /compact if context critical                                           ║
║                                                                           ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### Step 3: Verify Environment

Quick checks:
- [ ] Dev server accessible (if needed)
- [ ] Supabase local running (if needed)
- [ ] Git branch confirmed
- [ ] Context files readable

### Step 4: Generate Session Report

## Output Format

```markdown
## 🚀 Session Initialized

### Context Restored
**Source**: [handoff.md / checkpoint / compact-state / none]
**Timestamp**: [when source was created]

---

### Previous Session
**Objective**: [from handoff or "New session"]
**Status**: [where things left off]

### Work Completed
- [Item from previous session]
- [Item from previous session]

### Remaining Work
- [ ] [Task 1]
- [ ] [Task 2]

### Known Issues
- [Issue if any]

---

### Instructions Refreshed
- ✅ Safety rules: ACTIVE
- ✅ Orchestration mode: ACTIVE
- ✅ Tool awareness: ACTIVE
- ✅ Context management: ACTIVE

### Tools Ready
- [ ] Supabase CLI: Available
- [ ] Playwright MCP: Available
- [ ] Agent spawning: Ready

---

### Context Status
**Level**: [🟢 Low / 🟡 Medium / 🟠 High / 🔴 Critical]
**Recommendation**: [Continue normally / Monitor / Checkpoint soon / Compact now]

---

### Ready to Begin
[Statement about what's next based on context]

**What would you like to work on?**
```

## If No Previous Context

```markdown
## 🚀 Session Initialized

### Fresh Session
No previous session context found.

### Instructions Loaded
- ✅ Safety rules: ACTIVE
- ✅ Orchestration mode: ACTIVE
- ✅ Tool awareness: ACTIVE
- ✅ Context management: ACTIVE

### Ready to Begin
This is a fresh session. All core instructions are loaded.

**What would you like to work on?**
```

## Post-Initialization Checklist

Before proceeding with work, confirm:

```
Self-Check:
□ I will DELEGATE frontend work to @frontend-agent
□ I will DELEGATE backend work to @backend-agent
□ I will USE Supabase CLI for database questions
□ I will USE Playwright MCP for UI verification
□ I will NEVER run destructive database commands
□ I will CHECKPOINT every 30-45 minutes
```

## Integration

This command effectively combines:
- `/session-start` skill (context restoration)
- `/remember` skill (instruction refresh)
- `/context-status` skill (health check)

Into a single initialization flow.

## Recommended Session Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    OPTIMAL SESSION FLOW                      │
│                                                              │
│  SESSION START                                               │
│  /start                                                      │
│       │                                                      │
│       ▼                                                      │
│  UNDERSTAND SCOPE                                            │
│  /doc-discovery                                              │
│       │                                                      │
│       ▼                                                      │
│  WORK CYCLE (repeat)                                         │
│  ┌──────────────────────────────────────┐                   │
│  │ Plan → Validate → Delegate → Verify  │                   │
│  │         │                            │                   │
│  │         └── /checkpoint (30-45 min) ─┘                   │
│  └──────────────────────────────────────┘                   │
│       │                                                      │
│       ▼                                                      │
│  IF DEGRADED                                                 │
│  /remember                                                   │
│       │                                                      │
│       ▼                                                      │
│  SESSION END                                                 │
│  /handoff                                                    │
└─────────────────────────────────────────────────────────────┘
```

## Get Ready To Build

Lastly, please start the web server, install dependencies, and let me know when you're ready to start building.