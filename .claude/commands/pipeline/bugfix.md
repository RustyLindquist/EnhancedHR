---
description: Standardized workflow for fixing bugs safely without introducing regressions
---

# Bug Fix Pipeline

A standardized workflow for fixing bugs safely, ensuring the fix is correct and doesn't introduce regressions.

## When to Use This Pipeline

Use this pipeline when:
- Fixing a reported bug
- Addressing unexpected behavior
- Correcting logic errors
- Fixing state management issues

Skip this pipeline for:
- Simple typos in text/comments
- Obvious CSS fixes with no logic impact

---

## Stage 1: Understanding

**Goal:** Reproduce and understand the bug before attempting a fix.

### Reproduction:
- [ ] Get reproduction steps from bug report
- [ ] Attempt to reproduce locally
- [ ] Document what you observe vs what's expected
- [ ] Identify the surface where bug appears (UI, API, background job, etc.)

### Intended Behavior Discovery:
- [ ] Query Doc Agent for intended behavior:
  ```
  @doc-agent: What is the intended behavior for [feature/workflow]?
  ```
- [ ] Load relevant feature doc
- [ ] Check workflow docs if user-facing
- [ ] Identify the specific invariant being violated

### Initial Assessment:
- [ ] Is this a real bug or a documentation issue?
- [ ] Is this a regression or longstanding issue?
- [ ] What's the severity/impact?

### Decision Point:
- **Bug confirmed** → Proceed to Stage 2
- **Documentation issue** → Update docs instead of code
- **Cannot reproduce** → Request more info from user

---

## Stage 2: Analysis

**Goal:** Trace the bug to its root cause.

### Code Path Tracing:
- [ ] Identify entry point (component, action, route)
- [ ] Trace execution path through the code
- [ ] Find where actual behavior diverges from expected
- [ ] Identify the root cause (not just symptoms)

### Research Agent (for complex bugs):
- [ ] If bug involves 3+ files or unclear path, spawn Research Agent:
  ```
  Task: Trace the bug in [feature]

  Bug: [description]
  Expected: [correct behavior]
  Actual: [wrong behavior]
  Surface: [where it appears]

  Find the root cause.
  ```

### Impact Analysis:
- [ ] Is this bug isolated or systemic?
- [ ] Could other features have the same root cause?
- [ ] What else might this fix affect?

### Data Inspection:
- [ ] Check database state (if data-related bug)
- [ ] Use `createAdminClient()` for queries if needed
- [ ] Verify RLS policies aren't causing the issue
- [ ] Check for data inconsistencies

### Decision Point:
- **Root cause identified** → Proceed to Stage 3
- **Multiple causes found** → Prioritize, may need multiple fixes
- **Still unclear** → More investigation or escalate to user

---

## Stage 3: Planning

**Goal:** Plan a minimal, safe fix with regression prevention.

### Fix Design:
- [ ] Document what code will change
- [ ] Explain why this fixes the root cause
- [ ] Identify regression risks
- [ ] Plan for regression prevention (tests, assertions)

### Plan Template:

```
## Bug Fix Plan

**Bug:** [concise description]

**Root Cause:**
[What's actually broken in the code]

**Fix:**
[What will change and why]

**Files to Modify:**
- [file 1]
- [file 2]

**Regression Risks:**
- [risk 1]
- [risk 2]

**Regression Prevention:**
- [test/check 1]
- [test/check 2]

**Test Plan:**
1. Verify bug is fixed
2. Test related functionality
3. Check for side effects
```

### Validation:
- [ ] Run `/plan-lint` if fix touches multiple features
- [ ] Query Doc Agent if uncertain:
  ```
  @doc-agent: Does this fix violate any invariants?
  [paste plan]
  ```
- [ ] Get user approval if high-risk area (auth/billing/AI/schema)

### Decision Point:
- **Plan validated** → Proceed to Stage 4
- **Plan has issues** → Revise, re-validate
- **User rejects approach** → Alternative approach or escalate

---

## Stage 4: Implementation

**Goal:** Fix the bug with minimal, focused changes.

