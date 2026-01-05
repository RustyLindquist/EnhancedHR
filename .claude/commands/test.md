# Test Skill

This skill provides a framework for testing changes. Any agent can use this skill for basic testing; the Test Agent uses it for comprehensive validation.

## When to Use This Skill

**Use this skill after:**
- Completing a code change
- Before marking a task as done
- When asked to verify something works
- Before creating a PR or handoff

**Test scope depends on change type:**

| Change Type | Minimum Tests |
|------------|---------------|
| Styling only | Build + visual check |
| Single component | Build + type check + visual check |
| Single feature logic | Build + type check + unit tests + smoke test |
| Multi-feature change | Full test suite + workflow tests |
| Cross-cutting (auth/billing/AI) | Full test suite + comprehensive workflow tests |

## Basic Test Sequence

### 1. Build Verification
```bash
pnpm build
```
This catches:
- TypeScript errors
- Import issues
- Build-time failures

### 2. Type Checking (if build takes too long)
```bash
pnpm tsc --noEmit
```
Quick check for type errors without full build.

### 3. Unit Tests
```bash
pnpm test
```
Or for specific tests:
```bash
pnpm test -- --grep "pattern"
```

### 4. Lint Check
```bash
pnpm lint
```
Catches code style issues.

## Visual/Browser Testing

For UI changes, use the browser-use skill:

```
1. Navigate to localhost:3000/[affected-page]
2. Take a screenshot
3. Check console for errors
4. Verify the change is visible and correct
```

See `.claude/commands/browser-use.md` for full browser control documentation.

## Test Scoping Guide

### Styling-Only Changes
```
[ ] pnpm build passes
[ ] Visual check: navigate to affected page, take screenshot
[ ] Console: no new errors
```

### Single Component Changes
```
[ ] pnpm build passes
[ ] pnpm tsc --noEmit passes
[ ] Visual check: component renders correctly
[ ] Console: no new errors
[ ] Interaction: component behaves correctly (if interactive)
```

### Feature Logic Changes
```
[ ] pnpm build passes
[ ] pnpm test passes (or relevant subset)
[ ] Feature works: navigate to feature, perform main action
[ ] Console: no errors during use
[ ] Edge cases: test obvious edge cases
```

### Multi-Feature Changes
```
[ ] pnpm build passes
[ ] pnpm test passes
[ ] All affected features work
[ ] Integration points work correctly
[ ] Related workflows still function
[ ] Console: no errors across all affected areas
```

### High-Risk Changes (auth/billing/AI/schema)
```
[ ] pnpm build passes
[ ] pnpm test passes (full suite)
[ ] Primary workflow works end-to-end
[ ] Secondary workflows affected are tested
[ ] Permissions/access verified if auth-related
[ ] Data integrity verified if schema-related
[ ] Console: clean across all test scenarios
[ ] Consider: rollback plan documented
```

## Workflow Testing

When a change affects documented workflows, test them:

1. **Identify affected workflows**
   - Check `docs/workflows/WORKFLOW_INDEX.md`
   - Ask Doc Agent: "What workflows does this change affect?"

2. **Test each affected workflow**
   - Follow the documented steps
   - Verify each step still works
   - Note any deviations from documentation

3. **Report workflow status**
   ```
   Workflow: [name] from [role]-workflows.md
   Status: PASS / FAIL
   Steps tested: 1-6
   Issues: [none / describe issues]
   ```

## Test Report Format

After testing, report results:

```
## Test Report

### Build & Static Analysis
- Build: PASS/FAIL
- Types: PASS/FAIL
- Lint: PASS/FAIL
- Unit Tests: PASS/FAIL (X/Y passing)

### Functional Testing
- [Feature/Area 1]: PASS/FAIL
- [Feature/Area 2]: PASS/FAIL

### Workflow Testing (if applicable)
- [Workflow 1]: PASS/FAIL
- [Workflow 2]: PASS/FAIL

### Console Errors
- [None / List any errors found]

### Screenshots
- [Attached / describe what was captured]

### Issues Found
- [None / List issues with severity]

### Recommendation
- [Ready to merge / Needs fixes / Needs review]
```

## Quick Tests by Scenario

### "I just fixed a bug"
```bash
pnpm build && pnpm test
```
Then: verify the bug is fixed in browser, check console.

### "I added a new component"
```bash
pnpm build
```
Then: navigate to where component is used, take screenshot, check console.

### "I modified a server action"
```bash
pnpm build && pnpm test
```
Then: test the action via its UI trigger, check network/console.

### "I changed the database schema"
```bash
pnpm build && pnpm test
```
Then: verify affected features work, check for data integrity issues.
Consider: test with fresh data and existing data.

### "I touched auth/permissions"
```bash
pnpm build && pnpm test
```
Then: test as different user roles, verify access controls work.
Check: login, logout, protected routes, RLS enforcement.

### "I modified AI/prompts"
```bash
pnpm build
```
Then: test AI interactions, verify responses are appropriate.
Check: context is correct, no hallucinations, performance acceptable.

## Escalation to Test Agent

Spawn the Test Agent (`/spawn-test-agent`) when:
- Multiple features are affected
- High-risk areas are touched
- Comprehensive workflow testing is needed
- User requests thorough validation
- Before a major PR/release

The Test Agent uses this same skill but applies it comprehensively, testing all affected features and workflows systematically.

## What This Skill Does NOT Cover

- Writing new tests (that's implementation work)
- Fixing test failures (that's the implementing agent's job)
- Performance testing (specialized concern)
- Security auditing (specialized concern)
- Load testing (specialized concern)

This skill is for **verification** — confirming that implemented changes work correctly.
