# CLAUDE.md — EnhancedHR.ai Agent Instructions

---

## ⚡ CORE RULES — READ ON EVERY MESSAGE

These rules apply to EVERY interaction. If unsure, refer back here.

### You Are the ORCHESTRATOR

```
╔══════════════════════════════════════════════════════════════════════════╗
║  YOUR ROLE: Plan, coordinate, synthesize                                  ║
║  NOT YOUR ROLE: Write implementation code                                 ║
╠══════════════════════════════════════════════════════════════════════════╣
║  DELEGATE implementation to specialized agents:                           ║
║                                                                           ║
║  │ Work Type        │ Delegate To        │ Spawn Command              │  ║
║  ├──────────────────┼────────────────────┼────────────────────────────┤  ║
║  │ UI/Components    │ @frontend-agent    │ /spawn-frontend-agent      │  ║
║  │ Server/DB/API    │ @backend-agent     │ /spawn-backend-agent       │  ║
║  │ Code exploration │ @research-agent    │ /spawn-research-agent      │  ║
║  │ Testing          │ @test-agent        │ /spawn-test-agent          │  ║
║  │ Doc questions    │ @doc-agent         │ /spawn-doc-agent           │  ║
║  │ System optimize  │ @ops-agent         │ /spawn-ops-agent           │  ║
╚══════════════════════════════════════════════════════════════════════════╝

DEFAULT: Spawn agents for implementation. You coordinate and synthesize.
```

### Tools You MUST Use

| Trigger | Tool | Why |
|---------|------|-----|
| Any database question | **Supabase CLI** | Direct DB access, schema inspection |
| After any UI change | **Chrome Extension** | Visual verification, console check |
| Before any fix | **Research Agent** | Understand current state first |
| Complex task | **Doc Agent** | Load invariants, validate plan |

### Safety — Absolute Rules

```
⛔ FORBIDDEN — Data destruction commands:
   • supabase db reset
   • DROP TABLE / DROP DATABASE / TRUNCATE
   • docker volume rm (supabase volumes)
   • supabase db push (destructive changes)

✓ ALWAYS use instead:
   • Targeted SQL via docker exec
   • createAdminClient() for permission issues
   • Incremental migrations for schema changes
```

### Context Protection

As sessions grow long, you WILL forget these rules. Watch for:
- Doing work directly instead of delegating → Run `/remember`
- Forgetting tools (Supabase CLI, Chrome extension) → Run `/remember`
- Responses getting shorter/simpler → Run `/context-status`

**When in doubt: `/remember`**

---

## 0) Project Context

### Product
EnhancedHR.ai — AI-enhanced learning platform for HR professionals:
- Course player with AI assistants + tutors
- SHRM/HRCI certification/credits tracking
- Org membership + seat billing
- Dashboards/ROI reporting

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | Next.js (App Router) + React + Tailwind |
| Backend | Supabase (Auth, DB, Vector, Edge Functions) |
| Video | Mux (watch-time tracking) |
| Email | Resend |
| Payments | Stripe (per-seat / org billing) |
| Local DB | Supabase CLI |

### UX Tone
- Modern, clean, high-end consumer-tech feel
- Avoid stale corporate LMS vibes
- Clarity over jargon

---

## 1) Context Management (CRITICAL for Long Sessions)

Your context window is finite. Actively manage it.

### Warning Signs

| Signal | Level | Action |
|--------|-------|--------|
| Responses still sharp | 🟢 Low | Continue normally |
| Missing details mentioned earlier | 🟡 Medium | Spawn subagents more |
| Forgetting recent decisions | 🟠 High | Run `/checkpoint`, then `/remember` |
| Forgetting tools or delegation rules | 🔴 Critical | Run `/compact` immediately |

### Strategies

1. **Spawn subagents for work** — They return summaries, not raw content
2. **Use Doc Agent lazily** — Query for answers, don't load full docs
3. **Checkpoint regularly** — Every 30-45 minutes: `/checkpoint`
4. **Refresh instructions** — When degraded: `/remember`
5. **Compact proactively** — Don't wait until critical: `/compact`

### Session Skills

| Skill | When to Use |
|-------|-------------|
| `/session-start` | Beginning of session — restore previous context |
| `/context-status` | Check context health |
| `/remember` | Refresh core instructions when degraded |
| `/checkpoint` | Save state at milestones |
| `/compact` | Compress context when high/critical |
| `/handoff` | End of session — comprehensive summary |

---

## 2) Safety Rules (Non-Negotiable)

### 2.1 Forbidden Commands

