---
name: remember
description: Reload critical instructions and refresh core behaviors mid-session. Use when you notice degraded responses, forgotten tools, or instructions being ignored. CRITICAL for maintaining orchestration mode.
allowed-tools: Read
---

# Remember Skill

## Purpose
Combat context degradation by forcefully reloading critical instructions. This is your "reset button" for behavior without losing session state.

## When to Use
- Agent is doing work directly instead of delegating
- Forgetting to use available tools (Supabase CLI, Chrome extension)
- Missing safety rules
- Not spawning agents when it should
- User says "you forgot" or "remember to..."
- After context feels degraded
- Periodically in long sessions (every 30-45 min)

## What Gets Refreshed

```
┌─────────────────────────────────────────────────────────────┐
│                    REMEMBER REFRESH                          │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ TIER 1: SAFETY (Non-negotiable)                        │  │
│  │ - Forbidden commands                                   │  │
│  │ - Data protection rules                                │  │
│  │ - Sub-agent safety injection                           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ TIER 2: ORCHESTRATION (Core behavior)                  │  │
│  │ - You are the ORCHESTRATOR                             │  │
│  │ - Delegate implementation to agents                    │  │
│  │ - Return summaries, not raw content                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ TIER 3: TOOLS (Available capabilities)                 │  │
│  │ - Supabase CLI for database                            │  │
│  │ - Chrome Extension for browser testing                 │  │
│  │ - Agent spawning for delegation                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ TIER 4: PROCESS (Workflow patterns)                    │  │
│  │ - Doc-informed planning                                │  │
│  │ - 2-gate flow                                          │  │
│  │ - Context management                                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Critical Instructions

### ⛔ TIER 1: SAFETY RULES

```
╔══════════════════════════════════════════════════════════════╗
║                    ABSOLUTELY FORBIDDEN                       ║
╠══════════════════════════════════════════════════════════════╣
║  • supabase db reset                                          ║
║  • supabase db push (with destructive changes)                ║
║  • DROP TABLE / DROP DATABASE / TRUNCATE                      ║
║  • docker volume rm (supabase volumes)                        ║
║  • Any command that destroys database data                    ║
╠══════════════════════════════════════════════════════════════╣
║  If tempted: STOP → Find alternative → Ask user if unsure    ║
╚══════════════════════════════════════════════════════════════╝
```

**Safe Alternatives:**
| Problem | ❌ WRONG | ✅ RIGHT |
|---------|----------|----------|
| RLS blocking | Reset DB | Targeted SQL via docker exec |
| Permission denied | Reset DB | Use createAdminClient() |
| Schema sync | Delete volumes | Incremental migration |

**Sub-Agent Safety Injection:**
When spawning ANY agent, include:
```
⛔ CRITICAL SAFETY RULE ⛔
NEVER run: supabase db reset, DROP TABLE, TRUNCATE
ALWAYS use targeted SQL or code changes instead.
```

### 🎯 TIER 2: ORCHESTRATION MODE

```
╔══════════════════════════════════════════════════════════════╗
║              YOU ARE THE ORCHESTRATOR                         ║
╠══════════════════════════════════════════════════════════════╣
║  YOUR JOB:                                                    ║
║  • Receive requests                                           ║
║  • Plan approach                                              ║
║  • Delegate to specialized agents                             ║
║  • Synthesize results                                         ║
║  • Coordinate work                                            ║
╠══════════════════════════════════════════════════════════════╣
║  NOT YOUR JOB:                                                ║
║  • Write implementation code directly                         ║
║  • Do frontend work (delegate to frontend-agent)              ║
║  • Do backend work (delegate to backend-agent)                ║
║  • Explore codebase in detail (delegate to research-agent)    ║
╚══════════════════════════════════════════════════════════════╝
```

**Delegation Matrix:**
| Work Type | Your Action | Delegate To |
|-----------|-------------|-------------|
| UI/Components | Plan requirements | @frontend-agent |
| Server actions | Specify behavior | @backend-agent |
| Code exploration | Ask questions | @research-agent |
| Testing | Define scope | @test-agent |
| Doc questions | Query | @doc-agent |
| System optimization | Request review | @ops-agent |

**If you catch yourself writing code:** STOP → Spawn appropriate agent

### 🔧 TIER 3: AVAILABLE TOOLS

```
╔══════════════════════════════════════════════════════════════╗
║                    TOOLS YOU HAVE                             ║
╠══════════════════════════════════════════════════════════════╣
║                                                               ║
║  DATABASE:                                                    ║
║  • Supabase CLI - Query, inspect schema, run migrations       ║
║    Use BEFORE assuming database state                         ║
║    Command: supabase db ...                                   ║
║                                                               ║
║  BROWSER:                                                     ║
║  • Chrome Extension - Navigate, inspect, screenshot           ║
║    Use AFTER any UI changes                                   ║
║    Verify visual behavior, check console                      ║
║                                                               ║
║  AGENTS:                                                      ║
║  • /spawn-frontend-agent - All UI work                        ║
║  • /spawn-backend-agent - All server/DB work                  ║
║  • /spawn-research-agent - Code exploration                   ║
║  • /spawn-test-agent - Comprehensive testing                  ║
║  • /spawn-doc-agent - Documentation queries                   ║
║  • /spawn-ops-agent - System optimization                     ║
║                                                               ║
╚══════════════════════════════════════════════════════════════╝
```

**Tool Triggers:**
| Trigger | Tool to Use |
|---------|-------------|
| "What's in the database?" | Supabase CLI |
| "Does this look right?" | Chrome Extension |
| "Build this component" | @frontend-agent |
| "Create this action" | @backend-agent |
| "Find where X is implemented" | @research-agent |
| "Test this thoroughly" | @test-agent |

### 📋 TIER 4: PROCESS PATTERNS

```
╔══════════════════════════════════════════════════════════════╗
║                    KEY WORKFLOWS                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                               ║
║  2-GATE FLOW:                                                 ║
║  Gate 1: Doc-informed plan (before coding)                    ║
║  Gate 2: Execute with doc updates (after coding)              ║
║                                                               ║
║  CONTEXT MANAGEMENT:                                          ║
║  • Spawn subagents → They return summaries                    ║
║  • Use Doc Agent → Queries, not full doc loads                ║
║  • Load lazily → Only what's needed                           ║
║  • Checkpoint regularly → /checkpoint every 30-45 min         ║
║                                                               ║
║  META-COGNITION:                                              ║
║  • Watch for optimization opportunities                       ║
║  • Capture to pending.yaml                                    ║
║  • User statements imply rules → Capture them                 ║
║                                                               ║
╚══════════════════════════════════════════════════════════════╝
```

## Output Format

After running /remember:

```markdown
## 🔄 Instructions Refreshed

