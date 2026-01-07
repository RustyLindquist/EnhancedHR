# Feature Implementation Pipeline

A standardized workflow for implementing new features from start to finish, ensuring quality, consistency, and proper documentation.

## When to Use This Pipeline

Use this pipeline when:
- Implementing a new user-facing feature
- Adding significant functionality to existing features
- Making changes that span multiple features
- Any non-trivial feature work (3+ steps)

Skip this pipeline for:
- Simple styling changes
- Typo fixes
- Single-line bug fixes

---

## Stage 1: Discovery

**Goal:** Understand the scope and constraints before planning.

### Checklist:
- [ ] Run `/doc-discovery` to identify affected features
- [ ] Query Doc Agent: "What features does [task description] touch?"
- [ ] Identify affected workflows (check `docs/workflows/`)
- [ ] Load relevant feature docs (Doc Agent does this automatically)
- [ ] Note key invariants and constraints

### Decision Point:
- **Complexity Assessment:**
  - Simple (1 feature, no schema) → Continue with Main Agent
  - Complex (2+ features OR schema/auth/billing/AI) → Spawn Doc Agent

**If spawning Doc Agent:**
```
@doc-agent: What features does [task description] touch?
```

---

## Stage 2: Planning

**Goal:** Create a validated implementation plan before coding.

### Checklist:
- [ ] Document primary feature (from FEATURE_INDEX.md)
- [ ] List all impacted features (from coupling notes + Doc Agent)
- [ ] Write user-facing change summary
- [ ] List files/surfaces to touch (routes/components/actions)
- [ ] Document data impact (tables/columns/RLS/migrations)
- [ ] Extract invariants to preserve (minimum 3 bullets)
- [ ] Create test plan (local checks + workflow smoke test)
- [ ] List docs to update after execution

### Plan Template:

```
## Feature Implementation Plan

**Primary Feature:** [from FEATURE_INDEX.md]

**Impacted Features:** [from coupling analysis]

**User-facing Change:**
[What the user will see/experience]

**Files to Touch:**
- Routes: [app/...]
- Components: [components/...]
- Server Actions: [actions/...]
- Database: [migrations/...]

**Data Impact:**
- Tables: [list]
- Columns: [list]
- RLS Policies: [changes]
- Migrations: [Y/N]

**Invariants to Preserve:**
- [invariant 1]
- [invariant 2]
- [invariant 3]

**Test Plan:**
1. [Local check 1]
2. [Local check 2]
3. [Workflow smoke test]

**Docs to Update:**
- [feature doc 1]
- [workflow doc if applicable]
- [FEATURE_INDEX.md if new coupling]
```

### Validation:
- [ ] Run `/plan-lint` or query Doc Agent:
  ```
  @doc-agent: Does this plan violate any documented constraints?
  [paste plan]
  ```
- [ ] Wait for PASS or address WARN issues
- [ ] Get user approval on plan

### Decision Point:
- **PASS** → Proceed to Stage 3
- **WARN** → Revise plan, re-validate
- **User rejects** → Revise plan or abort

---

## Stage 3: Implementation

**Goal:** Execute the plan with appropriate agent coordination.

### Agent Orchestration:

**Frontend Work:**
- [ ] Spawn Frontend Agent for all UI work:
  ```
  @frontend-agent: [describe UI work from plan]
  ```

**Backend Work:**
- [ ] Implement server actions
- [ ] Add/modify database migrations
- [ ] Update RLS policies (if needed)
- [ ] Add business logic

**Parallel vs Sequential:**
- **Parallel:** If contracts (types, API shape) are defined upfront
- **Sequential:** If backend/frontend depend on each other

### Progress Tracking:
- [ ] Create todo list if 3+ steps (use TodoWrite tool)
- [ ] Mark tasks in_progress before starting
- [ ] Complete tasks immediately upon finishing
- [ ] Query Doc Agent during implementation if uncertain:
  ```
  @doc-agent: Can I change X without breaking Y?
  ```

### Safety Checks:
- [ ] No `supabase db reset` or destructive commands
- [ ] Schema changes → migration file + production SQL
- [ ] RLS changes → test with multiple user roles
- [ ] Auth changes → verify session handling
- [ ] Billing changes → test entitlement logic

### Decision Point:
- **Implementation complete** → Proceed to Stage 4
- **Blocked** → Query Doc Agent or escalate to user
- **Plan inadequate** → Return to Stage 2

---

## Stage 4: Validation

**Goal:** Verify the feature works and doesn't break existing functionality.

### Build & Type Checks:
- [ ] Run `npm run build` (or equivalent)
- [ ] Fix any TypeScript errors
- [ ] Check console for warnings

### Test Plan Execution:
- [ ] Execute each item from plan's test checklist
- [ ] Test happy path
- [ ] Test error cases
- [ ] Test edge cases (empty states, permissions, etc.)

### Comprehensive Validation (if needed):
- [ ] Assess risk level:
  - **High risk:** Multi-feature, auth/billing/AI, workflow-impacting
  - **Low risk:** Single feature, no critical paths
- [ ] If high risk, spawn Test Agent:
  ```
  @test-agent: Validate [feature description]
  Changes: [files changed]
  Workflows: [affected workflows]
  ```

### Console & Errors:
- [ ] Check browser console for errors
- [ ] Check server logs for warnings
- [ ] Verify no degraded performance

### Decision Point:
- **All tests pass** → Proceed to Stage 5
- **Tests fail** → Fix issues, re-test
- **Regressions found** → Fix, update plan if needed

---

## Stage 5: Documentation

**Goal:** Update documentation to reflect the new feature.

### Feature Documentation:
- [ ] Run `/doc-update` for primary feature
- [ ] Update impacted feature docs
- [ ] Update FEATURE_INDEX.md if:
  - New feature added
  - New coupling introduced
  - Significant invariant change

### Workflow Documentation:
- [ ] If user workflows changed, update `docs/workflows/*.md`
- [ ] Verify workflow steps still accurate
- [ ] Add new workflows if feature enables new user journeys

### Multi-Feature Drift Check:
- [ ] If 2+ features touched, run `/drift-check`
- [ ] Address any doc/code mismatches found

### Decision Point:
- **Docs updated** → Proceed to Stage 6
- **Drift detected** → Fix docs, re-verify

---

## Stage 6: Handoff

**Goal:** Complete the feature with proper commit and handoff note.

### Git Commit (if requested):
- [ ] User requested commit? (Don't commit without request)
- [ ] If yes, create commit with:
  - Summary of feature
  - Why (not just what)
  - Generated with Claude Code footer

### Handoff Note:
- [ ] Run `/handoff` to create `.context/handoff.md`
- [ ] Include:
  - What was implemented
  - Files changed
  - Docs updated
  - How to verify
  - What remains (if incomplete)

### Final Summary:
- [ ] Write summary for user:
  - Feature description
  - Key changes
  - How to test
  - Files created/modified (absolute paths)
  - Next steps (if any)

---

## Pipeline Complete

The feature is now:
- ✅ Implemented
- ✅ Tested
- ✅ Documented
- ✅ Ready for review/deployment

---

## Meta-Cognitive Note

If this pipeline revealed friction, gaps, or improvement opportunities:
- Capture them in `.context/optimizations/pending.yaml`
- Continue with the task (don't ask permission to capture)
- Let Ops Agent review later