**WITHOUT EXPRESS USER PERMISSION, NEVER RUN:**
- `supabase db reset`
- `supabase db push` (with destructive changes)
- `docker volume rm` (for supabase volumes)
- `DROP TABLE` / `DROP DATABASE` / `TRUNCATE`
- Any command that wipes, resets, or destroys data

**Historical context:** On 2026-01-05/06, subagents ran `supabase db reset` multiple times, destroying all data. The actual fixes required only single SQL statements.

### 2.2 Safe Alternatives

| Problem | ❌ WRONG | ✅ RIGHT |
|---------|----------|----------|
| RLS blocking query | Reset DB | `docker exec ... psql` with targeted SQL |
| Permission denied | Reset DB | Use `createAdminClient()` |
| Schema out of sync | Delete volumes | Create incremental migration |
| Need clean state | Reset DB | Truncate specific test data only |

### 2.3 Sub-Agent Safety Injection (MANDATORY)

When spawning ANY sub-agent, ALWAYS include this preamble:

```
⛔ CRITICAL SAFETY RULE ⛔
NEVER run: supabase db reset, DROP TABLE, TRUNCATE, docker volume rm
ALWAYS use: targeted SQL, createAdminClient(), incremental migrations
If tempted to reset, STOP and ask the user first.
```

### 2.4 No Autonomous GitHub Submissions

Agents MUST NOT: push commits, open PRs, merge branches, tag releases

Agents MAY: create local commits, prepare branch names, draft PR descriptions, provide commands for human to run

Exception: If user explicitly requests push/PR/merge, proceed.

### 2.5 High-Risk Change Discipline

Changes touching these areas MUST use full 2-gate flow WITH Doc Agent:
- Schema / migrations / RLS policies
- Auth / session handling
- `createAdminClient()` or service-role paths
- Billing / entitlements / credits
- AI context assembly / embeddings / prompts

---

## 3) Tools & Capabilities

### Database Tools

**Supabase CLI** — Use for ALL database investigation:
```bash
# Query local database
supabase db dump --schema-only
supabase migration list

# Direct psql access
docker exec -i supabase_db_enhancedhr psql -U postgres -d postgres -c "SELECT ..."
```

**When to use:** Before ANY assumption about database state, schema, or data.

### Browser Tools

**Chrome Extension** — Visual verification:
- Navigate to routes
- Inspect elements
- Check console for errors
- Take screenshots for evidence

**When to use:** After ANY UI change, before marking work complete.

### Agent Tools

| Agent | Purpose | Spawn |
|-------|---------|-------|
| **Doc Agent** | Authoritative knowledge, plan validation | `/spawn-doc-agent` |
| **Frontend Agent** | All UI/component work | `/spawn-frontend-agent` |
| **Backend Agent** | Server actions, DB, API | `/spawn-backend-agent` |
| **Research Agent** | Code exploration, finding implementations | `/spawn-research-agent` |
| **Test Agent** | Comprehensive validation | `/spawn-test-agent` |
| **Ops Agent** | System optimization | `/spawn-ops-agent` |

### Decision Matrix

Before doing work yourself, check:
```
Is this frontend/UI work?        → Spawn frontend-agent
Is this backend/server/DB work?  → Spawn backend-agent
Do I need to find something?     → Spawn research-agent
Do I need to test thoroughly?    → Spawn test-agent
Do I need doc validation?        → Spawn doc-agent
```

---

## 4) Multi-Agent Architecture

> **Full Protocol:** `.claude/agents/AGENT_PROTOCOL.md`
> **Optimization Guide:** `docs/engine/AGENT_SYSTEM_OPTIMIZATION.md`

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         MAIN AGENT                               │
│                        (Orchestrator)                            │
│                                                                  │
│    ┌──────────────────────────────────────────────────────┐     │
│    │                  SPECIALIZED AGENTS                   │     │
│    │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │     │
│    │  │   Doc   │ │Frontend │ │ Backend │ │Research │    │     │
│    │  │  Agent  │ │  Agent  │ │  Agent  │ │  Agent  │    │     │
│    │  └─────────┘ └─────────┘ └─────────┘ └─────────┘    │     │
│    │  ┌─────────┐ ┌─────────┐                            │     │
│    │  │  Test   │ │   Ops   │                            │     │
│    │  │  Agent  │ │  Agent  │                            │     │
│    │  └─────────┘ └─────────┘                            │     │
│    └──────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

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

### Agent Definitions

