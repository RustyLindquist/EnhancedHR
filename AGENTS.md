# AGENTS.md — Agent Protocol (EnhancedHR.ai)

This repository uses **documentation as infrastructure**: a shared cognitive substrate that enables heterogeneous agents (across models/tools/IDEs) to safely understand, modify, test, and evolve the codebase without regressions.

Authoritative engine + feature docs live in:
- `docs/engine/DOCUMENTATION_ENGINE.md`
- `docs/features/FEATURE_INDEX.md`
- `docs/features/*.md`

Agent definitions and protocols live in:
- `.claude/agents/` (agent prompts)
- `.claude/commands/` (skill commands)

---

## 0) Project Context (fast orientation)

### Product
EnhancedHR.ai is an AI-enhanced learning platform for HR professionals and leaders, with:
- courses and course player
- AI course assistants + tutors
- certifications/credits tracking (SHRM/HRCI)
- org membership + seat billing
- dashboards/ROI reporting

### Technical Stack (strict)
- Frontend: Next.js (App Router) + React
- Styling: Tailwind CSS
- Backend: Supabase (Auth, DB, Vector, Edge Functions)
- Video: Mux (watch-time tracking)
- Email: Resend
- Payments: Stripe (per-seat / org billing)

### UX & Tone
- Modern, clean, high-end consumer-tech feel
- Avoid stale corporate LMS vibes
- Favor clarity over jargon

---

## 1) Authority Order (avoid confusion)

When sources conflict, use this order:

1) **Code + runtime behavior** (source of truth)
2) **DB schema / migrations / RLS policies** (binding constraints)
3) **Feature docs** (`docs/features/*`) (canonical description of behavior)
4) **Engine docs** (`docs/engine/*`) (protocol and schema)
5) **PRDs** (`/docs/*.md`) (intent/history only; not authoritative for current behavior)
6) **Legacy docs** (secondary reference only)

If PRDs differ from code, document current behavior and alert the user to determine resolution strategy.

---

## 2) Non-Negotiable Safety Rules

### 2.1 No autonomous GitHub submissions (HARD RULE)
Agents MUST NOT:
- push commits
- open pull requests
- merge branches
- tag releases
- change GitHub settings

Agents MAY:
- create local commits
- prepare branch names
- draft PR titles/descriptions
- provide exact commands for the human to run

If the user asks for a push/PR/merge, the agent must:
1) proceed
2) summarize the exact GitHub action(s) it performed
3) notify the user of any issues, and recommend resolutions


### 2.2 High-risk change discipline (HARD RULE)
Any change touching ANY of the following must use the full 2-gate flow (Section 4) WITH a Doc Agent:
- Supabase schema / migrations
- RLS policies or permission logic
- auth/session handling
- `createAdminClient()` or service-role access paths
- Stripe billing or entitlements/credits
- AI context assembly / embeddings / prompt orchestration

### 2.3 No guessing
If something is unclear:
- inspect the code paths and call sites
- prefer "unknown until verified" over speculation
- do not invent features or flows
- consult with the user

---

## 3) Multi-Agent Architecture

This repo supports multi-agent coordination with specialized agents.

### Agent Types

| Agent | Role | When Active |
|-------|------|-------------|
| **Main Agent** | Orchestrator — receives requests, plans, coordinates | Always |
| **Doc Agent** | Living Canon — authoritative doc source, validates plans | Spawned for complex tasks |
| **Frontend Agent** | Design System Guardian — owns all UI implementation | Spawned for frontend work |
| **Sub-Agents** | Implementation — execute specific coding tasks | Spawned as needed |

### Documentation Agent (Living Canon)

The Doc Agent serves as a persistent, queryable knowledge source:

```
┌─────────────────────────────────────────────────────────────────┐
│                        WORKSPACE                                 │
│                                                                  │
│   ┌──────────────┐         ┌──────────────────────────────┐     │
│   │  Main Agent  │◄───────►│  Doc Agent (Living Canon)    │     │
│   │              │         │                              │     │
│   └──────┬───────┘         │  Lazily loads docs:          │     │
│          │                 │  ✓ FEATURE_INDEX.md          │     │
│          │                 │  ✓ collections.md (queried)  │     │
│          │                 │  ○ prometheus.md (pending)   │     │
│   ┌──────┴───────┐         └──────────────────────────────┘     │
│   │  Sub-Agents  │────────────────────▲                         │
│   └──────────────┘        can also query                        │
└─────────────────────────────────────────────────────────────────┘
```

