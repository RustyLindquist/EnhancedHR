---
name: plan-lint
description: Validate a plan against documentation constraints before coding. Use after doc-discovery and before implementation. Returns PASS, WARN, or FAIL with specific issues.
allowed-tools: Read, Glob, Grep
---

# Plan Lint Skill

## Purpose
Ensure a plan is doc-consistent before any code is written. This is Gate 1 of the 2-gate flow. A plan that passes lint is safe to implement.

## When to Use
- After doc-discovery, before coding
- When reviewing someone else's plan
- Before spawning implementation agents
- When user asks "is this plan safe?"

## Required Plan Elements

A valid plan MUST include:

| Element | Description | Required |
|---------|-------------|----------|
| Primary Feature | The main feature being modified | ✓ |
| Impacted Features | Features affected by coupling | ✓ |
| User-Facing Changes | What users will see differently | ✓ |
| Files/Surfaces | Routes, components, actions to touch | ✓ |
| Data Impact | Tables, columns, RLS changes | If applicable |
| Invariants | Rules that must not be violated (min 3) | ✓ |
| Test Plan | How to verify the change works | ✓ |
| Docs to Update | Which docs need changes after | ✓ |

## Lint Checks

### Check 1: Feature Coverage
```
□ Primary feature named?
□ Primary feature exists in FEATURE_INDEX.md?
□ All coupled features from doc-discovery included?
□ No orphan features (mentioned but not in index)?
```

### Check 2: Invariant Coverage
```
□ At least 3 invariants listed?
□ Invariants match those in feature docs?
□ No invariants from coupled features missing?
□ High-risk invariants explicitly addressed?
```

### Check 3: Data Safety
```
□ All tables being modified listed?
□ RLS implications documented?
□ Migration strategy included (if schema changes)?
□ Rollback plan exists (if destructive)?
```

### Check 4: Test Coverage
```
□ Local verification steps included?
□ At least one workflow smoke test?
□ Edge cases from invariants covered?
□ Regression areas identified?
```

### Check 5: Workflow Impact
```
□ Affected workflows identified?
□ User journey steps that change noted?
□ No workflow broken by this change?
```

## Blast Radius Scoring

Calculate blast radius to determine review depth:

| Factor | Points |
|--------|--------|
| Touches auth/RLS | +3 |
| Touches billing/credits | +3 |
| Touches AI/prompts | +2 |
| Touches schema/migrations | +2 |
| Spans 3+ features | +2 |
| Modifies shared components | +1 |
| Changes user-facing workflow | +1 |

**Score Interpretation:**
- 0-2: Low blast radius → Standard review
- 3-5: Medium blast radius → Careful review, consider Doc Agent
- 6+: High blast radius → Full Doc Agent validation required

## Output Format

### PASS Response
```markdown
## Plan Lint: ✅ PASS

**Blast Radius**: [score] ([low/medium/high])

### Validation Summary
- [x] Primary feature: [name] ✓
- [x] Impacted features: [count] identified ✓
- [x] Invariants: [count] documented ✓
- [x] Test plan: Complete ✓
- [x] Workflow impact: Assessed ✓

### Notes
[Any observations or suggestions, even though plan passes]

### Ready to Implement
Yes - proceed to Gate 2 (execution)
```

### WARN Response
```markdown
## Plan Lint: ⚠️ WARN

**Blast Radius**: [score] ([low/medium/high])

### Issues Found
1. **[Issue Category]**: [Specific problem]
   - Impact: [What could go wrong]
   - Fix: [How to address]

2. **[Issue Category]**: [Specific problem]
   - Impact: [What could go wrong]
   - Fix: [How to address]

### Validation Summary
- [x] Primary feature: [name] ✓
- [ ] Impacted features: Missing [X, Y] ⚠️
- [x] Invariants: [count] documented ✓
- [ ] Test plan: Incomplete ⚠️
- [x] Workflow impact: Assessed ✓

### Recommendation
Address warnings before proceeding. Warnings indicate potential issues but are not blockers.

### Ready to Implement
Conditional - fix warnings first, or proceed with caution
```

### FAIL Response
```markdown
## Plan Lint: ❌ FAIL

**Blast Radius**: [score] ([low/medium/high])

### Blocking Issues
1. **[Critical Issue]**: [Specific problem]
   - Why it blocks: [Explanation]
   - Required fix: [What must change]

### Validation Summary
- [ ] Primary feature: Not identified ❌
- [ ] Invariants: None documented ❌
- [x] Test plan: Present ✓

### Required Actions
1. [Specific action to fix issue 1]
2. [Specific action to fix issue 2]

### Ready to Implement
No - must address blocking issues before proceeding
```

## Lint Process

```
Plan Received
      │
      ▼
┌─────────────────────────────────────┐
│ 1. PARSE PLAN ELEMENTS              │
│    Extract: features, invariants,   │
│    files, data impact, tests        │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ 2. VALIDATE AGAINST DOCS            │
│    Check: Does plan match feature   │
│    docs? Are invariants correct?    │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ 3. CALCULATE BLAST RADIUS           │
│    Score: Sum risk factors          │
│    Determine: Review depth needed   │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ 4. CHECK WORKFLOW IMPACT            │
│    Verify: No user journeys broken  │
│    Note: Steps that will change     │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ 5. GENERATE VERDICT                 │
│    PASS: All checks pass            │
│    WARN: Minor issues found         │
│    FAIL: Blocking issues found      │
└─────────────────────────────────────┘
```

## Common Failure Patterns

| Pattern | Verdict | Fix |
|---------|---------|-----|
| No invariants listed | FAIL | Run doc-discovery, extract invariants |
| Missing coupled features | WARN | Check FEATURE_INDEX coupling notes |
| No test plan | FAIL | Add verification steps |
| Schema change without migration plan | FAIL | Add migration + rollback strategy |
| High blast radius without Doc Agent | WARN | Spawn Doc Agent for validation |
| Workflow impact not assessed | WARN | Check WORKFLOW_INDEX |

## Examples

**Example: Good Plan**
```
Primary: course-player-and-progress
Impacted: dashboard, collections-and-context
Invariants:
- Progress persists across sessions
- Watch time triggers credits
- Progress scoped to user+course
Files: CoursePlayer.tsx, progressActions.ts
Test: Manual playback test, verify DB update
Docs: Update course-player-and-progress.md

Verdict: ✅ PASS (Blast Radius: 3 - Medium)
```

**Example: Failing Plan**
```
Primary: (not specified)
Files: "some components"
Test: "will check it works"

Verdict: ❌ FAIL
- No primary feature identified
- No invariants listed
- Vague file references
- No real test plan
```

## Integration with Doc Agent

If blast radius >= 6, automatically escalate:

```
@doc-agent: Please validate this plan against documented constraints:
[plan]

Specific checks needed:
- Invariant completeness
- Coupling analysis
- Security implications
```

The Doc Agent provides deeper validation for high-risk changes.
