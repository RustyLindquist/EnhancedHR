---
name: test-from-docs
description: Generate and execute test plans based on documentation. Use after implementation to verify changes work correctly. Integrates with browser testing for UI verification.
allowed-tools: Read, Bash, Glob, Grep
---

# Test From Docs Skill

## Purpose
Use documentation as the authoritative test blueprint. This ensures tests verify intended behavior (from docs) rather than just current behavior (which might be buggy).

## When to Use
- After implementing a feature or fix
- Before marking work as complete
- When user asks "does this work?"
- As part of pre-PR validation
- When Test Agent is spawned for comprehensive testing

## Testing Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    TEST PYRAMID                              │
│                                                              │
│                    ┌─────────┐                               │
│                    │ E2E/UI  │  ← Browser tests (selective)  │
│                   ─┴─────────┴─                              │
│                  ┌─────────────┐                             │
│                  │  Workflow   │  ← User journey validation  │
│                 ─┴─────────────┴─                            │
│                ┌─────────────────┐                           │
│                │   Integration   │  ← Cross-feature tests    │
│               ─┴─────────────────┴─                          │
│              ┌─────────────────────┐                         │
│              │   Feature/Unit     │  ← Feature doc checklist │
│             ─┴─────────────────────┴─                        │
│            ┌─────────────────────────┐                       │
│            │      Static Analysis    │  ← TypeScript, lint   │
│            └─────────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

## Risk-Based Test Selection

### Step 1: Calculate Risk Score

| Factor | Points | Check |
|--------|--------|-------|
| Touches auth/RLS | +3 | Any permission changes? |
| Touches billing | +3 | Any payment/credit logic? |
| Touches schema | +2 | Any migrations? |
| Touches AI/prompts | +2 | Any context assembly? |
| Multi-feature change | +2 | Spans 2+ feature docs? |
| User-facing workflow | +1 | Changes what user sees/does? |
| New code (not fix) | +1 | Adding vs modifying? |

### Step 2: Select Test Depth

| Risk Score | Test Depth | What to Run |
|------------|------------|-------------|
| 0-2 | Light | Static + primary feature checklist |
| 3-5 | Standard | Light + impacted features + 1 workflow |
| 6-8 | Thorough | Standard + browser verification + regression |
| 9+ | Comprehensive | Thorough + full workflow suite + edge cases |

## Test Plan Generation

### From Feature Docs

Each feature doc has a Testing Checklist section. Extract and run:

```markdown
## Testing Checklist (from [feature].md)

### Local Verification
- [ ] [Step from doc]
- [ ] [Step from doc]
- [ ] [Step from doc]

### Data Verification
- [ ] [DB check from doc]
- [ ] [State verification from doc]
```

### From Workflow Docs

Each workflow doc describes user journeys. Test the affected steps:

```markdown
## Workflow Test: [workflow-name]

### Steps to Verify
1. [ ] [Step 1] - [expected outcome]
2. [ ] [Step 2] - [expected outcome]
3. [ ] [Step 3] - [expected outcome]

### End State
- [ ] [Final expected state]
```

### From Invariants

Each invariant is a test case:

```markdown
## Invariant Tests

| Invariant | Test | Expected |
|-----------|------|----------|
| [Invariant 1] | [How to test] | [Should happen] |
| [Invariant 2] | [How to test] | [Should happen] |
```

## Test Execution

### Phase 1: Static Analysis

```bash
# TypeScript compilation
npx tsc --noEmit

# Linting
npm run lint

# Type checking specific files
npx tsc --noEmit app/actions/[changed-file].ts
```

### Phase 2: Feature Checklist

Run each item from the feature doc's Testing Checklist:

```markdown
### [Feature] Local Verification

- [ ] **Step**: [description]
  - **Command/Action**: [what to do]
  - **Expected**: [what should happen]
  - **Result**: ✅ Pass / ❌ Fail / ⚠️ Partial
  - **Notes**: [observations]
```

### Phase 3: Integration Tests

If change spans features, verify integration points:

```markdown
### Integration: [Feature A] → [Feature B]

- [ ] **Scenario**: [what crosses features]
  - **Action**: [trigger]
  - **Expected in A**: [outcome]
  - **Expected in B**: [outcome]
  - **Result**: ✅ / ❌ / ⚠️
```

### Phase 4: Browser Verification

**Use Chrome Extension for UI testing:**