**Key behaviors:**
- Loads `FEATURE_INDEX.md` immediately on spawn
- Loads other docs lazily as queries require them
- Retains loaded docs for the session (builds expertise)
- Answers queries from Main Agent and any Sub-Agents
- Validates plans against documented invariants

**Full specification:** `.claude/agents/doc-agent.md`

### When to Spawn the Doc Agent

**Spawn if ANY of these are true:**

| Criterion | Reason |
|-----------|--------|
| Task touches server actions | May affect multiple features |
| Task touches database/schema | High-risk, needs invariant check |
| Task touches AI/context/prompts | Platform-wide impact |
| Task is a bug fix (not styling) | Need to understand intended behavior |
| Task spans 2+ features | Coupling analysis needed |
| Task touches auth/RLS/permissions | Security-critical |
| Task touches billing/payments | Business-critical |
| Uncertain about scope | Doc Agent can clarify |

**Skip if ALL of these are true:**

| Criterion | Example |
|-----------|---------|
| Pure styling/CSS change | "Make the button blue" |
| Single-file, single-feature | "Add a tooltip to X button" |
| No server/DB involvement | Frontend-only presentation |
| No AI behavior changes | No prompts, no context |

### Querying the Doc Agent

Use clear, specific queries:

```
@doc-agent: What features does the addToCollectionAction touch?

@doc-agent: What are the invariants for course-player-and-progress?

@doc-agent: Does this plan violate any constraints?
[plan details]
```

The Doc Agent responds with structured output including features, invariants, and recommendations.

**Full protocol:** `.claude/agents/AGENT_PROTOCOL.md`

### Frontend Agent (Design System Guardian)

