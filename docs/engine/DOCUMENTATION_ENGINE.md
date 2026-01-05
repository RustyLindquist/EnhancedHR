# Documentation Engine (EnhancedHR.ai)

This repository is intended to be a **foundation app**: it must support rapid parallel feature development (often by agents), safe merging back into `main`, and future downstream apps that may fork and merge improvements back.

This document instantiates a **documentation engine** for this codebase. It is the source of truth for *how* documentation is structured, *when* it must be consulted/updated, and *how* it is used to reduce regressions.

## Multi-Agent Integration

This documentation engine is designed to work with the **Documentation Agent (Living Canon)** — a specialized agent that serves as a persistent, queryable knowledge source for the codebase. The Doc Agent:

- Loads documentation lazily as queries require
- Answers questions about features, invariants, and constraints
- Validates plans before execution
- Can be queried by the Main Agent and any Sub-Agents

See `.claude/agents/doc-agent.md` for the full specification and `AGENTS.md` Section 3 for the multi-agent architecture.

## A. Purpose & Scope

### What this engine exists to do

- Provide **feature-scoped, agent-first** documentation that allows developers and agents to modify the system safely without re-discovering architecture every time.
- Make critical **invariants and dependencies explicit** (data schema, roles/RLS, AI context rules, progress/credits math).
- Convert “tribal knowledge” into a **repeatable protocol** that reduces merge failures and regressions.
- Keep documentation actionable: it must drive **testing scope** and **deployment readiness**, not act as a post-hoc narrative.

### Problems this engine explicitly prevents

- Agents changing UI flows without noticing **server actions / DB invariants** they rely on.
- Silent regressions from changes to **Supabase tables + RLS**, especially when using `createAdminClient()` vs `createClient()`.
- AI behavior regressions caused by modifying **context assembly** (`src/lib/ai/context.ts`) without documenting assumptions.
- “It worked locally” failures due to missing **migration + production-safe SQL** pairing (local Supabase CLI vs prod).
- Downstream-app divergence where feature boundaries are unclear and merges are brittle.

### Out of scope

- Writing the feature docs themselves (this doc defines the schema and process).
- Replacing existing PRDs in `/docs` (they remain useful; this engine adds enforceable structure and triggers).

## B. Documentation Layers (Instantiated)

Documentation is **feature-scoped**, not file-scoped. Layers exist so agents can load only what they need, just-in-time.

### 1) Feature Docs (`/docs/features/*`)

**Definition:** One doc per product feature, end-to-end (UI surfaces → actions/APIs → data model → invariants → tests).

**Why this repo needs it:**
- The UI is built from large compositional surfaces (e.g., `MainCanvas`) that blend many features; file-scoped docs would be unusable.
- Core capabilities (Courses, Collections, Prometheus, Tools) span **routes + components + server actions + Supabase tables**.

### 2) Workflow Docs (`/docs/workflows/*`)

**Definition:** One doc per critical multi-feature workflow (signup → onboarding; take course → progress → credits; tool run → conversation save).

**Why this repo needs it:**
- Workflows cross route groups and contexts (e.g., `/login` → app shell → course player → AI panel).
- Workflow breakage is usually caused by small changes in “unrelated” areas; workflow docs define regression tests.

### 3) Foundation Docs (`/docs/foundation/*`)

**Definition:** Cross-cutting systems that many features depend on (Auth/RBAC/RLS, AI context engine, billing, video tracking).

**Why this repo needs it:**
- Supabase schema + RLS and “admin client bypass” patterns are high-impact.
- AI context assembly is a platform-level dependency used by Prometheus, course AI, and collection assistants.

### 4) Engine / Agent Protocol Docs (`/docs/engine/*`)

**Definition:** The contract that governs how changes are planned, documented, tested, and pushed.

**Why this repo needs it:**
- The team runs multiple agents in parallel; consistency must not depend on who is working.
- Documentation must be **triggered and enforced**, not optional.

## C. Feature Documentation Schema (Finalized)

Each feature doc lives at: `docs/features/<feature-slug>.md`

### Doc stability classification (required)

Each feature doc must declare a `stability` classification in front-matter so agents can calibrate how much to trust the doc vs verify behavior directly in code:

- `core`: mature and widely depended on. Preserve invariants; changes require extra caution and workflow testing.
- `evolving`: actively changing. Expect frequent iteration; review recent commits and re-validate assumptions.
- `experimental`: volatile or prototyped. Docs may lag; verify behavior in code and in the running app.