```markdown
### Browser Tests

#### Visual Verification
- [ ] Navigate to [route]
- [ ] Verify [element] displays correctly
- [ ] Check console for errors
- [ ] Screenshot captured: [yes/no]

#### Interaction Test
- [ ] Click [button/link]
- [ ] Fill [form] with [data]
- [ ] Submit and verify [outcome]
- [ ] Check network tab for [expected request]

#### Responsive Check (if UI change)
- [ ] Desktop view: [status]
- [ ] Mobile view: [status]
```

**Chrome Extension Commands:**
```
# Navigate to URL
browser.navigate("http://localhost:3000/path")

# Check for element
browser.querySelector(".class-name")

# Get console logs
browser.getConsoleLogs()

# Take screenshot
browser.screenshot()
```

### Phase 5: Workflow Smoke Test

Run exactly ONE complete workflow that exercises the change:

```markdown
### Workflow Smoke: [Workflow Name]

**User Role**: [role being tested]
**Starting State**: [initial conditions]

| Step | Action | Expected | Actual | Status |
|------|--------|----------|--------|--------|
| 1 | [do X] | [see Y] | [actual] | ✅/❌ |
| 2 | [do X] | [see Y] | [actual] | ✅/❌ |
| 3 | [do X] | [see Y] | [actual] | ✅/❌ |

**End State Verified**: [yes/no]
**Workflow Passed**: [yes/no]
```

### Phase 6: Regression Checks

Based on coupling, verify related features still work:

```markdown
### Regression: [Coupled Feature]

- [ ] Basic functionality intact
- [ ] No console errors
- [ ] Data displays correctly
- [ ] Actions complete successfully
```

## Output Format

```markdown
## Test Report

**Feature**: [primary feature]
**Risk Score**: [score] ([light/standard/thorough/comprehensive])
**Date**: [timestamp]

### Summary
| Phase | Passed | Failed | Skipped |
|-------|--------|--------|---------|
| Static Analysis | [n] | [n] | [n] |
| Feature Checklist | [n] | [n] | [n] |
| Integration | [n] | [n] | [n] |
| Browser | [n] | [n] | [n] |
| Workflow Smoke | [n] | [n] | [n] |
| Regression | [n] | [n] | [n] |

### Overall: ✅ PASS / ❌ FAIL / ⚠️ PARTIAL

### Failures (if any)

#### [Test Name]
- **Phase**: [phase]
- **Expected**: [what should happen]
- **Actual**: [what happened]
- **Evidence**: [screenshot/log/error]
- **Severity**: [blocking/non-blocking]

### Warnings (if any)

#### [Test Name]
- **Issue**: [description]
- **Impact**: [assessment]
- **Recommendation**: [suggested action]

### Evidence Collected
- Screenshots: [list]
- Console logs: [attached/none]
- Network traces: [attached/none]

### Recommendations
1. [Based on findings]
2. [Based on findings]

### Ready for Merge
[Yes / No - blocking issues found]
```

## Quick Test (Light Mode)

For low-risk changes, run this abbreviated flow:

```bash
# 1. Static analysis
npx tsc --noEmit && npm run lint

# 2. Quick manual check
# - Does the change work as expected?
# - Any console errors?

# 3. Single verification
# - Run ONE item from feature checklist
```

## Test Templates by Change Type

### UI Component Change
```
1. Static: TypeScript, lint
2. Visual: Browser navigation, inspect element
3. Interaction: Click, hover, input
4. Responsive: Desktop + mobile
5. Console: No errors
```

### Server Action Change
```
1. Static: TypeScript, lint
2. Unit: Call action directly (if possible)
3. Integration: Trigger via UI
4. Data: Verify DB state
5. Errors: Test failure cases
```

### Schema Change
```
1. Migration: Apply cleanly
2. Data: Existing data intact
3. RLS: Policies work correctly
4. Actions: Affected actions still work
5. UI: Data displays correctly
```

### Workflow Change
```
1. Full workflow: Start to finish
2. Each step: Individual verification
3. Edge cases: Invalid inputs, cancellation
4. State: End state correct
5. Cross-role: If affects multiple roles
```

## Integration with Test Agent

For comprehensive testing, spawn Test Agent:

```
/spawn-test-agent

Context:
- Changes: [list of files changed]
- Risk score: [calculated score]
- Feature docs: [relevant docs]
- Workflows affected: [list]

Run thorough test suite and report findings.
```

## Anti-Patterns

❌ **Don't test only the happy path**
Test failure cases and edge conditions.

❌ **Don't skip browser verification for UI changes**
Visual bugs are real bugs.

❌ **Don't test current behavior, test intended behavior**
Use docs as source of truth for expected outcomes.

❌ **Don't mark tests as passed without evidence**
Screenshots, logs, or specific observations required.

❌ **Don't skip workflow smoke test**
Integration issues often only appear in real usage.
