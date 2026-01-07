# Spawn Test Agent

<!-- Version: 1.0.0 | Last Updated: 2026-01-07 -->

> **Cost**: ~4× token usage for single agent spawn. Use for comprehensive testing; for quick checks, use `/test` skill directly.

This command spawns the Test Agent for comprehensive validation work.

## When to Use

Spawn the Test Agent when:
- **Multi-feature changes**: Changes that touch 2+ features
- **Workflow-impacting changes**: Changes that affect documented user workflows
- **High-risk areas**: Changes to auth, billing, AI, or database schema
- **Pre-PR validation**: Before creating a pull request
- **User requests**: When explicitly asked for thorough testing
- **Complex bug fixes**: When verifying a bug fix won't cause regressions

## When NOT to Use

Don't spawn Test Agent for:
- Simple styling changes (use test skill directly)
- Single-file, low-risk changes
- Quick verification of a small fix
- Build-only checks

For simple tests, any agent can use the test skill (`.claude/commands/test.md`) directly.

## How to Spawn

Use the Task tool to spawn a Test Agent:

```
Spawn a Test Agent to validate the following changes:
[describe what changed, files modified, features affected]
```

## What to Provide

When spawning, include:
1. **What changed**: Files modified, nature of changes
2. **Features affected**: Which features were touched
3. **Workflows to verify**: Any specific workflows to test
4. **Risk level assessment**: Your initial risk assessment
5. **Specific concerns**: Any particular areas of concern

## Example Spawn

```
Spawn a Test Agent to validate:

Changes: Modified the course enrollment flow
Files:
- src/app/actions/enrollment.ts
- src/components/course/EnrollButton.tsx
- src/app/(app)/academy/[slug]/page.tsx

Features affected: academy, course-player-and-progress
Workflows to verify: Individual User > Course Enrollment
Risk level: Medium (logic change in enrollment action)
Specific concerns: Ensure free vs paid enrollment still works correctly
```

## What Test Agent Will Do

1. **Analyze** the change scope
2. **Consult** Doc Agent for feature/workflow impact
3. **Create** a test plan based on risk level
4. **Execute** static analysis (build, tests)
5. **Verify** via browser (using Chrome Extension)
6. **Test** affected workflows
7. **Report** results with evidence

## What Test Agent Returns

A comprehensive test report including:
- Static analysis results (build, tests, lint)
- Feature testing results
- Workflow testing results
- Console error summary
- Screenshots as evidence
- Issues found (if any)
- Recommendations

## Coordination

The Test Agent will:
- Query Doc Agent for workflow/feature context
- Use browser-use skill for UI verification
- Use test skill for test patterns
- Report back to Main Agent with results

## After Testing

Based on Test Agent report:
- **All PASS**: Proceed with PR/merge
- **Minor issues**: Fix and re-test (or spawn Test Agent again)
- **Major issues**: Address before proceeding
- **Workflow breaks**: Update workflow docs if behavior change is intentional

## Skills Used by Test Agent

- `.claude/commands/test.md` - Test framework and patterns
- `.claude/commands/browser-use.md` - Browser control via Chrome Extension