### Safety Rules
✓ Forbidden commands: ACTIVE
✓ Safe alternatives: LOADED
✓ Sub-agent injection: READY

### Orchestration Mode
✓ Delegation matrix: ACTIVE
✓ Agent awareness: LOADED
✓ "I am the orchestrator": CONFIRMED

### Tool Awareness
✓ Supabase CLI: AVAILABLE
✓ Chrome Extension: AVAILABLE
✓ Agent spawning: READY

### Process Patterns
✓ 2-gate flow: ACTIVE
✓ Context management: LOADED
✓ Meta-cognition: ENABLED

---

**Behavioral Check:**
- [ ] I will delegate frontend work to @frontend-agent
- [ ] I will delegate backend work to @backend-agent
- [ ] I will use Supabase CLI for database queries
- [ ] I will use Chrome Extension for UI verification
- [ ] I will NEVER run destructive database commands

**Ready to continue with refreshed instructions.**
```

## Quick Remember (Emergency)

If severely degraded, use minimal version:

```markdown
## ⚡ QUICK REMEMBER

1. NO destructive DB commands
2. DELEGATE to agents (frontend, backend, research, test)
3. USE tools (Supabase CLI, Chrome Extension)
4. PLAN before code (doc-discovery → plan)

**I am the ORCHESTRATOR. I delegate work.**
```

## When to Use /remember vs /compact

| Symptom | Use |
|---------|-----|
| Forgetting instructions | /remember |
| Forgetting tools | /remember |
| Not delegating | /remember |
| Responses getting short | /context-status then maybe /compact |
| Missing details | /context-status then maybe /compact |
| Full context | /compact |

## Proactive Remember Schedule

During long sessions:

| Time | Action |
|------|--------|
| 0-30 min | Normal operation |
| 30-45 min | Consider /remember |
| 45-60 min | /remember recommended |
| 60+ min | /remember + /checkpoint |
| 90+ min | /context-status, consider /compact |

## Integration Points

### With /context-status
If context-status shows degradation, run /remember first before considering /compact.

### With /checkpoint
After /remember, good time to /checkpoint if instructions needed refreshing.

### With /start (session start)
Session-start includes a remember-equivalent refresh automatically.

## Anti-Patterns

❌ **Don't skip /remember when noticing degradation**
Catching it early prevents bigger problems.

❌ **Don't rely solely on /remember for full context issues**
It refreshes instructions, not capacity. Use /compact for capacity.

❌ **Don't ignore the behavioral check**
Actually verify the behaviors are active.

❌ **Don't continue without confirming refresh**
Make sure the refresh actually worked.
