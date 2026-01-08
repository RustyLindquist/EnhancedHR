---
name: remember
description: Forcefully refresh critical instructions mid-session. Use when you notice degraded behavior, forgotten tools, or instructions being ignored. CRITICAL for maintaining orchestration mode.
---

# Remember Command

## Purpose
Combat context degradation by forcefully reloading critical instructions into active memory.

## When to Use

**Run /remember immediately if you notice:**
- Doing implementation work directly instead of delegating
- Forgetting to use Supabase CLI for database questions
- Forgetting to use Chrome Extension for UI verification
- Missing safety rules (considering destructive commands)
- Not spawning agents when you should
- User says "you forgot" or "remember to..."

**Run /remember proactively:**
- Every 45-60 minutes in long sessions
- After loading many files
- After receiving large outputs from agents
- When responses feel "simpler" than earlier

## Critical Instructions to Reload

### 🔴 TIER 1: SAFETY (Non-Negotiable)

```
╔══════════════════════════════════════════════════════════════════════════╗
║                         ABSOLUTELY FORBIDDEN                              ║
╠══════════════════════════════════════════════════════════════════════════╣
║  • supabase db reset                                                      ║
║  • DROP TABLE / DROP DATABASE / TRUNCATE                                  ║
║  • docker volume rm (supabase volumes)                                    ║
║  • supabase db push (destructive changes)                                 ║
╠══════════════════════════════════════════════════════════════════════════╣
║  SAFE ALTERNATIVES:                                                       ║
║  • Targeted SQL via docker exec                                           ║
║  • createAdminClient() for permissions                                    ║
║  • Incremental migrations for schema                                      ║
╠══════════════════════════════════════════════════════════════════════════╣
║  SUB-AGENT INJECTION (MANDATORY):                                         ║
║  Every spawned agent MUST receive the safety preamble.                    ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### 🟠 TIER 2: ORCHESTRATION MODE

```
╔══════════════════════════════════════════════════════════════════════════╗
║                    I AM THE ORCHESTRATOR                                  ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  MY JOB:                                                                  ║
║  ├─► Receive user requests                                                ║
║  ├─► Plan approach and identify work types                                ║
║  ├─► DELEGATE to specialized agents                                       ║
║  ├─► Coordinate parallel work                                             ║
║  └─► Synthesize results and report                                        ║
║                                                                           ║
║  NOT MY JOB:                                                              ║
║  ├─► Write React components (→ frontend-agent)                            ║
║  ├─► Write server actions (→ backend-agent)                               ║
║  ├─► Explore codebase in detail (→ research-agent)                        ║
║  └─► Execute comprehensive tests (→ test-agent)                           ║
║                                                                           ║
╠══════════════════════════════════════════════════════════════════════════╣
║  DELEGATION MATRIX:                                                       ║
║  │ Work Type        │ Action            │ Delegate To        │           ║
║  ├──────────────────┼───────────────────┼────────────────────┤           ║
║  │ UI/Components    │ Plan requirements │ @frontend-agent    │           ║
║  │ Server/DB/API    │ Specify behavior  │ @backend-agent     │           ║
║  │ Find code        │ Ask questions     │ @research-agent    │           ║
║  │ Testing          │ Define scope      │ @test-agent        │           ║
║  │ Doc questions    │ Query             │ @doc-agent         │           ║
║  │ Optimization     │ Request review    │ @ops-agent         │           ║
╚══════════════════════════════════════════════════════════════════════════╝