### Front-matter (required)

Use YAML front-matter at the top of each feature doc:

```yaml
---
id: <feature-slug>
owner: <team|person>
status: draft|active|deprecated
stability: core|evolving|experimental
last_updated: YYYY-MM-DD
surfaces:
  routes:
    - /path
  collections:
    - <collection-id-if-applicable>
data:
  tables:
    - public.<table_name>
  storage:
    - <bucket|path> # optional
backend:
  actions:
    - src/app/actions/<file>.ts
  api:
    - src/app/api/<route>/route.ts
ai:
  context_scopes:
    - <GLOBAL|COLLECTION|COURSE|TOOL|...>
  models:
    - <provider/model> # optional
tests:
  local:
    - <command or checklist>
  staging:
    - <workflow smoke test>
invariants:
  - <short invariant sentence>
---
```

### Required sections (in this exact order)

1. **Overview**
   - What the feature does for end users (2–6 sentences).
   - What “success” looks like.
2. **User Surfaces**
   - Routes, screens, major UI entry points.
   - Where it appears inside the app shell (e.g., a collection view, a panel).
3. **Core Concepts & Objects**
   - Define domain objects in feature terms (not file terms).
4. **Data Model**
   - Tables involved and the meaning of key columns.
   - Write-paths (what creates/updates rows) and read-paths.
5. **Permissions & Security**
   - Roles involved (e.g., `profiles.role`) and any RLS assumptions.
   - When `createAdminClient()` is used and why.
6. **Integration Points**
   - External systems (Mux/Stripe/Resend/Drive) and contract assumptions.
7. **Invariants**
   - Bullet list of non-negotiable truths that must remain true.
8. **Failure Modes & Recovery**
   - Common breakages, symptoms, and how to debug quickly.
9. **Testing Checklist**
   - Minimal local verification steps and the staging smoke test for the feature.
10. **Change Guide**
   - “If you need to change X, update Y and beware Z.”
11. **Related Docs**
   - Links to workflow/foundation docs that commonly apply.

### Optional sections

- **AI Behavior Notes** (required only if the feature changes prompts/context/tools)
- **Analytics / Telemetry** (required if changes affect event capture)
- **Migration Notes** (required if schema or backfills are involved)
- **UX Constraints** (if design invariants exist)

### Where concise narrative belongs

Narrative is allowed only where it helps preserve invariants and reasoning:
- Why the data model is shaped this way.
- Why permissions are structured this way.
- Why a workflow must remain consistent.

Avoid prose that is not actionable for changes and testing.

## D. The Agent Protocol (2‑Gate Flow)

This repo uses a streamlined 2‑gate flow where documentation review is integrated into planning. It is mandatory for agents and strongly recommended for humans.

### Gate 1: Doc-Informed Plan (before coding)

Documentation review happens DURING planning, not after. This ensures plans are grounded in documented constraints from the start.

**Step 1: Doc Discovery**
- Open `docs/features/FEATURE_INDEX.md` to identify primary feature
- Check coupling notes for impacted features
- Open relevant feature docs and foundation docs
- Use `/doc-discovery` command if available

**Step 2: Plan Creation**
The plan must include:
- **Primary feature:** from FEATURE_INDEX.md
- **Impacted features:** from coupling notes + analysis
- **Change intent:** what user-facing behavior changes
- **Files & surfaces:** which routes/components/actions are touched
- **Data impact:** tables/columns/permissions affected; whether Supabase migrations are required
- **Invariants to preserve:** extracted from feature docs (at least 3 bullets)
- **Test plan:** local steps + at least one workflow smoke test
- **Docs to update after execution:** which feature/workflow/foundation docs will need changes

**Step 3: Plan Validation**
Use `/plan-lint` to verify:
- All impacted features are identified
- Invariants are correctly listed from docs
- Test plan is complete
- High-risk systems have appropriate safeguards

#### Plan size guidance

- **Small change (≤1 file, low risk):** 5–8 bullets is fine.
- **Medium change (2–6 files, one feature):** include invariants + rollback note.
- **Large change (multi-feature / schema changes):** include staged rollout and backfill strategy.

### Gate 2: Execute with Doc Updates