The Frontend Agent owns all UI implementation work, ensuring visual consistency:

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND AGENT                                │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    SKILLS                                │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│   │  │ Component    │  │ Style        │  │ New Style    │  │   │
│   │  │ Inventory    │  │ Discovery    │  │ Creation     │  │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│   │  ┌──────────────┐  ┌──────────────┐                     │   │
│   │  │ Style        │  │ Style        │                     │   │
│   │  │ Documentation│  │ Validation   │                     │   │
│   │  └──────────────┘  └──────────────┘                     │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  KNOWLEDGE BASE (grows over time)                        │   │
│   │  docs/frontend/STYLE_GUIDE.md                            │   │
│   │  docs/frontend/COMPONENT_INDEX.md                        │   │
│   │  docs/frontend/components/*.md                           │   │
│   │  docs/frontend/patterns/*.md                             │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Key behaviors:**
- Loads STYLE_GUIDE.md and COMPONENT_INDEX.md on spawn
- Checks inventory before creating anything new
- Discovers undocumented patterns and records them
- Creates new components following the design system
- Validates all work against design tokens
- Documents as it goes — knowledge persists via docs

**Full specification:** `.claude/agents/frontend-agent.md`

### When to Spawn the Frontend Agent

**Spawn for ANY frontend work that involves:**
- Creating new UI components
- Modifying existing component styling
- Building new pages or views
- Fixing UI bugs (not just typos)
- Layout changes

**Skip only for:**
- Pure text/content changes
- Backend-only work
- Simple typo fixes

### Querying the Frontend Agent

The Main Agent delegates frontend work entirely:

```
@frontend-agent: Build a new collection view for Bookmarks

@frontend-agent: Fix the card hover states on the dashboard

@frontend-agent: Create a modal for confirming deletions
```

The Frontend Agent:
1. Checks existing components (inventory)
2. Discovers similar patterns if needed
3. Builds following the design system
4. Documents any new components
5. Returns completed, validated work

---

## 4) Mandatory 2-Gate Flow (Doc-Informed Plan → Execute)

This repo uses a streamlined 2-gate flow where documentation review is integrated into planning.

### Gate 1 — Doc-Informed Plan (before coding)

**Step 0: Spawn Doc Agent (if needed)**
Evaluate the task against spawn criteria above. If complex, spawn the Doc Agent.

**Step 1: Doc Discovery**
Query the Doc Agent or run `/doc-discovery`:
```
@doc-agent: What features does [task description] touch?
```

The Doc Agent will:
- Identify primary and impacted features
- Load relevant feature docs
- Extract key invariants

**Step 2: Plan Creation**
The plan MUST include:
- **Primary feature** (from FEATURE_INDEX.md)
- **Impacted features** (from coupling notes + Doc Agent analysis)
- **User-facing change summary**
- **Files/surfaces to touch** (routes/components/actions)
- **Data impact** (tables/columns/RLS/migrations)
- **Invariants to preserve** (from Doc Agent, at least 3 bullets)
- **Test plan**: local checks + one workflow smoke test
- **Docs to update after execution**

**Step 3: Plan Validation**
Query the Doc Agent or run `/plan-lint`:
```
@doc-agent: Does this plan violate any documented constraints?
[plan]
```

The Doc Agent will return PASS or WARN with specifics.

### Gate 2 — Execute with Doc Updates

Once the plan is approved:
1. Implement the changes
2. Query Doc Agent during implementation if uncertain:
   ```
   @doc-agent: Can I change X without breaking Y?
   ```
3. Run tests per the plan's test checklist
4. Update documentation (run `/doc-update`)
5. Run `/drift-check` if changes touched multiple features
6. Write handoff note (run `/handoff`)

**Definition of Done:**
- Code change complete
- Documentation updated (feature docs, FEATURE_INDEX if needed)
- Tests executed per plan
- If schema changes: migration + production-safe SQL script
- Handoff note in `.context/handoff.md`

---

## 5) Skills (Slash Commands)

Skills are executable playbooks available via slash commands in `.claude/commands/`:

| Command | Purpose |
|---------|---------|
| `/doc-discovery` | Load relevant docs before planning |
| `/plan-lint` | Validate plan against doc constraints |
| `/doc-update` | Update docs after code changes |
| `/drift-check` | Detect doc/code mismatches |
| `/test-from-docs` | Generate test plan from feature docs |
| `/handoff` | Write handoff note for session end |

### Workflow with Doc Agent

```
Evaluate Task Complexity
         │
         ├─ Simple ──► /doc-discovery → Plan → Execute → /handoff
         │
         └─ Complex ──► Spawn Doc Agent
                              │
                              ▼
                        @doc-agent: What features?
                              │
                              ▼
                        Create Plan
                              │
                              ▼
                        @doc-agent: Validate plan?
                              │
                              ▼
                        Execute (query as needed)
                              │
                              ▼
                        /doc-update → /test-from-docs → /handoff
```

---

## 6) Documentation Lifecycle Hooks

Agents MUST consult docs (or Doc Agent) BEFORE changing:
- server actions / API routes
- AI context/prompting/embedding paths
- auth/RLS/admin-client patterns
- course progress/watch-time logic
- billing/entitlements/credits

Agents MUST update docs AFTER changing:
- any user-facing workflow/surface
- any read/write path for a table
- any AI scope, retrieval behavior, or prompts
- any security/permission behavior
- any integration point (Mux/Resend/Stripe)

Agents MUST write a handoff note at end of a work session:
- `.context/handoff.md` with:
  - summary, files changed, docs updated, how to verify, what remains

---

## 7) Modify vs Create Docs (feature overlap rules)

### Modify an existing feature doc when:
- the capability already exists and you are changing its behavior, surfaces, data paths, invariants, permissions, or tests.

### Create a new feature doc only when:
- a genuinely new end-to-end capability exists with distinct invariants/data interactions,
- and documenting it inside an existing feature doc would be confusing.

### If new code overlaps another feature substantially:
- do NOT create a new doc just because code is new.
- document the overlap via:
  - `Integration Points` in the relevant feature docs
  - updated coupling notes in `FEATURE_INDEX.md`
- only split into a new feature if invariants meaningfully differ.

---

## 8) ASCII Diagram Policy (when to include)

ASCII diagrams are optional. Include one only if it reduces regression risk.

Include a small ASCII diagram (10–25 lines max) when:
- a workflow crosses 3+ tables AND 2+ write paths, OR
- a state machine exists (approval/billing/credits), OR
- scope resolution is non-trivial (AI context scopes, org scoping, entitlements).

Do NOT include diagrams for:
- purely presentational UI
- trivial single-table CRUD.

Prefer data/write flows over component trees.

---

## 9) PRDs & Legacy Architecture Docs (how to use safely)

- PRDs (`/docs/*.md`) are **intent/history**; do not treat them as truth.
- Legacy architecture docs (`/docs/architecture/*`) are **secondary reference**:
  - may contain pitfalls and invariants not obvious in code
  - never override code behavior
- If you find mismatches, document current behavior and consider adding an ADR later.

---

## 10) Style/Quality Defaults (practical)

- Prefer small, safe changes over sweeping refactors.
- Keep code paths explicit in high-risk areas (auth/RLS/billing/AI).
- When uncertain, add tests/checklists before optimizing.
- Optimize for clarity, maintainability, and predictable behavior.