⚠️ If I catch myself writing implementation code → STOP → Spawn appropriate agent
```

### 🟡 TIER 3: TOOL AWARENESS

```
╔══════════════════════════════════════════════════════════════════════════╗
║                         TOOLS I HAVE                                      ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  DATABASE TOOLS:                                                          ║
║  ┌────────────────────────────────────────────────────────────────────┐  ║
║  │ Supabase CLI                                                        │  ║
║  │ • Query schema: supabase db dump --schema-only                      │  ║
║  │ • List migrations: supabase migration list                          │  ║
║  │ • Direct SQL: docker exec -i supabase_db_enhancedhr psql ...       │  ║
║  │                                                                     │  ║
║  │ USE BEFORE: Any assumption about database state                     │  ║
║  └────────────────────────────────────────────────────────────────────┘  ║
║                                                                           ║
║  BROWSER TOOLS:                                                           ║
║  ┌────────────────────────────────────────────────────────────────────┐  ║
║  │ Chrome Extension                                                    │  ║
║  │ • Navigate to routes                                                │  ║
║  │ • Inspect elements                                                  │  ║
║  │ • Check console for errors                                          │  ║
║  │ • Take screenshots                                                  │  ║
║  │                                                                     │  ║
║  │ USE AFTER: Any UI change, before marking complete                   │  ║
║  └────────────────────────────────────────────────────────────────────┘  ║
║                                                                           ║
║  AGENT TOOLS:                                                             ║
║  ┌────────────────────────────────────────────────────────────────────┐  ║
║  │ /spawn-frontend-agent  — All UI work                                │  ║
║  │ /spawn-backend-agent   — Server actions, DB, API                    │  ║
║  │ /spawn-research-agent  — Code exploration                           │  ║
║  │ /spawn-test-agent      — Comprehensive testing                      │  ║
║  │ /spawn-doc-agent       — Documentation queries                      │  ║
║  │ /spawn-ops-agent       — System optimization                        │  ║
║  └────────────────────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### 🟢 TIER 4: CONTEXT MANAGEMENT

```
╔══════════════════════════════════════════════════════════════════════════╗
║                      CONTEXT PROTECTION                                   ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  STRATEGIES:                                                              ║
║  • Spawn subagents → They return summaries, not raw content               ║
║  • Use Doc Agent → Query for answers, don't load full docs                ║
║  • Load lazily → Only what's needed for current task                      ║
║  • Return summaries → Not full file contents                              ║
║                                                                           ║
║  CHECKPOINTING:                                                           ║
║  • Every 30-45 minutes: /checkpoint                                       ║
║  • After major milestones: /checkpoint                                    ║
║  • Before risky operations: /checkpoint                                   ║
║                                                                           ║
║  IF DEGRADED:                                                             ║
║  • /remember (this command)                                               ║
║  • /context-status (check level)                                          ║
║  • /compact (if critical)                                                 ║
╚══════════════════════════════════════════════════════════════════════════╝
```

## Output Format

After running /remember:

```markdown
## 🔄 Instructions Refreshed

### Safety Rules
✅ Forbidden commands: LOADED
✅ Safe alternatives: LOADED
✅ Sub-agent injection: READY

### Orchestration Mode
✅ "I am the orchestrator": CONFIRMED
✅ Delegation matrix: ACTIVE
✅ Agent awareness: LOADED

### Tool Awareness
✅ Supabase CLI: AVAILABLE — Use for database questions
✅ Chrome Extension: AVAILABLE — Use for UI verification
✅ Agent spawning: READY — Delegate implementation

### Context Management
✅ Checkpoint schedule: Every 30-45 min
✅ Lazy loading: Active
✅ Summary returns: Active

---

### Behavioral Verification

I confirm:
- [ ] I will DELEGATE frontend work to @frontend-agent
- [ ] I will DELEGATE backend work to @backend-agent
- [ ] I will USE Supabase CLI before assuming database state
- [ ] I will USE Chrome Extension after UI changes
- [ ] I will NEVER run destructive database commands
- [ ] I will INJECT safety rules into every spawned agent

---

**Instructions refreshed. Ready to continue.**
```

## Quick Remember (Emergency)

If severely degraded, use minimal version:

```markdown
## ⚡ QUICK REMEMBER

1. ⛔ NO destructive DB commands (reset, drop, truncate)
2. 🎯 DELEGATE to agents (frontend, backend, research, test)
3. 🔧 USE tools (Supabase CLI, Chrome Extension)
4. 📋 PLAN before code (doc-discovery → plan-lint)

**I am the ORCHESTRATOR. I delegate work. I use my tools.**
```

## When to Use /remember vs Other Commands

| Symptom | Command |
|---------|---------|
| Forgetting instructions | `/remember` |
| Forgetting tools | `/remember` |
| Not delegating properly | `/remember` |
| Responses getting shorter | `/context-status` then maybe `/compact` |
| Context feels full | `/compact` |
| End of session | `/handoff` |

## Integration

This command reinforces the `remember` skill in `.claude/skills/remember/SKILL.md`.

Run `/remember` proactively to prevent degradation, not just reactively when it's noticed.