Once the plan is approved:
1. Implement the changes
2. Run tests per the plan's test checklist
3. Update documentation (use `/doc-update`)
4. Run `/drift-check` if changes touched multiple features
5. Write handoff note (use `/handoff`)

**Definition of done**
- Code change complete
- Documentation updated (feature docs, FEATURE_INDEX if needed)
- Tests executed per plan
- If schema changes: migration + production-safe SQL script
- Handoff note in `.context/handoff.md`

## E. Documentation Triggers

Documentation is consulted/reviewed/updated based on triggers, not preference.

### Consult (before coding)

Consult docs when you:
- Touch any server action in `src/app/actions/*` (feature + foundation context).
- Touch AI context or prompting (`src/lib/ai/*`, `src/app/actions/ai.ts`, `/api/chat*`).
- Touch Supabase schema, RLS, or use `createAdminClient()`.
- Add/modify a route under `src/app/*`.

### Update (after coding)

Update docs when you:
- Change a user-facing flow or UI surface.
- Change any table usage (reads/writes), add columns, or alter RLS assumptions.
- Add a new “system concept” (new collection type, new context scope, new tool agent type).

### Review (before GitHub push)

Before pushing:
- Ensure the plan’s doc updates are committed.
- Ensure the testing checklist in the relevant feature/workflow doc is still accurate.
- Ensure DB changes have both:
  - a migration under `supabase/migrations/`,
  - a production-safe SQL script under `supabase/` (or `/scripts/`), if production is not auto-migrated.

### Doc drift signal (manual for now)

Any change that touches files listed in **two or more feature docs** should trigger a **drift review** (manual today, automatable later):
- Re-check the impacted feature boundaries and coupling notes.
- Update feature docs (and `docs/features/FEATURE_INDEX.md`) if ownership/responsibility has shifted.
- Add or revise workflow tests if the blast radius increased.

### Workspace archival (handoff)

Before ending a workspace:
- Write a brief handoff note in `.context/` describing what changed, what remains, and how to verify.

### On demand

During debugging or incidents:
- Update the relevant “Failure Modes & Recovery” sections with the symptom + fix once understood.

## F. Testing Integration

Documentation is an input to testing:

- Every **feature doc** must include a **Testing Checklist** that:
  - scopes the minimum local verification steps,
  - names the primary workflow smoke test,
  - calls out any staging-only validations (Stripe webhooks, Mux events).
- Every **workflow doc** defines:
  - the smoke test steps,
  - the expected data mutations (which tables should change),
  - the key UI confirmation points.

**Repository reality note:** `pnpm build` is the current baseline deployment validation. Linting may fail due to legacy areas; doc-driven testing should specify what is required for a given change.

---

## Codebase‑Specific Findings That Shape This Strategy

These are repo-grounded observations that drive the need for strict feature/workflow/foundation layering.

### Natural feature boundaries (as implemented)

- **App shell + navigation/canvas:** the main application experience is composed in large surfaces (notably `src/components/MainCanvas.tsx`) that switch between collection-based views.
- **Courses & learning:** courses/modules/lessons/resources with progress tracking (`courses`, `modules`, `lessons`, `course_resources`, `user_progress`).
- **Collections & context items:** user collections plus heterogeneous items (`user_collections`, `collection_items`, `user_context_items`) and drag/drop organization.
- **Prometheus & conversations:** chat UX + persistence (`conversations`, `conversation_messages`) with metadata-based specialization (e.g., tool conversations).
- **AI engine & context resolution:** centralized context assembly and inference (`src/lib/ai/*`, `/api/chat*`) used across Prometheus, course AI, and collection assistants.
- **Credits & certificates:** certification eligibility and earned outcomes (`user_credits_ledger`, `certificates`) surfaced in dashboards.
- **Tools:** curated workflows backed by agents (`tools` table) that create conversations via `conversations.metadata`.
- **Org + membership:** org records and membership (`organizations`, `organization_members`) and role-based UI.
- **Admin/author surfaces:** separate route trees under `/admin` and `/author` with elevated permissions.

### Cross-cutting concerns requiring doc discipline

- **Auth + roles:** `profiles` is a central authority for role/organization membership; subtle changes can lock users out or expose admin screens.
- **RLS vs admin client:** many operations use `createAdminClient()` to bypass RLS; these require explicit documentation and test coverage.
- **AI context scope:** multiple experiences depend on `ContextScope` shaping retrieval and prompt assembly; changes here have platform-wide blast radius.
- **Progress + credits math:** progress and credits rely on table updates and eligibility rules; these should be treated as invariants.
- **External integrations:** Stripe, Mux, and email are workflow-critical and must be documented as contracts (inputs/outputs, failure modes).

