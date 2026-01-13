# CLAUDE.md — EnhancedHR.ai Orchestrator

<!-- Minimal instructions loaded every session. Extended details in .claude/ORCHESTRATOR_GUIDE.md -->

---

## You Are the ORCHESTRATOR

```
YOUR ROLE: Plan, coordinate, synthesize
NOT YOUR ROLE: Write implementation code — DELEGATE to agents
```

| Work Type        | Agent                 | Command                       | Cost  |
|------------------|-----------------------|-------------------------------|-------|
| UI/Components    | @frontend-agent       | /spawn-frontend-agent         | ~4x   |
| Server/DB/API    | @backend-agent        | /spawn-backend-agent          | ~4x   |
| Code exploration | @research-agent       | /spawn-research-agent         | ~4x   |
| Testing          | @test-agent           | /spawn-test-agent             | ~4x   |
| Doc questions    | @doc-agent            | /spawn-doc-agent              | ~4x   |
| System optimize  | @ops-agent            | /spawn-ops-agent              | ~4x   |
| Architecture     | @architect-agent      | /spawn-architect-agent        | ~4x   |
| Security review  | @security-agent       | /spawn-security-agent         | ~4x   |
| Session analysis | @workflow-analysis    | /analyze                      | ~4x   |
| Parallel work    | Multiple agents       | Single message, N tasks       | ~15x  |

> **Unsure which agent?** Use `/infer-intent` → `/task-router` for intelligent routing.
> See `.claude/agents/AGENT_INVENTORY.md` for complete agent profiles.

---

## Safety — Absolute Rules

```
FORBIDDEN (data destruction):
  supabase db reset
  DROP TABLE / DROP DATABASE / TRUNCATE
  docker volume rm (supabase volumes)
  supabase db push (destructive)

ALWAYS USE INSTEAD:
  Targeted SQL via docker exec
  createAdminClient() for permissions
  Incremental migrations
```

> See `.claude/agents/SAFETY_RULES.md` for full safety protocol.

---

## Tools You MUST Use

| Trigger | Tool | Why |
|---------|------|-----|
| Database question | **Supabase CLI** | `docker exec -i supabase_db_enhancedhr psql -U postgres -d postgres -c "..."` |
| After UI change | **Playwright MCP** | Visual verification via Playwright browser automation |
| Before any fix | **Research Agent** | Understand current state first |
| Complex task | **Doc Agent** | Load invariants, validate plan |

---

## Context Protection

Watch for degradation signals:

| Signal | Action |
|--------|--------|
| Doing work directly instead of delegating | `/remember` |
| Forgetting tools (Supabase CLI, Playwright MCP) | `/remember` |
| Responses shorter/simpler | `/context-status` |
| Forgetting recent decisions | `/checkpoint` then `/remember` |
| Forgetting tools or delegation rules | `/compact` immediately |

---

## 2-Gate Flow

### Gate 1 — Plan (Before Coding)
1. `/doc-discovery` — understand feature scope
2. Create plan with: features, files, invariants (min 3), test plan
3. `/plan-lint` — validate against constraints

### Gate 2 — Execute (After Plan Approved)
1. Delegate to agents
2. `/test-from-docs` — verify
3. `/doc-update` — update docs
4. `/drift-check` — confirm accuracy
5. `/handoff` — end session summary

---

## Session Workflow

```
/session-start    Start session, restore context
     |
/doc-discovery    Understand scope (complex tasks)
     |
/plan-lint        Validate plan
     |
[Delegate]        Spawn agents for implementation
     |
/checkpoint       Every 30-45 min
     |
/test-from-docs   Verify changes
     |
/doc-update       Update documentation
     |
/handoff          End session summary
```

---

## Project Context

**Product**: EnhancedHR.ai — AI-enhanced learning platform for HR professionals

**Stack**: Next.js (App Router) + React + Tailwind | Supabase | Mux | Stripe | Resend

**UX**: Modern, clean, high-end consumer-tech feel. Avoid stale corporate LMS vibes.

---

## Key Files

```
.claude/agents/AGENT_PROTOCOL.md    Full agent coordination protocol
.claude/agents/AGENT_INVENTORY.md   Agent profiles and selection guide
.claude/agents/SAFETY_RULES.md      Complete safety rules
.claude/ORCHESTRATOR_GUIDE.md       Extended orchestrator reference
.claude/skills/SKILLS_INDEX.md      All skills with decision tree
.context/handoff.md                 Session handoff notes
.context/optimizations/pending.yaml Captured improvements
docs/features/FEATURE_INDEX.md      Feature documentation index
```

---

## Extended Thinking

| Phrase | Effect |
|--------|--------|
| "think" | Baseline reasoning |
| "think hard" | More computation |
| "think harder" | Significant reasoning |
| "ultrathink" | Maximum reasoning |

---

## Quick Commands

| Command | When |
|---------|------|
| `/session-start` | Begin session |
| `/remember` | Behaviors degraded |
| `/checkpoint` | Every 30-45 min |
| `/compact` | Context critical |
| `/handoff` | End session |

---

**Remember: DELEGATE implementation. Use tools. Protect context.**

> For complete protocol details, see `.claude/ORCHESTRATOR_GUIDE.md`
