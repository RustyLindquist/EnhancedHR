# AGENTS.md — Agent Protocol (EnhancedHR.ai)

This repository uses **documentation as infrastructure**: a shared cognitive substrate that enables heterogeneous agents (across models/tools/IDEs) to safely understand, modify, test, and evolve the codebase without regressions.

Authoritative engine + feature docs live in:
- `docs/engine/DOCUMENTATION_ENGINE.md`
- `docs/features/FEATURE_INDEX.md`
- `docs/features/*.md`

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

If PRDs differ from code, document current behavior and alert the user to determine resolution strategy,

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
Any change touching ANY of the following must use the full 3-gate flow (Section 3):
- Supabase schema / migrations
- RLS policies or permission logic
- auth/session handling
- `createAdminClient()` or service-role access paths
- Stripe billing or entitlements/credits
- AI context assembly / embeddings / prompt orchestration

### 2.3 No guessing
If something is unclear:
- inspect the code paths and call sites
- prefer “unknown until verified” over speculation
- do not invent features or flows
- consult with the user

---

## 3) Mandatory 3-Gate Flow (Plan → Doc Review → Execute)

This repo enforces a strict preflight protocol for non-trivial work.

### Gate 1 — Plan (before coding)
The Orchestrator MUST produce a plan including:
- Primary feature (from `FEATURE_INDEX.md`)
- Impacted features (from coupling notes + analysis)
- User-facing change summary
- Files/surfaces to touch (routes/components/actions)
- Data impact (tables/columns/RLS/migrations)
- Invariants to preserve (at least 3 bullets)
- Test plan: local checks + one workflow smoke test

### Gate 2 — Documentation Review (before execution)
A Documentation Agent (or doc-review skill) MUST:
- load the relevant feature docs
- validate assumptions vs invariants
- add missing dependencies/impact zones
- annotate the plan with constraints and doc-update scope

### Gate 3 — Revised Plan (before coding begins)
The Orchestrator MUST:
- incorporate doc-review annotations
- restate invariants + test scope
- proceed only when the plan is coherent

Definition of Done:
- code updated
- docs updated (if behavior changed)
- tests executed per docs
- no GitHub submission unless explicitly confirmed

---

## 4) Documentation Lifecycle Hooks (Autonomy)

Agents MUST consult docs BEFORE changing:
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

## 5) Modify vs Create Docs (feature overlap rules)

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

## 6) ASCII Diagram Policy (when to include)

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

## 7) Slash Commands & Skills (platform-independent)

Standard command vocabulary:
- See `docs/engine/SLASH_COMMANDS.md`

Standard agent playbooks (“skills”):
- See `docs/engine/SKILLS.md`

Minimum expected usage:
- `/docs:find` → `/plan:draft` → `/plan:review` → `/plan:final`
- then execute
- then `/docs:update` → `/test:smoke` → `/handoff:write`

---

## 8) PRDs & Legacy Architecture Docs (how to use safely)

- PRDs (`/docs/*.md`) are **intent/history**; do not treat them as truth.
- Legacy architecture docs (`/docs/architecture/*`) are **secondary reference**:
  - may contain pitfalls and invariants not obvious in code
  - never override code behavior
- If you find mismatches, document current behavior and consider adding an ADR later.

---

## 9) Style/Quality Defaults (practical)

- Prefer small, safe changes over sweeping refactors.
- Keep code paths explicit in high-risk areas (auth/RLS/billing/AI).
- When uncertain, add tests/checklists before optimizing.
- Optimize for clarity, maintainability, and predictable behavior.