### Tight coupling / elevated-risk areas

- **`MainCanvas` as a feature hub:** adding a new “collection-like” experience often requires changes across navigation, state, and panels.
- **Conversation metadata as polymorphism:** tool conversations are implemented via `conversations.metadata`; schema drift here can break resume/export flows.
- **Doc + DB sync:** local Supabase CLI migrations do not automatically guarantee production sync; missing prod scripts create long-tail bugs.

### Invariants that must be documented (even if non-obvious)

- Canonical **slugs/ids** for collections and help/tools must remain stable (UI expects them; AI context expects them).
- Use `createAdminClient()` only when required, and document the reason and data exposure risk.
- Any schema change must include a **migration** and a **production-safe SQL** path if prod isn’t auto-migrated.

### Downstream app / merge-back risk

- Feature work in downstream apps will commonly diverge in:
  - AI prompting/context behavior,
  - billing/membership gating,
  - course progress schema.
  These areas require strong documentation to make merge-back feasible and safe.

---

## V1 Documentation Backlog (Prioritized)

This is the minimal set of docs to create next so agents can work safely. **Do not write these docs in this pass**—this is the backlog.

### P0 — Feature docs (highest regression risk)

1) **`collections-and-context.md`**
   - Scope: collections, collection items, context items, drag/drop, collection assistant expectations.
   - Risk mitigated: breakage in organization, AI context, and navigation since many features route through collections.

2) **`prometheus-chat.md`**
   - Scope: conversations/messages persistence, resume/save/export, metadata conventions, AI panel vs full page.
   - Risk mitigated: lost conversation history, broken resume flows, tool conversation drift.

3) **`course-player-and-progress.md`**
   - Scope: course navigation, lesson player, progress writes/reads, Mux watch-time expectations.
   - Risk mitigated: progress regressions, certification eligibility drift, analytics gaps.

4) **`ai-context-engine.md`**
   - Scope: `ContextScope`, retrieval sources, embeddings usage, “special-case” contexts (e.g., Help collection), and how prompts are assembled.
   - Risk mitigated: platform-wide AI behavior regressions and cost spikes.

5) **`tools.md`**
   - Scope: tools catalog, tool conversations, agent types, tool → conversation creation, tool-specific context scope.
   - Risk mitigated: broken tool launches and orphaned conversations.

6) **`help-collection.md`**
   - Scope: `help_topics` table, UI registry mapping, how card click → panel works, how AI uses help context.
   - Risk mitigated: help becoming stale, broken onboarding guidance, missing assistant context.

### P1 — Foundation docs

1) **`auth-roles-rls.md`**
   - Scope: `profiles` role meanings, org membership, RLS expectations, admin client usage rules.
   - Risk mitigated: permission bugs and data exposure.

2) **`supabase-schema-and-migrations.md`**
   - Scope: how migrations are authored/applied locally, how production sync scripts are produced/run, naming conventions.
   - Risk mitigated: environment drift and “works locally” failures.

3) **`payments-and-membership.md`**
   - Scope: Stripe checkout/portal/webhooks, membership gating, seat model assumptions.
   - Risk mitigated: revenue-impacting bugs and user access issues.

4) **`video-and-progress-tracking.md`**
   - Scope: Mux integration, watch-time tracking expectations, progress update timing.
   - Risk mitigated: inaccurate progress and credits.

### P2 — Workflow docs

1) **`signup-login-onboarding.md`**
   - Scope: `/login`, auth callback, profile creation, first-run experience.
   - Risk mitigated: broken first impressions and blocked access.

2) **`take-a-course-to-credit.md`**
   - Scope: start course → watch → progress updates → credits ledger → certificate generation.
   - Risk mitigated: the most important end-user value loop.

3) **`use-tool-to-output.md`**
   - Scope: open tool → create tool conversation → produce output → save/export.
   - Risk mitigated: tool adoption failures.

### P3 — Engine additions (optional but valuable)

- **Doc templates:** copy/paste templates for feature/workflow/foundation docs to minimize friction.
- **Automation hooks:** a CI check that ensures touched feature areas include doc updates (initially manual mapping).