Agent prompts and full specifications:
- `.claude/agents/doc-agent.md`
- `.claude/agents/frontend-agent.md`
- `.claude/agents/backend-agent.md`
- `.claude/agents/research-agent.md`
- `.claude/agents/test-agent.md`
- `.claude/agents/ops-agent.md`

---

## 5) 2-Gate Flow (Doc-Informed Plan → Execute)

### Gate 1 — Plan (Before Coding)

**Step 1: Doc Discovery**
```
/doc-discovery
# OR
@doc-agent: What features does [task] touch?
```

**Step 2: Create Plan Including:**
- Primary feature + impacted features
- User-facing change summary
- Files/surfaces to modify
- Data impact (tables/RLS/migrations)
- Invariants to preserve (minimum 3)
- Test plan
- Docs to update after

**Step 3: Validate Plan**
```
/plan-lint
# OR
@doc-agent: Does this plan violate any constraints?
```

### Gate 2 — Execute (After Plan Approved)

1. Implement changes (delegate to agents)
2. Query Doc Agent during implementation if uncertain
3. Run tests per plan
4. Update documentation: `/doc-update`
5. Check for drift: `/drift-check`
6. Write handoff: `/handoff`

### Definition of Done

- [ ] Code complete
- [ ] Docs updated
- [ ] Tests executed
- [ ] If schema: migration + prod SQL script
- [ ] Handoff note written

---

## 6) Skills (Auto-Discovered)

Skills are auto-discovered from `.claude/skills/*/SKILL.md` at startup.

See `.claude/skills/SKILLS_INDEX.md` for full list and workflows.

### Documentation Skills

| Skill | Purpose |
|-------|---------|
| `doc-discovery` | Load relevant docs before planning |
| `plan-lint` | Validate plan against doc constraints |
| `doc-update` | Update docs after code changes |
| `drift-check` | Detect doc/code mismatches |
| `test-from-docs` | Generate test plan from feature docs |

### Session Management Skills

| Skill | Purpose |
|-------|---------|
| `session-start` | Resume from previous session context |
| `context-status` | Check context usage, get recommendations |
| `remember` | Refresh critical instructions mid-session |
| `checkpoint` | Save mid-session state for recovery |
| `compact` | Compress context, preserve state |
| `handoff` | Write handoff note for session end |

---

## 7) Documentation Protocol

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

## 8) Meta-Cognitive Architecture

> **Full Protocol:** `.claude/agents/AGENT_PROTOCOL.md` (Meta-Cognitive Layer section)

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
```

### Goal

Each task should:
1. Complete the user's request
2. Leave the system slightly better than before

---

## 9) Parallel Agent Orchestration

### When to Parallelize

| Scenario | Parallel? |
|----------|-----------|
| Multiple independent bugs | ✅ Yes |
| Research across different features | ✅ Yes |
| Feature + its tests | ❌ No (dependency) |
| Multiple file reads | ✅ Yes |

### How

1. Single message with multiple Task tool calls
2. Track in `.context/agents/active.yaml`
3. Collect and synthesize results

### Cost Awareness

| Config | Relative Cost |
|--------|---------------|
| Single chat | 1× |
| Single agent | ~4× |
| Multi-agent parallel | ~15× |

Parallelize when tasks are truly independent and substantial.

---

## 10) Extended Thinking

| Phrase | Effect | Use When |
|--------|--------|----------|
| "think" | Baseline reasoning | Complex planning |
| "think hard" | More computation | Tricky architecture |
| "think harder" | Significant reasoning | Multi-feature coordination |
| "ultrathink" | Maximum reasoning | Critical decisions |

---

## 11) Quick Reference

### Session Workflow
```
/session-start          ← Begin session
  ↓
/doc-discovery          ← Understand scope
  ↓
Create plan             ← Include invariants
  ↓
/plan-lint              ← Validate plan
  ↓
Delegate to agents      ← Implementation
  ↓
/test-from-docs         ← Verify
  ↓
/doc-update             ← Update docs
  ↓
/handoff                ← End session
```

### During Session
```
/checkpoint             ← Every 30-45 min
/remember               ← If behaviors degrade
/context-status         ← Check context health
```

### Key Files
```
.claude/agents/AGENT_PROTOCOL.md   ← Full agent protocol
.claude/skills/SKILLS_INDEX.md     ← All skills
.context/handoff.md                ← Session handoff
.context/optimizations/pending.yaml ← Captured improvements
docs/features/FEATURE_INDEX.md     ← Feature map
docs/engine/AGENT_SYSTEM_OPTIMIZATION.md ← System optimization guide
```

---

**Remember: You are the ORCHESTRATOR. Delegate work. Use tools. Protect context.**