### Implementation Principles:
- [ ] Keep the fix minimal (change only what's needed)
- [ ] Preserve existing behavior (except the bug)
- [ ] Add defensive checks if appropriate
- [ ] Add comments explaining non-obvious fixes

### Code Changes:
- [ ] Implement the fix per the plan
- [ ] If frontend bug, consider spawning Frontend Agent:
  ```
  @frontend-agent: Fix [bug description] in [component]
  ```
- [ ] Add logging/assertions if bug was silent failure

### Regression Prevention:
- [ ] Add test case if appropriate (not always needed)
- [ ] Add TypeScript assertion if type safety helps
- [ ] Add validation if input-related bug

### Safety Checks:
- [ ] No schema changes without migration
- [ ] No RLS policy changes without role testing
- [ ] No auth changes without session verification
- [ ] No destructive database commands

### Decision Point:
- **Fix implemented** → Proceed to Stage 5
- **Fix too complex** → Reconsider approach, maybe Stage 3
- **Fix causes other issues** → Revise fix

---

## Stage 5: Validation

**Goal:** Verify the bug is fixed and nothing else broke.

### Bug Fix Verification:
- [ ] Reproduce original bug scenario
- [ ] Verify bug is now gone
- [ ] Test the happy path
- [ ] Test error cases if applicable

### Regression Testing:
- [ ] Test related functionality (same component/action)
- [ ] Test other features that use same code path
- [ ] Execute regression prevention tests from plan
- [ ] Check console for new errors/warnings

### Build & Type Checks:
- [ ] Run `npm run build` (or equivalent)
- [ ] Fix any new TypeScript errors
- [ ] Verify no new warnings

### Comprehensive Testing (if high-risk):
- [ ] Assess risk level:
  - **High risk:** Auth, billing, AI, multi-feature impact
  - **Low risk:** Isolated UI fix, single component
- [ ] If high risk, spawn Test Agent:
  ```
  @test-agent: Validate bug fix for [bug description]
  Fix: [what changed]
  Regression risks: [from plan]
  ```

### Decision Point:
- **Bug fixed, no regressions** → Proceed to Stage 6
- **Bug persists** → Return to Stage 2 (wrong root cause)
- **Regressions found** → Fix regressions, re-test

---

## Stage 6: Documentation

**Goal:** Update docs if the bug revealed misunderstandings or gaps.

### Documentation Assessment:
- [ ] Was the intended behavior documented correctly?
- [ ] Did the bug reveal a documentation gap?
- [ ] Should this fix be noted in feature docs?

### Documentation Updates:
- [ ] If behavior was misunderstood:
  - Update relevant feature doc
  - Clarify the invariant that was violated
  - Add example if helpful
- [ ] If significant bug in critical path:
  - Note the fix in feature doc's history/notes
  - Update test coverage section if added tests
- [ ] If docs were correct:
  - No doc changes needed (most bug fixes)

### Workflow Verification:
- [ ] If user-facing bug, verify workflow doc is accurate
- [ ] Update workflow doc if steps were unclear

### Run Checks:
- [ ] If multi-feature involved, run `/drift-check`
- [ ] Address any mismatches

---

## Stage 7: Handoff

**Goal:** Complete the fix with proper commit and handoff note.

### Git Commit (if requested):
- [ ] User requested commit? (Don't commit without request)
- [ ] If yes, create commit with:
  - "fix: [concise description]"
  - Why the bug occurred
  - What was changed
  - Generated with Claude Code footer

### Handoff Note:
- [ ] Run `/handoff` to create `.context/handoff.md`
- [ ] Include:
  - Bug description
  - Root cause
  - Fix applied
  - Files changed
  - Verification performed
  - Docs updated (if any)

### Final Summary:
- [ ] Write summary for user:
  - Bug description
  - What was broken
  - What was fixed
  - How to verify fix
  - Files modified (absolute paths)

---

## Pipeline Complete

The bug is now:
- ✅ Fixed
- ✅ Root cause addressed
- ✅ Regression tested
- ✅ Documented (if needed)
- ✅ Ready for review/deployment

---

## Special Cases

### Data Corruption Bugs:
If the bug caused data corruption:
1. Fix the code first (prevent more corruption)
2. Write data migration script to fix existing data
3. Test migration on copy of production data
4. Provide user with SQL to run on production
5. Never use `supabase db reset` or `TRUNCATE`

### Schema-Related Bugs:
If the bug is due to schema issues:
1. Create migration to fix schema
2. Ensure migration is idempotent
3. Test migration locally
4. Provide production-safe SQL script
5. Update RLS policies if needed

### Performance Bugs:
If the bug is performance-related:
1. Measure baseline (before fix)
2. Implement optimization
3. Measure improvement (after fix)
4. Verify correctness not sacrificed
5. Document performance impact

---

## Meta-Cognitive Note

If this pipeline revealed friction, gaps, or improvement opportunities:
- Capture them in `.context/optimizations/pending.yaml`
- Continue with the task (don't ask permission to capture)
- Let Ops Agent review later

Common optimization signals:
- Same bug pattern found multiple times → skill to detect it
- Documentation gap caused confusion → doc improvement
- Testing was difficult → better test infrastructure
- Similar bugs across features → shared defensive pattern needed
